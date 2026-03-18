# 🤖 自动化测试方案 v2.0

> **更新时间**: 2026-03-12 11:15
> **原则**: 机器能做的全部自动化，人工只做体验验证
> **Phase 1 状态**: ✅ 完成（Prompt 优化 + 通知功能）

---

## 📋 测试分层（更新版）

### Layer 1: 单元测试 ✅ (已完成)

**测试文件**:
```
test/
├── test-mode-detector.js       ✅ 27 个用例（模式检测）
├── nlu-test.js                 ✅ NLU 意图识别
└── prompt-helpers.test.js      ⏸️ 新增（Prompt 辅助函数）
```

**新增测试**（Phase 1）:
```javascript
// prompt-helpers.test.js
describe('assessComplexity', () => {
  it('should return simple for short topic', () => {
    assert.strictEqual(assessComplexity('宁德时代'), 'simple');
  });
  
  it('should return complex for long topic with abstract concepts', () => {
    assert.strictEqual(assessComplexity('深度分析宁德时代的本质和机制'), 'complex');
  });
});

describe('detectQuestionType', () => {
  it('should detect comparative type', () => {
    assert.strictEqual(detectQuestionType('宁德时代和比亚迪对比'), 'comparative');
  });
  
  it('should detect predictive type', () => {
    assert.strictEqual(detectQuestionType('宁德时代未来趋势'), 'predictive');
  });
  
  it('should detect prescriptive type', () => {
    assert.strictEqual(detectQuestionType('怎么买宁德时代'), 'prescriptive');
  });
});

describe('extractEntities', () => {
  it('should extract stock codes', () => {
    const entities = extractEntities('分析 300750');
    assert.deepStrictEqual(entities[0], { type: 'stock_code', value: '300750' });
  });
  
  it('should extract company names', () => {
    const entities = extractEntities('宁德时代竞争优势');
    assert.deepStrictEqual(entities[0], { type: 'company', value: '宁德时代' });
  });
});

describe('buildSmartPrompt', () => {
  it('should generate detailed prompt', () => {
    const prompt = buildSmartPrompt('分析宁德时代和比亚迪对比');
    assert(prompt.length > 400);  // 至少 400 字符
    assert(prompt.includes('研究框架'));
    assert(prompt.includes('信息源标准'));
    assert(prompt.includes('输出结构'));
  });
  
  it('should detect comparative type', () => {
    const prompt = buildSmartPrompt('A 和 B 对比');
    assert(prompt.includes('问题类型：comparative'));
  });
});
```

**覆盖率目标**:
- 语句覆盖率：100%
- 分支覆盖率：>90%
- 函数覆盖率：100%

---

### Layer 2: 集成测试 🤖 (AI Swarm 执行)

#### 2.1 命令响应测试（更新版）

**测试文件**: `tests/auto/command-response.test.js`

**新增测试用例**:
```javascript
const commands = [
  // 原有测试
  { cmd: 'ch', expect: ['Cue Research', '/cue', '/ct'] },
  { cmd: 'ct', expect: ['任务'] },
  { cmd: 'cue 测试', expect: ['启动', '链接', '预计耗时'] },
  { cmd: 'cm', expect: ['监控'] },
  { cmd: 'cm add 测试', expect: ['✅'] },
  
  // Phase 1 新增：取消任务
  { 
    cmd: 'cancel', 
    setup: { createRunningTask: true },
    expect: ['已取消', '运行时长', '⚠️ 提示'] 
  },
  { 
    cmd: 'cancel', 
    setup: { noRunningTask: true },
    expect: ['没有正在进行', '开始新研究'] 
  },
  { 
    cmd: 'stop',  // 别名测试
    setup: { createRunningTask: true },
    expect: ['已取消'] 
  },
  
  // Phase 1 新增：错误处理
  { 
    cmd: 'cue 测试', 
    mockError: { type: 'timeout' },
    expect: ['超时', '网络不稳定', '请稍后重试'] 
  },
  { 
    cmd: 'cue 测试', 
    mockError: { type: '401' },
    expect: ['认证失败', 'API Key', '/key'] 
  },
  { 
    cmd: 'cue 测试', 
    mockError: { type: 'network' },
    expect: ['无法连接', '检查网络'] 
  }
];
```

**执行方式**:
```bash
# 本地运行
npm test -- tests/auto/command-response.test.js

# AI Swarm 自动执行（每次 commit）
# GitHub Actions / OpenClaw CI
```

---

#### 2.2 NLU 识别测试（增强版）

**测试文件**: `tests/auto/nlu-recognition.test.js`

**新增测试用例**:
```javascript
const testCases = [
  // 原有测试
  { input: '分析宁德时代', expected: { shouldTrigger: true } },
  { input: '你好', expected: { shouldTrigger: false } },
  
  // Phase 1 新增：问题类型检测
  { 
    input: '宁德时代和比亚迪对比', 
    expected: { 
      shouldTrigger: true, 
      type: 'comparative' 
    } 
  },
  { 
    input: '宁德时代未来趋势', 
    expected: { 
      shouldTrigger: true, 
      type: 'predictive' 
    } 
  },
  { 
    input: '怎么买宁德时代', 
    expected: { 
      shouldTrigger: true, 
      type: 'prescriptive' 
    } 
  },
  { 
    input: '分析宁德时代财报', 
    expected: { 
      shouldTrigger: true, 
      type: 'analytical' 
    } 
  },
  
  // Phase 1 新增：复杂度评估
  { 
    input: '宁德时代', 
    expected: { complexity: 'simple' } 
  },
  { 
    input: '分析宁德时代和比亚迪的竞争优势对比', 
    expected: { complexity: 'medium' } 
  },
  { 
    input: '深度分析宁德时代的本质和机制', 
    expected: { complexity: 'complex' } 
  },
  
  // Phase 1 新增：实体提取
  { 
    input: '分析 300750', 
    expected: { entities: [{ type: 'stock_code', value: '300750' }] } 
  },
  { 
    input: '宁德时代竞争优势', 
    expected: { entities: [{ type: 'company', value: '宁德时代' }] } 
  },
  { 
    input: '新能源行业趋势', 
    expected: { entities: [{ type: 'industry', value: '新能源' }] } 
  }
];

// AI 自动验证识别准确率
testCases.forEach(tc => {
  const result = detectResearchIntent(tc.input);
  assert(result.shouldTrigger === tc.expected.shouldTrigger);
  
  if (tc.expected.type) {
    assert(result.type === tc.expected.type);
  }
  
  if (tc.expected.complexity) {
    const complexity = assessComplexity(tc.input);
    assert(complexity === tc.expected.complexity);
  }
  
  if (tc.expected.entities) {
    const entities = extractEntities(tc.input);
    assert.deepStrictEqual(entities, tc.expected.entities);
  }
});
```

**测试报告**:
```
NLU 识别测试报告
总用例数：100
通过率：>90%
平均响应时间：<50ms
```

---

#### 2.3 快捷回复测试（新增）

**测试文件**: `tests/auto/quick-reply.test.js`

**测试用例**:
```javascript
const quickReplyTests = [
  // 创建监控快捷回复
  { 
    msg: '创建监控', 
    setup: { lastCompletedTask: '宁德时代' },
    expect: ['✅ 已为您创建监控', '频率', '触发条件'] 
  },
  { 
    msg: 'Y', 
    setup: { lastCompletedTask: '宁德时代' },
    expect: ['✅ 已为您创建监控'] 
  },
  { 
    msg: '好的', 
    setup: { lastCompletedTask: '宁德时代' },
    expect: ['✅ 已为您创建监控'] 
  },
  
  // 追问问题快捷回复
  { 
    msg: '追问', 
    setup: { lastCompletedTask: '宁德时代' },
    expect: ['💬 追问问题', '回复 "Y"'] 
  },
  { 
    msg: '深入', 
    setup: { lastCompletedTask: '宁德时代' },
    expect: ['💬 追问问题'] 
  },
  
  // 查看状态快捷回复
  { 
    msg: '状态', 
    expect: ['研究任务列表', '进行中', '已完成'] 
  },
  { 
    msg: '任务', 
    expect: ['研究任务列表'] 
  },
  { 
    msg: 'ct', 
    expect: ['研究任务列表'] 
  }
];

// 测试执行
quickReplyTests.forEach(test => {
  it(`should handle quick reply: ${test.msg}`, async () => {
    const context = createTestContext(test.setup);
    const result = await handleQuickReplyCommand(context, test.msg);
    assert(result.includes(test.expect[0]));
  });
});
```

---

#### 2.4 并发性能测试

**测试文件**: `tests/auto/concurrency.test.js`

**测试逻辑**:
```javascript
// 模拟 100 个用户并发
const users = Array(100).fill().map((_, i) => ({
  user: { id: `user-${i}` },
  channel: 'feishu'
}));

// 并发执行监控检查
const start = Date.now();
await Promise.all(users.map(ctx => runMonitorCheck(ctx)));
const duration = Date.now() - start;

// 性能断言
assert(duration < 1000, `并发执行耗时 ${duration}ms，超过 1 秒阈值`);
assert(memoryUsage < 500, `内存使用 ${memoryUsage}MB，超过 500MB 阈值`);
```

**性能指标**:
- 并发执行时间：<1 秒
- 内存使用：<500MB
- CPU 使用率：<80%

---

#### 2.5 边界情况测试（增强版）

**测试文件**: `tests/auto/edge-cases.test.js`

**新增测试用例**:
```javascript
const edgeCases = [
  // 原有测试
  { input: '', expect: null },
  { input: 'a', expect: null },
  { input: '分析', expect: null },
  { input: 'a'.repeat(500), expect: null },
  
  // Phase 1 新增：Prompt 边界测试
  { 
    input: 'a'.repeat(1000), 
    expect: { promptLength: '<500' }  // Prompt 应截断到 500 字符
  },
  { 
    input: '分析'.repeat(100), 
    expect: { shouldTrigger: true }  // 重复关键词应正常识别
  },
  
  // Phase 1 新增：特殊字符测试
  { input: '{corrupted}', expect: 'recover' },
  { input: '<script>alert(1)</script>', expect: 'sanitized' },
  { input: 'SELECT * FROM users', expect: 'ignored' },
  
  // Phase 1 新增：混合语言测试
  { input: '分析 TSLA vs 宁德时代', expect: { shouldTrigger: true } },
  { input: 'NVDA 财报分析', expect: { shouldTrigger: true } }
];
```

---

#### 2.6 Prompt 质量测试（新增）

**测试文件**: `tests/auto/prompt-quality.test.js`

**测试用例**:
```javascript
const promptQualityTests = [
  {
    input: '分析宁德时代和比亚迪的竞争优势对比',
    checks: {
      minLength: 400,           // 至少 400 字符
      maxLength: 1000,          // 不超过 1000 字符
      hasFramework: true,       // 包含研究框架
      hasSources: true,         // 包含信息源标准
      hasOutputFormat: true,    // 包含输出结构
      hasEntities: true,        // 包含实体列表
      hasResearchGoals: true,   // 包含研究目标
      questionType: 'comparative',  // 正确识别问题类型
      complexity: 'medium'      // 正确评估复杂度
    }
  },
  {
    input: '明天买宁德时代合适吗',
    checks: {
      minLength: 400,
      mode: 'trader',           // 检测为短线交易模式
      questionType: 'prescriptive'
    }
  },
  {
    input: '宁德时代未来 3 年发展趋势',
    checks: {
      minLength: 400,
      questionType: 'predictive',
      hasTimeHorizon: true      // 包含时间跨度
    }
  }
];

// 测试执行
promptQualityTests.forEach(test => {
  it(`should generate quality prompt for: ${test.input.substring(0, 20)}`, () => {
    const prompt = buildSmartPrompt(test.input);
    
    // 长度检查
    assert(prompt.length >= test.checks.minLength, 
      `Prompt 长度 ${prompt.length} < ${test.checks.minLength}`);
    
    if (test.checks.maxLength) {
      assert(prompt.length <= test.checks.maxLength,
        `Prompt 长度 ${prompt.length} > ${test.checks.maxLength}`);
    }
    
    // 内容检查
    if (test.checks.hasFramework) {
      assert(prompt.includes('研究框架'), '缺少研究框架');
    }
    
    if (test.checks.hasSources) {
      assert(prompt.includes('信息源标准'), '缺少信息源标准');
    }
    
    if (test.checks.hasOutputFormat) {
      assert(prompt.includes('输出结构'), '缺少输出结构');
    }
    
    if (test.checks.hasEntities) {
      assert(prompt.includes('核心实体'), '缺少实体列表');
    }
    
    if (test.checks.questionType) {
      assert(prompt.includes(`问题类型：${test.checks.questionType}`),
        `问题类型不匹配：${test.checks.questionType}`);
    }
    
    if (test.checks.complexity) {
      assert(prompt.includes(`复杂度等级：${test.checks.complexity}`),
        `复杂度不匹配：${test.checks.complexity}`);
    }
    
    if (test.checks.mode) {
      assert(prompt.includes(`研究视角：${test.checks.mode}`),
        `模式不匹配：${test.checks.mode}`);
    }
  });
});
```

**质量指标**:
- Prompt 详细度：>400 字符
- 框架完整性：100%
- 实体提取准确率：>90%
- 问题类型识别准确率：>90%

---

### Layer 3: E2E 流程测试 🤖 (OpenClaw Cron)

#### 3.1 完整用户旅程（增强版）

**测试文件**: `tests/e2e/complete-user-journey.test.js`

**新增测试流程**:
```javascript
export async function runCompleteJourney() {
  const context = createTestContext();
  const report = { steps: [], errors: [] };
  
  try {
    // Step 1: 发起调研
    const startResult = await onCommand({ 
      command: 'cue', 
      args: ['测试 E2E'], 
      ...context 
    });
    report.steps.push({ 
      name: '发起调研', 
      success: startResult.includes('启动'),
      response: startResult 
    });
    
    // Step 2: 查询状态
    const statusResult = await onCommand({ 
      command: 'ct', 
      args: [], 
      ...context 
    });
    report.steps.push({ 
      name: '查询状态', 
      success: statusResult.includes('任务'),
      response: statusResult 
    });
    
    // Step 3: 创建监控
    const monitorResult = await onCommand({ 
      command: 'cm', 
      args: ['add', '测试监控'], 
      ...context 
    });
    report.steps.push({ 
      name: '创建监控', 
      success: monitorResult.includes('✅'),
      response: monitorResult 
    });
    
    // Step 4: 查看监控
    const listResult = await onCommand({ 
      command: 'cm', 
      args: [], 
      ...context 
    });
    report.steps.push({ 
      name: '查看监控', 
      success: listResult.includes('监控'),
      response: listResult 
    });
    
    // Phase 1 新增：Step 5 - 快捷回复
    const quickReplyResult = await onMessage({ 
      message: { text: '创建监控' },
      ...context 
    });
    report.steps.push({ 
      name: '快捷回复 - 创建监控', 
      success: quickReplyResult.includes('✅') || quickReplyResult.includes('暂无'),
      response: quickReplyResult 
    });
    
    // Phase 1 新增：Step 6 - 取消任务
    const cancelResult = await onCommand({ 
      command: 'cancel', 
      args: [], 
      ...context 
    });
    report.steps.push({ 
      name: '取消任务', 
      success: cancelResult.includes('已取消') || cancelResult.includes('没有正在'),
      response: cancelResult 
    });
    
    // Phase 1 新增：Step 7 - 错误处理
    const errorResult = await simulateError({ 
      command: 'cue', 
      args: ['测试错误'], 
      mockError: { type: 'timeout' },
      ...context 
    });
    report.steps.push({ 
      name: '错误处理', 
      success: errorResult.includes('超时') || errorResult.includes('失败'),
      response: errorResult 
    });
    
    // 生成测试报告
    const successRate = report.steps.filter(s => s.success).length / report.steps.length;
    report.summary = {
      totalSteps: report.steps.length,
      successRate: `${(successRate * 100).toFixed(1)}%`,
      passed: report.steps.filter(s => s.success).length,
      failed: report.steps.filter(s => !s.success).length
    };
    
    // 保存报告
    await saveTestReport(report);
    
  } catch (error) {
    report.errors.push(error);
    await saveTestReport(report);
    throw error;
  }
}
```

**执行频率**: 每天 2AM

---

#### 3.2 API 集成测试

**测试文件**: `tests/e2e/api-integration.test.js`

**测试逻辑**:
```javascript
export async function testAPIIntegration() {
  const context = {
    secrets: { 
      CUECUE_API_KEY: process.env.TEST_API_KEY,
      TAVILY_API_KEY: process.env.TAVILY_API_KEY 
    }
  };
  
  // 真实调用 API（小额度测试）
  const startTime = Date.now();
  
  try {
    await handleResearchCommand(context, '测试 API 集成');
    const duration = Date.now() - startTime;
    
    // 性能检查
    assert(duration < 30000, `API 响应时间 ${duration}ms 超过 30 秒`);
    
    // 保存性能报告
    await savePerformanceReport({
      test: 'API Integration',
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // 记录错误
    await saveErrorReport({
      test: 'API Integration',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
```

**执行频率**: 每小时

---

### Layer 4: 监控告警 🤖 (OpenClaw Cron)

#### 4.1 错误监控

**测试文件**: `tests/monitoring/error-monitor.js`

**监控逻辑**:
```javascript
export async function checkErrorRate() {
  const errorLogs = await getErrorLogs({ 
    since: '5 minutes ago' 
  });
  
  const totalRequests = await getTotalRequests({ 
    since: '5 minutes ago' 
  });
  
  const errorRate = (errorLogs.length / totalRequests) * 100;
  
  if (errorRate > 5) {
    await sendAlert({
      type: 'error_rate',
      level: 'critical',
      message: `错误率 ${errorRate.toFixed(2)}% 超过 5% 阈值`,
      details: {
        errorCount: errorLogs.length,
        totalRequests,
        errorRate,
        timeWindow: '5 minutes'
      }
    });
  }
  
  // 保存监控报告
  await saveMonitoringReport({
    type: 'error_rate',
    errorRate,
    timestamp: new Date().toISOString()
  });
}
```

**告警阈值**:
- 错误率 > 5% → 立即告警
- 错误率 > 2% → 警告

---

#### 4.2 性能监控

**测试文件**: `tests/monitoring/performance-monitor.js`

**监控逻辑**:
```javascript
export async function checkResponseTime() {
  const startTime = Date.now();
  
  // 模拟用户请求
  const context = createTestContext();
  await onCommand({ command: 'ch', args: [], ...context });
  
  const responseTime = Date.now() - startTime;
  
  if (responseTime > 3000) {
    await sendAlert({
      type: 'response_time',
      level: 'warning',
      message: `响应时间 ${responseTime}ms 超过 3 秒阈值`,
      details: { responseTime }
    });
  }
  
  // 保存性能报告
  await savePerformanceReport({
    type: 'response_time',
    responseTime,
    timestamp: new Date().toISOString()
  });
}
```

**告警阈值**:
- 响应时间 > 3 秒 → 警告
- 响应时间 > 5 秒 → 严重告警

---

#### 4.3 Prompt 质量监控（新增）

**测试文件**: `tests/monitoring/prompt-quality-monitor.js`

**监控逻辑**:
```javascript
export async function checkPromptQuality() {
  // 随机抽样最近的 Prompt
  const recentPrompts = await getRecentPrompts({ limit: 10 });
  
  const qualityReport = {
    total: recentPrompts.length,
    avgLength: 0,
    missingFramework: 0,
    missingSources: 0,
    missingOutputFormat: 0
  };
  
  recentPrompts.forEach(prompt => {
    qualityReport.avgLength += prompt.length;
    
    if (!prompt.includes('研究框架')) qualityReport.missingFramework++;
    if (!prompt.includes('信息源标准')) qualityReport.missingSources++;
    if (!prompt.includes('输出结构')) qualityReport.missingOutputFormat++;
  });
  
  qualityReport.avgLength /= recentPrompts.length;
  
  // 质量检查
  if (qualityReport.avgLength < 400) {
    await sendAlert({
      type: 'prompt_quality',
      level: 'warning',
      message: `平均 Prompt 长度 ${qualityReport.avgLength.toFixed(0)} < 400 字符`,
      details: qualityReport
    });
  }
  
  if (qualityReport.missingFramework > 0) {
    await sendAlert({
      type: 'prompt_quality',
      level: 'warning',
      message: `${qualityReport.missingFramework} 个 Prompt 缺少研究框架`,
      details: qualityReport
    });
  }
  
  // 保存质量报告
  await saveQualityReport({
    type: 'prompt_quality',
    ...qualityReport,
    timestamp: new Date().toISOString()
  });
}
```

**质量指标**:
- 平均 Prompt 长度：>400 字符
- 框架完整性：100%
- 信息源完整性：100%

---

## 📊 自动化测试矩阵（更新版）

| 测试类型 | 执行方式 | 频率 | 自动化 | 状态 | Phase |
|----------|----------|------|--------|------|-------|
| **单元测试** | Vitest | 每次 commit | 100% | ✅ 完成 | 1 |
| **命令响应** | AI Swarm | 每次 commit | 100% | ⏸️ 待运行 | 2 |
| **NLU 识别** | AI Swarm | 每天 | 100% | ⏸️ 待运行 | 2 |
| **快捷回复** | AI Swarm | 每次 commit | 100% | ⏸️ 新增 | 1 |
| **并发性能** | AI Swarm | 每天 | 100% | ⏸️ 待运行 | 2 |
| **边界情况** | AI Swarm | 每次 commit | 100% | ⏸️ 待运行 | 2 |
| **Prompt 质量** | AI Swarm | 每次 commit | 100% | ⏸️ 新增 | 1 |
| **E2E 流程** | OpenClaw Cron | 每天 2AM | 100% | ⏸️ 待配置 | 3 |
| **API 集成** | OpenClaw Cron | 每小时 | 90% | ⏸️ 待配置 | 3 |
| **错误监控** | OpenClaw Cron | 每 5 分钟 | 100% | ⏸️ 待配置 | 4 |
| **性能监控** | OpenClaw Cron | 每 10 分钟 | 100% | ⏸️ 待配置 | 4 |
| **Prompt 质量监控** | OpenClaw Cron | 每 6 小时 | 100% | ⏸️ 新增 | 1 |
| **体验监控** | OpenClaw Cron | 每 6 小时 | 80% | ⏸️ 待配置 | 4 |

---

## 🚀 实施计划（更新版）

### 阶段 1: 基础自动化 ✅ (已完成)
- [x] 单元测试框架
- [x] 27 个单元测试用例
- [x] NLU 测试框架
- [x] **新增**: Prompt 辅助函数测试
- [x] **新增**: Prompt 质量测试

### 阶段 2: 集成自动化 ⏸️ (本周)
- [ ] 命令响应测试（**新增**: 取消任务、错误处理）
- [ ] NLU 识别测试（**新增**: 问题类型、复杂度、实体）
- [ ] **新增**: 快捷回复测试
- [ ] **新增**: Prompt 质量测试
- [ ] 边界情况测试

### 阶段 3: E2E 自动化 ⏸️ (下周)
- [ ] 完整用户旅程（**新增**: 快捷回复、取消任务）
- [ ] API 集成测试
- [ ] OpenClaw Cron 配置

### 阶段 4: 监控告警 ⏸️ (下周)
- [ ] 错误监控
- [ ] 性能监控
- [ ] **新增**: Prompt 质量监控
- [ ] 体验监控

### 阶段 5: 人工测试 ⏸️ (持续)
- [x] 角色扮演脚本
- [x] 记录表格
- [ ] 第一次执行

---

## 📝 需要人工的测试（保持不变）

### 必须人工 (AI 无法替代)

| 测试项 | 频率 | 时间 | 原因 |
|--------|------|------|------|
| **真实用户体验** | 每周 1 次 | 30 分钟 | 情感、困惑、惊喜 |
| **文案质量评估** | 每周 1 次 | 15 分钟 | 语气、温度、专业度 |
| **交互流程顺畅度** | 每周 1 次 | 30 分钟 | 整体体验流畅性 |
| **视觉呈现效果** | 每周 1 次 | 15 分钟 | 卡片美观度 |

**总人工投入**: 每周 1.5 小时

---

## 🎯 成功标准（更新版）

**自动化测试**:
- ✅ 单元测试 100% 覆盖
- ✅ 集成测试 100% 自动化
- ✅ E2E 测试 100% 自动化（含快捷回复、取消任务）
- ✅ 监控告警实时运行
- ✅ **新增**: Prompt 质量 100% 监控

**质量指标**:
- ✅ NLU 识别率 > 90%
- ✅ 问题类型识别率 > 90%
- ✅ 实体提取准确率 > 90%
- ✅ Prompt 平均长度 > 400 字符
- ✅ 响应时间 < 3 秒
- ✅ 任务完成率 > 80%
- ✅ NPS > 7

---

**自动化测试方案 v2.0 更新完成！开始执行！** 🚀
