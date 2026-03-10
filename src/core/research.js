import path from 'path';
import { getUserWorkspace, atomicWriteJson, safeReadJson } from '../utils/storage.js';
import { executeResearchStream } from '../api/cuecueClient.js';
import { buildResearchCompleteCard, formatProgressMessage } from '../ui/cards.js';

export async function handleResearchCommand(context, topic) {
  if (!topic || topic.length < 2) {
    return context.reply('⚠️ 请提供需要调研的问题，例如：`/cue 分析宁德时代`');
  }

  const apiKey = context.secrets?.CUECUE_API_KEY;
  if (!apiKey) return context.reply('🔑 未配置 CUECUE_API_KEY。');

  const taskId = `task_${Date.now()}`;
  const workspace = getUserWorkspace(context);
  const taskPath = path.join(workspace, 'tasks', `${taskId}.json`);

  await atomicWriteJson(taskPath, { taskId, topic, status: 'running', progress: '正在启动...' });

  // 发送初始进度卡片并获取 messageId
  const initialMsg = await context.reply(formatProgressMessage(topic, 0, '任务初始化'));
  const msgId = initialMsg?.id || null;

  // 放入后台执行，绝不阻塞当前请求
  runBackgroundResearch(context, apiKey, topic, taskPath, msgId).catch(console.error);
}

async function runBackgroundResearch(context, apiKey, topic, taskPath, msgId) {
  try {
    const { reportUrl } = await executeResearchStream(apiKey, topic, async (progress) => {
      // 通过 API 更新进度条卡片
      if (msgId && context.bot?.editMessage) {
        await context.bot.editMessage(msgId, formatProgressMessage(topic, progress.percent, progress.stage));
      }
      
      // 更新本地存储
      const taskData = await safeReadJson(taskPath) || {};
      taskData.progress = progress.stage;
      await atomicWriteJson(taskPath, taskData);
    });
    
    // 任务完成
    const taskData = await safeReadJson(taskPath) || {};
    taskData.status = 'completed';
    taskData.reportUrl = reportUrl;
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
