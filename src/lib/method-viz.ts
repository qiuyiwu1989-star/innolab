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
  | { type: "flow"; steps: string[] }
  | {
      type: "grid";
      cols: number;
      cells: string[];
      rowLabels?: string[]; // 选填：每行左侧的分层标签
      hot?: number; // 选填：高亮第几个格子（0 起）
    }
  // ── 忠于原貌的方法专属图型（标签内置，画法还原该方法经典形态）──────
  | { type: "bmc" } // 商业模式画布：9 模块经典布局
  | { type: "kano" } // KANO：满意度 × 功能实现 三曲线
  | { type: "porter" } // 波特五力：四力围绕中心竞争
  | { type: "journey"; stages: string[] } // 客户旅程：阶段 + 情绪曲线
  | { type: "dumbbell" } // 哑铃型社会：两端重、中间被挤压
  | { type: "vpc" } // 价值主张画布：方块价值图 + 圆形客户档案
  | { type: "forces" } // JTBD 四力：推力/拉力 vs 惯性/焦虑
  | { type: "triangle"; nodes: [string, string, string]; center?: string }; // 三角咬合（人货场等）

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
  "porter-five": { type: "porter" },
};

// 各引擎的规格分文件维护（便于并行补齐），在此合并。
import { COGNITION_VIZ } from "./viz/cognition";
import { STRATEGY_VIZ } from "./viz/strategy";
import { GENERATION_VIZ } from "./viz/generation";
import { DECISION_VIZ } from "./viz/decision";
import { PRODUCT_VIZ } from "./viz/product";
import { EVOLUTION_VIZ } from "./viz/evolution";

const ALL_VIZ: Record<string, VizSpec> = {
  ...METHOD_VIZ,
  ...COGNITION_VIZ,
  ...STRATEGY_VIZ,
  ...GENERATION_VIZ,
  ...DECISION_VIZ,
  ...PRODUCT_VIZ,
  ...EVOLUTION_VIZ,
};

export function getMethodViz(slug: string): VizSpec | null {
  return ALL_VIZ[slug] ?? null;
}
