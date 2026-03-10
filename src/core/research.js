import path from 'path';
import { getUserWorkspace, atomicWriteJson, safeReadJson } from '../utils/storage.js';
import { executeResearchStream } from '../api/cuecueClient.js';
import { buildResearchCompleteCard, formatProgressMessage } from '../ui/cards.js';
import { buildApiKeyMissingGuide, getApiKeyFromSecrets } from './keyManager.js';
import { randomUUID } from 'crypto';

export async function handleResearchCommand(context, topic) {
  try {
    if (!topic || topic.length < 2) {
      return context.reply('⚠️ 请提供需要调研的问题，例如：`/cue 分析宁德时代`');
    }

    // 优先从 context.secrets 读取，其次从 secrets.json 读取
    let apiKey = context.secrets?.CUECUE_API_KEY;
    if (!apiKey) {
      apiKey = getApiKeyFromSecrets('cuecue');
    }
    
    if (!apiKey) {
      return context.reply(buildApiKeyMissingGuide());
    }

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

  // 生成 conversationId（16 位无横杠 UUID，参考旧版 cuebot）
  const conversationId = randomUUID().replace(/-/g, '').substring(0, 16);
  const reportUrl = `https://cuecue.cn/c/${conversationId}`;

  // 自动检测研究模式
  const { detectMode, getModeInfo } = await import('./modeDetector.js');
  const mode = detectMode(topic);
  const modeInfo = getModeInfo(mode);

  await atomicWriteJson(taskPath, { taskId, topic, status: 'running', progress: '正在启动...', conversationId, reportUrl, mode });

  // 发送启动通知（显示检测到的模式）
  await context.reply(`🚀 **研究任务已启动**

📋 主题：${topic}
🎯 视角：${modeInfo.name}
🔗 链接：${reportUrl}

⏳ 预计耗时：5-30 分钟
🔔 完成后会自动通知你~`);

  console.log(`[CueResearch] Task started: ${taskId}, workspace: ${workspace}`);
  
  // 放入后台执行，绝不阻塞当前请求
  runBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode)
    .then(() => console.log(`[CueResearch] Task completed: ${taskId}`))
    .catch(err => console.error(`[CueResearch] Task failed: ${taskId}`, err));
}

async function runBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode) {
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
      }
    });
    
    // 任务完成
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'completed';
    taskData.reportUrl = reportUrl;
    taskData.report = report;
    await atomicWriteJson(taskPath, taskData);

    // 发送报告卡片 (包含智能推荐监控按钮)
    await context.reply(buildResearchCompleteCard(topic, reportUrl, 15));

  } catch (error) {
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'failed';
    await atomicWriteJson(taskPath, taskData);
    
    if (msgId && context.bot?.editMessage) {
      await context.bot.editMessage(msgId, `❌ **研究任务失败：${topic}**\n原因：${error.message}`);
    } else {
      await context.reply(`❌ **研究任务失败：${topic}**\n原因：${error.message}`);
    }
  }
}

export async function handleTaskStatus(context) {
  return context.reply('📊 任务状态查询功能正常，具体数据接入存储层即可。');
}

export async function handleCardAction(context) {
  const { actionData, reply } = context;
  if (actionData.action === 'create_monitor') {
    const workspace = getUserWorkspace(context);
    const monitorId = `mon_${Date.now()}`;
    await atomicWriteJson(path.join(workspace, 'monitors', `${monitorId}.json`), {
      monitorId,
      topic: actionData.topic,
      template: actionData.template,
      isActive: true
    });
    return reply(`✅ 已为您开启【${actionData.topic}】的持续监控！`);
  }
}
