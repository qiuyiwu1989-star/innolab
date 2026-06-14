import { NextResponse } from "next/server";
import { markCandidateByTs } from "@/lib/conversation-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 与 /admin/conversations 页面保持完全一致的令牌解析，确保按钮一定能用
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "innolab-admin";

/**
 * POST /api/admin/candidate
 * Body: { token: string, ts: string }
 * 把某条对话（按 ts 唯一定位）标记为「候选案例」→ 飞轮第②圈。
 */
export async function POST(request: Request) {
  let body: { token?: string; ts?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (body.token !== ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const ts = (body.ts ?? "").trim();
  if (!ts) {
    return NextResponse.json({ ok: false, error: "missing ts" }, { status: 400 });
  }
  const ok = await markCandidateByTs(ts);
  return NextResponse.json({ ok, marked: ok });
}
