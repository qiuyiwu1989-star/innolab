import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateAccess } from "@/lib/clients";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "innolab"))
    .digest("hex")
    .slice(0, 12);
}

/**
 * POST /api/access
 * Body: { passcode: string, name?: string }
 * 校验暗号 / VIP 令牌；有效则登记「注册」（谁、什么公司、何时）并返回 { ok, label }。
 * 前端拿到 ok 后把 passcode 存 localStorage，后续推演请求带上它。
 */
export async function POST(request: Request) {
  let body: { passcode?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体必须是 JSON" }, { status: 400 });
  }

  const passcode = (body.passcode ?? "").trim();
  const name = (body.name ?? "").trim().slice(0, 60);
  const ipHash = hashIp(getClientIp(request));

  const access = validateAccess(passcode);

  if (!access) {
    console.log(
      JSON.stringify({
        app: "innolab",
        ts: new Date().toISOString(),
        event: "access.denied",
        ip_hash: ipHash,
        name_provided: !!name,
      }),
    );
    return NextResponse.json(
      { ok: false, error: "暗号不正确。请确认后重试，或联系邱懿武获取访问。" },
      { status: 401 },
    );
  }

  // 注册登记（结构化日志，pm2 可聚合；不存明文暗号）
  console.log(
    JSON.stringify({
      app: "innolab",
      ts: new Date().toISOString(),
      event: "access.register",
      access_label: access.label,
      name: name || null,
      ip_hash: ipHash,
    }),
  );

  return NextResponse.json({ ok: true, label: access.label });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with {passcode}." },
    { status: 405 },
  );
}
