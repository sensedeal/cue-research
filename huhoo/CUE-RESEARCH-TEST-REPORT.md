# 🔍 Cue Research 测试报告

**测试日期:** 2026-03-12  
**版本:** v1.0.0  
**测试类型:** 功能完整性测试

---

## ✅ 测试通过项

### 1. 模块加载测试
```
✅ 模块加载成功
✅ onCommand 存在
✅ onMessage 存在
✅ onCardAction 存在
```

### 2. 单元测试
```
总测试数：27
✅ 通过：27
❌ 失败：0
通过率：100.0%
```

### 3. 模式检测
```
✅ 13 种研究模式检测正确
✅ 边界情况处理正确
✅ 关键词优先级正确
✅ 自定义模式加载正确
```

---

## ❌ 发现的问题

### P0 - 严重问题

#### 1. 缺少后台执行器

**问题:** `runBackgroundResearch` 函数在 `research.js` Line 68 被调用，但没有独立模块

**影响:** 
- 后台任务无法独立管理
- 无法监控后台任务状态
- 无法实现任务取消

**参考旧版:** `old-cuebot/src/core/backgroundExecutor.js`

**修复建议:**
```javascript
// 新增 src/core/backgroundExecutor.js
export async function startBackgroundResearch(context, apiKey, topic, taskPath, conversationId, mode) {
  // 独立的后台执行逻辑
  // 支持任务取消
  // 支持进度追踪
}
```

---

#### 2. 错误处理不完整

**问题:** `research.js` Line 99 使用了未定义的 `msgId` 变量

```javascript
if (msgId && context.bot?.editMessage) {  // ❌ msgId 未定义
  await context.bot.editMessage(msgId, `❌ **研究任务失败：${topic}**\n原因：${error.message}`);
}
```

**影响:** 错误消息无法正确发送

**参考旧版:** `old-cuebot/src/core/errorHandler.js`

**修复建议:**
```javascript
// 移除 msgId 相关代码，或从 context 获取
const msgId = context.messageId;  // 从 context 获取
if (msgId && context.bot?.editMessage) {
  await context.bot.editMessage(msgId, errorMessage);
}
```

---

#### 3. 缺少任务管理器

**问题:** 任务创建/查询/取消逻辑都在 `research.js` 中，没有独立管理

**影响:**
- 任务状态管理混乱
- 无法查询历史任务
- 无法实现任务列表

**参考旧版:** `old-cuebot/src/core/taskManager.js`

**修复建议:**
```javascript
// 新增 src/core/taskManager.js
export function createTaskManager(chatId) {
  return {
    async createTask(taskData) { /* 创建任务 */ },
    async getTask(taskId) { /* 查询任务 */ },
    async cancelTask(taskId) { /* 取消任务 */ },
    async listTasks(status) { /* 列出任务 */ }
  };
}
```

---

#### 4. 缺少监控管理器

**问题:** 监控创建逻辑在 `research.js` 的 `handleCardAction` 中，没有独立管理

**影响:**
- 监控项无法统一管理
- 无法查询监控列表
- 无法实现监控启停

**参考旧版:** `old-cuebot/src/core/monitorManager.js`

**修复建议:**
```javascript
// 新增 src/core/monitorManager.js
export function createMonitorManager(chatId) {
  return {
    async createMonitor(monitorData) { /* 创建监控 */ },
    async getMonitor(monitorId) { /* 查询监控 */ },
    async listMonitors() { /* 列出监控 */ },
    async toggleMonitor(monitorId, isActive) { /* 启停监控 */ }
  };
}
```

---

#### 5. 缺少用户状态管理

**问题:** 没有用户状态追踪

**影响:**
- 无法记住用户偏好
- 无法实现个性化
- 无法追踪用户使用历史

**参考旧版:** `old-cuebot/src/core/userState.js`

**修复建议:**
```javascript
// 新增 src/core/userState.js
export function createUserState(chatId) {
  return {
    async getPreference(key) { /* 获取偏好 */ },
    async setPreference(key, value) { /* 设置偏好 */ },
    async getHistory() { /* 获取历史 */ },
    async addToHistory(item) { /* 添加历史 */ }
  };
}
```

---

### P1 - 重要问题

#### 6. 缺少通知系统

**问题:** 没有独立的通知模块

**影响:**
- 通知发送逻辑分散
- 无法实现通知队列
- 无法实现通知模板

**参考旧版:** `old-cuebot/src/notifier/index.js`

**修复建议:**
```javascript
// 新增 src/notifier/index.js
export async function sendResearchStartNotification(context, task) { /* 发送开始通知 */ }
export async function sendProgressNotification(context, progress) { /* 发送进度通知 */ }
export async function sendResearchCompleteNotification(context, report) { /* 发送完成通知 */ }
```

---

#### 7. 缺少 Cron 任务

**问题:** 没有后台守护进程

**影响:**
- 监控无法自动执行
- 无法实现定时任务
- 无法实现主动推送

**参考旧版:** `old-cuebot/src/cron/monitor-daemon.js`

**修复建议:**
```javascript
// 新增 src/cron/monitor-daemon.js
export async function startMonitorDaemon() {
  // 每 30 分钟检查监控项
  // 自动触发调研
  // 发送通知
}
```

---

#### 8. 缺少按钮事件处理

**问题:** `handleCardAction` 只有简单的 `create_monitor` 处理

**影响:**
- 无法处理取消任务按钮
- 无法处理查看详情按钮
- 无法处理更多交互

**参考旧版:** `old-cuebot/src/handlers/buttonHandler.js`

**修复建议:**
```javascript
// 新增 src/handlers/buttonHandler.js
export async function handleButtonAction(context, action) {
  switch (action.type) {
    case 'cancel_task': /* 取消任务 */ break;
    case 'create_monitor': /* 创建监控 */ break;
    case 'view_details': /* 查看详情 */ break;
  }
}
```

---

### P2 - 优化问题

#### 9. 原子写入不够安全

**问题:** `atomicWriteJson` 没有临时文件 + 验证机制

**当前代码:**
```javascript
export async function atomicWriteJson(filePath, data, options = {}) {
  await fs.writeJson(filePath, data, { spaces: 2, ...options });  // ❌ 直接写入
}
```

**参考旧版:** `old-cuebot/src/core/taskManager.js` Line 36-46

**修复建议:**
```javascript
export async function atomicWriteJson(filePath, data, options = {}) {
  const tmpPath = filePath + '.tmp';
  try {
    await fs.writeJson(tmpPath, data, { spaces: 2, ...options });
    const verified = await fs.readJson(tmpPath);
    if (!verified) throw new Error('Verification failed');
    await fs.move(tmpPath, filePath, { overwrite: true });
  } catch (error) {
    try { await fs.unlink(tmpPath); } catch (e) {}
    throw error;
  }
}
```

---

#### 10. 缺少 JSON 损坏恢复

**问题:** `safeReadJson` 没有损坏恢复逻辑

**当前代码:**
```javascript
export async function safeReadJson(filePath, fallback = null) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    return fallback;  // ❌ 直接返回 fallback，没有尝试恢复
  }
}
```

**参考旧版:** `old-cuebot/src/core/taskManager.js` Line 53-120

**修复建议:**
```javascript
export async function safeReadJson(filePath, fallback = null) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    
    if (error.name === 'SyntaxError' || error.message?.includes('Unexpected')) {
      // 尝试恢复 JSON
      const content = await fs.readFile(filePath, 'utf8');
      const jsonMatch = content.match(/^\s*(\{[\s\S]*?\})\s*(?:\n|$)/m);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const recovered = JSON.parse(jsonMatch[1]);
          await fs.move(filePath, filePath + '.corrupted', { overwrite: true });
          await atomicWriteJson(filePath, recovered);
          return recovered;
        } catch (e) {}
      }
    }
    
    return fallback;
  }
}
```

---

## 📊 问题汇总

| 优先级 | 问题 | 影响 | 工作量 |
|--------|------|------|--------|
| **P0** | 缺少后台执行器 | 高 | 2h |
| **P0** | 错误处理不完整 | 中 | 0.5h |
| **P0** | 缺少任务管理器 | 高 | 3h |
| **P0** | 缺少监控管理器 | 高 | 3h |
| **P0** | 缺少用户状态管理 | 中 | 2h |
| **P1** | 缺少通知系统 | 中 | 2h |
| **P1** | 缺少 Cron 任务 | 中 | 2h |
| **P1** | 缺少按钮事件处理 | 中 | 1h |
| **P2** | 原子写入不安全 | 中 | 1h |
| **P2** | 缺少 JSON 损坏恢复 | 中 | 1h |

**总工作量:** 约 17.5 小时

---

## 🚀 建议修复顺序

### 立即修复 (今天)
1. ✅ 修复 `msgId` 未定义问题 (P0, 0.5h)
2. ✅ 增强原子写入 (P2, 1h)
3. ✅ 添加 JSON 损坏恢复 (P2, 1h)

### 短期修复 (本周)
4. ✅ 添加任务管理器 (P0, 3h)
5. ✅ 添加监控管理器 (P0, 3h)
6. ✅ 添加后台执行器 (P0, 2h)

### 中期修复 (下周)
7. ✅ 添加用户状态管理 (P0, 2h)
8. ✅ 添加通知系统 (P1, 2h)
9. ✅ 添加按钮事件处理 (P1, 1h)
10. ✅ 添加 Cron 任务 (P1, 2h)

---

## 📝 下一步

**需要我立即修复哪些问题？**

推荐先修复：
1. `msgId` 未定义 (快速修复)
2. 原子写入增强 (重要)
3. JSON 损坏恢复 (重要)

这三个问题修复后，系统会更稳定！🤖
