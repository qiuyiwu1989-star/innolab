"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  Send,
  CornerDownLeft,
  Cpu,
} from "lucide-react";
import type { DemoScript, DemoStep } from "@/lib/demo-scripts";
import { cn } from "@/lib/utils";

type Phase = "idle" | "running" | "done";

interface Cursor {
  step: number; // 已 reveal 的步骤数
  body: number; // 当前步骤内已 reveal 的 body 行数
}

export function DemoRunner({
  scripts,
  idToSlug,
}: {
  scripts: DemoScript[];
  idToSlug: Record<string, string>;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [script, setScript] = useState<DemoScript | null>(null);
  const [cursor, setCursor] = useState<Cursor>({ step: 0, body: 0 });
  const [draftPrompt, setDraftPrompt] = useState("");
  const [unsupportedHint, setUnsupportedHint] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  function clearTick() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function start(s: DemoScript) {
    clearTick();
    setScript(s);
    setPhase("running");
    setCursor({ step: 0, body: 0 });
    setUnsupportedHint(false);
    // 滚动到输出区
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function reset() {
    clearTick();
    setPhase("idle");
    setScript(null);
    setCursor({ step: 0, body: 0 });
    setDraftPrompt("");
    setUnsupportedHint(false);
  }

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    const q = draftPrompt.trim();
    if (!q) return;
    // 严格匹配预设
    const found = scripts.find((s) => s.prompt === q);
    if (found) {
      start(found);
    } else {
      // 模糊匹配 / 否则给提示
      const fuzzy = scripts.find((s) =>
        q
          .split("")
          .some((ch) => s.prompt.includes(ch) && ch.length > 0),
      );
      if (fuzzy && q.length > 4) {
        start(fuzzy);
      } else {
        setUnsupportedHint(true);
      }
    }
  }

  // 主 reveal 循环
  useEffect(() => {
    if (phase !== "running" || !script) return;

    const current = script.steps[cursor.step];
    if (!current) {
      setPhase("done");
      return;
    }

    if (cursor.body < current.body.length) {
      const delay =
        cursor.step === 0 && cursor.body === 0
          ? 250
          : current.kind === "method"
            ? 380
            : 460;
      timeoutRef.current = setTimeout(() => {
        setCursor((c) => ({ step: c.step, body: c.body + 1 }));
      }, delay);
    } else {
      // 当前步骤完成，进入下一步
      const stepDelay = current.kind === "method" ? 520 : 680;
      timeoutRef.current = setTimeout(() => {
        setCursor((c) => ({ step: c.step + 1, body: 0 }));
      }, stepDelay);
    }

    return clearTick;
  }, [phase, script, cursor.step, cursor.body]);

  // 进度
  const progress =
    phase === "done"
      ? 100
      : script
        ? Math.min(
            100,
            Math.round((cursor.step / script.steps.length) * 100),
          )
        : 0;

  return (
    <div className="relative">
      {/* 输入区 — 只在 idle 时显示 */}
      {phase === "idle" && (
        <section>
          <form onSubmit={submitCustom} className="relative">
            <div className="rounded-xl border border-fog-2 bg-soot p-4 transition focus-within:border-volt">
              <textarea
                value={draftPrompt}
                onChange={(e) => {
                  setDraftPrompt(e.target.value);
                  setUnsupportedHint(false);
                }}
                placeholder="试试问 InnoLab：我该做 IP 产品吗？"
                rows={3}
                className="w-full resize-none bg-transparent text-base text-bone outline-none placeholder:text-dust"
              />
              <div className="mt-3 flex items-center justify-between border-t border-fog-1 pt-3">
                <span className="flex items-center gap-2 text-[11px] text-dust">
                  <Cpu className="size-3" />
                  v0.1 预演模式 · 只支持下方建议问题
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-volt px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110"
                >
                  <Send className="size-3" />
                  开始分析
                  <kbd className="numeral hidden rounded bg-ink/20 px-1 text-[10px] sm:inline">
                    ↵
                  </kbd>
                </button>
              </div>
            </div>
            {unsupportedHint && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-fog-2 bg-soot p-3 text-xs text-ash">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-volt" />
                <span>
                  这是预设示范。想用真实问题跑推演，去{" "}
                  <Link
                    href="/demo"
                    className="font-medium text-volt underline"
                  >
                    上方的 Live 推演
                  </Link>{" "}
                  输入你的问题。同时可以试下方预设问题看效果。
                </span>
              </div>
            )}
          </form>

          {/* 建议问题 */}
          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-dust">
              试试这些问题
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {scripts.map((s) => (
                <button
                  key={s.prompt}
                  type="button"
                  onClick={() => start(s)}
                  className="group flex items-start gap-3 rounded-lg border border-fog-2 bg-soot p-4 text-left transition hover:border-volt hover:bg-graphite"
                >
                  <CornerDownLeft className="mt-0.5 size-4 shrink-0 text-volt opacity-60 transition group-hover:opacity-100" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-bone">
                        {s.prompt}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-dust">{s.context}</div>
                  </div>
                  <span className="ml-auto shrink-0 rounded border border-fog-2 px-1.5 py-0.5 text-[10px] text-ash">
                    {s.chip}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 运行 / 完成 */}
      {script && phase !== "idle" && (
        <section ref={outputRef}>
          {/* 用户问题回显 */}
          <div className="rounded-xl border border-fog-2 bg-soot p-5">
            <div className="text-xs uppercase tracking-widest text-dust">
              你问的
            </div>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="text-lg font-semibold text-bone sm:text-xl">
                {script.prompt}
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-fog-2 px-2.5 py-1 text-[11px] text-ash transition hover:border-fog-3 hover:text-bone"
              >
                <RotateCcw className="size-3" />
                换问题
              </button>
            </div>
            {script.context && (
              <div className="mt-2 text-sm text-ash">背景：{script.context}</div>
            )}
          </div>

          {/* 进度条 */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-fog-2">
              <div
                className="h-full bg-volt transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="numeral text-xs text-dust">{progress}%</span>
            {phase === "running" && (
              <span className="flex size-2 items-center justify-center">
                <span className="absolute size-2 animate-ping rounded-full bg-volt opacity-75" />
                <span className="size-2 rounded-full bg-volt" />
              </span>
            )}
          </div>

          {/* Steps */}
          <div className="mt-8 space-y-4">
            {script.steps.slice(0, cursor.step + 1).map((step, sIdx) => {
              const isCurrent = sIdx === cursor.step && phase === "running";
              const bodiesShown =
                sIdx < cursor.step ? step.body.length : cursor.body;
              return (
                <StepCard
                  key={sIdx}
                  step={step}
                  bodiesShown={bodiesShown}
                  isCurrent={isCurrent}
                  index={sIdx + 1}
                  idToSlug={idToSlug}
                />
              );
            })}
          </div>

          {/* 完成后 — 引导去 Live 推演 */}
          {phase === "done" && (
            <div className="mt-12 rounded-xl border border-volt bg-volt/[0.04] p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="numeral text-xs uppercase tracking-widest text-volt">
                    Preview Mode
                  </div>
                  <h3 className="display mt-2 text-2xl text-bone sm:text-3xl">
                    这是手写示范。换你的真实问题跑一次。
                  </h3>
                  <p className="mt-3 text-sm text-ash">
                    上面这段是预设样本。把你的真实商业问题输进上方的 Live 推演，
                    InnoLab 会现场调用方法链给出推演结论。
                  </p>
                </div>
                <Link
                  href="/demo"
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-md bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 sm:self-center"
                >
                  去 Live 推演
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-fog-2 pt-6">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                >
                  <RotateCcw className="size-3" />
                  试另一个问题
                </button>
                <Link
                  href="/methods"
                  className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                >
                  浏览方法库
                </Link>
                <Link
                  href="/cases"
                  className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                >
                  看真实案例
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StepCard({
  step,
  bodiesShown,
  isCurrent,
  index,
  idToSlug,
}: {
  step: DemoStep;
  bodiesShown: number;
  isCurrent: boolean;
  index: number;
  idToSlug: Record<string, string>;
}) {
  const kindStyles: Record<DemoStep["kind"], string> = {
    reframe: "border-fog-3",
    method: "border-fog-2",
    judgment: "border-volt/60 bg-volt/[0.025]",
    verdict: "border-volt bg-volt/[0.05]",
    next: "border-fog-2 opacity-90",
  };
  const labelColor: Record<DemoStep["kind"], string> = {
    reframe: "text-ash",
    method: "text-volt",
    judgment: "text-volt",
    verdict: "text-volt",
    next: "text-dust",
  };

  return (
    <article
      className={cn(
        "rounded-lg border bg-soot p-5 sm:p-6",
        kindStyles[step.kind],
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="numeral text-[11px] text-dust">
            #{String(index).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "text-xs uppercase tracking-widest",
              labelColor[step.kind],
            )}
          >
            {step.label}
          </span>
        </div>
        {step.methodId && (() => {
          const slug = idToSlug[step.methodId];
          const inner = (
            <>
              {step.methodId}
              {step.methodTitle && (
                <>
                  <span className="hidden text-ash sm:inline">·</span>
                  <span className="hidden text-ash sm:inline">
                    {step.methodTitle}
                  </span>
                </>
              )}
            </>
          );
          if (!slug) {
            return (
              <span className="numeral inline-flex items-center gap-1 rounded border border-fog-2 px-2 py-0.5 text-[11px] text-dust">
                {inner}
              </span>
            );
          }
          return (
            <Link
              href={`/methods/${slug}`}
              className="numeral inline-flex items-center gap-1 rounded border border-fog-2 px-2 py-0.5 text-[11px] text-volt hover:border-volt"
            >
              {inner}
            </Link>
          );
        })()}
      </div>

      <div className="mt-3 space-y-2.5">
        {step.body.slice(0, bodiesShown).map((line, i) => (
          <p
            key={i}
            className={cn(
              "text-[15px] leading-relaxed text-bone",
              step.kind === "verdict" && "font-medium",
              step.kind === "judgment" && "text-bone",
              "animate-in fade-in slide-in-from-bottom-1 duration-400",
            )}
          >
            {line}
            {isCurrent &&
              i === bodiesShown - 1 &&
              bodiesShown < step.body.length && (
                <span className="ml-1 inline-block size-2 translate-y-0.5 animate-pulse rounded-sm bg-volt" />
              )}
          </p>
        ))}
        {isCurrent && bodiesShown === 0 && (
          <p className="flex items-center gap-2 text-sm text-dust">
            <span className="flex size-2 items-center justify-center">
              <span className="absolute size-2 animate-ping rounded-full bg-volt opacity-75" />
              <span className="size-2 rounded-full bg-volt" />
            </span>
            正在思考…
          </p>
        )}
      </div>
    </article>
  );
}
