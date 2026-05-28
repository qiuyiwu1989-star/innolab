import Link from "next/link";
import { Beaker, ArrowRight, Sparkles } from "lucide-react";

export const metadata = { title: "已加入候补" };

export default function ThanksPage() {
  return (
    <main className="relative isolate flex flex-1 items-center px-6 py-24">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div
        aria-hidden
        className="absolute -left-32 top-20 size-[400px] rounded-full border border-volt/20"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-volt/40 bg-volt/[0.05] px-3 py-1 text-[11px] font-medium text-volt">
          <Sparkles className="size-3" />
          <span>Confirmed</span>
        </div>
        <h1 className="display mt-6 text-4xl text-bone sm:text-6xl">
          收到了。
        </h1>
        <p className="mt-6 max-w-lg mx-auto text-lg text-ash">
          有大版本动态时第一时间通知你（私有记忆库、订阅、企业版上线等）。
        </p>

        {/* —— InnoLab 已经能用了，引导先试 —— */}
        <div className="mt-12 rounded-xl border border-volt bg-volt/[0.04] p-6 text-left sm:p-8">
          <div className="flex items-start gap-3">
            <Beaker className="mt-0.5 size-5 shrink-0 text-volt" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-bone">
                等通知期间，InnoLab 现在就能用
              </h2>
              <p className="mt-2 text-sm text-ash">
                /demo 是真 AI 分析（限免，每天 5 次）。把真实问题输进去，看
                InnoLab 怎么调用方法链 + 给出推演结论。
              </p>
              <Link
                href="/demo"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-volt px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
              >
                打开 /demo
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/cases"
            className="rounded-md border border-fog-3 px-4 py-2 text-bone hover:border-volt"
          >
            看 10 个真实案例
          </Link>
          <Link
            href="/methods"
            className="rounded-md border border-fog-3 px-4 py-2 text-bone hover:border-volt"
          >
            浏览 75 个方法
          </Link>
          <Link
            href="/"
            className="rounded-md border border-fog-3 px-4 py-2 text-bone hover:border-volt"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
