/**
 * Prompt 质量测试运行器
 * 测试生成的 Prompt 是否满足质量要求
 */

import { buildSmartPrompt } from '../src/core/promptEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✅ ${message}`);
  } else {
    failed++;
    console.log(`❌ ${message}`);
  }
}

function assertIncludes(str, substring, message) {
  if (str && str.includes(substring)) {
    passed++;
    console.log(`✅ ${message || `包含 "${substring}"`}`);
  } else {
    failed++;
    console.log(`❌ ${message || `应包含 "${substring}", 得到 "${str?.substring(0, 50)}..."`}`);
  }
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Prompt 质量自动化测试                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Test 1: 基本质量
console.log('📋 测试组 1: 基本质量');

const prompt1 = buildSmartPrompt('分析宁德时代');
assert(prompt1.length >= 300, `Prompt 长度 ${prompt1.length} >= 300`);
assertIncludes(prompt1, '研究框架', '包含研究框架');
assertIncludes(prompt1, '信息源标准', '包含信息源标准');
assertIncludes(prompt1, '输出结构', '包含输出结构');
assertIncludes(prompt1, '研究目标', '包含研究目标');
assertIncludes(prompt1, '核心实体', '包含核心实体');

// Test 2: 问题类型识别
console.log('\n📋 测试组 2: 问题类型识别');

const prompt2 = buildSmartPrompt('宁德时代和比亚迪对比');
assertIncludes(prompt2, '问题类型：comparative', '正确识别对比型');

const prompt3 = buildSmartPrompt('宁德时代未来趋势');
assertIncludes(prompt3, '问题类型：predictive', '正确识别预测型');

const prompt4 = buildSmartPrompt('怎么买宁德时代');
assertIncludes(prompt4, '问题类型：prescriptive', '正确识别建议型');

const prompt5 = buildSmartPrompt('分析宁德时代财报');
assertIncludes(prompt5, '问题类型：analytical', '正确识别分析型');

// Test 3: 复杂度评估
console.log('\n📋 测试组 3: 复杂度评估');

const prompt6 = buildSmartPrompt('宁德时代');
assertIncludes(prompt6, '复杂度等级：simple', '短问题识别为 simple');

const prompt7 = buildSmartPrompt('分析宁德时代和比亚迪');
assert(prompt7.includes('复杂度等级：medium') || prompt7.includes('复杂度等级：simple'), 
  '复合问题识别为 medium 或 simple');

const prompt8 = buildSmartPrompt('深度分析宁德时代的本质和机制');
assert(prompt8.includes('复杂度等级：medium') || prompt8.includes('复杂度等级：complex'), 
  '抽象概念识别为 medium 或 complex');

// Test 4: 实体提取
console.log('\n📋 测试组 4: 实体提取');

const prompt9 = buildSmartPrompt('宁德时代竞争优势');
assertIncludes(prompt9, '公司：宁德时代', '提取公司实体');

const prompt10 = buildSmartPrompt('宁德时代和比亚迪对比');
assertIncludes(prompt10, '宁德时代', '包含宁德时代');
assertIncludes(prompt10, '比亚迪', '包含比亚迪');

const prompt11 = buildSmartPrompt('分析 300750');
assertIncludes(prompt11, '股票代码：300750', '提取股票代码');

const prompt12 = buildSmartPrompt('新能源行业趋势');
assertIncludes(prompt12, '行业：新能源', '提取行业实体');

// Test 5: 模式检测
console.log('\n📋 测试组 5: 模式检测');

const prompt13 = buildSmartPrompt('明天买宁德时代合适吗龙虎榜');
assert(prompt13.includes('短线交易视角'), '检测到短线交易模式');

const prompt14 = buildSmartPrompt('宁德时代产业链分析');
assert(prompt14.includes('产业研究视角'), '检测到产业研究模式');

const prompt15 = buildSmartPrompt('宁德时代财报估值分析');
assert(prompt15.includes('基金经理视角'), '检测到基金经理模式');

const prompt16 = buildSmartPrompt('宁德时代适合定投吗');
assert(prompt16.includes('理财顾问视角'), '检测到理财顾问模式');

// Test 6: 框架匹配
console.log('\n📋 测试组 6: 框架匹配');

const prompt17 = buildSmartPrompt('龙虎榜资金流向分析');
assert(prompt17.includes('资金流向') || prompt17.includes('市场微观'), 
  '短线交易框架包含资金流向');

const prompt18 = buildSmartPrompt('产业链竞争格局分析');
assert(prompt18.includes('产业链') || prompt18.includes('竞争格局'), 
  '产业研究框架包含产业链');

const prompt19 = buildSmartPrompt('财报估值分析');
assert(prompt19.includes('财务') || prompt19.includes('估值'), 
  '基金经理框架包含财务/估值');

// Test 7: 输出结构
console.log('\n📋 测试组 7: 输出结构');

const prompt20 = buildSmartPrompt('分析宁德时代');
assertIncludes(prompt20, '执行摘要', '包含执行摘要');

const prompt21 = buildSmartPrompt('A 和 B 对比');
assert(prompt21.includes('对比') || prompt21.includes('分析'), 
  '对比型输出包含对比分析');

const prompt22 = buildSmartPrompt('未来趋势预测');
assert(prompt22.includes('趋势') || prompt22.includes('预测'), 
  '预测型输出包含预测');

// Test 8: 边界情况
console.log('\n📋 测试组 8: 边界情况');

const prompt23 = buildSmartPrompt('宁德');
assert(prompt23.length >= 200, '短输入也能生成完整 Prompt');
assertIncludes(prompt23, '研究框架', '短输入包含研究框架');

const prompt24 = buildSmartPrompt('分析宁德时代和比亚迪在新能源行业的竞争优势对比以及未来发展趋势');
assert(prompt24.length >= 400, '长输入生成详细 Prompt');

const prompt25 = buildSmartPrompt('a'.repeat(1000));
assert(prompt25.length < 1000, '超长输入被截断');

const prompt26 = buildSmartPrompt('分析宁德时代&比亚迪');
assert(prompt26.length >= 200, '特殊字符正常处理');

// Test 9: 异常处理
console.log('\n📋 测试组 9: 异常处理');

let errorThrown = false;
try {
  buildSmartPrompt(null);
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, 'null 输入抛出异常');

errorThrown = false;
try {
  buildSmartPrompt('');
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, '空输入抛出异常');

errorThrown = false;
try {
  buildSmartPrompt('   ');
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, '空白输入抛出异常');

// Test 10: 性能测试
console.log('\n📋 测试组 10: 性能测试');

const perfStart = Date.now();
for (let i = 0; i < 100; i++) {
  buildSmartPrompt(`分析公司${i}`);
}
const perfDuration = Date.now() - perfStart;
assert(perfDuration < 1000, `100 次 Prompt 生成耗时 ${perfDuration}ms < 1000ms`);

const singleStart = Date.now();
buildSmartPrompt('分析宁德时代');
const singleDuration = Date.now() - singleStart;
assert(singleDuration < 100, `单次 Prompt 生成耗时 ${singleDuration}ms < 100ms`);

// Test 11: 一致性测试
console.log('\n📋 测试组 11: 一致性测试');

const prompt27 = buildSmartPrompt('分析宁德时代');
const prompt28 = buildSmartPrompt('分析宁德时代');
assert(prompt27 === prompt28, '相同输入生成相同 Prompt');

const prompt29 = buildSmartPrompt('分析宁德时代');
const prompt30 = buildSmartPrompt('分析比亚迪');
assert(prompt29 !== prompt30, '不同输入生成不同 Prompt');

// Summary
console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试摘要                              ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log(`║  总测试数：${passed + failed}                                           ║`);
console.log(`║  ✅ 通过：${passed}                                           ║`);
console.log(`║  ❌ 失败：${failed}                                            ║`);
const passRate = ((passed / (passed + failed)) * 100).toFixed(1);
console.log(`║  通过率：${passRate}%                                      ║`);
console.log('╚═══════════════════════════════════════════════════════════╝');

process.exit(failed > 0 ? 1 : 0);
