import Link from "next/link";
import { ArrowRight, Beaker, Hash, Folder } from "lucide-react";

export const metadata = { title: "404 · 没找到这一页" };

export default function NotFound() {
  return (
    <main className="relative isolate flex flex-1 items-center px-6 py-24">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div
        aria-hidden
        className="absolute -right-32 -bottom-32 size-[600px] rounded-full border border-volt/20"
      />
      <div
        aria-hidden
        className="absolute -right-24 -bottom-24 size-[480px] rounded-full border border-fog-2"
      />

      <div className="relative mx-auto max-w-3xl">
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          Error · 404
        </div>
        <div className="numeral mt-4 text-[160px] leading-none text-bone sm:text-[240px]">
          404
        </div>
        <h1 className="display mt-6 text-3xl text-bone sm:text-5xl">
          这一页不在弹药库里。
        </h1>
        <p className="mt-4 max-w-xl text-base text-ash sm:text-lg">
          可能链接过期、可能是个还没存档的方法。
          下面是几个稳的入口 —— 或者直接按
          <kbd className="numeral mx-1 rounded border border-fog-2 px-1.5 text-[11px]">
            ⌘K
          </kbd>
          全局搜索。
        </p>

        {/* —— 主 CTA：用 /demo 试问题 —— */}
        <div className="mt-10">
          <Link
            href="/demo"
            className="group inline-flex items-center gap-3 rounded-lg border border-volt bg-volt/[0.05] px-5 py-3 text-sm transition hover:bg-volt/[0.1]"
          >
            <Beaker className="size-4 text-volt" />
            <span className="font-semibold text-bone">
              试一下 InnoLab 真分析
            </span>
            <ArrowRight className="size-4 text-volt transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* —— 次级入口 —— */}
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <EntryLink
            href="/"
            icon={Beaker}
            title="首页"
            sub="弹药库 + 六大引擎"
          />
          <EntryLink
            href="/methods"
            icon={Hash}
            title="83 个方法"
            sub="按引擎 / 层级筛选"
          />
          <EntryLink
            href="/cases"
            icon={Folder}
            title="10 个真实案例"
            sub="复原的完整推演"
          />
        </div>
      </div>
    </main>
  );
}

function EntryLink({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-fog-2 bg-soot p-4 transition hover:border-volt hover:bg-graphite"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-volt" />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-bone">{title}</div>
        <div className="mt-0.5 text-xs text-dust">{sub}</div>
      </div>
      <ArrowRight className="ml-auto size-4 shrink-0 text-dust opacity-0 transition group-hover:opacity-100 group-hover:text-volt" />
    </Link>
  );
}
