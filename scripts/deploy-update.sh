#!/usr/bin/env bash
# 在 qiuyiwu.com 服务器上执行 InnoLab 增量更新。
# 用法：在本地 push 完代码后 ssh ubuntu@43.159.171.3 'bash ~/innolab/scripts/deploy-update.sh'
# 或者直接登录服务器后 cd ~/innolab && bash scripts/deploy-update.sh

set -euo pipefail

cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════"
echo "  InnoLab · Deploy Update"
echo "═══════════════════════════════════════════════════"
echo ""

# 加载 nvm — 这台服务器用 nvm 管理 Node 22
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "▸ git fetch + pull..."
git fetch origin master
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "  本地已经是最新，无需更新。"
  exit 0
fi
echo "  $LOCAL → $REMOTE"
git pull --rebase origin master

echo ""
echo "▸ npm ci..."
npm ci --silent 2>&1 | tail -3

echo ""
echo "▸ npm run build..."
npm run build 2>&1 | tail -3

echo ""
echo "▸ pm2 reload innolab（零 downtime）..."
pm2 reload innolab

echo ""
echo "▸ smoke test..."
sleep 2
curl -sf -o /dev/null -w "  / HTTP %{http_code}\n" https://innolab.qiuyiwu.com/
curl -sf -o /dev/null -w "  /api/health HTTP %{http_code}\n" https://innolab.qiuyiwu.com/api/health

echo ""
echo "✅ 部署完成。"
echo "   提交：$REMOTE"
echo "   日志：pm2 logs innolab --lines 50"
echo ""
