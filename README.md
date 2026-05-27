# InnoLab — AI 创新战略咨询师

> 用 74 个方法论分析你的真实商业问题。
> 从认知到产品化，一次完整的战略推演。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fqiuyiwu1989-star%2Finnolab&env=NEXT_PUBLIC_SITE_URL&envDescription=站点根%20URL%2C%20生产环境填你的域名&project-name=innolab&repository-name=innolab)

## 🌐 网站（v0.3）

```bash
npm install
npm run dev   # 本地预览 → http://localhost:3000
npm run build # 生产构建（102 静态页 + 1 动态 API + 1 edge OG）
```

### 在线功能

| 页面 | 做什么 |
|---|---|
| `/` | Hero · 看一眼能做什么 · 弹药库 · 六引擎 · 五层认知 · Roadmap · 候补 |
| **`/demo`** | **v1.0 模拟分析流：5 个真实问题 × 流式推演动画** |
| `/methods` | 74 张方法卡，引擎 / 层级双筛选 + 全文搜索 |
| `/methods/[slug]` | 详情页：markdown 渲染 + 同引擎方法 + 用过此方法的案例 |
| `/methods/engine/[key]` | 6 个引擎落地页（深描 + 推荐起步 + 按层分组） |
| `/cases` | 10 个真实案例，领域筛选 |
| `/cases/[id]` | 详情页：核心洞察 + 关键事实 + 关联方法 |
| `/about` | 邱懿武 + 五部著作 + v0.1 → v1.0 路线图 |
| **⌘K** | **全局命令面板**：搜方法 · 案例 · 页面 · 引擎 |

### 视觉

黑底 + 单一主色 `#B3FF39` + 大面积几何 + Inter / Noto Sans SC / JetBrains Mono。  
Stripe Sigma / Apple TV+ 风。

### 技术栈

- **Next.js 16** (App Router, Turbopack)
- **React 19** · **Tailwind CSS 4**
- 内容：仓库 `methods/**.md` + `cases/**.json` 直接当数据源（无 CMS）
- 搜索：`cmdk`
- Markdown：`react-markdown` + `remark-gfm` + `rehype-slug`
- 部署：Vercel

### 部署

详见 [DEPLOY.md](./DEPLOY.md)。一键 Deploy 按钮在顶部。

### 开发

```bash
git clone https://github.com/qiuyiwu1989-star/innolab
cd innolab
npm install
cp .env.example .env.local  # 默认值即可本地运行
npm run dev
```

加方法：在 `methods/<engine>/<slug>.md` 写 markdown（参考已有方法的 `## Meta` 块格式）。  
加案例：在 `cases/<domain>/<slug>.json` 写 JSON + 登记到 `cases/case-index.json`。  
push 后 Vercel 自动重新构建。

## 这是什么

InnoLab 不是一个方法论知识库，而是一个**认知→创新→产品化的生产系统**。

它能自动完成：问题重构 → 方法编排 → 多方案生成 → 方案评估 → 产品定义 → 进化反馈。

## 六大引擎

```
🧠 Cognition（认知引擎）→ 看清世界
     ↓
🎯 Strategy（战略引擎）→ 选择战场
     ↓
💡 Generation（生成引擎）→ 创造解法
     ↓
⚖️ Decision（决策引擎）→ 筛选最优
     ↓
🧩 Product（产品引擎）→ 变成现实
     ↓
🔁 Evolution（进化引擎）→ 持续优化
```

## 五层认知深度

| 层级 | 名称 | 含义 |
|------|------|------|
| L1 | 感知层 | 看到现象和信息 |
| L2 | 理解层 | 理解结构和关系 |
| L3 | 方法层 | 掌握工具和框架 |
| L4 | 系统层 | 构建系统和结构 |
| L5 | 范式层 | 定义底层逻辑和世界观 |

## 方法论清单（74个）

### 🧠 Cognition 认知引擎（19个）
亲和图、认知组装器、消费趋势画布、演绎写作、设计民族志、五构成、五层认知、未来雷达、H³-TII、洞察框架、杰文斯悖论推理、L2-L4诊断、马斯洛、方法卡设计、九宫格、金字塔、六顶思考帽、十级创造力、三方共进化

### 🎯 Strategy 战略引擎（18个）
安索夫、攻防矩阵、蓝海、因果环分析、消费时代、双轨人才、哑铃型社会、行业第一性原理、智能密度、投资叙事、护城河分析、护城河迁移、范式转移、波特五力、战略幻觉、战略路线图、系统原型、三阶段进化

### 💡 Generation 生成引擎（12个）
身体风暴、头脑风暴、概念发展、设计思维、颠覆式路演、具身生产、旧瓶新标签、原型法、角色基因、六步飞轮、故事板、What-If

### ⚖️ Decision 决策引擎（9个）
AI产品价值评估、BCG矩阵、评估矩阵、J曲线、KANO、谈判准备、非暴力沟通、场景价值矩阵、SWOT

### 🧩 Product 产品引擎（14个）
BMC商业画布、品牌资产、品牌共鸣、商业折纸、客户旅程、Hook模型、IP知识图谱、MVP、人货场、产品定义九宫格、十种创新、用户画像、价值机会分析

### 🔁 Evolution 进化引擎（3个）
AARRR、数据场景飞轮、OKR

## 文件结构

```
innolab/
├── SKILL.md              ← 主技能文件（完整运行流程）
├── CHANGELOG.md          ← 迭代日志
├── methods/              ← 74个方法论详情
│   ├── cognition/        ← 认知引擎（19个）
│   ├── strategy/         ← 战略引擎（18个）
│   ├── generation/       ← 生成引擎（12个）
│   ├── decision/         ← 决策引擎（9个）
│   ├── product/          ← 产品引擎（14个）
│   └── evolution/        ← 进化引擎（3个）
├── references/           ← 索引和评估
│   ├── METHOD_INDEX.md   ← 方法总索引
│   ├── DEPTH_ASSESSMENT.md ← 深度评估
│   └── CHANGELOG.md      ← 变更日志
└── cases/                ← 案例库
    ├── enterprise/       ← 企业案例
    └── education/        ← 教育案例
```

## 每个方法卡包含

- **元信息**：ID、引擎、层级、来源
- **解决什么问题**：没有它时人们犯什么错
- **核心框架**：可视化骨架（表格/矩阵/流程图）
- **怎么用**：每步输入→判断→输出
- **诊断分级**：怎么判断"程度"
- **案例**：完整走通的示例
- **常见陷阱**：2-3个典型误用
- **方法关系**：前置/后续/并行

## 如何使用

将此目录放入你的 AI Agent 技能目录。SKILL.md 定义了完整的运行流程，methods/ 下是74个方法的详细说明。

触发词：`分析一下` `诊断` `战略分析` `产品分析` `值不值得做` `怎么定位` `SWOT` `波特五力` `商业模式` `护城河`

## 认知引擎方法

| 方法 | 层级 | 核心价值 |
|------|------|---------|
| 五层认知 | L5 | 看到问题的五个深度 |
| H³-TII | L5 | 人类成长操作系统 |
| 三方共进化 | L4 | AI×孩子×父母共进化 |
| 九宫格 | L4 | 产品定义的第一轮筛选 |
| 六顶思考帽 | L3 | 多角度切换 |
| 金字塔 | L3 | 结构化表达 |

## 战略引擎方法

| 方法 | 层级 | 核心价值 |
|------|------|---------|
| 范式转移 | L5 | 识别底层规则变化 |
| 行业第一性原理 | L5 | 回到最底层重新推导 |
| 护城河迁移 | L4 | 竞争壁垒的演化路径 |
| 波特五力 | L3 | 行业竞争格局分析 |
| 蓝海 | L3 | 找到无竞争空间 |
| SWOT | L2 | 内外部优劣势梳理 |

---

*基于邱懿武的五部著作与方法论体系。*
