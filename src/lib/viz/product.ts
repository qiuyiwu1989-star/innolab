import type { VizSpec } from "../method-viz";

export const PRODUCT_VIZ: Record<string, VizSpec> = {
  // 九模块以「价值主张」为中心，前台价值面 + 后台效率面环绕
  "bmc": {
    type: "radial",
    center: "价值主张",
    nodes: ["客户细分", "渠道通路", "客户关系", "收入来源", "核心资源", "成本结构"],
  },
  // Aaker 五维度盘点，无序，环绕「品牌资产」
  "brand-equity": {
    type: "radial",
    center: "品牌资产",
    nodes: ["品牌知名度", "品牌忠诚度", "感知质量", "品牌联想", "专有资产"],
  },
  // CBBE 金字塔，自底向上：显著性→共鸣
  "brand-resonance": {
    type: "pyramid",
    layers: ["显著性", "绩效·意象", "判断·感觉", "品牌共鸣"],
  },
  // 实体符号系统，环绕「商业系统」摆放
  "business-origami": {
    type: "radial",
    center: "商业系统",
    nodes: ["用户⭕", "产品⬜", "渠道🔺", "价值⭐", "流向➡️"],
  },
  // 五阶段逐级收窄
  "customer-journey": {
    type: "funnel",
    stages: ["认知", "考虑", "决策", "使用", "忠诚"],
  },
  // 四步上瘾闭环
  "hook": {
    type: "cycle",
    nodes: ["触发", "行动", "多变奖励", "投入"],
  },
  // 四层自底向上，层层依赖
  "ip-knowledge-graph": {
    type: "pyramid",
    layers: ["文化符号层", "审美规则层", "角色人格层", "商业应用层"],
  },
  // 三维工作 + 转换两力，环绕核心 Job
  "jobs-to-be-done": {
    type: "radial",
    center: "核心 Job",
    nodes: ["功能工作", "情感工作", "社交工作", "推力", "拉力", "焦虑·惯性"],
  },
  // Build-Measure-Learn 验证闭环
  "mvp": {
    type: "cycle",
    nodes: ["假设", "构建 Build", "测量 Measure", "学习 Learn"],
  },
  // 场连接人与货，三要素咬合
  "people-goods-field": {
    type: "radial",
    center: "场",
    nodes: ["人 People", "货 Goods", "场景触发", "智能匹配"],
  },
  // 三层九维网格：为什么→在哪里→如何成立
  "product-definition-nine-grid": {
    type: "grid",
    cols: 3,
    rowLabels: ["价值洞察", "场景驱动", "落地实现"],
    cells: [
      "消费动机",
      "用户画像",
      "价值定位",
      "需求场景",
      "人机体验",
      "营销场景",
      "产品形态",
      "功能集合",
      "成本结构",
    ],
  },
  // 十种创新（上=配置类难抄，下=体验类易抄）
  "ten-types-innovation": {
    type: "grid",
    cols: 2,
    cells: [
      "1 盈利模式",
      "2 网络",
      "3 结构",
      "4 流程",
      "5 产品性能",
      "6 产品系统",
      "7 服务",
      "8 渠道",
      "9 品牌",
      "10 客户参与",
    ],
  },
  // 六维度环绕「一个具体的人」
  "user-persona": {
    type: "radial",
    center: "一个具体的人",
    nodes: ["基础信息", "行为特征", "目标动机", "痛点挫折", "心理特征", "信息环境"],
  },
  // 五大情感价值维度，环绕情感体验
  "value-opportunity-analysis": {
    type: "radial",
    center: "情感价值",
    nodes: ["情感", "美学", "身份", "影响力", "核心品质"],
  },
  // 客户画像 ↔ 价值地图，六模块对齐于 Fit
  "value-proposition-canvas": {
    type: "radial",
    center: "Fit 契合",
    nodes: ["待办任务", "痛点", "收益", "产品服务", "痛点缓解器", "收益制造器"],
  },
};
