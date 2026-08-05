# InnoLab — AI 创新战略咨询师

> ⚠️ **本文档停留在 2026 年 5–6 月，多处已过时**（当时 74 方法 / 10 案例 / 旧域名，现为 86 方法 / 76 案例 / innolab.cc）。
> **最新状态以 `CLAUDE.md` 和 `谱/进度.md` 为准。**

> 用 74 个方法论分析你的真实商业问题。  
> 从认知到产品化，一次完整的战略推演。

🟢 **生产环境已上线**：<https://innolab.qiuyiwu.com>

[![GitHub](https://img.shields.io/badge/repo-qiuyiwu1989--star/innolab-181717?logo=github)](https://github.com/qiuyiwu1989-star/innolab)
[![Status](https://img.shields.io/badge/status-live-b3ff39)](https://innolab.qiuyiwu.com/api/health)
[![Domain](https://img.shields.io/badge/domain-qiuyiwu.com-blue)](https://qiuyiwu.com)

---

## 这是什么

InnoLab 不是方法论清单，是一台**编排引擎** —— 把模糊的商业问题切准、调用相关方法链、给出具体下一步动作。

**收录**：邱懿武团队近年真实工作沉淀下来的 **74 个方法论** + **10 个真实案例**（球球老师 AI 儿童产品、造物云 KA 设计公司 AI 攻守、老蔡 IP 四层、零售三大幻觉、双轨人才实践等）。

**Demo**：`/demo` 已接通 **小米 MiMo v2.5 Pro**，限免每天 5 次每 IP，全站 50 次/天。

## 在线页面

| URL | 内容 |
|---|---|
| `/` | Hero + DEMOS + 弹药库 + 六大引擎 + 五层认知 + Roadmap + 候补 |
| `/demo` | **真 AI 流式分析**（领域分流 + 15 个预设问题 + 自由输入） |
| `/methods` | 74 张方法卡 + 引擎/层级双筛选 + 全文搜索 |
| `/methods/[slug]` | 单个方法详情：markdown 渲染 + 同引擎方法 + 用过此方法的案例 |
| `/methods/engine/[key]` | 六个引擎独立落地页（深描 + 推荐方法 + 按层分组） |
| `/cases` | 10 个真实案例，按领域筛选 |
| `/cases/[id]` | **复原的完整分析流程**（问题重构 → 方法链 → 推演结论） |
| `/about` | 关于 InnoLab + 邱懿武 + 路线图 |
| `⌘K` | 全局命令面板（搜方法 / 案例 / 页面） |
| `/api/analyze` | POST 端点（流式 SSE，限流 + 事件日志） |
| `/api/health` | 健康检查（数据 + AI 配置 + runtime） |
| `/admin/stats` | 运营面板（token-gated） |

## 技术栈

- **Next.js 16 (App Router) + Turbopack**
- **React 19 · Tailwind CSS 4**
- **OpenAI SDK**（接小米 MiMo OpenAI 兼容端点）
- **next-themes** 亮/暗双主题
- **cmdk** CMD+K 命令面板
- **react-markdown + remark-gfm + rehype-slug** markdown 渲染
- **pm2** 生产进程管理
- **nginx + Certbot** 反代 + SSL

## 生产部署架构

```
腾讯云香港 <服务器 IP，见密码管理器> · Ubuntu 24.04
├─ nvm + Node 22 + npm 10 + pm2 7
├─ pm2 进程 "innolab" :3010
├─ nginx 反代 :443 → :3010
└─ Certbot Let's Encrypt 自动续期

代码：/home/ubuntu/innolab
日志：~/.pm2/logs/innolab-out.log
启动：pm2 start npm --name innolab -- start
```

## 本地开发

```bash
git clone https://github.com/qiuyiwu1989-star/innolab
cd innolab
npm install
cp .env.example .env.local  # 填 MIMO_API_KEY
npm run dev
# → http://localhost:3001
```

## 部署

### 增量更新（已上线后）

```bash
ssh ubuntu@<服务器 IP，见密码管理器> 'bash ~/innolab/scripts/deploy-update.sh'
```

脚本会：git pull → npm ci → npm run build → pm2 reload → smoke test。

### 第一次部署 / 迁移到新服务器

详见 [DEPLOY.md](./DEPLOY.md)。

## 环境变量

| Key | 必填 | 用途 |
|---|---|---|
| `MIMO_API_KEY` | ✓ | 小米 MiMo API key |
| `MIMO_BASE_URL` | ✓ | https://token-plan-cn.xiaomimimo.com/v1 |
| `MIMO_MODEL` | ✓ | mimo-v2.5-pro |
| `NEXT_PUBLIC_SITE_URL` | ✓ | 生产域名 |
| `INNOLAB_ADMIN_TOKEN` | 可选 | /admin/stats 访问 token |
| `INNOLAB_DAILY_QUOTA_GLOBAL` | 可选 | 默认 50 |
| `INNOLAB_DAILY_QUOTA_PER_IP` | 可选 | 默认 5 |
| `IP_SALT` | 可选 | IP 哈希盐 |

## 数据可观测

InnoLab 不依赖外部分析服务，**结构化 JSON 事件直接打到 pm2 logs**。

```bash
# 实时看
pm2 logs innolab

# 聚合查询
pm2 logs innolab --lines 10000 --nostream | grep '"event":"analyze.request"'

# 浏览器看
https://innolab.qiuyiwu.com/admin/stats?token=<INNOLAB_ADMIN_TOKEN>
```

要更复杂分析时把 `src/lib/innolab-engine.ts` 里的 `logEvent` 改成 `posthog.capture` 就行，字段名不变。

## 添加内容

```bash
# 加方法
methods/<engine>/<slug>.md
# 用同目录其他方法卡的 ## Meta 格式

# 加案例
cases/<domain>/<slug>.json + 登记到 cases/case-index.json

# 推到生产
git add . && git commit -m "feat: add ..." && git push
ssh ubuntu@<服务器 IP，见密码管理器> 'bash ~/innolab/scripts/deploy-update.sh'
```

## 项目状态

- ✅ v0.x 全部已上线（弹药库 + 方法地图 + 真 AI 分析）
- 🚧 v0.9 数据驱动迭代（6 周内）
- 🔮 v1.0 订阅 / 团队版（2026 Q4）

## 相关

- 邱懿武：<https://qiuyiwu.com>
- 仓库：<https://github.com/qiuyiwu1989-star/innolab>
- 在线：<https://innolab.qiuyiwu.com>
- 健康检查：<https://innolab.qiuyiwu.com/api/health>
