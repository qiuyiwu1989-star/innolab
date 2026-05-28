import { NextResponse } from "next/server";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * 健康检查端点 — 用于：
 *   - nginx upstream health check
 *   - pm2 / 监控系统的存活探针
 *   - 部署后人工 smoke test
 * 返回服务状态 + 弹药库统计 + AI 后端可用性。
 */
export async function GET() {
  const startedAt = Date.now();

  let methodsCount = 0;
  let casesCount = 0;
  let dataOk = true;
  let dataError: string | undefined;
  try {
    methodsCount = getAllMethods().length;
    casesCount = getAllCases().length;
  } catch (err) {
    dataOk = false;
    dataError = err instanceof Error ? err.message : "data load failed";
  }

  const aiKey = process.env.MIMO_API_KEY;
  const aiConfigured = !!aiKey && aiKey !== "PASTE_YOUR_KEY_HERE";

  const okOverall = dataOk && aiConfigured;
  const status = okOverall ? "ok" : dataOk ? "degraded" : "down";

  return NextResponse.json(
    {
      status,
      ts: new Date().toISOString(),
      checks: {
        data: {
          ok: dataOk,
          methods: methodsCount,
          cases: casesCount,
          error: dataError,
        },
        ai: {
          ok: aiConfigured,
          model: process.env.MIMO_MODEL ?? "mimo-v2.5-pro",
          base_url: process.env.MIMO_BASE_URL
            ? new URL(process.env.MIMO_BASE_URL).host
            : "unset",
        },
        runtime: {
          node: process.version,
          uptime_s: Math.round(process.uptime()),
        },
      },
      latency_ms: Date.now() - startedAt,
    },
    {
      status: status === "down" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
