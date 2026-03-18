---
name: cue_research
description: 当用户要求分析公司、行业、股票、财报、投资标的或寻求深度调研时调用。5-30 分钟生成专业级研报。
icon: 🔍
user-invocable: true
tags: 
  - finance
  - research
  - monitoring
metadata:
  { "openclaw": { "emoji": "🔍", "requires": { "env": ["CUECUE_API_KEY"], "bins": ["node"] } } }
---

# 🔍 Cue Research - AI 深度调研助理

## 何时调用

**当用户想要深度分析、研究、调研、对比、评估某个公司、行业、股票、投资标的时：**

✅ **调用场景：**
- "分析宁德时代"
- "研究 ETF 市场"
- "腾讯怎么样？前景如何？"
- "对比阿里和拼多多"
- "看看茅台的财报"
- "新能源赛道未来趋势"
- "ETF 市场周报"

❌ **不调用：**
- 简单事实查询（"宁德时代股票代码是多少"）→ 直接回答
- 日常聊天 → 正常对话

## 如何使用

### 启动研究任务

当识别到用户需要深度研究时，执行：

```bash
node /root/.openclaw/workspace/skills/cue-research/scripts/cue.js "<研究主题>"
```

**示例：**
```bash
node /root/.openclaw/workspace/skills/cue-research/scripts/cue.js "ETF 市场周报"
```

**返回结果：**
```json
{
  "success": true,
  "taskId": "task_1710400000000",
  "topic": "ETF 市场周报",
  "mode": "auto",
  "reportUrl": "https://cuecue.cn/c/abc123",
  "estimatedTime": "5-30 分钟",
  "message": "研究已启动，完成后会通知您"
}
```

### 给用户展示

研究启动后，给用户展示：

```
🚀 **研究已启动**

📋 {topic}
🎯 {mode} 模式
⏳ 预计：5-30 分钟

🔗 [查看进度]({reportUrl})

完成后会主动通知您！
```

## 监控与通知

**自动监控：** cron 每 5 分钟轮询一次任务进度

**通知时机：**
- 启动时：立即通知
- 进度更新：每 5 分钟或阶段变化
- 完成时：立即通知 + 报告链接
- 失败时：立即通知 + 错误原因

## API 配置

**API Key 位置：** `/root/.openclaw/workspace/skills/cue-research/secrets.json`

```json
{
  "CUECUE_API_KEY": "your_api_key"
}
```

## 研究模式

自动识别最佳视角：

| 模式 | 触发词 | 视角 |
|------|--------|------|
| trader | 买、卖、涨停、龙虎榜 | 短线交易 |
| investor | 财报、估值、PE、PB | 基本面分析 |
| researcher | 产业链、竞争、赛道 | 产业研究 |
| advisor | 理财、配置、风险 | 资产配置 |
| macro | GDP、CPI、政策 | 宏观分析 |
| auto | 其他 | 自动识别 |

## 注意事项

- 研究耗时：5-30 分钟
- 完成后主动推送通知
- 支持创建 24/7 智能监控
- 报告链接永久有效
