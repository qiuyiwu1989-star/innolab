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
  if (!process.env.WEB_SEARCH_API_KEY) return false; // 没 key 直接不搜
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
