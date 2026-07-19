import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { McpConnect } from "@/components/site/mcp-connect";

export const metadata: Metadata = {
  title: "MCP 对接指南",
  description:
    "把 InnoLab 的战略推演能力（6 引擎 86 方法）作为 MCP 接入任何 agent——一个 URL 就能调用。",
};

// 5 个工具的展示清单（与 src/lib/mcp/tools.ts 对应）
const TOOLS = [
  {
    name: "innolab_analyze",
    desc: "核心：用 86 方法体系对一个战略/产品/组织难题做深度推演，返回顾问级报告。支持指定强调的方法、为某客户定制。每次调用自动沉淀回飞轮。",
    write: true,
  },
  {
    name: "innolab_list_methods",
    desc: "列 / 筛 86 个方法（id · 标题 · 引擎 · 层级 · 一句话）。",
    write: false,
  },
  {
    name: "innolab_get_method",
    desc: "取某方法的完整卡片 + 人类讲解版。",
    write: false,
  },
  {
    name: "innolab_list_cases",
    desc: "列 / 筛案例库（按方法 / 领域 / 关键词），含真实性标注。",
    write: false,
  },
  {
    name: "innolab_sediment",
    desc: "把外部洞察 / 新案例沉淀回飞轮（候选，待人工晋升）。",
    write: true,
  },
];

const NOTES = [
  {
    t: "推演是「慢而深」的调用",
    d: "一发深度推演约 1–3 分钟（生成数千字 + 自动联网）。端点走 SSE 流式、每 10 秒吐一次进度，支持流式的客户端（含 Claude）不会超时；若某客户端有硬性短超时，把它的工具超时调大即可。",
  },
  {
    t: "越用越聪明",
    d: "每次 analyze 调用都会沉淀回数据飞轮——机器调用也在给 InnoLab 喂燃料，不再只靠真人来网站。",
  },
  {
    t: "私有优先",
    d: "没有正确的 key，端点返回 503 / 401，绝不默认开放。key 只存在服务器，第一批调用者是你自己的生态（你的 Claude、deepagent、造物云项目）。",
  },
];

export default function McpGuidePage() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      {/* —— Hero —— */}
      <header>
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          MCP · 对接指南
        </div>
        <h1 className="display mt-3 text-4xl text-bone sm:text-5xl">
          把 InnoLab 接进
          <br />
          任何 agent。
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ash">
          InnoLab 真正的资产不是这个网站，是那套{" "}
          <strong className="font-semibold text-bone">6 引擎 86 方法的战略推演能力</strong>
          。通过 MCP，这套能力从界面里解耦出来，变成一个
          <strong className="font-semibold text-bone">可被任何 agent 用 URL 调用的原语</strong>
          ——你自己的 Claude、deepagent、其它项目，都能直接调用你的战略推演大脑。
        </p>
        <p className="mt-3 font-mono text-sm text-dust">
          端点 · <span className="text-ash">https://innolab.cc/mcp</span>{" "}
          （Streamable HTTP · JSON-RPC 2.0）
        </p>
      </header>

      {/* —— 对接助手 —— */}
      <section className="mt-14">
        <h2 className="display text-2xl text-bone">三步接上</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dust">
          粘贴你的 key，下面的连接串会在本地自动拼好、可一键复制。key 不会离开你的浏览器。
        </p>
        <div className="mt-6">
          <McpConnect />
        </div>
      </section>

      {/* —— 5 个工具 —— */}
      <section className="mt-16">
        <h2 className="display text-2xl text-bone">能调用什么</h2>
        <p className="mt-2 text-sm text-dust">连上后，agent 会看到这 5 个工具：</p>
        <ul className="mt-6 space-y-px overflow-hidden rounded-xl border border-fog-2">
          {TOOLS.map((tool) => (
            <li
              key={tool.name}
              className="bg-soot/40 p-4 sm:flex sm:items-baseline sm:gap-5"
            >
              <div className="flex shrink-0 items-center gap-2 sm:w-56">
                <code className="font-mono text-sm text-volt">{tool.name}</code>
                <span
                  className={`numeral rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                    tool.write
                      ? "border border-fog-3 text-dust"
                      : "border border-fog-2 text-dust/70"
                  }`}
                >
                  {tool.write ? "写" : "只读"}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ash sm:mt-0">
                {tool.desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* —— 注意 —— */}
      <section className="mt-16">
        <h2 className="display text-2xl text-bone">几件要知道的事</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {NOTES.map((n) => (
            <div
              key={n.t}
              className="rounded-xl border border-fog-2 bg-soot/40 p-5"
            >
              <h3 className="font-semibold text-bone">{n.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">{n.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* —— footer link —— */}
      <div className="mt-16 border-t border-fog-2 pt-8">
        <Link
          href="/methods"
          className="group inline-flex items-center gap-2 text-sm text-dust transition-colors hover:text-volt"
        >
          先看看能调用的 86 个方法
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}
