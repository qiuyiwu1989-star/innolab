// 方法可视化规格 —— 给每个方法配一张「一图看懂」的结构图。
// 不画死 SVG，而是声明「图型 + 标签」，由 MethodViz 组件按图型渲染（主题自适应）。
// 图型库：matrix2x2(2×2矩阵) / pyramid(金字塔) / funnel(漏斗) / cycle(闭环飞轮)
//          / radial(中心辐射，如波特五力) / flow(线性流程)。

export type VizSpec =
  | {
      type: "matrix2x2";
      x: { label: string; lo: string; hi: string };
      y: { label: string; lo: string; hi: string };
      q: { tl: string; tr: string; bl: string; br: string };
      hot?: "tl" | "tr" | "bl" | "br"; // 高亮象限
    }
  | { type: "pyramid"; layers: string[] } // 自底向上
  | { type: "funnel"; stages: string[] } // 自顶向下
  | { type: "cycle"; nodes: string[] } // 顺时针闭环
  | { type: "radial"; center: string; nodes: string[] }
  | { type: "flow"; steps: string[] };

// slug → 规格。先放 5 张样板，覆盖 5 种图型；认可后批量补齐 83 个。
export const METHOD_VIZ: Record<string, VizSpec> = {
  bcg: {
    type: "matrix2x2",
    x: { label: "相对市场份额", lo: "低", hi: "高" },
    y: { label: "市场增长率", lo: "低", hi: "高" },
    q: { tl: "问题 ?", tr: "明星 ★", bl: "瘦狗", br: "现金牛 $" },
    hot: "tr",
  },
  maslow: {
    type: "pyramid",
    layers: ["生理需求", "安全需求", "社交需求", "尊重需求", "自我实现"],
  },
  aarrr: {
    type: "funnel",
    stages: ["获取 Acquisition", "激活 Activation", "留存 Retention", "变现 Revenue", "推荐 Referral"],
  },
  "data-scene-flywheel": {
    type: "cycle",
    nodes: ["核心场景", "数据", "AI 模型", "更好的场景"],
  },
  "porter-five": {
    type: "radial",
    center: "行业盈利能力",
    nodes: ["现有竞争", "潜在进入者", "替代品威胁", "供应商议价", "买方议价"],
  },
};

export function getMethodViz(slug: string): VizSpec | null {
  return METHOD_VIZ[slug] ?? null;
}
