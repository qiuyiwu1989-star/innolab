import Link from "next/link";

export const metadata = { title: "已加入候补" };

export default function ThanksPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-32 text-center">
      <div className="numeral text-xs uppercase tracking-widest text-volt">
        Confirmed
      </div>
      <h1 className="display mt-3 text-4xl text-bone sm:text-6xl">
        收到了。
      </h1>
      <p className="mt-6 max-w-md text-lg text-ash">
        InnoLab v1.0 开放试用时，第一时间联系你。
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/methods"
          className="rounded-md bg-volt px-5 py-2.5 text-sm font-semibold text-ink hover:brightness-110"
        >
          继续浏览方法
        </Link>
        <Link
          href="/"
          className="rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone hover:border-volt"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
