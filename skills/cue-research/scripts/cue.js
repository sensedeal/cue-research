#!/usr/bin/env node
/**
 * Cue Research - 任务启动脚本
 * 
 * 用法：node scripts/cue.js "研究主题"
 * 
 * 功能：
 * 1. 调用 CueCue API 启动研究任务
 * 2. 保存任务状态到本地
 * 3. 返回报告链接（供 LLM 展示给用户）
 */

import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');

// 配置
const CUECUE_API_BASE = 'https://cuecue.cn/api';
const SECRETS_FILE = path.join(SKILL_ROOT, 'secrets.json');
const WORKSPACE_BASE = '/root/.openclaw/workspaces';

/**
 * 读取 API Key
 */
function getApiKey() {
  try {
    const secrets = fs.readJsonSync(SECRETS_FILE);
    return secrets.CUECUE_API_KEY;
  } catch (e) {
    console.error('❌ 无法读取 API Key，请确保 secrets.json 存在');
    process.exit(1);
  }
}

/**
 * 获取用户工作区
 */
function getWorkspace(channel = 'feishu', userId = 'default') {
  const workspacePath = path.join(WORKSPACE_BASE, `${channel}-${userId}`, '.cuecue');
  fs.ensureDirSync(workspacePath);
  fs.ensureDirSync(path.join(workspacePath, 'tasks'));
  return workspacePath;
}

/**
 * 发送飞书进度通知
 * 格式参考原版 buildProgressCardFeishu
 */
async function sendProgressNotification(userId, topic, elapsedMinutes, displayStage, reportUrl) {
  const message = `🔔 **研究进度更新**

📋 ${topic}
⏱️ 已用时：${elapsedMinutes} 分钟
📊 当前阶段：${displayStage}

预计剩余时间：${Math.max(1, 30 - elapsedMinutes)} 分钟

🔗 [查看进度](${reportUrl})`;

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`openclaw message send --target "user:${userId}" --message '${message.replace(/'/g, "'\"'\"'")}'`);
    console.log(`✅ 进度通知已发送`);
  } catch (e) {
    console.error(`❌ 发送进度通知失败：${e.message}`);
  }
}

/**
 * 发送飞书完成通知
 * 格式参考原版 buildResearchCompleteCardText
 */
async function sendCompleteNotification(userId, topic, durationMin, mode, reportUrl, reportContent) {
  const modeNames = {
    'trader': '短线交易',
    'investor': '基本面分析',
    'researcher': '产业研究',
    'advisor': '资产配置',
    'macro': '宏观分析',
    'auto': '智能分析',
    'default': '默认'
  };
  const modeName = modeNames[mode] || modeNames.default;
  const timestamp = new Date().toLocaleString('zh-CN');
  
  // 清理报告摘要（参考原版逻辑）
  let summary = reportContent;
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
  
  // 构建通知内容（参考原版 buildResearchCompleteCardText）
  let message = `✅ **研究完成通知**\n\n`;
  message += `**🎯 核心结论**\n`;
  message += `${topic}研究已完成。\n\n`;
  
  if (summary) {
    message += `**📝 核心摘要**\n${summary}\n\n`;
  }
  
  message += `🕐 ${timestamp}  ⏱️ ${durationMin} 分钟  🎯 ${modeName}\n\n`;
  message += `🔗 [查看完整报告](${reportUrl})\n\n`;
  message += `**快捷回复**：\n`;
  message += `• 回复 "**创建监控**" 或 "**Y**" 开启推荐监控\n`;
  message += `• 回复 "**追问**" 深入调研\n`;
  message += `• 回复 "**状态**" 查看任务列表`;

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`openclaw message send --target "user:${userId}" --message '${message.replace(/'/g, "'\"'\"'")}'`);
    console.log(`✅ 完成通知已发送`);
  } catch (e) {
    console.error(`❌ 发送完成通知失败：${e.message}`);
  }
}

/**
 * 发送飞书启动通知
 */
async function sendFeishuNotification(userId, topic, mode, reportUrl) {
  const modeNames = {
    'trader': '短线交易',
    'investor': '基本面分析',
    'researcher': '产业研究',
    'advisor': '资产配置',
    'macro': '宏观分析',
    'auto': '智能分析'
  };
  
  const modeName = modeNames[mode] || mode;
  
  const message = `🚀 **研究已启动**

📋 ${topic}
🎯 ${modeName} 模式
⏳ 预计：5-30 分钟

🔗 [查看进度](${reportUrl})

完成后会主动通知您！`;

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`openclaw message send --target "user:${userId}" --message '${message.replace(/'/g, "'\"'\"'")}'`);
    console.log(`✅ 飞书通知已发送至 ${userId}`);
  } catch (e) {
    console.error(`❌ 发送飞书通知失败：${e.message}`);
  }
}

/**
 * 检测研究模式
 */
function detectMode(topic) {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('买') || topicLower.includes('卖') || topicLower.includes('涨停') || topicLower.includes('龙虎榜')) {
    return 'trader';
  }
  if (topicLower.includes('财报') || topicLower.includes('估值') || topicLower.includes('PE') || topicLower.includes('PB')) {
    return 'investor';
  }
  if (topicLower.includes('产业链') || topicLower.includes('竞争') || topicLower.includes('赛道')) {
    return 'researcher';
  }
  if (topicLower.includes('理财') || topicLower.includes('配置') || topicLower.includes('风险')) {
    return 'advisor';
  }
  if (topicLower.includes('GDP') || topicLower.includes('CPI') || topicLower.includes('政策')) {
    return 'macro';
  }
  
  return 'auto';
}

/**
 * 启动研究任务
 */
async function startResearch(topic, channel = 'feishu', userId = 'default') {
  const apiKey = getApiKey();
  const mode = detectMode(topic);
  const workspace = getWorkspace(channel, userId);
  
  // 生成任务 ID
  const taskId = `task_${Date.now()}`;
  const conversationId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const reportUrl = `https://cuecue.cn/c/${conversationId}`;
  
  console.log(`🚀 启动研究任务：${topic}`);
  console.log(`   模式：${mode}`);
  console.log(`   任务 ID: ${taskId}`);
  
  // 保存任务状态
  const taskFile = path.join(workspace, 'tasks', `${taskId}.json`);
  const taskData = {
    taskId,
    topic,
    mode,
    conversationId,
    reportUrl,
    status: 'running',
    progress: '正在启动...',
    createdAt: new Date().toISOString(),
    channel,
    userId
  };
  
  fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
  console.log(`✅ 任务状态已保存：${taskFile}`);
  
  // 异步调用 CueCue API + 解析流式响应（不阻塞主流程）
  (async () => {
    try {
      const { randomUUID } = await import('crypto');
      const messageId = `msg_${randomUUID().replace(/-/g, '')}`;
      const chatId = randomUUID().replace(/-/g, '');
      
      console.log(`📡 调用 CueCue API...`);
      
      const response = await fetch(`${CUECUE_API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: topic, id: messageId, type: 'text' }],
          chat_id: chatId,
          conversation_id: conversationId,
          need_confirm: false,
          need_analysis: false,
          need_underlying: false,
          need_recommend: false,
          verbose: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 失败：${response.status} - ${errorText.substring(0, 200)}`);
      }
      
      console.log(`✅ API 连接成功：${response.status}`);
      taskData.status = 'running';
      taskData.apiCalled = true;
      fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
      
      // 发送飞书启动通知
      await sendFeishuNotification(userId, topic, mode, reportUrl);
      
      // 解析 SSE 流式响应（Node.js 方式）
      console.log(`📡 开始解析流式响应...`);
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let reportContent = '';
      const notifyState = {
        lastNotifiedSubtask: null,
        lastNotifiedAt: null
      };
      const startTime = Date.now();
      
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const event = JSON.parse(dataStr);
              
              // 解析进度信息
              const percent = event.percent || 0;
              const stage = event.stage || '';
              const subtask = event.subtask || event.agent_name || '';
              
              // 累积报告内容（用于完成通知摘要）
              if (event.delta?.content) {
                reportContent += event.delta.content.replace(/【\d+-\d+】/g, '');
              }
              
              // 更新任务状态
              taskData.progress = subtask || stage;
              taskData.percent = percent;
              if (subtask) taskData.lastSubtask = subtask;
              fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
              
              // 🔔 进度通知逻辑（基于旧版：每 5 分钟 OR subtask 变化）
              const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
              const displayStage = subtask || stage || '';
              
              const shouldNotify = 
                // 条件 1: 有新的 subtask 且与上次不同（立即通知，不受 elapsedMinutes 限制）
                (subtask && displayStage !== notifyState.lastNotifiedSubtask) ||
                // 条件 2: 每 5 分钟强制推送（跳过 0 分钟，避免与启动通知重复）
                (elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && 
                 (!notifyState.lastNotifiedAt || Date.now() - notifyState.lastNotifiedAt > 5 * 60 * 1000));
              
              if (shouldNotify) {
                notifyState.lastNotifiedSubtask = displayStage;
                notifyState.lastNotifiedAt = new Date().toISOString();
                
                console.log(`📊 进度通知：${displayStage} (${percent}%)`);
                await sendProgressNotification(userId, topic, elapsedMinutes, displayStage, reportUrl);
              }
              
              // 检查是否完成
              if (event.status === 'completed' || percent >= 100 || event.conversation_status === 'finished') {
                console.log(`✅ 研究完成！`);
                taskData.status = 'completed';
                taskData.completedAt = new Date().toISOString();
                taskData.percent = 100;
                fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
                
                const durationMin = Math.floor((Date.now() - startTime) / 60000);
                await sendCompleteNotification(userId, topic, durationMin, mode, reportUrl, reportContent);
                return;
              }
              
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      console.log(`✅ 流式响应结束`);
      
    } catch (error) {
      console.error(`❌ API 异常：${error.message}`);
      taskData.status = 'api_error';
      taskData.apiError = error.message;
      fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
    }
  })();
  
  // 立即返回（不等待 API 响应）
  return {
    success: true,
    taskId,
    topic,
    mode,
    reportUrl,
    estimatedTime: '5-30 分钟',
    message: `研究已启动，完成后会通知您`
  };
}

// 主函数
async function main() {
  const topic = process.argv[2];
  const channel = process.argv[3] || 'feishu';
  const userId = process.argv[4] || 'default';
  
  if (!topic) {
    console.error('用法：node cue.js "研究主题" [channel] [userId]');
    console.error('示例：node cue.js "ETF 市场周报" feishu ou_xxx');
    process.exit(1);
  }
  
  const result = await startResearch(topic, channel, userId);
  
  // 输出 JSON 结果（供 LLM 解析）
  console.log('\n--- RESULT JSON ---');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('❌ 未捕获错误:', err);
  process.exit(1);
});
