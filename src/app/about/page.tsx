import type { Metadata } from "next";
import Link from "next/link";
import { Github, Mail, ArrowRight } from "lucide-react";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";
import { engines } from "@/lib/engines";

export const metadata: Metadata = {
  title: "关于",
  description:
    "InnoLab 由邱懿武创建，集成了他在战略、产品、认知三个领域 10 年实践的方法论体系。",
};

const BOOKS = [
  { title: "（书名 1）", desc: "占位 — 你填副标题" },
  { title: "（书名 2）", desc: "占位 — 你填副标题" },
  { title: "（书名 3）", desc: "占位 — 你填副标题" },
  { title: "（书名 4）", desc: "占位 — 你填副标题" },
  { title: "（书名 5）", desc: "占位 — 你填副标题" },
];

export default function AboutPage() {
  const totalMethods = getAllMethods().length;
  const totalCases = getAllCases().length;

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
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

      <section className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-4">
        <Stat n={totalMethods} l="方法卡" />
        <Stat n={engines.length} l="引擎" />
        <Stat n={5} l="层级" />
        <Stat n={totalCases} l="案例" />
      </section>

      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          About Qiu
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          关于邱懿武
        </h3>
        <div className="mt-6 space-y-4 leading-relaxed text-ash">
          <p>
            <span className="rounded bg-volt/15 px-1.5 py-0.5 text-volt">
              [占位文本]
            </span>{" "}
            这里写你自己想说的——背景、当下在做什么、为什么做
            InnoLab。建议覆盖：教育/工作背景、目前的角色（创始人 / 教授 /
            独立顾问 / etc）、InnoLab 的来历（解决了你自己什么问题）、
            联系方式（公众号 / 微信 / 邮箱）。
          </p>
          <p>
            <span className="rounded bg-volt/15 px-1.5 py-0.5 text-volt">
              [占位文本]
            </span>{" "}
            第二段：你的方法论体系怎么形成的—— 来自哪些行业实践、影响最大的几个思想（如蓝海 / 第一性原理 /
            范式转移）、为什么坚持"中文为主、英文为辅"。
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          Five Books
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          五部著作
        </h3>
        <p className="mt-2 text-sm text-dust">
          [占位] InnoLab 的方法论体系直接来自这五本书。你填具体书名 + 副标题。
        </p>
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-2">
          {BOOKS.map((b, i) => (
            <div key={i} className="bg-ink p-6">
              <div className="numeral text-xs text-dust">
                Book {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-lg font-semibold text-bone">
                {b.title}
              </div>
              <div className="mt-1 text-sm text-ash">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          Roadmap
        </h2>
        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          路线图：从知识库到 SaaS
        </h3>
        <ol className="mt-8 space-y-3">
          <Phase v="v0.1" title="弹药库" status="live" when="Now" />
          <Phase v="v0.5" title="方法地图" status="next" when="2026 Q3" />
          <Phase v="v1.0" title="AI 战略咨询师" status="vision" when="2026 Q4" />
        </ol>
      </section>

      <section className="mt-16 rounded-xl border border-volt bg-volt/[0.04] p-8">
        <h2 className="display text-2xl text-bone sm:text-3xl">和我聊聊</h2>
        <p className="mt-3 text-ash">
          做产品 / 创业 / 教育，InnoLab 对你有用，或想合作搭 v1.0 — 联系。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://github.com/qiuyiwu1989-star/innolab"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-md bg-volt px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <a
            href="mailto:hi@example.com"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            <Mail className="size-4" />
            邮箱（占位 — 你填）
          </a>
          <Link
            href="/methods"
            className="inline-flex items-center gap-2 rounded-md border border-fog-3 px-5 py-2.5 text-sm font-medium text-bone transition hover:border-volt"
          >
            浏览方法库 <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-6 text-xs text-dust">
          InnoLab 是邱懿武的工作之一。其他工作在{" "}
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
}: {
  v: string;
  title: string;
  status: "live" | "next" | "vision";
  when: string;
}) {
  return (
    <li className="flex items-center gap-5 rounded-lg border border-fog-2 bg-soot p-5">
      <span
        className={`numeral text-2xl ${status === "live" ? "text-volt" : "text-bone"}`}
      >
        {v}
      </span>
      <span className="text-lg font-semibold text-bone">{title}</span>
      <span className="numeral text-xs text-dust">{when}</span>
      <span
        className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${
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
    </li>
  );
}
