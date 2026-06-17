import type { VizSpec } from "../method-viz";

export const EVOLUTION_VIZ: Record<string, VizSpec> = {
  "growth-loops": {
    type: "cycle",
    nodes: ["新用户进入", "使用产品", "产生输出", "带来新用户"],
  },
  "customer-success": {
    type: "flow",
    steps: ["入职激活 30 天", "健康分预警监控", "扩展与续费前置"],
  },
  "north-star-metric": {
    type: "radial",
    center: "北极星指标",
    nodes: ["激活输入", "留存输入", "互动输入", "回访输入"],
  },
  okr: {
    type: "funnel",
    stages: ["公司 OKR", "团队 OKR", "个人 OKR"],
  },
};
