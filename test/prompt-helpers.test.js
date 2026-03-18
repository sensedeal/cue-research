/**
 * Prompt 辅助函数单元测试
 * 测试复杂度评估、问题类型检测、实体提取等功能
 */

import { describe, it, assert } from 'vitest';
import {
  assessComplexity,
  detectQuestionType,
  extractEntities,
  generateResearchGoals,
  getComplexityLabel,
  getQuestionTypeLabel
} from '../src/utils/promptHelpers.js';

describe('assessComplexity', () => {
  describe('简单问题', () => {
    it('should return simple for short topic', () => {
      assert.strictEqual(assessComplexity('宁德时代'), 'simple');
    });
    
    it('should return simple for basic analysis', () => {
      assert.strictEqual(assessComplexity('分析宁德时代'), 'simple');
    });
  });
  
  describe('中等复杂度', () => {
    it('should return medium for compound question', () => {
      const result = assessComplexity('分析宁德时代和比亚迪');
      assert.strictEqual(result, 'medium');
    });
    
    it('should return medium with abstract concepts', () => {
      const result = assessComplexity('分析宁德时代的机制');
      assert.strictEqual(result, 'medium');
    });
  });
  
  describe('复杂问题', () => {
    it('should return complex for long topic with multiple concepts', () => {
      const result = assessComplexity('深度分析宁德时代的本质和机制');
      assert.strictEqual(result, 'complex');
    });
    
    it('should return complex for long-term analysis', () => {
      const result = assessComplexity('分析宁德时代未来 5 年发展趋势');
      assert.strictEqual(result, 'complex');
    });
  });
  
  describe('边界情况', () => {
    it('should return medium for empty input', () => {
      assert.strictEqual(assessComplexity(''), 'medium');
    });
    
    it('should return medium for null input', () => {
      assert.strictEqual(assessComplexity(null), 'medium');
    });
  });
});

describe('detectQuestionType', () => {
  describe('对比型', () => {
    it('should detect comparative with 对比', () => {
      assert.strictEqual(detectQuestionType('宁德时代和比亚迪对比'), 'comparative');
    });
    
    it('should detect comparative with 比较', () => {
      assert.strictEqual(detectQuestionType('宁德时代和比亚迪比较'), 'comparative');
    });
    
    it('should detect comparative with vs', () => {
      assert.strictEqual(detectQuestionType('宁德时代 vs 比亚迪'), 'comparative');
    });
    
    it('should detect comparative with 和.*比', () => {
      assert.strictEqual(detectQuestionType('宁德时代和比亚迪比哪个更好'), 'comparative');
    });
  });
  
  describe('预测型', () => {
    it('should detect predictive with 趋势', () => {
      assert.strictEqual(detectQuestionType('宁德时代未来趋势'), 'predictive');
    });
    
    it('should detect predictive with 未来', () => {
      assert.strictEqual(detectQuestionType('宁德时代未来 3 年发展'), 'predictive');
    });
    
    it('should detect predictive with 前景', () => {
      assert.strictEqual(detectQuestionType('宁德时代发展前景'), 'predictive');
    });
  });
  
  describe('建议型', () => {
    it('should detect prescriptive with 怎么买', () => {
      assert.strictEqual(detectQuestionType('怎么买宁德时代'), 'prescriptive');
    });
    
    it('should detect prescriptive with 适合买', () => {
      assert.strictEqual(detectQuestionType('现在适合买宁德时代吗'), 'prescriptive');
    });
    
    it('should detect prescriptive with 推荐', () => {
      assert.strictEqual(detectQuestionType('推荐买入宁德时代吗'), 'prescriptive');
    });
  });
  
  describe('分析型', () => {
    it('should detect analytical with 分析', () => {
      assert.strictEqual(detectQuestionType('分析宁德时代'), 'analytical');
    });
    
    it('should detect analytical with 财报', () => {
      assert.strictEqual(detectQuestionType('宁德时代财报分析'), 'analytical');
    });
    
    it('should detect analytical with 估值', () => {
      assert.strictEqual(detectQuestionType('宁德时代估值分析'), 'analytical');
    });
    
    it('should return analytical as default', () => {
      assert.strictEqual(detectQuestionType('宁德时代'), 'analytical');
    });
  });
  
  describe('边界情况', () => {
    it('should return analytical for empty input', () => {
      assert.strictEqual(detectQuestionType(''), 'analytical');
    });
    
    it('should return analytical for null input', () => {
      assert.strictEqual(detectQuestionType(null), 'analytical');
    });
  });
});

describe('extractEntities', () => {
  describe('股票代码', () => {
    it('should extract stock code 300750', () => {
      const entities = extractEntities('分析 300750');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'stock_code', value: '300750' });
    });
    
    it('should extract stock code 600000', () => {
      const entities = extractEntities('600000 怎么样');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'stock_code', value: '600000' });
    });
    
    it('should ignore invalid stock codes', () => {
      const entities = extractEntities('300000 600000 000000');
      assert.strictEqual(entities.length, 0);
    });
  });
  
  describe('知名公司', () => {
    it('should extract 宁德时代', () => {
      const entities = extractEntities('宁德时代竞争优势');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'company', value: '宁德时代' });
    });
    
    it('should extract 比亚迪', () => {
      const entities = extractEntities('比亚迪和宁德时代对比');
      assert.strictEqual(entities.length, 2);
      assert(entities.some(e => e.value === '比亚迪'));
      assert(entities.some(e => e.value === '宁德时代'));
    });
    
    it('should extract multiple companies', () => {
      const entities = extractEntities('腾讯和阿里哪个更好');
      assert.strictEqual(entities.length, 2);
    });
  });
  
  describe('行业', () => {
    it('should extract 新能源', () => {
      const entities = extractEntities('新能源行业趋势');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'industry', value: '新能源' });
    });
    
    it('should extract 人工智能', () => {
      const entities = extractEntities('人工智能发展前景');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'industry', value: '人工智能' });
    });
  });
  
  describe('概念主题', () => {
    it('should extract 碳中和', () => {
      const entities = extractEntities('碳中和相关政策');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'concept', value: '碳中和' });
    });
    
    it('should extract AI', () => {
      const entities = extractEntities('AI 发展趋势');
      assert.strictEqual(entities.length, 1);
      assert.deepStrictEqual(entities[0], { type: 'concept', value: 'AI' });
    });
  });
  
  describe('混合实体', () => {
    it('should extract mixed entities', () => {
      const entities = extractEntities('分析 300750 宁德时代在新能源行业的地位');
      assert.strictEqual(entities.length, 3);
      assert(entities.some(e => e.type === 'stock_code'));
      assert(entities.some(e => e.type === 'company'));
      assert(entities.some(e => e.type === 'industry'));
    });
  });
  
  describe('边界情况', () => {
    it('should return empty array for null input', () => {
      assert.deepStrictEqual(extractEntities(null), []);
    });
    
    it('should return empty array for empty string', () => {
      assert.deepStrictEqual(extractEntities(''), []);
    });
    
    it('should limit to 5 entities', () => {
      const entities = extractEntities('宁德时代比亚迪腾讯阿里百度美团京东');
      assert(entities.length <= 5);
    });
  });
});

describe('generateResearchGoals', () => {
  it('should generate goals for descriptive', () => {
    const goals = generateResearchGoals('descriptive');
    assert(goals.includes('梳理核心概念'));
    assert(goals.includes('定义'));
  });
  
  it('should generate goals for analytical', () => {
    const goals = generateResearchGoals('analytical');
    assert(goals.includes('分析现状'));
    assert(goals.includes('识别核心问题'));
  });
  
  it('should generate goals for predictive', () => {
    const goals = generateResearchGoals('predictive');
    assert(goals.includes('预测未来趋势'));
    assert(goals.includes('关键驱动因素'));
  });
  
  it('should generate goals for prescriptive', () => {
    const goals = generateResearchGoals('prescriptive');
    assert(goals.includes('行动建议'));
    assert(goals.includes('操作方案'));
  });
  
  it('should generate goals for comparative', () => {
    const goals = generateResearchGoals('comparative');
    assert(goals.includes('对比维度'));
    assert(goals.includes('多维度对比分析'));
  });
  
  it('should return analytical goals for unknown type', () => {
    const goals = generateResearchGoals('unknown');
    assert(goals.includes('分析现状'));
  });
});

describe('getComplexityLabel', () => {
  it('should return label for simple', () => {
    assert.strictEqual(getComplexityLabel('simple'), '简单');
  });
  
  it('should return label for medium', () => {
    assert.strictEqual(getComplexityLabel('medium'), '中等');
  });
  
  it('should return label for complex', () => {
    assert.strictEqual(getComplexityLabel('complex'), '复杂');
  });
  
  it('should return default label', () => {
    assert.strictEqual(getComplexityLabel('unknown'), '中等');
  });
});

describe('getQuestionTypeLabel', () => {
  it('should return label for descriptive', () => {
    assert.strictEqual(getQuestionTypeLabel('descriptive'), '描述型（是什么）');
  });
  
  it('should return label for analytical', () => {
    assert.strictEqual(getQuestionTypeLabel('analytical'), '分析型（为什么）');
  });
  
  it('should return label for predictive', () => {
    assert.strictEqual(getQuestionTypeLabel('predictive'), '预测型（会怎样）');
  });
  
  it('should return label for prescriptive', () => {
    assert.strictEqual(getQuestionTypeLabel('prescriptive'), '建议型（怎么做）');
  });
  
  it('should return label for comparative', () => {
    assert.strictEqual(getQuestionTypeLabel('comparative'), '对比型（哪个好）');
  });
  
  it('should return default label', () => {
    assert.strictEqual(getQuestionTypeLabel('unknown'), '分析型');
  });
});
