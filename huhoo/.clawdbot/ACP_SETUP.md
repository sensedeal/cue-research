# ACP Harness 配置 (通过 Bailian Anthropic 兼容接口)

## ✅ 已配置完成

### Claude Code CLI 配置

**~/.claude/settings.json**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-sp-8f4d1b7b3913480faef8456ccc94c18c",
    "ANTHROPIC_BASE_URL": "https://coding.dashscope.aliyuncs.com/apps/anthropic",
    "ANTHROPIC_MODEL": "qwen3.5-plus"
  }
}
```

**~/.claude.json**
```json
{
  "hasCompletedOnboarding": true
}
```

## 架构说明

```
Claude Code CLI
      │
      ▼
ANTHROPIC_BASE_URL (Bailian 兼容接口)
      │
      ▼
qwen3.5-plus / qwen3-coder-plus 等模型
```

## 使用方式

### 1. Claude Code CLI 直接使用
```bash
# 通过 claude 命令调用 (使用 Bailian 模型)
claude "实现用户认证系统"
```

### 2. OpenClaw sessions_spawn
```bash
# 通过 sessions_spawn 调用 ACP
sessions_spawn \
  --runtime=acp \
  --agentId=claude-code \
  --task="实现用户认证系统"
```

### 3. 在 agent-spawn-acp.sh 中
```bash
./agent-spawn-acp.sh auth-system claude "实现 JWT 认证系统"
```

## 可用模型

通过 Bailian Anthropic 兼容接口可调用的模型：
- `qwen3.5-plus` (默认)
- `qwen3-coder-plus`
- `qwen3-coder-next`
- `qwen3-max-2026-01-23`

## 优势

✅ **无需额外 API key** - 使用现有 Bailian key
✅ **兼容 Claude Code CLI** - 可以用 claude 命令
✅ **国内访问快** - Bailian 国内节点
✅ **成本低** - 人民币计价，比 Anthropic 便宜
