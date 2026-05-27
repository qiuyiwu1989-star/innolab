"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Method } from "@/lib/methods";
import { engines, layers, type EngineKey } from "@/lib/engines";
import { MethodCard } from "@/components/site/method-card";
import { cn } from "@/lib/utils";

type LayerKey = (typeof layers)[number]["id"];

export function MethodsExplorer({ methods }: { methods: Method[] }) {
  const [engine, setEngine] = useState<EngineKey | "all">("all");
  const [layer, setLayer] = useState<LayerKey | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return methods.filter((m) => {
      if (engine !== "all" && m.engine !== engine) return false;
      if (layer !== "all" && m.layer !== layer) return false;
      if (needle) {
        const hay = [m.titleCn, m.titleEn, m.id, m.oneliner, m.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [methods, engine, layer, q]);

  const hasActive = engine !== "all" || layer !== "all" || q.length > 0;

  return (
    <>
      {/* —— 搜索 —— */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-dust" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索方法名 · ID · 关键词    例：蓝海、CG14、波特"
          className="w-full rounded-lg border border-fog-2 bg-soot py-3 pl-11 pr-11 text-sm outline-none transition focus:border-volt"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-dust hover:bg-graphite hover:text-bone"
            aria-label="清空"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* —— Filter rails —— */}
      <div className="mt-6 space-y-4">
        <FilterRow
          label="引擎"
          options={[
            { key: "all", label: "全部", count: methods.length },
            ...engines.map((e) => ({
              key: e.key as string,
              label: e.cn,
              code: e.code,
              count: methods.filter((m) => m.engine === e.key).length,
            })),
          ]}
          active={engine}
          onSelect={(k) => setEngine(k as EngineKey | "all")}
        />
        <FilterRow
          label="层级"
          options={[
            { key: "all", label: "全部" },
            ...layers.map((l) => ({
              key: l.id as string,
              label: l.name,
              code: l.id,
              count: methods.filter((m) => m.layer === l.id).length,
            })),
          ]}
          active={layer}
          onSelect={(k) => setLayer(k as LayerKey | "all")}
        />
        {hasActive && (
          <button
            type="button"
            onClick={() => {
              setEngine("all");
              setLayer("all");
              setQ("");
            }}
            className="text-xs text-volt hover:underline"
          >
            ✕ 清空所有筛选
          </button>
        )}
      </div>

      {/* —— 计数 —— */}
      <div className="mt-10 flex items-baseline justify-between border-b border-fog-2 pb-3 text-sm">
        <span className="text-ash">
          <b className="text-bone">{filtered.length}</b>
          <span className="text-dust"> / {methods.length}</span> 个方法
        </span>
        <span className="numeral text-xs text-dust">按 ID 排序</span>
      </div>

      {/* —— 卡片墙 —— */}
      {filtered.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-fog-2 bg-soot p-12 text-center">
          <p className="text-base font-medium text-bone">没找到匹配的方法</p>
          <p className="mt-2 text-sm text-ash">试试清空筛选，或换个关键词。</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MethodCard key={m.slug} method={m} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterRow({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string; code?: string; count?: number }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-dust">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onSelect(o.key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
            active === o.key
              ? "border-volt bg-volt text-ink font-medium"
              : "border-fog-2 text-ash hover:border-fog-3 hover:text-bone",
          )}
        >
          {o.code && (
            <span className="numeral text-[10px] opacity-70">{o.code}</span>
          )}
          <span>{o.label}</span>
          {typeof o.count === "number" && (
            <span
              className={cn(
                "numeral text-[10px]",
                active === o.key ? "text-ink/60" : "text-dust",
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
