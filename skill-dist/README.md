# InnoLab · 创新实验室 Skill

把模糊的商业问题，跑成一句能拍板的判断。

86 个方法论（认知 / 战略 / 生成 / 决策 / 产品 / 进化六大引擎，五层认知深度）+ 77 个实战案例，
由 [邱懿武](https://innolab.cc) 构建并长期打磨。

---

## 这个包是什么

一个**离线可用、装上即跑**的 Agent Skill。不需要 API key，不需要联网，不写任何文件。

装好之后，直接问你的 agent：

> 「我们做企业培训 8 年了，AI 来了之后客户续约率从 70% 掉到 45%，该怎么办？」

它会自动完成：问题重构 → 方法编排（跨引擎选 3–6 个方法）→ 逐方法分析 → 结论前置的综合输出。

---

## 安装

### Claude Code / 本地 Agent

解压后放进 skills 目录即可：

```bash
unzip innolab-skill-v2.0.0.zip
mv innolab ~/.claude/skills/
```

重启会话，说「分析一下我这个方向」或直接 `/innolab` 触发。

### claude.ai 网页 / App

在对话里上传整个 `innolab` 文件夹（或 zip），然后说「按 InnoLab 的方法分析这件事」。
注意：网页环境每次会话重置，需要重新上传。

### 其他 Agent 框架

本包是纯文本 + JSON，无运行时依赖。让你的 agent：

1. 读 `SKILL.md`（约 200 行，含完整流程与输出规范）
2. 按 SKILL.md 的指示读 `references/METHOD_INDEX.md` 选方法
3. 只读选中的那几个 `methods/{引擎}/{文件}.md`

> **不要一次性读入整个 `methods/` 目录**（172 个文件、约 1.6MB），会吃光上下文。
> SKILL.md 里已写明按需加载的纪律。

---

## 包内结构

```
innolab/
├── SKILL.md                      系统说明 + 运行流程 + 输出规范（先读这个）
├── references/
│   └── METHOD_INDEX.md           86 个方法总索引（ID / 层级 / 出处 / 一句话定义 / 文件路径）
├── methods/
│   ├── cognition/    认知引擎 21    ├── decision/    决策引擎 11
│   ├── strategy/     战略引擎 21    ├── product/     产品引擎 15
│   ├── generation/   生成引擎 12    └── evolution/   进化引擎 6
│   │   每个方法两个文件：
│   │   xxx.md          方法卡（9 段结构，日常分析读这个）
│   │   xxx.guide.md    深度指南（要讲透这个方法时才读）
└── cases/
    ├── case-index.json           案例总索引（按 related_methods 反查）
    └── {领域}/*.json             77 个实战案例，按领域分目录
```

---

## 方法的出处

索引里的 `Origin` 列标明每个方法的来源：

- `original` — 邱懿武原创方法（如 AI 认知五阶模型、创新五大构成、IP 四层知识图谱、创造力十段评估）
- `adapted` — 在经典框架基础上改编
- `classic` — 通用商业框架（波特五力、SWOT、商业画布等）

引用原创方法时请注明来源。

---

## 想要更深的

本 skill 是**完整的方法体系**，但方法不等于判断。

- **完整推演报告**（4000–6000 字，带结构化可视化）→ [innolab.cc/demo](https://innolab.cc/demo)，免费试
- **Agent 直连**（MCP 端点，可被其他 agent 调用）→ [innolab.cc/mcp-guide](https://innolab.cc/mcp-guide)
- **针对你处境的取舍与落地路径** → 邱懿武 1:1 深度咨询，见 [innolab.cc](https://innolab.cc)

---

## 授权

方法体系版权归邱懿武所有。

可自由用于个人与团队的分析、学习、内部决策；
**整体转售、去署名再分发、或作为竞品方法库对外提供，需事先授权。**

问题与反馈：[innolab.cc](https://innolab.cc)
