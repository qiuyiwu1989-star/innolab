# 睡醒后的 5 分钟交接

> 自动模式下我把所有能做的都做了。你睡醒后这页帮你 5 分钟内进入状态。

## 现在的状态

✅ **代码完成**：v0.3 全套上线就绪，本地 + 生产 build 都通过
✅ **本地可访问**：`npm run dev` → http://localhost:3000
✅ **已 commit**：3 个 commit 在本地 master，待 push
⚠ **未 push 到 GitHub**：等你决定（我没有自动 push，避免推错东西）
⚠ **未部署到 Vercel**：需要你在 Vercel 完成 OAuth + Import（约 3 分钟）

## 你睡前看到的是 v0.2，醒来后的是 v0.3

| 维度 | v0.2（你睡前） | v0.3（现在） |
|---|---|---|
| 页面数 | 5 个主页面 | + `/demo`、`/methods/engine/[key]`、`/not-found` |
| 搜索 | 列表内搜 | + 全站 **CMD+K 命令面板** |
| 候补转化 | 一个表单 | + `/demo` 模拟分析流（5 个真实问题） |
| 404 / Favicon | 默认 | 自定义黑底 + volt 点 |
| OG 图 | ✓ | ✓（同 v0.2） |

**核心 v0.3 新增 = `/demo` 页**：5 个真实问题 × 8 个推演步骤的流式动画，每个方法名都能点进详情页。**这是 v1.0 的"看看效果"，候补转化的关键磁铁**。

## 你要做的 3 件事

### 1. 浏览器看 v0.3（5 分钟）

打开这些 URL hard-refresh：

- http://localhost:3000 — 首页 + 横向 marquee + 3 demo 卡 + 弹药库
- **http://localhost:3000/demo** ← 最重要！选个问题点一下看流式动画
- http://localhost:3000/methods/engine/cognition — 引擎落地页
- 任意页面按 **⌘K** 试搜索
- http://localhost:3000/nonexistent — 404 页
- 手机或 Chrome 响应式模式 ≤ 768px 看导航汉堡菜单

### 2. 决定推不推（这是最大决策）

```bash
cd /Users/qiu/Documents/innolab-repo
git log --oneline -5
# 看 3 个 commit：v0.1 + v0.2-0.3 + (initial)

# 推：
git push origin master
```

push 到的是你自己的 `github.com/qiuyiwu1989-star/innolab`。

### 3. 部署到 Vercel（3 分钟）

详见 `DEPLOY.md`。简版：

1. push 完代码
2. 打开 https://vercel.com/new
3. Import `qiuyiwu1989-star/innolab`
4. 加环境变量 `NEXT_PUBLIC_SITE_URL=https://innolab-xxx.vercel.app`
5. Deploy
6. ~2 分钟拿到生产 URL
7. （可选）接自定义域名

## 知道这些坑（让你不踩）

### `/about` 里所有 `[占位文本]` 都是空的

我故意不瞎编你的个人介绍和五本书书名。**首次发布前你至少填一段邱懿武介绍 + 把邮箱占位 `hi@example.com` 换成真邮箱**。文件在：
- `src/app/about/page.tsx`（hero 介绍 + 联系块邮箱）
- 五本书的 `BOOKS` 数组在文件顶部

### Demo 只支持 5 个预设问题

`/demo` 页用户输入自定义问题会得到 "v0.1 不支持，请选下方建议" 的提示。这是**故意的**（v0.1 不接 AI），但用户可能困惑。要不要补一行"为什么" 你决定。

5 个预设问题在 `src/lib/demo-scripts.ts`。每个有 7-8 步推演。**你可以重新读一遍这些推演 — 如果有任何观点你不同意，改写 body 数组**。它们是手写样本，代表"你将来希望 AI 给出的答案"。

### 候补邮件没持久化

`/api/waitlist` 当前只 `console.log` 到 Vercel Functions 日志。上线后第一个用户提交时去 Vercel Dashboard → Logs 看。**真到有用户提交了，再接 Resend Audiences**（10 分钟工程量）。

### 域名

我用 `https://innolab.example.com` 占位。Vercel 部署后会给一个 `*.vercel.app`。如果你要自定义域名，按 DEPLOY.md 步骤接。

### 4 个我 spawn 的清理 chip 你已经做了

✅ DC08/09 + ST17/18 的 Meta ID 补齐
✅ product-definition/nine-grid.md 重命名

## 现在系统的真实数据

```
74 个方法卡（cognition 19 / strategy 18 / generation 12 / decision 9 / product 14 / evolution 3）
10 个真实案例（其中 9 个有详情页，case-001 只在索引）
5 个 demo 推演剧本
6 个引擎落地页
102 个静态构建路由
```

## 文件路径速查

| 想改 | 文件 |
|---|---|
| 首页 hero / 各段 | `src/app/page.tsx` |
| Demo 5 个推演剧本 | `src/lib/demo-scripts.ts` |
| Demo 页骨架 | `src/app/demo/demo-runner.tsx` |
| 设计系统色 / 字体 | `src/app/globals.css` |
| 顶栏导航 | `src/components/site/nav.tsx` |
| CMD+K 命令面板 | `src/components/site/command-menu.tsx` |
| 引擎元数据（名称 / 描述 / 推荐方法） | `src/lib/engines.ts` |
| OG 图 | `src/app/opengraph-image.tsx` |
| 候补 API | `src/app/api/waitlist/route.ts` |
| About 页（含占位） | `src/app/about/page.tsx` |
| 部署文档 | `DEPLOY.md` |

## Vercel 上线后的下一波（如果你想继续）

按优先级：

1. **填 `/about` 的占位**（5 分钟）
2. **审查 5 个 demo 推演剧本**，把你不认可的判断改掉（30 分钟）
3. **加你自己的真实联系方式 + 公众号 / 微信**到 footer 或 /about（5 分钟）
4. **接 Resend Audiences** 持久化候补邮件（10 分钟）
5. **加 Plausible / Vercel Analytics** 看流量（5 分钟）
6. **第二批 demo 推演**：加 5 个新问题剧本（每个 30 分钟）
7. **写第一篇 InnoLab 博客**（如果决定加 /blog）

## 我没做的（明确告诉你边界）

- 没自动 push（你看完再说）
- 没真接 AI（v1.0 工程）
- 没写邱懿武的真实自我介绍（不知道）
- 没加 Plausible / Vercel Analytics（需要你的账号）
- 没注册域名（不是我的事）
- 没改 SKILL.md（这是 Claude Skill 那一边的内容，不影响网站）

睡醒后看到这页，应该足够你 5 分钟内决定下一步。
