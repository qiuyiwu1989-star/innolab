import type { Metadata } from "next";
import Link from "next/link";
import { Beaker, ArrowRight } from "lucide-react";
import { demoScripts } from "@/lib/demo-scripts";
import { getAllMethods } from "@/lib/methods";
import { DemoRunner } from "./demo-runner";
import { LiveRunner } from "./live-runner";
import type { MethodMeta } from "@/components/demo/method-chain-viz";

export const metadata: Metadata = {
  title: "Demo · 试用 InnoLab 引擎",
  description:
    "把真实商业问题输入 InnoLab — 74 个方法框架编排出战略推演。v0.1 限免使用。",
};

export default function DemoPage() {
  // Build methods index on server — passed to client LiveRunner as plain data
  const allMethods = getAllMethods();
  const methodsIndex: Record<string, MethodMeta> = Object.fromEntries(
    allMethods.map((m) => [
      m.id,
      {
        id: m.id,
        titleCn: m.titleCn,
        titleEn: m.titleEn,
        engine: m.engine,
        layer: m.layer,
        oneliner: m.oneliner,
        slug: m.slug,
        engineDir: m.engineDir,
      } satisfies MethodMeta,
    ]),
  );
  const idToSlug = Object.fromEntries(allMethods.map((m) => [m.id, m.slug]));

  return (
    <main className="relative isolate flex-1">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div
        aria-hidden
        className="absolute -left-32 top-40 size-[500px] rounded-full border border-volt/20"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/40 bg-volt/[0.05] px-3 py-1.5 text-[11px] font-medium text-volt">
            <Beaker className="size-3.5" />
            <span>Live · v0.1 限免内测</span>
          </div>
          <h1
            className="display mt-6 text-bone"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            把问题输进去，
            <br />
            看 <span className="text-volt">引擎</span>
            <br />
            怎么推演。
          </h1>
          <p className="mt-6 max-w-xl text-base text-ash sm:text-lg">
            输入一个真实商业问题，InnoLab 用 <b className="font-semibold text-bone">74 个方法</b>
            编排出问题重构 → 方法链 → 关键判断 → 推演结论。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-dust">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-volt" />
              Claude Sonnet 4.6
            </span>
            <span>·</span>
            <span>SKILL.md + 74 方法 + 10 案例做 system prompt</span>
            <span>·</span>
            <span>prompt caching 加速 + 降本</span>
          </div>
        </header>

        {/* 主体：实时分析（LiveRunner） */}
        <div className="mt-12">
          <LiveRunner methodsIndex={methodsIndex} />
        </div>

        {/* —— 分隔 —— */}
        <div className="my-20 flex items-center gap-4">
          <span className="h-px flex-1 bg-fog-2" />
          <span className="numeral text-[11px] uppercase tracking-widest text-dust">
            或者 — 看预设示范
          </span>
          <span className="h-px flex-1 bg-fog-2" />
        </div>

        {/* 预设脚本演示（v0.3 之前的 demo），保留作为离线快速演示 */}
        <section>
          <div className="mb-6">
            <h2 className="display text-2xl text-bone sm:text-3xl">
              5 个手写示范
            </h2>
            <p className="mt-2 text-sm text-ash">
              这些是手写的推演样本（不消耗你的限免配额），用来快速展示输出结构。真正的分析在上面。
            </p>
          </div>

          <DemoRunner scripts={demoScripts} idToSlug={idToSlug} />
        </section>

        {/* 底部小提示 */}
        <footer className="mt-20 rounded-xl border border-fog-2 bg-soot p-6 text-sm text-ash">
          <h3 className="text-base font-semibold text-bone">
            为什么有配额？
          </h3>
          <p className="mt-3 leading-relaxed">
            v0.1 限免使用 Anthropic API，我（邱懿武）出钱。每次分析约 $0.05-0.15。
            限额是为了让更多人能试用，也防止单点滥用。v1.0 上线后会有自带 key、订阅、私有记忆库等选项。
          </p>
          <Link
            href="/#waitlist"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-volt hover:underline"
          >
            加入 v1.0 候补
            <ArrowRight className="size-3" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
