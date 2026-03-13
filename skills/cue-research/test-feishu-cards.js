/**
 * 测试飞书卡片生成
 * 验证所有通知类型的飞书卡片格式
 */

import { 
  buildLaunchCardFeishu, 
  buildLaunchText,
  buildProgressCardFeishu,
  formatProgressNotification,
  buildResearchCompleteCard,
  buildMonitorCard
} from './src/ui/cards.js';

console.log('═══════════════════════════════════════════════════════');
console.log('              飞书卡片功能测试');
console.log('═══════════════════════════════════════════════════════\n');

// 测试数据
const testData = {
  topic: '宁德时代的电池技术布局与竞争优势',
  modeName: '产业研究视角',
  reportUrl: 'https://cuecue.cn/c/2ec02a7da6a74b3c',
  elapsedMinutes: 5,
  stage: 'researcher',
  subtask: '智能体 researcher 推理中...',
  duration: 15,
  mode: 'researcher',
  reportSummary: '宁德时代是全球领先的动力电池企业，市场份额连续 6 年全球第一...',
  newsItem: {
    title: '宁德时代发布新一代麒麟电池，能量密度提升 13%',
    url: 'https://example.com/news/123'
  }
};

// 测试 1: 启动通知
console.log('📍 测试 1: 启动通知\n');
console.log('--- 飞书卡片版 ---');
const launchCard = buildLaunchCardFeishu(testData.topic, testData.modeName, testData.reportUrl);
console.log(JSON.stringify(launchCard, null, 2));

console.log('\n--- 文本版 ---');
const launchText = buildLaunchText(testData.topic, testData.modeName, testData.reportUrl);
console.log(launchText);

// 测试 2: 进度通知
console.log('\n\n📍 测试 2: 进度通知\n');
console.log('--- 飞书卡片版 ---');
const progressCard = buildProgressCardFeishu(
  testData.topic,
  testData.elapsedMinutes,
  testData.stage,
  testData.subtask,
  testData.reportUrl
);
console.log(JSON.stringify(progressCard, null, 2));

console.log('\n--- 文本版 ---');
const progressText = formatProgressNotification(
  testData.topic,
  testData.elapsedMinutes,
  testData.stage,
  testData.subtask
);
console.log(progressText);

// 测试 3: 完成通知
console.log('\n\n📍 测试 3: 完成通知\n');
console.log('--- 飞书卡片版 (channel=feishu) ---');
const completeCardFeishu = buildResearchCompleteCard(
  testData.topic,
  testData.reportUrl,
  testData.duration,
  testData.mode,
  testData.reportSummary,
  'feishu'
);
console.log(JSON.stringify(completeCardFeishu, null, 2));

console.log('\n--- 文本版 (channel=discord) ---');
const completeCardText = buildResearchCompleteCard(
  testData.topic,
  testData.reportUrl,
  testData.duration,
  testData.mode,
  testData.reportSummary,
  'discord'
);
console.log(completeCardText);

// 测试 4: 监控通知
console.log('\n\n📍 测试 4: 监控通知\n');
console.log('--- 飞书卡片版 (含深度研究按钮) ---');
const monitorCardFeishu = buildMonitorCard(testData.topic, testData.newsItem, 'feishu');
console.log(JSON.stringify(monitorCardFeishu, null, 2));

console.log('\n--- 简化版 (channel=discord) ---');
const monitorCardText = buildMonitorCard(testData.topic, testData.newsItem, 'discord');
console.log(JSON.stringify(monitorCardText, null, 2));

// 验证卡片结构
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('                    验证结果');
console.log('═══════════════════════════════════════════════════════\n');

const tests = [
  { name: '启动卡片结构', pass: launchCard.type === 'card' && launchCard.cardData?.actions?.length === 1 },
  { name: '进度卡片结构', pass: progressCard.type === 'card' && progressCard.cardData?.actions?.length === 1 },
  { name: '完成卡片结构', pass: completeCardFeishu.type === 'card' && completeCardFeishu.cardData?.actions?.length === 3 },
  { name: '监控卡片结构', pass: monitorCardFeishu.type === 'card' && monitorCardFeishu.cardData?.actions?.length === 2 },
  { name: '文本版兼容性', pass: typeof completeCardText === 'string' && completeCardText.includes('快捷回复') }
];

let passed = 0;
for (const test of tests) {
  const icon = test.pass ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
  if (test.pass) passed++;
}

console.log(`\n总计：${passed}/${tests.length} 通过`);

if (passed === tests.length) {
  console.log('\n🎉 所有测试通过！飞书卡片功能已就绪。');
  process.exit(0);
} else {
  console.log('\n❌ 部分测试失败，请检查代码。');
  process.exit(1);
}
