"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";

/**
 * 全局错误兜底 — 关键页面渲染异常时的优雅降级。
 * 不让用户看到原始堆栈或白屏。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记到 pm2 logs / vercel logs，方便事后排查
    console.error(
      JSON.stringify({
        app: "innolab",
        event: "client.error",
        ts: new Date().toISOString(),
        message: error.message,
        digest: error.digest,
      }),
    );
  }, [error]);

  return (
    <main className="relative isolate flex flex-1 items-center px-6 py-24">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-2xl">
        <div className="numeral inline-flex items-center gap-2 text-xs uppercase tracking-widest text-volt">
          <AlertTriangle className="size-3.5" />
          <span>Runtime Error</span>
        </div>
        <h1 className="display mt-4 text-4xl text-bone sm:text-6xl">
          这一页跑出问题了。
        </h1>
        <p className="mt-6 max-w-lg text-base text-ash sm:text-lg">
          不是你做错了什么。InnoLab 这一刻的运行出了岔子。
          点重试通常就能恢复 —— 或者回到稳定的入口。
        </p>
        {error.digest && (
          <p className="numeral mt-4 text-[11px] text-dust">
            error_id: {error.digest}
          </p>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-volt px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            <RotateCcw className="size-4" />
            重试这一页
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            <ArrowLeft className="size-4" />
            回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
