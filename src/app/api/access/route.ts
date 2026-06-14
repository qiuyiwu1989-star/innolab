import { NextResponse } from "next/server";
import { validateAccess } from "@/lib/clients";
import {
  appendRegistration,
  deriveUserKey,
  contactType,
} from "@/lib/registration-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/access
 * Body: { passcode, name, contact }
 * 留资闸门：校验公开暗号 + 强制留称呼 + 手机/邮箱（二选一）。
 * 通过则登记注册、返回 { ok, label, userKey, name }，前端存 localStorage，
 * 后续每次推演带上 userKey → 飞轮可按人归属画像。
 */
export async function POST(request: Request) {
  let body: { passcode?: string; name?: string; contact?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "请求体必须是 JSON" },
      { status: 400 },
    );
  }

  const passcode = (body.passcode ?? "").trim();
  const access = validateAccess(passcode);
  if (!access) {
    return NextResponse.json({ ok: false, error: "暗号不正确" }, { status: 401 });
  }

  const name = (body.name ?? "").trim().slice(0, 40);
  const contact = (body.contact ?? "").trim().slice(0, 80);

  // 强制留资：称呼 + 联系方式（手机或邮箱二选一）
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "请填写你的称呼" },
      { status: 400 },
    );
  }
  const ctype = contactType(contact);
  if (!contact || ctype === "other") {
    return NextResponse.json(
      { ok: false, error: "请填写有效的手机号或邮箱" },
      { status: 400 },
    );
  }

  const userKey = deriveUserKey(contact);

  await appendRegistration({
    ts: new Date().toISOString(),
    user_key: userKey,
    name,
    company: (body as { company?: string }).company?.trim().slice(0, 60) ?? "",
    contact,
    contact_type: ctype,
  });

  return NextResponse.json({
    ok: true,
    label: access.label,
    userKey,
    name,
  });
}
