import { recommendMonitors } from '../utils/monitorTemplates.js';

export function formatProgressMessage(topic, percent, stage) {
  const filled = Math.max(0, Math.floor(percent / 5));
  const empty = Math.max(0, 20 - filled);
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `🚀 **研究进行中：${topic}**\n\n${bar} ${percent}%\n📍 当前状态：${stage}`;
}

export function buildResearchCompleteCard(topic, reportUrl, duration) {
  // 智能推荐监控模板
  const recs = recommendMonitors(topic);

  return {
    type: "card",
    cardData: {
      type: "AdaptiveCard",
      version: "1.2",
      body: [
        { type: "TextBlock", text: "✅ **研究完成**", size: "Large", color: "Good" },
        { type: "FactSet", facts: [{ title: "课题:", value: topic }, { title: "耗时:", value: `${duration} 分钟` }] }
      ],
      actions: [
        { type: "Action.OpenUrl", title: "📊 查看完整报告", url: reportUrl },
        ...recs.map(r => ({
          type: "Action.Submit",
          title: `➕ 监控：${r.title}`,
          data: { action: "create_monitor", topic: topic, template: r.key }
        }))
      ]
    }
  };
}

export function buildMonitorCard(topic, newsItem) {
  return {
    type: "card",
    cardData: {
      type: "AdaptiveCard",
      version: "1.2",
      body: [
        { type: "TextBlock", text: "🔔 **监控触发**", color: "Accent" },
        { type: "TextBlock", text: `[${topic}] 发现新动态：` },
        { type: "TextBlock", text: newsItem.title, weight: "Bolder", wrap: true }
      ],
      actions: [
        { type: "Action.OpenUrl", title: "🔗 查看来源", url: newsItem.url || "https://google.com" }
      ]
    }
  };
}
