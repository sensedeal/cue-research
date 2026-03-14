/**
 * 错误监控脚本
 * 每 5 分钟检查错误率，超过阈值自动告警
 */

import fs from 'fs-extra';
import path from 'path';

const LOG_DIR = '/root/.openclaw/logs/cue-research';
const ERROR_THRESHOLD = 0.05; // 5% 错误率

/**
 * 分析最近 5 分钟的日志
 */
export async function analyzeRecentErrors() {
  console.log('🔍 开始错误率分析...\n');
  
  try {
    // 读取日志文件
    const logFile = path.join(LOG_DIR, 'error.log');
    if (!await fs.pathExists(logFile)) {
      console.log('✅ 无错误日志');
      return { success: true, errorRate: 0 };
    }
    
    const content = await fs.readFile(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    // 过滤最近 5 分钟的错误
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentErrors = lines.filter(line => {
      const timestamp = extractTimestamp(line);
      return timestamp >= fiveMinutesAgo;
    });
    
    const errorRate = recentErrors.length / Math.max(lines.length, 1);
    
    console.log('📊 错误率分析结果:');
    console.log('  总请求数:', lines.length);
    console.log('  错误数:', recentErrors.length);
    console.log('  错误率:', (errorRate * 100).toFixed(2) + '%');
    console.log('  阈值:', (ERROR_THRESHOLD * 100).toFixed(2) + '%\n');
    
    if (errorRate > ERROR_THRESHOLD) {
      console.log('❌ 错误率超过阈值！需要告警');
      await sendAlert(errorRate, recentErrors);
      return { success: false, errorRate };
    } else {
      console.log('✅ 错误率在正常范围内');
      return { success: true, errorRate };
    }
    
  } catch (error) {
    console.error('❌ 错误分析失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 提取时间戳
 */
function extractTimestamp(line) {
  const match = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
  if (match) {
    return new Date(match[1]).getTime();
  }
  return Date.now();
}

/**
 * 发送告警
 */
async function sendAlert(errorRate, errors) {
  console.log('\n🚨 发送告警...\n');
  
  const alertMessage = `
🚨 **Cue Research 错误率告警**

错误率：${(errorRate * 100).toFixed(2)}%
阈值：${(ERROR_THRESHOLD * 100).toFixed(2)}%
时间：${new Date().toLocaleString('zh-CN')}

最近错误:
${errors.slice(0, 5).map(e => `- ${e}`).join('\n')}

请立即检查！
  `.trim();
  
  console.log(alertMessage);
  
  // TODO: 发送到飞书/钉钉/邮件
  // await sendNotification(alertMessage);
  
  return alertMessage;
}

/**
 * 主函数
 */
export async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  🔍 错误监控检查');
  console.log('═══════════════════════════════════════════\n');
  
  const result = await analyzeRecentErrors();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  检查完成');
  console.log('═══════════════════════════════════════════\n');
  
  return result;
}

// 如果直接运行
if (process.argv[1]?.includes('error-monitor')) {
  main().catch(console.error);
}
