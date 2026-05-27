import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Quote, Tag, Layers, User, Calendar } from "lucide-react";
import { getAllCases, getCaseById } from "@/lib/cases";
import { getAllMethods } from "@/lib/methods";
import { engines } from "@/lib/engines";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllCases()
    .filter((c) => c.file !== null) // 没详情文件的不生成路由
    .map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = getCaseById(id);
  if (!c) return { title: "未找到案例" };
  return {
    title: c.title,
    description: c.summary,
  };
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const c = getCaseById(id);
  if (!c || c.file === null) notFound();

  const allMethods = getAllMethods();
  const relatedMethods = (c.related_methods ?? [])
    .map((mid) => allMethods.find((m) => m.id.toUpperCase() === mid.toUpperCase()))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <article className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
      {/* 面包屑 */}
      <nav className="mb-8">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> 返回案例库
        </Link>
      </nav>

      {/* Hero */}
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
          <span className="font-mono">{c.id}</span>
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
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {c.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink/80">
          {c.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {(c.domain ?? []).map((d) => (
            <Badge key={d} className="bg-ink text-paper">
              {d}
            </Badge>
          ))}
          {(c.tags ?? []).map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="border-ink/15 text-ink/60"
            >
              <Tag className="mr-1 size-3" />
              {t}
            </Badge>
          ))}
        </div>
      </header>

      {/* Insight 高亮卡 */}
      {c.insight && (
        <aside className="mt-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-cobalt/8 via-violet/5 to-flare/8 p-7">
          <Quote className="absolute right-6 top-6 size-12 text-cobalt/15" />
          <div className="text-xs font-semibold uppercase tracking-wider text-cobalt">
            核心洞察 · Insight
          </div>
          <p className="mt-3 text-lg font-medium leading-relaxed text-ink">
            {c.insight}
          </p>
        </aside>
      )}

      {/* 关键事实 */}
      {c.key_facts && c.key_facts.length > 0 && (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Layers className="size-5 text-flare" />
            关键事实
          </h2>
          <ul className="mt-5 space-y-3">
            {c.key_facts.map((f, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-xl border border-mist bg-white p-4"
              >
                <span className="shrink-0 font-mono text-xs font-semibold text-flare">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-ink/85">
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 关联方法 */}
      {relatedMethods.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">用了哪些 InnoLab 方法</h2>
          <p className="mt-1 text-sm text-ink/60">
            点开看每个方法的完整定义和怎么用。
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedMethods.map((m) => {
              const eng = engines.find((e) => e.key === m.engine);
              const color = eng?.colorHex ?? "#000";
              return (
                <Link
                  key={m.slug}
                  href={`/methods/${m.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-mist bg-white p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color }}
                    >
                      {m.id}
                    </span>
                    <Badge color={color}>{eng?.cn}</Badge>
                  </div>
                  <div className="text-sm font-semibold leading-snug">
                    {m.titleCn}
                  </div>
                  {m.oneliner && (
                    <div className="line-clamp-2 text-xs leading-relaxed text-ink/60">
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
        <section className="mt-12 rounded-2xl border border-mist bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/40">
            适用场景
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {c.applicable_to}
          </p>
        </section>
      )}

      {/* Source footer */}
      {c.source && (
        <footer className="mt-10 text-xs text-ink/40">
          来源：{c.source}
        </footer>
      )}
    </article>
  );
}
