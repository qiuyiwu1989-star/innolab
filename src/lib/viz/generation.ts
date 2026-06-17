import type { VizSpec } from "../method-viz";

export const GENERATION_VIZ: Record<string, VizSpec> = {
  "body-storming": {
    type: "flow",
    steps: ["设场景", "分配角色与约束", "模拟任务并出声", "暂停讨论即兴改进", "转化为设计方向"],
  },
  brainstorming: {
    type: "flow",
    steps: ["定义挑战", "四原则快速发散", "追加狂想与沉默轮", "分类与投票收敛"],
  },
  "concept-development": {
    type: "flow",
    steps: ["创意归堆命名", "概念萃取", "概念深化", "评估与组合", "最终推荐"],
  },
  "design-thinking": {
    type: "flow",
    steps: ["共情", "定义", "构思", "原型", "测试"],
  },
  "disruptive-roadshow": {
    type: "flow",
    steps: ["铺现状与代价", "讲故事引共鸣", "认知反转结论", "展机会做类比", "承方案推行动"],
  },
  "embodied-production": {
    type: "cycle",
    nodes: ["场景洞察", "创意意图", "人机分工", "质量校验", "迭代优化"],
  },
  "old-bottle-new-label": {
    type: "flow",
    steps: ["建老瓶库", "建新装库", "AI批量生成组合", "快速测款验证"],
  },
  prototyping: {
    type: "cycle",
    nodes: ["确定验证目标", "选择原型类型", "快速制作", "用户测试", "记录反馈", "迭代或转向"],
  },
  "role-gene": {
    type: "radial",
    center: "角色基因",
    nodes: ["外在特征", "内在人格", "行为模式", "叙事弧线"],
  },
  "six-step-flywheel": {
    type: "cycle",
    nodes: ["洞察", "构造AI", "规模生成", "筛选判断", "转化落地", "强化学习"],
  },
  storyboard: {
    type: "flow",
    steps: ["确定主角", "设定场景", "构建故事弧", "画出每个场景", "标注情绪", "检查完整性"],
  },
  "what-if": {
    type: "matrix2x2",
    x: { label: "可能性", lo: "低", hi: "高" },
    y: { label: "冲击力", lo: "低", hi: "高" },
    q: { tl: "远期赌注", tr: "重点深推", bl: "忽略", br: "微优化" },
    hot: "tr",
  },
};
