import type { VizSpec } from "../method-viz";

export const COGNITION_VIZ: Record<string, VizSpec> = {
  "affinity-diagram": {
    type: "flow",
    steps: ["制卡原子化", "沉默分组", "二轮精修", "集体命名", "层级整理", "总结洞察"],
  },
  "cognitive-assembler": {
    type: "cycle",
    nodes: ["拆解", "判定", "分配", "整合", "评估"],
  },
  "consumer-trend-canvas": {
    type: "flow",
    steps: ["趋势捕捉", "需求解构", "行为表现", "机会映射", "机会评估", "优先排序"],
  },
  "deductive-writing": {
    type: "flow",
    steps: ["引入", "背景", "分析", "推演", "收束"],
  },
  "design-ethnography": {
    type: "flow",
    steps: ["观察", "沉浸", "访谈", "记录", "分析洞察", "转化机会"],
  },
  "five-compositions": {
    type: "radial",
    center: "完整创新",
    nodes: ["艺术构成", "人本构成", "科技构成", "商业构成", "文化构成"],
  },
  "five-layer-cognition": {
    type: "pyramid",
    layers: ["L1 概念认知", "L2 工具认知", "L3 思维认知", "L4 价值认知", "L5 哲学认知"],
  },
  "five-whys": {
    type: "flow",
    steps: ["描述症状", "问为什么", "逐层下钻", "评估根因", "对症下药"],
  },
  "future-radar": {
    type: "radial",
    center: "未来雷达",
    nodes: ["T 技术", "S 社会", "E 经济", "E 环境", "P 政治"],
  },
  "h3-tii": {
    type: "radial",
    center: "人本核心",
    nodes: ["学习路径层", "行动能力层", "元能力治理层", "天赋", "热情", "价值感"],
  },
  "insight-framework": {
    type: "flow",
    steps: ["现象洞察", "回归原点", "关系重构", "社会影响", "价值重塑"],
  },
  "jevons-paradox-reasoning": {
    type: "flow",
    steps: ["压抑扫描", "杰文斯检验", "船vs木桩", "壁垒定位"],
  },
  "l2-l4-diagnosis": {
    type: "pyramid",
    layers: ["L2 AI辅助", "L3 人机协同", "L4 AI主导", "L5 AI自治"],
  },
  "method-card-design": {
    type: "flow",
    steps: ["问题对齐", "结构提炼", "步骤具体化", "建立分级", "补案例", "标陷阱", "接入系统"],
  },
  "nine-grid": {
    type: "grid",
    cols: 3,
    cells: ["维度①", "维度②", "维度③", "维度④", "中心问题", "维度⑤", "维度⑥", "维度⑦", "维度⑧"],
    hot: 4,
  },
  pyramid: {
    type: "pyramid",
    layers: ["论据", "论点", "核心结论"],
  },
  "six-hats": {
    type: "flow",
    steps: [
      "蓝帽 · 控场定向",
      "白帽 · 摆事实",
      "红帽 · 说直觉",
      "黄帽 · 找亮点",
      "黑帽 · 挑风险",
      "绿帽 · 出新意",
    ],
  },
  "ten-level-creativity": {
    type: "pyramid",
    layers: ["探索阶段 初–三段", "应用阶段 四–七段", "精通阶段 八–十段"],
  },
  "three-party-coevolution": {
    type: "cycle",
    nodes: ["AI 能力增强", "孩子 认知反哺", "家长 使用框架"],
  },
};
