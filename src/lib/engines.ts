// 六大引擎元数据 - 用于首页卡片、筛选、配色映射
export type EngineKey =
  | "cognition"
  | "strategy"
  | "generation"
  | "decision"
  | "product"
  | "evolution";

export interface Engine {
  key: EngineKey;
  cn: string;
  en: string;
  emoji: string;
  oneliner: string;
  count: number; // 现有方法数
  // Tailwind class fragments (静态字符串，避免 JIT 漏扫)
  color: string; // bg-* 主色
  colorSoft: string; // bg-*/10 浅底
  colorText: string; // text-*
  colorBorder: string; // border-*
  colorHex: string;
}

export const engines: Engine[] = [
  {
    key: "cognition",
    cn: "认知引擎",
    en: "Cognition",
    emoji: "🧠",
    oneliner: "看清世界 — 拆解现象、识别结构、洞察底层",
    count: 19,
    color: "bg-cobalt",
    colorSoft: "bg-cobalt/10",
    colorText: "text-cobalt",
    colorBorder: "border-cobalt",
    colorHex: "#2D5BFF",
  },
  {
    key: "strategy",
    cn: "战略引擎",
    en: "Strategy",
    emoji: "🎯",
    oneliner: "选择战场 — 蓝海、护城河、范式转移",
    count: 18,
    color: "bg-flare",
    colorSoft: "bg-flare/10",
    colorText: "text-flare",
    colorBorder: "border-flare",
    colorHex: "#FF6B35",
  },
  {
    key: "generation",
    cn: "生成引擎",
    en: "Generation",
    emoji: "💡",
    oneliner: "创造解法 — 头脑风暴、原型、设计思维",
    count: 12,
    color: "bg-acid",
    colorSoft: "bg-acid/15",
    colorText: "text-acid-ink",
    colorBorder: "border-acid",
    colorHex: "#B4E60E",
  },
  {
    key: "decision",
    cn: "决策引擎",
    en: "Decision",
    emoji: "⚖️",
    oneliner: "筛选最优 — SWOT、KANO、价值评估",
    count: 9,
    color: "bg-violet",
    colorSoft: "bg-violet/10",
    colorText: "text-violet",
    colorBorder: "border-violet",
    colorHex: "#8B5CF6",
  },
  {
    key: "product",
    cn: "产品引擎",
    en: "Product",
    emoji: "🧩",
    oneliner: "变成现实 — BMC、MVP、人货场、用户画像",
    count: 14,
    color: "bg-rose",
    colorSoft: "bg-rose/10",
    colorText: "text-rose",
    colorBorder: "border-rose",
    colorHex: "#FF3B7F",
  },
  {
    key: "evolution",
    cn: "进化引擎",
    en: "Evolution",
    emoji: "🔁",
    oneliner: "持续优化 — AARRR、OKR、数据飞轮",
    count: 3,
    color: "bg-cyan",
    colorSoft: "bg-cyan/10",
    colorText: "text-cyan",
    colorBorder: "border-cyan",
    colorHex: "#06B6D4",
  },
];

export const layers = [
  { id: "L1", name: "感知层", desc: "看到现象和信息" },
  { id: "L2", name: "理解层", desc: "理解结构和关系" },
  { id: "L3", name: "方法层", desc: "掌握工具和框架" },
  { id: "L4", name: "系统层", desc: "构建系统和结构" },
  { id: "L5", name: "范式层", desc: "定义底层逻辑和世界观" },
] as const;

export const totalMethods = engines.reduce((s, e) => s + e.count, 0);
