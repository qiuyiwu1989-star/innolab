#!/usr/bin/env bash
# 睡醒后的"一键继续"脚本
# 跑：bash scripts/wake-up.sh

cd "$(dirname "$0")/.."

# 把 ~/.local/bin 加进 PATH（gh CLI 装在那里）
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

echo "════════════════════════════════════════════════════════════════"
echo "  InnoLab v0.3  ·  Wake Up Routine"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ── 1 · Git 状态 ────────────────────────────────────────────────────
echo "📦 Git 状态（最近 5 个 commit）"
git log --oneline -5
echo ""

LOCAL_AHEAD=$(git rev-list --count origin/master..HEAD 2>/dev/null || echo "?")
echo "→ 本地比 origin/master 多 $LOCAL_AHEAD 个 commit（等 push）"
echo ""

# ── 2 · gh CLI 状态 ─────────────────────────────────────────────────
if command -v gh >/dev/null 2>&1; then
  GH_PATH=$(command -v gh)
  echo "✅ GitHub CLI 已装：$GH_PATH ($(gh --version | head -1))"

  # 检查是否已登录
  if gh auth status >/dev/null 2>&1; then
    echo "✅ GitHub 已登录"
    GH_AUTHED=1
  else
    echo "⚠  GitHub CLI 未登录"
    GH_AUTHED=0
  fi
else
  echo "⚠  gh CLI 没在 PATH，但应该在 ~/.local/bin/gh"
  GH_AUTHED=0
fi
echo ""

# ── 3 · dev server 状态 ─────────────────────────────────────────────
if curl -s -o /dev/null --max-time 2 http://localhost:3000; then
  echo "✅ Dev server 已在 http://localhost:3000 跑着"
else
  echo "🚀 启动 dev server..."
  nohup npm run dev > /tmp/innolab-dev.log 2>&1 &
  sleep 3
  if curl -s -o /dev/null --max-time 2 http://localhost:3000; then
    echo "✅ Dev server 起来了 → http://localhost:3000"
  else
    echo "⚠  Dev server 启动失败，看 /tmp/innolab-dev.log"
  fi
fi
echo ""

# ── 4 · 下一步指示 ────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════════"
echo "  你要做的（按顺序）"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  ① 验收（5 分钟）"
echo "     在浏览器看："
echo "       http://localhost:3000          ← 首页"
echo "       http://localhost:3000/demo     ← v1.0 模拟分析（重点）"
echo "       http://localhost:3000/methods  ← 方法库 + 试 ⌘K"
echo ""

if [ "$GH_AUTHED" = "0" ]; then
  echo "  ② GitHub 登录 + push（2 分钟）"
  echo "     export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo "     gh auth login    # 选 HTTPS → 浏览器登录"
  echo "     git push origin master"
  echo ""
else
  echo "  ② push（10 秒）"
  echo "     git push origin master"
  echo ""
fi

echo "  ③ Vercel 部署（3 分钟）"
echo "     open https://vercel.com/new"
echo "     # 详细步骤见 DEPLOY.md"
echo ""
echo "  ④ 完整交接文档"
echo "     open HANDOFF.md"
echo ""
echo "════════════════════════════════════════════════════════════════"
