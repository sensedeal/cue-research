---
name: cue_research
description: 当用户要求分析公司、行业、股票、财报、投资标的或寻求深度调研时，必须调用此技能。5-30 分钟生成专业级研报。
icon: 🔍
user-invocable: true
tags: 
  - finance
  - research
  - monitoring
metadata:
  { "openclaw": { "emoji": "🔍", "requires": { "env": ["CUECUE_API_KEY"] } } }
---

# 🔍 Cue Research - AI 深度调研助理

## 何时调用

**当用户想要深度分析、研究、调研、对比、评估某个公司、行业、股票、投资标的时：**

✅ 调用场景：
- "分析宁德时代"
- "研究 ETF 市场"
- "腾讯怎么样？前景如何？"
- "对比阿里和拼多多"
- "看看茅台的财报"
- "新能源赛道未来趋势"

❌ 不调用：
- 简单事实查询（"宁德时代股票代码是多少"）→ 直接回答
- 日常聊天 → 正常对话

## 如何使用

### 方法 1：使用 exec 调用 CueCue API

```bash
curl -X POST https://api.cuecue.cn/v1/research \
  -H "Authorization: Bearer $CUECUE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic": "研究主题", "mode": "auto"}'
```

### 方法 2：直接访问 CueCue 平台

引导用户访问：https://cuecue.cn

## API 配置

API Key 存储在：`~/.openclaw/workspace/skills/cue-research/secrets.json`

```json
{
  "CUECUE_API_KEY": "your_api_key"
}
```

## 研究模式

- **auto**: 自动识别最佳研究视角
- **trader**: 短线交易视角（资金流向、技术形态）
- **investor**: 基金经理视角（基本面、估值）
- **researcher**: 产业研究视角（产业链、竞争格局）
- **advisor**: 理财顾问视角（资产配置、风险收益）
- **macro**: 宏观分析视角（GDP、CPI、政策）

## 注意事项

- 研究耗时：5-30 分钟
- 完成后主动通知用户
- 支持创建 24/7 智能监控
- 报告链接格式：https://cuecue.cn/c/{conversationId}
