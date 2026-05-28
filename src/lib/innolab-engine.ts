// InnoLab Engine — 把用户问题 + SKILL.md + 74 个方法 + 10 个案例
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

const SKILL_PATH = path.join(process.cwd(), "SKILL.md");

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
      const methodIds = (c.related_methods ?? []).join(",");
      return `- ${c.id} ${c.title}${methodIds ? ` [用了 ${methodIds}]` : ""} — ${c.summary}`;
    })
    .join("\n");

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
（一两句，把用户问题改写为更精确的版本）

## 调用方法
（按顺序列出你要调用的 3-6 个方法。每个方法用三级标题）

### CG14 消费趋势画布
（用 2-3 句话说明：为什么调它 + 它揭示了什么）

### ST06 蓝海战略
...

## 关键判断
（一段话，综合上面方法的结论得出的核心判断）

## 推演结论
- ✓ 第一个动作
- ✓ 第二个动作
- ✗ 不要做什么
- ...

## 建议下一步
（一句话：下一轮可以追加的方法）
\`\`\`

**重要约束：**
- 每个 \`### XX## 标题里的方法 ID 必须从上面方法索引里选**真实存在的**ID
- 不要编造 ID。如果不确定选哪个，宁可少选不要错选
- 推演要具体、可执行，避免空话和"加强协作"之类的废话
- 全程用中文。术语首次出现可以附英文`;

  return _systemPrompt;
}

/* ───── 流式调用（OpenAI 兼容协议）───── */

const DEFAULT_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const DEFAULT_MODEL = "mimo-v2.5-pro";

export interface AnalyzeOptions {
  prompt: string;
  /** thread 续写时的前文精要（关键判断 + 推演结论） */
  priorSummary?: string;
  /** 透传 abort 信号，方便客户端断开时停止生成 */
  signal?: AbortSignal;
}

export type AnalyzeEvent =
  | { type: "delta"; text: string }
  | { type: "usage"; input: number; output: number; total: number }
  | { type: "error"; message: string };

/**
 * 调用 MiMo（或任何 OpenAI 兼容端点）。
 * 返回 AsyncIterable<AnalyzeEvent>：调用方负责转 SSE。
 */
export async function* analyzeStream({
  prompt,
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

  // 续 thread 时：用户消息前置 prior_summary，保留 system prompt 不变（让缓存复用）
  const userMessage = priorSummary?.trim()
    ? `${priorSummary.trim()}\n\n—— 现在用户追问 ——\n${prompt}`
    : prompt;

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
