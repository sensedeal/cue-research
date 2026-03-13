import path from 'path';
import fs from 'fs-extra';
import { getUserWorkspace, atomicWriteJson, safeReadJson } from '../utils/storage.js';
import { executeResearchStream } from '../api/cuecueClient.js';
import { buildResearchCompleteCard, formatProgressNotification } from '../ui/cards.js';
import { buildApiKeyMissingGuide, getApiKeyFromSecrets } from './keyManager.js';
import { getModeName, formatResearchFailed } from '../utils/notificationHelpers.js';
import { formatErrorForUser, isRetryableError } from '../utils/errorHandler.js';
import { randomUUID } from 'crypto';

// 🚀 性能优化：缓存模式检测器，避免重复 import
let _modeDetectorCache = null;
async function getModeDetector() {
  if (!_modeDetectorCache) {
    _modeDetectorCache = await import('./modeDetector.js');
  }
  return _modeDetectorCache;
}

// 🚀 性能优化：UUID 池（预生成，减少启动延迟）
const _uuidPool = [];
function _refillUuidPool() {
  while (_uuidPool.length < 10) {
    _uuidPool.push(randomUUID().replace(/-/g, '').substring(0, 16));
  }
}
function _getUuidFromPool() {
  if (_uuidPool.length === 0) _refillUuidPool();
  return _uuidPool.pop();
}
_refillUuidPool();

export async function handleResearchCommand(context, topic) {
  const startTime = Date.now();
  
  if (!topic || topic.length < 2) {
    return context.reply('⚠️ 请提供需要调研的问题，例如：`/cue 分析宁德时代`');
  }

  // 🚀 快速 API Key 验证
  let apiKey = context.secrets?.CUECUE_API_KEY;
  if (!apiKey) {
    apiKey = getApiKeyFromSecrets('cuecue');
  }
  
  if (!apiKey) {
    return context.reply(buildApiKeyMissingGuide());
  }

  // 🚀 从池中获取 UUID（0ms 延迟）
  const conversationId = _getUuidFromPool();
  const reportUrl = `https://cuecue.cn/c/${conversationId}`;
  
  // 🚀 使用缓存的模式检测器
  const modeDetector = await getModeDetector();
  const mode = modeDetector.detectMode(topic);
  const modeInfo = modeDetector.getModeInfo(mode);

  const taskId = `task_${Date.now()}`;
  
  let workspace;
  try {
    workspace = getUserWorkspace(context);
  } catch (e) {
    console.warn('getUserWorkspace failed, using fallback:', e.message);
    const userId = context.user?.id || context.senderId || 'ou_e06e4737cc3a312bdca573167fdf9258';
    const channel = context.channel || 'feishu';
    workspace = path.join('/root/.openclaw/workspaces', `${channel}-${userId}`, '.cuecue');
  }
  
  const taskPath = path.join(workspace, 'tasks', `${taskId}.json`);

  // 🚀 异步写入任务文件（不阻塞响应）
  const taskData = { taskId, topic, status: 'running', progress: '正在启动...', conversationId, reportUrl, mode, createdAt: new Date().toISOString() };
  fs.ensureDir(path.dirname(taskPath)).then(() => fs.writeJson(taskPath, taskData)).catch(err => console.error('[CueResearch] Task file write failed:', err));

  // 🚀 简化启动通知（减少消息长度，加快发送）
  const launchMsg = `🚀 **研究已启动**
📋 ${topic}
🎯 ${modeInfo.name}
🔗 ${reportUrl}

⏳ 5-30 分钟完成，完成后自动通知`;

  // 🚀 并行执行：启动通知 + 后台研究同时进行
  const launchPromise = context.reply(launchMsg)
    .then(() => console.log('[CueResearch] ✅ Launch message sent'))
    .catch(err => console.error('[CueResearch] ❌ Launch message failed:', err));
  
  const researchPromise = (async () => {
    try {
      await runBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode, taskId, startTime);
    } catch (err) {
      console.error(`[CueResearch] Task failed: ${taskId}`, err);
    }
  })();
  
  Promise.all([launchPromise, researchPromise])
    .catch(err => console.error('[CueResearch] Parallel execution error:', err));

  console.log(`[CueResearch] ⚡ Task started in ${Date.now() - startTime}ms: ${taskId}`);
  return;
}

async function runBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode, taskId, startTime) {
  // startTime 由调用方传入，用于准确计算耗时
  
  // 进度通知状态追踪（基于旧版逻辑）
  const notifyState = {
    lastNotifiedSubtask: null,
    lastNotifiedAt: null
  };
  
  try {
    const reportUrl = `https://cuecue.cn/c/${conversationId}`;
    
    const { report } = await executeResearchStream({
      apiKey,
      topic,
      mode,  // 使用检测到的模式
      conversationId,
      onProgress: async (progress) => {
        // 更新本地存储
        const taskData = await safeReadJson(taskPath) || {};
        taskData.progress = progress.stage || progress.subtask;
        taskData.percent = progress.percent;
        await atomicWriteJson(taskPath, taskData);
        
        // 🔔 进度通知逻辑（基于旧版：每 5 分钟 OR subtask 变化）
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
        const displayMessage = progress.stage || progress.subtask || '';
        
        const shouldNotify = 
          // 条件 1: 有新的 subtask 且与上次不同（立即通知，不受 elapsedMinutes 限制）
          (progress.subtask && displayMessage !== notifyState.lastNotifiedSubtask) ||
          // 条件 2: 每 5 分钟强制推送（跳过 0 分钟，避免与启动通知重复）
          (elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && (!notifyState.lastNotifiedAt || Date.now() - notifyState.lastNotifiedAt > 5 * 60 * 1000));
        
        if (shouldNotify) {
          notifyState.lastNotifiedSubtask = displayMessage;
          notifyState.lastNotifiedAt = Date.now();
          
          const progressText = formatProgressNotification(
            topic,
            elapsedMinutes,
            progress.stage,
            progress.subtask
          );
          await context.reply(progressText);
        }
        
        console.log(`[CueResearch] Progress: ${progress.stage} - ${progress.subtask || progress.stage}`);
      }
    });
    
    // 任务完成
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'completed';
    taskData.reportUrl = reportUrl;
    taskData.report = report;
    taskData.completed_at = new Date().toISOString();
    taskData.percent = 100;
    await atomicWriteJson(taskPath, taskData);

    // 计算耗时
    const durationMinutes = Math.floor((Date.now() - startTime) / 60000);
    
    // 发送完成通知（增强版卡片）
    const completeCard = buildResearchCompleteCard(topic, reportUrl, durationMinutes, mode, report);
    await context.reply(completeCard);
    
    console.log(`[CueResearch] Task completed: ${taskId}`);

  } catch (error) {
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'failed';
    taskData.error = error.message;
    await atomicWriteJson(taskPath, taskData);
    
    // 发送失败通知（用户友好格式）
    const failedText = formatErrorForUser(error, '研究任务', {
      includeSuggestion: true,
      prefix: '❌'
    });
    
    // 如果是可重试错误，添加重试提示
    if (isRetryableError(error)) {
      await context.reply(`${failedText}\n\n🔄 你可以回复 "**重试**" 重新开始任务`);
    } else {
      await context.reply(failedText);
    }
    
    console.error(`[CueResearch] Task failed: ${taskId}`, error);
  }
}

/**
 * 处理 /ct 命令 - 查看任务状态
 * 参考旧版 cuebot taskManager.getTasks() 实现
 */
export async function handleTaskStatus(context) {
  try {
    const workspace = getUserWorkspace(context);
    const tasksDir = path.join(workspace, 'tasks');
    
    // 读取任务目录
    const files = await fs.readdir(tasksDir).catch(() => []);
    if (files.length === 0) {
      return context.reply('📭 暂无研究任务\n\n💡 发送研究问题即可开始，例如：\n   "分析宁德时代竞争优势"');
    }
    
    // 并行读取所有任务
    const tasks = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(tasksDir, file);
        return await safeReadJson(filePath);
      })
    );
    
    // 过滤有效任务并按时间排序
    const validTasks = tasks
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10); // 只显示最近 10 个
    
    // 统计各状态数量
    const stats = {
      running: validTasks.filter(t => t.status === 'running').length,
      completed: validTasks.filter(t => t.status === 'completed').length,
      failed: validTasks.filter(t => t.status === 'failed').length
    };
    
    // 生成响应
    let output = '📊 研究任务列表\n';
    output += `   总计 ${validTasks.length} 个 | 🔄 ${stats.running} 进行中 | ✅ ${stats.completed} 已完成\n\n`;
    
    for (const task of validTasks) {
      const statusIcon = task.status === 'running' ? '🔄' : task.status === 'completed' ? '✅' : '❌';
      const timeAgo = getTimeAgo(new Date(task.createdAt || task.startedAt || Date.now()));
      
      output += `${statusIcon} **${task.topic || '未命名任务'}**\n`;
      output += `   ⏱️ ${timeAgo} | 📊 ${task.progress || '等待中'}\n`;
      
      if (task.status === 'running') {
        output += `   🔗 [查看进度](${task.reportUrl || '#'})\n`;
      } else if (task.status === 'completed') {
        output += `   🔗 [查看报告](${task.reportUrl || '#'})\n`;
      }
      
      output += '\n';
    }
    
    return context.reply(output);
  } catch (error) {
    console.error('[CueResearch] handleTaskStatus error:', error);
    return context.reply(formatErrorForUser(error, '查询任务状态', {
      includeSuggestion: true,
      prefix: '❌'
    }));
  }
}

/**
 * 格式化时间（相对时间）
 * 参考旧版 cuebot 时间格式化逻辑
 */
function getTimeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  
  // 处理无效日期
  if (isNaN(diff) || diff < 0) return '刚刚';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

/**
 * 处理快捷回复关键词
 * 支持：创建监控、Y、追问、状态等
 */
export async function handleQuickReplyCommand(context, text) {
  if (!text) return null;
  
  const textLower = text.toLowerCase().trim();
  
  // 获取最近完成的任务（用于推荐监控）
  const workspace = getUserWorkspace(context);
  const tasksDir = path.join(workspace, 'tasks');
  
  try {
    const files = await fs.readdir(tasksDir).catch(() => []);
    const completedTasks = [];
    
    for (const file of files) {
      const task = await safeReadJson(path.join(tasksDir, file));
      if (task?.status === 'completed') {
        completedTasks.push(task);
      }
    }
    
    // 按完成时间排序，取最新的
    completedTasks.sort((a, b) => 
      new Date(b.completed_at || 0) - new Date(a.completed_at || 0)
    );
    
    const latestTask = completedTasks[0];
    
    // 关键词匹配
    if (['创建监控', '创建', 'y', 'yes', '好', '好的', '开启监控'].includes(textLower)) {
      if (!latestTask) {
        return context.reply('📭 暂无已完成的研究任务\n\n💡 先使用 /cue 开始一个研究吧');
      }
      
      // 创建推荐监控
      const { recommendMonitors } = await import('../utils/monitorTemplates.js');
      const recommendations = recommendMonitors(latestTask.topic, latestTask.mode);
      const topRec = recommendations[0];
      
      if (!topRec) {
        return context.reply('❌ 无法生成推荐监控，请稍后重试');
      }
      
      const monitorId = `mon_${Date.now()}`;
      const monitorsDir = path.join(workspace, 'monitors');
      
      await atomicWriteJson(path.join(monitorsDir, `${monitorId}.json`), {
        monitorId,
        topic: latestTask.topic,
        title: topRec.title,
        category: topRec.category,
        semantic_trigger: topRec.semantic_trigger,
        trigger_keywords: topRec.trigger_keywords,
        frequency_cron: topRec.frequency_cron,
        expected_frequency: topRec.expected_frequency,
        isActive: true,
        created_at: new Date().toISOString(),
        source: 'research_complete_quick_reply'
      });
      
      return context.reply(`✅ 已为您创建监控：**${topRec.title}**\n\n` +
        `• 频率：${topRec.expected_frequency || '2-4 次/月'}\n` +
        `• 触发条件：${topRec.semantic_trigger || '自动检测'}\n\n` +
        `💡 监控激活后会自动推送通知`);
    }
    
    if (['追问', '深入', '继续', 'q'].includes(textLower)) {
      if (!latestTask) {
        return context.reply('📭 暂无已完成的研究任务');
      }
      
      // 生成追问问题
      const { generateFollowUpQuestion } = await import('../utils/notificationHelpers.js');
      const followUpQuestion = generateFollowUpQuestion(latestTask.topic, latestTask.mode, latestTask.report);
      
      return context.reply(`💬 **追问问题**\n\n${followUpQuestion}\n\n` +
        `回复 "**Y**" 或 "**好的**" 开始研究`);
    }
    
    if (['状态', '任务', 'ct', 'status'].includes(textLower)) {
      return await handleTaskStatus(context);
    }
    
    // 无匹配关键词
    return null;
  } catch (error) {
    console.error('[CueResearch] handleQuickReplyCommand error:', error);
    return null;  // 返回 null 让消息继续传递
  }
}

/**
 * 处理 /cancel 命令 - 取消当前任务
 * ⚠️ 技术约束：只能标记本地状态，无法停止服务端
 */
export async function handleCancelCommand(context) {
  const workspace = getUserWorkspace(context);
  const tasksDir = path.join(workspace, 'tasks');
  
  try {
    // 查找运行中的任务
    const files = await fs.readdir(tasksDir).catch(() => []);
    const runningTasks = [];
    
    for (const file of files) {
      const task = await safeReadJson(path.join(tasksDir, file));
      if (task?.status === 'running') {
        runningTasks.push({ file, task });
      }
    }
    
    if (runningTasks.length === 0) {
      return context.reply('📭 当前没有正在进行的任务\n\n💡 使用 /cue <问题> 开始新研究');
    }
    
    // 取消最新任务（标记状态）
    const latest = runningTasks[0];
    latest.task.status = 'cancelled';
    latest.task.cancelled_at = new Date().toISOString();
    const createdAt = latest.task.createdAt || latest.task.startedAt || Date.now();
    const duration = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    await atomicWriteJson(path.join(tasksDir, latest.file), latest.task);
    
    let output = `✅ 已取消任务：${latest.task.topic}\n\n`;
    output += `📋 任务信息：\n`;
    output += `   运行时长：${duration} 分钟\n`;
    output += `   状态：已标记为取消\n\n`;
    output += `⚠️ 提示：服务端可能继续运行，但本地已不再追踪\n\n`;
    output += `💡 现在可以开始新研究了`;
    
    return context.reply(output);
  } catch (error) {
    console.error('[CueResearch] handleCancelCommand error:', error);
    return context.reply(formatErrorForUser(error, '取消任务', {
      includeSuggestion: true,
      prefix: '❌'
    }));
  }
}

export async function handleCardAction(context) {
  const { actionData, reply } = context;
  
  if (!actionData) return;
  
  switch (actionData.action) {
    case 'create_monitor':
      const workspace = getUserWorkspace(context);
      const monitorId = `mon_${Date.now()}`;
      await atomicWriteJson(path.join(workspace, 'monitors', `${monitorId}.json`), {
        monitorId,
        topic: actionData.topic,
        template: actionData.template,
        isActive: true
      });
      return reply(`✅ 已为您开启【${actionData.topic}】的持续监控！`);
      
    case 'follow_up':
      // 追问问题 - 启动新的研究任务
      if (actionData.topic) {
        return await handleResearchCommand(context, actionData.topic);
      }
      return;
      
    case 'view_task_status':
      // 查看任务状态
      return await handleTaskStatus(context);
      
    default:
      return;
  }
}
