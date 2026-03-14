# 🔍 Cue Research 差距分析 (Corrected)

**分析日期:** 2026-03-12  
**原则:** 利用 OpenClaw 能力，只补充缺失的业务逻辑

---

## ✅ OpenClaw 已提供的能力 (不需要实现)

| 功能 | OpenClaw 提供方式 | 状态 |
|------|------------------|------|
| **Cron 任务** | `package.json` → `backgroundJobs` | ✅ 已配置 |
| **消息发送** | `context.reply()` / `message` 工具 | ✅ 已可用 |
| **卡片交互** | `onCardAction` 钩子 | ✅ 已实现 |
| **后台执行** | `sessions_spawn` / 子 Agent | ✅ 可用 |
| **文件存储** | `storage:workspace` 权限 | ✅ 已配置 |
| **密钥管理** | `context.secrets` | ✅ 已可用 |

---

## ❌ 真正缺失的业务逻辑

### P0 - 关键缺失

#### 1. 监控管理逻辑不完整 ⭐⭐⭐⭐⭐

**问题:** `package.json` 配置了 `monitor-daemon`，但**没有实现 `runMonitorCheck` 函数**

**当前状态:**
```json
"backgroundJobs": [
  {
    "name": "monitor-daemon",
    "schedule": "*/30 * * * *",
    "action": "runMonitorCheck"  // ❌ 未实现
  }
]
```

**影响:** 监控功能完全无法工作

**参考旧版:** `old-cuebot/src/cron/monitor-daemon.js`

**需要实现:**
```javascript
// src/cron/monitor-daemon.js (新增)
export async function runMonitorCheck(context) {
  // 1. 读取所有活跃监控项
  // 2. 检查触发条件
  // 3. 自动发起调研
  // 4. 发送通知
}
```

---

#### 2. 卡片交互处理不完整 ⭐⭐⭐⭐⭐

**问题:** `handleCardAction` 只处理了 `create_monitor`，缺少其他交互

**当前代码:**
```javascript
export async function handleCardAction(context) {
  const { actionData, reply } = context;
  if (actionData.action === 'create_monitor') {
    // ✅ 只有这一个
  }
}
```

**缺少的交互:**
- ❌ `cancel_task` - 取消任务
- ❌ `view_report` - 查看报告
- ❌ `dismiss_notification` - 关闭通知
- ❌ `monitor_toggle` - 启停监控

**参考旧版:** `old-cuebot/src/handlers/buttonHandler.js`

**需要实现:**
```javascript
// src/handlers/buttonHandler.js (新增)
export async function handleCardAction(context) {
  const { actionData } = context;
  
  switch (actionData.action) {
    case 'create_monitor':
      return await handleCreateMonitor(context, actionData);
    case 'cancel_task':
      return await handleCancelTask(context, actionData);
    case 'view_report':
      return await handleViewReport(context, actionData);
    case 'dismiss_notification':
      return await handleDismissNotification(context, actionData);
    case 'monitor_toggle':
      return await handleMonitorToggle(context, actionData);
  }
}
```

---

#### 3. 任务管理逻辑缺失 ⭐⭐⭐⭐⭐

**问题:** 任务创建在 `research.js` 中，但**缺少查询/取消/列表功能**

**当前状态:**
- ✅ 创建任务 - `handleResearchCommand`
- ❌ 查询任务 - 未实现
- ❌ 取消任务 - 未实现
- ❌ 任务列表 - 未实现

**影响:** 用户无法管理已创建的任务

**参考旧版:** `old-cuebot/src/core/taskManager.js`

**需要实现:**
```javascript
// src/core/taskManager.js (新增)
export async function handleTaskStatus(context) {
  // 返回当前任务状态
  // 支持 /ct 命令
}

export async function handleCancelTask(context, taskId) {
  // 取消任务
  // 支持 /cancel 命令
}

export async function handleTaskList(context, status) {
  // 列出任务
  // 支持 /cl 命令
}
```

---

#### 4. 监控管理逻辑缺失 ⭐⭐⭐⭐

**问题:** 监控创建在 `handleCardAction` 中，但**缺少查询/启停/删除功能**

**当前状态:**
- ✅ 创建监控 - `handleCardAction` (部分实现)
- ❌ 查询监控 - 未实现
- ❌ 启停监控 - 未实现
- ❌ 删除监控 - 未实现

**影响:** 用户无法管理已创建的监控

**参考旧版:** `old-cuebot/src/core/monitorManager.js`

**需要实现:**
```javascript
// src/core/monitor.js (增强)
export async function handleMonitorList(context) {
  // 返回监控列表
  // 支持 /cm 命令
}

export async function handleMonitorToggle(context, monitorId, isActive) {
  // 启停监控
  // 支持 /cm toggle <id> 命令
}

export async function handleMonitorDelete(context, monitorId) {
  // 删除监控
  // 支持 /cm delete <id> 命令
}
```

---

#### 5. 错误处理不完整 ⭐⭐⭐⭐

**问题:** `research.js` Line 99 使用了未定义的 `msgId`

**当前代码:**
```javascript
if (msgId && context.bot?.editMessage) {  // ❌ msgId 未定义
  await context.bot.editMessage(msgId, errorMessage);
}
```

**影响:** 错误消息无法正确发送

**修复:**
```javascript
// 方案 1: 移除编辑消息逻辑 (简单)
await context.reply(`❌ **研究任务失败：${topic}**\n原因：${error.message}`);

// 方案 2: 从 context 获取 msgId (推荐)
const msgId = context.messageId;
if (msgId && context.bot?.editMessage) {
  await context.bot.editMessage(msgId, errorMessage);
}
```

---

### P1 - 重要缺失

#### 6. 用户状态管理缺失 ⭐⭐⭐

**问题:** 无法记住用户偏好和使用历史

**影响:**
- 无法实现个性化
- 无法追踪用户使用习惯
- 无法实现智能推荐

**参考旧版:** `old-cuebot/src/core/userState.js`

**需要实现:**
```javascript
// src/core/userState.js (新增)
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

#### 7. 存储层不够安全 ⭐⭐⭐

**问题:** `atomicWriteJson` 没有临时文件 + 验证机制

**当前代码:**
```javascript
export async function atomicWriteJson(filePath, data, options = {}) {
  await fs.writeJson(filePath, data, { spaces: 2, ...options });  // ❌ 直接写入
}
```

**影响:** 并发写入时可能损坏数据

**参考旧版:** `old-cuebot/src/core/taskManager.js` Line 36-46

**修复:**
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

#### 8. JSON 损坏恢复缺失 ⭐⭐⭐

**问题:** `safeReadJson` 没有损坏恢复逻辑

**当前代码:**
```javascript
export async function safeReadJson(filePath, fallback = null) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    return fallback;  // ❌ 直接返回 fallback
  }
}
```

**影响:** JSON 文件损坏时数据丢失

**参考旧版:** `old-cuebot/src/core/taskManager.js` Line 53-120

**修复:**
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

## 📊 差距汇总

| 优先级 | 功能 | 状态 | 工作量 |
|--------|------|------|--------|
| **P0** | 监控守护进程 (`runMonitorCheck`) | ❌ 未实现 | 2h |
| **P0** | 卡片交互处理 | ❌ 不完整 | 1h |
| **P0** | 任务管理 (查询/取消/列表) | ❌ 未实现 | 2h |
| **P0** | 监控管理 (查询/启停/删除) | ❌ 未实现 | 2h |
| **P0** | 错误处理 (`msgId`) | ❌ Bug | 0.5h |
| **P1** | 用户状态管理 | ❌ 未实现 | 2h |
| **P1** | 原子写入增强 | ⚠️ 不安全 | 1h |
| **P1** | JSON 损坏恢复 | ❌ 未实现 | 1h |

**总工作量:** 约 11.5 小时

---

## 🚀 建议修复顺序

### 立即修复 (今天)
1. ✅ 修复 `msgId` Bug (P0, 0.5h)
2. ✅ 实现 `runMonitorCheck` (P0, 2h)
3. ✅ 完善卡片交互 (P0, 1h)

### 短期修复 (本周)
4. ✅ 任务管理功能 (P0, 2h)
5. ✅ 监控管理功能 (P0, 2h)

### 中期修复 (下周)
6. ✅ 原子写入增强 (P1, 1h)
7. ✅ JSON 损坏恢复 (P1, 1h)
8. ✅ 用户状态管理 (P1, 2h)

---

## 📝 关键区别

**旧版 cuebot:**
- ❌ 独立实现所有功能 (cron/notifier/adapter)
- ❌ 代码量大，维护成本高

**新版 cue-research:**
- ✅ 利用 OpenClaw 能力 (backgroundJobs/message/permissions)
- ✅ 只实现业务逻辑，代码精简
- ✅ 符合 OpenClaw Skill 规范

---

**需要我立即开始修复吗？从哪个开始？** 🤖
