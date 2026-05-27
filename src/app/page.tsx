import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  Sparkles,
  Brain,
  Target,
  Lightbulb,
  Scale,
  Puzzle,
  RotateCw,
} from "lucide-react";
import { engines, layers } from "@/lib/engines";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";

// 引擎对应的 lucide icon
const engineIcons = {
  cognition: Brain,
  strategy: Target,
  generation: Lightbulb,
  decision: Scale,
  product: Puzzle,
  evolution: RotateCw,
} as const;

// 精选 6 个方法（每个引擎挑 1 个有代表性的）
const FEATURED_METHOD_IDS = ["CG01", "ST06", "GN04", "DC02", "PD01", "EV01"];

export default function Home() {
  const methods = getAllMethods();
  const cases = getAllCases().filter((c) => c.file !== null);
  const totalMethods = methods.length;
  const countsByEngine = engines.map((e) => ({
    ...e,
    count: methods.filter((m) => m.engine === e.key).length,
  }));
  const featured = FEATURED_METHOD_IDS.map((id) =>
    methods.find((m) => m.id === id),
  ).filter((m): m is NonNullable<typeof m> => !!m);
  const featuredCases = cases.slice(0, 3);

  return (
    <main className="flex-1">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-mist">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-cobalt/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 size-96 rounded-full bg-flare/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <div className="inline-flex items-center gap-2 rounded-full border border-mist bg-paper/80 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Beaker className="size-3.5 text-cobalt" />
            <span>
              v0.1 · {totalMethods} 个方法论 · 6 大引擎 · 5 层认知 ·{" "}
              {cases.length} 个真实案例
            </span>
          </div>

          <h1 className="mt-8 text-5xl font-bold tracking-tight sm:text-7xl">
            从<span className="text-cobalt">认知</span>到
            <span className="text-flare">产品化</span>
            <br />
            的生产系统
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-ink/70 sm:text-xl">
            InnoLab 不是方法论的清单，而是一台编排引擎。
            问题重构 → 方法编排 → 多方案生成 → 决策筛选 → 产品定义 → 进化反馈。
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/methods"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-cobalt"
            >
              浏览 {totalMethods} 个方法
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium transition hover:border-ink"
            >
              看真实案例
            </Link>
            <span className="text-sm text-ink/50">
              即将开放：AI 分析入口 →
            </span>
          </div>
        </div>
      </section>

      {/* ============ 六大引擎 时间线 ============ */}
      <section className="border-b border-mist py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-ink/50">
                Six Engines · 一条生产线
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                六大引擎串成一个流程
              </h2>
              <p className="mt-3 max-w-2xl text-ink/70">
                每个引擎解决生产链上的一个环节。 你卡在哪一环，就调哪一环的方法。
              </p>
            </div>
            <Link
              href="/methods"
              className="hidden whitespace-nowrap text-sm font-medium text-cobalt hover:underline sm:inline"
            >
              查看全部方法 →
            </Link>
          </div>

          {/* 桌面端：水平时间线 / 移动端：垂直 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countsByEngine.map((e, i) => {
              const Icon = engineIcons[e.key];
              return (
                <Link
                  key={e.key}
                  href={`/methods?engine=${e.key}`}
                  className="group relative overflow-hidden rounded-2xl border border-mist bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg"
                >
                  <div
                    className="absolute right-0 top-0 size-24 rounded-bl-full opacity-15 transition group-hover:opacity-30"
                    style={{ backgroundColor: e.colorHex }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex size-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${e.colorHex}15` }}
                      >
                        <Icon
                          className="size-6"
                          style={{ color: e.colorHex }}
                          strokeWidth={1.75}
                        />
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${e.colorHex}15`,
                          color: e.colorHex,
                        }}
                      >
                        {e.count} 个方法
                      </span>
                    </div>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-mono text-xs text-ink/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-xl font-semibold">{e.cn}</h3>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink/40">
                      {e.en}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">
                      {e.oneliner}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 精选方法 ============ */}
      <section className="border-b border-mist py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="text-sm font-medium text-ink/50">Featured</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              如果只看 6 张方法卡，看这 6 张
            </h2>
            <p className="mt-3 text-ink/70">
              每个引擎挑一张最常被引用、最能体现"层级感"的方法。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((m) => {
              const eng = engines.find((e) => e.key === m.engine);
              const color = eng?.colorHex ?? "#000";
              return (
                <Link
                  key={m.slug}
                  href={`/methods/${m.slug}`}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-mist bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color }}
                    >
                      {m.id}
                    </span>
                    <Badge color={color}>{eng?.cn}</Badge>
                    {m.layer !== "—" && (
                      <Badge
                        variant="outline"
                        className="border-ink/15 text-ink/60"
                      >
                        {m.layer}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold leading-snug">
                    {m.titleCn}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-ink/70">
                    {m.oneliner || "—"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 五层认知 ============ */}
      <section className="border-b border-mist bg-ink py-24 text-paper">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <div className="text-sm font-medium text-paper/50">
              Five Layers of Cognition
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              五层认知深度模型
            </h2>
            <p className="mt-4 text-paper/70">
              每个方法都标注了它工作的认知层级。
              做产品决策时，知道你在哪一层比知道哪个方法更重要。
            </p>
          </div>
          <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-5">
            {layers.map((l, i) => (
              <li
                key={l.id}
                className="relative rounded-xl border border-paper/10 bg-paper/[0.03] p-5 transition hover:border-acid/50 hover:bg-paper/[0.06]"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-acid">
                    {l.id}
                  </span>
                  <span className="text-xs text-paper/40">Layer {i + 1}</span>
                </div>
                <div className="mt-2 text-lg font-semibold">{l.name}</div>
                <div className="mt-1 text-sm text-paper/60">{l.desc}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ 精选案例 ============ */}
      {featuredCases.length > 0 && (
        <section className="border-b border-mist py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div className="max-w-2xl">
                <div className="text-sm font-medium text-ink/50">
                  Cases · 真实案例
                </div>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  方法的价值在于被用过
                </h2>
                <p className="mt-3 text-ink/70">
                  从教育产品到企业 AI 转型，每个案例都标注了它用了哪几个方法。
                </p>
              </div>
              <Link
                href="/cases"
                className="hidden whitespace-nowrap text-sm font-medium text-cobalt hover:underline sm:inline"
              >
                查看全部 {cases.length} 个案例 →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {featuredCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-mist bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg"
                >
                  <div className="absolute -right-12 -top-12 size-32 rounded-full bg-flare/10 blur-2xl transition group-hover:bg-flare/20" />
                  <div className="relative flex items-center justify-between">
                    <span className="font-mono text-xs text-ink/40">
                      {c.id}
                    </span>
                    <span className="text-xs text-ink/40">{c.added_date}</span>
                  </div>
                  <h3 className="relative text-lg font-semibold leading-snug">
                    {c.title}
                  </h3>
                  <p className="relative line-clamp-3 flex-1 text-sm leading-relaxed text-ink/70">
                    {c.summary}
                  </p>
                  <div className="relative flex flex-wrap gap-1.5">
                    {(c.domain ?? []).slice(0, 3).map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="border-ink/15 text-ink/60"
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ 下一步 / 候补 ============ */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Sparkles className="mx-auto size-8 text-flare" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            v1.0 是一个 AI 分析师
          </h2>
          <p className="mt-4 text-ink/70">
            输入一个真实问题，InnoLab 会自动编排方法、生成多套方案、给出决策建议，
            并把这次分析沉淀进你的私有记忆库。预计今夏开放。
          </p>
          <form action="/api/waitlist" method="post" className="mx-auto mt-8 flex max-w-md gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-mist bg-white px-5 py-3 text-sm outline-none transition focus:border-cobalt"
            />
            <button
              type="submit"
              className="rounded-full bg-cobalt px-5 py-3 text-sm font-medium text-paper transition hover:bg-ink"
            >
              加入候补
            </button>
          </form>
          <p className="mt-3 text-xs text-ink/40">
            候补名单优先获得早期试用名额
          </p>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-mist py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-5 rounded-md bg-gradient-to-br from-cobalt via-violet to-flare" />
            <span className="font-semibold">InnoLab</span>
            <span className="text-ink/40">© 2026 邱懿武</span>
          </div>
          <div className="flex gap-6 text-sm text-ink/60">
            <Link href="/methods" className="hover:text-ink">
              方法
            </Link>
            <Link href="/cases" className="hover:text-ink">
              案例
            </Link>
            <Link href="/about" className="hover:text-ink">
              关于
            </Link>
            <a
              href="https://github.com/qiuyiwu1989-star/innolab"
              className="hover:text-ink"
              target="_blank"
              rel="noopener"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
