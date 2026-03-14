/**
 * Prompt 质量集成测试
 * 测试生成的 Prompt 是否满足质量要求（详细度、完整性、准确性）
 */

import { describe, it, assert } from 'vitest';
import { buildSmartPrompt } from '../src/core/promptEngine.js';

describe('buildSmartPrompt - 基本质量', () => {
  it('should generate prompt with minimum length', () => {
    const prompt = buildSmartPrompt('分析宁德时代');
    assert(prompt.length >= 300, `Prompt 长度 ${prompt.length} < 300 字符`);
  });
  
  it('should include research framework', () => {
    const prompt = buildSmartPrompt('分析宁德时代');
    assert(prompt.includes('研究框架'), '缺少研究框架');
  });
  
  it('should include information sources', () => {
    const prompt = buildSmartPrompt('分析宁德时代');
    assert(prompt.includes('信息源标准'), '缺少信息源标准');
  });
  
  it('should include output format', () => {
    const prompt = buildSmartPrompt('分析宁德时代');
    assert(prompt.includes('输出结构'), '缺少输出结构');
  });
  
  it('should include research goals', () => {
    const prompt = buildSmartPrompt('分析宁德时代');
    assert(prompt.includes('研究目标'), '缺少研究目标');
  });
});

describe('buildSmartPrompt - 问题类型识别', () => {
  it('should detect comparative type', () => {
    const prompt = buildSmartPrompt('宁德时代和比亚迪对比');
    assert(prompt.includes('问题类型：comparative'), '未正确识别对比型');
  });
  
  it('should detect predictive type', () => {
    const prompt = buildSmartPrompt('宁德时代未来趋势');
    assert(prompt.includes('问题类型：predictive'), '未正确识别预测型');
  });
  
  it('should detect prescriptive type', () => {
    const prompt = buildSmartPrompt('怎么买宁德时代');
    assert(prompt.includes('问题类型：prescriptive'), '未正确识别建议型');
  });
  
  it('should detect analytical type', () => {
    const prompt = buildSmartPrompt('分析宁德时代财报');
    assert(prompt.includes('问题类型：analytical'), '未正确识别分析型');
  });
});

describe('buildSmartPrompt - 复杂度评估', () => {
  it('should assess simple complexity', () => {
    const prompt = buildSmartPrompt('宁德时代');
    assert(prompt.includes('复杂度等级：simple'), '复杂度评估错误');
  });
  
  it('should assess medium complexity', () => {
    const prompt = buildSmartPrompt('分析宁德时代和比亚迪');
    assert(prompt.includes('复杂度等级：medium') || prompt.includes('复杂度等级：simple'), 
      '复杂度评估应在 simple 或 medium');
  });
  
  it('should assess complex complexity', () => {
    const prompt = buildSmartPrompt('深度分析宁德时代的本质和机制');
    assert(prompt.includes('复杂度等级：medium') || prompt.includes('复杂度等级：complex'), 
      '复杂度评估错误');
  });
});

describe('buildSmartPrompt - 实体提取', () => {
  it('should extract company entities', () => {
    const prompt = buildSmartPrompt('宁德时代竞争优势');
    assert(prompt.includes('公司：宁德时代'), '未提取公司实体');
  });
  
  it('should extract multiple company entities', () => {
    const prompt = buildSmartPrompt('宁德时代和比亚迪对比');
    assert(prompt.includes('宁德时代'), '未提取宁德时代');
    assert(prompt.includes('比亚迪'), '未提取比亚迪');
  });
  
  it('should extract stock code entities', () => {
    const prompt = buildSmartPrompt('分析 300750');
    assert(prompt.includes('股票代码：300750'), '未提取股票代码');
  });
  
  it('should extract industry entities', () => {
    const prompt = buildSmartPrompt('新能源行业趋势');
    assert(prompt.includes('行业：新能源'), '未提取行业实体');
  });
});

describe('buildSmartPrompt - 模式检测', () => {
  it('should detect trader mode', () => {
    const prompt = buildSmartPrompt('明天买宁德时代合适吗龙虎榜');
    assert(prompt.includes('短线交易视角'), '未检测到短线交易模式');
  });
  
  it('should detect researcher mode', () => {
    const prompt = buildSmartPrompt('宁德时代产业链分析');
    assert(prompt.includes('产业研究视角'), '未检测到产业研究模式');
  });
  
  it('should detect fund-manager mode', () => {
    const prompt = buildSmartPrompt('宁德时代财报估值分析');
    assert(prompt.includes('基金经理视角'), '未检测到基金经理模式');
  });
  
  it('should detect advisor mode', () => {
    const prompt = buildSmartPrompt('宁德时代适合定投吗');
    assert(prompt.includes('理财顾问视角'), '未检测到理财顾问模式');
  });
});

describe('buildSmartPrompt - 框架匹配', () => {
  it('should use trader framework for trader mode', () => {
    const prompt = buildSmartPrompt('龙虎榜资金流向分析');
    assert(prompt.includes('资金流向') || prompt.includes('市场微观'), 
      '未使用短线交易框架');
  });
  
  it('should use researcher framework for researcher mode', () => {
    const prompt = buildSmartPrompt('产业链竞争格局分析');
    assert(prompt.includes('产业链') || prompt.includes('竞争格局'), 
      '未使用产业研究框架');
  });
  
  it('should use fund-manager framework for fund-manager mode', () => {
    const prompt = buildSmartPrompt('财报估值分析');
    assert(prompt.includes('财务') || prompt.includes('估值'), 
      '未使用基金经理框架');
  });
});

describe('buildSmartPrompt - 输出结构', () => {
  it('should include executive summary in output', () => {
    const prompt = buildSmartPrompt('分析宁德时代');
    assert(prompt.includes('执行摘要'), '缺少执行摘要');
  });
  
  it('should have proper output format for comparative', () => {
    const prompt = buildSmartPrompt('A 和 B 对比');
    assert(prompt.includes('对比') || prompt.includes('分析'), 
      '输出格式不包含对比分析');
  });
  
  it('should have proper output format for predictive', () => {
    const prompt = buildSmartPrompt('未来趋势预测');
    assert(prompt.includes('趋势') || prompt.includes('预测'), 
      '输出格式不包含预测');
  });
});

describe('buildSmartPrompt - 边界情况', () => {
  it('should handle very short input', () => {
    const prompt = buildSmartPrompt('宁德');
    assert(prompt.length >= 200, 'Prompt 太短');
    assert(prompt.includes('研究框架'), '缺少研究框架');
  });
  
  it('should handle long input', () => {
    const longTopic = '分析宁德时代和比亚迪在新能源行业的竞争优势对比以及未来发展趋势';
    const prompt = buildSmartPrompt(longTopic);
    assert(prompt.length >= 400, 'Prompt 应该详细');
  });
  
  it('should truncate very long input', () => {
    const veryLongTopic = 'a'.repeat(1000);
    const prompt = buildSmartPrompt(veryLongTopic);
    assert(prompt.length < 1000, 'Prompt 应该截断');
  });
  
  it('should handle special characters', () => {
    const prompt = buildSmartPrompt('分析宁德时代&比亚迪');
    assert(prompt.length >= 200, '应正常处理特殊字符');
  });
  
  it('should handle null input', () => {
    assert.throws(() => buildSmartPrompt(null), /Invalid topic/);
  });
  
  it('should handle empty input', () => {
    assert.throws(() => buildSmartPrompt(''), /Invalid topic/);
  });
  
  it('should handle whitespace input', () => {
    assert.throws(() => buildSmartPrompt('   '), /Invalid topic/);
  });
});

describe('buildSmartPrompt - 性能测试', () => {
  it('should generate prompt within 100ms', () => {
    const start = Date.now();
    buildSmartPrompt('分析宁德时代');
    const duration = Date.now() - start;
    assert(duration < 100, `Prompt 生成耗时 ${duration}ms > 100ms`);
  });
  
  it('should generate 100 prompts within 1 second', () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      buildSmartPrompt(`分析公司${i}`);
    }
    const duration = Date.now() - start;
    assert(duration < 1000, `100 次 Prompt 生成耗时 ${duration}ms > 1000ms`);
  });
});

describe('buildSmartPrompt - 一致性测试', () => {
  it('should generate consistent prompt for same input', () => {
    const prompt1 = buildSmartPrompt('分析宁德时代');
    const prompt2 = buildSmartPrompt('分析宁德时代');
    assert.strictEqual(prompt1, prompt2, '相同输入应生成相同 Prompt');
  });
  
  it('should generate different prompt for different input', () => {
    const prompt1 = buildSmartPrompt('分析宁德时代');
    const prompt2 = buildSmartPrompt('分析比亚迪');
    assert.notStrictEqual(prompt1, prompt2, '不同输入应生成不同 Prompt');
  });
});
