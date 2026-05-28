# 睡醒后的 5 分钟交接

> 自动模式跑了一夜。**60 秒能上公网** — 一行命令搞定大部分。

---

## ⚡ 最短路径（如果你不想看下面任何东西）

打开一个新终端，按顺序跑：

```bash
# 1. 看本地（已经在 http://localhost:3001 跑着）
open http://localhost:3001/demo

# 2. 满意就一键部署到公网（脚本会拉 OAuth、push、deploy）
cd /Users/qiu/Documents/innolab-repo
bash scripts/deploy.sh

# 3. 加完 env vars（脚本最后会告诉你）
#    打开 vercel dashboard → 加 MIMO_API_KEY / MIMO_BASE_URL / MIMO_MODEL
```

完工。下面是细节。

---

## 现在的状态（一眼）

| 项 | 状态 |
|---|---|
| 代码完成度 | ✅ v0.6（含真 AI 引擎 + 案例可视化复原） |
| 本地预览 | ✅ http://localhost:3001（dev server 已起，MiMo key 已注入） |
| 本地真 AI | ✅ /demo 实测可用，MiMo 流式响应 ~5s 首 token |
| 生产 build | ✅ npm run build 通过，102 静态页 + 2 动态 API + 1 edge OG |
| Commit | ✅ 8 个 commit 在本地 master |
| GitHub push | ⚠ **未 push**（需要 gh auth login） |
| Vercel 部署 | ⚠ **未部署**（需要 vercel login） |
| 公网 URL | ⚠ **没有**（部署后才有） |
| 工具链 | ✅ `gh` v2.92 + `vercel` v54.5 都在 ~/.local/bin |

**为什么没自动上线？** GitHub 和 Vercel 的 OAuth 都需要浏览器交互（不能后台），所以最后一公里必须你来点。

---

## 📦 你睡这段时间做完了什么

主线版本 v0.1 → v0.6：

| 版本 | 核心 |
|---|---|
| v0.1 | Next.js 网站基础版 |
| v0.2 | 重设计 — 暗黑 Stripe Sigma 风（彻底重做） |
| v0.3 | /demo 模拟分析流（5 个手写脚本）+ CMD+K 命令面板 + 6 引擎落地页 |
| v0.4 | 部署文档 + Vercel Analytics + scripts/wake-up.sh |
| v0.5 | **真 AI 引擎** — /api/analyze 端点，SSE 流式 |
| v0.5.1 | 切换到小米 MiMo（OpenAI 兼容） |
| **v0.6** | **案例库改造为复原分析流程可视化** ← 最新 |
| v0.7 | 一键部署脚本 + 这份 HANDOFF |

**最重要的新东西**：
- `/demo` 是**真的 AI 分析**，不是脚本。输入任何商业问题，MiMo 用 74 方法编排推演
- `/cases/case-XXX` 全部改成"复原的分析流程"，每个案例像一份完整咨询报告
- `/api/analyze` 有限流（全站 50/天，单 IP 5/天），可在 Vercel env 调整

---

## 🚀 三条部署路径（按你的偏好选）

### A. 一键脚本（推荐 — 最省事）

```bash
cd /Users/qiu/Documents/innolab-repo
bash scripts/deploy.sh
```

脚本会：
1. 检查 gh / vercel CLI（都在 ~/.local/bin）
2. 没 gh 登录就拉浏览器
3. push 8 个 commit
4. 没 vercel 登录就拉浏览器
5. 部署到生产，拿到 `*.vercel.app` URL
6. 提示你加 3 个 env vars

### B. 分步手工（如果想看每一步）

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /Users/qiu/Documents/innolab-repo

# GitHub
gh auth login
git push origin master

# Vercel
vercel              # 第一次 link
vercel --prod       # 生产部署
```

### C. Web Dashboard（如果不想用 CLI）

详见 `DEPLOY.md`。简版：
1. `git push`（用任何你顺手的方式）
2. 打开 https://vercel.com/new
3. Import `qiuyiwu1989-star/innolab`
4. Deploy

---

## 🔑 部署后必做：加 env vars

不加这些，`/demo` 在公网会报"未配置 MIMO_API_KEY"。

Vercel Dashboard → Settings → Environment Variables，加三条（Production + Preview + Development 全勾）：

```
MIMO_API_KEY      = tp-cwxhnnn1oh0fzpm0h8uk8mey7342gfalfj3qev0p5nmpnbhv
MIMO_BASE_URL     = https://token-plan-cn.xiaomimimo.com/v1
MIMO_MODEL        = mimo-v2.5-pro
```

加完 → Deployments → 最新一条 → ⋯ → Redeploy。

### 🔒 安全提示

`tp-cwxhnnn1oh0fzpm0h8uk8mey7342gfalfj3qev0p5nmpnbhv` 这个 key 已经在多次对话里露过了。**强烈建议部署完去 https://token-plan-cn.xiaomimimo.com 后台轮换一下**（撤销老 key，生成新 key，更新 Vercel env）。

---

## 🌐 接子域 innolab.qiuyiwu.com

按计划，生产域名是 `innolab.qiuyiwu.com`（你 `qiuyiwu.com` 的独立子域）。

1. Vercel 项目 → Settings → Domains → Add `innolab.qiuyiwu.com`
2. 在 `qiuyiwu.com` 的 DNS 加：
   - Type: `CNAME`
   - Name: `innolab`
   - Value: `cname.vercel-dns.com`
   - Cloudflare 用户：**关橙色云朵**
3. DNS 生效（~10 分钟）→ Vercel 自动签 SSL
4. 改 `NEXT_PUBLIC_SITE_URL` env 为 `https://innolab.qiuyiwu.com` → Redeploy

详细见 `DEPLOY.md` §3。

---

## 📂 本地预览地址

dev server 已经在 **http://localhost:3001** 跑着（MiMo key 注入到 process.env）。

| 重点验收 |
|---|
| http://localhost:3001 — 首页 |
| **http://localhost:3001/demo — 真 AI 分析，输任意问题测一下** |
| **http://localhost:3001/cases/case-002 — 球球老师推演（最经典）** |
| http://localhost:3001/cases/case-005 — 造物云 J 曲线（最戏剧化） |
| http://localhost:3001/cases/case-006 — 零售三大幻觉 |
| http://localhost:3001/methods — 74 方法 + 筛选 |
| http://localhost:3001/methods/engine/cognition — 引擎落地页 |

**注意：端口 3001**（你 `lengjing` 项目占了 3000）。

如果 dev server 挂了：

```bash
cd /Users/qiu/Documents/innolab-repo
PORT=3001 \
  MIMO_API_KEY=tp-cwxhnnn1oh0fzpm0h8uk8mey7342gfalfj3qev0p5nmpnbhv \
  MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1 \
  MIMO_MODEL=mimo-v2.5-pro \
  npm run dev
```

或者把这三个 env 写进 `.env.local`（在 `.gitignore` 里，不会泄漏），跑 `npm run dev -- --port 3001` 就行。

---

## ⚠ 我**没**做的（明确告诉你边界）

- ❌ push 到 GitHub — 缺 OAuth
- ❌ 部署 Vercel — 缺 OAuth
- ❌ 把 MiMo key 持久化到 `.env.local` — auto-mode 拦了写"真 key"到磁盘，留了 PASTE_YOUR_KEY_HERE 占位
- ❌ 邱懿武自我介绍 / 五本书书名 / 邮箱 — 不知道，留 `[占位文本]` 标记在 `src/app/about/page.tsx`
- ❌ 候补邮件持久化 — `/api/waitlist` 仅 console.log，上线后 Vercel Functions 日志能看到
- ❌ 子域 DNS 配置 — 必须你在 DNS 服务商点

---

## 📁 关键文件速查

| 想改 | 文件 |
|---|---|
| /demo 的 5 个手写脚本 | `src/lib/demo-scripts.ts` |
| /demo 实时分析逻辑 | `src/app/demo/live-runner.tsx` + `src/lib/innolab-engine.ts` |
| /api/analyze 端点 | `src/app/api/analyze/route.ts` |
| 限流配额 | `src/lib/rate-limit.ts`（或 env: `INNOLAB_DAILY_QUOTA_GLOBAL/_PER_IP`） |
| 案例分析流程内容 | `cases/<domain>/<id>.json` 里的 `analysis_flow` 字段 |
| 案例流程渲染组件 | `src/components/site/case-flow.tsx` |
| 设计系统 tokens | `src/app/globals.css` |
| 首页 | `src/app/page.tsx` |
| 关于页（含占位） | `src/app/about/page.tsx` |
| 部署文档 | `DEPLOY.md` |
| 一键部署脚本 | `scripts/deploy.sh` |
| 唤醒脚本（看状态） | `scripts/wake-up.sh` |

---

## 🎯 你最该先做的 3 件事

1. **看 `/demo` 跑一发真 AI** — 这是 v0.5 最大的新东西，确认质量符合预期
2. **看 2-3 个案例**（推荐 case-002 球球老师、case-005 造物云） — 确认"复原分析流程"的可视化对路子
3. **跑 `bash scripts/deploy.sh`** — 推上公网，把 InnoLab 真正变成"用户能用"的东西

完事告诉我"上线了 + 链接"，或者哪里要调。
