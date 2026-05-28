import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Tag,
  Calendar,
  User,
  Beaker,
  ArrowRight,
} from "lucide-react";
import { getAllCases, getCaseById } from "@/lib/cases";
import { getAllMethods, type Method } from "@/lib/methods";
import { engines } from "@/lib/engines";
import { Badge } from "@/components/ui/badge";
import { CaseFlow } from "@/components/site/case-flow";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllCases()
    .filter((c) => c.file !== null)
    .map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = getCaseById(id);
  if (!c) return { title: "未找到案例" };
  return {
    title: c.title,
    description: c.summary,
    keywords: [
      ...(c.tags ?? []),
      ...(c.domain ?? []),
      "InnoLab",
      "战略分析",
      "案例研究",
    ],
    openGraph: {
      title: c.title,
      description: c.summary,
      type: "article",
      publishedTime: c.added_date,
      authors: c.added_by ? [c.added_by] : undefined,
      tags: [...(c.tags ?? []), ...(c.domain ?? [])],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.summary,
    },
  };
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const c = getCaseById(id);
  if (!c || c.file === null) notFound();

  const allMethods = getAllMethods();
  const methodsById: Record<string, Method | undefined> = {};
  for (const id of c.related_methods ?? []) {
    methodsById[id.toUpperCase()] = allMethods.find(
      (m) => m.id.toUpperCase() === id.toUpperCase(),
    );
  }
  // 流程里引用的 method ID 可能不在 related_methods 里，也补一下
  if (c.analysis_flow) {
    for (const m of c.analysis_flow.method_chain) {
      const key = m.id.toUpperCase();
      if (!methodsById[key]) {
        methodsById[key] = allMethods.find(
          (mm) => mm.id.toUpperCase() === key,
        );
      }
    }
  }

  const hasFlow = !!c.analysis_flow;

  // JSON-LD：让搜索引擎理解这是一篇分析文章
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.qiuyiwu.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.summary,
    datePublished: c.added_date,
    author: {
      "@type": "Person",
      name: c.added_by ?? "邱懿武",
      url: "https://qiuyiwu.com",
    },
    publisher: {
      "@type": "Organization",
      name: "InnoLab",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/cases/${c.id}`,
    },
    keywords: [...(c.tags ?? []), ...(c.domain ?? [])].join(", "),
    articleSection: c.domain?.[0],
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 面包屑 */}
      <nav className="mb-8">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-sm text-dust hover:text-bone"
        >
          <ArrowLeft className="size-3.5" /> 案例库
        </Link>
      </nav>

      {/* Hero */}
      <header>
        <div className="flex flex-wrap items-center gap-3 text-xs text-dust">
          <span className="numeral text-volt">{c.id}</span>
          {c.added_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" /> {c.added_date}
            </span>
          )}
          {c.added_by && (
            <span className="inline-flex items-center gap-1">
              <User className="size-3" /> {c.added_by}
            </span>
          )}
          {hasFlow && (
            <span className="inline-flex items-center gap-1 rounded-full border border-volt/40 bg-volt/[0.05] px-2 py-0.5 text-[10px] text-volt">
              <Beaker className="size-3" />
              复原分析
            </span>
          )}
        </div>
        <h1 className="display mt-4 text-3xl text-bone sm:text-5xl">
          {c.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ash">{c.summary}</p>
        {(c.analysis_flow?.context || c.applicable_to) && (
          <p className="mt-4 text-sm text-dust">
            <span className="numeral text-[10px] uppercase tracking-widest mr-2">
              背景
            </span>
            {c.analysis_flow?.context ?? c.applicable_to}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {(c.domain ?? []).map((d) => (
            <Badge key={d} variant="solid">
              {d}
            </Badge>
          ))}
          {(c.tags ?? []).map((t) => (
            <Badge key={t} variant="outline">
              <Tag className="mr-1 size-3" />
              {t}
            </Badge>
          ))}
        </div>
      </header>

      {/* 主体：分析流程 (新) 或 legacy 内容 */}
      {hasFlow && c.analysis_flow ? (
        <section className="mt-12">
          <div className="mb-6 flex items-baseline gap-3">
            <span className="numeral text-xs uppercase tracking-widest text-volt">
              Analysis Flow · 完整推演
            </span>
            <span className="text-xs text-dust">
              ↓ 一步步看 InnoLab 怎么分析这个问题
            </span>
          </div>
          <CaseFlow flow={c.analysis_flow} methodsById={methodsById} />
        </section>
      ) : (
        <LegacyDetail c={c} methodsById={methodsById} />
      )}

      {/* 试一次同类问题 CTA */}
      <section className="mt-16 rounded-xl border border-volt bg-volt/[0.04] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="numeral text-xs uppercase tracking-widest text-volt">
              Try It
            </div>
            <h3 className="display mt-2 text-xl text-bone sm:text-2xl">
              换你的问题，InnoLab 来跑一次
            </h3>
            <p className="mt-2 text-sm text-ash">
              这是 InnoLab 在 v0.1 跑过的案例。你也可以把你的真实商业问题输进去。
            </p>
          </div>
          <Link
            href="/demo"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-md bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 sm:self-center"
          >
            打开 /demo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {c.source && (
        <footer className="mt-10 text-xs text-dust">来源 / {c.source}</footer>
      )}
    </article>
  );
}

/* ───── legacy fallback：没有 analysis_flow 时的旧布局 ───── */
function LegacyDetail({
  c,
  methodsById,
}: {
  c: ReturnType<typeof getCaseById> & object;
  methodsById: Record<string, Method | undefined>;
}) {
  const relatedMethods = (c.related_methods ?? [])
    .map((mid: string) => methodsById[mid.toUpperCase()])
    .filter((m): m is Method => !!m);

  return (
    <>
      {c.insight && (
        <aside className="mt-12 rounded-lg border border-volt/40 bg-volt/[0.04] p-7">
          <div className="numeral text-xs uppercase tracking-widest text-volt">
            Insight · 核心洞察
          </div>
          <p className="mt-3 text-lg font-medium leading-relaxed text-bone">
            {c.insight}
          </p>
        </aside>
      )}

      {c.key_facts && c.key_facts.length > 0 && (
        <section className="mt-12">
          <h2 className="numeral text-xs uppercase tracking-widest text-volt">
            Key Facts · 关键事实
          </h2>
          <ul className="mt-5 space-y-3">
            {c.key_facts.map((f: string, i: number) => (
              <li
                key={i}
                className="flex gap-4 rounded-lg border border-fog-2 bg-soot p-4"
              >
                <span className="numeral shrink-0 text-xs text-volt">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-ash">{f}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedMethods.length > 0 && (
        <section className="mt-12">
          <h2 className="numeral text-xs uppercase tracking-widest text-volt">
            Methods Used · 用了哪些方法
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedMethods.map((m) => {
              const eng = engines.find((e) => e.key === m.engine);
              return (
                <Link
                  key={m.slug}
                  href={`/methods/${m.slug}`}
                  className="group flex flex-col gap-2 rounded-lg border border-fog-2 bg-soot p-4 transition hover:border-volt hover:bg-graphite"
                >
                  <div className="flex items-center gap-2">
                    <span className="numeral text-xs text-volt">{m.id}</span>
                    <Badge variant="outline">{eng?.cn}</Badge>
                  </div>
                  <div className="text-sm font-semibold leading-snug text-bone">
                    {m.titleCn}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
