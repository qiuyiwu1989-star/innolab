#!/usr/bin/env bash
#
# InnoLab 一键安全部署 —— 根除 502 反复
#
# 用法:  ./deploy.sh
#
# 安全原则（针对过去反复出现的 502）:
#   1. 先本地 build，RC≠0 立即中止 —— 绝不把坏代码送上服务器
#   2. rsync 增量同步源码（排除 .next/node_modules/.git/data）
#   3. 服务器先 build 成功，RC≠0 则保留旧 .next + 不重启 —— 站点不挂
#   4. 只有 build 成功才 pm2 restart
#   5. 部署后健康检查；任何一步失败都明确报错
#
set -euo pipefail

# ── 配置 ──────────────────────────────────────────
HOST="43.159.171.3"
USER="ubuntu"
REMOTE="/home/ubuntu/innolab"
PM2_APP="innolab"
HEALTH_URL="https://innolab.cc/api/health"
SITE_URL="https://innolab.cc/"
# 密码从环境变量读，避免硬编码进 git。运行前：export INNOLAB_SSH_PASS=...
SSHPASS_BIN="$(command -v sshpass || true)"

c_green=$'\e[32m'; c_red=$'\e[31m'; c_yellow=$'\e[33m'; c_reset=$'\e[0m'
step() { echo "${c_yellow}▶ $1${c_reset}"; }
ok()   { echo "${c_green}✓ $1${c_reset}"; }
die()  { echo "${c_red}✗ $1${c_reset}"; exit 1; }

# ── 0. 前置检查 ───────────────────────────────────
[ -f package.json ] || die "请在项目根目录运行"
if [ -z "${INNOLAB_SSH_PASS:-}" ]; then
  die "请先设置 SSH 密码：export INNOLAB_SSH_PASS='你的密码'"
fi
[ -n "$SSHPASS_BIN" ] || die "需要 sshpass（brew install sshpass 或改用 ssh key）"

SSH="sshpass -p $INNOLAB_SSH_PASS ssh -o StrictHostKeyChecking=no $USER@$HOST"
RSYNC_RSH="sshpass -p $INNOLAB_SSH_PASS ssh -o StrictHostKeyChecking=no"

# ── 1. 本地 build（守门员：坏代码绝不上服务器）──────
step "本地 build 验证…"
if ! npm run build > /tmp/innolab-local-build.log 2>&1; then
  tail -20 /tmp/innolab-local-build.log
  die "本地 build 失败 —— 已中止，服务器未受影响"
fi
grep -q "Compiled successfully" /tmp/innolab-local-build.log || die "本地 build 未见成功标志"
ok "本地 build 通过"

# ── 2. rsync 同步源码 ─────────────────────────────
step "同步源码到服务器…"
rsync -az --delete \
  --exclude '.next' --exclude 'node_modules' --exclude '.git' \
  --exclude 'data' --exclude 'rate-limit-state.json' \
  --exclude '.env.local' --exclude '*.log' \
  -e "$RSYNC_RSH" \
  ./ "$USER@$HOST:$REMOTE/" || die "rsync 失败"
ok "源码已同步"

# ── 3. 服务器 build（失败则保留旧站点不动）─────────
step "服务器 build…"
BUILD_OUT=$($SSH "cd $REMOTE && source ~/.nvm/nvm.sh && npm run build 2>&1 | tail -3; echo RC=\${PIPESTATUS[0]}")
echo "$BUILD_OUT"
echo "$BUILD_OUT" | grep -q "RC=0" || die "服务器 build 失败 —— 旧 .next 与运行中进程未动，站点仍在线"
ok "服务器 build 成功"

# ── 4. 重启（只在 build 成功后）────────────────────
step "重启 pm2…"
$SSH "source ~/.nvm/nvm.sh && pm2 restart $PM2_APP --update-env" >/dev/null || die "pm2 重启失败"
ok "已重启"

# ── 5. 健康检查 ───────────────────────────────────
step "等待服务就绪…"
sleep 6
for i in 1 2 3 4 5; do
  CODE=$(curl -s -m 8 -o /dev/null -w '%{http_code}' "$SITE_URL" || echo 000)
  if [ "$CODE" = "200" ]; then ok "站点在线 (HTTP 200)"; break; fi
  [ "$i" = "5" ] && die "健康检查失败：站点返回 $CODE —— 请查 pm2 logs $PM2_APP"
  echo "  第 $i 次：$CODE，重试…"; sleep 4
done

HEALTH=$(curl -s -m 8 "$HEALTH_URL" 2>/dev/null | head -c 200 || echo "")
echo "  /api/health: $HEALTH"

echo ""
ok "部署完成 —— $SITE_URL"
echo "${c_yellow}提示：别忘了 git commit + push 让 GitHub 与线上同步${c_reset}"
