/**
 * E2E 自动执行脚本
 * 由 OpenClaw Cron 每天凌晨 2 点自动执行
 */

import { handleResearchCommand, handleTaskStatus } from '../../src/core/research.js';
import { handleMonitorCommand } from '../../src/core/monitor.js';
import { runMonitorCheck } from '../../src/core/monitor.js';

const TEST_CHAT_ID = 'ou_test_e2e_auto';

/**
 * 创建测试上下文
 */
function createTestContext() {
  return {
    user: { id: TEST_CHAT_ID },
    channel: 'feishu',
    secrets: { 
      CUECUE_API_KEY: process.env.CUECUE_API_KEY || 'test-key'
    },
    reply: (msg) => {
      console.log('[E2E] Bot:', msg.substring(0, 100) + '...');
      return msg;
    }
  };
}

/**
 * 完整用户旅程测试
 */
export async function runCompleteJourney() {
  console.log('\n🧪 开始 E2E 完整旅程测试\n');
  
  const context = createTestContext();
  const results = {
    steps: [],
    errors: [],
    duration: 0
  };
  
  const start = Date.now();
  
  try {
    // 步骤 1: 发起调研
    console.log('📋 步骤 1: 发起调研');
    await handleResearchCommand(context, '自动化测试 - AI 行业分析');
    results.steps.push({ name: '发起调研', status: 'success' });
    
    // 步骤 2: 查询状态
    console.log('\n📋 步骤 2: 查询状态');
    await handleTaskStatus(context);
    results.steps.push({ name: '查询状态', status: 'success' });
    
    // 步骤 3: 创建监控
    console.log('\n📋 步骤 3: 创建监控');
    await handleMonitorCommand(context, ['add', '自动化测试监控']);
    results.steps.push({ name: '创建监控', status: 'success' });
    
    // 步骤 4: 查看监控
    console.log('\n📋 步骤 4: 查看监控');
    await handleMonitorCommand(context, []);
    results.steps.push({ name: '查看监控', status: 'success' });
    
    // 步骤 5: 监控检查
    console.log('\n📋 步骤 5: 监控检查');
    await runMonitorCheck(context);
    results.steps.push({ name: '监控检查', status: 'success' });
    
  } catch (error) {
    console.error('❌ E2E 测试失败:', error.message);
    results.errors.push(error.message);
  }
  
  results.duration = Date.now() - start;
  
  // 输出结果
  console.log('\n📊 E2E 测试结果:');
  console.log('  总步骤:', results.steps.length);
  console.log('  成功:', results.steps.filter(s => s.status === 'success').length);
  console.log('  失败:', results.errors.length);
  console.log('  耗时:', results.duration, 'ms');
  
  return results;
}

/**
 * 性能基准测试
 */
export async function runPerformanceBenchmark() {
  console.log('\n⚡ 开始性能基准测试\n');
  
  const context = createTestContext();
  const results = {
    responseTimes: [],
    avgResponseTime: 0
  };
  
  // 测试 10 次响应时间
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await handleTaskStatus(context);
    const duration = Date.now() - start;
    results.responseTimes.push(duration);
  }
  
  results.avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  
  console.log('📊 性能测试结果:');
  console.log('  平均响应时间:', results.avgResponseTime, 'ms');
  console.log('  最快:', Math.min(...results.responseTimes), 'ms');
  console.log('  最慢:', Math.max(...results.responseTimes), 'ms');
  
  // 性能标准
  if (results.avgResponseTime < 100) {
    console.log('  ✅ 性能优秀 (<100ms)');
  } else if (results.avgResponseTime < 500) {
    console.log('  ✅ 性能良好 (<500ms)');
  } else {
    console.log('  ⚠️ 性能需要优化 (>500ms)');
  }
  
  return results;
}

/**
 * 主函数
 */
export async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  🤖 Cue Research 自动化测试');
  console.log('═══════════════════════════════════════════\n');
  
  // 运行 E2E 测试
  const e2eResults = await runCompleteJourney();
  
  // 运行性能测试
  const perfResults = await runPerformanceBenchmark();
  
  // 汇总
  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 测试汇总');
  console.log('═══════════════════════════════════════════');
  console.log('  E2E 步骤:', e2eResults.steps.length);
  console.log('  E2E 错误:', e2eResults.errors.length);
  console.log('  平均响应:', perfResults.avgResponseTime, 'ms');
  console.log('═══════════════════════════════════════════\n');
  
  // 返回结果（用于告警）
  return {
    success: e2eResults.errors.length === 0,
    e2e: e2eResults,
    performance: perfResults,
    timestamp: Date.now()
  };
}

// 如果直接运行
if (process.argv[1]?.includes('auto-runner')) {
  main().then(results => {
    console.log('✅ 自动化测试完成');
    process.exit(results.success ? 0 : 1);
  }).catch(err => {
    console.error('❌ 自动化测试失败:', err);
    process.exit(1);
  });
}
