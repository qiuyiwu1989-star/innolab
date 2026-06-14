import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getAllMethods, getMethodBySlug } from "@/lib/methods";
import { engines } from "@/lib/engines";
import { getCasesByMethodId } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { cleanMarkdownBody } from "@/components/site/markdown";
import { MethodModules } from "@/components/site/method-modules";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const seen = new Set<string>();
  return getAllMethods()
    .filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    })
    .map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = getMethodBySlug(slug);
  if (!m) return { title: "未找到" };
  const desc = m.oneliner || `${m.titleCn} — InnoLab 方法卡`;
  return {
    title: `${m.titleCn}（${m.id}）`,
    description: desc,
    keywords: [m.titleCn, m.titleEn, m.id, m.engineLabel, "InnoLab", "方法论"]
      .filter(Boolean)
      .join(","),
    openGraph: {
      title: `${m.titleCn} · ${m.id}`,
      description: desc,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${m.titleCn} · ${m.id}`,
      description: desc,
    },
  };
}

export default async function MethodDetailPage({ params }: Props) {
  const { slug } = await params;
  const method = getMethodBySlug(slug);
  if (!method) notFound();

  const engine = engines.find((e) => e.key === method.engine);
  const allMethods = getAllMethods();
  const sameEngine = allMethods.filter(
    (m) => m.engine === method.engine && m.slug !== method.slug,
  );
  const idx = sameEngine.findIndex((m) => m.id > method.id);
  const related = (
    idx === -1
      ? sameEngine.slice(-3)
      : sameEngine.slice(Math.max(0, idx - 1), idx + 2)
  ).slice(0, 4);

  const fullIdx = allMethods.findIndex((m) => m.slug === method.slug);
  const prev = fullIdx > 0 ? allMethods[fullIdx - 1] : null;
  const next =
    fullIdx < allMethods.length - 1 ? allMethods[fullIdx + 1] : null;

  const body = cleanMarkdownBody(method.raw);
  const usedInCases = getCasesByMethodId(method.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.cc";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: method.titleCn,
    description: method.oneliner || method.titleCn,
    termCode: method.id,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "InnoLab 方法库",
      url: `${siteUrl}/methods`,
    },
    url: `${siteUrl}/methods/${method.slug}`,
    inLanguage: "zh-CN",
  };
  // 带方法上下文跳转 demo：预填一句开头，降低「面对空白框」的摩擦
  const demoSeed = `/demo?q=${encodeURIComponent(`我想用「${method.titleCn}」分析我的业务：`)}`;

  return (
    <article className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 面包屑 */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-dust">
        <Link
          href="/methods"
          className="inline-flex items-center gap-1 transition hover:text-bone"
        >
          <ArrowLeft className="size-3.5" /> 方法库
        </Link>
        <span>/</span>
        <Link
          href={`/methods?engine=${method.engine}`}
          className="text-ash transition hover:text-bone"
        >
          {engine?.cn}
        </Link>
        <span>/</span>
        <span className="numeral text-bone">{method.id}</span>
      </nav>

      {/* Hero */}
      <header className="border-b border-fog-2 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="numeral text-xs text-volt">{method.id}</span>
          <Badge variant="outline">{engine?.cn}</Badge>
          {method.layer !== "—" && (
            <Badge variant="ghost">
              <span className="numeral">{method.layer}</span>
            </Badge>
          )}
          {method.origin && <Badge variant="ghost">{method.origin}</Badge>}
        </div>
        <h1 className="display mt-6 text-4xl text-bone sm:text-6xl">
          {method.titleCn}
        </h1>
        {method.titleEn && (
          <p className="mt-3 font-mono text-sm uppercase tracking-widest text-dust">
            {method.titleEn}
          </p>
        )}
        {method.oneliner && (
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ash">
            {method.oneliner}
          </p>
        )}
      </header>

      {/* 双栏 */}
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0">
          <MethodModules body={body} />
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-fog-2 bg-soot p-5">
            <div className="numeral text-xs uppercase tracking-widest text-dust">
              Meta
            </div>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Meta label="ID" value={method.id} mono />
              <Meta label="引擎" value={engine?.cn ?? "—"} />
              <Meta label="层级" value={method.layer} mono />
              {method.origin && <Meta label="来源类型" value={method.origin} />}
              {method.source && (
                <Meta label="参考" value={method.source} multiline />
              )}
            </dl>
          </div>

          {related.length > 0 && (
            <div className="mt-4 rounded-lg border border-fog-2 bg-soot p-5">
              <div className="numeral text-xs uppercase tracking-widest text-dust">
                同引擎方法
              </div>
              <ul className="mt-3 space-y-2.5">
                {related.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/methods/${m.slug}`}
                      className="group flex items-baseline gap-2 text-sm"
                    >
                      <span className="numeral text-xs text-volt">{m.id}</span>
                      <span className="text-ash transition group-hover:text-bone group-hover:underline">
                        {m.titleCn}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/methods?engine=${method.engine}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-volt hover:underline"
              >
                查看全部 {engine?.cn} <ArrowUpRight className="size-3" />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* 用过此方法的案例 */}
      {usedInCases.length > 0 && (
        <section className="mt-20 border-t border-fog-2 pt-12">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="numeral text-xs uppercase tracking-widest text-volt">
                Cases
              </div>
              <h2 className="display mt-2 text-2xl text-bone sm:text-3xl">
                用过此方法的案例
              </h2>
            </div>
            <span className="numeral text-sm text-dust">
              {usedInCases.length} 个
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {usedInCases.map((c) => (
              <Link
                key={c.id}
                href={c.file ? `/cases/${c.id}` : "/cases"}
                className="group flex flex-col gap-2 rounded-lg border border-fog-2 bg-soot p-4 transition hover:border-volt hover:bg-graphite"
              >
                <span className="numeral text-xs text-dust">{c.id}</span>
                <div className="text-sm font-semibold leading-snug text-bone">
                  {c.title}
                </div>
                <p className="line-clamp-2 text-xs text-ash">{c.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA：用此方法推演 */}
      <section className="mt-16 rounded-lg border border-fog-2 bg-soot p-6 text-center sm:p-8">
        <h2 className="display text-2xl text-bone sm:text-3xl">
          用「{method.titleCn}」推演你的问题
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ash">
          描述你正面临的难题，InnoLab 会用这套方法当场跑一次结构化推演。
        </p>
        <Link
          href={demoSeed}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-volt px-5 py-2.5 text-sm font-medium text-volt transition hover:bg-volt/10"
        >
          免费推演一次 <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Prev / Next */}
      <nav className="mt-16 grid grid-cols-1 gap-3 border-t border-fog-2 pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/methods/${prev.slug}`}
            className="group flex flex-col gap-1 rounded-lg border border-fog-2 bg-soot p-4 transition hover:border-volt"
          >
            <span className="flex items-center gap-1 text-xs text-dust">
              <ArrowLeft className="size-3" /> 上一个
            </span>
            <span className="text-sm font-medium text-bone">
              <span className="numeral text-xs text-dust">{prev.id} </span>
              {prev.titleCn}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/methods/${next.slug}`}
            className="group flex flex-col items-end gap-1 rounded-lg border border-fog-2 bg-soot p-4 text-right transition hover:border-volt"
          >
            <span className="flex items-center gap-1 text-xs text-dust">
              下一个 <ArrowRight className="size-3" />
            </span>
            <span className="text-sm font-medium text-bone">
              {next.titleCn}
              <span className="numeral text-xs text-dust"> {next.id}</span>
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
    <div
      className={
        multiline ? "flex flex-col gap-1" : "flex justify-between gap-3"
      }
    >
      <dt className="shrink-0 text-dust">{label}</dt>
      <dd
        className={`${mono ? "numeral" : ""} ${multiline ? "" : "text-right"} text-bone`}
      >
        {value}
      </dd>
    </div>
  );
}
