/**
 * 测试优化后的 Prompt（简化版）
 */

import { buildSmartPrompt } from './src/core/promptEngine.js';

console.log('═══════════════════════════════════════════════════════');
console.log('              Prompt 优化对比测试');
console.log('═══════════════════════════════════════════════════════\n');

const topic = '宁德时代的电池技术布局与竞争优势';

console.log('📋 研究问题:', topic);
console.log('\n--- 优化后的 Prompt ---\n');

const prompt = buildSmartPrompt(topic);
console.log(prompt);

console.log('\n\n--- 对比分析 ---\n');

// 检查是否移除了冗余内容
const checks = [
  { name: '移除了"研究视角"', test: !prompt.includes('研究视角：') },
  { name: '移除了"问题类型"', test: !prompt.includes('问题类型：') },
  { name: '移除了"复杂度等级"', test: !prompt.includes('复杂度等级：') },
  { name: '移除了"输出结构"', test: !prompt.includes('输出结构：') },
  { name: '移除了"核心实体"', test: !prompt.includes('核心实体：') },
  { name: '保留了"研究问题"', test: prompt.includes('研究问题：') },
  { name: '保留了"研究目标"', test: prompt.includes('研究目标：') },
  { name: '保留了"信息源标准"', test: prompt.includes('信息源标准：') },
  { name: '框架整合到目标', test: prompt.includes('研究目标：\n1.') && prompt.includes('：') }
];

let passed = 0;
for (const check of checks) {
  const icon = check.test ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  if (check.test) passed++;
}

console.log(`\n总计：${passed}/${checks.length} 通过`);

// 字符数对比
console.log(`\n--- 字符统计 ---`);
console.log(`Prompt 长度：${prompt.length} 字符`);

if (passed === checks.length) {
  console.log('\n🎉 Prompt 优化成功！结构更简洁，云端处理更灵活。');
  process.exit(0);
} else {
  console.log('\n❌ 部分检查未通过。');
  process.exit(1);
}
