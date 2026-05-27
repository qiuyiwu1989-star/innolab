// 六大引擎元数据
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
  code: string;
  oneliner: string;
  role: string;
  /** 引擎落地页用：3-4 句话深描 */
  description: string;
  /** 推荐起步方法 ID（如未存在会被过滤） */
  recommended: string[];
  /** 该引擎在生产链里的位置编号 */
  order: number;
  count: number;
}

export const engines: Engine[] = [
  {
    key: "cognition",
    cn: "认知",
    en: "Cognition",
    code: "CG",
    oneliner: "看清世界",
    role: "拆解现象、识别结构、洞察底层",
    description:
      "认知是一切方法的起点。当你看不清问题，所有的解法都只是动作。这个引擎里的 19 个方法帮你拆解信息、识别底层结构、判断你正在思考的是 L1 现象还是 L5 范式。",
    recommended: ["CG01", "CG14", "CG07"],
    order: 1,
    count: 19,
  },
  {
    key: "strategy",
    cn: "战略",
    en: "Strategy",
    code: "ST",
    oneliner: "选择战场",
    role: "蓝海、护城河、范式转移",
    description:
      "战略不是规划，是选择 — 选打哪场、不打哪场。这个引擎从波特五力、SWOT 这些经典工具，到范式转移、护城河迁移这些 L5 框架，帮你识别真假战场。",
    recommended: ["ST06", "ST10", "ST08"],
    order: 2,
    count: 18,
  },
  {
    key: "generation",
    cn: "生成",
    en: "Generation",
    code: "GN",
    oneliner: "创造解法",
    role: "头脑风暴、原型、设计思维",
    description:
      "战场选好之后才轮到怎么打。生成引擎把模糊的方向变成具体的解法 — 12 个方法覆盖从头脑风暴到设计思维、从原型法到具身生产。强调数量先于质量。",
    recommended: ["GN04", "GN02", "GN09"],
    order: 3,
    count: 12,
  },
  {
    key: "decision",
    cn: "决策",
    en: "Decision",
    code: "DC",
    oneliner: "筛选最优",
    role: "SWOT、KANO、价值评估",
    description:
      "多方案出来后，要会砍。决策引擎给你 9 把刀 — SWOT、KANO、J 曲线、价值评估矩阵 — 帮你识别真假优势、真假需求、真假风险。",
    recommended: ["DC02", "DC04", "DC05"],
    order: 4,
    count: 9,
  },
  {
    key: "product",
    cn: "产品",
    en: "Product",
    code: "PD",
    oneliner: "变成现实",
    role: "BMC、MVP、人货场、用户画像",
    description:
      "决策定了，要把它落地成产品 / 商业模式 / 用户体验。14 个方法 — 从 BMC 商业画布到 MVP，从人货场到 Hook 模型 — 把抽象判断变成可交付的东西。",
    recommended: ["PD01", "PD10", "PD08"],
    order: 5,
    count: 14,
  },
  {
    key: "evolution",
    cn: "进化",
    en: "Evolution",
    code: "EV",
    oneliner: "持续优化",
    role: "AARRR、OKR、数据飞轮",
    description:
      "产品上线只是开始。进化引擎用 AARRR 漏斗、OKR 目标对齐、数据场景飞轮，帮你把'一次性产品'变成'持续迭代的能力'。",
    recommended: ["EV01", "EV03", "EV02"],
    order: 6,
    count: 3,
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

export function getEngine(key: string): Engine | undefined {
  return engines.find((e) => e.key === key);
}
