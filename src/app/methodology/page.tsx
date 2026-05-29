import type { Metadata } from "next";
import Link from "next/link";
import { engines } from "@/lib/engines";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.cc";

export const metadata: Metadata = {
  title: "方法论体系 — InnoLab 战略创新智能体",
  description:
    "InnoLab 把 83 个创新与战略方法封装成可被 AI 调用的「方法链」，对你的具体处境做结构化推演。了解 6 大引擎、推演五步法，以及它为什么比通用 AI 更可靠。",
  alternates: { canonical: "/methodology" },
};

const STEPS = [
  {
    n: "01",
    title: "识别本质",
    desc: "从你的处境里提炼真正要解决的战略问题，而非表面症状。很多决策之所以失败，是因为一开始就在解一个错的问题。",
  },
  {
    n: "02",
    title: "选择方法链",
    desc: "自动匹配 3-5 个最相关的方法，按逻辑顺序串联成推演链——单个方法只能照亮一个侧面，方法链才能形成完整判断。",
  },
  {
    n: "03",
    title: "逐法推演",
    desc: "每个方法都落到你的具体场景里：它怎么用、在你这个情况下得出什么洞察，而不是复述方法的定义。",
  },
  {
    n: "04",
    title: "给出判断",
    desc: "输出明确的 do / don't 行动建议，而不是模糊的「视情况而定」。判断可以错，但必须清晰、可被反驳。",
  },
  {
    n: "05",
    title: "沉淀原则",
    desc: "把这次推演里可迁移到其他场景的通用原则提炼出来——让你不只是解决了一个问题，而是带走一套思维方式。",
  },
];

export default function MethodologyPage() {
  const methods = getAllMethods();
  const cases = getAllCases();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "InnoLab 方法论体系",
    description:
      "InnoLab 把创新与战略方法封装成可被 AI 调用的方法链，对具体商业处境做结构化推演。",
    url: `${SITE_URL}/methodology`,
    author: { "@type": "Person", name: "邱懿武", url: "https://qiuyiwu.com" },
    publisher: { "@type": "Organization", name: "InnoLab", url: SITE_URL },
    inLanguage: "zh-CN",
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header>
        <div className="text-xs uppercase tracking-widest text-dust">
          Methodology · 方法论体系
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-bone md:text-4xl">
          不是更聪明的 AI，
          <br className="hidden md:block" />
          是更可靠的思考方式
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-pewter">
          通用 AI 能给你一段看起来合理的战略建议——但你无法判断它是怎么想出来的、漏了什么。
          InnoLab 不一样：它用 {methods.length} 个经过结构化的方法，
          按明确的逻辑链对你的处境逐步推演，每一步都看得见、可追问、可反驳。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-fog-2 bg-snow px-3 py-1 text-pewter">
            {methods.length} 个方法
          </span>
          <span className="rounded-full border border-fog-2 bg-snow px-3 py-1 text-pewter">
            {cases.length} 个实战案例
          </span>
          <span className="rounded-full border border-fog-2 bg-snow px-3 py-1 text-pewter">
            {engines.length} 大引擎
          </span>
        </div>
      </header>

      {/* 六大引擎 */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold text-bone">{engines.length} 大引擎</h2>
        <p className="mt-2 text-pewter">
          方法不是散落的工具箱，而是按「思考的不同阶段」组织成 {engines.length} 个引擎。
          一次完整的战略推演，往往会跨引擎调用——先认知、再战略、后评估。
        </p>
        <div className="mt-6 space-y-4">
          {engines.map((e) => {
            const count = methods.filter((m) => m.engine === e.key).length;
            return (
              <Link
                key={e.key}
                href={`/methods/engine/${e.key}`}
                className="block rounded-2xl border border-fog-2 bg-snow/60 p-5 transition hover:border-volt/40 hover:bg-snow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: e.color }}
                    >
                      {e.code}
                    </span>
                    <span className="text-base font-semibold text-bone">
                      {e.name}
                    </span>
                  </div>
                  <span className="text-xs text-dust">{count} 个方法 →</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-pewter">
                  {e.description ?? e.summary}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 推演五步法 */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold text-bone">推演五步法</h2>
        <p className="mt-2 text-pewter">
          每一次推演——无论你问的是 AI 转型、品牌定位还是组织冲突——都会走完这五步。
        </p>
        <ol className="mt-6 space-y-5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="numeral shrink-0 text-2xl font-semibold text-volt/70">
                {s.n}
              </span>
              <div>
                <div className="font-semibold text-bone">{s.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-pewter">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 为什么比通用 AI 可靠 */}
      <section className="mt-14 rounded-2xl border border-fog-2 bg-mist/30 p-6">
        <h2 className="text-xl font-semibold text-bone">
          为什么不直接问 ChatGPT？
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-pewter">
          <p>
            <span className="font-medium text-bone">过程可见。</span>{" "}
            通用 AI 给你一个结论，你不知道它怎么来的。InnoLab
            把方法链摊开给你看——每个判断对应哪个方法、哪一步，可追问、可反驳。
          </p>
          <p>
            <span className="font-medium text-bone">有方法论约束。</span>{" "}
            它不是自由发挥，而是被 {methods.length}{" "}
            个有明确适用边界的方法约束着推演，减少「听起来对、其实空」的废话。
          </p>
          <p>
            <span className="font-medium text-bone">有真实案例锚定。</span>{" "}
            每个方法都在至少 2 个真实商业案例里被用过，你可以直接去看它在别人的处境里怎么落地。
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14 rounded-2xl border border-fog-2 bg-gradient-to-br from-snow to-mist/40 p-8 text-center">
        <h2 className="text-xl font-semibold text-bone">
          用这套方法论分析你的问题
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pewter">
          描述你正面临的战略难题，InnoLab 会当场跑一次结构化推演给你看。
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-snow transition hover:bg-ink/90"
          >
            免费推演一次 <span aria-hidden>→</span>
          </Link>
          <Link
            href="/methods"
            className="inline-flex items-center gap-2 rounded-full border border-fog-2 px-5 py-2.5 text-sm font-medium text-pewter transition hover:border-volt/40 hover:text-bone"
          >
            浏览全部 {methods.length} 个方法
          </Link>
        </div>
      </section>
    </div>
  );
}
