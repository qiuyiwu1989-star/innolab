import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Method } from "@/lib/methods";
import { engines } from "@/lib/engines";
import { Badge } from "@/components/ui/badge";

export function MethodCard({ method }: { method: Method }) {
  const engine = engines.find((e) => e.key === method.engine);
  return (
    <Link
      href={`/methods/${method.slug}`}
      className="group relative flex flex-col gap-3 rounded-lg border border-fog-2 bg-soot p-5 transition hover:-translate-y-0.5 hover:border-volt hover:bg-graphite"
    >
      <div className="flex items-center justify-between">
        <span className="numeral text-xs text-volt">{method.id}</span>
        <ArrowUpRight className="size-4 text-dust opacity-0 transition group-hover:opacity-100 group-hover:text-volt" />
      </div>

      <h3 className="text-base font-semibold leading-snug text-bone">
        {method.titleCn}
      </h3>
      {method.titleEn && (
        <p className="-mt-2 text-[11px] uppercase tracking-widest text-dust">
          {method.titleEn}
        </p>
      )}

      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ash">
        {method.oneliner || "（暂无一句话定义）"}
      </p>

      <div className="flex items-center gap-2 border-t border-fog-1 pt-3">
        <Badge variant="outline">{engine?.cn}</Badge>
        {method.layer !== "—" && (
          <Badge variant="ghost">
            <span className="numeral">{method.layer}</span>
          </Badge>
        )}
        {method.origin && (
          <span className="ml-auto text-[11px] text-dust">{method.origin}</span>
        )}
      </div>
    </Link>
  );
}
