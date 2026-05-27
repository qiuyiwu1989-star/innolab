"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import type { CaseDetail } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CasesExplorer({
  cases,
  domains,
}: {
  cases: CaseDetail[];
  domains: string[];
}) {
  const [domain, setDomain] = useState<string | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (domain !== "all" && !(c.domain ?? []).includes(domain)) return false;
      if (needle) {
        const hay = [
          c.title,
          c.summary,
          ...(c.tags ?? []),
          ...(c.domain ?? []),
          ...(c.related_methods ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [cases, domain, q]);

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索案例标题、标签、关联方法 ID…  例如：教育、ST06、灵魂对话"
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
          <span className="text-xs font-medium text-ink/40">领域</span>
          <DomainChip
            active={domain === "all"}
            onClick={() => setDomain("all")}
            label="全部"
            count={cases.length}
          />
          {domains.map((d) => (
            <DomainChip
              key={d}
              active={domain === d}
              onClick={() => setDomain(d)}
              label={d}
              count={cases.filter((c) => (c.domain ?? []).includes(d)).length}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between border-b border-mist pb-3 text-sm">
        <span className="text-ink/60">
          <b className="text-ink">{filtered.length}</b> / {cases.length} 个案例
        </span>
        <span className="text-xs text-ink/40">按收录时间倒序</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-mist bg-white p-12 text-center">
          <p className="text-lg font-medium">没找到匹配的案例</p>
          <p className="mt-2 text-sm text-ink/60">试试清空筛选。</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </>
  );
}

function DomainChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-ink bg-ink text-paper"
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

function CaseCard({ c }: { c: CaseDetail }) {
  const hasDetail = c.file !== null;
  const body = (
    <div className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-mist bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg">
      {/* 装饰：右上角 gradient blur */}
      <div className="absolute -right-12 -top-12 size-32 rounded-full bg-flare/10 blur-2xl transition group-hover:bg-flare/20" />

      <div className="relative flex items-center justify-between">
        <span className="font-mono text-xs text-ink/40">{c.id}</span>
        <span className="text-xs text-ink/40">{c.added_date}</span>
      </div>

      <h3 className="relative text-lg font-semibold leading-snug">
        {c.title}
      </h3>

      <p className="relative line-clamp-2 text-sm leading-relaxed text-ink/70">
        {c.summary}
      </p>

      <div className="relative flex flex-wrap gap-1.5">
        {(c.domain ?? []).slice(0, 4).map((d) => (
          <Badge key={d} variant="outline" className="border-ink/15 text-ink/60">
            {d}
          </Badge>
        ))}
      </div>

      <div className="relative mt-auto flex items-center justify-between border-t border-mist pt-3">
        <span className="text-xs text-ink/50">
          关联方法：
          <span className="font-mono text-cobalt">
            {(c.related_methods ?? []).slice(0, 3).join("  ")}
          </span>
          {(c.related_methods ?? []).length > 3 && (
            <span className="text-ink/40">
              {" "}
              +{c.related_methods.length - 3}
            </span>
          )}
        </span>
        {hasDetail && (
          <ArrowUpRight className="size-4 text-ink/30 transition group-hover:text-ink" />
        )}
      </div>
    </div>
  );

  if (!hasDetail) {
    // 没详情文件的案例：渲染为不可点击卡（淡化）
    return <div className="opacity-75">{body}</div>;
  }
  return (
    <Link href={`/cases/${c.id}`} className="block h-full">
      {body}
    </Link>
  );
}
