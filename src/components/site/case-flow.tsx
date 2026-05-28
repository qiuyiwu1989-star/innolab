import Link from "next/link";
import { ArrowDown, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import type { CaseAnalysisFlow } from "@/lib/cases";
import type { Method } from "@/lib/methods";
import { engines } from "@/lib/engines";

interface Props {
  flow: CaseAnalysisFlow;
  /** ID → 完整 method 对象（用于跳转到方法详情页） */
  methodsById: Record<string, Method | undefined>;
}

/**
 * 复原一次完整的 InnoLab 分析流程：
 *   问题重构 → 调用方法（带原因+揭示）→ 关键判断 → 推演结论 → 下一步
 * 静态渲染，无动画 — 看起来像 /demo 跑完的样子。
 */
export function CaseFlow({ flow, methodsById }: Props) {
  return (
    <div className="space-y-4">
      {/* —— 1 · 问题重构 —— */}
      <FlowStep index={1} label="问题重构" kind="reframe">
        <p className="text-[15px] leading-relaxed text-bone">{flow.reframe}</p>
      </FlowStep>

      <Arrow />

      {/* —— 2 · 调用方法链 —— */}
      {flow.method_chain.map((m, i) => {
        const method = methodsById[m.id];
        const engine = method
          ? engines.find((e) => e.key === method.engine)
          : null;
        return (
          <div key={`${m.id}-${i}`}>
            <FlowStep
              index={i + 2}
              label={`调用方法 · ${m.id}`}
              kind="method"
              right={
                method ? (
                  <Link
                    href={`/methods/${method.slug}`}
                    className="numeral inline-flex items-center gap-1 rounded border border-fog-2 px-2 py-0.5 text-[11px] text-volt hover:border-volt"
                  >
                    {m.id}
                    {engine && (
                      <>
                        <span className="hidden text-ash sm:inline">·</span>
                        <span className="hidden text-ash sm:inline">
                          {engine.cn}
                        </span>
                      </>
                    )}
                  </Link>
                ) : (
                  <span className="numeral inline-flex items-center gap-1 rounded border border-fog-2 px-2 py-0.5 text-[11px] text-dust">
                    {m.id}
                  </span>
                )
              }
            >
              <div className="space-y-3">
                <div>
                  <div className="numeral text-[10px] uppercase tracking-widest text-dust">
                    {m.title}
                  </div>
                  <p className="mt-1 text-[15px] leading-relaxed text-bone">
                    {m.reasoning}
                  </p>
                </div>
                <div className="rounded border-l-2 border-volt/40 bg-volt/[0.03] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-volt">
                    → 揭示
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ash">
                    {m.reveals}
                  </p>
                </div>
              </div>
            </FlowStep>
            <Arrow />
          </div>
        );
      })}

      {/* —— 3 · 关键判断 —— */}
      <FlowStep
        index={flow.method_chain.length + 2}
        label="关键判断"
        kind="judgment"
      >
        <p className="text-[15px] font-medium leading-relaxed text-bone">
          {flow.key_judgment}
        </p>
      </FlowStep>

      <Arrow />

      {/* —— 4 · 推演结论 —— */}
      <FlowStep
        index={flow.method_chain.length + 3}
        label="推演结论"
        kind="verdict"
      >
        <ul className="space-y-2.5">
          {flow.verdict.map((v, i) => (
            <li key={i} className="flex items-start gap-2.5">
              {v.kind === "do" ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-volt"
                  strokeWidth={2}
                />
              ) : (
                <XCircle
                  className="mt-0.5 size-4 shrink-0 text-dust"
                  strokeWidth={2}
                />
              )}
              <span
                className={
                  v.kind === "do"
                    ? "text-[15px] leading-relaxed text-bone"
                    : "text-[15px] leading-relaxed text-ash"
                }
              >
                {v.text}
              </span>
            </li>
          ))}
        </ul>
      </FlowStep>

      {/* —— 5 · 下一步（可选）—— */}
      {flow.next_step && (
        <>
          <Arrow />
          <FlowStep
            index={flow.method_chain.length + 4}
            label="建议下一步"
            kind="next"
          >
            <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ash">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-volt opacity-70" />
              <span>{flow.next_step}</span>
            </p>
          </FlowStep>
        </>
      )}
    </div>
  );
}

/* ───────── helpers ───────── */

const KIND_STYLES: Record<
  "reframe" | "method" | "judgment" | "verdict" | "next",
  string
> = {
  reframe: "border-fog-3",
  method: "border-fog-2",
  judgment: "border-volt/60 bg-volt/[0.025]",
  verdict: "border-volt bg-volt/[0.05]",
  next: "border-fog-2 opacity-90",
};

const LABEL_COLORS: Record<
  "reframe" | "method" | "judgment" | "verdict" | "next",
  string
> = {
  reframe: "text-ash",
  method: "text-volt",
  judgment: "text-volt",
  verdict: "text-volt",
  next: "text-dust",
};

function FlowStep({
  index,
  label,
  kind,
  right,
  children,
}: {
  index: number;
  label: string;
  kind: "reframe" | "method" | "judgment" | "verdict" | "next";
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-lg border bg-soot p-5 sm:p-6 ${KIND_STYLES[kind]}`}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="numeral text-[11px] text-dust">
            #{String(index).padStart(2, "0")}
          </span>
          <span
            className={`text-xs uppercase tracking-widest ${LABEL_COLORS[kind]}`}
          >
            {label}
          </span>
        </div>
        {right}
      </div>
      {children}
    </article>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <ArrowDown className="size-4 text-fog-3" />
    </div>
  );
}
