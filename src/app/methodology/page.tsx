import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header>
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          Methodology · 方法论体系
        </div>
        <h1 className="display mt-4 text-4xl text-bone sm:text-5xl">
          不是更聪明的 AI，
          <br className="hidden sm:block" />
          是更可靠的思考方式
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ash">
          通用 AI 能给你一段看起来合理的战略建议——但你无法判断它是怎么想出来的、漏了什么。
          InnoLab 不一样：它用 {methods.length}{" "}
          个经过结构化的方法，按明确的逻辑链对你的处境逐步推演，每一步都看得见、可追问、可反驳。
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {[
            `${methods.length} 个方法`,
            `${cases.length} 个实战案例`,
            `${engines.length} 大引擎`,
          ].map((t) => (
            <span
              key={t}
              className="numeral rounded-full border border-fog-2 px-3 py-1 text-ash"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      {/* 六大引擎 */}
      <section className="mt-16">
        <h2 className="display text-2xl text-bone sm:text-3xl">
          {engines.length} 大引擎
        </h2>
        <p className="mt-3 text-ash">
          方法不是散落的工具箱，而是按「思考的不同阶段」组织成 {engines.length}{" "}
          个引擎。一次完整的战略推演，往往跨引擎调用——先认知、再战略、后进化。
        </p>
        <div className="mt-6 space-y-3">
          {[...engines]
            .sort((a, b) => a.order - b.order)
            .map((e) => {
              const count = methods.filter((m) => m.engine === e.key).length;
              return (
                <Link
                  key={e.key}
                  href={`/methods/engine/${e.key}`}
                  className="group block rounded-lg border border-fog-2 bg-soot p-5 transition hover:border-volt hover:bg-graphite"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="numeral inline-flex size-8 items-center justify-center rounded-md border border-fog-2 text-xs text-volt">
                        {e.code}
                      </span>
                      <span className="text-base font-semibold text-bone">
                        {e.cn}引擎
                      </span>
                      <span className="text-xs text-dust">{e.oneliner}</span>
                    </div>
                    <span className="numeral text-xs text-dust">
                      {count} 个方法 →
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ash">
                    {e.description}
                  </p>
                </Link>
              );
            })}
        </div>
      </section>

      {/* 推演五步法 */}
      <section className="mt-16">
        <h2 className="display text-2xl text-bone sm:text-3xl">推演五步法</h2>
        <p className="mt-3 text-ash">
          每一次推演——无论你问的是 AI 转型、品牌定位还是组织冲突——都会走完这五步。
        </p>
        <ol className="mt-6 space-y-5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="numeral shrink-0 text-2xl font-semibold text-volt">
                {s.n}
              </span>
              <div>
                <div className="font-semibold text-bone">{s.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-ash">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 为什么比通用 AI 可靠 */}
      <section className="mt-16 rounded-lg border border-fog-2 bg-soot p-6 sm:p-8">
        <h2 className="display text-2xl text-bone sm:text-3xl">
          为什么不直接问 ChatGPT？
        </h2>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-ash">
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
      <section className="mt-16 rounded-lg border border-fog-2 bg-soot p-8 text-center">
        <h2 className="display text-2xl text-bone sm:text-3xl">
          用这套方法论分析你的问题
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ash">
          描述你正面临的战略难题，InnoLab 会当场跑一次结构化推演给你看。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-full border border-volt px-5 py-2.5 text-sm font-medium text-volt transition hover:bg-volt/10"
          >
            免费推演一次 <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/methods"
            className="inline-flex items-center gap-2 rounded-full border border-fog-2 px-5 py-2.5 text-sm font-medium text-ash transition hover:border-bone hover:text-bone"
          >
            浏览全部 {methods.length} 个方法 <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
