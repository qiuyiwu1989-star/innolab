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
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-dust" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索案例标题 · 标签 · 方法 ID    例：教育、ST06、灵魂对话"
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

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-dust">领域</span>
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

      <div className="mt-10 flex items-baseline justify-between border-b border-fog-2 pb-3 text-sm">
        <span className="text-ash">
          <b className="text-bone">{filtered.length}</b>
          <span className="text-dust"> / {cases.length}</span> 个案例
        </span>
        <span className="numeral text-xs text-dust">按收录时间倒序</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-fog-2 bg-soot p-12 text-center">
          <p className="text-base font-medium text-bone">没找到匹配的案例</p>
          <p className="mt-2 text-sm text-ash">试试清空筛选。</p>
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
        active
          ? "border-volt bg-volt text-ink font-medium"
          : "border-fog-2 text-ash hover:border-fog-3 hover:text-bone",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "numeral text-[10px]",
            active ? "text-ink/60" : "text-dust",
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
    <div className="group relative flex h-full flex-col gap-3 rounded-lg border border-fog-2 bg-soot p-6 transition hover:-translate-y-0.5 hover:border-volt hover:bg-graphite">
      <div className="flex items-center justify-between">
        <span className="numeral text-xs text-volt">{c.id}</span>
        <span className="numeral text-xs text-dust">{c.added_date}</span>
      </div>
      <h3 className="text-lg font-semibold leading-snug text-bone">
        {c.title}
      </h3>
      <p className="line-clamp-2 text-sm leading-relaxed text-ash">
        {c.summary}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(c.domain ?? []).slice(0, 4).map((d) => (
          <Badge key={d} variant="outline">
            {d}
          </Badge>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-fog-1 pt-3">
        <span className="text-xs text-dust">
          关联方法{" "}
          <span className="numeral text-volt">
            {(c.related_methods ?? []).slice(0, 3).join(" · ")}
          </span>
          {(c.related_methods ?? []).length > 3 && (
            <span className="text-dust">
              {" "}
              +{c.related_methods.length - 3}
            </span>
          )}
        </span>
        {hasDetail && (
          <ArrowUpRight className="size-4 text-dust opacity-0 transition group-hover:opacity-100 group-hover:text-volt" />
        )}
      </div>
    </div>
  );

  if (!hasDetail) return <div className="opacity-50">{body}</div>;
  return (
    <Link href={`/cases/${c.id}`} className="block h-full">
      {body}
    </Link>
  );
}
