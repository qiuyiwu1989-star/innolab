import { NextResponse } from "next/server";

/**
 * 候补邮箱收集端点。
 * v0.1 实现：写入日志（Vercel 上能看到）+ 重定向到 /thanks。
 * 上生产前接 Resend Audiences / Formspree / Vercel KV 之类做持久化。
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await request.json();
      email = String(body?.email ?? "").trim();
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "").trim();
    }
  } catch {
    /* swallow */
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "邮箱格式不正确" },
      { status: 400 },
    );
  }

  // TODO: 替换为持久化（Resend / Vercel KV / Postgres）
  console.log(
    JSON.stringify({
      event: "waitlist.signup",
      email,
      ts: new Date().toISOString(),
      ua: request.headers.get("user-agent") ?? "",
    }),
  );

  // 表单提交后重定向到致谢页
  const url = new URL("/thanks", request.url);
  return NextResponse.redirect(url, 303);
}
