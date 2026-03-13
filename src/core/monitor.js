import path from 'path';
import fs from 'fs-extra';
import { getUserWorkspace, safeReadJson, atomicWriteJson } from '../utils/storage.js';
import { searchInternet } from '../utils/search.js';
import { evaluateSmartTrigger } from '../utils/smartTrigger.js';
import { buildMonitorCard } from '../ui/cards.js';

const monitorLocks = new Set();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 查看情报通知历史
 * @param {Object} context - 上下文
 * @param {Array} args - 命令参数 [天数]
 */
export async function handleNotificationCommand(context, args) {
  const days = parseInt(args[0]) || 7; // 默认查询最近 7 天
  const workspace = getUserWorkspace(context);
  const notifDir = path.join(workspace, 'notifications');

  try {
    const files = await fs.readdir(notifDir).catch(() => []);
    if (files.length === 0) {
      return context.reply('📭 暂无历史监控通知记录。');
    }

    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const notifications = [];

    // 异步安全读取
    for (const file of files) {
      const data = await safeReadJson(path.join(notifDir, file));
      if (data && data.triggeredAt >= cutoff) {
        notifications.push(data);
      }
    }

    if (notifications.length === 0) {
      return context.reply(`📭 最近 ${days} 天内无新的触发通知。`);
    }

    // 按时间倒序，最多显示最近 10 条
    notifications.sort((a, b) => b.triggeredAt - a.triggeredAt);
    const recent = notifications.slice(0, 10);

    const msgs = [`🔔 **最近 ${days} 天的情报推送 (共 ${notifications.length} 条)**\n`];
    for (const n of recent) {
      const dateStr = new Date(n.triggeredAt).toLocaleString('zh-CN', { 
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
      });
      msgs.push(`**[${n.topic}]** ${n.title}\n⏱️ ${dateStr} | 🔗 [查看原文](${n.url})\n`);
    }

    return context.reply(msgs.join('\n'));
  } catch (e) {
    console.error(`[Monitor] CN Command Error:`, e);
    return context.reply('❌ 查询通知记录失败。');
  }
}

export async function handleMonitorCommand(context, args) {
  const workspace = getUserWorkspace(context);
  const monitorsDir = path.join(workspace, 'monitors');
  
  if (args[0] === 'add') {
    const topic = args.slice(1).join(' ');
    const monitorId = `mon_${Date.now()}`;
    await atomicWriteJson(path.join(monitorsDir, `${monitorId}.json`), { monitorId, topic, isActive: true });
    return context.reply(`✅ 成功添加监控：${topic}`);
  }
  
  try {
    const files = await fs.readdir(monitorsDir);
    const msgs = ['🔔 **您的监控列表**'];
    for (const file of files) {
      const data = await safeReadJson(path.join(monitorsDir, file));
      if (data?.isActive) msgs.push(`• ${data.topic}`);
    }
    return context.reply(msgs.join('\n'));
  } catch (e) {
    return context.reply('📭 暂无活跃监控。');
  }
}

export async function runMonitorCheck(context) {
  const userId = context.user?.id;
  if (!userId || monitorLocks.has(userId)) return; // 防并发雪崩锁
  
  monitorLocks.add(userId);
  try {
    const workspace = getUserWorkspace(context);
    const monitorsDir = path.join(workspace, 'monitors');
    const files = await fs.readdir(monitorsDir).catch(() => []);
    
    for (const file of files) {
      const monitorPath = path.join(monitorsDir, file);
      const monitor = await safeReadJson(monitorPath);
      if (!monitor?.isActive) continue;

      const searchRes = await searchInternet(monitor.topic, context.secrets);
      
      // 使用纯 NLP 智能触发器 (无大模型，速度极快)
      const evaluation = evaluateSmartTrigger(monitor.topic, searchRes.content);
      
      if (evaluation.shouldTrigger && searchRes.results.length > 0) {
        const topNews = searchRes.results[0];
        
        // 1. 发送通知卡片
        if (context.bot && context.bot.sendMessage) {
          await context.bot.sendMessage({
            target: userId,
            channel: context.channel,
            message: buildMonitorCard(monitor.topic, topNews)
          });
        }
        
        // 2. 更新监控最后触发时间
        monitor.lastTriggeredAt = Date.now();
        await atomicWriteJson(monitorPath, monitor);

        // 3. 将触发记录存入 notifications 目录，供 /cn 查询
        const notifId = `notif_${Date.now()}`;
        const notifPath = path.join(workspace, 'notifications', `${notifId}.json`);
        await atomicWriteJson(notifPath, {
          id: notifId,
          monitorId: monitor.monitorId,
          topic: monitor.topic,
          title: topNews.title || "发现新动态",
          url: topNews.url || "",
          triggeredAt: Date.now()
        });
      }
      
      await sleep(1500); // 必须休眠防 QPS 封号
    }
  } catch (error) {
    console.error(`[Monitor] Error for user ${userId}:`, error.message);
  } finally {
    monitorLocks.delete(userId);
  }
}
