import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { readSharedReport } from "@/lib/shared-reports";
import { Markdown } from "@/components/site/markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = readSharedReport(id);
  if (!r) return { title: "推演报告", robots: { index: false, follow: false } };
  const q = r.prompt.replace(/【我的背景】[\s\S]*?\n\n/, "").slice(0, 30);
  return {
    title: `战略推演 · ${q}… — InnoLab`,
    description: `一份用邱懿武 86 方法体系跑出的战略推演分析。`,
    robots: { index: false, follow: false }, // 分享链接不进搜索引擎
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { id } = await params;
  const r = readSharedReport(id);
  if (!r) notFound();

  // 去掉可能的「我的背景/补充背景」前缀噪声，只给读者看核心问题
  const question = r.prompt
    .replace(/【我的背景】[\s\S]*?(?=\n\n)/, "")
    .replace(/\n\n【补充背景】[\s\S]*$/, "")
    .trim();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header>
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          InnoLab · 战略推演报告
        </div>
        <div className="mt-5 rounded-lg border-l-2 border-volt bg-soot px-4 py-3 text-sm leading-relaxed text-ash">
          <span className="font-medium text-bone">问题：</span>
          {question || r.prompt}
        </div>
      </header>

      <div className="mt-10">
        <Markdown source={r.output} />
      </div>

      {/* 分发钩子：看完这份分析的人，一步试自己的 / 约咨询 */}
      <section className="mt-14 rounded-2xl border border-volt/40 bg-volt/[0.04] p-6 sm:p-8">
        <h2 className="display text-2xl text-bone">
          这份分析，用邱懿武的 86 方法体系跑出来。
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ash">
          想拿你自己的难题试一发？免费。而真正值钱的判断——针对你处境的取舍、落地路径——
          邱懿武会亲自和你 1:1 深聊。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-md bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            免费试一发推演
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-3 text-sm font-semibold text-bone transition hover:border-volt"
          >
            约邱懿武 1:1
          </Link>
        </div>
      </section>

      <footer className="mt-10 border-t border-fog-2 pt-6 text-xs text-dust">
        本报告由 InnoLab（
        <Link href="/" className="text-volt hover:underline">
          innolab.cc
        </Link>
        ）基于邱懿武的 86 个战略创新方法生成，仅供参考。
      </footer>
    </article>
  );
}
