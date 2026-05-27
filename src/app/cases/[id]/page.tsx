import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag, Calendar, User } from "lucide-react";
import { getAllCases, getCaseById } from "@/lib/cases";
import { getAllMethods } from "@/lib/methods";
import { engines } from "@/lib/engines";
import { Badge } from "@/components/ui/badge";

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
  return { title: c.title, description: c.summary };
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const c = getCaseById(id);
  if (!c || c.file === null) notFound();

  const allMethods = getAllMethods();
  const relatedMethods = (c.related_methods ?? [])
    .map((mid) =>
      allMethods.find((m) => m.id.toUpperCase() === mid.toUpperCase()),
    )
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <article className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
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
        </div>
        <h1 className="display mt-4 text-4xl text-bone sm:text-5xl">
          {c.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ash">{c.summary}</p>
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

      {/* Insight */}
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

      {/* 关键事实 */}
      {c.key_facts && c.key_facts.length > 0 && (
        <section className="mt-12">
          <h2 className="numeral text-xs uppercase tracking-widest text-volt">
            Key Facts · 关键事实
          </h2>
          <ul className="mt-5 space-y-3">
            {c.key_facts.map((f, i) => (
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

      {/* 关联方法 */}
      {relatedMethods.length > 0 && (
        <section className="mt-12">
          <h2 className="numeral text-xs uppercase tracking-widest text-volt">
            Methods Used · 用了哪些方法
          </h2>
          <p className="mt-2 text-sm text-dust">
            点开看每个方法的定义和怎么用。
          </p>
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
                  {m.oneliner && (
                    <div className="line-clamp-2 text-xs leading-relaxed text-ash">
                      {m.oneliner}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 适用场景 */}
      {c.applicable_to && (
        <section className="mt-12 rounded-lg border border-fog-2 bg-soot p-6">
          <div className="numeral text-xs uppercase tracking-widest text-dust">
            Applicable · 适用场景
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ash">
            {c.applicable_to}
          </p>
        </section>
      )}

      {c.source && (
        <footer className="mt-10 text-xs text-dust">来源 / {c.source}</footer>
      )}
    </article>
  );
}
