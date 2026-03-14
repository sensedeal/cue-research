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
  
  // 调用 CueCue API
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const chatId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    
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
      const error = await response.text();
      throw new Error(`API 请求失败：${response.status} ${error}`);
    }
    
    const result = await response.json();
    console.log(`✅ API 响应：${JSON.stringify(result, null, 2)}`);
    
    // 返回结果（供 LLM 使用）
    return {
      success: true,
      taskId,
      topic,
      mode,
      reportUrl,
      estimatedTime: '5-30 分钟',
      message: `研究已启动，完成后会通知您`
    };
    
  } catch (error) {
    console.error(`❌ API 调用失败：${error.message}`);
    
    // 更新任务状态为失败
    taskData.status = 'failed';
    taskData.error = error.message;
    fs.writeJsonSync(taskFile, taskData, { spaces: 2 });
    
    return {
      success: false,
      error: error.message,
      fallbackUrl: reportUrl,
      message: `API 调用失败，但任务已本地记录。您可以直接访问 ${reportUrl} 查看`
    };
  }
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
