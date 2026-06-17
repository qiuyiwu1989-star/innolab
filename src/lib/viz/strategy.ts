import type { VizSpec } from "../method-viz";

export const STRATEGY_VIZ: Record<string, VizSpec> = {
  // 产品（现有/新）× 市场（现有/新）四象限
  "ansoff": {
    type: "matrix2x2",
    x: { label: "产品", lo: "现有", hi: "新" },
    y: { label: "市场", lo: "现有", hi: "新" },
    q: { tl: "市场开发", tr: "多元化", bl: "市场渗透", br: "产品开发" },
    hot: "bl",
  },

  // 守是根基（用AI加固核心），攻从守中长出来
  "attack-defend": {
    type: "pyramid",
    layers: ["守 · 加固核心业务", "资源配比", "攻 · 开辟新战场"],
  },

  // ERRC 四步行动框架
  "blue-ocean": {
    type: "flow",
    steps: ["剔除", "减少", "增加", "创造"],
  },

  // 正/负反馈回路构成的飞轮
  "causal-loop-analysis": {
    type: "cycle",
    nodes: ["要素A", "要素B", "要素C", "回到A"],
  },

  // 四个消费时代按供需关系演进
  "consumption-era": {
    type: "flow",
    steps: ["短缺时代", "丰裕时代", "过剩时代", "智能时代"],
  },

  // 双轨经四个交叉点融合
  "dual-track-talent": {
    type: "radial",
    center: "双轨交叉点",
    nodes: ["知识传递", "项目协作", "能力认证", "文化塑造"],
  },

  // 社会结构三层，中间被AI挤压
  "dumbbell-society": {
    type: "pyramid",
    layers: ["底端 · 规模性价比", "中间 · 被挤压", "顶端 · 稀缺精品"],
  },

  // 第一性原理四模块顺序分析
  "industry-first-principles": {
    type: "flow",
    steps: ["行业本质目标", "当前旧逻辑", "AI可重构变量", "重塑后价值链"],
  },

  // 三维度评估智能密度
  "intelligence-density": {
    type: "radial",
    center: "智能密度",
    nodes: ["数据结构化", "决策标准化", "人力依赖"],
  },

  // 投资叙事五构件因果链
  "investment-narrative": {
    type: "flow",
    steps: ["旧世界", "断裂点", "新世界假设", "扩散路径", "叙事载体"],
  },

  // 五大经济护城河环绕超额收益
  "moat-analysis": {
    type: "radial",
    center: "超额收益",
    nodes: ["无形资产", "转换成本", "网络效应", "成本优势", "有效规模"],
  },

  // 护城河三层迁移，越往上越持久
  "moat-migration": {
    type: "pyramid",
    layers: ["技能护城河 3-5年", "认知护城河 10-20年", "价值护城河 终身"],
  },

  // 四代认知操作系统跃迁
  "paradigm-shift": {
    type: "flow",
    steps: ["农业思维", "工业思维", "互联网思维", "AI思维"],
  },

  // 网络效应自我放大的平台飞轮
  "platform-business-model": {
    type: "cycle",
    nodes: ["联结双边", "撮合匹配", "网络效应", "越多越难离开"],
  },

  // 三大AI转型幻觉源于同一根源
  "strategic-illusion": {
    type: "radial",
    center: "把AI当作可拥有之物",
    nodes: ["工具崇拜", "完美规划", "数据囤积"],
  },

  // 三层时间维度的战略路线
  "strategy-roadmap": {
    type: "flow",
    steps: ["短期 执行迭代", "中期 扩展筑壁垒", "长期 愿景颠覆"],
  },

  // 结构决定行为的反复循环
  "system-archetypes": {
    type: "cycle",
    nodes: ["症状出现", "短期方案", "结构未变", "问题复发"],
  },

  // TOC 五步聚焦法，第五步回到第一步
  "theory-of-constraints": {
    type: "cycle",
    nodes: ["识别约束", "充分挖掘", "从属配合", "提升约束", "回到第一步"],
  },

  // AI流程改造三阶，价值数量级递增
  "three-stage-evolution": {
    type: "pyramid",
    layers: ["辅助 · 打补丁", "自动化 · 替代环节", "重构 · 第一性原理"],
  },
};
