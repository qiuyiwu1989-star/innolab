import {
  readRecentConversations,
  conversationStats,
  conversationInsights,
  conversationProfiles,
  candidateTsSet,
  candidateCount,
  feedbackQuality,
  methodUsageStats,
} from "@/lib/conversation-log";
import { getAllMethods } from "@/lib/methods";
import { MarkCandidate } from "@/components/admin/mark-candidate";

const DOMAIN_LABELS: Record<string, string> = {
  "ai-transform": "AI 转型",
  product: "产品",
  "ip-content": "IP / 内容",
  org: "组织",
  strategy: "战略",
  all: "未指定",
  free: "自由",
  unknown: "未知",
};

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
  const insights = conversationInsights();
  const profiles = conversationProfiles();
  const quality = feedbackQuality();
  const methods = methodUsageStats(
    getAllMethods().map((m) => ({ id: m.id, titleCn: m.titleCn })),
  );
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

      {/* ═══ 质量层：哪些推演翻车了（迭代引擎最直接的信号）═══ */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-bone">
          质量 · 哪些推演翻车了
        </h2>
        <p className="mt-1 text-[11px] text-dust">
          👍 {quality.up} · 👎 {quality.down} —— 👎 是迭代引擎最直接的信号，看用户嫌哪里不对 → 反推优化方法/system prompt
        </p>
        <div className="mt-3 space-y-2">
          {quality.downs.length === 0 && (
            <p className="rounded-lg border border-fog-2 bg-soot p-5 text-sm text-dust">
              暂无 👎 反馈。用户在推演完成后点「不准」时，会带着吐槽出现在这里。
            </p>
          )}
          {quality.downs.slice(0, 20).map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-rose-500/30 bg-rose-500/[0.04] p-3"
            >
              <div className="flex items-center gap-2 text-[11px] text-dust">
                <span className="rounded border border-rose-500/40 px-1.5 py-0.5 text-rose-400">
                  👎 不准
                </span>
                <span className="rounded border border-fog-2 px-1.5 py-0.5">
                  {DOMAIN_LABELS[f.domain ?? ""] ?? f.domain ?? "—"}
                </span>
                <span className="numeral ml-auto">
                  {new Date(f.ts).toLocaleString("zh-CN")}
                </span>
              </div>
              <div className="mt-1.5 text-sm text-bone">{f.prompt}</div>
              {f.note && (
                <div className="mt-1 rounded bg-ink/60 px-2 py-1 text-xs text-ash">
                  用户吐槽：{f.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 画像层：谁在用、关注什么 ═══ */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-bone">
          画像 · 谁在用（{profiles.length} 人）
        </h2>
        <p className="mt-1 text-[11px] text-dust">
          每个留资用户的提问史 + 联系方式 → 懂画像 + 咨询线索
        </p>
        <div className="mt-3 space-y-2">
          {profiles.length === 0 && (
            <p className="rounded-lg border border-fog-2 bg-soot p-5 text-sm text-dust">
              还没有留资用户。授权用户在 /demo 留手机/邮箱后，这里按人聚合。
            </p>
          )}
          {profiles.map((p) => (
            <details
              key={p.user_key}
              className="rounded-lg border border-fog-2 bg-soot p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-bone">
                    {p.name}
                  </span>
                  {p.company && (
                    <span className="text-xs text-ash">· {p.company}</span>
                  )}
                  {p.contact && (
                    <span className="rounded border border-volt/30 bg-volt/[0.06] px-1.5 py-0.5 text-[11px] text-volt">
                      {p.contact}
                    </span>
                  )}
                  <span className="numeral ml-auto text-xs text-dust">
                    {p.count} 次提问
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-dust">
                  <span>关注：</span>
                  {p.domains.slice(0, 4).map((d) => (
                    <span
                      key={d.domain}
                      className="rounded border border-fog-2 px-1.5 py-0.5"
                    >
                      {(DOMAIN_LABELS[d.domain] ?? d.domain)} ×{d.count}
                    </span>
                  ))}
                  <span className="ml-auto numeral">
                    最近 {new Date(p.lastActive).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </summary>
              <div className="mt-3 space-y-2 border-t border-fog-1 pt-3">
                {p.conversations.map((c, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center gap-2 text-[11px] text-dust">
                      <span className="rounded border border-fog-2 px-1 py-0.5">
                        {DOMAIN_LABELS[c.domain] ?? c.domain}
                      </span>
                      <span className="numeral">
                        {new Date(c.ts).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <div className="mt-1 text-ash">{c.prompt}</div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ 洞察层：大家都在愁什么 ═══ */}
      <section className="mt-10 rounded-xl border border-volt/30 bg-volt/[0.03] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-volt">
            洞察 · 大家都在愁什么
          </h2>
          <span className="text-[11px] text-dust">
            完整推演 {insights.completionRate}% · 续问率 {insights.followUpRate}%
          </span>
        </div>

        {/* 领域热度 */}
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-widest text-dust">
            领域热度（该写哪个案例 / 该卖哪类咨询）
          </div>
          <div className="mt-2 space-y-1.5">
            {insights.byDomainSorted.length === 0 && (
              <div className="text-xs text-dust">暂无数据</div>
            )}
            {insights.byDomainSorted.map((d) => {
              const max = insights.byDomainSorted[0]?.count ?? 1;
              return (
                <div key={d.domain} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0 truncate text-ash">
                    {DOMAIN_LABELS[d.domain] ?? d.domain}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-fog-1">
                    <div
                      className="h-full rounded-full bg-volt"
                      style={{ width: `${Math.round((d.count / max) * 100)}%` }}
                    />
                  </div>
                  <span className="numeral w-8 shrink-0 text-right text-bone">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 高频关键词云 */}
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-widest text-dust">
            高频关键词（≥2 次提到 · 字号=热度）
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {insights.keywords.length === 0 && (
              <div className="text-xs text-dust">
                还没有足够数据 — 攒几条真实推演后这里会浮现用户的真实关切
              </div>
            )}
            {insights.keywords.map((k) => {
              const max = insights.keywords[0]?.count ?? 1;
              const scale = 0.85 + (k.count / max) * 0.9; // 0.85x ~ 1.75x
              return (
                <span
                  key={k.word}
                  className="text-bone"
                  style={{ fontSize: `${scale}rem`, opacity: 0.55 + (k.count / max) * 0.45 }}
                  title={`${k.count} 次`}
                >
                  {k.word}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* 按领域 / 授权方分布（含具名身份） */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Distribution title="按领域" data={stats.byDomain} labels={DOMAIN_LABELS} />
        <Distribution title="按身份（谁在用）" data={stats.byLabel} />
      </section>

      {/* ═══ 方法使用：哪些方法常用 / 是僵尸 / AI 引用了库里没有的 ═══ */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-bone">
          方法使用 · 哪些被真实推演调用
        </h2>
        <p className="mt-1 text-[11px] text-dust">
          基于 {methods.totalRuns} 次真实推演统计 → 常用方法是核心资产；
          僵尸方法该打磨或删；AI 引用了库里没有的方法 = 你该补的缺口
        </p>

        {/* AI 引用了库里不存在的方法 ID —— 最该关注：暴露方法缺口 */}
        {methods.unknownIds.length > 0 && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/[0.04] p-3">
            <div className="text-xs font-medium text-rose-400">
              ⚠ AI 引用了库里不存在的方法 ID（可能是它编的，也可能提示你该补这些方法）
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {methods.unknownIds.map((id) => (
                <span
                  key={id}
                  className="numeral rounded border border-rose-500/40 px-1.5 py-0.5 text-[11px] text-rose-400"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 常用 Top 10 */}
          <div className="rounded-lg border border-fog-2 bg-soot p-4">
            <div className="text-[11px] uppercase tracking-widest text-volt">
              最常调用 Top 10
            </div>
            <div className="mt-2 space-y-1.5">
              {methods.counts
                .filter((m) => m.count > 0)
                .slice(0, 10)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="numeral w-12 shrink-0 text-volt">
                      {m.id}
                    </span>
                    <span className="flex-1 truncate text-ash">
                      {m.titleCn}
                    </span>
                    <span className="numeral text-bone">{m.count}</span>
                  </div>
                ))}
              {methods.counts.filter((m) => m.count > 0).length === 0 && (
                <div className="text-xs text-dust">还没有推演数据</div>
              )}
            </div>
          </div>

          {/* 僵尸方法 */}
          <div className="rounded-lg border border-fog-2 bg-soot p-4">
            <div className="text-[11px] uppercase tracking-widest text-dust">
              从未被调用（{methods.zombies.length} / {methods.counts.length}）
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {methods.zombies.slice(0, 40).map((m) => (
                <span
                  key={m.id}
                  title={m.titleCn}
                  className="numeral rounded border border-fog-2 px-1.5 py-0.5 text-[10px] text-dust"
                >
                  {m.id}
                </span>
              ))}
            </div>
            {methods.zombies.length > 40 && (
              <div className="mt-1 text-[10px] text-dust">
                …还有 {methods.zombies.length - 40} 个
              </div>
            )}
          </div>
        </div>
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
                  <span className="ml-auto">
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
  labels,
}: {
  title: string;
  data: Record<string, number>;
  labels?: Record<string, string>;
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
            <span className="w-24 shrink-0 truncate text-ash">
              {labels?.[k] ?? k}
            </span>
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
