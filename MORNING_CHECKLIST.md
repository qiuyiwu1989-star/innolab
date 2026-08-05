# 早晨验收清单

> ⚠️ **本文档停留在 2026 年 5–6 月，多处已过时**（当时 74 方法 / 10 案例 / 旧域名，现为 86 方法 / 76 案例 / innolab.cc）。
> **最新状态以 `CLAUDE.md` 和 `谱/进度.md` 为准。**

> 我在你睡觉期间打磨完了。这份文档是你 5 分钟验收用的。

## 🟢 一句话：可以对外发了

InnoLab 已经是一个**完整、上线、用户能直接用**的产品。
打开 <https://innolab.qiuyiwu.com> 试一下，就能验证。

---

## 5 分钟验收（按顺序点）

### 1. 首页（30 秒）

打开 <https://innolab.qiuyiwu.com>

应该看到：
- ☀ Hero："AI 创新战略咨询师" 大字 + 实线 volt 圆环装饰
- 主 CTA："试试问 InnoLab：我该做 IP 产品吗？ → 限免使用"（不再是"v1.0 候补"）
- 横向 marquee 滚动方法 ID
- 3 个 Q 卡（球球老师 / 零售幻觉 / 双轨人才）
- 弹药库 4 个数字：74 / 6 / 5 / 10
- 六大引擎 + 五层认知 + Roadmap（路线图反映真实状态：v0.x live / v0.9 next / v1.0 vision 付费版）

### 2. 主题切换（10 秒）

顶栏右上角点 ☀ / 🌙 / 🖥 图标三态循环。
亮色下 InnoLab 文字应该清晰可读（volt 自动变深绿 #4a6b00）。

### 3. /demo 真 AI 分析（60 秒）

打开 <https://innolab.qiuyiwu.com/demo>

应该看到：
- 头条 chip：`Live · v0.1 限免内测`
- 输入框 + 5 个领域 chip（全部 / AI 转型 / 产品 / IP / 内容 / 组织 / 战略）
- 15 个预设问题按领域分组

试一个流程：
1. 点"AI 转型"chip → 看 prompt 列表过滤为 3 个 AI 转型问题
2. 点"AI 转型该从哪里开始？"
3. 看流式输出：先显示"InnoLab 正在装填弹药库 · 74 方法 + 10 案例进入上下文…"，然后开始流式打字
4. 看 markdown 表格、列表、加粗都渲染正确
5. 完成后看右下"来自领域：AI 转型"小标
6. 底部有"加入候补 v1.0" CTA

⚠️ 如果报"未配置 MIMO_API_KEY"：服务器 .env 出了问题，告诉我。

### 4. 案例复原分析（30 秒）

打开 <https://innolab.qiuyiwu.com/cases/case-005>（造物云 J 曲线攻守）

应该看到：
- Hero 含"复原分析"主色 badge
- 时间线流程：#01 问题重构 → #02-04 三个调用方法卡（带"→ 揭示"高亮段）→ 关键判断 → 推演结论（✓/✗）→ 建议下一步
- 每个方法 ID 可点跳转到方法详情
- 底部"换你的问题，InnoLab 来跑一次" → /demo CTA

### 5. ⌘K 命令面板（15 秒）

在任意页面按 `⌘K`（Mac）或 `Ctrl+K`（Windows）。

试搜：
- "蓝海" → 应出现 ST06 + 球球老师案例
- "CG14" → 消费趋势画布
- "球球" → 案例 case-002 + case-010

按 ↑↓ 选 + Enter 跳转。

### 6. /about（20 秒）

打开 <https://innolab.qiuyiwu.com/about>

应该看到：
- 没有任何 `[占位文本]` 黄色高亮块
- "这个网站做什么用"段引用真实案例名（AIIP / 造物云 / 球球老师）
- "关于邱懿武"段简短 + 指向 qiuyiwu.com
- "方法论源头"是 4 个真思想（蓝海 / 第一性原理 / 范式转移 / 设计思维）—— 不是假书名
- 路线图反映真实状态：v0.x 全部已上线
- "和我聊聊"按钮：qiuyiwu.com + GitHub + /demo

### 7. 404（5 秒）

打开 <https://innolab.qiuyiwu.com/abcxyz>

应该看到：
- 巨型 404
- 主 CTA："试一下 InnoLab 真分析" → /demo
- 3 个次级入口（首页 / 方法 / 案例）
- ⌘K 搜索提示

### 8. /api/health（5 秒）

打开 <https://innolab.qiuyiwu.com/api/health>

应该看到：
```json
{
  "status": "ok",
  "checks": {
    "data": { "ok": true, "methods": 74, "cases": 10 },
    "ai": { "ok": true, "model": "mimo-v2.5-pro", ... },
    "runtime": { "node": "v22.22.3", ... }
  }
}
```

如果 status 不是 "ok"，告诉我。

### 9. /admin/stats 运营面板（30 秒，可选）

这个要先配 token。SSH 上去：

```bash
ssh ubuntu@<服务器 IP，见密码管理器>
echo 'INNOLAB_ADMIN_TOKEN=随便填' >> ~/innolab/.env.local
pm2 reload innolab
exit
```

然后浏览器：
```
https://innolab.qiuyiwu.com/admin/stats?token=随便填
```

应该看到：
- 4 个 KPI：今日请求 / 独立用户 / 被限流 / 7 天用户
- 按领域分布条状图（6 周后这个图告诉你 wedge 该选谁）
- 按日时序 7 个小卡
- 最近 20 条事件 raw 表

---

## ✅ 完成了什么（睡眠期间）

提交：
- `4e3a45e` Stage A：/about + /demo UX + /404 + /thanks + 首页文案纠错
- `3e6e97b` Stage B+C+D+E：SEO + 健康检查 + 错误兜底 + 内置面板 + 文档

**Stage A**（用户能直接看到的打磨）：
- /about 完全没有占位文本了
- /demo 加了 localStorage 记忆领域 + 装填弹药库等待状态 + 显示来源领域
- 404 改了 InnoLab 真分析为主 CTA
- /thanks 改了文案（v1.0 已经上线，不再说"等开放"）
- 首页 Hero 主 CTA 改成"限免使用" + 直链 /demo
- 路线图反映真实当下

**Stage B**（SEO）：
- sitemap 加 changeFrequency
- 案例 / 方法详情都有完整 metadata（og:article + twitter + keywords）
- 案例页注入 JSON-LD Article schema
- manifest.webmanifest PWA 基础

**Stage C**（健壮性）：
- 全局错误兜底页（不再白屏）
- /api/health 健康检查端点
- 自动写结构化错误日志

**Stage D**（可观测性）：
- /admin/stats 运营面板（token-gated）
- 按领域分布 / 按日时序 / 独立用户 / 限流命中
- 不依赖外部数据库，直接读 pm2 logs

**Stage E**（文档）：
- README 重写：反映真实部署状态
- HANDOFF 重写：给你的清单 + 服务器速查
- DEPLOY 重写：增量更新一行命令 + 从零重装 8 步

**scripts/deploy-update.sh**：以后你 push 完代码，一行命令同步生产：
```bash
ssh ubuntu@<服务器 IP，见密码管理器> 'bash ~/innolab/scripts/deploy-update.sh'
```

---

## 🤚 我没动的（明确边界）

这些是**品牌承诺**，等你想清楚再做：

1. **Hero 大字**："AI 创新战略咨询师" 还在
2. **首页"精选方法"** 是否改成"4 把核心刀"
3. **是否锁 AI 转型 wedge**
4. **真实公众号 / 微信号 / 邮箱** —— /about 当前指向 qiuyiwu.com

---

## 🔒 安全提示（再说一次）

聊天里露过的：
- GitHub PAT `ghp_9k...QNGvg`
- 服务器密码 `<服务器密码:见密码管理器,勿写入仓库>`
- MiMo API key `tp-cwxh...nbhv`

**全去后台 rotate**。代码里没明文，但聊天截图 = 已泄露。

---

## 📊 当下数据状态

```
✅ 上线 URL：https://innolab.qiuyiwu.com
✅ 健康：data ok / ai ok / runtime ok
✅ 内容：74 方法 + 10 案例 + 6 引擎落地页
✅ AI：MiMo v2.5 Pro 接通
✅ 配额：50/天 全站 · 5/天 单 IP
✅ 主题：亮 / 暗 / 系统
✅ SEO：sitemap + metadata + JSON-LD
✅ 监控：/api/health + /admin/stats（token）
✅ 文档：README + HANDOFF + DEPLOY + MORNING_CHECKLIST
✅ 部署：scripts/deploy-update.sh 一行命令
✅ Git：14 个 commit 全 push 到 GitHub
```

---

## 下一步建议

按优先级（不阻塞验收）：

1. **先用 6 周看数据** —— /admin/stats 的真实流量分布告诉你 wedge 该选哪个
2. **品牌决策** —— Hero / 4 把刀 / wedge 三件，定一件就改一件
3. **如果还想继续完善** —— 告诉我你看到的具体问题
4. **如果可以对外发了** —— 朋友圈 / 推特 / 知识星球，看冷启动数据

睡得好。
