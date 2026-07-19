import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { analyzeStream } from "@/lib/innolab-engine";
import {
  getClientIp,
  unlimitedResult,
  checkAndConsume,
  ANON_PER_IP_DAILY,
  PER_IP_DAILY,
  type RateLimitResult,
} from "@/lib/rate-limit";
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
  /** 留资派生的用户标识 → 飞轮按人归属画像 */
  user_key?: string;
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

  // 2. 访问分档（公开化后）：
  //    VIP 令牌 / 暗号 → 不限次；已留资 → 每日 5 次；匿名 → 每日 1 次（免费尝一发）。
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const access = validateAccess(body.client_token);
  const registered = !!body.user_key?.trim();

  let limit: RateLimitResult;
  let accessLabel: string;
  if (access) {
    limit = unlimitedResult();
    accessLabel = access.label;
  } else {
    accessLabel = registered ? "已登记" : "匿名";
    limit = checkAndConsume(ip, registered ? PER_IP_DAILY : ANON_PER_IP_DAILY);
    if (!limit.allowed) {
      logEvent({
        event: "analyze.throttled",
        reason: limit.reason,
        registered,
        domain: body.domain ?? "unknown",
        ip_hash: ipHash,
        prompt_length: prompt.length,
      });
      const msg =
        limit.reason === "global_exhausted"
          ? "今天全站的免费体验量已经满了——明天再来，或直接约邱懿武 1:1 深聊。"
          : registered
            ? "你今天的免费额度用完了。想继续深挖，直接约邱懿武 1:1 最快。"
            : "你今天的免费体验用完了。留个联系方式（微信/邮箱）就能继续用，也欢迎直接约邱懿武 1:1 深聊。";
      return NextResponse.json(
        { error: msg, reason: "rate_limit", registered },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining-Global": String(limit.remaining.global),
            "X-RateLimit-Remaining-Ip": String(limit.remaining.ip),
            "X-RateLimit-Reset": String(Math.floor(limit.resetAt / 1000)),
          },
        },
      );
    }
  }

  // 3. 事件日志（不含 prompt 内容；记录授权标签 + 领域 + 来源）
  logEvent({
    event: "analyze.request",
    access_label: accessLabel,
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
        // 客户端断开后 enqueue 会抛错 —— 吞掉，避免打断 output 累积与落盘
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
          );
        } catch {
          /* stream closed by client */
        }
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
        // close() 在客户端已断开时会抛错 —— 先 guard，确保落盘一定执行
        try {
          controller.close();
        } catch {
          /* already closed by client */
        }
        // 对话落盘 —— 只要产出了内容就记录（即使用户中途关页面/断开，
        // 已累积的部分也会落盘，不丢飞轮燃料）。失败静默，不影响业务。
        await persistConversation();
      }
    },
    cancel() {
      // 客户端主动断开 —— analyzeStream 通过 signal 会停；
      // start() 的 finally 仍会执行落盘已累积内容，这里无需重复。
    },
  });

  // 落盘逻辑抽成闭包，保证「只落一次」+ 可被 finally 安全调用
  // accessLabel 在上面分档时已确定（VIP名/已登记/匿名）
  let persisted = false;
  async function persistConversation() {
    if (persisted) return;
    persisted = true;
    if (!outputAccumulator.trim()) return;
    await appendConversation({
      ts: new Date().toISOString(),
      access_label: accessLabel,
      domain: body.domain ?? "unknown",
      source: body.source ?? "free",
      is_follow_up: !!body.prior_summary,
      follow_up_kind: body.follow_up_kind ?? null,
      prompt,
      output: outputAccumulator,
      prompt_length: prompt.length,
      output_length: outputAccumulator.length,
      ip_hash: ipHash,
      // 标记是否为完整完成（用于看板区分「完整推演」vs「中断片段」）
      completed: outputAccumulator.includes("## 推演结论") || outputAccumulator.includes("## 追问方向"),
      // 留资用户标识 → 画像归属
      user_key: body.user_key,
    });
  }

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
