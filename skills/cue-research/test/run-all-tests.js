#!/usr/bin/env node
/**
 * 统一测试运行器
 * 运行所有测试并生成汇总报告
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const tests = [
  { name: 'Mode Detector', script: 'test/test-mode-detector.js' },
  { name: 'NLU Recognition', script: 'test/nlu-test.js' },
  { name: 'Prompt Helpers', script: 'test/run-prompt-tests.js' },
  { name: 'Quick Reply', script: 'test/run-quick-reply-tests.js' },
  { name: 'Prompt Quality', script: 'test/run-prompt-quality-tests.js' }
];

let totalPassed = 0;
let totalFailed = 0;
const results = [];

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Cue Research 完整测试套件                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

for (const test of tests) {
  console.log(`\n📋 运行测试：${test.name}`);
  console.log('='.repeat(60));
  
  try {
    const output = execSync(`node ${test.script}`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log(output);
    
    // 解析测试结果
    const match = output.match(/✅ 通过：\s*(\d+).*?❌ 失败：\s*(\d+)/s);
    if (match) {
      const passed = parseInt(match[1]);
      const failed = parseInt(match[2]);
      totalPassed += passed;
      totalFailed += failed;
      
      results.push({
        name: test.name,
        passed,
        failed,
        total: passed + failed,
        passRate: ((passed / (passed + failed)) * 100).toFixed(1)
      });
    } else {
      // 尝试另一种格式
      const simpleMatch = output.match(/总测试数：\s*(\d+).*?通过：\s*(\d+).*?失败：\s*(\d+)/s);
      if (simpleMatch) {
        const total = parseInt(simpleMatch[1]);
        const passed = parseInt(simpleMatch[2]);
        const failed = parseInt(simpleMatch[3]);
        totalPassed += passed;
        totalFailed += failed;
        
        results.push({
          name: test.name,
          passed,
          failed,
          total,
          passRate: ((passed / total) * 100).toFixed(1)
        });
      }
    }
  } catch (error) {
    console.log(error.stdout || error.message);
    totalFailed++;
    results.push({
      name: test.name,
      passed: 0,
      failed: 1,
      total: 1,
      passRate: '0%'
    });
  }
}

// 生成汇总报告
console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试汇总                              ║');
console.log('╠═══════════════════════════════════════════════════════════╣');

console.log('\n📊 各测试套件结果：\n');
console.log('┌─────────────────────────┬───────┬───────┬──────────┐');
console.log('│ 测试套件                │ 通过  │ 失败  │ 通过率   │');
console.log('├─────────────────────────┼───────┼───────┼──────────┤');

results.forEach(result => {
  const passSymbol = result.passRate === '100.0%' ? '✅' : result.passRate >= '90' ? '⚠️' : '❌';
  console.log(`│ ${result.name.padEnd(23)} │ ${String(result.passed).padStart(5)} │ ${String(result.failed).padStart(5)} │ ${passSymbol} ${result.passRate.padStart(6)} │`);
});

console.log('└─────────────────────────┴───────┴───────┴──────────┘');

const totalTests = totalPassed + totalFailed;
const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1);

console.log(`\n📈 总计：${totalTests} 个测试，${totalPassed} 通过，${totalFailed} 失败`);
console.log(`📊 总通过率：${overallPassRate}%\n`);

// 保存测试报告
const report = {
  timestamp: new Date().toISOString(),
  totalTests,
  totalPassed,
  totalFailed,
  overallPassRate,
  results
};

fs.ensureDirSync('test-reports');
fs.writeJsonSync('test-reports/test-report.json', report, { spaces: 2 });

console.log('📄 测试报告已保存至：test-reports/test-report.json\n');

if (totalFailed > 0) {
  console.log('❌ 测试失败！请检查上述错误。\n');
  process.exit(1);
} else {
  console.log('✅ 所有测试通过！🎉\n');
  process.exit(0);
}
