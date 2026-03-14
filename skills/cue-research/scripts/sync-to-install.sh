#!/bin/bash
# sync-to-install.sh - 同步开发目录到安装目录
# 用法：./scripts/sync-to-install.sh [restart]

set -e

DEV_DIR="/root/hdm/cue-research"
INSTALL_DIR="/root/.openclaw/skills/cue-research"

echo "🔄 同步代码..."
rsync -av --delete "$DEV_DIR/src/" "$INSTALL_DIR/src/"

# 同步 package.json（可选，包含热重载配置）
cp "$DEV_DIR/package.json" "$INSTALL_DIR/package.json"

echo "✅ 代码已同步"

# 可选：重启 Gateway
if [ "$1" = "restart" ]; then
  echo "🔄 重启 Gateway..."
  systemctl --user restart openclaw-gateway
  sleep 3
  systemctl --user status openclaw-gateway --no-pager | head -5
  echo "✅ Gateway 已重启"
fi
