import Link from "next/link";
import type { Method } from "@/lib/methods";
import { engines } from "@/lib/engines";
import { Badge } from "@/components/ui/badge";

export function MethodCard({ method }: { method: Method }) {
  const engine = engines.find((e) => e.key === method.engine);
  const color = engine?.colorHex ?? "#666";

  return (
    <Link
      href={`/methods/${method.slug}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-mist bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg"
    >
      {/* 顶部彩条 */}
      <div
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-100 transition group-hover:scale-x-105"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center gap-2">
        <span
          className="font-mono text-xs font-semibold tracking-wider"
          style={{ color }}
        >
          {method.id}
        </span>
        <Badge color={color}>{engine?.cn}</Badge>
        {method.layer !== "—" && (
          <Badge variant="outline" className="border-ink/15 text-ink/60">
            {method.layer}
          </Badge>
        )}
      </div>

      <h3 className="text-base font-semibold leading-snug">
        {method.titleCn}
      </h3>
      {method.titleEn && (
        <p className="-mt-2 text-xs uppercase tracking-wider text-ink/40">
          {method.titleEn}
        </p>
      )}

      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink/70">
        {method.oneliner || "（暂无一句话定义）"}
      </p>

      <div className="flex items-center justify-between text-xs text-ink/40">
        <span>{method.origin || "—"}</span>
        <span className="text-ink/30 transition group-hover:text-ink">
          阅读 →
        </span>
      </div>
    </Link>
  );
}
