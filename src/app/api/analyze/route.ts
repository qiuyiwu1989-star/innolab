import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { analyzeStream } from "@/lib/innolab-engine";
import { getClientIp, unlimitedResult } from "@/lib/rate-limit";
import { validateAccess } from "@/lib/clients";
import { appendConversation } from "@/lib/conversation-log";

/**
 * 结构化日志事件 — 不含 prompt 内容（隐私）。
 * 在 pm2 / vercel function logs 里可以按时间/领域聚合，
 * 6 周后用来判断真实流量分布在哪个领域。
 *
 * 将来要接 PostHog / Plausible 时，把 console.log 换成 posthog.capture() 即可，
 * 字段名保持不变。
 */
function logEvent(event: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      app: "innolab",
      ts: new Date().toISOString(),
      ...event,
    }),
  );
}

function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "innolab"))
    .digest("hex")
    .slice(0, 12);
}

// Node runtime（需要 fs 读 SKILL.md）。Vercel 流式响应支持 Node。
export const runtime = "nodejs";
// 60s 以内的完整推演足够；hobby plan 60s 限制可承受
export const maxDuration = 60;
export const dynamic = "force-dynamic"; // 不缓存

interface AnalyzeBody {
  prompt?: string;
  /** 用户选了哪个领域过滤（all / ai-transform / product / ip-content / org / strategy） */
  domain?: string;
  /** 用户是从领域预设点过来的还是自由输入（"free" 或某 domain key） */
  source?: string;
  /** 续 thread 时：之前的对话精要（让 agent 有记忆） */
  prior_summary?: string;
  /** 续 thread 类型：deeper / angle / method —— 用于事件统计 */
  follow_up_kind?: string;
  /** 咨询客户专属令牌：有效则豁免限流（InnoLab 作为咨询交付增强工具） */
  client_token?: string;
}

/**
 * POST /api/analyze
 * Body: { prompt: string }
 * 响应：text/event-stream，event 是 JSON 字符串：
 *   { type: "delta", text: "..." }
 *   { type: "usage", input, output, cacheRead, cacheWrite }
 *   { type: "error", message: "..." }
 *   { type: "done" }
 * 同时携带 X-RateLimit-* 头
 */
export async function POST(request: Request) {
  // 1. 解析
  let body: AnalyzeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "请求体必须是 JSON" },
      { status: 400 },
    );
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }
  if (prompt.length > 2000) {
    return NextResponse.json(
      { error: "prompt 长度上限 2000 字" },
      { status: 400 },
    );
  }

  // 2. 访问授权 —— InnoLab 推演为授权专属（VIP 客户令牌 / 通用暗号）
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const access = validateAccess(body.client_token);

  if (!access) {
    logEvent({
      event: "analyze.denied",
      reason: "no_access",
      domain: body.domain ?? "unknown",
      ip_hash: ipHash,
      prompt_length: prompt.length,
    });
    return NextResponse.json(
      {
        error:
          "InnoLab 推演工作台是邱懿武战略咨询的专属工具，需要授权暗号。请在工作台输入暗号，或联系邱懿武获取访问。",
        reason: "no_access",
      },
      { status: 403 },
    );
  }

  // 授权用户：推演不限次
  const limit = unlimitedResult();

  // 3. 事件日志（不含 prompt 内容；记录授权标签 + 领域 + 来源）
  logEvent({
    event: "analyze.request",
    access_label: access.label,
    domain: body.domain ?? "unknown",
    source: body.source ?? "free",
    follow_up_kind: body.follow_up_kind ?? null,
    has_prior: !!body.prior_summary,
    prompt_length: prompt.length,
    prior_length: body.prior_summary?.length ?? 0,
    ip_hash: ipHash,
  });

  // 3. 流式响应（同时在服务端累积完整 output → 推演完成后落盘，作为飞轮燃料）
  const encoder = new TextEncoder();
  let outputAccumulator = "";
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
        );
      };

      try {
        for await (const event of analyzeStream({
          prompt,
          domain: body.domain,
          priorSummary: body.prior_summary,
          signal: request.signal,
        })) {
          if (
            event &&
            typeof event === "object" &&
            "type" in event &&
            event.type === "delta" &&
            "text" in event &&
            typeof event.text === "string"
          ) {
            outputAccumulator += event.text;
          }
          send(event);
        }
        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "stream failed",
        });
      } finally {
        controller.close();
        // 对话落盘 —— 只在真正产出了内容时记录（失败静默，不影响用户）
        if (outputAccumulator.trim()) {
          appendConversation({
            ts: new Date().toISOString(),
            access_label: access.label,
            domain: body.domain ?? "unknown",
            source: body.source ?? "free",
            is_follow_up: !!body.prior_summary,
            follow_up_kind: body.follow_up_kind ?? null,
            prompt,
            output: outputAccumulator,
            prompt_length: prompt.length,
            output_length: outputAccumulator.length,
            ip_hash: ipHash,
          });
        }
      }
    },
    cancel() {
      // 客户端断开 — analyzeStream 通过 signal 已经会停
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // 关掉 nginx/proxy 缓冲
      "X-RateLimit-Remaining-Global": String(limit.remaining.global),
      "X-RateLimit-Remaining-Ip": String(limit.remaining.ip),
      "X-RateLimit-Reset": String(Math.floor(limit.resetAt / 1000)),
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with {prompt}." },
    { status: 405 },
  );
}
