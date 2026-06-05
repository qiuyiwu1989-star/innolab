"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  RotateCcw,
  Send,
  Sparkles,
  X,
  CornerDownLeft,
  Copy,
  Check,
  Share2,
  ThumbsUp,
  ThumbsDown,
  History,
  Trash2,
} from "lucide-react";
import { Markdown } from "@/components/site/markdown";
import { cn } from "@/lib/utils";
import {
  appendToHistory,
  readHistory,
  removeFromHistory,
  buildShareUrl,
  type HistoryItem,
} from "@/lib/demo-history";
import {
  startThread,
  appendToThread,
  getThread,
  buildPriorSummary,
  extractMethodIds,
  extractFollowUpQuestions,
  type Thread,
  type ThreadMessage,
} from "@/lib/threads";
import { ChevronDown, ChevronUp, MessageSquarePlus, RefreshCw, Microscope, Zap } from "lucide-react";
import { MethodChainViz, type MethodMeta } from "@/components/demo/method-chain-viz";
import { OnboardTour } from "@/components/demo/onboard-tour";

type Phase = "idle" | "streaming" | "done" | "error";

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

interface ErrorState {
  message: string;
  reason?: "rate_limit" | "config" | "api" | "unknown";
}

/**
 * 从问题文本自动推断最相关领域（用于用户没有手动选 chip 的情况）。
 * 返回 null 表示无法判断，传给 API 时回退到 "all"。
 */
function detectDomainFromPrompt(text: string): DomainKey | null {
  const t = text.toLowerCase();
  if (/ai转型|ai落地|ai工具|人工智能|企业ai|数字化转型|智能化/.test(t))
    return "ai-transform";
  if (/ip[^v]|内容创作|文创|达人|网红|创作者|变现|粉丝|个人品牌|博主|up主|播客|知识付费/.test(t))
    return "ip-content";
  if (/组织|人才|团队|招聘|培训|绩效|kpi|oka|企业文化|离职|薪酬|管理/.test(t))
    return "org";
  if (/产品|mvp|功能|需求|设计|用户增长|留存|转化率|产品经理/.test(t))
    return "product";
  if (/战略|转型|定位|赛道|竞争|护城河|商业模式|saas|b2b|创业|融资|市场|行业|品牌|复购|新消费|爆品|渠道|消费品|零售|下沉|出海/.test(t))
    return "strategy";
  return null;
}

/** 首屏「灵感」示例问题 — 展示 InnoLab 擅长回答的问题类型 */
const EXAMPLE_PROMPTS = [
  "我们 200 人制造业，AI 转型一年用了 5 个工具但都没跑起来——问题在哪？",
  "小红书 50 万粉，广告收入触顶，该怎么找第三条变现路线？",
  "公司推 OKR 8 个月，全员达标 96% 但业绩下滑 15%，是哪里出了问题？",
  "我们 SaaS 想出海，东南亚、中东、日本三选一，该怎么判断？",
  "守线业务还有钱赚，但攻线 AI 产品一直没人用——资源该怎么分配？",
  "招一个 AI 负责人，还是让全员都学 AI？哪条路更值？",
  "我的 MVP 用户说「挺好的」但没有复购，问题出在哪里？",
  "文创 IP 内核已经验证，怎么快速拓展更多变现载体而不失去定位？",
  "播客做了 3 年、5 万忠实听众，三次变现尝试全失败——怎么找到跑通的路？",
  "SaaS 产品免费用户 5 万，加了半年功能转化率还是 1.5%，该怎么破？",
  "产品做出来了，免费试用 12 家无一转付费——第一个付费用户在哪里？",
  "小红书爆款月销 200 万，复购率只有 18%，三家竞品已经抄完了 SKU——品牌溢价怎么建起来？",
  "产品有 800 用户、40 个付费，融资 3 轮全被拒「市场太小」——是 deck 问题还是数据问题？",
  "国货美妆品牌同时测 TikTok 东南亚和亚马逊美国，6 个月两头没跑通——该怎么选？",
  "B2B SaaS 免费用户 8000，付费率 1.2%，499 元/月太贵了吗？还是 Freemium 模式本身选错了？",
  "K12 教培花 30 万买了 AI 出题系统，学生分数没变——工具问题还是使用策略问题？",
  "医疗 SaaS 产品 POC 三次通过，三甲医院合同谈了 2 年签不下来——卡在哪里？",
  "跨境电商家居爆款 SKU 从 15 扩到 180，GMV 翻倍但利润腰斩——怎么办？",
  "消费金融 App 注册 50 万，月活 8%，投资人要 DAU 翻倍——追数字还是追质量？",
  "传统豪车 4S 店销量跌 35%，新能源直营店开在隔壁——降价换品牌还是转业态？",
  "供应链 SaaS 国内行业第一，出海东南亚 6 个月只签 2 家——市场错了还是策略错了？",
  "美妆品牌 50 万会员企微群活跃率 3%，每月花 30 万维护——这钱值不值得继续烧？",
  "连锁餐饮上了 12 个 SaaS 系统，翻台率和人效还是没变——系统买错了还是用错了？",
  "3 人初创团队有 4 个产品想法，18 个月跑道——怎么决定先做哪个？",
  "职业培训平台完课率 12%，课程评价 4.3 分——是课程问题还是动机问题？",
  "HR SaaS 销售漏斗转化率 2%，客户总说贵——是定价问题还是价值传递问题？",
  "竞品抄了我们的核心功能，用户流失 18%——打价格战还是加速差异化？",
  "DTC 健康零食品牌年销 5000 万，进线下便利店还是盒马？渠道选错会把品牌做死",
  "融资 3000 万烧完，DAU 翻倍但留存腰斩，下一轮投资人全拒了——哪里出了问题？",
  "B2B SaaS 加了 80 个功能留存率没变，用户访谈说「挺好用的」——问题在哪？",
  "B2B SaaS 1.3 亿 ARR，考虑转 PLG 减少销售依赖——飞轮怎么设计？",
  "健康管理 App 500 万用户，K 值只有 0.08，增长全靠买量——怎么把增长飞轮转起来？",
  "职场辅导平台 500 名导师入驻，3 个月只成交 87 笔——双边平台冷启动死循环怎么破？",
  "HR SaaS 面临纵深做 HCM 平台 vs 出海东南亚两个方向，AI 颠覆风险高，该如何做战略取舍？",
  "公司 5 条产品线研发预算平摊，有两条在亏钱——BCG 矩阵怎么帮我决定砍哪条、保哪条？",
  "刚完成 B 轮融资，投资人要 3 年战略路线图——从 ARR 4000 万到 2.5 亿怎么规划增长路径？",
  "制造企业收到 8 个 AI 上线需求但预算只有 600 万——怎么用场景价值矩阵选出最值得做的 2 个？",
  "我们是 30 人律所，AI 抢了简单合同业务，大所又进不去——中间层律所的出路在哪里？",
  "卖了 20 年的实木家具，年轻人就是不买单——设计思维怎么帮我重新找到 Z 世代用户？",
  "湖南米粉品牌本地第一但出了省没人认识——全国化该扛着本地 IP 打还是建新品牌？",
  "HR SaaS 15 个功能都想 AI 化，预算只够做 3 个——怎么判断哪个场景的智能密度最高？",
  "在线教育平台每季度出 30 个新功能，留存还是在跌——创新十环怎么找到真正的突破口？",
  "SaaS 创始团队 CTO 要大客户、CMO 要中小企业，三次会议没有结论——六顶思考帽怎么化解战略僵局？",
  "超市 APP 下了 80 万次到店消费却没增加——人货场模型怎么诊断全渠道数字化的漏点？",
  "气候科技 A 轮 Pitch 投资人听完打瞌睡——怎么用颠覆性叙事框架重构融资故事？",
  "健康订阅 APP 200 万用户付费率只有 1.4%，用户说「很好但不需要」——马斯洛告诉你问题在哪？",
  "战略报告写了 80 页董事会说逻辑不清——金字塔原理怎么把汇报从信息堆砌变成说服机器？",
  "AI 写作工具公司：GPT-5 越来越强，我们的产品还有护城河吗？杰文斯悖论给出答案",
  "老年智能家居测试大获好评但上市月销 300 台——设计民族志如何发现访谈里没有的真相？",
  "宣布 AI 化战略后技术团队集体反弹——非暴力沟通怎么把内部冲突转化为共同行动？",
  "做了 3 年知识博主内容有价值但没护城河——创新五大构成帮你找到 AI 时代真正的差异化维度",
  "企业花 500 万全员创新培训学完照常上班——创造力十段评估 + 方法卡设计哪里出了问题？",
  "精品咖啡 5 家店净利 28%，资本要开 100 家——规模化会杀死品牌还是成就品牌？",
  "B2B SaaS 产品比竞品强但价格是最低的，续费率却只有 61%——涨价到底该怎么涨？",
  "贝壳 AI 置业顾问来了，我们 200 人区域房产平台客询跌 18%——和大平台拼 AI 还是做他们做不了的事？",
  "社区团购 GMV 2 亿，竞品补贴一来团长用户供应商全跑了——北极星选错了飞轮怎么转？",
  "家电品牌 4 条产品线，大股东要押空调、创始人要押小家电——BCG 矩阵怎么打破战略幻觉？",
  "碳资产平台 A 轮路演 12 次没点燃投资人——三方共进化叙事如何让「必然会发生的趋势」说服人？",
  "理财 App 300 万用户付费率 0.8%，用户说「省了很多焦虑」——JTBD 告诉你他们真正在买什么",
  "企业健康 App 月活 5%，员工说「挺好用」就是不打开——行为风暴发现访谈永远问不出的真相",
  "Z 世代员工不爱视频培训课，6 周内如何用认知组装 + 故事板做出可测试原型？",
  "制造企业面对 AI 颠覆焦虑：未来雷达 + What If 如何把模糊威胁变成具体行动优先级？",
  "新能源车配件 45 个 SKU 全在 10-30 名，如何用价值机会分析找到情感维度的蓝海？",
  "两个 VP 战略撕裂、董事会三周后要答案——CEO 怎么同时搞定选战略、对齐人、说服董事会？",
  "我做了 8 年创新培训，现在 AI 和免费课把我的课冲垮了——杰文斯悖论说我该卖什么？",
] as const;

/** 按领域组织的预设问题 — 同时作为流量分流和数据采集锚点 */
const DOMAINS = [
  { key: "all", label: "全部" },
  { key: "ai-transform", label: "AI 转型" },
  { key: "product", label: "产品" },
  { key: "ip-content", label: "IP / 内容" },
  { key: "org", label: "组织" },
  { key: "strategy", label: "战略" },
] as const;
type DomainKey = (typeof DOMAINS)[number]["key"];

const SUGGESTIONS: { label: string; tag: string; domain: DomainKey }[] = [
  // AI 转型
  { label: "AI 转型该从哪里开始？", tag: "企业 AI", domain: "ai-transform" },
  {
    label: "我们 AI 转型一年没效果，问题在哪？",
    tag: "AI 自查",
    domain: "ai-transform",
  },
  {
    label: "每个环节加 AI vs 从零重设计流程？",
    tag: "流程改造",
    domain: "ai-transform",
  },
  // 产品
  { label: "我的产品定位是什么？", tag: "产品定义", domain: "product" },
  {
    label: "怎么判断 MVP 已经被验证了？",
    tag: "MVP",
    domain: "product",
  },
  {
    label: "我该不该砍掉这个功能？",
    tag: "产品取舍",
    domain: "product",
  },
  // IP / 内容
  { label: "我该做 IP 产品吗？", tag: "IP 商业化", domain: "ip-content" },
  {
    label: "我的 IP 护城河该怎么建？",
    tag: "IP 四层",
    domain: "ip-content",
  },
  {
    label: "文创爆款怎么持续生新的？",
    tag: "老瓶新装",
    domain: "ip-content",
  },
  // 组织
  { label: "怎么搭建双轨人才体系？", tag: "人才", domain: "org" },
  { label: "我团队卡在 L2 怎么办？", tag: "L2-L4", domain: "org" },
  {
    label: "招 AI 团队还是全员培训？",
    tag: "组织选择",
    domain: "org",
  },
  // 战略
  {
    label: "怎么判断一个赛道还有没有机会？",
    tag: "赛道判断",
    domain: "strategy",
  },
  {
    label: "守线攻线资源该怎么分配？",
    tag: "攻守矩阵",
    domain: "strategy",
  },
  {
    label: "现在该不该启动这次转型？",
    tag: "决策时点",
    domain: "strategy",
  },
];

/**
 * "装填弹药库"等待阶段的推理步骤 — 让等待看起来像 AI 在分步行动 / 自我反思，
 * 而不只是机械换标签。每一步配一句"它在干什么"。纯视觉，不影响真实逻辑。
 */
const THINKING_STAGES: { label: string; detail: string }[] = [
  { label: "读懂你的问题", detail: "拆解表面诉求，定位真正要解决的决策点" },
  { label: "检索方法库", detail: "在 83 个方法中筛选最相关的几个" },
  { label: "匹配实战案例", detail: "从 76 个真实案例里找可参照的先例" },
  { label: "编排推演链", detail: "把方法按逻辑顺序串成分析路径" },
  { label: "生成判断", detail: "逐法推演，准备给出 do / don't 结论" },
];

/** 各领域在"思考中"阶段循环展示的方法 ID — 纯视觉动画，不影响逻辑 */
const DOMAIN_METHOD_CYCLE: Record<string, string[]> = {
  "ai-transform": ["CG06", "ST10", "ST09", "DC05", "ST07", "CG01", "EV03", "ST19", "DC01", "DC06"],
  product:        ["PD07", "PD05", "PD10", "DC04", "EV01", "PD14", "DC07", "EV04", "EV05", "ST20"],
  "ip-content":  ["GN02", "GN04", "PD02", "ST06", "CG16", "PD10", "EV04"],
  org:            ["ST09", "CG06", "EV03", "DC02", "DC04", "ST10", "ST19"],
  strategy:       ["ST07", "ST06", "ST02", "DC07", "ST11", "ST17", "ST03", "ST19", "ST01", "ST20", "DC10", "DC03"],
  all:            ["ST07", "CG06", "PD07", "GN02", "ST17", "ST09", "EV01", "PD05", "CG16", "ST06", "ST19", "EV04", "ST20", "CG20", "EV05", "DC10"],
};

interface CaseSnippet {
  id: string;
  title: string;
  summary: string;
  domain: string[];
  related_methods: string[];
}

interface LiveRunnerProps {
  /** Server-side built methods index for method chain visualization */
  methodsIndex?: Record<string, MethodMeta>;
  /** Lightweight cases index for related-case recommendations */
  casesIndex?: CaseSnippet[];
  /** 咨询客户专属令牌：传入则推演不限次（豁免限流），并隐藏配额提示 */
  clientToken?: string;
  /** 留资派生的稳定用户标识：随推演上报 → 飞轮按人归属画像 */
  userKey?: string;
}

export function LiveRunner({
  methodsIndex = {},
  casesIndex = [],
  clientToken,
  userKey,
}: LiveRunnerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [remaining, setRemaining] = useState<{ ip?: number; global?: number }>(
    {},
  );
  const [activeDomain, setActiveDomain] = useState<DomainKey>("all");
  const [pickedFromDomain, setPickedFromDomain] = useState<DomainKey | "free">(
    "free",
  );
  /** 等首个 delta 到达前的"思考中"状态 */
  const [waitingFirstChunk, setWaitingFirstChunk] = useState(false);
  /** 思考动画：循环展示方法 ID（纯视觉） */
  const [thinkingMethodId, setThinkingMethodId] = useState("");
  /** 思考动画：当前推理阶段索引（让等待感像 AI 在分步行动） */
  const [thinkingStage, setThinkingStage] = useState(0);
  /** 等待已耗时（秒）—— 诚实告诉用户「在认真算，需要十几秒」 */
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  /** 本地分析历史（localStorage） */
  const [history, setHistory] = useState<HistoryItem[]>([]);
  /** 完成后的反馈（一次性） */
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  /** 是否从历史回放（不发 API） */
  const [fromReplay, setFromReplay] = useState(false);
  /** 是否从上次 session 自动恢复 */
  const [sessionRestored, setSessionRestored] = useState(false);
  /** 复制 / 分享 状态 */
  const [copied, setCopied] = useState<null | "result" | "link">(null);

  /* —— 用户背景记忆（分析记忆库简化版）—— */
  /** 用户在"你的背景"框里保存的内容 */
  const [userContext, setUserContext] = useState("");
  /** 编辑中的临时草稿（未保存时和 userContext 不同步） */
  const [userContextDraft, setUserContextDraft] = useState("");
  /** "你的背景"输入框是否展开 */
  const [contextOpen, setContextOpen] = useState(false);

  /* —— Thread 会话化状态 —— */
  /** 当前 thread（null = 还没开始或重置后） */
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  /** 渲染用 — 所有历史 Q/A 对（包含当前刚完成的那条） */
  const [threadHistory, setThreadHistory] = useState<ThreadMessage[]>([]);
  /** 续 thread 时本次属于哪种 follow-up */
  const [followUpKind, setFollowUpKind] = useState<
    "deeper" | "angle" | "method" | null
  >(null);
  /** 折叠展开：哪些历史 Q/A 当前展开 */
  const [expandedMsgIds, setExpandedMsgIds] = useState<Set<string>>(new Set());
  /** "深入方法"打开的方法选择面板 */
  const [methodDrillOpen, setMethodDrillOpen] = useState(false);
  /** 首屏灵感提示 — 循环展示示例问题 */
  const [exampleIdx, setExampleIdx] = useState(0);
  const [exampleVisible, setExampleVisible] = useState(true);
  /** 累计已探索的方法 ID（跨 session 持久化） */
  const [seenMethodIds, setSeenMethodIds] = useState<Set<string>>(new Set());
  /** 方法探索地图面板是否展开 */
  const [showMethodMap, setShowMethodMap] = useState(false);

  const visibleSuggestions =
    activeDomain === "all"
      ? SUGGESTIONS
      : SUGGESTIONS.filter((s) => s.domain === activeDomain);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 卸载时取消请求
  useEffect(() => () => abortRef.current?.abort(), []);

  // 加载时恢复上次选择的领域 + 历史 + 上一次完成的 thread + 用户背景
  useEffect(() => {
    // 读取 URL 参数（案例页 → demo 直通时注入）；URL param 优先级高于 localStorage
    let domainFromUrl = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      const domainParam = sp.get("domain");
      const qParam = sp.get("q");
      if (domainParam && DOMAINS.some((d) => d.key === domainParam)) {
        setActiveDomain(domainParam as DomainKey);
        domainFromUrl = true;
      }
      if (qParam) {
        setPrompt(decodeURIComponent(qParam));
      }
    } catch {
      /* noop */
    }

    if (!domainFromUrl) {
      try {
        const saved = localStorage.getItem("innolab.demo.domain");
        if (saved && DOMAINS.some((d) => d.key === saved)) {
          setActiveDomain(saved as DomainKey);
        }
      } catch {
        /* localStorage 不可用就算了 */
      }
    }
    setHistory(readHistory());

    // 恢复用户背景
    try {
      const ctx = localStorage.getItem("innolab.userContext.v1");
      if (ctx) {
        setUserContext(ctx);
        setUserContextDraft(ctx);
      }
    } catch {
      /* noop */
    }

    // 尝试恢复上次的 thread session（同一用户刷新后不丢失上下文）
    try {
      const lastThreadId = localStorage.getItem("innolab.lastThread.v1");
      if (lastThreadId) {
        const t = getThread(lastThreadId);
        if (t && t.messages.length > 0) {
          const lastMsg = t.messages[t.messages.length - 1];
          // 只恢复 2 小时内的 thread
          const age = Date.now() - new Date(t.updatedAt).getTime();
          if (age < 2 * 60 * 60 * 1000) {
            setCurrentThread(t);
            setThreadHistory(t.messages);
            setSubmittedPrompt(lastMsg.prompt);
            setOutput(lastMsg.output);
            setPhase("done");
            setFromReplay(false);
            setSessionRestored(true);
            if (DOMAINS.some((d) => d.key === t.domain)) {
              setActiveDomain(t.domain as DomainKey);
            }
          }
        }
      }
    } catch {
      /* 恢复失败就算了，不影响正常使用 */
    }

    // 恢复已探索方法集合（跨 session 学习轨迹）
    try {
      const raw = localStorage.getItem("innolab.seenMethods.v1");
      if (raw) {
        setSeenMethodIds(new Set(JSON.parse(raw) as string[]));
      }
    } catch {
      /* noop */
    }
  }, []);

  // 首屏灵感示例：只在 idle 且 prompt 为空时循环切换
  useEffect(() => {
    if (phase !== "idle" || prompt) return;
    const INTERVAL = 4500;
    const id = setInterval(() => {
      setExampleVisible(false);
      setTimeout(() => {
        setExampleIdx((i) => (i + 1) % EXAMPLE_PROMPTS.length);
        setExampleVisible(true);
      }, 300); // 等 fade-out 完成再换文字
    }, INTERVAL);
    return () => clearInterval(id);
  }, [phase, prompt]);

  // 思考动画：waitingFirstChunk 时，分阶段推进推理步骤 + 在每阶段内快速翻动方法 ID
  // 让等待看起来像 AI 在"读问题→检索→匹配→编排→生成"地行动，而非机械换标签
  useEffect(() => {
    if (!waitingFirstChunk) {
      setThinkingMethodId("");
      setThinkingStage(0);
      if (thinkingTimerRef.current !== null) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      return;
    }
    const pool =
      DOMAIN_METHOD_CYCLE[pickedFromDomain] ?? DOMAIN_METHOD_CYCLE["all"];
    let tick = 0;
    let idx = 0;
    setThinkingStage(0);
    setThinkingSeconds(0);
    setThinkingMethodId(pool[idx]);
    // 每 220ms 翻一个方法 ID；每 ~1.5s 推进一个推理阶段——「循环」而非卡死在最后一阶段，
    // 因为首字本就要十几秒，卡死会让人以为"快好了却干等"，循环+耗时更诚实。
    thinkingTimerRef.current = setInterval(() => {
      tick += 1;
      idx = (idx + 1) % pool.length;
      setThinkingMethodId(pool[idx]);
      setThinkingStage(Math.floor(tick / 7) % THINKING_STAGES.length);
    }, 220);
    // 每秒累加已耗时，显示给用户
    const secTimer = setInterval(() => setThinkingSeconds((s) => s + 1), 1000);
    return () => {
      if (thinkingTimerRef.current !== null) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      clearInterval(secTimer);
    };
  }, [waitingFirstChunk, pickedFromDomain]);

  // 解析 URL ?q= 分享链接：朋友点开时自动 prefill prompt
  // 注意：不自动提交，避免意外消耗配额；只 prefill 让用户主动点
  // 用 window.location 而非 useSearchParams，避免触发 SSG bailout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const d = params.get("d");
    if (q) {
      setPrompt(q);
      if (d && DOMAINS.some((dd) => dd.key === d)) {
        setActiveDomain(d as DomainKey);
        setPickedFromDomain(d as DomainKey | "free");
      }
    }
  }, []);

  // 选择领域时持久化
  const pickDomain = useCallback((key: DomainKey) => {
    setActiveDomain(key);
    try {
      localStorage.setItem("innolab.demo.domain", key);
    } catch {
      /* noop */
    }
  }, []);

  // 流式时「智能跟随」滚动：仅当用户已在底部附近时才自动跟随；
  // 一旦用户手动往上滚（离底部 > 120px），停止自动滚动，让其自由查看。
  const stickToBottomRef = useRef(true);

  // 监听用户滚动，判断是否还「贴着底部」
  useEffect(() => {
    const onScroll = () => {
      const distanceToBottom =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      stickToBottomRef.current = distanceToBottom < 120;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 新内容到达时，只有「贴底」状态才自动滚
  useEffect(() => {
    if (phase === "streaming" && stickToBottomRef.current) {
      outputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [output, phase]);

  // 每次开始新的流式分析时，重置为「跟随」
  useEffect(() => {
    if (phase === "streaming") stickToBottomRef.current = true;
  }, [submittedPrompt, phase]);

  /** 保存用户背景到 state + localStorage */
  const saveUserContext = useCallback((text: string) => {
    const trimmed = text.trim();
    setUserContext(trimmed);
    setUserContextDraft(trimmed);
    setContextOpen(false);
    try {
      if (trimmed) {
        localStorage.setItem("innolab.userContext.v1", trimmed);
      } else {
        localStorage.removeItem("innolab.userContext.v1");
      }
    } catch {
      /* noop */
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setOutput("");
    setSubmittedPrompt("");
    setUsage(null);
    setError(null);
    setFeedback(null);
    setFeedbackNote("");
    setShowNoteInput(false);
    setCopied(null);
    setFromReplay(false);
    // 重置 thread —— 新问题就是新 thread
    setCurrentThread(null);
    setThreadHistory([]);
    setFollowUpKind(null);
    setExpandedMsgIds(new Set());
    setMethodDrillOpen(false);
    // 刷新历史显示
    setHistory(readHistory());
    // 清除 lastThread 记录，避免下次进来又恢复
    try { localStorage.removeItem("innolab.lastThread.v1"); } catch { /* noop */ }
    setSessionRestored(false);
  }, []);

  /** 切换某条历史消息的展开 / 折叠 */
  const toggleMsg = useCallback((id: string) => {
    setExpandedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* —— 续 thread 的 3 类后续 —— */

  /** 继续追问 — 用户填一个补充问题 */
  const [deeperInput, setDeeperInput] = useState("");
  const [deeperOpen, setDeeperOpen] = useState(false);
  const submitDeeper = useCallback(() => {
    const q = deeperInput.trim();
    if (!q) return;
    setDeeperInput("");
    setDeeperOpen(false);
    void submit(q, { kind: "deeper" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deeperInput]);

  /** 换角度问 — 4 个标准角度 */
  const ANGLES = [
    { key: "user", label: "用户角度", template: "用「用户视角」重新看这个问题：他们真正想要的是什么？他们怎么感知这个事？" },
    { key: "competitor", label: "竞品 / 已有玩家", template: "用「竞争对手 / 已有玩家」的视角看：他们已经在做什么？他们的盲点在哪？" },
    { key: "risk", label: "风险 / 反向", template: "把这个问题反过来问：怎么做最容易失败？三大风险点是什么？" },
    { key: "data", label: "数据 / 证据", template: "我需要哪些数据 / 证据来真正验证上面的判断？怎么用最低成本拿到？" },
  ] as const;
  const submitAngle = useCallback(
    (template: string) => {
      void submit(template, { kind: "angle" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** 深入某方法 — 从最新输出抽取方法 ID */
  const lastOutput =
    threadHistory.length > 0 ? threadHistory[threadHistory.length - 1].output : output;
  const citedMethodIds = extractMethodIds(lastOutput);
  /** AI 生成的追问建议（## 追问方向 段落里的 3 个问题） */
  const suggestedFollowUps = phase === "done" ? extractFollowUpQuestions(lastOutput) : [];

  /** 相关案例推荐：分析完成后显示与本次域相关的案例（最多 2 个） */
  const relatedCases = (() => {
    if (phase !== "done" || casesIndex.length === 0) return [];
    // 计算有效领域
    const dom =
      activeDomain !== "all"
        ? activeDomain
        : (detectDomainFromPrompt(submittedPrompt) ?? "all");
    if (dom === "all") return [];
    // 领域关键词
    const KWS: Record<string, string[]> = {
      "ai-transform": ["AI转型", "企业AI转型", "AI工具"],
      "product": ["AI产品", "产品设计", "产品"],
      "ip-content": ["IP商业化", "文创", "内容"],
      "org": ["人才", "组织", "管理"],
      "strategy": ["战略", "SaaS", "竞争", "出海", "商业模式", "企业服务"],
    };
    const kws = KWS[dom] ?? [];
    if (kws.length === 0) return [];
    const scored = casesIndex
      .map((c) => ({
        case: c,
        score: (c.domain ?? []).filter((d) => kws.some((k) => d.includes(k))).length,
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 2).map((s) => s.case);
  })();
  const submitMethodDrill = useCallback(
    (methodId: string) => {
      void submit(
        `深入讲 ${methodId}：它在我刚才的场景下，具体怎么用？给我可执行的步骤和判断标准。`,
        { kind: "method" },
      );
      setMethodDrillOpen(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** 从历史回放某次分析 — 不发 API */
  const replayFromHistory = useCallback((item: HistoryItem) => {
    abortRef.current?.abort();
    setPhase("done");
    setSubmittedPrompt(item.prompt);
    setOutput(item.output);
    setUsage(null);
    setError(null);
    setFeedback(null);
    setCopied(null);
    setFromReplay(true);
    if (DOMAINS.some((d) => d.key === item.domain)) {
      setPickedFromDomain(item.domain as DomainKey | "free");
    }
    setTimeout(() => {
      outputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    removeFromHistory(id);
    setHistory(readHistory());
  }, []);

  /** 复制分析结果到剪贴板 */
  const copyResult = useCallback(async () => {
    try {
      const text = `【问题】${submittedPrompt}\n\n${output}\n\n—— InnoLab 战略推演 · https://innolab.cc/demo`;
      await navigator.clipboard.writeText(text);
      setCopied("result");
      setTimeout(() => setCopied(null), 2200);
    } catch {
      /* 浏览器拒绝 — 忽略 */
    }
  }, [submittedPrompt, output]);

  /** 复制分享链接 */
  const copyShareLink = useCallback(async () => {
    try {
      const url = buildShareUrl(submittedPrompt, activeDomain);
      await navigator.clipboard.writeText(url);
      setCopied("link");
      setTimeout(() => setCopied(null), 2200);
    } catch {
      /* noop */
    }
  }, [submittedPrompt, activeDomain]);

  /** 提交反馈 */
  const sendFeedback = useCallback(
    async (kind: "up" | "down") => {
      setFeedback(kind);
      // 👎 打开备注输入；👍 直接发
      if (kind === "down") {
        setShowNoteInput(true);
      }
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind,
            prompt: submittedPrompt,
            domain: activeDomain,
          }),
        });
      } catch {
        /* 静默失败 — 不影响用户 */
      }
    },
    [submittedPrompt, activeDomain],
  );

  const sendFeedbackNote = useCallback(async () => {
    const note = feedbackNote.trim();
    if (!note || !feedback) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: feedback,
          prompt: submittedPrompt,
          domain: activeDomain,
          note,
        }),
      });
      setShowNoteInput(false);
    } catch {
      /* noop */
    }
  }, [feedback, feedbackNote, submittedPrompt, activeDomain]);

  const submit = useCallback(
    async (
      text: string,
      opts?: { kind?: "deeper" | "angle" | "method" },
    ) => {
      const trimmed = text.trim();
      if (!trimmed || phase === "streaming") return;

      // 用户背景注入：首轮时把背景信息拼入 prompt，后续轮次跳过（priorSummary 已含前文）
      const kind = opts?.kind ?? null;
      const isFirstTurn = !kind || threadHistory.length === 0;
      const enrichedPrompt =
        isFirstTurn && userContext
          ? `【我的背景】${userContext}\n\n${trimmed}`
          : trimmed;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // 续 thread：构建 prior_summary（前文压缩精要）
      const isFollowUp = !!kind && threadHistory.length > 0;
      const priorSummary = isFollowUp
        ? buildPriorSummary({
            id: currentThread?.id ?? "transient",
            domain: activeDomain,
            rootPrompt: threadHistory[0]?.prompt ?? trimmed,
            messages: threadHistory,
            startedAt: currentThread?.startedAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        : "";

      setFollowUpKind(kind);
      setSubmittedPrompt(trimmed);
      setOutput("");
      setUsage(null);
      setError(null);
      setFeedback(null);
      setShowNoteInput(false);
      setCopied(null);
      setMethodDrillOpen(false);
      setDeeperOpen(false);
      setSessionRestored(false); // 新轮次开始，清除恢复标志
      setPhase("streaming");
      setWaitingFirstChunk(true);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);

      try {
        // 有效领域：用户手动选了就用手动的，否则从 prompt 文本自动推断
        const effectiveDomain =
          activeDomain !== "all"
            ? activeDomain
            : (detectDomainFromPrompt(trimmed) ?? "all");

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // enrichedPrompt 在首轮时含【我的背景】前缀，后续轮次直接用 trimmed
            prompt: enrichedPrompt,
            // 数据采集：用户走了哪个领域的入口
            source: pickedFromDomain,
            domain: effectiveDomain,
            // 续 thread 时携带前文精要 + kind
            prior_summary: priorSummary || undefined,
            follow_up_kind: kind || undefined,
            // 咨询客户专属令牌：有效则豁免限流
            client_token: clientToken || undefined,
            // 留资用户标识：飞轮按人归属
            user_key: userKey || undefined,
          }),
          signal: ctrl.signal,
        });

        // 限流头先读出来
        const rg = res.headers.get("X-RateLimit-Remaining-Global");
        const ri = res.headers.get("X-RateLimit-Remaining-Ip");
        setRemaining({
          global: rg ? Number(rg) : undefined,
          ip: ri ? Number(ri) : undefined,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setPhase("error");
          setError({
            message: data.error ?? `请求失败：HTTP ${res.status}`,
            reason: res.status === 429 ? "rate_limit" : "api",
          });
          return;
        }
        if (!res.body) {
          setPhase("error");
          setError({ message: "服务端没返回流式响应。", reason: "api" });
          return;
        }

        // —— SSE 解析 ——
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        // 本地累积，用于完成时存历史（state 是异步的，不可靠）
        let outputAccumulator = "";
        // 本地标志：第一个 delta 到达时清除"装填中"状态
        // 不能用 waitingFirstChunk state（async 闭包里是 stale 值）
        let isFirstChunk = true;

        const finalize = () => {
          // 1) 老的"最近问过"历史也维持（用户视角友好）
          appendToHistory({
            prompt: trimmed,
            domain: activeDomain,
            output: outputAccumulator,
          });
          setHistory(readHistory());

          // 2) Thread 更新 —— 续写 vs 新开
          let updated: Thread | null = null;
          if (kind && currentThread) {
            updated = appendToThread(currentThread.id, {
              prompt: trimmed,
              output: outputAccumulator,
              followUpKind: kind,
            });
          } else {
            updated = startThread({
              prompt: trimmed,
              domain: activeDomain,
              output: outputAccumulator,
            });
          }
          if (updated) {
            setCurrentThread(updated);
            setThreadHistory(updated.messages);
            // 持久化当前 thread ID，支持刷新后恢复
            try {
              localStorage.setItem("innolab.lastThread.v1", updated.id);
            } catch {
              /* noop */
            }
          }

          // 3) 更新已探索方法集合（学习轨迹）
          const newIds = extractMethodIds(outputAccumulator);
          if (newIds.length > 0) {
            setSeenMethodIds((prev) => {
              const next = new Set(prev);
              newIds.forEach((id) => next.add(id));
              try {
                localStorage.setItem(
                  "innolab.seenMethods.v1",
                  JSON.stringify(Array.from(next)),
                );
              } catch {
                /* noop */
              }
              return next;
            });
          }

          setPhase("done");
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by \n\n; each line starts with "data: "
          let sepIdx;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);

            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const json = line.slice(5).trim();
              if (!json) continue;

              try {
                const ev = JSON.parse(json);
                if (ev.type === "delta") {
                  if (isFirstChunk) {
                    setWaitingFirstChunk(false);
                    isFirstChunk = false;
                  }
                  outputAccumulator += ev.text;
                  setOutput((prev) => prev + ev.text);
                } else if (ev.type === "usage") {
                  setUsage({
                    input: ev.input,
                    output: ev.output,
                    cacheRead: ev.cacheRead,
                    cacheWrite: ev.cacheWrite,
                  });
                } else if (ev.type === "error") {
                  setError({ message: ev.message, reason: "api" });
                  setPhase("error");
                  return;
                } else if (ev.type === "done") {
                  if (outputAccumulator.trim()) finalize();
                  return;
                }
              } catch {
                /* skip malformed */
              }
            }
          }
        }

        // 流自然结束（没有 done 事件 — 也算完成）
        if (outputAccumulator.trim()) {
          finalize();
        } else {
          setPhase((p) => (p === "streaming" ? "done" : p));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // 用户主动取消
          return;
        }
        setPhase("error");
        setError({
          message:
            err instanceof Error
              ? err.message
              : "网络出错。检查连接后再试。",
          reason: "unknown",
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, activeDomain, pickedFromDomain, currentThread, threadHistory, userContext],
  );

  return (
    <div className="relative">
      {/* —— 输入区（idle 时显示）—— */}
      {phase === "idle" && (
        <section>
          {/* 用户背景记忆 — 存一次，每次分析自动带入 */}
          <div className="mb-3">
            {userContext && !contextOpen ? (
              <button
                type="button"
                onClick={() => setContextOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/[0.05] px-3 py-1 text-[11px] text-volt/80 transition hover:border-volt hover:text-volt"
              >
                <span className="size-1.5 rounded-full bg-volt/70" />
                <span className="max-w-[240px] truncate">背景：{userContext}</span>
                <span className="ml-1 text-dust">编辑</span>
              </button>
            ) : !contextOpen ? (
              <button
                type="button"
                onClick={() => setContextOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] text-dust transition hover:text-ash"
              >
                <span className="text-volt/60">+</span>
                告诉 InnoLab 你的背景，让分析更精准
              </button>
            ) : null}

            {contextOpen && (
              <div className="rounded-lg border border-volt/30 bg-volt/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-widest text-volt mb-2">
                  你的背景（保存后自动加入每次分析）
                </div>
                <textarea
                  value={userContextDraft}
                  onChange={(e) => setUserContextDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setContextOpen(false);
                      setUserContextDraft(userContext);
                    }
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      saveUserContext(userContextDraft);
                    }
                  }}
                  placeholder="例：我是一家 50 人设计公司的 CEO，主营 IP 周边，年营收 2000 万，正在考虑 AI 转型"
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-bone outline-none placeholder:text-dust/60"
                  autoFocus
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveUserContext(userContextDraft)}
                    className="rounded bg-volt px-3 py-1 text-[11px] font-semibold text-ink hover:brightness-110"
                  >
                    保存
                  </button>
                  {userContext && (
                    <button
                      type="button"
                      onClick={() => saveUserContext("")}
                      className="text-[11px] text-dust hover:text-rose-400"
                    >
                      清除
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setContextOpen(false);
                      setUserContextDraft(userContext);
                    }}
                    className="ml-auto text-[11px] text-dust hover:text-ash"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(prompt);
            }}
          >
            {/* 灵感示例：prompt 为空时显示，淡入淡出切换 */}
            {!prompt && (
              <div
                className="mb-2 flex items-start gap-2 transition-opacity duration-300"
                style={{ opacity: exampleVisible ? 1 : 0 }}
              >
                <span className="mt-0.5 shrink-0 text-[10px] uppercase tracking-widest text-dust">
                  例如
                </span>
                <button
                  type="button"
                  onClick={() => setPrompt(EXAMPLE_PROMPTS[exampleIdx])}
                  className="flex-1 text-left text-sm text-ash/70 transition hover:text-ash"
                  title="点击填入这个问题"
                >
                  {EXAMPLE_PROMPTS[exampleIdx]}
                </button>
                <span className="mt-0.5 shrink-0 text-[10px] text-volt/50">
                  ↗
                </span>
              </div>
            )}
            <div className="rounded-xl border border-fog-2 bg-soot p-4 transition focus-within:border-volt">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit(prompt);
                  }
                }}
                placeholder="输入你的商业问题…"
                rows={4}
                className="w-full resize-none bg-transparent text-base text-bone outline-none placeholder:text-dust"
              />
              <div className="mt-3 flex items-center justify-between border-t border-fog-1 pt-3">
                <span className="flex items-center gap-2 text-[11px] text-dust">
                  <Cpu className="size-3" />
                  MiMo v2.5 Pro · 83 方法 + 76 案例
                  {clientToken ? (
                    <span className="ml-2 text-volt">专属不限次</span>
                  ) : (
                    remaining.ip !== undefined && (
                      <span className="ml-2 text-ash">
                        今日剩 {remaining.ip} 次
                      </span>
                    )
                  )}
                  {seenMethodIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMethodMap((v) => !v)}
                      className="ml-2 text-volt/70 hover:text-volt transition underline-offset-2 hover:underline"
                      title="查看方法探索地图"
                    >
                      · 已探索 {seenMethodIds.size} / 83 个方法
                    </button>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-volt px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="size-3" />
                  分析
                  <kbd className="numeral hidden rounded bg-ink/20 px-1 text-[10px] sm:inline">
                    ⌘↵
                  </kbd>
                </button>
              </div>
            </div>
          </form>

          {/* 方法探索地图 — 点击"已探索 N 个方法"后展开 */}
          {showMethodMap && seenMethodIds.size > 0 && (
            <MethodMap
              methodsIndex={methodsIndex}
              seenMethodIds={seenMethodIds}
              onClose={() => setShowMethodMap(false)}
            />
          )}

          {/* 历史栏 — 仅当本地有过往分析时显示 */}
          {history.length > 0 && (
            <div className="mt-6 rounded-lg border border-fog-2 bg-soot/60 p-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-dust">
                  <History className="size-3" />
                  最近问过
                </div>
                <div className="numeral text-[10px] text-dust">
                  {history.length} 个 · 本地存储
                </div>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {history.slice(0, 6).map((h) => (
                  <li key={h.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => replayFromHistory(h)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-fog-2 bg-ink px-2.5 py-1 text-[11px] text-ash transition hover:border-volt hover:text-bone"
                      title={`回放：${h.prompt}`}
                    >
                      <span className="max-w-[180px] truncate">{h.prompt}</span>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(h.id);
                        }}
                        className="ml-1 inline-flex shrink-0 items-center justify-center rounded p-0.5 opacity-0 transition hover:bg-fog-2 group-hover:opacity-60 hover:!opacity-100"
                        aria-label="删除这条历史"
                      >
                        <Trash2 className="size-3" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 领域分流 + 建议问题 */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-widest text-dust">
                按领域选问题
              </div>
              <div className="numeral text-xs text-dust">
                {visibleSuggestions.length} 个
              </div>
            </div>
            {/* 领域 chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => pickDomain(d.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    activeDomain === d.key
                      ? "border-volt bg-volt text-ink"
                      : "border-fog-2 bg-soot text-ash hover:border-fog-3 hover:text-bone",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visibleSuggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setPrompt(s.label);
                    setPickedFromDomain(s.domain);
                    submit(s.label);
                  }}
                  className="group flex items-start gap-3 rounded-lg border border-fog-2 bg-soot p-4 text-left transition hover:border-volt hover:bg-graphite"
                >
                  <CornerDownLeft className="mt-0.5 size-4 shrink-0 text-volt opacity-60 transition group-hover:opacity-100" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-bone">
                      {s.label}
                    </div>
                  </div>
                  <span className="ml-auto shrink-0 rounded border border-fog-2 px-1.5 py-0.5 text-[10px] text-ash">
                    {s.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs text-dust">
            限免使用，全站每天 50 次、单用户每天 5 次。
            如果问题足够重要、想要邱懿武亲自陪你想透，
            <Link href="/about" className="text-volt hover:underline">
              联系咨询
            </Link>
            。
          </p>
        </section>
      )}

      {/* —— 运行 / 完成 / 错误：共用输出区 —— */}
      {/* 首次访客引导（localStorage 控制，仅新用户看到） */}
      <OnboardTour />

      {phase !== "idle" && (
        <section ref={outputRef}>
          {/* Thread 历史：本会话之前的 Q/A，折叠展示
              done 时最后一条 = 当前显示的主 Q+A，去掉避免重复 */}
          {(() => {
            const past =
              phase === "done" &&
              threadHistory.length > 0 &&
              threadHistory[threadHistory.length - 1].prompt === submittedPrompt
                ? threadHistory.slice(0, -1)
                : threadHistory;
            if (past.length === 0) return null;
            return (
            <div className="mb-5 space-y-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-dust">
                <MessageSquarePlus className="size-3" />
                <span>本次会话 · 前 {past.length} 轮</span>
              </div>
              {past.map((m, i) => {
                const isOpen = expandedMsgIds.has(m.id);
                const kindBadge =
                  m.followUpKind === "deeper"
                    ? "继续追问"
                    : m.followUpKind === "angle"
                      ? "换角度"
                      : m.followUpKind === "method"
                        ? "深入方法"
                        : null;
                return (
                  <article
                    key={m.id}
                    className="overflow-hidden rounded-lg border border-fog-2 bg-soot/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMsg(m.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-soot"
                    >
                      <span className="numeral text-[10px] text-volt">
                        Q{i + 1}
                      </span>
                      {kindBadge && (
                        <span className="rounded border border-fog-2 px-1.5 py-0.5 text-[10px] text-dust">
                          {kindBadge}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-ash">
                        {m.prompt}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="size-3.5 shrink-0 text-dust" />
                      ) : (
                        <ChevronDown className="size-3.5 shrink-0 text-dust" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-fog-2 bg-ink px-4 py-3">
                        <Markdown source={m.output} compact />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            );
          })()}

          {/* 用户问题回显 */}
          <div className="rounded-xl border border-fog-2 bg-soot p-5">
            <div className="flex items-center gap-2">
              <div className="text-xs uppercase tracking-widest text-dust">
                你问的
              </div>
              {threadHistory.length > 1 && (
                <span className="numeral rounded-full border border-volt/40 bg-volt/[0.06] px-2 py-0.5 text-[10px] text-volt">
                  第 {threadHistory.length} 轮
                </span>
              )}
            </div>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="text-lg font-semibold text-bone sm:text-xl">
                {submittedPrompt}
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-fog-2 px-2.5 py-1 text-[11px] text-ash transition hover:border-fog-3 hover:text-bone"
              >
                {phase === "streaming" ? (
                  <>
                    <X className="size-3" />
                    停止
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-3" />
                    换问题
                  </>
                )}
              </button>
            </div>
            {pickedFromDomain !== "free" && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-dust">
                <span className="size-1 rounded-full bg-volt" />
                <span>来自领域</span>
                <span className="text-ash">
                  {DOMAINS.find((d) => d.key === pickedFromDomain)?.label}
                </span>
              </div>
            )}
            {sessionRestored && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-volt/70">
                <span className="size-1 rounded-full bg-volt/70" />
                <span>上次会话已自动恢复</span>
              </div>
            )}
          </div>

          {/* 状态条 */}
          {(() => {
            // 从当前流式输出推断正在生成哪个段落（按出现顺序倒序判断）
            const streamingSection = (() => {
              if (!output) return null;
              if (output.includes("## 追问方向")) return "追问方向";
              if (output.includes("## 本次方法")) return "本次方法";
              if (output.includes("## 落地动作")) return "落地动作";
              if (output.includes("## 我的判断")) return "我的判断";
              if (output.includes("## 我的推演")) return "我的推演";
              if (output.includes("## 真正的问题")) return "真正的问题";
              return "分析中";
            })();
            return (
          <div className="mt-6 flex items-center gap-3 text-xs text-ash">
            {phase === "streaming" && (
              <>
                <span className="relative flex size-2 items-center justify-center">
                  <span className="absolute size-2 animate-ping rounded-full bg-volt opacity-75" />
                  <span className="size-2 rounded-full bg-volt" />
                </span>
                {waitingFirstChunk ? (
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-bone transition-all duration-300">
                      {THINKING_STAGES[thinkingStage]?.label ?? "深度推演中"}
                    </span>
                    {thinkingMethodId && (
                      <span className="numeral rounded border border-volt/25 bg-volt/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-volt/80 tabular-nums transition-all duration-200">
                        {thinkingMethodId}
                      </span>
                    )}
                    <span className="hidden text-dust sm:inline">
                      {thinkingSeconds >= 5
                        ? `深度推演中，通常需要十几秒 · 已 ${thinkingSeconds}s`
                        : THINKING_STAGES[thinkingStage]?.detail}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>InnoLab 推演中</span>
                    {streamingSection && (
                      <span className="rounded border border-volt/30 bg-volt/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-volt">
                        → {streamingSection}
                      </span>
                    )}
                  </span>
                )}
              </>
            )}
            {phase === "done" && (
              <>
                <span className="size-2 rounded-full bg-volt" />
                <span>完成</span>
                {usage && (
                  <span className="ml-2 numeral text-dust">
                    {usage.input + usage.cacheWrite + usage.cacheRead} in /{" "}
                    {usage.output} out
                    {usage.cacheRead > 0 && (
                      <span className="ml-1 text-volt">
                        ({Math.round((usage.cacheRead / (usage.input + usage.cacheRead || 1)) * 100)}% cached)
                      </span>
                    )}
                  </span>
                )}
              </>
            )}
            {phase === "error" && (
              <>
                <span className="size-2 rounded-full bg-rose-500" />
                <span>出错了</span>
              </>
            )}
          </div>
          );
          })()}

          {/* 推演输出 */}
          {output && (
            <article className="mt-6 rounded-xl border border-fog-2 bg-soot p-6 sm:p-8">
              <Markdown source={output} compact />
              {phase === "streaming" && (
                <span className="ml-1 inline-block size-2 translate-y-0.5 animate-pulse rounded-sm bg-volt" />
              )}
            </article>
          )}

          {/* 方法调用链可视化 — 推演完成后显示 */}
          {phase === "done" && citedMethodIds.length > 0 && (
            <MethodChainViz
              methodIds={citedMethodIds}
              methodsIndex={methodsIndex}
            />
          )}

          {/* 相关案例推荐 — 推演完成后显示同领域案例 */}
          {relatedCases.length > 0 && (
            <section className="mt-5 rounded-xl border border-fog-2 bg-soot p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="text-[11px] uppercase tracking-widest text-dust">
                  同领域参考案例
                </div>
                <div className="h-px flex-1 bg-fog-2" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                {relatedCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="group flex-1 rounded-lg border border-fog-2 bg-ink p-3 transition hover:border-volt/50"
                  >
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {(c.domain ?? []).slice(0, 2).map((d) => (
                        <span
                          key={d}
                          className="rounded bg-fog-1 px-1.5 py-0.5 text-[10px] text-dust"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm font-medium leading-snug text-bone group-hover:text-volt transition">
                      {c.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-dust">
                      {c.summary}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 错误态 */}
          {phase === "error" && error && (
            <div
              className={cn(
                "mt-6 rounded-xl border p-6",
                error.reason === "rate_limit"
                  ? "border-volt bg-volt/[0.04]"
                  : "border-fog-3 bg-soot",
              )}
            >
              <div className="flex items-start gap-3">
                <Sparkles
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    error.reason === "rate_limit"
                      ? "text-volt"
                      : "text-ash",
                  )}
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-bone">
                    {error.reason === "rate_limit"
                      ? "今日配额用完了"
                      : "调用失败"}
                  </h3>
                  <p className="mt-2 text-sm text-ash">{error.message}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {error.reason === "rate_limit" ? (
                      <Link
                        href="/about"
                        className="inline-flex items-center gap-1.5 rounded-md bg-volt px-4 py-2 text-xs font-semibold text-ink hover:brightness-110"
                      >
                        联系邱懿武咨询
                        <ArrowRight className="size-3" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => submit(submittedPrompt)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-volt px-4 py-2 text-xs font-semibold text-ink hover:brightness-110"
                      >
                        重试
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-4 py-2 text-xs text-bone hover:border-volt"
                    >
                      换问题
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 完成态 — 反馈 + 分享 + CTA */}
          {phase === "done" && (
            <div className="mt-10 space-y-4">
              {/* 反馈条 + 分享条（紧凑、并排） */}
              {!fromReplay && (
                <div className="rounded-lg border border-fog-2 bg-soot p-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* 反馈打分 */}
                    <span className="text-dust">这次分析：</span>
                    <button
                      type="button"
                      onClick={() => sendFeedback("up")}
                      disabled={feedback !== null}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition",
                        feedback === "up"
                          ? "border-volt bg-volt/15 text-volt"
                          : "border-fog-2 text-ash hover:border-fog-3 hover:text-bone",
                        feedback !== null &&
                          feedback !== "up" &&
                          "opacity-40",
                      )}
                    >
                      <ThumbsUp className="size-3" />
                      <span>有用</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => sendFeedback("down")}
                      disabled={feedback !== null}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition",
                        feedback === "down"
                          ? "border-rose-400/60 bg-rose-400/10 text-rose-300"
                          : "border-fog-2 text-ash hover:border-fog-3 hover:text-bone",
                        feedback !== null &&
                          feedback !== "down" &&
                          "opacity-40",
                      )}
                    >
                      <ThumbsDown className="size-3" />
                      <span>不准</span>
                    </button>

                    <span className="mx-1 hidden h-4 w-px bg-fog-2 sm:inline-block" />

                    {/* 分享 */}
                    <button
                      type="button"
                      onClick={copyResult}
                      className="inline-flex items-center gap-1 rounded-md border border-fog-2 px-2.5 py-1 text-ash transition hover:border-fog-3 hover:text-bone"
                    >
                      {copied === "result" ? (
                        <Check className="size-3 text-volt" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{copied === "result" ? "已复制" : "复制结果"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="inline-flex items-center gap-1 rounded-md border border-fog-2 px-2.5 py-1 text-ash transition hover:border-fog-3 hover:text-bone"
                    >
                      {copied === "link" ? (
                        <Check className="size-3 text-volt" />
                      ) : (
                        <Share2 className="size-3" />
                      )}
                      <span>
                        {copied === "link" ? "已复制" : "分享给朋友"}
                      </span>
                    </button>

                    {feedback && !showNoteInput && (
                      <span className="ml-auto text-[11px] text-dust">
                        谢谢反馈
                      </span>
                    )}
                  </div>

                  {/* 👎 之后的备注输入 */}
                  {showNoteInput && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={feedbackNote}
                        onChange={(e) => setFeedbackNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendFeedbackNote();
                        }}
                        placeholder="说一句哪里不准（可选）"
                        className="flex-1 rounded border border-fog-2 bg-ink px-3 py-1.5 text-xs text-bone outline-none focus:border-volt"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={sendFeedbackNote}
                        disabled={!feedbackNote.trim()}
                        className="rounded bg-volt px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-40"
                      >
                        发送
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNoteInput(false)}
                        className="rounded border border-fog-2 px-2 py-1.5 text-[11px] text-ash hover:text-bone"
                      >
                        跳过
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 续 thread — 让 agent 感真正出来 */}
              {!fromReplay && (
                <div className="rounded-xl border border-fog-3 bg-soot p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-volt">
                    <MessageSquarePlus className="size-3.5" />
                    <span>继续这次会话</span>
                  </div>
                  <p className="mt-2 text-xs text-dust">
                    InnoLab 会带着前面的判断回答你，不是从头开始想。
                  </p>

                  {/* AI 生成的追问建议 — 一键触发下一轮 */}
                  {suggestedFollowUps.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-volt/70">
                        <Zap className="size-3" />
                        <span>InnoLab 建议你继续问</span>
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {suggestedFollowUps.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              void submit(q, { kind: "deeper" });
                            }}
                            className="group flex items-start gap-3 rounded-lg border border-volt/30 bg-volt/[0.04] px-4 py-3 text-left transition hover:border-volt hover:bg-volt/[0.08]"
                          >
                            <span className="numeral mt-0.5 shrink-0 text-[10px] text-volt">
                              Q{i + 1}
                            </span>
                            <span className="flex-1 text-sm leading-snug text-bone">
                              {q}
                            </span>
                            <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-volt opacity-60 transition group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeeperOpen((v) => !v);
                        setMethodDrillOpen(false);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs transition",
                        deeperOpen
                          ? "border-volt bg-volt/10 text-volt"
                          : "border-fog-2 bg-ink text-bone hover:border-volt",
                      )}
                    >
                      <MessageSquarePlus className="size-3.5" />
                      继续追问
                    </button>

                    {/* 4 个角度按钮直接显示，省去二级菜单 */}
                    {ANGLES.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => submitAngle(a.template)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-fog-2 bg-ink px-3 py-2 text-xs text-bone transition hover:border-volt"
                      >
                        <RefreshCw className="size-3.5" />
                        换 · {a.label}
                      </button>
                    ))}

                    {citedMethodIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setMethodDrillOpen((v) => !v);
                          setDeeperOpen(false);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs transition",
                          methodDrillOpen
                            ? "border-volt bg-volt/10 text-volt"
                            : "border-fog-2 bg-ink text-bone hover:border-volt",
                        )}
                      >
                        <Microscope className="size-3.5" />
                        深入某方法
                      </button>
                    )}
                  </div>

                  {/* "继续追问"输入区 */}
                  {deeperOpen && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={deeperInput}
                        onChange={(e) => setDeeperInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitDeeper();
                        }}
                        placeholder="进一步问什么？例：那 90 天具体怎么排？"
                        className="flex-1 rounded border border-fog-2 bg-ink px-3 py-2 text-sm text-bone outline-none focus:border-volt"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={submitDeeper}
                        disabled={!deeperInput.trim()}
                        className="rounded bg-volt px-4 py-2 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
                      >
                        发送
                      </button>
                    </div>
                  )}

                  {/* "深入方法"选择区 */}
                  {methodDrillOpen && citedMethodIds.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[11px] text-dust">
                        InnoLab 刚才调用了这些方法 —— 点一个深入：
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {citedMethodIds.map((id) => {
                          const m = methodsIndex[id];
                          return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => submitMethodDrill(id)}
                            className="inline-flex items-center gap-1.5 rounded border border-fog-2 bg-ink px-2.5 py-1.5 text-left transition hover:border-volt group"
                          >
                            <Microscope className="size-3 shrink-0 text-volt" />
                            <span className="numeral text-[10px] text-volt">{id}</span>
                            {m?.titleCn && (
                              <span className="text-[11px] text-ash group-hover:text-bone">
                                {m.titleCn}
                              </span>
                            )}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 主 CTA */}
              <div className="rounded-xl border border-volt bg-volt/[0.04] p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="numeral text-xs uppercase tracking-widest text-volt">
                      {fromReplay ? "Replay · 历史回放" : "Done · v0.1"}
                    </div>
                    <h3 className="display mt-2 text-2xl text-bone sm:text-3xl">
                      {fromReplay
                        ? "这次是从历史调出来的"
                        : "再问一个？或者让邱懿武亲自帮你。"}
                    </h3>
                    <p className="mt-3 text-sm text-ash">
                      {fromReplay
                        ? "没有重新调用 AI，没扣配额。"
                        : `今天还剩 ${remaining.ip ?? "?"} 次。当问题足够重要、值得一个人陪你想透，邱懿武提供 1:1 战略咨询。`}
                    </p>
                  </div>
                  {!fromReplay && (
                    <Link
                      href="/about"
                      className="inline-flex shrink-0 items-center gap-2 self-start rounded-md bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 sm:self-center"
                    >
                      联系邱懿武
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-fog-2 pt-6">
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                  >
                    <RotateCcw className="size-3" />
                    再问一个
                  </button>
                  <Link
                    href="/methods"
                    className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                  >
                    浏览方法库
                  </Link>
                  <Link
                    href="/cases"
                    className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                  >
                    看真实案例
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   方法探索地图 — 显示 83 个方法 ID，已探索的亮 volt 色
   ────────────────────────────────────────────────────────────────────────── */

const ENGINE_META: { prefix: string; label: string; color: string }[] = [
  { prefix: "CG", label: "认知", color: "text-amber-400" },
  { prefix: "ST", label: "战略", color: "text-sky-400" },
  { prefix: "GN", label: "生成", color: "text-emerald-400" },
  { prefix: "DC", label: "决策", color: "text-rose-400" },
  { prefix: "PD", label: "产品", color: "text-purple-400" },
  { prefix: "EV", label: "进化", color: "text-orange-400" },
];

function MethodMap({
  methodsIndex,
  seenMethodIds,
  onClose,
}: {
  methodsIndex: Record<string, MethodMeta>;
  seenMethodIds: Set<string>;
  onClose: () => void;
}) {
  const allIds = Object.keys(methodsIndex).sort();
  const pct = Math.round((seenMethodIds.size / allIds.length) * 100);

  return (
    <div className="mt-3 rounded-xl border border-volt/30 bg-soot p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-widest text-volt">
          方法探索地图
        </span>
        <span className="numeral text-[11px] text-dust">
          {seenMethodIds.size} / {allIds.length} · {pct}%
        </span>
        {/* 进度条 */}
        <div className="flex-1 h-1 rounded-full bg-fog-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-volt transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-dust hover:text-ash transition"
        >
          收起
        </button>
      </div>
      <div className="space-y-2">
        {ENGINE_META.map(({ prefix, label, color }) => {
          const group = allIds.filter((id) => id.startsWith(prefix));
          if (group.length === 0) return null;
          return (
            <div key={prefix} className="flex items-start gap-2">
              <span
                className={`w-8 shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-widest ${color}`}
              >
                {label}
              </span>
              <div className="flex flex-wrap gap-1">
                {group.map((id) => {
                  const seen = seenMethodIds.has(id);
                  const meta = methodsIndex[id];
                  return (
                    <Link
                      key={id}
                      href={meta?.slug ? `/methods/${meta.slug}` : "#"}
                      title={meta?.titleCn ?? id}
                      className={cn(
                        "numeral rounded px-1.5 py-0.5 text-[10px] transition hover:scale-110",
                        seen
                          ? "border border-volt/60 bg-volt/10 text-volt font-bold"
                          : "border border-fog-2 bg-ink text-dust",
                      )}
                    >
                      {id}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-dust">
        亮色 = 本次推演里出现过的方法 · 点击 ID 看方法详情
      </p>
    </div>
  );
}
