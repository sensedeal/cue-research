#!/usr/bin/env node
/**
 * Cue Research - 监控轮询脚本
 * 
 * 用法：node scripts/cue-monitor.js
 * 
 * 功能：
 * 1. 扫描所有进行中的任务
 * 2. 查询 CueCue API 获取最新进度
 * 3. 有变化则发送通知（通过 message 工具）
 * 4. 任务完成后发送完成通知
 * 
 * 建议配置：cron 每 5 分钟运行一次
 */

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');
const execAsync = promisify(exec);

// 配置
const CUECUE_API_BASE = 'https://api.cuecue.cn/v1';
const SECRETS_FILE = path.join(SKILL_ROOT, 'secrets.json');
const WORKSPACE_BASE = '/root/.openclaw/workspaces';
const PROGRESS_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟

/**
 * 读取 API Key
 */
function getApiKey() {
  try {
    const secrets = fs.readJsonSync(SECRETS_FILE);
    return secrets.CUECUE_API_KEY;
  } catch (e) {
    console.error('❌ 无法读取 API Key');
    return null;
  }
}

/**
 * 获取所有工作区的任务
 */
function getAllTasks() {
  const tasks = [];
  
  try {
    const workspaces = fs.readdirSync(WORKSPACE_BASE);
    
    for (const workspace of workspaces) {
      const tasksDir = path.join(WORKSPACE_BASE, workspace, '.cuecue', 'tasks');
      if (!fs.existsSync(tasksDir)) continue;
      
      const files = fs.readdirSync(tasksDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const taskFile = path.join(tasksDir, file);
        const task = fs.readJsonSync(taskFile);
        
        if (task.status === 'running') {
          tasks.push({
            ...task,
            taskFile,
            workspace
          });
        }
      }
    }
  } catch (e) {
    console.error('读取任务失败:', e.message);
  }
  
  return tasks;
}

/**
 * 查询任务进度
 */
async function getTaskProgress(conversationId, apiKey) {
  try {
    const response = await fetch(`${CUECUE_API_BASE}/research/${conversationId}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (e) {
    console.error(`查询进度失败 ${conversationId}:`, e.message);
    return null;
  }
}

/**
 * 发送飞书消息
 */
async function sendFeishuMessage(userId, message, cardData = null) {
  try {
    const cmd = cardData
      ? `openclaw message send --target "user:${userId}" --message '${message.replace(/'/g, "'\"'\"'")}'`
      : `openclaw message send --target "user:${userId}" --message '${message.replace(/'/g, "'\"'\"'")}'`;
    
    await execAsync(cmd);
    console.log(`✅ 消息已发送至 ${userId}`);
  } catch (e) {
    console.error(`发送消息失败 ${userId}:`, e.message);
  }
}

/**
 * 构建进度通知消息
 */
function buildProgressMessage(task, progress) {
  const elapsedMin = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 60000);
  const stage = progress?.stage || task.progress || '研究中...';
  const percent = progress?.percent || task.percent || 0;
  
  const progressBar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
  
  return `🔔 **研究进度更新**

📋 ${task.topic}
⏱️ 已用时：${elapsedMin} 分钟
📊 ${progressBar} ${percent}%
📍 当前阶段：${stage}

预计剩余：${Math.max(1, 30 - elapsedMin)} 分钟
🔗 [查看进度](${task.reportUrl})`;
}

/**
 * 构建完成通知消息
 */
function buildCompleteMessage(task, durationMin) {
  return `✅ **研究完成！**

📋 ${task.topic}
⏱️ 总耗时：${durationMin} 分钟
🎯 模式：${task.mode}

🔗 [查看完整报告](${task.reportUrl})

💡 **快捷操作**：
• 回复 "创建监控" 开启持续监控
• 回复 "追问" 生成深入问题
• 回复 "状态" 查看任务列表`;
}

/**
 * 处理单个任务
 */
async function processTask(task, apiKey) {
  const progress = await getTaskProgress(task.conversationId, apiKey);
  
  if (!progress) {
    console.log(`⚠️ 无法获取进度：${task.taskId}`);
    return;
  }
  
  const now = Date.now();
  const lastNotifiedAt = task.lastNotifiedAt ? new Date(task.lastNotifiedAt).getTime() : 0;
  const shouldNotify = 
    // 子任务变化
    (progress.subtask && progress.subtask !== task.lastSubtask) ||
    // 每 5 分钟强制通知
    (now - lastNotifiedAt >= PROGRESS_INTERVAL_MS);
  
  if (shouldNotify) {
    console.log(`📢 发送进度通知：${task.taskId}`);
    const message = buildProgressMessage(task, progress);
    await sendFeishuMessage(task.userId, message);
    
    // 更新任务状态
    task.lastSubtask = progress.subtask;
    task.lastNotifiedAt = new Date().toISOString();
    task.progress = progress.stage || task.progress;
    task.percent = progress.percent || task.percent;
    fs.writeJsonSync(task.taskFile, task, { spaces: 2 });
  }
  
  // 检查是否完成
  if (progress.status === 'completed' && task.status !== 'completed') {
    console.log(`✅ 任务完成：${task.taskId}`);
    const durationMin = Math.floor((now - new Date(task.createdAt).getTime()) / 60000);
    const message = buildCompleteMessage(task, durationMin);
    await sendFeishuMessage(task.userId, message);
    
    // 更新任务状态
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    fs.writeJsonSync(task.taskFile, task, { spaces: 2 });
  }
  
  // 检查是否失败
  if (progress.status === 'failed' && task.status !== 'failed') {
    console.log(`❌ 任务失败：${task.taskId}`);
    const message = `❌ **研究失败**

📋 ${task.topic}
原因：${progress.error || '未知错误'}

🔗 [查看进度](${task.reportUrl})

💡 建议：
• 检查研究主题是否明确
• 回复 "重试" 重新开始`;
    
    await sendFeishuMessage(task.userId, message);
    
    task.status = 'failed';
    task.error = progress.error;
    fs.writeJsonSync(task.taskFile, task, { spaces: 2 });
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 Cue Research Monitor - 开始轮询');
  console.log(`时间：${new Date().toISOString()}`);
  
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ 缺少 API Key，退出');
    process.exit(1);
  }
  
  const tasks = getAllTasks();
  console.log(`📊 发现 ${tasks.length} 个进行中的任务`);
  
  if (tasks.length === 0) {
    console.log('✅ 无进行中的任务，退出');
    return;
  }
  
  for (const task of tasks) {
    try {
      await processTask(task, apiKey);
      // 避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`处理任务失败 ${task.taskId}:`, e.message);
    }
  }
  
  console.log('✅ 轮询完成');
}

main().catch(err => {
  console.error('❌ 未捕获错误:', err);
  process.exit(1);
});
