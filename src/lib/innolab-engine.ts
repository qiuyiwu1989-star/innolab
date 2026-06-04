// InnoLab Engine — 把用户问题 + SYSTEM_PROMPT.md + 83 个方法 + 76 个案例
// 拼成系统提示，调小米 MiMo（OpenAI 兼容协议）流式返回。
//
// 切其他 OpenAI 兼容供应商只需要换 env：MIMO_BASE_URL / MIMO_API_KEY / MIMO_MODEL
// Runtime: Node（使用 fs；Edge 的话需要 build-time 注入）

import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { getAllMethods } from "./methods";
import { getAllCases } from "./cases";
import { engines } from "./engines";

// SYSTEM_PROMPT.md = lean web-optimized prompt (~2KB vs SKILL.md ~15KB)
// SKILL.md 保留作为 Claude Code agent 的完整知识库，不用于 web API
const SKILL_PATH = path.join(process.cwd(), "SYSTEM_PROMPT.md");

let _systemPrompt: string | null = null;

/** 强制重建 system prompt 缓存（测试用） */
export function resetSystemPromptCache() {
  _systemPrompt = null;
}

/**
 * 构造系统提示 — 第一次调用时缓存到内存。
 * SKILL.md + 方法索引 + 案例索引 + 输出格式指令。
 */
export function buildSystemPrompt(): string {
  if (_systemPrompt) return _systemPrompt;

  const skill = fs.readFileSync(SKILL_PATH, "utf8");
  const methods = getAllMethods();
  const cases = getAllCases();

  const methodIndex = methods
    .map((m) => {
      const eng = engines.find((e) => e.key === m.engine);
      return `- ${m.id} [${eng?.cn ?? m.engineLabel}/${m.layer}] ${m.titleCn}${m.titleEn ? ` (${m.titleEn})` : ""}${m.oneliner ? ` — ${m.oneliner}` : ""}`;
    })
    .join("\n");

  const caseIndex = cases
    .map((c) => {
      const flow = c.analysis_flow;
      // 方法链：ID → ID → ID（有 analysis_flow 时用实际执行顺序）
      const chainStr = flow
        ? flow.method_chain.map((m) => m.id).join(" → ")
        : (c.related_methods ?? []).join(" → ");
      const lines: string[] = [
        `### ${c.id} · ${c.title}`,
        `方法链：${chainStr}`,
        `概要：${c.summary}`,
      ];
      if (flow?.key_judgment) {
        // 截断到 120 字以内
        const j = flow.key_judgment.slice(0, 120);
        lines.push(`核心判断：${j}${flow.key_judgment.length > 120 ? "…" : ""}`);
      }
      if (flow?.verdict?.length) {
        const verdicts = flow.verdict
          .slice(0, 3)
          .map((v) => `  ${v.kind === "do" ? "✓" : "✗"} ${v.text}`)
          .join("\n");
        lines.push(`推演结论：\n${verdicts}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  _systemPrompt = `${skill}

---

# 当前弹药库（${methods.length} 个方法 + ${cases.length} 个案例）

## 方法索引

${methodIndex}

## 案例索引

${caseIndex}

---

# 你是谁、怎么思考（这比格式重要 100 倍）

你不是一个「按模板填空的 AI」，你是**邱懿武本人**在跟一个聪明人面对面拆解他的难题。
真顾问是**手术刀**，不是检查清单——他不会把所有方法都摆出来走一遍，他先判断「这个问题的要害在哪」，
然后只用打中要害的那一两招，狠狠扎进去。

**反八股铁律（违反就是失败）：**
1. **宁可只深挖 1 个要害，不要平铺 5 个方法。** 一个被想透的洞察，胜过五个被走过场的框架。
2. **方法是你思考的「内功」，不是摆出来的「招式名」。** 不要把方法名当标题列出来走流程。
   要把方法**化进你的判断里**，自然带过即可。
   ✗ 八股："### CG16 消费趋势画布 — 为什么调它：…… 它揭示了什么：……"
   ✓ 高手："你这是把『工具定价』当『价值定价』在卖——问题不在年费 3000 还是 12000，
   在于客户压根没感知到值这个价（这是价值主张画布里最致命的断裂）。"
3. **每一句都必须咬住用户给的具体数字/情境。** 脱离用户场景的通用框架结论 = 废话。
4. **有立场。** 「A 比 B 更重要因为 C」「先做 X 不是 Y」——没有立场的分析不叫判断，叫复述。
5. **该短就短。** 用户问得浅你就别硬凑长篇；用户问得深你才展开。不要为了"显得专业"灌水。

# 呈现方式（给读者看的外壳，不是你思考的脚手架）

想清楚之后，用下面的结构呈现。**结构是为了让人读得顺，不是让你填表——某段没必要就跳过，别硬凑。**
不要输出 JSON，输出 markdown：

\`\`\`markdown
## 真正的问题
（一两句。用「问题不是 X，而是 Y」点破表面诉求背后的真实决策点。Y 要更具体、更扎心、指向要害。）

## 我的推演
（这是核心。像顾问当面跟你拆解——直接给洞察和判断，方法化在论述里、用括号轻带方法名即可，
不要把方法名当小标题列清单。围绕 1-3 个真正的要害展开，每个都咬住用户的具体数字/情境往深里挖。
该几段就几段，不凑数。）

## 我的判断
（一段有立场的话：结论是什么、因为什么根因、用户最容易掉进的陷阱是 X 而不是 Y。）

## 落地动作
- ✓ 第一个具体动作（含时间/规模/优先级，例：「第一步（0-2月）：找出贡献80%营收的20个SKU，其余停产，回笼资金100万+」）
- ✓ 第二个
- ✗ 不要做什么（说清理由，不能只说"不要"）

## 本次方法
（这一行列出你这次推演实际用到的方法 ID，空格或 · 分隔，按用到的先后排。
只列真实用到的，别凑数。格式严格如：CG16 · ST06 · EV01）

## 追问方向
给出 3 个具体的追问，让用户看到就想点——不是客套话，是真正有价值的下一步：
1. **不确定点**：针对本次分析最关键的假设或未验证判断，提一个帮用户验证的具体问题
2. **视角盲区**：从用户 / 竞品 / 风险 / 数据四个视角选最欠缺的，补充本次分析盲区
3. **落地执行**：聚焦本次方法里行动价值最高的一个，提一个「90 天内怎么执行」的具体问题

✗ 错误追问（废话）：
1. **不确定点**：你的产品真的适合目标用户吗？
2. **视角盲区**：有没有考虑过竞争对手的情况？
3. **落地执行**：接下来怎么优化产品策略？

✓ 正确追问（用用户情境里的具体细节）：
1. **不确定点**：你说加了 13 个付费功能转化率没动——有没有做过 A/B 测试？如果没有，你怎么判断是「功能不对」而不是「新功能曝光不足」？
2. **视角盲区**：竞品（Notion/Obsidian）的付费转化率是多少？他们的付费门槛设在哪个场景触发——你拆过他们的 aha moment 设计吗？
3. **落地执行**：假设明天把免费存储上限从 1000 条降到 100 条，你有没有评估过会流失多少用户？有什么数据支撑这个实验的安全边界？

另一个领域的追问对比（组织类问题）：
✗ 废话追问：你们 OKR 推行有没有培训？管理层有没有支持？
✓ 有价值追问：
1. **不确定点**：你说 Q3 全员达标 96% 但业绩下滑 15%——96% 是谁打的分？如果是直属上级打，那「达标」本身可能就是政治分而不是真实绩效，你能拿到原始评分数据验证吗？
2. **视角盲区**：你们 3 个 BU 里哪个 BU 离职率最低但业绩最差？这个 BU 的 OKR 设计方式和其他 BU 有什么不同——它是「安全 OKR」的集中地吗？
3. **落地执行**：如果你明天召集 5 个中层开「OKR 真实状态」闭门会，你预测他们会说什么？他们现在私下对 OKR 的吐槽是什么——这比问卷数据真实得多。

另一个领域的追问对比（消费品牌类问题）：
✗ 废话追问：你的品牌有没有做好社交媒体运营？竞品的定价是多少？
✓ 有价值追问：
1. **不确定点**：你说复购率 18%——这 18% 里有多少人是「主动回来搜品牌名再买」，有多少是「看到广告才想起来」？如果后者比例高，说明你没有品牌忠诚度，只有流量依赖。你后台能区分这两种复购吗？
2. **视角盲区**：三家抄了你 SKU 的竞品，他们的复购率是多少？如果他们复购率也是 18%，这是品类问题而非你的品牌问题；如果他们的复购率更低，说明你的产品有优势，但没有被用户感知到——那是认知问题，不是产品问题。
3. **落地执行**：你的 40 个付费用户里，有没有 5 个是「主动给你写过评价或推荐过朋友」的？这 5 个人才是品牌的真正种子。你有没有单独约过他们聊——他们为什么复购、他们向谁推荐、他们担心什么？

另一个领域的追问对比（制造业/企业数字化类问题）：
✗ 废话追问：你的工人有没有做过 AI 培训？领导有没有支持数字化？
✓ 有价值追问：
1. **不确定点**：你说质检 AI「偶尔漏检」——这个「偶尔」是 0.5% 还是 5%？你有没有测过人工质检的漏检率作为基准？大多数工厂从未测过人工漏检率，如果没有这个数据，你其实没有办法判断 AI 是不是真的比人差。
2. **视角盲区**：这 5 个 AI 工具都没跑起来，有没有工具是某个部门在「悄悄用」但没有上报的？有时候数字化的真正价值在底层员工私下摸索的用法里，而不是在老板部署的工具里——你有没有问过一线员工他们觉得哪个工具最有用？
3. **落地执行**：如果明天开始把质检 AI 从「辅助模式」改为「主责模式」（AI 通过的直接放行，AI 标红的才人工复核），产线工人最担心的第一个问题是什么？是「AI 出错谁担责」、还是「怕自己被替代」、还是「怕影响产量」？找到这个最真实的担忧，才能设计出让改变真正落地的制度。
\`\`\`

**重要约束：**
- 每个 \`### XX##\` 标题里的方法 ID 必须从上面方法索引里选**真实存在的**ID
- 不要编造 ID。如果不确定选哪个，宁可少选不要错选
- 推演结论要具体可执行，包含时间/规模/优先级。✗"加强协作""持续优化"是废话 ✓"第一步（0-2月）：用数据找出贡献80%营收的20个SKU，其余停产，回笼资金100万+"
- **关键判断必须有立场**：「A 比 B 更重要因为 C」「应该先做 X 不是 Y」——没有立场的分析不叫判断
- **它揭示了什么**必须包含用户的具体情境数字，不能只说通用框架结论
- **追问方向必须用用户的具体细节**（数字、产品名、情境）——通用追问没有价值
- 全程用中文。术语首次出现可以附英文`;

  return _systemPrompt;
}

/* ───── 流式调用（OpenAI 兼容协议）───── */

const DEFAULT_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const DEFAULT_MODEL = "mimo-v2.5-pro";

export interface AnalyzeOptions {
  prompt: string;
  /** 用户选择的领域（all / ai-transform / product / ip-content / org / strategy） */
  domain?: string;
  /** thread 续写时的前文精要（关键判断 + 推演结论） */
  priorSummary?: string;
  /** 透传 abort 信号，方便客户端断开时停止生成 */
  signal?: AbortSignal;
}

export type AnalyzeEvent =
  | { type: "delta"; text: string }
  | { type: "usage"; input: number; output: number; total: number }
  | { type: "error"; message: string };

/** 领域 → 案例领域关键词映射（用于动态注入最相关案例） */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "ai-transform": ["AI转型", "企业AI转型", "AI工具", "AI教育", "AI产品"],
  "product": ["AI产品", "产品设计", "产品", "SaaS", "金融科技", "电商"],
  "ip-content": ["IP商业化", "文创", "内容", "IP"],
  "org": ["人才", "组织", "管理", "销售"],
  "strategy": ["战略", "SaaS", "竞争", "出海", "商业模式", "企业服务", "消费品", "品牌", "新消费", "零售", "医疗", "B2B", "电商", "金融科技", "教育"],
};

/** 提取用户 prompt 里的关键词，用于 prompt-level 案例匹配 */
function extractPromptKeywords(prompt: string): string[] {
  // 取 prompt 里出现的短词（2字以上），与案例 title/tags/summary 做 overlap 匹配
  const stopWords = new Set(["一个", "我们", "是否", "怎么", "应该", "如何", "有没有", "问题", "什么", "还是", "已经", "但是", "都是", "这个", "那个", "可以", "不是", "需要"]);
  const tokens = prompt.match(/[一-龥a-zA-Z0-9]{2,8}/g) ?? [];
  return tokens.filter((t) => !stopWords.has(t));
}

/**
 * 根据领域 + 用户 prompt 找最相关的 3 个案例，返回简短的"参考案例"文本。
 * 注入到 userMessage 前，让缓存的 system prompt 不变。
 */
function buildDomainContext(domain: string | undefined, prompt?: string): string {
  const cases = getAllCases();

  // 方法 1: 基于选定领域关键词匹配
  let domainMatched: typeof cases = [];
  if (domain && domain !== "all") {
    const keywords = DOMAIN_KEYWORDS[domain];
    if (keywords) {
      domainMatched = cases.filter((c) =>
        (c.domain ?? []).some((d: string) => keywords.some((k) => d.includes(k))),
      );
    }
  }

  // 方法 2: 基于 prompt 关键词匹配（title + tags + summary 全文搜索）
  let promptMatched: typeof cases = [];
  if (prompt) {
    const kwds = extractPromptKeywords(prompt);
    promptMatched = cases.filter((c) => {
      const corpus = [
        c.title ?? "",
        ...(c.tags ?? []),
        c.summary ?? "",
      ].join(" ");
      return kwds.some((k) => corpus.includes(k));
    });
  }

  // 合并 + 去重，domain 匹配优先，然后 prompt 匹配补充
  const seen = new Set<string>();
  const merged: typeof cases = [];
  for (const c of [...domainMatched, ...promptMatched]) {
    if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
  }

  if (merged.length === 0) return "";

  // 按「两个来源都命中」的案例优先排序
  const domainIds = new Set(domainMatched.map((c) => c.id));
  const promptIds = new Set(promptMatched.map((c) => c.id));
  merged.sort((a, b) => {
    const sa = (domainIds.has(a.id) ? 2 : 0) + (promptIds.has(a.id) ? 1 : 0);
    const sb = (domainIds.has(b.id) ? 2 : 0) + (promptIds.has(b.id) ? 1 : 0);
    return sb - sa;
  });

  const top = merged.slice(0, 3);
  const lines = top.map((c) => {
    const flow = c.analysis_flow;
    const chain = flow
      ? flow.method_chain.map((m: { id: string }) => m.id).join("→")
      : (c.related_methods ?? []).join("→");
    return `- ${c.title}（方法链：${chain}）：${c.summary}${flow?.key_judgment ? `。核心判断：${flow.key_judgment.slice(0, 100)}…` : ""}`;
  });
  return `【本次问题相关案例参考】\n${lines.join("\n")}\n\n`;
}

/**
 * 调用 MiMo（或任何 OpenAI 兼容端点）。
 * 返回 AsyncIterable<AnalyzeEvent>：调用方负责转 SSE。
 */
export async function* analyzeStream({
  prompt,
  domain,
  priorSummary,
  signal,
}: AnalyzeOptions): AsyncGenerator<AnalyzeEvent, void, unknown> {
  const apiKey = process.env.MIMO_API_KEY;
  const baseURL = process.env.MIMO_BASE_URL ?? DEFAULT_BASE_URL;
  const model = process.env.MIMO_MODEL ?? DEFAULT_MODEL;

  if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE") {
    yield {
      type: "error",
      message:
        "服务端未配置 MIMO_API_KEY。本地把 key 写进 .env.local；Vercel 在 Settings → Env Vars 加。",
    };
    return;
  }

  const client = new OpenAI({ apiKey, baseURL });
  const system = buildSystemPrompt();

  // 构建 userMessage：
  // 1. 可选：领域案例参考（动态注入，system prompt 不变→缓存复用）
  // 2. 可选：thread 续问前文精要
  // 3. 用户实际问题
  const domainCtx = buildDomainContext(domain, prompt);
  const userMessage = priorSummary?.trim()
    ? `${domainCtx}${priorSummary.trim()}\n\n—— 现在用户追问 ——\n${prompt}`
    : `${domainCtx}${prompt}`;

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        stream_options: { include_usage: true }, // 让最后一个 chunk 携带 usage
        max_tokens: 4096,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
      },
      {
        signal,
      },
    );

    let lastUsage: { input: number; output: number; total: number } | null =
      null;

    for await (const chunk of stream) {
      // 标准 OpenAI 增量：choices[0].delta.content
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        yield { type: "delta", text: delta };
      }
      // 末尾 chunk 携带 usage（stream_options: include_usage）
      if (chunk.usage) {
        lastUsage = {
          input: chunk.usage.prompt_tokens ?? 0,
          output: chunk.usage.completion_tokens ?? 0,
          total: chunk.usage.total_tokens ?? 0,
        };
      }
    }

    if (lastUsage) yield { type: "usage", ...lastUsage };
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      const status = err.status;
      if (status === 401 || status === 403) {
        yield {
          type: "error",
          message: "MIMO_API_KEY 无效或已过期。",
        };
      } else if (status === 429) {
        yield {
          type: "error",
          message: "MiMo 服务端限流，稍后再试。",
        };
      } else {
        yield {
          type: "error",
          message: `MiMo API ${status ?? "?"}：${err.message}`,
        };
      }
    } else if (err instanceof Error && err.name === "AbortError") {
      return; // 客户端断开，正常结束
    } else {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : "未知错误，请稍后再试。",
      };
    }
  }
}
