import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "404 · 没找到这一页" };

export default function NotFound() {
  return (
    <main className="relative isolate flex flex-1 items-center px-6 py-24">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -right-32 -bottom-32 size-[600px] rounded-full border border-volt/20" />
      <div className="absolute -right-24 -bottom-24 size-[480px] rounded-full border border-fog-2" />

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
          可能链接过期、可能是个还没存档的方法。下面是几个稳的入口。
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-volt px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            回首页 <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/methods"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            浏览 74 个方法
          </Link>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            浏览案例
          </Link>
        </div>
      </div>
    </main>
  );
}
