/**
 * Cue Research - 优化版启动流程
 * 优化目标：从用户发送到启动通知 < 1 秒
 */

import path from 'path';
import fs from 'fs-extra';
import { getUserWorkspace, atomicWriteJson, safeReadJson } from '../utils/storage.js';
import { executeResearchStream } from '../api/cuecueClient.js';
import { buildResearchCompleteCard, formatProgressNotification } from '../ui/cards.js';
import { buildApiKeyMissingGuide, getApiKeyFromSecrets } from './keyManager.js';
import { getModeName, formatResearchFailed } from '../utils/notificationHelpers.js';
import { formatErrorForUser, isRetryableError } from '../utils/errorHandler.js';
import { randomUUID } from 'crypto';

// 🚀 优化 1：缓存模式检测器，避免重复 import
let _modeDetectorCache = null;
async function getModeDetector() {
  if (!_modeDetectorCache) {
    _modeDetectorCache = await import('./modeDetector.js');
  }
  return _modeDetectorCache;
}

// 🚀 优化 2：预生成 UUID 池（减少启动时的随机数生成延迟）
const uuidPool = [];
function refillUuidPool() {
  while (uuidPool.length < 10) {
    uuidPool.push(randomUUID().replace(/-/g, '').substring(0, 16));
  }
}
function getUuidFromPool() {
  if (uuidPool.length === 0) refillUuidPool();
  return uuidPool.pop();
}
// 初始化 UUID 池
refillUuidPool();

/**
 * 🚀 优化版 handleResearchCommand
 * 优化点：
 * 1. 并行执行：启动通知 + API 调用同时进行
 * 2. 预生成 conversationId，减少等待
 * 3. 简化启动通知内容
 * 4. 异步文件写入，不阻塞响应
 */
export async function handleResearchCommand(context, topic) {
  const startTime = Date.now();
  
  if (!topic || topic.length < 2) {
    return context.reply('⚠️ 请提供需要调研的问题，例如：`/cue 分析宁德时代`');
  }

  // 🚀 优化 3：快速 API Key 验证（优先 context.secrets，避免文件读取）
  let apiKey = context.secrets?.CUECUE_API_KEY;
  if (!apiKey) {
    apiKey = getApiKeyFromSecrets('cuecue');
  }
  
  if (!apiKey) {
    return context.reply(buildApiKeyMissingGuide());
  }

  // 🚀 优化 4：从池中获取 UUID（0ms 延迟）
  const conversationId = getUuidFromPool();
  const reportUrl = `https://cuecue.cn/c/${conversationId}`;
  
  // 🚀 优化 5：快速模式检测（使用缓存）
  const modeDetector = await getModeDetector();
  const mode = modeDetector.detectMode(topic);
  const modeInfo = modeDetector.getModeInfo(mode);

  const taskId = `task_${Date.now()}`;
  
  // 降级方案：如果 getUserWorkspace 失败，使用固定路径
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

  // 🚀 优化 6：异步写入任务文件（不阻塞启动通知）
  const taskData = { taskId, topic, status: 'running', progress: '正在启动...', conversationId, reportUrl, mode, createdAt: new Date().toISOString() };
  
  // 异步写入，不等待完成
  fs.ensureDir(path.dirname(taskPath))
    .then(() => fs.writeJson(taskPath, taskData))
    .catch(err => console.error('[CueResearch] Failed to write task file:', err));

  // 🚀 优化 7：简化启动通知（减少消息长度，加快发送速度）
  const launchMessage = `🚀 **研究已启动**
📋 ${topic}
🎯 ${modeInfo.name}
🔗 ${reportUrl}

⏳ 5-30 分钟完成，完成后自动通知`;

  // 🚀 优化 8：并行执行 - 启动通知和后台研究同时进行
  Promise.all([
    // 任务 1：发送启动通知（用户立即看到响应）
    context.reply(launchMessage).catch(err => console.error('[CueResearch] Failed to send launch message:', err)),
    
    // 任务 2：立即开始后台研究（不等待通知发送完成）
    (async () => {
      try {
        await runBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode, taskId, startTime);
      } catch (err) {
        console.error(`[CueResearch] Task failed: ${taskId}`, err);
      }
    })()
  ]);

  console.log(`[CueResearch] ⚡ Task started in ${Date.now() - startTime}ms: ${taskId}`);
  
  // 立即返回，不等待任何操作完成
  return;
}

async function runBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode, taskId, startTime) {
  const reportUrl = `https://cuecue.cn/c/${conversationId}`;
  
  // 进度通知状态追踪
  const notifyState = {
    lastNotifiedSubtask: null,
    lastNotifiedAt: null
  };
  
  try {
    const { report } = await executeResearchStream({
      apiKey,
      topic,
      mode,
      conversationId,
      onProgress: async (progress) => {
        // 更新本地存储（异步，不阻塞）
        const taskData = await safeReadJson(taskPath) || {};
        taskData.progress = progress.stage || progress.subtask;
        taskData.percent = progress.percent;
        fs.writeJson(taskPath, taskData).catch(() => {});
        
        // 进度通知逻辑
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
        const displayMessage = progress.stage || progress.subtask || '';
        
        const shouldNotify = 
          (progress.subtask && displayMessage !== notifyState.lastNotifiedSubtask) ||
          (elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && (!notifyState.lastNotifiedAt || Date.now() - notifyState.lastNotifiedAt > 5 * 60 * 1000));
        
        if (shouldNotify) {
          notifyState.lastNotifiedSubtask = displayMessage;
          notifyState.lastNotifiedAt = Date.now();
          
          const progressText = formatProgressNotification(topic, elapsedMinutes, progress.stage, progress.subtask);
          await context.reply(progressText).catch(() => {});
        }
      }
    });
    
    // 任务完成
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'completed';
    taskData.reportUrl = reportUrl;
    taskData.report = report;
    taskData.completed_at = new Date().toISOString();
    taskData.percent = 100;
    fs.writeJson(taskPath, taskData).catch(() => {});

    const durationMinutes = Math.floor((Date.now() - startTime) / 60000);
    const completeCard = buildResearchCompleteCard(topic, reportUrl, durationMinutes, mode, report);
    await context.reply(completeCard).catch(() => {});
    
    console.log(`[CueResearch] ✅ Task completed: ${taskId} (${durationMinutes}min)`);

  } catch (error) {
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'failed';
    taskData.error = error.message;
    fs.writeJson(taskPath, taskData).catch(() => {});
    
    const failedText = formatErrorForUser(error, '研究任务', { includeSuggestion: true, prefix: '❌' });
    if (isRetryableError(error)) {
      await context.reply(`${failedText}\n\n🔄 你可以回复 "**重试**" 重新开始任务`).catch(() => {});
    } else {
      await context.reply(failedText).catch(() => {});
    }
    
    console.error(`[CueResearch] ❌ Task failed: ${taskId}`, error);
  }
}

// 导出其他函数（保持不变）
export { handleTaskStatus, handleCancelCommand, handleCardAction, handleQuickReplyCommand } from './research.js';
