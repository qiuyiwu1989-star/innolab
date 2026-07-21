import { NextResponse } from "next/server";
import { saveSharedReport } from "@/lib/shared-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/share
 * Body: { prompt, output, domain? }
 * 把一份推演报告存成可公开分享的链接，返回 { id, url }。
 * 只有用户主动分享的报告才落盘公开。
 */
export async function POST(request: Request) {
  let body: { prompt?: string; output?: string; domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  const output = (body.output ?? "").trim();
  if (!prompt || !output || output.length < 50) {
    return NextResponse.json({ error: "报告内容不足，无法分享" }, { status: 400 });
  }
  const id = saveSharedReport({
    prompt: prompt.slice(0, 4000),
    output: output.slice(0, 40000),
    domain: body.domain,
  });
  return NextResponse.json({ id, url: `/r/${id}` });
}
