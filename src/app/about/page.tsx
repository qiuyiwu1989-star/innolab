import type { Metadata } from "next";
import Link from "next/link";
import { Book, Github, Mail, ArrowRight, Sparkles } from "lucide-react";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";
import { engines } from "@/lib/engines";

export const metadata: Metadata = {
  title: "关于",
  description:
    "InnoLab 由邱懿武创建，集成了他在战略、产品、认知三个领域 10 年实践的方法论体系。",
};

const BOOKS = [
  { title: "（书名 1）", desc: "占位 — 你来填副标题或一句话介绍" },
  { title: "（书名 2）", desc: "占位 — 你来填副标题或一句话介绍" },
  { title: "（书名 3）", desc: "占位 — 你来填副标题或一句话介绍" },
  { title: "（书名 4）", desc: "占位 — 你来填副标题或一句话介绍" },
  { title: "（书名 5）", desc: "占位 — 你来填副标题或一句话介绍" },
];

const ROADMAP = [
  {
    version: "v0.1",
    status: "live",
    title: "知识库站",
    items: [
      "74 个方法卡 + 10 个真实案例",
      "六大引擎 / 五层认知的导航",
      "方法 ↔ 案例 双向联动",
    ],
  },
  {
    version: "v0.5",
    status: "next",
    title: "方法地图",
    items: [
      "方法关系图谱可视化（前置/后续/并行）",
      "CMD+K 全局命令面板",
      "暗色模式 + Mobile 精修",
      "案例库持续扩充至 50+",
    ],
  },
  {
    version: "v1.0",
    status: "vision",
    title: "AI 分析引擎（SaaS）",
    items: [
      "输入一个真实问题，自动编排方法",
      "多方案生成 + 决策筛选 + 产品定义",
      "私有记忆库：你的分析档案",
      "账号、订阅、用量统计",
    ],
  },
];

export default function AboutPage() {
  const totalMethods = getAllMethods().length;
  const totalCases = getAllCases().length;

  return (
    <article className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      {/* Hero */}
      <header>
        <div className="text-xs font-medium uppercase tracking-wider text-ink/40">
          About · 关于 InnoLab
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          一个把方法论
          <br />
          编排成生产线的人
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink/75">
          InnoLab 由
          <strong className="font-semibold text-ink">邱懿武</strong>
          创建。这个网站是他十年战略 / 产品 / 认知方法论实践的
          <strong className="font-semibold text-ink">在线版</strong>
          ，同时是一个进化中的 AI 分析系统。
        </p>
      </header>

      {/* 数据骨感 */}
      <section className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat n={totalMethods} l="方法卡" />
        <Stat n={engines.length} l="引擎" />
        <Stat n={5} l="认知层级" />
        <Stat n={totalCases} l="真实案例" />
      </section>

      {/* 邱懿武 */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">关于邱懿武</h2>
        <p className="mt-4 leading-relaxed text-ink/80">
          <span className="rounded bg-flare/15 px-1.5 text-flare">
            [占位文本]
          </span>{" "}
          这里写你自己想说的——背景、当下在做什么、为什么做 InnoLab。
          建议覆盖：教育/工作背景、目前的角色（创始人/教授/独立顾问/etc）、
          InnoLab 的来历（解决了你自己什么问题）、
          联系方式（公众号/微信/邮箱）。
        </p>
        <p className="mt-4 leading-relaxed text-ink/80">
          <span className="rounded bg-flare/15 px-1.5 text-flare">
            [占位文本]
          </span>{" "}
          第二段：你的方法论体系是怎么形成的——
          来自哪些行业实践、影响最大的几个思想（如蓝海 / 第一性原理 /
          范式转移）、 为什么坚持"中文为主、英文为辅"。
        </p>
      </section>

      {/* 五部著作 */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Book className="size-6 text-cobalt" />
          五部著作
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          [占位] InnoLab 的方法论体系直接来自这五本书。你来填具体书名 + 副标题。
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BOOKS.map((b, i) => (
            <div
              key={i}
              className="rounded-2xl border border-mist bg-white p-5"
            >
              <div className="font-mono text-xs text-ink/40">
                Book {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-1.5 text-lg font-semibold">{b.title}</div>
              <div className="mt-1 text-sm text-ink/60">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 项目愿景 / Roadmap */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="size-6 text-flare" />
          路线图：从知识库到 SaaS
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          这个网站不是终态。它是从「方法论清单」走向「AI 分析师」的中转站。
        </p>
        <ol className="mt-8 space-y-4">
          {ROADMAP.map((r) => (
            <li
              key={r.version}
              className="relative rounded-2xl border border-mist bg-white p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
                    r.status === "live"
                      ? "bg-acid text-acid-ink"
                      : r.status === "next"
                        ? "bg-cobalt text-paper"
                        : "border border-ink/20 text-ink/60"
                  }`}
                >
                  {r.version}
                </span>
                <span className="text-lg font-semibold">{r.title}</span>
                {r.status === "live" && (
                  <span className="text-xs text-ink/40">已上线</span>
                )}
                {r.status === "next" && (
                  <span className="text-xs text-cobalt">进行中</span>
                )}
                {r.status === "vision" && (
                  <span className="text-xs text-ink/40">规划中</span>
                )}
              </div>
              <ul className="mt-3 ml-1 space-y-1.5 text-sm text-ink/75">
                {r.items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink/30">·</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* 联系 + 开源 */}
      <section className="mt-16 rounded-2xl bg-ink p-8 text-paper">
        <h2 className="text-2xl font-bold">和我聊聊</h2>
        <p className="mt-3 text-paper/70">
          如果你在做产品 / 创业 / 教育，InnoLab 对你有用，或者你想合作搭 v1.0
          的 AI 分析引擎，欢迎联系。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://github.com/qiuyiwu1989-star/innolab"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-acid"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <a
            href="mailto:hi@example.com"
            className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-2.5 text-sm font-medium transition hover:border-paper"
          >
            <Mail className="size-4" />
            邮箱（占位 — 你来换）
          </a>
          <Link
            href="/methods"
            className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-5 py-2.5 text-sm font-medium transition hover:border-paper"
          >
            浏览方法库 <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-2xl border border-mist bg-white p-5 text-center">
      <div className="font-mono text-3xl font-bold tracking-tight">{n}</div>
      <div className="mt-1 text-xs text-ink/60">{l}</div>
    </div>
  );
}
