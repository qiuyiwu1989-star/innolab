import { NextResponse } from "next/server";
import { getMemoryForUser } from "@/lib/conversation-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/memory  Body: { userKey }
 * 返回该用户的「记忆」：欢迎横幅文案 + 注入推演的上下文摘要。
 * 个性化记忆（飞轮第①圈）—— 让产品记得回头用户。
 */
export async function POST(request: Request) {
  let body: { userKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hasMemory: false }, { status: 400 });
  }
  const userKey = (body.userKey ?? "").trim();
  if (!userKey) return NextResponse.json({ hasMemory: false });

  const mem = getMemoryForUser(userKey);
  // contextSummary 只在服务端注入用，但前端也需要它来回传给 /api/analyze
  return NextResponse.json(mem);
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with {userKey}." },
    { status: 405 },
  );
}
