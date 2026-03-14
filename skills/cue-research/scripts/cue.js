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
 */
async function sendProgressNotification(userId, topic, percent, stage, reportUrl) {
  const progressBar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
  
  const message = `🔔 **研究进度更新**

📋 ${topic}
📊 ${progressBar} ${percent}%
📍 当前阶段：${stage}

🔗 [查看进度](${reportUrl})`;

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`openclaw message send --target "user:${userId}" --message '${message.replace(/'/g, "'\"'\"'")}'`);
    console.log(`✅ 进度通知已发送：${percent}%`);
  } catch (e) {
    console.error(`❌ 发送进度通知失败：${e.message}`);
  }
}

/**
 * 发送飞书完成通知
 */
async function sendCompleteNotification(userId, topic, durationMin, reportUrl) {
  const message = `✅ **研究完成！**

📋 ${topic}
⏱️ 总耗时：${durationMin} 分钟

🔗 [查看完整报告](${reportUrl})

💡 **快捷操作**：
• 回复 "创建监控" 开启持续监控
• 回复 "追问" 生成深入问题`;

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
      
      // 解析 SSE 流式响应
      console.log(`📡 开始解析流式响应...`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let lastSubtask = '';
      let lastPercent = 0;
      const startTime = Date.now();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`✅ 流式响应结束`);
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const event = JSON.parse(dataStr);
              
              // 解析进度信息
              const percent = event.percent || lastPercent;
              const stage = event.stage || '';
              const subtask = event.subtask || event.agent_name || lastSubtask;
              
              if (subtask && subtask !== lastSubtask) {
                console.log(`📊 进度更新：${subtask} (${percent}%)`);
                lastSubtask = subtask;
                lastPercent = percent;
                
                // 更新任务状态
                taskData.progress = stage || subtask;
                taskData.percent = percent;
                taskData.lastSubtask = subtask;
                fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
                
                // 发送进度通知（子任务变化时）
                await sendProgressNotification(userId, topic, percent, stage || subtask, reportUrl);
              }
              
              // 检查是否完成
              if (event.status === 'completed' || percent >= 100) {
                console.log(`✅ 研究完成！`);
                taskData.status = 'completed';
                taskData.completedAt = new Date().toISOString();
                taskData.percent = 100;
                fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
                
                const durationMin = Math.floor((Date.now() - startTime) / 60000);
                await sendCompleteNotification(userId, topic, durationMin, reportUrl);
                return;
              }
              
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
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
