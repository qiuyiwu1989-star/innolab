import type { Metadata } from "next";
import Link from "next/link";
import { Beaker, ArrowRight } from "lucide-react";
import { demoScripts } from "@/lib/demo-scripts";
import { getAllMethods } from "@/lib/methods";
import { getCaseIndex } from "@/lib/cases";
import { DemoRunner } from "./demo-runner";
import { AccessGate } from "@/components/demo/access-gate";
import type { MethodMeta } from "@/components/demo/method-chain-viz";

export const metadata: Metadata = {
  title: "战略推演工作台 · 免费试用",
  description:
    "免费试一发深度战略推演——输入真实商业问题，InnoLab 用 86 个方法编排出问题重构 → 方法链 → 关键判断 → 推演结论。深度价值在邱懿武 1:1 咨询。",
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

  // Build a lightweight cases index for related-case recommendations in LiveRunner
  const casesIndex = getCaseIndex().map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    domain: c.domain,
    related_methods: c.related_methods,
  }));

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
            <span>免费试用 · 战略推演工作台</span>
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
            输入真实商业问题，InnoLab 用 <b className="font-semibold text-bone">86 个方法</b>
            编排出问题重构 → 方法链 → 关键判断 → 推演结论。
            <span className="text-dust"> 免费试，深度价值在 1:1 咨询。</span>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-dust">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-volt" />
              MiMo v2.5 Pro
            </span>
            <span>·</span>
            <span>86 方法 + 76 案例编入 system prompt</span>
            <span>·</span>
            <span>多轮会话 · 方法链可视化</span>
          </div>
        </header>

        {/* 主体：授权门禁 → 实时分析（LiveRunner） */}
        <div className="mt-12">
          <AccessGate methodsIndex={methodsIndex} casesIndex={casesIndex} />
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
              这些是手写的推演样本，展示 InnoLab 的输出结构。想直接试？上方工作台免费开一发真实推演。
            </p>
          </div>

          <DemoRunner scripts={demoScripts} idToSlug={idToSlug} />
        </section>

        {/* 底部小提示 */}
        <footer className="mt-20 rounded-xl border border-fog-2 bg-soot p-6 text-sm text-ash">
          <h3 className="text-base font-semibold text-bone">
            免费试用，深度价值在 1:1 咨询
          </h3>
          <p className="mt-3 leading-relaxed">
            InnoLab 的深度推演免费给你试——每次调用 MiMo v2.5 Pro，把 86 个方法 + 76 案例编入上下文，成本由邱懿武承担。
            想多用几次，留个联系方式即可；而真正值钱的判断——针对你处境的取舍、落地路径——
            邱懿武会亲自和你 1:1 深聊。这套工具是他战略咨询的交付增强，不是公开的免费 AI 问答。
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-volt hover:underline"
          >
            了解邱懿武 / 联系咨询
            <ArrowRight className="size-3" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
