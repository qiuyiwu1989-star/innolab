// 联网搜索 —— 给推演补「实时事实」（行业数据/政策/竞品动态）。
//
// 设计原则：
//   ① 有 key 就启用，没 key 就静默降级回纯推演 —— 绝不因为搜索挂掉影响主流程
//   ② 智能触发：只在问题真的需要实时事实时才搜（省钱 + 只在该慢时慢）
//   ③ 默认接 Tavily（为 AI 设计、返回干净摘要、支持中文）；可换其他供应商
//
// 配置（服务器 .env.local）：
//   WEB_SEARCH_API_KEY=...        # Tavily 的 key（没有则搜索能力整体关闭）
//   WEB_SEARCH_PROVIDER=tavily    # 预留：将来可换 bocha 等
//   WEB_SEARCH_BASE=https://api.tavily.com

const TAVILY_BASE = "https://api.tavily.com";

/** 触发信号：问题里出现这些词，说明可能需要实时事实 */
const SEARCH_SIGNALS = [
  "最新", "近期", "目前", "现在的", "今年", "去年", "趋势",
  "政策", "法规", "新规", "监管",
  "市场规模", "市场份额", "行业数据", "增长率", "渗透率",
  "竞品", "对手", "友商", "谁在做", "有哪些玩家",
  "融资", "估值", "上市", "财报", "营收",
  "2024", "2025", "2026",
];

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * 判断这个问题是否需要联网搜索补实时事实。
 * 纯判断题（"我该不该转型"）不触发；涉及最新数据/政策/竞品的才触发。
 */
export function shouldSearch(prompt: string): boolean {
  // 纯关键词启发式（是否「该不该搜」）；具体走哪条搜索通路由调用方按 key 决定。
  return SEARCH_SIGNALS.some((s) => prompt.includes(s));
}

/**
 * 执行搜索，返回最多 5 条干净摘要。失败/无 key → 返回空数组（静默降级）。
 */
export async function webSearch(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const apiKey = process.env.WEB_SEARCH_API_KEY;
  if (!apiKey) return [];
  const base = process.env.WEB_SEARCH_BASE ?? TAVILY_BASE;
  try {
    const res = await fetch(`${base}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
      }),
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: { title: string; url: string; content: string }[];
    };
    return (data.results ?? []).slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      content: (r.content ?? "").slice(0, 400),
    }));
  } catch {
    return []; // 网络错误/超时/被 abort → 静默降级
  }
}

/** 把搜索结果格式化成注入推演上下文的文本（带来源，供 AI 标注溯源） */
export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return "";
  const lines = results.map(
    (r, i) => `[来源${i + 1}] ${r.title}\n${r.content}\n（${r.url}）`,
  );
  return `【联网检索到的实时参考资料（请在推演中用到时标注"据来源N"，并对信息可靠性保持判断）】\n${lines.join("\n\n")}\n\n`;
}

// ── MiMo 官方端点联网搜索（推演走 TP 套餐，搜索单独走 sk- 标准 key）──────────
//
// 架构：主推演用 TP 套餐（token-plan-cn + tp- token，大额度、便宜），但 TP 那条线
// 没联网插件；需要实时事实时，单独用官方端点（api.xiaomimimo.com）+ 标准 sk- key
// 调一次 web_search，把检索到的「事实摘要 + 来源」喂回主推演。两条线计费分开。
//
// 配置（服务器 .env.local）：
//   MIMO_SEARCH_API_KEY=sk-...                         # 官方标准 key（已开通联网插件）；没配=不搜
//   MIMO_SEARCH_BASE_URL=https://api.xiaomimimo.com/v1 # 选填
//   MIMO_SEARCH_MODEL=mimo-v2.5-pro                    # 选填，默认同 MIMO_MODEL

const MIMO_OFFICIAL_BASE = "https://api.xiaomimimo.com/v1";

export interface MimoSearchResult {
  /** 检索到的实时事实摘要（注入主推演） */
  summary: string;
  /** 来源（url_citation），用于报告末尾「参考来源」 */
  sources: { url: string; title: string }[];
}

/** 是否已配置 MiMo 官方搜索 key */
export function mimoSearchEnabled(): boolean {
  return !!process.env.MIMO_SEARCH_API_KEY;
}

/**
 * 用 MiMo 官方端点 + sk- key 做一次联网搜索，返回事实摘要 + 来源。
 * 失败/无 key → 返回空（静默降级，绝不影响主推演）。
 */
export async function mimoSearch(
  query: string,
  signal?: AbortSignal,
): Promise<MimoSearchResult> {
  const key = process.env.MIMO_SEARCH_API_KEY;
  if (!key) return { summary: "", sources: [] };
  const base = process.env.MIMO_SEARCH_BASE_URL ?? MIMO_OFFICIAL_BASE;
  const model =
    process.env.MIMO_SEARCH_MODEL ?? process.env.MIMO_MODEL ?? "mimo-v2.5-pro";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        tools: [{ type: "web_search", force_search: true, max_keyword: 3 }],
        messages: [
          {
            role: "user",
            content: `联网检索与下面问题相关的最新事实/数据/动态，用简洁要点汇总（每条尽量标注时间），只给客观事实、不要展开分析：\n\n${query}`,
          },
        ],
      }),
      signal,
    });
    if (!res.ok) return { summary: "", sources: [] };
    const data = (await res.json()) as {
      choices?: { message?: { content?: string; annotations?: unknown[] } }[];
    };
    const msg = data.choices?.[0]?.message ?? {};
    const summary = (msg.content ?? "").toString().slice(0, 2000);
    const sources: { url: string; title: string }[] = [];
    const seen = new Set<string>();
    for (const a of (msg.annotations ?? []) as Array<Record<string, unknown>>) {
      const cite = (a.url_citation as Record<string, unknown>) ?? {};
      const url = (a.url ?? cite.url) as string | undefined;
      const title = (a.title ?? cite.title ?? "") as string;
      if (url && !seen.has(url)) {
        seen.add(url);
        sources.push({ url, title });
      }
    }
    return { summary, sources };
  } catch {
    return { summary: "", sources: [] };
  }
}
