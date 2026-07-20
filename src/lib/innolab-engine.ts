// InnoLab Engine — 把用户问题 + SYSTEM_PROMPT.md + 86 个方法 + 76 个案例
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
import { shouldSearch, mimoSearch, mimoSearchEnabled } from "./web-search";

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

  // 案例索引「瘦身版」：system prompt 里只放一行目录（ID · 标题 · 方法链），
  // 让模型知道有哪些先例、能引用；案例全文（核心判断/结论）由 buildDomainContext
  // 在每次请求时只注入最相关的 3 个 → 大幅缩小 system prompt → 首字延迟显著降低。
  const caseIndex = cases
    .map((c) => {
      const flow = c.analysis_flow;
      const chainStr = flow
        ? flow.method_chain.map((m) => m.id).join("→")
        : (c.related_methods ?? []).join("→");
      // 标注真实性：real=真实先例(可作可信引用)，其余=方法演示(只示意思路，不可当真实证据引用)
      const tag = c.authenticity === "real" ? "[真实]" : "[演示]";
      return `- ${c.id}${tag} ${c.title}（${chainStr}）`;
    })
    .join("\n");

  _systemPrompt = `${skill}

---

# 当前弹药库（${methods.length} 个方法 + ${cases.length} 个案例）

## 方法索引

${methodIndex}

## 案例目录（仅 ID·标题·方法链；与本次问题最相关的案例全文会在用户消息里单独给你）

标注说明：[真实] = 邱懿武真实做过的案例，可作为可信先例引用（"我之前帮一家……"）；
[演示] = 方法应用的虚拟示范场景，**只能用来启发你的思路，绝不可当作真实发生过的事去引用或向用户声称"我做过"**。
引用演示案例时，只谈"这个方法在类似场景怎么用"，不要把虚构的公司名/数字当事实抛给用户。

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
5. **深度优先，但不灌水。** 用户带着真实难题来，他要的是一份想透了的分析，不是三句话打发。
   该展开就展开（一个真问题往往值 4000-5000 字），但每一段都要有"信息增量"——
   要么给数据/事实，要么给反例，要么给一个他想不到的角度，要么推出下一层后果。
   啰嗦地重复同一个观点 = 另一种八股，照样禁止。

# 什么叫"有深度"（这是这个产品的命根子）

一份浅报告和一份深报告的区别，不在长短，在于有没有做到这几件事——尽量都做到：
- **论证链，不只给结论**：不是"你该做 B"，而是"因为 A₁、A₂、A₃，所以 B；如果你选 C 会怎样——会 D，而 D 是你承受不起的"。
- **量化 / 事实支撑**：能算的要算（"客单 3000、续费 61%，意味着每年自然流失 39% × N 个客户 = 损失 X"），能引行业基准/真实案例的要引。
- **推第二层后果**：第一层人人能想到，你要想到第二、三层。"涨价 → 短期流失 → 但留下的是高价值客户 → 反而提升 LTV 和口碑" 这种链条。
- **多情境 / 反事实**：不只说"该这么做"，还要说"如果情况是 X 则该那样"，给用户一张决策地图而非单点结论。
- **指出他没问但更重要的问题**：真顾问的价值，常在于把用户从"他以为的问题"拉到"真正的问题"。

# 信息不足时：先反问，别硬答（这是顾问和复读机的区别）

真顾问遇到一句话的模糊问题，不会立刻甩一篇分析——他会先问几个关键问题，因为他知道
"输入决定输出"，没搞清状况就给的建议是不负责任的。你也要这样：

**判断标准**：如果用户给的信息少到你只能给"正确的废话"（任何同行业的人都适用、没法落到他具体处境），
就说明信息不足。典型信号：没有数字、没有规模、没有"卡在哪"、没有"试过什么"。

**信息不足时的输出**（只输出这一段，不要硬凑完整推演）：

\`\`\`markdown
## 先补几个关键信息

你的问题我能分析，但要给你**真正有用**的判断（而不是放之四海皆准的废话），
我需要先了解几件事——这几点直接决定结论会完全不同：

1. **[最关键的那个未知]**：（具体问，并说明为什么这个信息会改变结论。
   例："你们现在续费率大概多少？——这决定了问题是'获客'还是'留存'，两者的解法完全相反。"）
2. **[第二个]**：（同上）
3. **[第三个，可选]**

你可以直接补充这些，或者点开上方「告诉 InnoLab 你的背景」一次性填好——我会基于完整情况给你深度推演。
\`\`\`

**注意**：① 反问最多 3 个，只问"会改变结论"的关键信息，不要查户口式罗列。
② 每个问题都要带"为什么问"——让用户感到你真的在为他的具体处境着想，而不是走流程。
③ 如果信息其实够了（用户给了数字、背景、具体卡点），就**不要反问**，直接进入下面的深度推演。

# 呈现方式（给读者看的外壳，不是你思考的脚手架）

想清楚之后，用下面的结构呈现。**结构是为了让人读得顺，不是让你填表——某段没必要就跳过，别硬凑。**
不要输出 JSON，输出 markdown：

\`\`\`markdown
## 真正的问题
（一两句。用「问题不是 X，而是 Y」点破表面诉求背后的真实决策点。Y 要更具体、更扎心、指向要害。）

## 我打算怎么切
（像顾问开场先对齐思路——用 2-4 条一句话列出你这次准备从哪几个要害切入，让用户一眼看懂"接下来会分析什么"。
每条就一句，点到为止，是下面深度推演的提纲。例：
- 先算清楚你的「失血速度」——CAC 翻倍 + 续费率低于行业，到底是获客问题还是留存问题
- 你说"团队没人懂 AI"——但这可能根本不是关键约束
- AI HR 这条路，你的真实对手不是同行，是客户内部的 HR SaaS
这一段必须有，它让用户在深读前先掌握全局，也给他一个"要不要补充背景再调整方向"的决策点。）

## 我的推演
（这是核心，也是体现深度的地方。逐个展开上面列的要害。像资深顾问当面拆解——直接给洞察，方法化在论述里、用括号轻带方法名，
不要把方法名当小标题列清单。围绕你上面列的 2-4 个要害展开，每个要害都要：
① 有完整论证链（为什么是这样，证据/数据/反例是什么），不是甩个结论；
② 咬住用户的具体数字/情境去算、去推；
③ 推出第二层后果（别人想不到的那一层）。
每个要害可以用一个加粗小标题领起（描述这个要害是什么，不是方法名）。该深则深，宁可少挖几个、挖透，
也不要平铺一堆浅的。）

## 我的判断
（一段有立场的话：结论是什么、因为什么根因、用户最容易掉进的陷阱是 X 而不是 Y。一句话能说清就别绕。）

## 风险与盲区
（深报告必须有这一段——你的判断在什么条件下会失效？用户有哪个关键信息没给、可能推翻结论？
最大的执行风险是什么？诚实标出来，2-4 条。这恰恰是"真顾问 vs AI 复读机"的分水岭。）

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
  /** 顾问态：本次分析对象（客户/公司名）——用于「为 X 定制」的现场交付 */
  clientName?: string;
  /** 顾问态：指定优先调用的方法 ID（如 ["ST06","EV01"]）——现场强调某几招 */
  emphasisMethods?: string[];
  /** 透传 abort 信号，方便客户端断开时停止生成 */
  signal?: AbortSignal;
}

export type AnalyzeEvent =
  | { type: "delta"; text: string }
  | { type: "status"; text: string }
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
  clientName,
  emphasisMethods,
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

  // ── 联网搜索：推演走 TP 套餐，搜索单独走官方 sk- key ──────────────────────
  // 命中实时信号(shouldSearch) 且配了 MIMO_SEARCH_API_KEY 时：用 MiMo 官方端点
  // (sk-) 单独调一次 web_search，把「实时事实摘要」注入主推演上下文、来源汇成末尾
  // 「参考来源」。主推演本身不挂 web_search 工具（TP 那条线没联网插件，挂了会 400）。
  let searchCtx = "";
  let searchSources: { url: string; title: string }[] = [];
  if (mimoSearchEnabled() && shouldSearch(prompt)) {
    yield { type: "status", text: "联网检索实时资料中…" };
    const r = await mimoSearch(prompt, signal);
    if (r.summary) {
      searchCtx = `【联网检索到的实时参考资料（请在推演中用到时标注，并对可靠性保持判断）】\n${r.summary}\n\n`;
    }
    searchSources = r.sources;
  }

  // 顾问态注入（Consultant / MCP）：本次分析对象 + 指定强调的方法。
  // 放在案例参考之后、用户问题之前，作为"现场交付指令"影响这次推演。
  let consultCtx = "";
  if (clientName?.trim()) {
    consultCtx += `【本次分析对象】客户：${clientName.trim()}。这是一次面向该客户的现场交付，请紧扣这家的具体处境定制，结论要能直接拿去与该客户当面对齐。\n`;
  }
  if (emphasisMethods && emphasisMethods.length > 0) {
    const ids = emphasisMethods.map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (ids.length > 0) {
      consultCtx += `【顾问指定方法】本次请优先调用并显性运用这几招：${ids.join(" · ")}（务必让它们成为推演主线；若某招确实不适用，先说明理由再另择更贴切的方法）。\n`;
    }
  }
  if (consultCtx) consultCtx += "\n";

  // 构建 userMessage：
  // 1. 可选：联网检索到的实时事实（最前，作为权威事实）
  // 2. 可选：领域案例参考（动态注入，system prompt 不变→缓存复用）
  // 3. 可选：顾问态指令（分析对象 / 指定方法）
  // 4. 可选：thread 续问前文精要
  // 5. 用户实际问题
  const domainCtx = buildDomainContext(domain, prompt);
  const userMessage = priorSummary?.trim()
    ? `${searchCtx}${domainCtx}${consultCtx}${priorSummary.trim()}\n\n—— 现在用户追问 ——\n${prompt}`
    : `${searchCtx}${domainCtx}${consultCtx}${prompt}`;

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        stream_options: { include_usage: true }, // 让最后一个 chunk 携带 usage
        max_tokens: 4096, // 深度报告需要更长篇幅（4000-5000字），不能被截断
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
        // 主推演走 TP 套餐，不挂 web_search 工具（TP 那条线没联网插件，挂了会 400）。
        // 实时事实已通过上面的 mimoSearch(官方 sk-) 检索好、注入 searchCtx。
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

    // 联网搜索到的来源 → 末尾补「参考来源」（进 output → 落库 + 前端可见 + 可溯源）
    if (searchSources.length > 0) {
      const lines = searchSources
        .map((s, i) => `${i + 1}. [${s.title || s.url}](${s.url})`)
        .join("\n");
      yield { type: "delta", text: `\n\n## 参考来源\n${lines}\n` };
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

/* ───── 非流式包装（给 MCP / 服务端调用用）───── */

export interface AnalyzeResult {
  /** 完整推演 markdown（含参考来源 / 本次方法段） */
  text: string;
  /** token 用量（末尾 chunk 携带；无则 null） */
  usage: { input: number; output: number; total: number } | null;
  /** 从「## 本次方法」行解析出的方法 ID（无则空数组） */
  methodsUsed: string[];
}

/** 从推演全文里解析「## 本次方法」行列出的方法 ID（如 CG16 · ST06）。 */
function parseMethodsUsed(text: string): string[] {
  const m = text.match(/##\s*本次方法\s*\n+([^\n]+)/);
  const line = m?.[1] ?? "";
  const ids = line.match(/[A-Z]{2}\d{2}/g) ?? [];
  return Array.from(new Set(ids));
}

/**
 * 跑一次完整推演并累积成文本（不流式）。MCP 工具 / 任何服务端非流式场景用。
 * 命中 error 事件即抛出，让调用方能感知失败。
 */
export async function analyzeToText(
  opts: AnalyzeOptions,
): Promise<AnalyzeResult> {
  let text = "";
  let usage: AnalyzeResult["usage"] = null;
  for await (const ev of analyzeStream(opts)) {
    if (ev.type === "delta") text += ev.text;
    else if (ev.type === "usage")
      usage = { input: ev.input, output: ev.output, total: ev.total };
    else if (ev.type === "error") throw new Error(ev.message);
  }
  return { text, usage, methodsUsed: parseMethodsUsed(text) };
}

/* ───── 意图澄清（推演前的快问快答）───── */

export interface ClarifyQuestion {
  /** 一个"会改变结论"的关键问题 */
  q: string;
  /** 3-4 个可点选的具体选项（最后一个可为"其他/不确定"） */
  options: string[];
}

/**
 * 推演前先生成 2-3 个关键澄清问题（每个配可点选项），让用户快速补全意图。
 * 快、便宜（低 max_tokens）；解析失败返回空数组（前端据此跳过澄清、直接推演）。
 */
export async function clarifyIntent(
  prompt: string,
  signal?: AbortSignal,
): Promise<ClarifyQuestion[]> {
  const apiKey = process.env.MIMO_API_KEY;
  const baseURL = process.env.MIMO_BASE_URL ?? DEFAULT_BASE_URL;
  const model = process.env.MIMO_MODEL ?? DEFAULT_MODEL;
  if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE") return [];

  const system = `你是邱懿武本人的战略顾问助理。用户给的商业问题往往信息不足以给出精准判断——真顾问会先问几个关键问题再动手，因为"信息不足的分析毫无价值"。
你的任务：生成 **正好 2 个"会改变结论"的关键澄清问题**，每个配 **3-4 个具体、互斥的可点选项**，让用户点几下就能补全意图。
只问真正影响分析方向的（如：所处阶段/规模、核心卡点在哪、目标是什么、已经试过什么、关键数字区间），**绝不查户口式罗列**。选项要具体、贴该问题的常见情况，最后一个可以是"其他 / 说不好"。
**默认就要生成这 2 个问题——宁可多问也别漏问。只有当用户的问题里已经同时给足了「规模/阶段 + 核心卡点 + 目标」时，才输出 {"questions":[]}。**
严格只输出 JSON、不要任何解释、不要 markdown 围栏：
{"questions":[{"q":"问题文本","options":["选项1","选项2","选项3"]}]}`;

  try {
    const client = new OpenAI({ apiKey, baseURL });
    const res = await client.chat.completions.create(
      {
        model,
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt.slice(0, 2000) },
        ],
      },
      { signal },
    );
    const raw = res.choices?.[0]?.message?.content ?? "";
    // 从可能带围栏的文本里抠出 JSON 对象
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return [];
    const parsed = JSON.parse(m[0]) as { questions?: ClarifyQuestion[] };
    const qs = Array.isArray(parsed.questions) ? parsed.questions : [];
    return qs
      .filter(
        (x) =>
          x &&
          typeof x.q === "string" &&
          x.q.trim() &&
          Array.isArray(x.options) &&
          x.options.length >= 2,
      )
      .slice(0, 2)
      .map((x) => ({
        q: x.q.trim(),
        options: x.options
          .map((o) => String(o).trim())
          .filter(Boolean)
          .slice(0, 4),
      }));
  } catch {
    return [];
  }
}
