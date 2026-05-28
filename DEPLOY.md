# 部署到 Vercel

## 三分钟上线

### 1. push 代码到 GitHub

```bash
git push origin master
```

（如果还没 push，看 `git status` 和 `git log` 确认要 push 的 commit。）

### 2. 在 Vercel 导入项目

1. 打开 https://vercel.com/new
2. 用 GitHub 登录 → Authorize Vercel
3. Import 仓库：`qiuyiwu1989-star/innolab`
4. 配置（多数自动识别）：
   - **Framework Preset**: Next.js（自动）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（自动）
   - **Output Directory**: `.next`（默认）
   - **Install Command**: `npm install`（自动）
5. **Environment Variables**（必填两个）：
   - `NEXT_PUBLIC_SITE_URL` = `https://innolab.vercel.app`（占位；等子域挂好后改 `https://innolab.qiuyiwu.com`）
   - **`ANTHROPIC_API_KEY` = `sk-ant-...`** — `/demo` 实时分析必需。在 https://console.anthropic.com/settings/keys 创建。
   - 可选：`INNOLAB_DAILY_QUOTA_GLOBAL`（默认 50）、`INNOLAB_DAILY_QUOTA_PER_IP`（默认 5）
6. 点 **Deploy**

部署约 2-3 分钟。完成后你会得到一个 `https://innolab-xxx.vercel.app` 的临时 URL。

### 3. 接入子域名 `innolab.qiuyiwu.com`

InnoLab 走「`qiuyiwu.com` 主品牌的独立子域」路线。

**3a. 在 Vercel 项目里挂域**

1. Vercel 项目 → Settings → Domains → Add Domain
2. 输入 `innolab.qiuyiwu.com`
3. Vercel 会提示你"在 DNS 服务商加一条记录"，记下它给的目标值

**3b. 在 `qiuyiwu.com` 的 DNS 服务商加 CNAME**

到管理 `qiuyiwu.com` 的 DNS 控制台（Cloudflare / 阿里云 / Namecheap / 你用的那家）：

| 字段 | 值 |
|---|---|
| Type | `CNAME` |
| Name / Host | `innolab` |
| Value / Target | `cname.vercel-dns.com`（以 Vercel 实际给的为准） |
| TTL | Auto 或 600 |
| Proxy (Cloudflare 用户) | **关闭橙色云朵**（Vercel 自己签证书） |

**注意**：如果 `qiuyiwu.com` 主站本身托管在 Vercel，也可以在那个项目里直接 add `innolab.qiuyiwu.com` 然后用 redirect 转过来 — 但更干净的是 InnoLab 独立项目独立挂域。

**3c. 等 DNS 生效**

通常 10 分钟，最长 24 小时。验证：

```bash
dig innolab.qiuyiwu.com CNAME +short
# 应该返回 cname.vercel-dns.com.（或类似）
```

DNS 生效后 Vercel 自动签 Let's Encrypt 证书（约 30 秒）。

**3d. 切环境变量**

Vercel 项目 → Settings → Environment Variables：

```
NEXT_PUBLIC_SITE_URL = https://innolab.qiuyiwu.com
```

应用到所有环境（Production / Preview / Development）。然后 Deployments → 最新条 → ⋯ → Redeploy（让新 env 生效）。

### 4. 第一次 Redeploy（应用新环境变量）

环境变量改完后，Vercel Dashboard → Deployments → 最新一条 → 点 ⋯ → Redeploy。

## 后续维护

### 自动部署

任何 push 到 `master` 分支都会触发 Vercel 自动构建 + 部署。

### 预览部署

任何 push 到非 master 分支或开 PR，Vercel 会给一个独立的 preview URL，可以分享给别人看。

### 添加方法 / 案例

```bash
# 加方法
cp methods/cognition/some-template.md methods/cognition/your-new-method.md
# 编辑 frontmatter（## Meta 块）和正文

# 加案例
cp cases/enterprise/some-template.json cases/your-domain/your-case.json
# 编辑 + 把它登记到 cases/case-index.json

# 提交
git add methods cases
git commit -m "feat: 添加 XX 方法 / 案例"
git push   # Vercel 自动重新部署
```

### 监控 waitlist 提交

v0.1 的 waitlist 端点只把邮箱 `console.log` 到 Vercel Functions 日志。

查看：Vercel Dashboard → Logs → 筛选 `event":"waitlist.signup`

**v0.5 之前接入 Resend Audiences 做持久化** — 见 `.env.example`。

## 常见问题

### "Module not found: cmdk"

`npm install` 没跑完。本地：`rm -rf node_modules && npm install`。

### Build 失败：TypeScript 错误

本地先跑：

```bash
npm run build
```

确认本地通过再 push。

### OG 图不更新

OG 图是 edge runtime 动态生成，Vercel 边缘节点有缓存。改完 OG 图后强制 redeploy + 等 5-10 分钟 CDN 失效。

### 域名 SSL 证书一直 Pending

DNS 没指对。在终端跑 `dig your-domain.com` 检查 A/CNAME 是否对应到 Vercel。

## 自检清单（上线前）

- [ ] `npm run build` 本地通过
- [ ] `.env.example` 里所有 `NEXT_PUBLIC_*` 都在 Vercel 配好
- [ ] 至少 push 了一次（不然 Vercel 看不到代码）
- [ ] /about 页的 `[占位文本]` 至少填了一段（首次发布时）
- [ ] Footer 邮箱占位 `hi@example.com` 改成真实邮箱
- [ ] OG 图 share 到任意社交平台（Slack/Twitter/微信）确认显示对
- [ ] 在手机浏览器访问一次，菜单 + Hero + Demo 都能用
