/**
 * NLU 识别自动化测试
 * 测试自然语言意图识别准确率
 */

import { describe, it, expect } from 'vitest';
import { detectResearchIntent } from '../../src/core/intent.js';

describe('NLU Recognition Tests', () => {
  const testCases = [
    // 应该触发的案例
    {
      category: '应该触发 - 调研意图',
      cases: [
        { input: '帮我分析宁德时代', shouldTrigger: true },
        { input: '研究一下 AI 行业前景', shouldTrigger: true },
        { input: '评估腾讯的竞争力', shouldTrigger: true },
        { input: '比亚迪和特斯拉对比', shouldTrigger: true },
        { input: '分析一下茅台的估值', shouldTrigger: true },
        { input: '我想了解大模型行业', shouldTrigger: true },
        { input: '/cue 分析光伏行业', shouldTrigger: false }, // 命令形式不触发 NLU
        { input: '宁德时代产业链分析', shouldTrigger: true },
        { input: '新能源赛道竞争格局', shouldTrigger: true },
        { input: '比亚迪财报估值分析', shouldTrigger: true }
      ]
    },
    
    // 不应该触发的案例
    {
      category: '不应该触发 - 日常聊天',
      cases: [
        { input: '你好', shouldTrigger: false },
        { input: '在吗', shouldTrigger: false },
        { input: '测试', shouldTrigger: false },
        { input: '今天天气不错', shouldTrigger: false },
        { input: '帮我倒杯水', shouldTrigger: false },
        { input: '取消', shouldTrigger: false },
        { input: '停止', shouldTrigger: false },
        { input: '帮助', shouldTrigger: false }
      ]
    },
    
    // 边界情况
    {
      category: '边界情况',
      cases: [
        { input: '', shouldTrigger: false },
        { input: '分', shouldTrigger: false },
        { input: '分析', shouldTrigger: false },
        { input: 'a'.repeat(500), shouldTrigger: false },
        { input: '帮我分析一下宁德时代和比亚迪的竞争优势对比', shouldTrigger: true }
      ]
    }
  ];

  testCases.forEach(({ category, cases }) => {
    describe(category, () => {
      cases.forEach(({ input, shouldTrigger }) => {
        it(`"${input.substring(0, 20)}${input.length > 20 ? '...' : ''}"`, () => {
          const result = detectResearchIntent(input);
          const triggered = result?.shouldTrigger || false;
          expect(triggered).toBe(shouldTrigger);
        });
      });
    });
  });

  // 性能测试
  it('NLU 识别性能 < 10ms', () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      detectResearchIntent('帮我分析宁德时代');
    }
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 100 次 < 100ms = 平均 <1ms
  });
});
