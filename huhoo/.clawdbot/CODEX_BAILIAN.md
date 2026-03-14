# Codex CLI 配置 Bailian 模型指南

## 配置完成 ✅

### ~/.codex/config.toml

```toml
model_provider = "Model_Studio_Coding_Plan"
model = "qwen3.5-plus"

[model_providers.Model_Studio_Coding_Plan]
name = "Model_Studio_Coding_Plan"
base_url = "https://coding.dashscope.aliyuncs.com/v1"
env_key = "OPENAI_API_KEY"
wire_api = "chat"
```

### 环境变量

**~/.bash_profile**
```bash
export OPENAI_API_KEY="sk-sp-8f4d1b7b3913480faef8456ccc94c18c"
```

## 架构原理

```
┌─────────────────┐
│   Codex CLI     │
│  (OpenAI 格式)   │
└────────┬────────┘
         │
         │ OPENAI_API_KEY
         │ https://coding.dashscope.aliyuncs.com/v1
         ▼
┌─────────────────┐
│   Bailian API   │
│ (OpenAI 兼容接口) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  qwen3.5-plus   │
│  qwen3-coder-   │
│  等 Bailian 模型  │
└─────────────────┘
```

## 使用方式

### 1. 直接使用 Codex CLI

```bash
# 简单任务
codex "实现用户登录功能"

# 指定模型
codex --model qwen3-coder-plus "重构 API 模块"

# 在指定目录
cd /path/to/project
codex "添加健康检查端点"
```

### 2. 在 OpenClaw 中通过 exec 调用

```bash
exec codex "实现用户认证系统"
```

### 3. 在 Swarm 脚本中调用

```bash
#!/bin/bash
cd /path/to/worktree
codex "$PROMPT"
```

## 可用模型

| 模型 | 用途 | 推荐场景 |
|------|------|----------|
| `qwen3.5-plus` | 通用 | 默认模型，适合大多数任务 |
| `qwen3-coder-plus` | 编码 | 后端开发、复杂逻辑 |
| `qwen3-coder-next` | 快速编码 | 前端开发、快速迭代 |
| `qwen3-max-2026-01-23` | 强推理 | 架构设计、复杂问题 |

## 切换模型

### 临时切换
```bash
codex --model qwen3-coder-plus "任务描述"
```

### 永久切换
编辑 `~/.codex/config.toml`:
```toml
model = "qwen3-coder-plus"
```

## 成本对比

| 调用方式 | 模型 | 成本 (每 1000 tokens) |
|----------|------|---------------------|
| **Bailian OpenAI 兼容** | qwen3.5-plus | ¥0.02 |
| **原生 OpenAI** | gpt-4 | $0.03 (约¥0.22) |
| **节省** | - | **约 91%** |

## 优势

✅ **成本极低** - 比原生 OpenAI 便宜 91%
✅ **国内访问快** - 阿里云国内节点
✅ **无需翻墙** - 直接访问
✅ **人民币计价** - 方便报销
✅ **兼容 Codex CLI** - 现有工具都能用

## 与 Claude Code 对比

| 特性 | Codex CLI | Claude Code CLI |
|------|-----------|-----------------|
| **配置方式** | ~/.codex/config.toml | ~/.claude/settings.json |
| **API Key** | OPENAI_API_KEY | ANTHROPIC_AUTH_TOKEN |
| **端点** | /v1 (OpenAI 兼容) | /apps/anthropic |
| **模型** | qwen3.5-plus | qwen3.5-plus |
| **实际调用** | Bailian | Bailian |

**结论：** 两者都调用相同的 Bailian 模型，只是接口格式不同！

## 故障排查

### 问题 1: 认证失败
```
错误：401 Unauthorized
```
**解决：** 检查 `OPENAI_API_KEY` 是否正确

### 问题 2: 连接超时
```
错误：Connection timeout
```
**解决：** 检查 `base_url` 是否正确

### 问题 3: Codex CLI 未安装
```
错误：command not found: codex
```
**解决：** 
```bash
npm install -g @openai/codex
```

## 验证配置

```bash
# 测试连接
codex "Hello, test this connection"

# 查看配置
cat ~/.codex/config.toml

# 检查环境变量
echo $OPENAI_API_KEY
```

---

**配置完成！可以开始使用了！** 🚀
