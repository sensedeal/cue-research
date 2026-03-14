# 🧪 Cue Research 测试策略

**版本:** v1.0.0  
**策略:** 分层测试，从单元到真实场景

---

## 📊 测试分层设计

### Layer 1: 单元测试 ✅ (已完成)

**已有测试:**
```
test/
├── test-mode-detector.js    ✅ 27 个测试用例
└── nlu-test.js              ✅ NLU 意图识别
```

**覆盖范围:**
- ✅ 模式检测 (13 种模式)
- ✅ 边界情况处理
- ✅ 关键词优先级
- ✅ 自定义模式加载
- ✅ NLU 意图识别

**运行方式:**
```bash
npm test
```

---

### Layer 2: 集成测试 ⏸️ (需要补充)

**需要测试的集成点:**

#### 2.1 命令处理集成

**测试文件:** `test/integration/command-handler.test.js`

**测试用例:**
```javascript
// 1. /ch 命令 - 帮助菜单
test('/ch returns help menu', async () => {
  const context = createMockContext();
  const result = await onCommand({ command: 'ch', args: [], ...context });
  expect(result).toContain('Cue Research');
  expect(result).toContain('/cue');
});

// 2. /ct 命令 - 任务状态
test('/ct returns task status', async () => {
  const context = createMockContext();
  const result = await onCommand({ command: 'ct', args: [], ...context });
  // ❌ 当前返回占位文本，需要修复
});

// 3. /key 命令 - API Key 配置
test('/key shows status', async () => {
  const context = createMockContext({
    secrets: { CUECUE_API_KEY: 'test-key' }
  });
  const result = await onCommand({ command: 'key', args: [], ...context });
  expect(result).toContain('CUECUE_API_KEY');
});

// 4. /cm 命令 - 监控管理
test('/cm add creates monitor', async () => {
  const context = createMockContext();
  const result = await onCommand({ 
    command: 'cm', 
    args: ['add', '测试监控'], 
    ...context 
  });
  expect(result).toContain('✅');
});
```

---

#### 2.2 卡片交互集成

**测试文件:** `test/integration/card-action.test.js`

**测试用例:**
```javascript
// 1. create_monitor 按钮
test('create_monitor button action', async () => {
  const context = createMockContext({
    actionData: { action: 'create_monitor', topic: '测试' }
  });
  const result = await onCardAction(context);
  expect(result).toContain('✅');
});

// 2. cancel_task 按钮 (未实现)
test('cancel_task button action', async () => {
  // ❌ 未实现
});
```

---

#### 2.3 NLU 消息拦截集成

**测试文件:** `test/integration/message-handler.test.js`

**测试用例:**
```javascript
// 1. 自然语言唤醒
test('auto-detect research intent', async () => {
  const context = createMockContext({
    text: '帮我分析宁德时代'
  });
  const result = await onMessage(context);
  expect(result).toBeDefined(); // 应该拦截并返回结果
});

// 2. 非调研消息 (不拦截)
test('ignore non-research message', async () => {
  const context = createMockContext({
    text: '你好'
  });
  const result = await onMessage(context);
  expect(result).toBeUndefined(); // 不拦截
});
```

---

#### 2.4 Cron 任务集成

**测试文件:** `test/integration/cron-job.test.js`

**测试用例:**
```javascript
// 1. runMonitorCheck 存在性
test('runMonitorCheck function exists', async () => {
  // ✅ 函数已存在
  expect(typeof runMonitorCheck).toBe('function');
});

// 2. runMonitorCheck 执行 (mock API 调用)
test('runMonitorCheck executes without error', async () => {
  const context = createMockContext();
  await expect(runMonitorCheck(context)).resolves.not.toThrow();
});
```

---

### Layer 3: E2E 测试 ⏸️ (需要补充)

**测试文件:** `test/e2e/complete-flow.test.js`

**测试用例:**

#### 3.1 完整调研流程

```javascript
test('complete research flow', async () => {
  // 1. 用户发起调研
  const context = createMockContext({
    secrets: { CUECUE_API_KEY: process.env.TEST_API_KEY }
  });
  
  // 2. 触发 /cue 命令
  await onCommand({ 
    command: 'cue', 
    args: ['分析', '宁德时代'], 
    ...context 
  });
  
  // 3. 验证任务创建
  const taskFile = await readTaskFile(taskId);
  expect(taskFile.status).toBe('running');
  
  // 4. 等待完成 (mock API)
  await waitForCompletion(taskId);
  
  // 5. 验证完成通知
  expect(mockReply).toHaveBeenCalledWith(
    expect.stringContaining('研究完成')
  );
});
```

---

#### 3.2 监控完整流程

```javascript
test('complete monitor flow', async () => {
  // 1. 创建监控
  await onCommand({ 
    command: 'cm', 
    args: ['add', '固态电池'], 
    ...context 
  });
  
  // 2. 查看监控列表
  const listResult = await onCommand({ 
    command: 'cm', 
    args: [], 
    ...context 
  });
  expect(listResult).toContain('固态电池');
  
  // 3. 触发 Cron (手动调用)
  await runMonitorCheck(context);
  
  // 4. 验证通知发送
  // ...
});
```

---

### Layer 4: 真实场景测试 ⏸️ (需要补充)

**测试脚本:** `test/e2e/real-scenario.sh`

**测试场景:**

```bash
#!/bin/bash
# 真实场景测试脚本

echo "=== 场景 1: 新用户首次使用 ==="
echo "用户发送：/ch"
echo "预期：显示帮助菜单"
echo ""

echo "=== 场景 2: 发起调研 ==="
echo "用户发送：/cue 分析宁德时代"
echo "预期：返回进度链接"
echo ""

echo "=== 场景 3: 查看状态 ==="
echo "用户发送：/ct"
echo "预期：显示当前任务进度"
echo ""

echo "=== 场景 4: 自然语言唤醒 ==="
echo "用户发送：帮我分析 AI 行业"
echo "预期：自动识别并启动调研"
echo ""

echo "=== 场景 5: 创建监控 ==="
echo "用户发送：/cm add 苹果发布会"
echo "预期：创建成功并返回确认"
```

---

## 📝 测试执行计划

### 阶段 1: 补充集成测试 (今天)

**目标:** 验证所有命令和交互

**测试文件:**
1. `test/integration/command-handler.test.js`
2. `test/integration/card-action.test.js`
3. `test/integration/message-handler.test.js`
4. `test/integration/cron-job.test.js`

**预计用例:** 20-30 个

---

### 阶段 2: 补充 E2E 测试 (本周)

**目标:** 验证完整流程

**测试文件:**
1. `test/e2e/complete-flow.test.js`
2. `test/e2e/monitor-flow.test.js`

**预计用例:** 5-10 个

---

### 阶段 3: 真实场景测试 (本周)

**目标:** 人工验证真实场景

**测试脚本:**
1. `test/e2e/real-scenario.sh`
2. `test/e2e/manual-checklist.md`

---

## 🚀 立即开始

**需要我立即创建哪个测试文件？**

推荐顺序：
1. ✅ 集成测试 - 命令处理 (最关键)
2. ✅ 集成测试 - 卡片交互
3. ✅ 集成测试 - NLU 消息

**要我开始创建测试吗？** 🤖
