/**
 * 通知辅助函数
 * 提供模式名称映射、阶段描述、时间格式化等工具函数
 */

/**
 * 模式名称映射（英文 → 中文）
 * @param {string} mode - 研究模式
 * @returns {string} 中文名称
 */
export function getModeName(mode) {
  const modeMap = {
    'trader': '短线交易视角',
    'fund-manager': '基金经理视角',
    'researcher': '产业研究视角',
    'advisor': '理财顾问视角',
    'macro': '宏观分析视角',
    'industry': '行业轮动视角',
    'tech-analyst': '技术分析师视角',
    'business-analyst': '商业分析师视角',
    'academic-researcher': '学术研究视角',
    'default': '综合研究视角'
  };
  return modeMap[mode] || modeMap.default;
}

/**
 * 阶段描述映射（基于服务端返回的 stage/subtask）
 * @param {string} stage - 阶段（start/coordinator/task/report/complete/final）
 * @param {string} subtask - 子任务名称（可选）
 * @returns {string} 阶段描述
 */
export function getStageDescription(stage, subtask) {
  // 优先显示服务端返回的子任务
  if (subtask && subtask.trim() !== '') {
    return subtask;
  }
  
  // 降级使用阶段映射
  const stageMap = {
    'start': '初始化研究任务',
    'coordinator': '正在分配研究任务',
    'task': '多源交叉验证与事实核查',
    'report': '报告生成与质量检查',
    'complete': '研究完成',
    'final': '最终校验'
  };
  
  return stageMap[stage] || '研究进行中...';
}

/**
 * 格式化时间（相对时间）
 * @param {Date|string|number} date - 日期对象/时间戳/字符串
 * @returns {string} 相对时间描述
 */
export function getTimeAgo(date) {
  const now = Date.now();
  const diff = now - (typeof date === 'object' ? date.getTime() : new Date(date).getTime());
  
  // 处理无效日期
  if (isNaN(diff) || diff < 0) return '刚刚';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

/**
 * 格式化进度通知内容
 * @param {Object} data - 进度数据
 * @returns {string} 格式化后的文本
 */
export function formatProgressNotification(data) {
  const { topic, elapsedMinutes, currentStage, subtask } = data;
  
  // 优先使用服务端返回的 subtask/currentStage
  const finalStage = getStageDescription(currentStage, subtask);
  
  return `🔔 研究进度更新

📋 主题：${topic}
⏱️ 已用时：${elapsedMinutes} 分钟
📊 当前阶段：${finalStage}

预计剩余时间：${Math.max(1, 30 - elapsedMinutes)} 分钟`;
}

/**
 * 格式化研究完成通知内容
 * @param {Object} data - 研究数据
 * @returns {string} 格式化后的文本
 */
export function formatResearchComplete(data) {
  const { topic, duration, reportUrl, reportSummary, mode, timestamp } = data;
  
  let content = `✅【研究完成】${topic}\n`;
  content += `🕐 ${timestamp || new Date().toLocaleString('zh-CN')}  ⏱️ ${duration} 分钟\n`;
  content += `🎯 ${getModeName(mode)}\n\n`;
  
  if (reportSummary) {
    // 清理报告摘要中的冗余信息
    let summary = reportSummary
      .replace(/^#\s*.+?\n/gm, '')           // 移除标题
      .replace(/^报告时间：.+?\n/gm, '')     // 移除时间
      .replace(/^##\s*执行摘要\s*\n/gm, '')  // 移除执行摘要标题
      .replace(/^>\s*/gm, '')                // 移除引用符号
      .replace(/^\*\*关键数据\*\*：\n/gm, '') // 移除关键数据标题
      .replace(/\n{3,}/g, '\n\n')            // 清理多余空行
      .trim();
    
    // 提取前 300 字
    summary = summary.length > 300 ? summary.substring(0, 300) + '...' : summary;
    content += `${summary}\n\n`;
  }
  
  content += `🔗 完整报告：${reportUrl}`;
  
  return content;
}

/**
 * 格式化研究失败通知内容
 * @param {Object} data - 失败数据
 * @returns {string} 格式化后的文本
 */
export function formatResearchFailed(data) {
  const { topic, taskId, errorMessage, failureType = 'unknown' } = data;
  
  const typeText = {
    'timeout': '⏱️ 任务超时',
    'aborted': '🛑 任务中止',
    'error': '❌ 任务错误',
    'unknown': '❌ 任务失败'
  }[failureType] || '❌ 任务失败';
  
  return `${typeText}

📋 主题：${topic}
📝 任务ID：${taskId}

🔍 原因：${errorMessage || '未知错误'}

💡 你可以重新发起研究任务，或检查网络连接后重试。`;
}

/**
 * 生成追问问题（基于研究主题和模式）
 * @param {string} topic - 研究主题
 * @param {string} mode - 研究模式
 * @param {string} reportSummary - 报告摘要（可选）
 * @returns {string} 追问问题
 */
export function generateFollowUpQuestion(topic, mode, reportSummary = '') {
  // 检测是否已包含对比分析
  const hasComparison = /对比|vs|竞争|优劣势/.test(topic);
  
  if (hasComparison) {
    const extensionMap = {
      'trader': `基于对比结果，未来 3 个月有哪些交易机会？`,
      'fund-manager': `基于对比结果，长期投资价值如何排序？`,
      'researcher': `这种竞争格局下，二线厂商的生存空间如何？`,
      'advisor': `对于稳健型投资者，应该如何配置仓位？`,
      'macro': `这种竞争格局对产业链全球竞争力有何影响？`,
      'industry': `未来 3-5 年，行业会出现新的竞争者吗？`,
      'default': `基于当前竞争格局，行业未来最大的变数是什么？`
    };
    return extensionMap[mode] || extensionMap.default;
  }
  
  // 检测是否已包含技术分析
  const hasTechAnalysis = /技术 | 专利 | 研发 | 创新/.test(reportSummary);
  
  if (hasTechAnalysis) {
    return `这些技术突破对成本和市场竞争格局会产生什么实际影响？`;
  }
  
  // 检测是否已包含财务分析
  const hasFinancial = /财报 | 营收 | 利润 | 估值/.test(reportSummary);
  
  if (hasFinancial) {
    return `财务数据背后的战略意图和运营策略是什么？`;
  }
  
  // 默认：根据模式生成
  const followUpMap = {
    'trader': `从短线交易角度，${topic}有哪些关键催化剂？`,
    'fund-manager': `${topic}的估值水平和安全边际如何？`,
    'researcher': `${topic}的核心技术壁垒是什么？`,
    'advisor': `${topic}适合什么风险偏好的投资者？`,
    'macro': `${topic}受哪些宏观因素影响最大？`,
    'industry': `${topic}所在行业的景气度趋势如何？`,
    'default': `${topic}的主要风险因素有哪些？`
  };
  
  return followUpMap[mode] || followUpMap.default;
}
