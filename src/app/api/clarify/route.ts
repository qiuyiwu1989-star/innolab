import { NextResponse } from "next/server";
import { clarifyIntent } from "@/lib/innolab-engine";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * POST /api/clarify
 * Body: { prompt: string }
 * 推演前的快问快答：返回 { questions: [{ q, options[] }] }（0-3 个）。
 * 快、便宜；失败/无需澄清时返回空数组，前端据此直接进深度推演。
 */
export async function POST(request: Request) {
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ questions: [] }, { status: 200 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt || prompt.length < 4) {
    return NextResponse.json({ questions: [] });
  }
  try {
    const questions = await clarifyIntent(prompt, request.signal);
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
