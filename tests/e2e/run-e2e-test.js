#!/usr/bin/env node
/**
 * E2E 完整用户旅程测试
 * 模拟真实用户从发起调研到完成的全流程
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspace = path.join(__dirname, '../../test-workspace-e2e');

// 测试上下文
function createTestContext() {
  fs.ensureDirSync(workspace);
  return {
    workspace,
    user: { id: 'e2e-test-user' },
    channel: 'feishu',
    secrets: { 
      CUECUE_API_KEY: process.env.CUECUE_API_KEY || 'test-key',
      TAVILY_API_KEY: process.env.TAVILY_API_KEY || 'test-key'
    }
  };
}

// 清理测试环境
function cleanup() {
  if (fs.existsSync(workspace)) {
    fs.removeSync(workspace);
  }
}

// 执行命令
function runCommand(command, args = []) {
  try {
    const output = execSync(`node ${command} ${args.join(' ')}`, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '../..'),
      env: {
        ...process.env,
        OPENCLAW_WORKSPACE: workspace
      }
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

// 测试步骤
const testSteps = [
  {
    name: '1. 自然语言发起调研',
    command: 'test/simulate-nlu.js',
    args: ['"分析宁德时代和比亚迪的对比"'],
    expect: ['启动', '链接', '预计耗时']
  },
  {
    name: '2. 查询任务状态',
    command: 'test/simulate-command.js',
    args: ['ct'],
    expect: ['任务', '进行中']
  },
  {
    name: '3. 快捷回复 - 状态',
    command: 'test/simulate-reply.js',
    args: ['"状态"'],
    expect: ['任务列表']
  },
  {
    name: '4. 创建监控',
    command: 'test/simulate-command.js',
    args: ['cm', 'add', '测试监控'],
    expect: ['✅']
  },
  {
    name: '5. 查看监控列表',
    command: 'test/simulate-command.js',
    args: ['cm'],
    expect: ['监控']
  },
  {
    name: '6. 取消任务',
    command: 'test/simulate-command.js',
    args: ['cancel'],
    expect: ['已取消']
  }
];

// 主测试流程
async function runE2ETest() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         E2E 完整用户旅程测试                                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  const context = createTestContext();
  
  try {
    for (const step of testSteps) {
      console.log(`📋 执行步骤：${step.name}`);
      console.log('-'.repeat(60));
      
      const result = runCommand(step.command, step.args);
      
      // 验证期望输出
      const expectations = step.expect.map(exp => {
        const passed = result.output.includes(exp);
        return { exp, passed };
      });
      
      const allPassed = expectations.every(e => e.passed);
      
      results.push({
        step: step.name,
        success: result.success && allPassed,
        output: result.output.substring(0, 200),
        expectations
      });
      
      console.log(allPassed ? '✅ 通过' : '❌ 失败');
      if (!allPassed) {
        console.log('输出:', result.output.substring(0, 200));
      }
      console.log();
    }
    
    // 生成报告
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
    
    fs.ensureDirSync(path.join(__dirname, '../reports'));
    fs.writeJsonSync(
      path.join(__dirname, '../reports/e2e-report.json'),
      report,
      { spaces: 2 }
    );
    
    console.log('📄 测试报告已保存至：tests/reports/e2e-report.json\n');
    
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
