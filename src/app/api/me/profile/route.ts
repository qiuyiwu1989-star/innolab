import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { appendRegistration } from "@/lib/registration-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * POST /api/me/profile  Body: { access_token, name, company? }
 * 登录用户自助填 / 改「称呼 + 公司·行业」。
 * 校验会话 → user_key=auth:uid（与 /api/me 一致）→ upsert 到留资表。
 * 联系方式记为登录邮箱，contact_type=email。
 */
export async function POST(request: Request) {
  if (!SB_URL || !SB_ANON) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 Supabase Auth。" },
      { status: 503 },
    );
  }
  let body: { access_token?: string; name?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const token = (body.access_token ?? "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 401 });
  }

  const sb = createClient(SB_URL, SB_ANON);
  const { data, error } = await sb.auth.getUser(token);
  const uid = data?.user?.id;
  const email = data?.user?.email ?? "";
  if (error || !uid) {
    return NextResponse.json(
      { ok: false, error: "会话无效或已过期，请重新登录。" },
      { status: 401 },
    );
  }

  const name = (body.name ?? "").trim().slice(0, 40);
  const company = (body.company ?? "").trim().slice(0, 60);
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "称呼不能为空。" },
      { status: 400 },
    );
  }

  await appendRegistration({
    ts: new Date().toISOString(),
    user_key: `auth:${uid}`,
    name,
    company,
    contact: email,
    contact_type: "email",
  });

  return NextResponse.json({ ok: true, profile: { name, company } });
}
