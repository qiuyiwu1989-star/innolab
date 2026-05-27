import type { Metadata } from "next";
import { Beaker, Sparkles } from "lucide-react";
import { demoScripts } from "@/lib/demo-scripts";
import { getAllMethods } from "@/lib/methods";
import { DemoRunner } from "./demo-runner";

export const metadata: Metadata = {
  title: "Demo · 试用 v1.0 模拟分析",
  description:
    "InnoLab v1.0 是一个 AI 创新战略咨询师。在 v0.1 提前看一眼它怎么工作 — 选个问题，它会用真实方法链给出推演。",
};

export default function DemoPage() {
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
            <span>v1.0 Preview · 模拟分析</span>
          </div>
          <h1
            className="display mt-6 text-bone"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            看一眼
            <br />
            <span className="text-volt">AI 战略咨询师</span>
            <br />
            怎么工作。
          </h1>
          <p className="mt-6 max-w-xl text-base text-ash sm:text-lg">
            v0.1 还不能真分析任何问题。但下面这套预演是手写样本 — 你能看到它将来会怎么
            <b className="font-semibold text-bone">编排方法链</b>、
            <b className="font-semibold text-bone">给出判断</b>、
            <b className="font-semibold text-bone">推演结论</b>。
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-dust">
            <Sparkles className="size-3.5 text-volt" />
            <span>预设了 {demoScripts.length} 个真实问题做演示。</span>
          </div>
        </header>

        <div className="mt-12">
          <DemoRunner
            scripts={demoScripts}
            idToSlug={Object.fromEntries(
              getAllMethods().map((m) => [m.id, m.slug]),
            )}
          />
        </div>
      </div>
    </main>
  );
}
