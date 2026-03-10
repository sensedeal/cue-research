# 📥 安装指南 (Installation Guide)

Cue Research 支持多种安装方式，选择最适合你的方案。

---

## 🚀 方案 1：从 ClawHub 安装（推荐）

**前提**：Cue Research 已在 ClawHub 市场发布

```bash
openclaw skills install cue-research
```

---

## 🌐 方案 2：从 GitHub 安装

```bash
openclaw skills install https://github.com/sensedeal/cue-research.git
```

---

## 💻 方案 3：本地安装（开发/测试）

### 步骤 1：配置技能路径

```bash
# 添加本地技能目录到 OpenClaw 配置
# 替换 <YOUR_PATH> 为实际路径，例如：/root/hdm/cue-research
openclaw config set skills.paths '["<YOUR_PATH>/cue-research"]'
```

### 步骤 2：重启 Gateway

```bash
openclaw gateway restart
```

### 步骤 3：验证安装

```bash
# 查看已安装技能列表
openclaw skills list

# 应能看到 cue-research 在列表中
```

---

## 🔑 配置密钥

安装完成后，需在 OpenClaw Secrets 中配置 API 密钥。

### 必填密钥

| 变量名 | 获取地址 | 说明 |
|--------|----------|------|
| `CUECUE_API_KEY` | [CueCue 官网](https://cuecue.cn) | 驱动深度研究的 Agent API |

### 选填密钥

| 变量名 | 获取地址 | 说明 |
|--------|----------|------|
| `TAVILY_API_KEY` | [Tavily 官网](https://tavily.com) | 监控功能的全网搜索能力 |

### 配置方法

```bash
# 通过命令行配置
openclaw secrets set CUECUE_API_KEY sk_your_api_key_here

# 或在 OpenClaw 控制面板中配置
```

---

## ✅ 验证安装

### 测试命令

```bash
# 1. 查看帮助菜单
/ch

# 2. 测试深度调研
/cue 分析宁德时代

# 3. 测试自然语言唤醒（如支持）
直接发送："帮我分析一下比亚迪的竞争优势"
```

### 预期响应

- **帮助菜单**：显示所有可用命令列表
- **调研任务**：返回进度卡片，显示 "🚀 研究进行中"
- **自然语言**：自动识别意图并触发调研（无需 `/cue` 前缀）

---

## 🛠️ 故障排查

### 问题 1：技能未识别

```bash
# 检查技能路径配置
openclaw config get skills.paths

# 重启 Gateway
openclaw gateway restart
```

### 问题 2：密钥未配置

```bash
# 检查密钥是否已设置
openclaw secrets list

# 重新配置密钥
openclaw secrets set CUECUE_API_KEY sk_xxx
```

### 问题 3：依赖未安装

```bash
# 进入技能目录（替换为你的实际路径）
cd <YOUR_PATH>/cue-research

# 安装依赖
npm install
```

---

## 📚 相关文档

- [README.md](./README.md) - 功能说明与使用指南
- [SKILL.md](./SKILL.md) - 技能详细说明
- [PRIVACY.md](./PRIVACY.md) - 隐私政策
- [CHANGELOG.md](./CHANGELOG.md) - 版本更新日志

---

## 🆘 获取帮助

- **GitHub Issues**: https://github.com/sensedeal/cue-research/issues
- **文档**: https://docs.cuecue.cn/skill
- **邮件**: support@sensedeal.ai

---

*Last updated: 2026-03-10*
