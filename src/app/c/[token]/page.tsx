import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles, Infinity as InfinityIcon } from "lucide-react";
import { getAllMethods } from "@/lib/methods";
import { getCaseIndex } from "@/lib/cases";
import { getClientByToken, getAllClientTokens } from "@/lib/clients";
import { LiveRunner } from "../../demo/live-runner";
import type { MethodMeta } from "@/components/demo/method-chain-viz";

interface Props {
  params: Promise<{ token: string }>;
}

export function generateStaticParams() {
  return getAllClientTokens().map((token) => ({ token }));
}

// 专属页：不进搜索引擎索引（私有交付页）
export const metadata: Metadata = {
  title: "战略推演 · 客户专属",
  robots: { index: false, follow: false },
};

export default async function ClientWorkspacePage({ params }: Props) {
  const { token } = await params;
  const client = getClientByToken(token);
  if (!client) notFound();

  // 与 /demo 相同的数据装配
  const allMethods = getAllMethods();
  const methodsIndex: Record<string, MethodMeta> = Object.fromEntries(
    allMethods.map((m) => [
      m.id,
      {
        id: m.id,
        titleCn: m.titleCn,
        titleEn: m.titleEn,
        engine: m.engine,
        layer: m.layer,
        oneliner: m.oneliner,
        slug: m.slug,
        engineDir: m.engineDir,
      } satisfies MethodMeta,
    ]),
  );
  const casesIndex = getCaseIndex().map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    domain: c.domain,
    related_methods: c.related_methods,
  }));

  return (
    <main className="relative isolate flex-1">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div
        aria-hidden
        className="absolute -left-32 top-40 size-[500px] rounded-full border border-volt/20"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/40 bg-volt/[0.05] px-3 py-1.5 text-[11px] font-medium text-volt">
            <Sparkles className="size-3.5" />
            <span>{client.name} · 战略咨询专属</span>
          </div>
          <h1
            className="display mt-6 text-bone"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            你的专属
            <br />
            <span className="text-volt">战略推演</span>
            <br />
            工作台。
          </h1>
          <p className="mt-6 max-w-xl text-base text-ash sm:text-lg">
            这是邱懿武为 <b className="font-semibold text-bone">{client.name}</b>{" "}
            开通的专属推演工作台——把咨询中梳理的方法论随时自助调用，对你团队的真实决策做结构化推演。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-dust">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-volt" />
              MiMo v2.5 Pro
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 text-volt">
              <InfinityIcon className="size-3.5" /> 专属不限次
            </span>
            <span>·</span>
            <span>83 方法 + 76 案例 · 多轮会话</span>
          </div>
        </header>

        <div className="mt-12">
          <LiveRunner
            methodsIndex={methodsIndex}
            casesIndex={casesIndex}
            clientToken={token}
          />
        </div>

        <footer className="mt-20 rounded-xl border border-fog-2 bg-soot p-6 text-sm text-ash">
          <h3 className="text-base font-semibold text-bone">
            这是 {client.name} 的专属工作台
          </h3>
          <p className="mt-3 leading-relaxed">
            作为邱懿武战略咨询的交付增强工具，本工作台不限推演次数。
            推演结果可复制、分享、收藏。如需把贵司的业务背景预置进推演上下文，或有任何使用问题，
            直接联系邱懿武。
          </p>
        </footer>
      </div>
    </main>
  );
}
