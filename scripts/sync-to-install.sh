#!/bin/bash
# sync-to-install.sh - 同步开发目录到安装目录（清理版）
# 用法：./scripts/sync-to-install.sh [restart]

set -e

DEV_DIR="/root/.openclaw/workspace/huhoo/cue-research"
INSTALL_DIR="/root/.openclaw/workspace/skills/cue-research"

echo "🔄 同步代码到安装目录..."

# 同步源代码（排除不需要的文件）
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.github' \
  --exclude 'test' \
  --exclude 'tests' \
  --exclude 'test-reports' \
  --exclude 'test-workspace' \
  --exclude '*.log' \
  --exclude '*.tmp' \
  --exclude '.DS_Store' \
  --exclude 'secrets.json' \
  --exclude 'FIX-REPORT*.md' \
  --exclude 'TEST-*.md' \
  --exclude '*-TEST.md' \
  --exclude 'test-report.json' \
  --exclude 'research.optimized.js' \
  "$DEV_DIR/" \
  "$INSTALL_DIR/"

echo "✅ 代码已同步到安装目录"
echo ""
echo "📊 同步统计："
echo "   开发目录：$(find "$DEV_DIR" -type f ! -path '*/node_modules/*' ! -path '*/.git/*' | wc -l) 个文件"
echo "   安装目录：$(find "$INSTALL_DIR" -type f ! -path '*/node_modules/*' ! -path '*/.git/*' | wc -l) 个文件"

# 可选：重启 Gateway
if [ "$1" = "restart" ]; then
  echo ""
  echo "🔄 重启 Gateway..."
  systemctl --user restart openclaw-gateway
  sleep 3
  systemctl --user status openclaw-gateway --no-pager | head -5
  echo "✅ Gateway 已重启"
fi

echo ""
echo "📋 验证命令："
echo "   openclaw skills list | grep 'Cue Research'"
echo "   diff -rq $DEV_DIR/src $INSTALL_DIR/src"
