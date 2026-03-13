import { recommendMonitors } from '../utils/monitorTemplates.js';
import { getModeName, generateFollowUpQuestion } from '../utils/notificationHelpers.js';

/**
 * 旧版格式：百分比进度条（保留向后兼容）
 */
export function formatProgressMessage(topic, percent, stage) {
  const filled = Math.max(0, Math.floor(percent / 5));
  const empty = Math.max(0, 20 - filled);
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `🚀 **研究进行中：${topic}**\n\n${bar} ${percent}%\n📍 当前状态：${stage}`;
}

/**
 * 新版格式：研究进度通知（基于旧版逻辑）
 * @param {string} topic - 研究主题
 * @param {number} elapsedMinutes - 已用时（分钟）
 * @param {string} currentStage - 当前阶段
 * @param {string} subtask - 子任务
 * @returns {string} 格式化文本
 */
export function formatProgressNotification(topic, elapsedMinutes, currentStage, subtask) {
  // 优先显示子任务
  const displayStage = (subtask && subtask.trim() !== '') 
    ? subtask 
    : (currentStage && currentStage.trim() !== '')
      ? currentStage
      : '研究进行中...';
  
  return `🔔 研究进度更新

📋 主题：${topic}
⏱️ 已用时：${elapsedMinutes} 分钟
📊 当前阶段：${displayStage}

预计剩余时间：${Math.max(1, 30 - elapsedMinutes)} 分钟`;
}

/**
 * 研究完成通知卡片（基于旧版逻辑，适配新版架构）
 * @param {string} topic - 研究主题
 * @param {string} reportUrl - 报告链接
 * @param {number} duration - 耗时（分钟）
 * @param {string} mode - 研究模式
 * @param {string} reportSummary - 报告摘要
 * @returns {string} 格式化文本（含按钮描述）
 */
export function buildResearchCompleteCard(topic, reportUrl, duration, mode = 'default', reportSummary = '') {
  const timestamp = new Date().toLocaleString('zh-CN');
  const modeName = getModeName(mode);
  
  // 清理报告摘要
  let summary = reportSummary;
  if (summary) {
    summary = summary
      .replace(/^#\s*.+?\n/gm, '')
      .replace(/^报告时间：.+?\n/gm, '')
      .replace(/^##\s*执行摘要\s*\n/gm, '')
      .replace(/^>\s*/gm, '')
      .replace(/^\*\*关键数据\*\*：\n/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (summary.length > 300) {
      summary = summary.substring(0, 300) + '...';
    }
  }
  
  // 生成追问问题
  const followUpQuestion = generateFollowUpQuestion(topic, mode, reportSummary);
  const shortQuestion = followUpQuestion.length > 20 
    ? followUpQuestion.substring(0, 20) + '...' 
    : followUpQuestion;
  
  // 获取监控推荐（TOP 1）
  const recommendations = recommendMonitors(topic, mode);
  const topRec = recommendations[0];
  
  // 构建卡片内容
  let content = `✅ **研究完成通知**\n\n`;
  content += `**🎯 核心结论**\n`;
  content += `${topic}研究已完成。\n\n`;
  
  if (summary) {
    content += `**📝 核心摘要**\n${summary}\n\n`;
  }
  
  content += `🕐 ${timestamp}  ⏱️ ${duration} 分钟  🎯 ${modeName}\n\n`;
  content += `🔗 [查看完整报告](${reportUrl})\n\n`;
  
  if (topRec) {
    content += `💡 **推荐监控**：${topRec.title}\n`;
    content += `   频率：${topRec.expected_frequency || '2-4 次/月'}\n`;
    content += `   触发条件：${topRec.semantic_trigger || topRec.trigger_keywords?.join('、') || '自动检测'}\n\n`;
  }
  
  content += `**快捷回复**：\n`;
  content += `• 回复 "**创建监控**" 或 "**Y**" 开启推荐监控\n`;
  content += `• 回复 "**追问**" 深入调研：${shortQuestion}\n`;
  content += `• 回复 "**状态**" 查看任务列表`;
  
  return content;
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
