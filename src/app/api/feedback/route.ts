import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { appendFeedback } from "@/lib/conversation-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/feedback
 * Body: { kind: "up" | "down", prompt: string, domain?: string, note?: string }
 *
 * 简单结构化打日志 — 不入库，pm2 logs / vercel logs 聚合即可。
 * 配合 /admin/stats 后续可以统计哪些 prompt 输出质量最差。
 */

interface Body {
  kind?: string;
  prompt?: string;
  domain?: string;
  note?: string;
}

function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "innolab"))
    .digest("hex")
    .slice(0, 12);
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const kind = body.kind === "up" || body.kind === "down" ? body.kind : null;
  if (!kind) {
    return NextResponse.json(
      { error: "kind 必须是 'up' 或 'down'" },
      { status: 400 },
    );
  }
  const prompt = (body.prompt ?? "").trim().slice(0, 500);
  if (!prompt) {
    return NextResponse.json({ error: "prompt 必填" }, { status: 400 });
  }
  const note = (body.note ?? "").trim().slice(0, 300);

  const ip = getClientIp(request);
  console.log(
    JSON.stringify({
      app: "innolab",
      ts: new Date().toISOString(),
      event: "feedback.given",
      kind,
      domain: body.domain ?? "unknown",
      // 不存 full prompt — 只存 hash 用于去重判断（避免日志暴露）
      prompt_hash: crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 16),
      prompt_preview: prompt.slice(0, 80),
      note,
      ip_hash: hashIp(ip),
    }),
  );

  // 落盘到飞轮 —— 质量层用它反推优化引擎
  appendFeedback({
    ts: new Date().toISOString(),
    kind,
    prompt,
    domain: body.domain,
    note: note || undefined,
    ip_hash: hashIp(ip),
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
