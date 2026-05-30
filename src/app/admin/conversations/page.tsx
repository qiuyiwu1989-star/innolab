import {
  readRecentConversations,
  conversationStats,
  candidateTsSet,
  candidateCount,
} from "@/lib/conversation-log";
import { MarkCandidate } from "@/components/admin/mark-candidate";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "innolab-admin";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminConversationsPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (token !== ADMIN_TOKEN) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-semibold text-bone">需要管理员令牌</h1>
        <p className="mt-3 text-sm text-ash">
          访问{" "}
          <code className="text-volt">
            /admin/conversations?token=YOUR_TOKEN
          </code>
        </p>
      </main>
    );
  }

  const stats = conversationStats();
  const recent = readRecentConversations(80);
  const candidates = candidateTsSet();
  const candTotal = candidateCount();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="display text-3xl text-bone">InnoLab · 对话飞轮</h1>
      <p className="mt-2 text-sm text-dust">
        真实推演记录 · 用于懂用户画像 / 迭代引擎 / 沉淀案例 ·{" "}
        {new Date().toLocaleString("zh-CN")}
      </p>

      {/* 概览 */}
      <section className="mt-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fog-2 bg-fog-2 sm:grid-cols-4">
          <Stat label="总对话数" value={stats.total} />
          <Stat label="领域数" value={Object.keys(stats.byDomain).length} />
          <Stat label="授权方数" value={Object.keys(stats.byLabel).length} />
          <Stat label="候选案例" value={candTotal} />
        </div>
      </section>

      {/* 按领域 / 授权方分布 */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Distribution title="按领域" data={stats.byDomain} />
        <Distribution title="按授权方" data={stats.byLabel} />
      </section>

      {/* 最近对话 */}
      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-dust">
          最近 {recent.length} 条
        </h2>
        <div className="mt-3 space-y-3">
          {recent.length === 0 && (
            <p className="rounded-lg border border-fog-2 bg-soot p-6 text-sm text-dust">
              还没有对话记录。授权用户在 /demo 跑过推演后，这里会开始积累飞轮燃料。
            </p>
          )}
          {recent.map((r, i) => (
            <details
              key={i}
              className="group rounded-lg border border-fog-2 bg-soot p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-dust">
                  <span className="rounded border border-volt/30 bg-volt/[0.06] px-1.5 py-0.5 text-volt">
                    {r.access_label}
                  </span>
                  <span className="rounded border border-fog-2 px-1.5 py-0.5">
                    {r.domain}
                  </span>
                  {r.is_follow_up && (
                    <span className="rounded border border-fog-2 px-1.5 py-0.5">
                      续问{r.follow_up_kind ? `·${r.follow_up_kind}` : ""}
                    </span>
                  )}
                  <span className="numeral ml-auto">
                    {new Date(r.ts).toLocaleString("zh-CN")}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-medium text-bone">
                  {r.prompt}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-dust">
                  <span>output {r.output_length} 字 · 点击展开完整推演</span>
                  <span className="ml-auto" onClick={(e) => e.preventDefault()}>
                    <MarkCandidate
                      token={ADMIN_TOKEN}
                      ts={r.ts}
                      alreadyMarked={candidates.has(r.ts)}
                    />
                  </span>
                </div>
              </summary>
              <div className="mt-3 border-t border-fog-1 pt-3">
                <div className="text-[11px] uppercase tracking-widest text-dust">
                  问题
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ash">
                  {r.prompt}
                </p>
                <div className="mt-3 text-[11px] uppercase tracking-widest text-dust">
                  推演输出
                </div>
                <pre className="mt-1 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-ink p-3 text-xs leading-relaxed text-ash">
                  {r.output}
                </pre>
              </div>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs text-dust">
        数据来源：服务器 data/conversations.jsonl（append-only，不进 git）。
        下一步可做：把高价值推演一键标记为「候选案例」。
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-ink p-6 text-center">
      <div className="numeral text-3xl text-bone">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-dust">
        {label}
      </div>
    </div>
  );
}

function Distribution({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="rounded-xl border border-fog-2 bg-soot p-4">
      <div className="text-xs uppercase tracking-widest text-dust">{title}</div>
      <div className="mt-3 space-y-2">
        {entries.length === 0 && (
          <div className="text-xs text-dust">暂无数据</div>
        )}
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate text-ash">{k}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-fog-1">
              <div
                className="h-full rounded-full bg-volt"
                style={{ width: `${Math.round((v / max) * 100)}%` }}
              />
            </div>
            <span className="numeral w-8 shrink-0 text-right text-bone">
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
