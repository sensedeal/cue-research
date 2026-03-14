/**
 * 模式检测器自动化测试
 * 测试范围：
 * 1. 内置模式关键词匹配
 * 2. 自定义模式加载
 * 3. 意图识别集成
 * 4. 边界情况处理
 */

import { detectMode, loadCustomModes, mergeModes, getModeInfo, listModes } from '../src/core/modeDetector.js';
import { detectResearchIntent } from '../src/core/intent.js';
import fs from 'fs-extra';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// 测试用例定义
// ═══════════════════════════════════════════════════════════════════════════

const TEST_CASES = {
  // 1. 内置模式关键词匹配测试
  builtinModes: [
    { input: '分析今日龙虎榜', expectedMode: 'trader', description: '短线交易 - 龙虎榜' },
    { input: '涨停股票资金流向', expectedMode: 'trader', description: '短线交易 - 涨停' },
    { input: '宁德时代产业链分析', expectedMode: 'researcher', description: '产业研究 - 产业链' },
    { input: '新能源赛道竞争格局', expectedMode: 'researcher', description: '产业研究 - 赛道' },
    { input: '比亚迪财报估值分析', expectedMode: 'fundManager', description: '基金经理 - 财报' },
    { input: '贵州茅台 PE PB 估值', expectedMode: 'fundManager', description: '基金经理 - 估值' },
    { input: '定投策略资产配置', expectedMode: 'advisor', description: '理财顾问 - 定投' },
    { input: '理财规划风险控制', expectedMode: 'advisor', description: '理财顾问 - 理财' },
    { input: 'GDP 增速货币政策', expectedMode: 'macro', description: '宏观分析 - GDP' },
    { input: 'CPI 通胀降息预期', expectedMode: 'macro', description: '宏观分析 - CPI' },
    { input: '大模型技术架构分析', expectedMode: 'techAnalyst', description: '技术分析 - AI' },
    { input: 'SaaS 产品商业模式', expectedMode: 'businessAnalyst', description: '商业分析 - 商业模式' },
    { input: '学术研究方法论', expectedMode: 'academic', description: '学术研究 - 方法论' },
  ],

  // 2. 边界情况测试
  edgeCases: [
    { input: '分析', shouldTrigger: false, description: '输入太短' },
    { input: '你好', shouldTrigger: false, description: '日常聊天' },
    { input: '测试一下', shouldTrigger: false, description: '测试关键词' },
    { input: '帮我分析一下宁德时代和比亚迪的竞争优势对比', expectedMode: 'researcher', description: '长文本多实体' },
    { input: '不知道问什么', shouldTrigger: false, description: '无明确意图' },
  ],

  // 3. 混合关键词测试（优先级验证）
  mixedKeywords: [
    { input: '龙虎榜和财报分析', expectedMode: 'trader', description: '高优先级覆盖低优先级' },
    { input: '产业链和 GDP 分析', expectedMode: 'macro', description: '宏观优先级高于产业' },
    { input: '定投和估值哪个重要', expectedMode: 'advisor', description: '理财优先级高于基金经理' },
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// 测试执行器
// ═══════════════════════════════════════════════════════════════════════════

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  assert(condition, message) {
    this.results.total++;
    if (condition) {
      this.results.passed++;
      this.results.details.push({ status: '✅', message });
      console.log(`✅ ${message}`);
    } else {
      this.results.failed++;
      this.results.details.push({ status: '❌', message });
      console.log(`❌ ${message}`);
    }
  }

  async runBuiltinModeTests() {
    console.log('\n📋 测试组 1: 内置模式关键词匹配\n');
    
    for (const testCase of TEST_CASES.builtinModes) {
      const detectedMode = detectMode(testCase.input);
      this.assert(
        detectedMode === testCase.expectedMode,
        `${testCase.description}: "${testCase.input}" → ${detectedMode} (期望：${testCase.expectedMode})`
      );
    }
  }

  async runEdgeCaseTests() {
    console.log('\n📋 测试组 2: 边界情况测试\n');
    
    for (const testCase of TEST_CASES.edgeCases) {
      const intent = detectResearchIntent(testCase.input);
      
      if (testCase.shouldTrigger === false) {
        this.assert(
          intent === null,
          `${testCase.description}: "${testCase.input}" → 未触发 (期望：null)`
        );
      } else {
        this.assert(
          intent !== null && intent.detectedMode === testCase.expectedMode,
          `${testCase.description}: "${testCase.input}" → ${intent?.detectedMode} (期望：${testCase.expectedMode})`
        );
      }
    }
  }

  async runMixedKeywordTests() {
    console.log('\n📋 测试组 3: 混合关键词优先级测试\n');
    
    for (const testCase of TEST_CASES.mixedKeywords) {
      const detectedMode = detectMode(testCase.input);
      this.assert(
        detectedMode === testCase.expectedMode,
        `${testCase.description}: "${testCase.input}" → ${detectedMode} (期望：${testCase.expectedMode})`
      );
    }
  }

  async runCustomModeTests() {
    console.log('\n📋 测试组 4: 自定义模式加载测试\n');
    
    // 保存原始环境变量
    const originalWorkspace = process.env.OPENCLAW_WORKSPACE;
    
    // 创建临时测试文件
    const testWorkspace = path.join(process.cwd(), 'test-workspace');
    await fs.ensureDir(testWorkspace);
    
    const customModes = {
      cryptoTrader: {
        keywords: ['比特币', '加密货币', 'BTC', 'ETH'],
        priority: 10,
        name: '加密货币交易视角'
      }
    };
    
    const customPath = path.join(testWorkspace, 'modes.json');
    await fs.writeJson(customPath, customModes);
    
    // 模拟 context
    const mockContext = {
      env: { OPENCLAW_WORKSPACE: testWorkspace }
    };
    
    try {
      process.env.OPENCLAW_WORKSPACE = testWorkspace;
      const loaded = await loadCustomModes();
      this.assert(
        loaded.cryptoTrader !== undefined,
        `自定义模式加载：${JSON.stringify(Object.keys(loaded))}`
      );
      
      const merged = mergeModes({ builtin: { priority: 5 } }, loaded);
      this.assert(
        merged.cryptoTrader !== undefined,
        `模式合并：${JSON.stringify(Object.keys(merged))}`
      );
      
      const detected = detectMode('比特币价格走势', merged);
      this.assert(
        detected === 'cryptoTrader',
        `自定义模式检测：比特币 → ${detected}`
      );
    } catch (e) {
      this.assert(false, `自定义模式测试失败：${e.message}`);
    } finally {
      // 恢复环境变量
      process.env.OPENCLAW_WORKSPACE = originalWorkspace;
      
      // 清理临时文件
      await fs.remove(testWorkspace);
    }
  }

  async runIntegrationTests() {
    console.log('\n📋 测试组 5: 集成测试\n');
    
    const integrationCases = [
      { input: '帮我分析宁德时代', expectTrigger: true },
      { input: '今天天气不错', expectTrigger: false },
      { input: '研究一下半导体产业链', expectTrigger: true },
    ];
    
    for (const testCase of integrationCases) {
      const intent = detectResearchIntent(testCase.input);
      const triggered = intent !== null;
      
      this.assert(
        triggered === testCase.expectTrigger,
        `集成测试："${testCase.input}" → ${triggered ? '触发' : '未触发'} (期望：${testCase.expectTrigger ? '触发' : '未触发'})`
      );
      
      if (intent && intent.detectedMode) {
        const modeInfo = getModeInfo(intent.detectedMode);
        console.log(`   └─ 模式：${modeInfo.name}`);
      }
    }
  }

  async runAll() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         Cue Research 模式检测器自动化测试                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    await this.runBuiltinModeTests();
    await this.runEdgeCaseTests();
    await this.runMixedKeywordTests();
    await this.runCustomModeTests();
    await this.runIntegrationTests();
    
    this.printSummary();
    return this.results;
  }

  printSummary() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                      测试摘要                              ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  总测试数：${this.results.total.toString().padEnd(45)}║`);
    console.log(`║  ✅ 通过：${this.results.passed.toString().padEnd(45)}║`);
    console.log(`║  ❌ 失败：${this.results.failed.toString().padEnd(45)}║`);
    
    const passRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(1)
      : 0;
    console.log(`║  通过率：${passRate}%${' '.repeat(38)}║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    if (this.results.failed > 0) {
      console.log('❌ 失败用例详情：');
      this.results.details
        .filter(d => d.status === '❌')
        .forEach(d => console.log(`   ${d.status} ${d.message}`));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const runner = new TestRunner();
  const results = await runner.runAll();
  
  // 输出 JSON 报告（便于 Subagent 解析）
  const reportPath = path.join(process.cwd(), 'test-report.json');
  await fs.writeJson(reportPath, {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      passRate: ((results.passed / results.total) * 100).toFixed(1) + '%'
    },
    details: results.details
  }, { spaces: 2 });
  
  console.log(`\n📄 测试报告已保存至：${reportPath}`);
  
  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行测试
main().catch(e => {
  console.error('测试执行失败:', e);
  process.exit(1);
});
