#!/bin/bash
# check-agents.sh - 监控智能体集群状态
# 每 10 分钟执行一次，检查会话存活和 CI 结果

set -e

CLAWDBOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASKS_FILE="$CLAWDBOT_DIR/active-tasks.json"
WORKSPACE_ROOT="$(dirname "$CLAWDBOT_DIR")"
MAX_RESTARTS=3

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking agents..."

# 读取任务列表 (需要 jq 或简单解析)
if command -v jq &> /dev/null; then
    TASKS=$(jq -r '.tasks[] | select(.status == "running") | .id' "$TASKS_FILE" 2>/dev/null || echo "")
else
    # 简单解析 (无 jq)
    TASKS=$(grep -o '"id": *"[^"]*"' "$TASKS_FILE" | cut -d'"' -f4 || echo "")
fi

if [ -z "$TASKS" ]; then
    echo "No running tasks found."
    exit 0
fi

for TASK_ID in $TASKS; do
    echo "Checking task: $TASK_ID"
    
    # 检查 tmux 会话是否存活
    SESSION_NAME="huhoo-$TASK_ID"
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "⚠️  Session $SESSION_NAME not found!"
        # TODO: 检查重启次数，决定是否重新拉起
        continue
    fi
    
    # 检查 git worktree 是否存在
    WORKTREE_PATH="$WORKSPACE_ROOT/worktrees/$TASK_ID"
    if [ ! -d "$WORKTREE_PATH" ]; then
        echo "⚠️  Worktree $WORKTREE_PATH not found!"
        continue
    fi
    
    echo "✅ Task $TASK_ID is running"
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Check complete."
