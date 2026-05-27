import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { engines, getEngine, type EngineKey } from "@/lib/engines";
import { getAllMethods, getMethodsByEngine } from "@/lib/methods";
import { MethodCard } from "@/components/site/method-card";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ key: string }>;
}

export async function generateStaticParams() {
  return engines.map((e) => ({ key: e.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const e = getEngine(key);
  if (!e) return { title: "未知引擎" };
  return {
    title: `${e.cn}引擎 — ${e.count} 个方法`,
    description: e.description,
  };
}

export default async function EngineLandingPage({ params }: Props) {
  const { key } = await params;
  const engine = getEngine(key);
  if (!engine) notFound();

  const all = getAllMethods();
  const methods = getMethodsByEngine(engine.key as EngineKey).sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const recommended = engine.recommended
    .map((id) => all.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  // 同生产链的"上一个 / 下一个"引擎
  const sortedEngines = [...engines].sort((a, b) => a.order - b.order);
  const idx = sortedEngines.findIndex((e) => e.key === engine.key);
  const prev = idx > 0 ? sortedEngines[idx - 1] : null;
  const next = idx < sortedEngines.length - 1 ? sortedEngines[idx + 1] : null;

  // 按层级分组
  const byLayer: Record<string, typeof methods> = {};
  for (const m of methods) {
    (byLayer[m.layer] ??= []).push(m);
  }
  const layerOrder = ["L5", "L4", "L3", "L2", "L1", "—"];

  return (
    <article className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      {/* 面包屑 */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-dust">
        <Link
          href="/methods"
          className="inline-flex items-center gap-1 hover:text-bone"
        >
          <ArrowLeft className="size-3.5" /> 方法库
        </Link>
        <span>/</span>
        <span className="text-bone">引擎</span>
        <span>/</span>
        <span className="numeral text-volt">{engine.code}</span>
      </nav>

      {/* Hero */}
      <header className="border-b border-fog-2 pb-12">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="numeral text-7xl text-bone sm:text-9xl">
            {String(engine.order).padStart(2, "0")}
          </span>
          <div className="flex flex-col">
            <span className="numeral text-xs uppercase tracking-widest text-volt">
              Engine · {engine.code}
            </span>
            <h1 className="display mt-1 text-5xl text-bone sm:text-7xl">
              {engine.cn}引擎
            </h1>
            <span className="mt-2 font-mono text-sm text-dust">
              {engine.en}
            </span>
          </div>
        </div>

        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ash sm:text-xl">
          {engine.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="solid">
            <span className="numeral">{engine.count}</span>
            <span className="ml-1">个方法</span>
          </Badge>
          <Badge variant="outline">生产链 {engine.order}/6</Badge>
          <Badge variant="ghost">{engine.role}</Badge>
        </div>
      </header>

      {/* 推荐起步 */}
      {recommended.length > 0 && (
        <section className="mt-16">
          <h2 className="flex items-baseline gap-3">
            <Sparkles className="size-5 text-volt" />
            <span className="numeral text-xs uppercase tracking-widest text-volt">
              Start Here
            </span>
            <span className="display text-2xl text-bone sm:text-3xl">
              如果只看 3 张，先看这 3 张
            </span>
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommended.map((m) => (
              <MethodCard key={m.slug} method={m} />
            ))}
          </div>
        </section>
      )}

      {/* 全部方法（按层级分组） */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between">
          <h2>
            <span className="numeral text-xs uppercase tracking-widest text-volt">
              All Methods
            </span>
            <div className="display mt-2 text-2xl text-bone sm:text-3xl">
              {engine.cn}引擎全部 {methods.length} 个方法
            </div>
          </h2>
        </div>

        <div className="mt-8 space-y-12">
          {layerOrder.map((layer) => {
            const list = byLayer[layer] ?? [];
            if (list.length === 0) return null;
            const layerName = {
              L1: "感知层",
              L2: "理解层",
              L3: "方法层",
              L4: "系统层",
              L5: "范式层",
              "—": "其他",
            }[layer];
            return (
              <div key={layer}>
                <div className="mb-4 flex items-baseline gap-2 border-b border-fog-1 pb-2">
                  <span className="numeral text-xl text-volt">{layer}</span>
                  <span className="text-sm text-ash">{layerName}</span>
                  <span className="numeral ml-auto text-xs text-dust">
                    {list.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((m) => (
                    <MethodCard key={m.slug} method={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 上一/下一引擎 */}
      <nav className="mt-20 grid grid-cols-1 gap-3 border-t border-fog-2 pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/methods/engine/${prev.key}`}
            className="group flex flex-col gap-1 rounded-lg border border-fog-2 bg-soot p-5 transition hover:border-volt"
          >
            <span className="flex items-center gap-1 text-xs text-dust">
              <ArrowLeft className="size-3" /> 生产链上一步
            </span>
            <span className="text-base font-semibold text-bone">
              {String(prev.order).padStart(2, "0")} · {prev.cn}引擎
            </span>
            <span className="text-xs text-ash">{prev.oneliner}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/methods/engine/${next.key}`}
            className="group flex flex-col items-end gap-1 rounded-lg border border-fog-2 bg-soot p-5 text-right transition hover:border-volt"
          >
            <span className="flex items-center gap-1 text-xs text-dust">
              生产链下一步 <ArrowRight className="size-3" />
            </span>
            <span className="text-base font-semibold text-bone">
              {String(next.order).padStart(2, "0")} · {next.cn}引擎
            </span>
            <span className="text-xs text-ash">{next.oneliner}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
