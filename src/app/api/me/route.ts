import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readRegistrations } from "@/lib/registration-log";
import {
  readConversationsByUserKey,
  getMemoryForUser,
} from "@/lib/conversation-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * POST /api/me  Body: { access_token }
 * 校验 Supabase Auth 会话 → 取登录邮箱 → deriveUserKey → 返回该用户的
 * 资料 / 历史推演 / 个性化记忆。数据用服务端 service_role 取（不暴露给客户端、无需 RLS）。
 * 关键：deriveUserKey(email) 与留资时一致 → 用同一邮箱登录即自动认领历史。
 */
export async function POST(request: Request) {
  if (!SB_URL || !SB_ANON) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 Supabase Auth（NEXT_PUBLIC_SUPABASE_*）。" },
      { status: 503 },
    );
  }
  let body: { access_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const token = (body.access_token ?? "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 401 });
  }

  // 校验会话 token → 拿到已认证用户
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

  // 按账号本身（auth uid）归属，不用邮箱——不做邮箱验证，避免填别人邮箱串号
  const userKey = `auth:${uid}`;
  const [history, regs, memory] = await Promise.all([
    readConversationsByUserKey(userKey),
    readRegistrations(),
    getMemoryForUser(userKey),
  ]);
  const profile = regs.find((r) => r.user_key === userKey) ?? null;

  return NextResponse.json({
    ok: true,
    email,
    profile: profile
      ? { name: profile.name, company: profile.company, contact: profile.contact }
      : null,
    memory: { count: memory.count, focusLabels: memory.focusLabels },
    history: history.map((h) => ({
      ts: h.ts,
      domain: h.domain,
      prompt: h.prompt,
      output: h.output,
    })),
  });
}
