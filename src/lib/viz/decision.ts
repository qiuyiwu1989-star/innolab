import type { VizSpec } from "../method-viz";

export const DECISION_VIZ: Record<string, VizSpec> = {
  swot: {
    type: "matrix2x2",
    x: { label: "内部 / 外部", lo: "内部", hi: "外部" },
    y: { label: "有利 / 不利", lo: "不利", hi: "有利" },
    q: { tl: "优势 S", tr: "机会 O", bl: "劣势 W", br: "威胁 T" },
    hot: "tr",
  },
  "scene-value-matrix": {
    type: "matrix2x2",
    x: { label: "实现可行性", lo: "低", hi: "高" },
    y: { label: "业务价值", lo: "低", hi: "高" },
    q: { tl: "规划做", tr: "立即做", bl: "不做", br: "顺手做" },
    hot: "tr",
  },
  "scenario-planning": {
    type: "matrix2x2",
    x: { label: "关键因素 B", lo: "低", hi: "高" },
    y: { label: "关键因素 A", lo: "低", hi: "高" },
    q: { tl: "情景③", tr: "情景①", bl: "情景④", br: "情景②" },
  },
  kano: { type: "kano" }, // 满意度 × 功能实现 三曲线（还原 KANO 模型图）
  "ai-product-value-assessment": {
    type: "pyramid",
    layers: ["价值成立度 基础", "价值放大度 杠杆", "价值持续度 保障"],
  },
  "j-curve": {
    type: "flow",
    steps: ["投入期", "谷底期", "回升期", "加速期"],
  },
  "negotiation-prep": {
    type: "flow",
    steps: ["定三层目标", "找出 BATNA", "分析对方", "设计让步阶梯", "准备话术"],
  },
  "nonviolent-communication": {
    type: "flow",
    steps: ["观察", "感受", "需要", "请求"],
  },
  "evaluation-matrix": {
    type: "flow",
    steps: ["列方案定维度", "分配权重", "逐项打分", "计算排序", "讨论偏差"],
  },
};
