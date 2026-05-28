# InnoLab 交接文档

> **生产 URL**：<https://innolab.qiuyiwu.com> ✅ 已上线  
> **GitHub**：<https://github.com/qiuyiwu1989-star/innolab>  
> **服务器**：腾讯云香港 43.159.171.3（Ubuntu 24.04，ubuntu 用户）

## 项目状态（一句话）

InnoLab 已经是一个**完整运行的产品**——74 方法 + 10 案例 + 真 AI 分析（小米 MiMo）+ 双主题 + 命令面板 + 内置运营面板，全部跑在你自己的 qiuyiwu.com 子域上。

## 早上验收清单（5 分钟）

打开浏览器：

- [ ] <https://innolab.qiuyiwu.com> — 首页正常
- [ ] <https://innolab.qiuyiwu.com/demo> — 选个领域 + prompt，看真 AI 流式推演
- [ ] 顶栏右上角 ☀/🌙/🖥 切换主题，看亮暗都顺
- [ ] 按 ⌘K，搜"蓝海" / "CG14" / "球球"，看命令面板
- [ ] <https://innolab.qiuyiwu.com/cases/case-005> 看复原分析流程（造物云）
- [ ] <https://innolab.qiuyiwu.com/api/health> — JSON 健康检查
- [ ] <https://innolab.qiuyiwu.com/admin/stats?token=YOUR_TOKEN> — 运营面板

如果某项有问题：

- 截图发我
- 或者 `ssh ubuntu@43.159.171.3 'pm2 logs innolab --lines 50'` 看日志

## 已交付清单（v0.1 → v0.9）

### 视觉 / 交互
- 双主题（亮 / 暗 / 系统跟随），默认暗
- Stripe Sigma 风格：黑底 + volt #b3ff39 + 大几何
- 桌面 + 移动响应式
- CMD+K 全局命令面板
- 自定义 404 + 错误兜底页 + thanks
- 流式 markdown 渲染（表格 / 代码块 / 锚点）

### 内容
- 74 个方法卡（六大引擎 × 五层认知）
- 10 个真实案例（全部带"复原分析流程"可视化）
- 6 个引擎独立落地页
- /about 含真实路线图（无占位文本）

### AI 引擎
- /demo 真接小米 MiMo v2.5 Pro
- SSE 流式响应 + 取消支持
- system prompt = SKILL.md + 74 方法索引 + 10 案例索引
- 限流：50/天全站 + 5/天/IP
- 5 领域 × 3 预设问题 = 15 prompt 模板
- localStorage 记住上次领域选择
- 结构化 JSON 事件日志（pm2 logs 直接采集）

### 部署 + 运维
- 跑在自建 VPS（pm2 + nginx + Certbot SSL）
- 增量更新一行命令：`bash scripts/deploy-update.sh`
- /api/health 健康检查
- /admin/stats 运营面板（token-gated）

### SEO + 元数据
- sitemap 含全部页面 + changeFrequency
- per-page metadata（案例 / 方法都有自己的 og:article）
- JSON-LD Article schema 在案例页
- robots.txt + manifest.webmanifest

## 服务器日常操作速查

```bash
# SSH
ssh ubuntu@43.159.171.3

# 看 InnoLab 状态
pm2 status innolab
pm2 logs innolab --lines 50

# 拉新代码 + 重启
bash ~/innolab/scripts/deploy-update.sh

# 单独重启 InnoLab
pm2 reload innolab

# 看 nginx 状态（如果改了配置）
sudo nginx -t && sudo nginx -s reload

# 看哪些其他项目在跑
pm2 list
```

## 配额调整

服务器上编辑 `~/innolab/.env.local`：

```
INNOLAB_DAILY_QUOTA_GLOBAL=100   # 全站每日（默认 50）
INNOLAB_DAILY_QUOTA_PER_IP=10    # 单 IP 每日（默认 5）
```

然后 `pm2 reload innolab`。

## /admin/stats token 配置

```bash
ssh ubuntu@43.159.171.3
echo 'INNOLAB_ADMIN_TOKEN=随机字符串' >> ~/innolab/.env.local
pm2 reload innolab
# 访问：https://innolab.qiuyiwu.com/admin/stats?token=随机字符串
```

## 待你做的决策（产品层面）

我没动这几件因为是**品牌承诺**：

1. **Hero 大字**（"AI 创新战略咨询师"）—— 等你想清楚 wedge
2. **首页"精选方法"是否改为"4 把核心刀"** —— 暗示 70 个长尾方法是次要
3. **是否锁 AI 转型这个 wedge** —— 你说要再想想品牌
4. **真实联系方式**（公众号 / 微信）—— /about 现在指向 qiuyiwu.com

## 安全提示（再重申）

聊天里露过的：
- GitHub PAT `ghp_9k...QNGvg`
- 服务器 ubuntu 密码 `Zaowu@806`
- MiMo API key `tp-cwxh...nbhv`

**全去后台 rotate**。代码本身没引用任何明文，但聊天记录被截图过就等于泄露。

## 下一阶段建议

按优先级：

1. **看 6 周后 /admin/stats** —— 真实流量分布告诉你哪个领域才是 wedge
2. **打磨明星方法 landing**（CG06/ST10/ST09/GN02） —— 一旦你愿意锁，先做这 4 个
3. **接 PostHog** —— 当 console.log 不够用时，5 分钟切换（字段名不变）
4. **写第二批案例**（10 → 30）—— 选你想 wedge 的那个领域优先
5. **付费版** —— Stripe + 私有记忆库 + 团队协作

## 我没动的

- Hero 文案（你品牌决策）
- "六大引擎"展示 vs "4 把刀"重排（同上）
- 真实联系方式（不在我知道范围）
- 真实公众号 / 微信号
- 数据库 / Redis（保持内存兜底，等真流量出现再加）
- PostHog / Plausible 接入（log 字段名已对齐，需要时直接 swap）

## 一切顺利的话

明早起来你应该能：
1. 打开 <https://innolab.qiuyiwu.com> 看到完整的产品
2. 给朋友发链接，他们能直接试 /demo
3. 看 /admin/stats 数据（虽然刚上线没几个用户）
4. 决策 wedge / 品牌方向后，让我做下一阶段
