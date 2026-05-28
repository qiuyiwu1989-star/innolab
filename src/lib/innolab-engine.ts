// InnoLab Engine — 把用户问题 + SYSTEM_PROMPT.md + 74 个方法 + 10 个案例
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

# 输出格式（严格遵守）

用户会问你一个真实商业问题。你按以下结构输出 markdown，**不要输出 JSON**：

\`\`\`markdown
## 问题重构
（一两句，把用户问题改写为更精确的版本，点出真正要回答的核心）

## 调用方法
（按顺序列出你要调用的 3-6 个方法。每个方法用三级标题。格式严格如下：）

### CG14 消费趋势画布
**为什么调它**：（一句话：这个方法解决什么问题，和当前场景的关联）
**它揭示了什么**：（2-3 句话：用这个框架分析后的具体结论，要提到用户的实际情况）

### ST06 蓝海战略
（同上格式）

## 关键判断
（一段话，综合上面方法的结论，给出有价值的核心判断。不是总结，是判断——要有立场，要具体）

## 推演结论
- ✓ 第一个具体动作（含时间/规模/优先级）
- ✓ 第二个具体动作
- ✗ 不要做什么（说理由，不能只说"不要"）
- ...

## 追问方向
给出 3 个具体的追问，让用户知道下一轮问什么能深化这次分析：
1. （针对最大的不确定点，给一个可以问的具体问题）
2. （换一个维度——用户视角/竞品视角/风险视角）
3. （聚焦某个方法的具体执行——怎么落地）
\`\`\`

**重要约束：**
- 每个 \`### XX##\` 标题里的方法 ID 必须从上面方法索引里选**真实存在的**ID
- 不要编造 ID。如果不确定选哪个，宁可少选不要错选
- 推演结论要具体可执行，避免"加强协作""持续优化"之类的废话
- 追问方向要让用户看到就想点——不是客套话，是真正有价值的下一步
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
  "ai-transform": ["AI转型", "企业AI转型", "AI工具"],
  "product": ["AI产品", "产品设计", "产品"],
  "ip-content": ["IP商业化", "文创", "内容"],
  "org": ["人才", "组织", "企业服务"],
  "strategy": ["战略", "企业服务", "设计"],
};

/**
 * 根据领域找最相关的 2 个案例，返回简短的"参考案例"文本。
 * 注入到 userMessage 前，让缓存的 system prompt 不变。
 */
function buildDomainContext(domain: string | undefined): string {
  if (!domain || domain === "all") return "";
  const keywords = DOMAIN_KEYWORDS[domain];
  if (!keywords) return "";
  const cases = getAllCases();
  const matched = cases.filter((c) =>
    (c.domain ?? []).some((d: string) => keywords.some((k) => d.includes(k))),
  );
  if (matched.length === 0) return "";
  const top = matched.slice(0, 2);
  const lines = top.map((c) => {
    const flow = c.analysis_flow;
    const chain = flow
      ? flow.method_chain.map((m: { id: string }) => m.id).join("→")
      : (c.related_methods ?? []).join("→");
    return `- ${c.title}（方法链：${chain}）：${c.summary}${flow?.key_judgment ? `。核心判断：${flow.key_judgment.slice(0, 80)}…` : ""}`;
  });
  return `【本次领域相关案例参考】\n${lines.join("\n")}\n\n`;
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
  const domainCtx = buildDomainContext(domain);
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
