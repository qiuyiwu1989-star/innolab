import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "已加入候补",
};

export default function ThanksPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-32 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-acid/20">
        <CheckCircle2 className="size-8 text-acid-ink" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        收到了。
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink/70">
        InnoLab v1.0（AI 分析引擎）开放试用时，会第一时间联系你。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/methods"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-cobalt"
        >
          继续浏览方法
        </Link>
        <Link
          href="/"
          className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium hover:border-ink"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
