import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import {
  getAllMethods,
  getMethodBySlug,
  type Method,
} from "@/lib/methods";
import { engines } from "@/lib/engines";
import { getCasesByMethodId } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { Markdown, cleanMarkdownBody } from "@/components/site/markdown";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const methods = getAllMethods();
  // 去重以避免 slug 碰撞导致构建报错
  const seen = new Set<string>();
  return methods
    .filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    })
    .map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const method = getMethodBySlug(slug);
  if (!method) return { title: "未找到" };
  return {
    title: `${method.titleCn}（${method.id}）`,
    description: method.oneliner || `${method.titleCn} — InnoLab 方法卡`,
  };
}

export default async function MethodDetailPage({ params }: Props) {
  const { slug } = await params;
  const method = getMethodBySlug(slug);
  if (!method) notFound();

  const engine = engines.find((e) => e.key === method.engine);
  const color = engine?.colorHex ?? "#000";

  // 相关方法：同引擎，按 ID 相邻
  const all = getAllMethods();
  const sameEngine = all.filter(
    (m) => m.engine === method.engine && m.slug !== method.slug,
  );
  const idx = sameEngine.findIndex((m) => m.id > method.id);
  const related = (
    idx === -1 ? sameEngine.slice(-3) : sameEngine.slice(Math.max(0, idx - 1), idx + 2)
  ).slice(0, 4);

  // 上一/下一方法（全库）
  const fullIdx = all.findIndex((m) => m.slug === method.slug);
  const prev = fullIdx > 0 ? all[fullIdx - 1] : null;
  const next = fullIdx < all.length - 1 ? all[fullIdx + 1] : null;

  const body = cleanMarkdownBody(method.raw);
  const usedInCases = getCasesByMethodId(method.id);

  return (
    <article className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      {/* 面包屑 */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-ink/50">
        <Link href="/methods" className="hover:text-ink">
          ← 方法库
        </Link>
        <span>/</span>
        <Link
          href={`/methods?engine=${method.engine}`}
          className="hover:text-ink"
          style={{ color }}
        >
          {engine?.cn}
        </Link>
        <span>/</span>
        <span className="font-mono">{method.id}</span>
      </nav>

      {/* Hero */}
      <header className="border-b border-mist pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono text-xs font-semibold tracking-wider"
            style={{ color }}
          >
            {method.id}
          </span>
          <Badge color={color}>
            {engine?.emoji} {engine?.cn}
          </Badge>
          {method.layer !== "—" && (
            <Badge variant="outline" className="border-ink/20 text-ink/70">
              {method.layer}
            </Badge>
          )}
          {method.origin && (
            <Badge variant="outline" className="border-ink/15 text-ink/50">
              {method.origin}
            </Badge>
          )}
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          {method.titleCn}
        </h1>
        {method.titleEn && (
          <p className="mt-2 font-mono text-sm uppercase tracking-wider text-ink/40">
            {method.titleEn}
          </p>
        )}
        {method.oneliner && (
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink/75">
            {method.oneliner}
          </p>
        )}
      </header>

      {/* 主体：左侧正文 + 右侧侧栏 */}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0">
          <Markdown source={body} />
        </main>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-mist bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink/40">
              Meta
            </div>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Meta label="ID" value={method.id} mono />
              <Meta label="引擎" value={`${engine?.emoji} ${engine?.cn}`} />
              <Meta label="层级" value={method.layer} mono />
              {method.origin && <Meta label="来源类型" value={method.origin} />}
              {method.source && (
                <Meta label="参考" value={method.source} multiline />
              )}
            </dl>
          </div>

          {related.length > 0 && (
            <div className="mt-4 rounded-2xl border border-mist bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                同引擎方法
              </div>
              <ul className="mt-3 space-y-2">
                {related.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/methods/${m.slug}`}
                      className="group flex items-baseline gap-2 text-sm"
                    >
                      <span
                        className="font-mono text-xs"
                        style={{ color }}
                      >
                        {m.id}
                      </span>
                      <span className="text-ink/80 transition group-hover:text-ink group-hover:underline">
                        {m.titleCn}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/methods?engine=${method.engine}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cobalt hover:underline"
              >
                查看全部 {engine?.cn} <ExternalLink className="size-3" />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* 用过此方法的案例 */}
      {usedInCases.length > 0 && (
        <section className="mt-16 border-t border-mist pt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              用过此方法的案例
            </h2>
            <span className="text-sm text-ink/50">
              {usedInCases.length} 个
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {usedInCases.map((c) => (
              <Link
                key={c.id}
                href={c.file ? `/cases/${c.id}` : "/cases"}
                className="group flex flex-col gap-2 rounded-xl border border-mist bg-white p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow"
              >
                <span className="font-mono text-xs text-ink/40">{c.id}</span>
                <div className="text-sm font-semibold leading-snug">
                  {c.title}
                </div>
                <p className="line-clamp-2 text-xs text-ink/60">{c.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 上一/下一方法 */}
      <nav className="mt-16 grid grid-cols-1 gap-3 border-t border-mist pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/methods/${prev.slug}`}
            className="group flex flex-col gap-1 rounded-xl border border-mist bg-white p-4 transition hover:border-ink"
          >
            <span className="flex items-center gap-1 text-xs text-ink/50">
              <ArrowLeft className="size-3" /> 上一个
            </span>
            <span className="text-sm font-medium">
              <span className="font-mono text-xs text-ink/40">
                {prev.id}{" "}
              </span>
              {prev.titleCn}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/methods/${next.slug}`}
            className="group flex flex-col items-end gap-1 rounded-xl border border-mist bg-white p-4 text-right transition hover:border-ink"
          >
            <span className="flex items-center gap-1 text-xs text-ink/50">
              下一个 <ArrowRight className="size-3" />
            </span>
            <span className="text-sm font-medium">
              {next.titleCn}
              <span className="font-mono text-xs text-ink/40">
                {" "}
                {next.id}
              </span>
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}

function Meta({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "flex flex-col gap-1" : "flex justify-between gap-3"}>
      <dt className="shrink-0 text-ink/50">{label}</dt>
      <dd
        className={`${mono ? "font-mono" : ""} ${multiline ? "" : "text-right"} text-ink/85`}
      >
        {value}
      </dd>
    </div>
  );
}
