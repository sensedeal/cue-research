/**
 * NLU 意图识别测试
 */
import { detectResearchIntent } from '../src/core/intent.js';

const testCases = [
  // 应该触发的案例
  { input: '帮我分析宁德时代', shouldTrigger: true, expected: '宁德时代' },
  { input: '研究一下 AI 行业前景', shouldTrigger: true, expected: 'AI 行业前景' },
  { input: '评估腾讯的竞争力', shouldTrigger: true, expected: '腾讯的竞争力' },
  { input: '比亚迪和特斯拉对比', shouldTrigger: true, expected: '比亚迪和特斯拉对比' },
  { input: '分析一下茅台的估值', shouldTrigger: true, expected: '茅台的估值' },
  { input: '我想了解大模型行业', shouldTrigger: true, expected: '大模型行业' },
  
  // 不应该触发的案例
  { input: '你好', shouldTrigger: false },
  { input: '测试', shouldTrigger: false },
  { input: '在吗', shouldTrigger: false },
  { input: '今天天气不错', shouldTrigger: false },
  { input: '帮我倒杯水', shouldTrigger: false },
];

let passed = 0;
let failed = 0;

console.log('🧪 NLU 意图识别测试\n');

for (const tc of testCases) {
  const result = detectResearchIntent(tc.input);
  const triggered = result?.shouldTrigger || false;
  const success = triggered === tc.shouldTrigger;
  
  if (success) {
    console.log(`✅ "${tc.input}" → ${triggered ? '触发' : '不触发'}`);
    passed++;
  } else {
    console.log(`❌ "${tc.input}" → 期望：${tc.shouldTrigger ? '触发' : '不触发'}, 实际：${triggered}`);
    failed++;
  }
}

console.log(`\n📊 测试结果：${passed} 通过，${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
