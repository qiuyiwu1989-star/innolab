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
 * Body: { passcode?, name, contact, company? }
 * 公开化后的留资登记：
 *   - 无暗号 → 公开留资（称呼+联系方式），登记为"已登记"用户 → 每日 5 次额度。
 *   - 有暗号且有效 → VIP/授权，返回其 label + unlimited:true → 不限次。
 *   - 有暗号但无效 → 401。
 * 登记后返回 { ok, label, userKey, name, unlimited }，前端存 localStorage，
 * 后续每次推演带上 userKey → 飞轮按人归属画像 + 决定额度档。
 */
export async function POST(request: Request) {
  let body: {
    passcode?: string;
    name?: string;
    contact?: string;
    company?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "请求体必须是 JSON" },
      { status: 400 },
    );
  }

  // 暗号可选：填了就校验（VIP/授权→不限次）；不填就是公开留资（已登记→每日额度）
  const passcode = (body.passcode ?? "").trim();
  let label = "已登记";
  let unlimited = false;
  if (passcode) {
    const access = validateAccess(passcode);
    if (!access) {
      return NextResponse.json(
        { ok: false, error: "暗号不正确" },
        { status: 401 },
      );
    }
    label = access.label;
    unlimited = true;
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
    company: body.company?.trim().slice(0, 60) ?? "",
    contact,
    contact_type: ctype,
  });

  return NextResponse.json({
    ok: true,
    label,
    userKey,
    name,
    unlimited,
  });
}
