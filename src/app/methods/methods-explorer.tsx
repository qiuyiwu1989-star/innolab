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
        const hay = [
          m.titleCn,
          m.titleEn,
          m.id,
          m.oneliner,
          m.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [methods, engine, layer, q]);

  const hasActiveFilter = engine !== "all" || layer !== "all" || q.length > 0;

  return (
    <>
      {/* ============ 搜索 + 引擎 chips ============ */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索方法名、ID、关键词…  例如：蓝海、护城河、CG01"
            className="w-full rounded-full border border-mist bg-white py-3 pl-11 pr-11 text-sm outline-none transition focus:border-cobalt"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink"
              aria-label="清空"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink/40">引擎</span>
          <FilterChip
            active={engine === "all"}
            onClick={() => setEngine("all")}
            label="全部"
            count={methods.length}
          />
          {engines.map((e) => (
            <FilterChip
              key={e.key}
              active={engine === e.key}
              onClick={() => setEngine(e.key)}
              label={
                <>
                  <span className="mr-1">{e.emoji}</span>
                  {e.cn}
                </>
              }
              color={e.colorHex}
              count={methods.filter((m) => m.engine === e.key).length}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink/40">层级</span>
          <FilterChip
            active={layer === "all"}
            onClick={() => setLayer("all")}
            label="全部"
          />
          {layers.map((l) => (
            <FilterChip
              key={l.id}
              active={layer === l.id}
              onClick={() => setLayer(l.id)}
              label={
                <span className="font-mono">
                  {l.id} <span className="ml-0.5 font-sans">· {l.name}</span>
                </span>
              }
              count={methods.filter((m) => m.layer === l.id).length}
            />
          ))}
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setEngine("all");
              setLayer("all");
              setQ("");
            }}
            className="text-xs text-cobalt hover:underline"
          >
            ✕ 清空所有筛选
          </button>
        )}
      </div>

      {/* ============ 结果数 ============ */}
      <div className="mt-8 flex items-baseline justify-between border-b border-mist pb-3 text-sm">
        <span className="text-ink/60">
          <b className="text-ink">{filtered.length}</b> / {methods.length} 个方法
        </span>
        <span className="text-xs text-ink/40">
          按 ID 排序
        </span>
      </div>

      {/* ============ 卡片墙 ============ */}
      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-mist bg-white p-12 text-center">
          <p className="text-lg font-medium">没找到匹配的方法</p>
          <p className="mt-2 text-sm text-ink/60">
            试试清空筛选，或者换个关键词。
          </p>
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

function FilterChip({
  active,
  onClick,
  label,
  color,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  color?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active && color ? { backgroundColor: color, color: "#fff" } : undefined
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? color
            ? "border-transparent"
            : "border-ink bg-ink text-paper"
          : "border-mist bg-white hover:border-ink/40",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] tabular-nums",
            active ? "bg-white/20" : "bg-mist text-ink/60",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
