// InnoLab Engine — 把用户问题 + SKILL.md + 74 个方法 + 10 个案例
// 拼成系统提示，调 Claude Sonnet 4.6 流式返回。
//
// Runtime: Node (使用 fs；用 Edge 的话需要 build-time 注入)

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { getAllMethods } from "./methods";
import { getAllCases } from "./cases";
import { engines } from "./engines";

const SKILL_PATH = path.join(process.cwd(), "SKILL.md");

let _systemPrompt: string | null = null;

/**
 * 构造系统提示 — 在第一次调用时缓存到内存。
 * SKILL.md + 方法索引 + 案例索引 + 输出格式指令。
 * 总大小约 30-50KB，远大于 Sonnet 4.6 的 2048 token caching 最低门槛。
 */
export function buildSystemPrompt(): string {
  if (_systemPrompt) return _systemPrompt;

  const skill = fs.readFileSync(SKILL_PATH, "utf8");
  const methods = getAllMethods();
  const cases = getAllCases();

  // 方法索引：紧凑一行一个，给模型快速选择用
  const methodIndex = methods
    .map((m) => {
      const eng = engines.find((e) => e.key === m.engine);
      return `- ${m.id} [${eng?.cn ?? m.engineLabel}/${m.layer}] ${m.titleCn}${m.titleEn ? ` (${m.titleEn})` : ""}${m.oneliner ? ` — ${m.oneliner}` : ""}`;
    })
    .join("\n");

  // 案例索引：标题 + 关联方法 ID
  const caseIndex = cases
    .map((c) => {
      const methods = (c.related_methods ?? []).join(",");
      return `- ${c.id} ${c.title}${methods ? ` [用了 ${methods}]` : ""} — ${c.summary}`;
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

/* ───── 流式调用 ───── */

const MODEL = "claude-sonnet-4-6";

export interface AnalyzeOptions {
  prompt: string;
  /** 透传 abort 信号，方便客户端断开时停止生成 */
  signal?: AbortSignal;
}

/**
 * 调用 Claude，返回一个 AsyncIterable<string>：每个 yield 是新增的文本块。
 * 调用方负责把它转成 SSE 或其他流式协议。
 */
export async function* analyzeStream({
  prompt,
  signal,
}: AnalyzeOptions): AsyncGenerator<
  | { type: "delta"; text: string }
  | { type: "usage"; input: number; cacheRead: number; cacheWrite: number; output: number }
  | { type: "error"; message: string },
  void,
  unknown
> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield {
      type: "error",
      message:
        "服务端未配置 ANTHROPIC_API_KEY。本地把 key 写进 .env.local；Vercel 在 Settings → Env Vars 加。",
    };
    return;
  }

  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt();

  try {
    // 系统提示用数组形式 + cache_control 放在最后一块，让 tools+system 整体缓存
    // 文档：shared/prompt-caching.md — prefix-match invariant
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 4096, // 推演足够；后续可以根据需要调大
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    // 用 signal 让客户端 abort 时立刻停止
    const abortHandler = () => stream.controller.abort();
    signal?.addEventListener("abort", abortHandler);

    try {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { type: "delta", text: event.delta.text };
        }
      }

      // 流结束后拿完整消息读 usage（用于成本可观测性）
      const final = await stream.finalMessage();
      yield {
        type: "usage",
        input: final.usage.input_tokens,
        cacheRead: final.usage.cache_read_input_tokens ?? 0,
        cacheWrite: final.usage.cache_creation_input_tokens ?? 0,
        output: final.usage.output_tokens,
      };
    } finally {
      signal?.removeEventListener("abort", abortHandler);
    }
  } catch (err) {
    // typed exception 优先（参考 shared/error-codes.md）
    if (err instanceof Anthropic.RateLimitError) {
      yield {
        type: "error",
        message: "Anthropic 限流了，稍后再试（这是 Anthropic 侧的，不是 InnoLab 配额）。",
      };
    } else if (err instanceof Anthropic.AuthenticationError) {
      yield {
        type: "error",
        message: "ANTHROPIC_API_KEY 无效或已过期。",
      };
    } else if (err instanceof Anthropic.APIError) {
      yield {
        type: "error",
        message: `Anthropic API ${err.status ?? "?"}：${err.message}`,
      };
    } else if (err instanceof Error && err.name === "AbortError") {
      // 客户端断开，正常结束
      return;
    } else {
      yield {
        type: "error",
        message:
          err instanceof Error ? err.message : "未知错误，请稍后再试。",
      };
    }
  }
}
