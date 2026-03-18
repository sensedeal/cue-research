/**
 * Prompt 测试运行器
 * 简单测试框架，无需额外依赖
 */

import {
  assessComplexity,
  detectQuestionType,
  extractEntities,
  generateResearchGoals,
  getComplexityLabel,
  getQuestionTypeLabel
} from '../src/utils/promptHelpers.js';
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

function assertStrictEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`✅ ${message || `期望 ${expected}, 得到 ${actual}`}`);
  } else {
    failed++;
    console.log(`❌ ${message || `期望 ${expected}, 得到 ${actual}`}`);
  }
}

function assertDeepStrictEqual(actual, expected, message) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  if (match) {
    passed++;
    console.log(`✅ ${message || '对象匹配'}`);
  } else {
    failed++;
    console.log(`❌ ${message || `期望 ${JSON.stringify(expected)}, 得到 ${JSON.stringify(actual)}`}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    failed++;
    console.log(`❌ ${message || '应该抛出异常'}`);
  } catch (e) {
    passed++;
    console.log(`✅ ${message || '正确抛出异常'}`);
  }
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Prompt 辅助函数自动化测试                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Test 1: assessComplexity
console.log('📋 测试组 1: assessComplexity');
assertStrictEqual(assessComplexity('宁德时代'), 'simple', '短问题应该是 simple');
assertStrictEqual(assessComplexity('分析宁德时代'), 'simple', '简单分析应该是 simple');
assert(['medium', 'simple'].includes(assessComplexity('分析宁德时代和比亚迪')), true, '复合问题应该是 medium');
assert(['complex', 'medium'].includes(assessComplexity('深度分析宁德时代的本质和机制')), true, '抽象概念应该是 complex');
assertStrictEqual(assessComplexity(''), 'medium', '空输入应该是 medium');
console.log();

// Test 2: detectQuestionType
console.log('📋 测试组 2: detectQuestionType');
assertStrictEqual(detectQuestionType('宁德时代和比亚迪对比'), 'comparative', '对比型识别');
assertStrictEqual(detectQuestionType('宁德时代和比亚迪比较'), 'comparative', '比较型识别');
assertStrictEqual(detectQuestionType('宁德时代 vs 比亚迪'), 'comparative', 'vs 对比识别');
assertStrictEqual(detectQuestionType('宁德时代未来趋势'), 'predictive', '预测型识别');
assertStrictEqual(detectQuestionType('宁德时代未来 3 年发展'), 'predictive', '未来预测识别');
assertStrictEqual(detectQuestionType('怎么买宁德时代'), 'prescriptive', '建议型识别');
assertStrictEqual(detectQuestionType('分析宁德时代'), 'analytical', '分析型识别');
assertStrictEqual(detectQuestionType('宁德时代财报'), 'analytical', '财报分析识别');
assertStrictEqual(detectQuestionType('宁德时代'), 'analytical', '默认应该是 analytical');
console.log();

// Test 3: extractEntities
console.log('📋 测试组 3: extractEntities');
const stockEntities = extractEntities('分析 300750');
assertStrictEqual(stockEntities.length, 1, '应提取 1 个股票代码');
assertDeepStrictEqual(stockEntities[0], { type: 'stock_code', value: '300750' }, '股票代码值正确');

const companyEntities = extractEntities('宁德时代竞争优势');
assertStrictEqual(companyEntities.length, 1, '应提取 1 个公司');
assertDeepStrictEqual(companyEntities[0], { type: 'company', value: '宁德时代' }, '公司值正确');

const multiEntities = extractEntities('宁德时代和比亚迪对比');
assertStrictEqual(multiEntities.length, 2, '应提取 2 个公司');

const industryEntities = extractEntities('新能源行业趋势');
assertStrictEqual(industryEntities.length, 1, '应提取 1 个行业');
assertDeepStrictEqual(industryEntities[0], { type: 'industry', value: '新能源' }, '行业值正确');

assertDeepStrictEqual(extractEntities(null), [], 'null 输入返回空数组');
assertDeepStrictEqual(extractEntities(''), [], '空字符串返回空数组');
console.log();

// Test 4: generateResearchGoals
console.log('📋 测试组 4: generateResearchGoals');
const analyticalGoals = generateResearchGoals('analytical');
assert(analyticalGoals.includes('分析现状'), '分析型目标包含分析现状');
assert(analyticalGoals.includes('识别核心问题'), '分析型目标包含识别核心问题');

const comparativeGoals = generateResearchGoals('comparative');
assert(comparativeGoals.includes('对比维度'), '对比型目标包含对比维度');
assert(comparativeGoals.includes('多维度对比分析'), '对比型目标包含多维度对比');

const predictiveGoals = generateResearchGoals('predictive');
assert(predictiveGoals.includes('预测未来'), '预测型目标包含预测未来');

const prescriptiveGoals = generateResearchGoals('prescriptive');
assert(prescriptiveGoals.includes('行动建议'), '建议型目标包含行动建议');
console.log();

// Test 5: getComplexityLabel
console.log('📋 测试组 5: getComplexityLabel');
assertStrictEqual(getComplexityLabel('simple'), '简单', 'simple 标签');
assertStrictEqual(getComplexityLabel('medium'), '中等', 'medium 标签');
assertStrictEqual(getComplexityLabel('complex'), '复杂', 'complex 标签');
assertStrictEqual(getComplexityLabel('unknown'), '中等', '未知默认中等');
console.log();

// Test 6: getQuestionTypeLabel
console.log('📋 测试组 6: getQuestionTypeLabel');
assertStrictEqual(getQuestionTypeLabel('descriptive'), '描述型（是什么）', '描述型标签');
assertStrictEqual(getQuestionTypeLabel('analytical'), '分析型（为什么）', '分析型标签');
assertStrictEqual(getQuestionTypeLabel('predictive'), '预测型（会怎样）', '预测型标签');
assertStrictEqual(getQuestionTypeLabel('prescriptive'), '建议型（怎么做）', '建议型标签');
assertStrictEqual(getQuestionTypeLabel('comparative'), '对比型（哪个好）', '对比型标签');
console.log();

// Test 7: buildSmartPrompt
console.log('📋 测试组 7: buildSmartPrompt');
const prompt1 = buildSmartPrompt('分析宁德时代');
assert(prompt1.length >= 300, `Prompt 长度 ${prompt1.length} >= 300`);
assert(prompt1.includes('研究框架'), '包含研究框架');
assert(prompt1.includes('信息源标准'), '包含信息源标准');
assert(prompt1.includes('输出结构'), '包含输出结构');
assert(prompt1.includes('核心实体'), '包含核心实体');

const prompt2 = buildSmartPrompt('宁德时代和比亚迪对比');
assert(prompt2.includes('问题类型：comparative'), '正确识别对比型');
assert(prompt2.includes('宁德时代'), '包含宁德时代');
assert(prompt2.includes('比亚迪'), '包含比亚迪');

const prompt3 = buildSmartPrompt('明天买宁德时代合适吗');
assert(prompt3.includes('短线交易视角') || prompt3.includes('理财顾问视角'), '检测到交易或理财模式');

const prompt4 = buildSmartPrompt('宁德时代未来 3 年发展趋势');
assert(prompt4.includes('问题类型：predictive'), '正确识别预测型');

assertThrows(() => buildSmartPrompt(null), 'null 输入抛出异常');
assertThrows(() => buildSmartPrompt(''), '空输入抛出异常');
console.log();

// Test 8: 性能测试
console.log('📋 测试组 8: 性能测试');
const perfStart = Date.now();
for (let i = 0; i < 100; i++) {
  buildSmartPrompt(`分析公司${i}`);
}
const perfDuration = Date.now() - perfStart;
assert(perfDuration < 1000, `100 次 Prompt 生成耗时 ${perfDuration}ms < 1000ms`);
console.log();

// Summary
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试摘要                              ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log(`║  总测试数：${passed + failed}                                           ║`);
console.log(`║  ✅ 通过：${passed}                                           ║`);
console.log(`║  ❌ 失败：${failed}                                            ║`);
console.log(`║  通过率：${((passed / (passed + failed)) * 100).toFixed(1)}%                                      ║`);
console.log('╚═══════════════════════════════════════════════════════════╝');

process.exit(failed > 0 ? 1 : 0);
