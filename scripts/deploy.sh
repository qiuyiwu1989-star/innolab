#!/usr/bin/env bash
# InnoLab 一键部署脚本 —— 60 秒从本地到公网
# 跑：bash scripts/deploy.sh
#
# 这个脚本会：
#   1. 检查 gh / vercel CLI 是否就绪（已预装到 ~/.local/bin）
#   2. 检查 GitHub 登录态，没登录就拉浏览器登录
#   3. push 本地所有 commit 到 origin/master
#   4. 检查 Vercel 登录态，没登录就拉浏览器登录
#   5. 部署到 Vercel 生产
#   6. 提示你去 Vercel Dashboard 加 MIMO_* 三个 env vars

set -e

cd "$(dirname "$0")/.."

# CLI 路径
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

# ── 0. 预检 ──────────────────────────────────────
step "0/5 预检 CLI"

if ! command -v gh >/dev/null 2>&1; then
  err "gh CLI 没找到。应该在 ~/.local/bin/gh — 检查 PATH。"
  exit 1
fi
ok "gh: $(gh --version | head -1)"

if ! command -v vercel >/dev/null 2>&1; then
  err "vercel CLI 没找到。应该在 ~/.local/bin/vercel — 检查 PATH。"
  exit 1
fi
ok "vercel: $(vercel --version 2>&1 | head -1)"

if ! command -v git >/dev/null 2>&1; then
  err "git 不在 PATH。"
  exit 1
fi
ok "git: $(git --version)"

# ── 1. GitHub 登录 ────────────────────────────────
step "1/5 GitHub 登录态"

if gh auth status >/dev/null 2>&1; then
  ok "GitHub 已登录"
else
  warn "GitHub 未登录，启动 OAuth ..."
  echo "  → 浏览器会弹出登录页"
  echo "  → 选 GitHub.com → HTTPS → Login with a web browser"
  gh auth login
fi

# 配 git 用 gh 的 token
gh auth setup-git 2>/dev/null || true

# ── 2. Push ──────────────────────────────────────
step "2/5 Push 到 GitHub"

LOCAL_AHEAD=$(git rev-list --count origin/master..HEAD 2>/dev/null || echo "?")
if [ "$LOCAL_AHEAD" = "0" ]; then
  ok "已经是最新，没新 commit"
else
  echo "  → 准备 push $LOCAL_AHEAD 个 commit"
  git push origin master
  ok "推送完成"
fi

# ── 3. Vercel 登录 ────────────────────────────────
step "3/5 Vercel 登录态"

# vercel 没暴露 status 子命令；whoami 失败 = 没登录
if vercel whoami >/dev/null 2>&1; then
  ok "Vercel 已登录：$(vercel whoami 2>&1)"
else
  warn "Vercel 未登录，启动 OAuth ..."
  echo "  → 浏览器会弹出登录页"
  echo "  → 用你 GitHub / Google / Email 登录"
  vercel login
fi

# ── 4. 部署 ──────────────────────────────────────
step "4/5 部署到 Vercel 生产"

echo "  → 第一次会问 link 现有项目还是创建新的，选 create / link 都行"
echo "  → 部署预计 90-180 秒"
echo ""

vercel --prod --yes

# ── 5. 收尾提示 ──────────────────────────────────
step "5/5 收尾 — 你必须做这一步"

cat <<EOF

${BOLD}${YELLOW}必须做：去 Vercel Dashboard 加 3 个环境变量${NC}

  否则 /demo 在生产会报"未配置 MIMO_API_KEY"。

  1. 打开：https://vercel.com/dashboard
  2. 选 innolab 项目 → Settings → Environment Variables
  3. 加这三个（Production + Preview + Development 全勾）：

     ${BOLD}MIMO_API_KEY${NC}      = <MIMO_TP_TOKEN:见服务器 .env.local,勿写入仓库>
     ${BOLD}MIMO_BASE_URL${NC}     = https://token-plan-cn.xiaomimimo.com/v1
     ${BOLD}MIMO_MODEL${NC}        = mimo-v2.5-pro

  4. 加完后 Deployments → 最新一条 → ⋯ → Redeploy

${BOLD}强烈建议：${NC}回 https://token-plan-cn.xiaomimimo.com 后台轮换 API key
  （这个 key 已经在 git commit 信息、聊天记录里露过多次）

${BOLD}可选：${NC}接 innolab.qiuyiwu.com 子域 —— 见 DEPLOY.md §3
EOF

ok "全部完成"
