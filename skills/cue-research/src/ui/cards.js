import { recommendMonitors } from '../utils/monitorTemplates.js';
import { getModeName, generateFollowUpQuestion } from '../utils/notificationHelpers.js';

/**
 * 平台检测辅助函数
 */
function isFeishu(channel) {
  return channel === 'feishu';
}

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
 * 飞书卡片版：研究进度通知
 * @param {string} topic - 研究主题
 * @param {number} elapsedMinutes - 已用时（分钟）
 * @param {string} currentStage - 当前阶段
 * @param {string} subtask - 子任务
 * @param {string} reportUrl - 报告链接
 * @returns {Object} Feishu Adaptive Card
 */
export function buildProgressCardFeishu(topic, elapsedMinutes, currentStage, subtask, reportUrl) {
  const displayStage = (subtask && subtask.trim() !== '') 
    ? subtask 
    : (currentStage && currentStage.trim() !== '')
      ? currentStage
      : '研究进行中...';
  
  return {
    type: "card",
    cardData: {
      type: "AdaptiveCard",
      version: "1.2",
      body: [
        { type: "TextBlock", text: "🔔 研究进度更新", weight: "Bolder", color: "Accent", size: "Medium" },
        { type: "Separator", spacing: "Small" },
        { type: "TextBlock", text: `📋 ${topic}`, wrap: true, spacing: "Small" },
        { type: "TextBlock", text: `⏱️ 已用时：${elapsedMinutes} 分钟`, isSubtle: true },
        { type: "TextBlock", text: `📊 当前阶段：${displayStage}`, isSubtle: true },
        { type: "TextBlock", text: `预计剩余时间：${Math.max(1, 30 - elapsedMinutes)} 分钟`, isSubtle: true, color: "Good" }
      ],
      actions: [
        { type: "Action.OpenUrl", title: "🔗 查看进度", url: reportUrl || "https://cuecue.cn" }
      ]
    }
  };
}

/**
 * 研究完成通知卡片（基于旧版逻辑，适配新版架构）
 * @param {string} topic - 研究主题
 * @param {string} reportUrl - 报告链接
 * @param {number} duration - 耗时（分钟）
 * @param {string} mode - 研究模式
 * @param {string} reportSummary - 报告摘要
 * @param {string} channel - 渠道（feishu/其他）
 * @returns {string|Object} 格式化文本或 Feishu 卡片
 */
export function buildResearchCompleteCard(topic, reportUrl, duration, mode = 'default', reportSummary = '', channel = 'feishu') {
  // 飞书渠道返回卡片版本
  if (isFeishu(channel)) {
    return buildResearchCompleteCardFeishu(topic, reportUrl, duration, mode, reportSummary);
  }
  
  // 其他渠道返回文本版本
  return buildResearchCompleteCardText(topic, reportUrl, duration, mode, reportSummary);
}

/**
 * 文本版：研究完成通知（兼容非飞书渠道）
 */
function buildResearchCompleteCardText(topic, reportUrl, duration, mode, reportSummary) {
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

/**
 * 飞书卡片版：研究完成通知（3 个交互按钮）
 */
function buildResearchCompleteCardFeishu(topic, reportUrl, duration, mode, reportSummary) {
  const modeName = getModeName(mode);
  
  // 生成追问问题
  const followUpQuestion = generateFollowUpQuestion(topic, mode, reportSummary);
  
  // 获取监控推荐（TOP 1）
  const recommendations = recommendMonitors(topic, mode);
  const topRec = recommendations[0];
  
  // 构建卡片 body
  const body = [
    { type: "TextBlock", text: "✅ 研究完成通知", weight: "Bolder", color: "Good", size: "Medium" },
    { type: "Separator", spacing: "Small" },
    { type: "TextBlock", text: topic, wrap: true, weight: "Bolder", spacing: "Small" },
    { type: "TextBlock", text: `🕐 ${duration} 分钟  🎯 ${modeName}`, isSubtle: true }
  ];
  
  // 添加摘要（如果有）
  if (reportSummary) {
    let summary = reportSummary
      .replace(/^#\s*.+?\n/gm, '')
      .replace(/^报告时间：.+?\n/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (summary.length > 200) {
      summary = summary.substring(0, 200) + '...';
    }
    
    body.push({ type: "TextBlock", text: summary, wrap: true, spacing: "Small" });
  }
  
  // 添加推荐监控（如果有）
  if (topRec) {
    body.push({ type: "TextBlock", text: `💡 推荐监控：${topRec.title}`, spacing: "Small", wrap: true });
    body.push({ type: "TextBlock", text: `频率：${topRec.expected_frequency || '2-4 次/月'}`, isSubtle: true });
  }
  
  // 构建按钮
  const actions = [
    { type: "Action.OpenUrl", title: "🔗 查看报告", url: reportUrl }
  ];
  
  // 添加追问按钮
  if (followUpQuestion) {
    actions.push({ 
      type: "Action.Submit", 
      title: "💬 追问", 
      data: { action: "follow_up", topic: followUpQuestion }
    });
  }
  
  // 添加订阅监控按钮
  if (topRec) {
    actions.push({ 
      type: "Action.Submit", 
      title: "🔔 订阅监控", 
      data: { action: "create_monitor", topic, template: topRec.title }
    });
  }
  
  return {
    type: "card",
    cardData: {
      type: "AdaptiveCard",
      version: "1.2",
      body,
      actions
    }
  };
}

export function buildMonitorCard(topic, newsItem, channel = 'feishu') {
  // 飞书渠道返回增强版卡片（含深度研究按钮）
  if (isFeishu(channel)) {
    return buildMonitorCardFeishu(topic, newsItem);
  }
  
  // 其他渠道返回简化版卡片
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

/**
 * 飞书卡片版：监控通知（含深度研究按钮）
 */
function buildMonitorCardFeishu(topic, newsItem) {
  return {
    type: "card",
    cardData: {
      type: "AdaptiveCard",
      version: "1.2",
      body: [
        { type: "TextBlock", text: "🔔 监控触发", weight: "Bolder", color: "Accent", size: "Medium" },
        { type: "Separator", spacing: "Small" },
        { type: "TextBlock", text: `[${topic}]`, isSubtle: true, spacing: "Small" },
        { type: "TextBlock", text: newsItem.title || "发现新动态", weight: "Bolder", wrap: true, spacing: "Small" },
        { type: "TextBlock", text: newsItem.url || "", isSubtle: true, spacing: "Small" }
      ],
      actions: [
        { type: "Action.OpenUrl", title: "🔗 查看来源", url: newsItem.url || "https://google.com" },
        { type: "Action.Submit", title: "🔍 深度研究", data: { action: "research_from_monitor", topic: newsItem.title || topic } }
      ]
    }
  };
}

/**
 * 飞书卡片版：研究启动通知
 */
export function buildLaunchCardFeishu(topic, modeName, reportUrl) {
  return {
    type: "card",
    cardData: {
      type: "AdaptiveCard",
      version: "1.2",
      body: [
        { type: "TextBlock", text: "🚀 研究已启动", weight: "Bolder", color: "Good", size: "Medium" },
        { type: "Separator", spacing: "Small" },
        { type: "TextBlock", text: topic, wrap: true, weight: "Bolder", spacing: "Small" },
        { type: "TextBlock", text: `🎯 ${modeName}`, isSubtle: true },
        { type: "TextBlock", text: `🔗 ${reportUrl}`, isSubtle: true, color: "Accent" },
        { type: "TextBlock", text: "⏳ 5-30 分钟完成，完成后自动通知", isSubtle: true, spacing: "Medium" }
      ],
      actions: [
        { type: "Action.OpenUrl", title: "🔗 查看进度", url: reportUrl }
      ]
    }
  };
}

/**
 * 文本版：研究启动通知（兼容非飞书渠道）
 */
export function buildLaunchText(topic, modeName, reportUrl) {
  return `🚀 **研究已启动**
📋 ${topic}
🎯 ${modeName}
🔗 ${reportUrl}

⏳ 5-30 分钟完成，完成后自动通知`;
}
