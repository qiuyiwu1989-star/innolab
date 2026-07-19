// InnoLab MCP 工具层 —— 把「邱懿武的 86 方法战略推演能力」暴露成可被任何 agent 调用的原语。
//
// 设计原则（见 docs/mcp-architecture.md）：
//   · 私有优先：调用方凭 INNOLAB_MCP_KEY 鉴权（路由层校验），工具层默认已授权。
//   · 复用现有引擎/方法库/案例库/飞轮，不另起炉灶。
//   · analyze 每次调用都沉淀回 Supabase（source=mcp）——这是飞轮"被调用即长知识"的油管。
//
// 工具清单：
//   innolab_analyze       跑一次深度战略推演（核心能力）
//   innolab_list_methods  列/筛 86 个方法（id·标题·引擎·层级·一句话）
//   innolab_get_method    取某方法完整卡片 + 人类讲解版
//   innolab_list_cases    列/筛案例库（可按方法/领域/关键词）
//   innolab_sediment      把外部洞察/案例沉淀回飞轮（候选，待人工晋升）

import { analyzeToText } from "@/lib/innolab-engine";
import { getAllMethods, getMethodGuide } from "@/lib/methods";
import { getAllCases, getCasesByMethodId } from "@/lib/cases";
import { engines } from "@/lib/engines";
import { appendConversation } from "@/lib/conversation-log";

/* ───── 类型 ───── */

export interface ToolContext {
  /** 调用方标签（来自鉴权，如 "邱懿武" / "造物云"），写进沉淀记录的 access_label */
  label: string;
}

export interface ToolResultContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: ToolResultContent[];
  isError?: boolean;
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

const DOMAIN_ENUM = ["all", "ai-transform", "product", "ip-content", "org", "strategy"];
const ENGINE_ENUM = ["cognition", "strategy", "generation", "decision", "product", "evolution"];

/* ───── 小工具 ───── */

function text(s: string): ToolResult {
  return { content: [{ type: "text", text: s }] };
}
function errorResult(s: string): ToolResult {
  return { content: [{ type: "text", text: s }], isError: true };
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return [];
}

/* ───── 工具定义 ───── */

export const TOOLS: ToolDef[] = [
  {
    name: "innolab_analyze",
    description:
      "用邱懿武的战略创新方法体系（6 引擎 86 方法 + 真实案例库）对一个战略/产品/组织难题做深度推演，返回一份结构化的顾问级分析报告（真正的问题 / 推演 / 判断 / 风险 / 落地动作）。适合：定战略、拆商业模式、做产品决策、AI 转型、组织与增长诊断。给的信息越具体（数字、规模、卡点）结论越有用。每次调用都会沉淀回 InnoLab 飞轮。",
    inputSchema: {
      type: "object",
      properties: {
        problem: {
          type: "string",
          description:
            "要推演的难题，越具体越好——带上背景、关键数字、已试过什么、卡在哪。例：『我们做 AI HR SaaS，客单价 3000/年，续费率 61%，加了 13 个付费功能转化率没动，该涨价还是换定位？』",
        },
        domain: {
          type: "string",
          enum: DOMAIN_ENUM,
          description:
            "领域，用于注入最相关的案例（默认 all）。可选：ai-transform 企业AI转型 / product 产品 / ip-content IP与内容 / org 组织人才 / strategy 战略与商业模式。",
        },
        emphasis_methods: {
          type: "array",
          items: { type: "string" },
          description:
            "（可选，顾问态）指定优先调用的方法 ID，如 [\"ST06\",\"EV01\"]。用它让推演围绕你想强调的那几招展开。方法 ID 可先用 innolab_list_methods 查。",
        },
        client_name: {
          type: "string",
          description:
            "（可选，顾问态）本次分析对象/客户名。填了会让报告紧扣这家的处境、可直接用于对该客户的现场交付。",
        },
      },
      required: ["problem"],
    },
    annotations: {
      title: "InnoLab 战略推演",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    handler: async (args, ctx) => {
      const problem = str(args.problem);
      if (!problem) return errorResult("problem 不能为空。");
      if (problem.length > 4000) return errorResult("problem 过长（上限 4000 字），请精简。");

      const domain = DOMAIN_ENUM.includes(str(args.domain)) ? str(args.domain) : "all";
      const clientName = str(args.client_name);
      const emphasisMethods = strArray(args.emphasis_methods);

      let result;
      try {
        result = await analyzeToText({
          prompt: problem,
          domain,
          clientName: clientName || undefined,
          emphasisMethods: emphasisMethods.length ? emphasisMethods : undefined,
        });
      } catch (err) {
        return errorResult(
          `推演失败：${err instanceof Error ? err.message : "未知错误"}`,
        );
      }

      if (!result.text.trim()) return errorResult("推演未产出内容，请重试或补充信息。");

      // 沉淀回飞轮（被调用即长知识）——失败静默，不影响返回
      try {
        await appendConversation({
          ts: new Date().toISOString(),
          access_label: ctx.label,
          domain,
          source: "mcp",
          is_follow_up: false,
          follow_up_kind: null,
          prompt: problem,
          output: result.text,
          prompt_length: problem.length,
          output_length: result.text.length,
          ip_hash: "mcp",
          completed:
            result.text.includes("## 我的判断") ||
            result.text.includes("## 追问方向"),
          user_key: clientName ? `mcp:${clientName}` : "mcp",
        });
      } catch {
        /* 静默 */
      }

      const header = clientName ? `> 为「${clientName}」定制 · InnoLab 战略推演\n\n` : "";
      return text(header + result.text);
    },
  },

  {
    name: "innolab_list_methods",
    description:
      "列出 / 筛选 InnoLab 的 86 个战略创新方法（返回 id · 中文名 · 英文名 · 引擎 · 层级 · 一句话定义）。用来发现有哪些方法、拿到方法 ID 供 innolab_get_method 或 innolab_analyze 的 emphasis_methods 使用。",
    inputSchema: {
      type: "object",
      properties: {
        engine: {
          type: "string",
          enum: ENGINE_ENUM,
          description:
            "按引擎筛选：cognition 认知 / strategy 战略 / generation 生成 / decision 决策 / product 产品 / evolution 进化。不填返回全部。",
        },
        query: {
          type: "string",
          description: "关键词，模糊匹配方法的中英文名与一句话定义。",
        },
      },
    },
    annotations: {
      title: "列出方法库",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (args) => {
      const engine = str(args.engine);
      const query = str(args.query).toLowerCase();
      let methods = getAllMethods();
      if (ENGINE_ENUM.includes(engine)) methods = methods.filter((m) => m.engine === engine);
      if (query) {
        methods = methods.filter((m) =>
          [m.titleCn, m.titleEn, m.oneliner, m.id]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );
      }
      const rows = methods.map((m) => {
        const eng = engines.find((e) => e.key === m.engine);
        return {
          id: m.id,
          slug: m.slug,
          title_cn: m.titleCn,
          title_en: m.titleEn,
          engine: eng?.cn ?? m.engineLabel,
          layer: m.layer,
          oneliner: m.oneliner,
        };
      });
      return text(
        `共 ${rows.length} 个方法：\n\n${JSON.stringify(rows, null, 2)}`,
      );
    },
  },

  {
    name: "innolab_get_method",
    description:
      "取某个方法的完整卡片（标准模组：角色定位/何时调用/核心框架/执行流程/输出格式/实战案例/注意事项/配合）以及人类可读的讲解版（论文/说明书式）。按 id（如 ST06）或 slug 查。",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "方法 ID，如 ST06、CG16、EV01。" },
        slug: { type: "string", description: "方法 slug（URL 名），与 id 二选一。" },
      },
    },
    annotations: {
      title: "取方法详情",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (args) => {
      const id = str(args.id).toUpperCase();
      const slug = str(args.slug);
      if (!id && !slug) return errorResult("请提供 id 或 slug。");
      const methods = getAllMethods();
      const m = methods.find((x) => (id && x.id === id) || (slug && x.slug === slug));
      if (!m)
        return errorResult(
          `未找到方法 ${id || slug}。可先用 innolab_list_methods 查有哪些。`,
        );
      const guide = getMethodGuide(m.engineDir, m.slug);
      const parts = [`# ${m.titleCn}${m.titleEn ? `（${m.titleEn}）` : ""} · ${m.id}`, "", m.raw];
      if (guide) parts.push("\n\n---\n\n# 讲解版（给人看）\n", guide);
      return text(parts.join("\n"));
    },
  },

  {
    name: "innolab_list_cases",
    description:
      "列出 / 筛选 InnoLab 案例库（真实先例 + 方法演示）。返回 id · 标题 · 领域 · 用到的方法链 · 摘要 · 真实性标注（real 真实 / demo 演示）。可按方法 ID、领域或关键词筛。用于给推演找先例、或了解某方法怎么落地。",
    inputSchema: {
      type: "object",
      properties: {
        method_id: {
          type: "string",
          description: "只看用到了某方法的案例，如 ST06。",
        },
        domain: { type: "string", description: "领域关键词，模糊匹配案例的 domain 标签。" },
        query: { type: "string", description: "关键词，模糊匹配标题/标签/摘要。" },
      },
    },
    annotations: {
      title: "列出案例库",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (args) => {
      const methodId = str(args.method_id).toUpperCase();
      const domain = str(args.domain).toLowerCase();
      const query = str(args.query).toLowerCase();
      let cases = methodId ? getCasesByMethodId(methodId) : getAllCases();
      if (domain) {
        cases = cases.filter((c) =>
          (c.domain ?? []).some((d) => d.toLowerCase().includes(domain)),
        );
      }
      if (query) {
        cases = cases.filter((c) =>
          [c.title, ...(c.tags ?? []), c.summary ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );
      }
      const rows = cases.map((c) => ({
        id: c.id,
        title: c.title,
        authenticity: c.authenticity ?? "demo",
        domain: c.domain ?? [],
        methods: c.analysis_flow
          ? c.analysis_flow.method_chain.map((x) => x.id)
          : c.related_methods ?? [],
        summary: c.summary ?? "",
      }));
      return text(`共 ${rows.length} 个案例：\n\n${JSON.stringify(rows, null, 2)}`);
    },
  },

  {
    name: "innolab_sediment",
    description:
      "把一条外部洞察 / 新案例 / 战略结论沉淀回 InnoLab 飞轮，作为候选内容（进后台看板，待人工审核后可晋升为正式案例）。用于让别处的工作成果回流、让 InnoLab「越用越聪明」。注意：这是写入操作。",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "一句话标题 / 主题。" },
        content: {
          type: "string",
          description: "要沉淀的正文：洞察、案例经过、结论。写清楚背景与要点。",
        },
        domain: {
          type: "string",
          enum: DOMAIN_ENUM,
          description: "所属领域（默认 all），便于归类检索。",
        },
      },
      required: ["title", "content"],
    },
    annotations: {
      title: "沉淀到飞轮",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (args, ctx) => {
      const title = str(args.title);
      const content = str(args.content);
      if (!title || !content) return errorResult("title 和 content 均不能为空。");
      const domain = DOMAIN_ENUM.includes(str(args.domain)) ? str(args.domain) : "all";
      const body = `【外部沉淀】${title}\n\n${content}`;
      try {
        await appendConversation({
          ts: new Date().toISOString(),
          access_label: ctx.label,
          domain,
          source: "mcp-sediment",
          is_follow_up: false,
          follow_up_kind: null,
          prompt: title,
          output: body,
          prompt_length: title.length,
          output_length: body.length,
          ip_hash: "mcp",
          completed: true,
          user_key: `mcp:${ctx.label}`,
        });
      } catch (err) {
        return errorResult(
          `沉淀失败：${err instanceof Error ? err.message : "未知错误"}`,
        );
      }
      return text(
        `已沉淀「${title}」（领域 ${domain}）到 InnoLab 飞轮，进入候选池，可在后台看板审核后晋升为正式案例。`,
      );
    },
  },
];

/** 返回给 tools/list 的精简定义（不含 handler）。 */
export function toolDefs() {
  return TOOLS.map(({ name, description, inputSchema, annotations }) => ({
    name,
    description,
    inputSchema,
    annotations,
  }));
}

/** 调度一次 tools/call。未知工具返回 isError。 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return errorResult(`未知工具：${name}`);
  try {
    return await tool.handler(args ?? {}, ctx);
  } catch (err) {
    return errorResult(
      `工具执行出错：${err instanceof Error ? err.message : "未知错误"}`,
    );
  }
}
