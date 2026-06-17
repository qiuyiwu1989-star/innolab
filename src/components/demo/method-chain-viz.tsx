"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMethodViz } from "@/lib/method-viz";
import { MethodViz } from "@/components/site/method-viz";

// ── 类型（也被 page.tsx / live-runner.tsx 使用） ──────────────────────────

export interface MethodMeta {
  id: string;
  titleCn: string;
  titleEn: string;
  engine: string; // EngineKey
  layer: string;
  oneliner: string;
  slug: string;
  engineDir: string;
}

// ── 引擎视觉样式 ────────────────────────────────────────────────────────────

const ENGINE_STYLES: Record<
  string,
  { label: string; card: string; dot: string; id: string }
> = {
  cognition: {
    label: "认知",
    card: "border-amber-400/40 hover:border-amber-400/70",
    dot: "bg-amber-400",
    id: "text-amber-300",
  },
  strategy: {
    label: "战略",
    card: "border-sky-400/40 hover:border-sky-400/70",
    dot: "bg-sky-400",
    id: "text-sky-300",
  },
  generation: {
    label: "生成",
    card: "border-emerald-400/40 hover:border-emerald-400/70",
    dot: "bg-emerald-400",
    id: "text-emerald-300",
  },
  decision: {
    label: "决策",
    card: "border-rose-400/40 hover:border-rose-400/70",
    dot: "bg-rose-400",
    id: "text-rose-300",
  },
  product: {
    label: "产品",
    card: "border-violet-400/40 hover:border-violet-400/70",
    dot: "bg-violet-400",
    id: "text-violet-300",
  },
  evolution: {
    label: "进化",
    card: "border-cyan-400/40 hover:border-cyan-400/70",
    dot: "bg-cyan-400",
    id: "text-cyan-300",
  },
};

const FALLBACK = {
  label: "方法",
  card: "border-fog-2 hover:border-fog-3",
  dot: "bg-ash",
  id: "text-ash",
};

// ── 组件 ────────────────────────────────────────────────────────────────────

interface Props {
  methodIds: string[];
  methodsIndex: Record<string, MethodMeta>;
}

export function MethodChainViz({ methodIds, methodsIndex }: Props) {
  if (methodIds.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-fog-2 bg-soot p-4 sm:p-6">
      {/* 标题行 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="text-[11px] uppercase tracking-widest text-dust">
          方法调用链
        </div>
        <div className="h-px flex-1 bg-fog-2" />
        <div className="numeral text-[10px] text-dust">
          {methodIds.length} 个方法
        </div>
      </div>

      {/* 方法卡序列 — 横向滚动 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {methodIds.map((id, i) => {
          const m = methodsIndex[id];
          const style = m
            ? (ENGINE_STYLES[m.engine] ?? FALLBACK)
            : FALLBACK;

          return (
            <div key={id} className="flex shrink-0 items-center gap-2">
              {/* 方法卡 */}
              {m ? (
                <Link
                  href={`/methods/${m.slug}`}
                  className={cn(
                    "group flex flex-col gap-1.5 rounded-lg border bg-ink px-3 py-2.5 transition",
                    style.card,
                  )}
                  title={m.oneliner}
                >
                  {/* 引擎标签 */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        style.dot,
                      )}
                    />
                    <span className="text-[10px] text-dust">{style.label}</span>
                    <span className="ml-auto text-[10px] text-dust">
                      {m.layer}
                    </span>
                  </div>
                  {/* 方法 ID */}
                  <div
                    className={cn(
                      "numeral text-sm font-bold leading-none",
                      style.id,
                    )}
                  >
                    {id}
                  </div>
                  {/* 标题 */}
                  <div className="max-w-[90px] truncate text-[11px] leading-snug text-ash group-hover:text-bone">
                    {m.titleCn}
                  </div>
                </Link>
              ) : (
                /* 方法 ID 不在索引里 — 兜底 */
                <div
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border bg-ink px-3 py-2.5",
                    FALLBACK.card,
                  )}
                >
                  <div className="numeral text-sm font-bold text-ash">{id}</div>
                </div>
              )}

              {/* 箭头连接 */}
              {i < methodIds.length - 1 && (
                <ArrowRight className="size-3 shrink-0 text-fog-3" />
              )}
            </div>
          );
        })}

        {/* 末端：推演结论节点 */}
        <div className="flex shrink-0 items-center gap-2">
          <ArrowRight className="size-3 shrink-0 text-volt" />
          <div className="rounded-lg border border-volt/40 bg-volt/[0.06] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-widest text-volt">
              输出
            </div>
            <div className="mt-1 text-[11px] font-medium text-bone">
              推演结论
            </div>
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <div className="mt-3 text-[11px] text-dust">
        点击方法卡查看详细定义 · 想深挖某个方法？用下方「深入某方法」追问
      </div>

      {/* 方法结构图解 —— 本次用到的方法各自一图看懂 */}
      {(() => {
        const seen = new Set<string>();
        const vizCards = methodIds
          .map((id) => ({ id, m: methodsIndex[id] }))
          .filter(({ m }) => {
            if (!m || seen.has(m.slug) || !getMethodViz(m.slug)) return false;
            seen.add(m.slug);
            return true;
          })
          .slice(0, 6);
        if (vizCards.length === 0) return null;
        return (
          <div className="mt-5 border-t border-fog-2 pt-5">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-dust">
              方法图解
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vizCards.map(({ id, m }) => (
                <Link key={id} href={`/methods/${m.slug}`} className="block">
                  <MethodViz
                    spec={getMethodViz(m.slug)!}
                    caption={`${id} ${m.titleCn}`}
                  />
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
