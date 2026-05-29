import type { Metadata } from "next";
import Link from "next/link";
import { Github, Mail, ArrowRight, ArrowUpRight } from "lucide-react";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";
import { engines } from "@/lib/engines";

export const metadata: Metadata = {
  title: "关于",
  description:
    "InnoLab 由邱懿武创建——83 个方法论 + 36 个真实案例的战略推演引擎。多轮追问、方法链可视化、越用越懂你。",
};

// 方法论的源头（来自 SKILL.md 中的体系）— 比假书名诚实
const INFLUENCES = [
  {
    name: "蓝海战略",
    en: "Blue Ocean",
    note: "价值创新打破价值-成本权衡",
  },
  {
    name: "第一性原理",
    en: "First Principles",
    note: "回到行业本质重新推导",
  },
  {
    name: "范式转移",
    en: "Paradigm Shift",
    note: "识别底层规则的代际变化",
  },
  {
    name: "设计思维",
    en: "Design Thinking",
    note: "从真实用户场景反推产品",
  },
];

export default function AboutPage() {
  const totalMethods = getAllMethods().length;
  const totalCases = getAllCases().length;

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      {/* —— Hero —— */}
      <header>
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          About · 关于 InnoLab
        </div>
        <h1 className="display mt-3 text-4xl text-bone sm:text-6xl">
          一个把方法论
          <br />
          编排成生产线的人。
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ash">
          InnoLab 由
          <strong className="font-semibold text-bone">邱懿武</strong>
          创建。这个网站是他十年战略 / 产品 / 认知方法论实践的在线版本，
          也是一个进化中的 AI 战略咨询师。
        </p>
        <p className="mt-3 text-sm text-dust">
          邱懿武的其他工作：
          <a
            href="https://qiuyiwu.com"
            target="_blank"
            rel="noopener"
            className="ml-1 inline-flex items-baseline gap-0.5 text-ash transition hover:text-volt"
          >
            qiuyiwu.com
            <span className="inline-block size-1 translate-y-[-2px] rounded-full bg-volt" />
          </a>
        </p>
      </header>

      {/* —— 数据 —— */}
      <section className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-4">
        <Stat n={totalMethods} l="方法卡" />
        <Stat n={engines.length} l="引擎" />
        <Stat n={5} l="认知层级" />
        <Stat n={totalCases} l="真实案例" />
      </section>

      {/* —— InnoLab 这个项目本身 —— */}
      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          The Project
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          这个网站做什么用
        </h3>
        <div className="mt-6 space-y-4 leading-relaxed text-ash">
          <p>
            InnoLab 不是一个方法论的清单，是一台
            <strong className="font-semibold text-bone">战略推演引擎</strong>
            ——把模糊的商业问题切准、调用相关方法链、给出具体下一步动作。
            和普通 AI 问答不同，它遵循的是<strong className="font-semibold text-bone">智能体的逻辑</strong>：
            多轮追问、带着前文判断续问、方法调用链可视化、越用越懂你的场景。
          </p>
          <p>
            收录的{" "}
            <Link
              href="/cases"
              className="text-volt underline decoration-volt/30 underline-offset-2 hover:decoration-volt"
            >
              {totalCases} 个真实案例
            </Link>
            横跨 AI 转型、战略决策、IP 变现、组织激励、产品增长、消费品牌、制造业、创业融资等多个领域——
            从 B2B SaaS 出海选市场、制造业 AI 工具落地失败，到新消费爆品品牌化、
            融资被拒后的叙事重建，到销售激励失效、播客变现路线。
            这些案例不是营销素材，是真实做过的判断。
          </p>
          <p>
            InnoLab 把这些工作里反复被调用到的 {totalMethods} 个方法论沉淀下来，
            按六大引擎组织，让其他在做类似抉择的人也能用。
            每一次分析都让引擎变得更准——这是它与静态知识库的本质区别。
          </p>
        </div>
      </section>

      {/* —— About Qiu（简洁，待主人续写）—— */}
      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          About Qiu
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          关于邱懿武
        </h3>
        <div className="mt-6 space-y-4 leading-relaxed text-ash">
          <p>
            长期从事 AI 创新落地与战略咨询。在做 AIIP、造物云、球球老师 等项目过程中，
            把反复被调用的方法论沉淀成 InnoLab。
          </p>
          <p>
            <span className="text-dust">
              详细个人介绍请见{" "}
              <a
                href="https://qiuyiwu.com"
                target="_blank"
                rel="noopener"
                className="text-ash underline decoration-fog-3 underline-offset-2 transition hover:text-volt hover:decoration-volt"
              >
                qiuyiwu.com
              </a>
              。
            </span>
          </p>
        </div>
      </section>

      {/* —— 方法论的源头（替代假书名）—— */}
      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          Roots
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          方法论的源头
        </h3>
        <p className="mt-2 text-sm text-dust">
          InnoLab 的 83 个方法吸收了若干思想脉络。下面是影响最大的四条主线。
        </p>
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-2">
          {INFLUENCES.map((b, i) => (
            <div key={b.name} className="bg-ink p-6">
              <div className="numeral text-xs text-dust">
                Root {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-semibold text-bone">
                  {b.name}
                </span>
                <span className="numeral text-[10px] uppercase tracking-widest text-dust">
                  {b.en}
                </span>
              </div>
              <div className="mt-1 text-sm text-ash">{b.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* —— Roadmap —— 演进路径 —— */}
      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          Roadmap · 演进路径
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          从推演工具走向战略创新智能体
        </h3>
        <p className="mt-2 text-sm text-dust">
          每一个版本都让 InnoLab 更像一个持续陪你思考的伙伴，而不是一次性问答工具。
        </p>
        <ol className="mt-8 space-y-3">
          <Phase
            v="v0.1"
            title="推演引擎 + 多轮会话"
            status="live"
            when="2026 Q2 · 当前"
            note="83 方法 + 49 案例 / 多轮追问 / 方法链可视化 / 首次访客引导"
          />
          <Phase
            v="β"
            title="记忆 + 自适应分析"
            status="next"
            when="进行中"
            note="分析记忆库（你的场景不用重复说）/ 领域自适应案例注入 / 输出质量数据反哺"
          />
          <Phase
            v="v1.0"
            title="个人化战略伙伴"
            status="vision"
            when="2026 Q4"
            note="私有方法引擎 / 团队协作 / 云同步 / 订阅 / API"
          />
        </ol>
      </section>

      {/* —— 联系 —— */}
      <section className="mt-16 rounded-xl border border-volt bg-volt/[0.04] p-8">
        <h2 className="display text-2xl text-bone sm:text-3xl">和我聊聊</h2>
        <p className="mt-3 text-ash">
          做产品 / 创业 / 教育，InnoLab 对你有用，或想合作搭 v1.0 —— 找邱懿武。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://qiuyiwu.com"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-md bg-volt px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            qiuyiwu.com
            <ArrowUpRight className="size-4" />
          </a>
          <a
            href="https://github.com/qiuyiwu1989-star/innolab"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            试用 InnoLab <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-6 text-xs text-dust">
          InnoLab 是邱懿武的工作之一。其他工作和联系方式在{" "}
          <a
            href="https://qiuyiwu.com"
            target="_blank"
            rel="noopener"
            className="text-ash underline decoration-fog-3 underline-offset-2 hover:text-volt hover:decoration-volt"
          >
            qiuyiwu.com
          </a>
          。
        </p>
      </section>
    </article>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="bg-ink p-6 text-center">
      <div className="numeral text-4xl text-bone">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-dust">
        {l}
      </div>
    </div>
  );
}

function Phase({
  v,
  title,
  status,
  when,
  note,
}: {
  v: string;
  title: string;
  status: "live" | "next" | "vision";
  when: string;
  note?: string;
}) {
  return (
    <li className="rounded-lg border border-fog-2 bg-soot p-5">
      <div className="flex items-center gap-5">
        <span
          className={`numeral text-2xl ${status === "live" ? "text-volt" : "text-bone"}`}
        >
          {v}
        </span>
        <span className="text-lg font-semibold text-bone">{title}</span>
        <span className="numeral ml-auto text-xs text-dust">{when}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            status === "live"
              ? "bg-volt text-ink"
              : status === "next"
                ? "border border-fog-3 text-bone"
                : "border border-fog-2 text-dust"
          }`}
        >
          {status === "live" && "已上线"}
          {status === "next" && "进行中"}
          {status === "vision" && "规划中"}
        </span>
      </div>
      {note && <p className="mt-3 ml-12 text-sm text-ash">{note}</p>}
    </li>
  );
}
