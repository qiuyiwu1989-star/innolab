import { NextResponse } from "next/server";
import { analyzeStream } from "@/lib/innolab-engine";
import { checkAndConsume, getClientIp } from "@/lib/rate-limit";

// Node runtime（需要 fs 读 SKILL.md）。Vercel 流式响应支持 Node。
export const runtime = "nodejs";
// 60s 以内的完整推演足够；hobby plan 60s 限制可承受
export const maxDuration = 60;
export const dynamic = "force-dynamic"; // 不缓存

interface AnalyzeBody {
  prompt?: string;
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

  // 2. 限流
  const ip = getClientIp(request);
  const limit = checkAndConsume(ip);

  if (!limit.allowed) {
    const message =
      limit.reason === "global_exhausted"
        ? "今日全站配额已用完。InnoLab v0.1 限免阶段每天 50 次分析。请明天再试，或加入候补 v1.0。"
        : "你今天已经用了 5 次。明天再试，或加入候补 v1.0。";
    return NextResponse.json(
      {
        error: message,
        reason: limit.reason,
        resetAt: limit.resetAt,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Reset": String(Math.floor(limit.resetAt / 1000)),
          "X-RateLimit-Remaining-Global": String(limit.remaining.global),
          "X-RateLimit-Remaining-Ip": String(limit.remaining.ip),
        },
      },
    );
  }

  // 3. 流式响应
  const encoder = new TextEncoder();
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
          signal: request.signal,
        })) {
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
