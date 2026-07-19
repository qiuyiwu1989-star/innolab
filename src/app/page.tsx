import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { engines, layers } from "@/lib/engines";
import { getAllMethods, type Method } from "@/lib/methods";
import { getAllCases, type CaseDetail } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { getMethodViz } from "@/lib/method-viz";
import { MethodViz } from "@/components/site/method-viz";

// 首页精选可视化（覆盖 哑铃/画布/五力/曲线/旅程/三角 不同图型）
const VIZ_SHOWCASE = [
  "dumbbell-society",
  "bmc",
  "porter-five",
  "kano",
  "customer-journey",
  "people-goods-field",
];

// 首页 demo 三案例 — 选最能体现 InnoLab 深度的近期案例（覆盖战略/组织/产品三领域）
const HOMEPAGE_DEMO_CASE_IDS = ["case-016", "case-018", "case-019"];

// Hero suggestion chips — 点击直通 /demo 并预填问题 + 领域
const SUGGESTIONS: { label: string; q: string; domain: string }[] = [
  {
    label: "IP 变现",
    q: "我该做 IP 产品吗？核心 IP 已经有一些，但还没找到最适合的变现路径。",
    domain: "ip-content",
  },
  {
    label: "AI 转型",
    q: "AI 转型该从哪里开始？我们 100 人公司，想用 AI 提效但不知道切入点。",
    domain: "ai-transform",
  },
  {
    label: "人才组织",
    q: "怎么搭建双轨人才体系？全员 AI 化推了半年，没什么实质进展。",
    domain: "org",
  },
  {
    label: "战略决策",
    q: "守线业务还能赚钱，但攻线新产品没人用——资源该怎么分配，怎么判断要不要继续？",
    domain: "strategy",
  },
];

export default function Home() {
  const methods = getAllMethods();
  const cases = getAllCases();
  const totalMethods = methods.length;
  const demoCases = HOMEPAGE_DEMO_CASE_IDS.map((id) =>
    cases.find((c) => c.id === id),
  ).filter((c): c is CaseDetail => !!c);
  const countsByEngine = engines.map((e) => ({
    ...e,
    count: methods.filter((m) => m.engine === e.key).length,
  }));

  // 拿 6 个 method ID 做 hero 底部 marquee
  const heroIds = ["CG14", "ST06", "ST10", "GN02", "PD10", "EV02", "DC02"];

  return (
    <main className="flex-1">
      {/* ════════════════ 1 · HERO ════════════════ */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        {/* 巨型几何 - 右下角半圆 */}
        <div
          aria-hidden
          className="absolute -right-40 -bottom-40 size-[700px] rounded-full border border-volt/30"
        />
        <div
          aria-hidden
          className="absolute -right-32 -bottom-32 size-[560px] rounded-full border border-fog-2"
        />
        {/* 左上小圆点 */}
        <div className="absolute left-6 top-24 hidden gap-2 text-[11px] font-medium uppercase tracking-widest text-ash sm:flex">
          <span className="size-1.5 translate-y-1 rounded-full bg-volt" />
          <span>Live · v0.1</span>
          <span className="text-dust">·</span>
          <span>{totalMethods} methods loaded</span>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 sm:pb-40 sm:pt-36">
          {/* 主标题 — clamp 全适配 */}
          <h1
            className="display text-bone"
            style={{ fontSize: "clamp(3.25rem, 11vw, 9rem)" }}
          >
            把<span className="text-volt">战略难题</span>，
            <br />
            想透。
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ash sm:text-xl">
            <b className="font-semibold text-bone">邱懿武的方法论</b> ×{" "}
            <b className="font-semibold text-bone">AI 推演引擎</b>。
            <br className="hidden sm:block" />
            86 个方法、76 个真实案例，把模糊的商业难题切准、推演、给出下一步。
            先免费体验，需要时找他本人。
          </p>

          {/* 双 CTA：主=和邱懿武聊聊（咨询变现），次=进入工作台（授权伙伴） */}
          <div className="mt-12 max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/about"
                className="group flex flex-1 items-center justify-between gap-3 rounded-lg border border-volt bg-volt/[0.06] px-5 py-4 transition hover:bg-volt/[0.12]"
              >
                <div className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-volt" />
                  <span className="text-base font-medium text-bone">
                    和邱懿武聊聊你的难题
                  </span>
                </div>
                <ArrowRight className="size-4 text-volt transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/demo"
                className="group flex items-center justify-center gap-2 rounded-lg border border-fog-2 px-5 py-4 text-base text-ash transition hover:border-fog-3 hover:text-bone sm:flex-none"
              >
                免费开一发推演
                <span className="text-xs text-dust">无需暗号</span>
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="py-1 text-xs text-dust">擅长分析：</span>
              {SUGGESTIONS.map((s) => (
                <span
                  key={s.label}
                  className="rounded-full border border-fog-2 px-3 py-1 text-xs text-ash"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 底部 marquee */}
        <div className="relative border-y border-fog-1 bg-ink/60 py-4 mask-fade-x">
          <div className="flex gap-12 marquee whitespace-nowrap font-mono text-xs text-dust">
            {[...heroIds, ...heroIds, ...heroIds, ...heroIds].map((id, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-volt/60" />
                {id}
                <span className="text-fog-3">
                  {methods.find((m) => m.id === id)?.titleCn ?? "—"}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 2 · DEMOS（看一眼能做什么） ════════════════ */}
      <section id="demos" className="border-b border-fog-1 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            kicker="02 · 看一眼能做什么"
            title="它会怎么帮你想？"
            sub="3 个真实问题，看 InnoLab 调用的方法链和它给出的结论。这些已经在 v0.1 的弹药库里。"
          />
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {demoCases.map((c, idx) => (
              <DemoCard key={c.id} c={c} index={idx} methods={methods} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 3 · 弹药库 巨型数据 ════════════════ */}
      <section className="relative border-b border-fog-1 py-24 sm:py-32">
        <div className="absolute inset-0 bg-dots opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6">
          <SectionHead
            kicker="03 · 弹药库"
            title="不是空话。这是支撑 AI 推演的体系。"
            sub="86 个方法论按六大引擎组织，每个方法标注它工作的认知层级。AI 调度它们，你也可以手动浏览。"
          />
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-4">
            <Stat n={totalMethods} l="方法卡" highlight />
            <Stat n={engines.length} l="引擎" />
            <Stat n={5} l="认知层级" />
            <Stat n={cases.length} l="真实案例" />
          </div>

          {/* 每个方法都「一图看懂」—— 精选示例 */}
          <div className="mt-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-bone">
                每个方法，一图看懂
              </h3>
              <Link
                href="/methods"
                className="text-sm text-volt hover:underline"
              >
                浏览全部 83 个 →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {VIZ_SHOWCASE.map((slug) => {
                const m = methods.find((x) => x.slug === slug);
                const viz = getMethodViz(slug);
                if (!m || !viz) return null;
                return (
                  <Link
                    key={slug}
                    href={`/methods/${slug}`}
                    className="group flex flex-col gap-3 rounded-xl border border-fog-2 bg-soot/60 p-4 transition hover:-translate-y-0.5 hover:border-volt"
                  >
                    <div className="h-32 overflow-hidden rounded-md bg-ink/40 p-2 text-dust transition group-hover:text-ash [&_svg]:!h-full [&_svg]:!w-full">
                      <MethodViz spec={viz} bare />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-bone">
                        {m.titleCn}
                      </span>
                      <span className="numeral text-xs text-volt">{m.id}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ 4 · 六大引擎 ════════════════ */}
      <section className="border-b border-fog-1 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            kicker="04 · Six Engines"
            title="六大引擎，串成一条生产线"
            sub="每个引擎解决生产链上一个环节。你卡在哪一环，就调哪一环的方法。"
            link={{ href: "/methods", text: "全部 86 个方法" }}
          />
          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-2 lg:grid-cols-3">
            {countsByEngine.map((e, i) => (
              <Link
                key={e.key}
                href={`/methods/engine/${e.key}`}
                className="group relative flex flex-col gap-3 bg-ink p-8 transition hover:bg-soot"
              >
                <div className="flex items-baseline justify-between">
                  <span className="numeral text-5xl text-bone transition group-hover:text-volt">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="numeral text-xs text-dust">
                    {e.code} · {e.count}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-bone">
                      {e.cn}
                    </h3>
                    <span className="text-xs uppercase tracking-widest text-dust">
                      {e.en}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-ash">{e.oneliner}</div>
                </div>
                <div className="mt-auto text-sm text-dust">{e.role}</div>
                <ArrowUpRight className="absolute right-6 top-6 size-4 text-dust opacity-0 transition group-hover:opacity-100 group-hover:text-volt" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 5 · 五层认知 ════════════════ */}
      <section className="border-b border-fog-1 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            kicker="05 · Five Layers"
            title="同一个问题，你在哪一层回答？"
            sub="L1 看现象，L5 改世界观。每个方法都标注它工作的层级 — 知道层级比记住方法更重要。"
          />
          <ol className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-5">
            {layers.map((l, i) => (
              <li
                key={l.id}
                className="flex flex-col gap-3 bg-ink p-6 transition hover:bg-soot"
              >
                <span
                  className={`numeral text-6xl ${i === 4 ? "text-volt" : "text-bone"}`}
                >
                  {l.id}
                </span>
                <div>
                  <div className="text-sm font-semibold text-bone">{l.name}</div>
                  <div className="mt-1 text-xs text-dust">{l.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ════════════════ 6 · Roadmap ════════════════ */}
      <section className="border-b border-fog-1 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            kicker="06 · 演进路径"
            title="从推演工具走向战略创新智能体"
            sub="InnoLab 每一个版本都在让它更像一个持续陪你思考的伙伴，而不是一次性的问答工具。"
          />
          <ol className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RoadmapCard
              v="v0.1"
              status="live"
              title="推演引擎 · 已上线"
              when="当前"
              items={[
                "86 方法 + 76 案例编入系统提示",
                "多轮会话 · 带着前文判断续问",
                "方法调用链可视化 · 引导追问",
              ]}
            />
            <RoadmapCard
              v="β"
              status="next"
              title="记忆 + 自适应分析"
              when="进行中"
              items={[
                "分析记忆库——你的场景不用重复说",
                "按领域动态注入最相关案例",
                "分析质量数据反哺方法迭代",
              ]}
            />
            <RoadmapCard
              v="v1.0"
              status="vision"
              title="个人化战略伙伴"
              when="2026 Q4"
              items={[
                "私有方法引擎 + 定制 system prompt",
                "团队协作空间 + 分析历史云同步",
                "订阅 / 私有部署 / API 开放",
              ]}
            />
          </ol>
        </div>
      </section>

      {/* ════════════════ 6.5 · 缝合屏：工具的尽头是人 ════════════════ */}
      <section className="relative border-b border-fog-1 py-24 sm:py-32">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <span className="numeral text-xs uppercase tracking-widest text-volt">
            06 / 工具的尽头
          </span>
          <h2 className="display mt-4 text-3xl text-bone sm:text-5xl">
            AI 能帮你想清楚 80%。
            <br />
            最难的那 20%，值得一个人陪你。
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ash">
            InnoLab 把方法论装进 AI，能把大多数问题推演得很到位。
            但真正重大的决策——关乎方向、关乎取舍、关乎赌注——
            需要的不只是一套框架，而是一个有经验的人，带着这套方法陪你把它想到底。
            这正是邱懿武做的事。
          </p>
        </div>
      </section>

      {/* ════════════════ 6.6 · 邱懿武是谁（轻量，跳转 qiuyiwu.com）════════════════ */}
      <section className="border-b border-fog-1 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <span className="numeral text-xs uppercase tracking-widest text-volt">
            07 / 方法论背后的人
          </span>
          <h2 className="display mt-4 text-3xl text-bone sm:text-4xl">
            邱懿武
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ash">
            <p>
              长期从事 AI 创新落地与战略咨询，做过 AIIP、造物云、球球老师 等项目。
              InnoLab 里的 {totalMethods} 个方法和 {cases.length} 个案例，
              都是他在这些真实工作里反复调用、沉淀下来的判断——不是教科书，是打过仗的方法论。
            </p>
            <p className="text-sm text-dust">
              他也把 InnoLab 作为专属工具，交付给正在服务的咨询客户。
            </p>
          </div>
          <a
            href="https://qiuyiwu.com"
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-volt hover:underline"
          >
            完整了解邱懿武 · qiuyiwu.com
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ════════════════ 7 · 联系咨询 ════════════════ */}
      <section
        id="contact"
        className="relative border-b border-fog-1 py-24 sm:py-32"
      >
        <div className="absolute inset-0 bg-grid-dense opacity-40 mask-fade-b" />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <span className="numeral text-xs uppercase tracking-widest text-volt">
            08 · 战略咨询
          </span>
          <h2 className="display mt-4 text-4xl text-bone sm:text-6xl">
            你也面临
            <br />
            一个真正的难题？
          </h2>
          <p className="mt-6 text-base text-ash sm:text-lg">
            InnoLab 让你体验了这套方法论怎么推演。
            <br className="sm:hidden" />
            当问题足够重要、值得一个人陪你想透——
            <br />
            邱懿武提供 1:1 战略咨询，这套智能体是他的交付增强工具。
          </p>
          <div className="mx-auto mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/about"
              className="rounded-full bg-volt px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
            >
              和邱懿武聊聊 →
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-fog-2 px-6 py-3 text-sm font-medium text-ash transition hover:border-bone hover:text-bone"
            >
              免费开一发推演
            </Link>
          </div>
          <p className="mt-4 text-xs text-dust">
            工作台免费试用，多用几次留个联系方式即可；真正值钱的判断在 1:1 咨询。
          </p>
        </div>
      </section>

      {/* Footer 已由全站 layout.tsx 的 <SiteFooter /> 提供 */}
    </main>
  );
}

/* ───────── 子组件 ───────── */

function SectionHead({
  kicker,
  title,
  sub,
  link,
}: {
  kicker: string;
  title: string;
  sub?: string;
  link?: { href: string; text: string };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
      <div className="max-w-2xl">
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          {kicker}
        </div>
        <h2 className="display mt-3 text-3xl text-bone sm:text-5xl">{title}</h2>
        {sub && <p className="mt-4 text-base text-ash sm:text-lg">{sub}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-volt hover:underline"
        >
          {link.text} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function Stat({
  n,
  l,
  highlight = false,
}: {
  n: number;
  l: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 bg-ink p-8 sm:p-12">
      <span
        className={`numeral text-6xl sm:text-7xl ${highlight ? "text-volt" : "text-bone"}`}
      >
        {n}
      </span>
      <span className="text-xs uppercase tracking-widest text-dust">{l}</span>
    </div>
  );
}

function RoadmapCard({
  v,
  status,
  title,
  when,
  items,
}: {
  v: string;
  status: "live" | "next" | "vision";
  title: string;
  when: string;
  items: string[];
}) {
  return (
    <li
      className={`flex flex-col gap-4 rounded-xl border bg-soot p-7 ${
        status === "live"
          ? "border-volt"
          : status === "next"
            ? "border-fog-3"
            : "border-fog-2"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="numeral text-4xl text-bone">{v}</span>
        <Badge variant={status === "live" ? "solid" : "outline"}>
          {status === "live" && "已上线"}
          {status === "next" && "进行中"}
          {status === "vision" && "规划中"}
        </Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-semibold text-bone">{title}</h3>
        <span className="numeral text-xs text-dust">{when}</span>
      </div>
      <ul className="mt-2 space-y-2 text-sm text-ash">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-dust">→</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function DemoCard({
  c,
  index,
  methods,
}: {
  c: CaseDetail;
  index: number;
  methods: Method[];
}) {
  // 把 related_methods 转成方法对象
  const chain = (c.related_methods ?? [])
    .slice(0, 4)
    .map((id) => methods.find((m) => m.id === id))
    .filter((m): m is Method => !!m);

  return (
    <Link
      href={c.file ? `/cases/${c.id}` : "/cases"}
      className="group flex flex-col gap-4 rounded-xl border border-fog-2 bg-soot p-7 transition hover:border-volt hover:bg-graphite"
    >
      <div className="flex items-baseline justify-between">
        <span className="numeral text-sm text-volt">Q.0{index + 1}</span>
        <span className="numeral text-xs text-dust">{c.id}</span>
      </div>

      {/* 问题 */}
      <div>
        <div className="text-xs uppercase tracking-widest text-dust">问题</div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-bone">
          {c.title}
        </h3>
      </div>

      {/* 方法链 */}
      <div>
        <div className="text-xs uppercase tracking-widest text-dust">
          调用方法
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chain.map((m, i) => (
            <span
              key={m.id}
              className="numeral inline-flex items-center gap-1 rounded border border-fog-2 px-2 py-1 text-[11px] text-bone"
            >
              {m.id}
              {i < chain.length - 1 && (
                <span className="ml-1 text-dust">→</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 结论 */}
      <div>
        <div className="text-xs uppercase tracking-widest text-dust">结论</div>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ash">
          {c.analysis_flow?.key_judgment ?? c.insight ?? c.summary}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-1 pt-2 text-sm text-volt">
        看完整推演
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
