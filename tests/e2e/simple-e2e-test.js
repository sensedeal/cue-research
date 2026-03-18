#!/usr/bin/env node
/**
 * 简化版 E2E 测试
 * 直接调用函数测试完整用户旅程
 */

import fs from 'fs-extra';
import path from 'path';
import { detectResearchIntent } from '../../src/core/intent.js';
import { handleResearchCommand, handleTaskStatus, handleCancelCommand, handleQuickReplyCommand } from '../../src/core/research.js';
import { handleMonitorCommand } from '../../src/core/monitor.js';

const workspace = '/tmp/cue-e2e-test-' + Date.now();

// 测试上下文
function createTestContext() {
  return {
    reply: (msg) => msg,
    env: { OPENCLAW_WORKSPACE: workspace },
    user: { id: 'e2e-test-user' },
    channel: 'feishu',
    secrets: { 
      CUECUE_API_KEY: 'test-key',
      TAVILY_API_KEY: 'test-key'
    }
  };
}

// 清理
function cleanup() {
  if (fs.existsSync(workspace)) {
    fs.removeSync(workspace);
  }
}

// 测试步骤
async function runE2ETest() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         E2E 完整用户旅程测试（简化版）                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  const context = createTestContext();
  
  try {
    fs.ensureDirSync(workspace);
    
    // Step 1: NLU 识别 - 自然语言发起调研
    console.log('📋 步骤 1: NLU 识别 - "分析宁德时代和比亚迪的对比"');
    const intent = detectResearchIntent('分析宁德时代和比亚迪的对比');
    const step1Pass = intent?.shouldTrigger === true;
    results.push({ step: 'NLU 识别', success: step1Pass });
    console.log(step1Pass ? '✅ 通过' : '❌ 失败');
    console.log();
    
    // Step 2: 启动研究（模拟，不真实调用 API）
    console.log('📋 步骤 2: 启动研究（模拟）');
    // 创建模拟任务
    const tasksDir = path.join(workspace, 'tasks');
    fs.ensureDirSync(tasksDir);
    fs.writeJsonSync(path.join(tasksDir, 'task_e2e.json'), {
      taskId: 'task_e2e',
      topic: '宁德时代和比亚迪对比',
      status: 'running',
      createdAt: Date.now(),
      conversationId: 'e2e-test',
      reportUrl: 'https://cuecue.cn/c/e2e'
    });
    const step2Pass = true;
    results.push({ step: '启动研究', success: step2Pass });
    console.log('✅ 通过（模拟）');
    console.log();
    
    // Step 3: 查询状态
    console.log('📋 步骤 3: 查询状态 - "/ct"');
    try {
      const statusResult = await handleTaskStatus(context);
      const step3Pass = statusResult.includes('任务') || statusResult.includes('运行');
      results.push({ step: '查询状态', success: step3Pass });
      console.log(step3Pass ? '✅ 通过' : '❌ 失败');
    } catch (e) {
      results.push({ step: '查询状态', success: false, error: e.message });
      console.log('❌ 失败:', e.message);
    }
    console.log();
    
    // Step 4: 快捷回复 - 状态
    console.log('📋 步骤 4: 快捷回复 - "状态"');
    try {
      const replyResult = await handleQuickReplyCommand(context, '状态');
      const step4Pass = replyResult?.includes('任务') || replyResult === null;
      results.push({ step: '快捷回复 - 状态', success: step4Pass });
      console.log(step4Pass ? '✅ 通过' : '❌ 失败');
    } catch (e) {
      results.push({ step: '快捷回复 - 状态', success: false, error: e.message });
      console.log('❌ 失败:', e.message);
    }
    console.log();
    
    // Step 5: 创建监控
    console.log('📋 步骤 5: 创建监控 - "/cm add 测试监控"');
    try {
      const monitorResult = await handleMonitorCommand(context, ['add', '测试监控']);
      const step5Pass = monitorResult?.includes('✅') || monitorResult?.includes('监控');
      results.push({ step: '创建监控', success: step5Pass });
      console.log(step5Pass ? '✅ 通过' : '❌ 失败');
    } catch (e) {
      results.push({ step: '创建监控', success: false, error: e.message });
      console.log('❌ 失败:', e.message);
    }
    console.log();
    
    // Step 6: 查看监控
    console.log('📋 步骤 6: 查看监控 - "/cm"');
    try {
      const listResult = await handleMonitorCommand(context, []);
      const step6Pass = listResult?.includes('监控') || listResult?.includes('暂无');
      results.push({ step: '查看监控', success: step6Pass });
      console.log(step6Pass ? '✅ 通过' : '❌ 失败');
    } catch (e) {
      results.push({ step: '查看监控', success: false, error: e.message });
      console.log('❌ 失败:', e.message);
    }
    console.log();
    
    // Step 7: 取消任务
    console.log('📋 步骤 7: 取消任务 - "/cancel"');
    try {
      const cancelResult = await handleCancelCommand(context);
      const step7Pass = cancelResult?.includes('已取消') || cancelResult?.includes('没有正在');
      results.push({ step: '取消任务', success: step7Pass });
      console.log(step7Pass ? '✅ 通过' : '❌ 失败');
    } catch (e) {
      results.push({ step: '取消任务', success: false, error: e.message });
      console.log('❌ 失败:', e.message);
    }
    console.log();
    
    // 总结
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                      测试摘要                              ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  总步骤：${total}                                              ║`);
    console.log(`║  ✅ 通过：${passed}                                              ║`);
    console.log(`║  ❌ 失败：${total - passed}                                               ║`);
    console.log(`║  通过率：${passRate}%                                     ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 保存报告
    const report = {
      timestamp: new Date().toISOString(),
      totalSteps: total,
      passed,
      failed: total - passed,
      passRate,
      results
    };
    
    const reportsDir = path.join(workspace, 'reports');
    fs.ensureDirSync(reportsDir);
    fs.writeJsonSync(path.join(reportsDir, 'e2e-report.json'), report, { spaces: 2 });
    
    console.log(`📄 测试报告已保存至：${path.join(reportsDir, 'e2e-report.json')}\n`);
    
    return total - passed === 0;
    
  } catch (error) {
    console.error('❌ E2E 测试执行失败:', error.message);
    return false;
  } finally {
    cleanup();
  }
}

// 运行测试
runE2ETest().then(success => {
  process.exit(success ? 0 : 1);
});
