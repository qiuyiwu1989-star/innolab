import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  readRecentEvents,
  bucketByDay,
  bucketByDomain,
  uniqueIps,
  eventsInLast,
} from "@/lib/event-logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats · 内部",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

const DAY = 24 * 60 * 60 * 1000;

const DOMAIN_LABELS: Record<string, string> = {
  "ai-transform": "AI 转型",
  product: "产品",
  "ip-content": "IP / 内容",
  org: "组织",
  strategy: "战略",
  free: "自由输入",
  all: "未指定",
  unknown: "未知",
};

export default async function AdminStatsPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const required = process.env.INNOLAB_ADMIN_TOKEN;

  // 没设环境变量时直接拒绝访问（避免误开放）
  if (!required) {
    return (
      <Locked
        msg="未配置 INNOLAB_ADMIN_TOKEN — 在服务器 .env.local 加这一行后重启 pm2。"
        hint="export INNOLAB_ADMIN_TOKEN=<任意随机字符串>"
      />
    );
  }

  if (token !== required) {
    return (
      <Locked
        msg="请在 URL 加 ?token=... 通过验证。"
        hint="https://innolab.qiuyiwu.com/admin/stats?token=<your-token>"
      />
    );
  }

  // 通过验证 — 读日志 + 聚合
  const { events, source } = readRecentEvents();
  const last24h = eventsInLast(events, DAY);
  const last7d = eventsInLast(events, 7 * DAY);
  const byDay = bucketByDay(last7d);
  const byDomain = bucketByDomain(last7d);
  const ipsToday = uniqueIps(last24h);
  const ips7d = uniqueIps(last7d);
  const blockedToday = last24h.filter((e) => e.allowed === false).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-12">
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          Internal · Stats
        </div>
        <h1 className="display mt-3 text-4xl text-bone sm:text-5xl">
          运营数据
        </h1>
        <p className="mt-3 text-sm text-ash">
          基于 pm2 logs 实时聚合。{" "}
          {source ? (
            <span className="text-dust">来源 {source}</span>
          ) : (
            <span className="text-rose-400">⚠ 没找到日志文件</span>
          )}
        </p>
      </header>

      {/* 总览 */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-4">
        <Stat n={last24h.length} l="今日请求" />
        <Stat n={ipsToday} l="今日独立用户" />
        <Stat n={blockedToday} l="今日被限流" highlight={blockedToday > 0} />
        <Stat n={ips7d} l="近 7 天独立用户" />
      </section>

      {/* 按领域分布 */}
      <section className="mt-12">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          By Domain · 近 7 天
        </h2>
        <h3 className="display mt-2 text-2xl text-bone sm:text-3xl">
          流量真实分布
        </h3>
        <p className="mt-2 text-sm text-dust">
          这是判断 InnoLab 真实 wedge 的最硬数据。哪个领域被点最多 = 用户告诉你的答案。
        </p>
        <div className="mt-6 space-y-2">
          {byDomain.length === 0 ? (
            <EmptyState msg="还没有事件 — 让别人去 /demo 跑几次再看" />
          ) : (
            byDomain.map((d) => {
              const max = byDomain[0].count;
              const pct = max ? (d.count / max) * 100 : 0;
              return (
                <div
                  key={d.domain}
                  className="flex items-center gap-3 rounded-md border border-fog-2 bg-soot px-4 py-3"
                >
                  <div className="w-28 shrink-0 text-sm text-bone">
                    {DOMAIN_LABELS[d.domain] ?? d.domain}
                  </div>
                  <div className="relative flex-1 h-2 rounded-full bg-fog-2 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-volt"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="numeral w-12 text-right text-sm text-bone">
                    {d.count}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 按日时序 */}
      <section className="mt-12">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          By Day · 近 7 天
        </h2>
        <h3 className="display mt-2 text-2xl text-bone sm:text-3xl">
          每日请求量
        </h3>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {byDay.length === 0 ? (
            <EmptyState msg="还没数据" />
          ) : (
            byDay.map((d) => (
              <div
                key={d.date}
                className="rounded-md border border-fog-2 bg-soot p-3"
              >
                <div className="numeral text-[10px] text-dust">
                  {d.date.slice(5)}
                </div>
                <div className="numeral mt-1 text-2xl text-bone">
                  {d.total}
                </div>
                <div className="mt-1 text-[11px] text-ash">
                  <span className="text-volt">{d.allowed}</span>
                  {d.blocked > 0 && (
                    <span className="ml-2 text-rose-400">
                      ✕{d.blocked}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 最近事件 raw */}
      <section className="mt-12">
        <h2 className="numeral text-xs uppercase tracking-widest text-volt">
          Recent Events
        </h2>
        <h3 className="display mt-2 text-2xl text-bone sm:text-3xl">
          最近 20 条
        </h3>
        <div className="mt-6 overflow-x-auto rounded-lg border border-fog-2">
          <table className="w-full text-sm">
            <thead className="bg-soot">
              <tr className="text-left text-[11px] uppercase tracking-widest text-dust">
                <th className="px-3 py-2">时间</th>
                <th className="px-3 py-2">领域</th>
                <th className="px-3 py-2">来源</th>
                <th className="px-3 py-2">长度</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">允许</th>
              </tr>
            </thead>
            <tbody>
              {last7d
                .slice(-20)
                .reverse()
                .map((e, i) => (
                  <tr key={i} className="border-t border-fog-1 text-ash">
                    <td className="numeral px-3 py-2 text-[11px]">
                      {e.ts.slice(11, 19)}
                    </td>
                    <td className="px-3 py-2 text-bone">
                      {DOMAIN_LABELS[e.domain ?? ""] ?? e.domain ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {DOMAIN_LABELS[e.source ?? ""] ?? e.source ?? "—"}
                    </td>
                    <td className="numeral px-3 py-2 text-right">
                      {e.prompt_length ?? "—"}
                    </td>
                    <td className="numeral px-3 py-2 text-[11px] text-dust">
                      {e.ip_hash?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {e.allowed === false ? (
                        <span className="text-rose-400">✕</span>
                      ) : (
                        <span className="text-volt">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              {last7d.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-dust">
                    暂无事件
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-12 rounded-lg border border-fog-2 bg-soot p-5 text-xs text-dust">
        <p>
          这个面板只读 pm2 stdout 的结构化 JSON 事件，没有数据库依赖。
          要做更复杂的分析（cohort / funnel），把事件转发到 PostHog 即可
          —— innolab-engine.ts 的 logEvent 换成 posthog.capture，字段名保持一致。
        </p>
        <p className="mt-2">
          token 配置在服务器 <code className="text-ash">.env.local</code> 的{" "}
          <code className="text-ash">INNOLAB_ADMIN_TOKEN</code>。
        </p>
      </footer>
    </main>
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
    <div className="bg-ink p-6 text-center">
      <div
        className={`numeral text-4xl ${highlight ? "text-rose-400" : "text-bone"}`}
      >
        {n}
      </div>
      <div className="mt-1 text-xs uppercase tracking-widest text-dust">
        {l}
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border border-dashed border-fog-2 bg-soot p-8 text-center text-sm text-dust">
      {msg}
    </div>
  );
}

function Locked({ msg, hint }: { msg: string; hint: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-32 text-center">
      <div className="numeral text-xs uppercase tracking-widest text-volt">
        Internal · Locked
      </div>
      <h1 className="display mt-4 text-4xl text-bone sm:text-5xl">
        🔒 Stats 受保护
      </h1>
      <p className="mt-6 text-sm text-ash">{msg}</p>
      <code className="mt-4 block rounded border border-fog-2 bg-soot px-3 py-2 text-xs text-ash">
        {hint}
      </code>
      <p className="mt-8 text-xs text-dust">
        <Link href="/" className="text-volt underline">
          回首页
        </Link>
      </p>
    </main>
  );
}
