# 🎯 Cue Research 真正缺失的功能

**分析日期:** 2026-03-12  
**原则:** 只实现业务逻辑，底层能力全部利用 OpenClaw

---

## ✅ OpenClaw 已提供的能力 (完全不需要实现)

| 功能 | OpenClaw 提供方式 | 是否需要实现 |
|------|------------------|--------------|
| **原子写入** | `storage:workspace` 权限 | ❌ 不需要 |
| **JSON 安全** | OpenClaw 内部处理 | ❌ 不需要 |
| **Cron 任务** | `backgroundJobs` 配置 | ❌ 不需要 |
| **消息发送** | `context.reply()` | ❌ 不需要 |
| **卡片交互** | `onCardAction` 钩子 + `message:interactive` | ❌ 不需要 |
| **后台执行** | `sessions_spawn` | ❌ 不需要 |
| **密钥管理** | `context.secrets` | ❌ 不需要 |
| **文件存储** | workspace 目录 | ❌ 不需要 |

---

## ❌ 真正缺失的业务逻辑

### P0 - 必须实现

#### 1. `runMonitorCheck` 函数 ⭐⭐⭐⭐⭐

**问题:** `package.json` 配置了 backgroundJobs，但**没有实现这个函数**

```json
{
  "backgroundJobs": [
    {
      "name": "monitor-daemon",
      "schedule": "*/30 * * * *",
      "action": "runMonitorCheck"  // ❌ 这个函数不存在
    }
  ]
}
```

**需要实现:**
```javascript
// src/cron/monitor-daemon.js (新增)
export async function runMonitorCheck(context) {
  // 业务逻辑:
  // 1. 读取用户的监控列表
  // 2. 检查每个监控的触发条件
  // 3. 如果触发，自动发起调研
  // 4. 发送通知
  
  // 注意：不需要自己实现 cron，OpenClaw 会每 30 分钟调用这个函数
}
```

**影响:** 监控功能完全无法工作

---

#### 2. 监控卡片内容生成 ⭐⭐⭐⭐⭐

**问题:** `handleCardAction` 只处理了创建监控，但**没有生成卡片内容**

**需要实现:**
```javascript
// src/ui/cards.js (增强)
export function buildMonitorListCard(monitors) {
  // 生成监控列表卡片 (飞书格式)
  // 包含：监控名称、状态、操作按钮
}

export function buildMonitorCreatedCard(monitor) {
  // 生成监控创建成功卡片
  // 包含：监控信息、启停按钮、删除按钮
}
```

**注意:** 不需要实现卡片交互逻辑，OpenClaw 已经处理了，只需要生成卡片内容！

---

#### 3. 任务状态查询逻辑 ⭐⭐⭐⭐⭐

**问题:** `handleTaskStatus` 只返回了占位文本

**当前代码:**
```javascript
export async function handleTaskStatus(context) {
  return context.reply('📊 任务状态查询功能正常，具体数据接入存储层即可。');  // ❌ 占位文本
}
```

**需要实现:**
```javascript
// src/core/research.js (增强)
export async function handleTaskStatus(context) {
  // 业务逻辑:
  // 1. 读取用户的任务列表
  // 2. 过滤出运行中的任务
  // 3. 生成状态卡片
  
  const tasks = await getRunningTasks(context);
  return context.reply(buildTaskStatusCard(tasks));
}
```

---

#### 4. 取消任务逻辑 ⭐⭐⭐⭐⭐

**问题:** 没有实现取消任务功能

**需要实现:**
```javascript
// src/core/research.js (新增)
export async function handleCancelTask(context, taskId) {
  // 业务逻辑:
  // 1. 找到任务
  // 2. 更新状态为 cancelled
  // 3. 如果是后台任务，通知停止
  
  const task = await getTask(taskId);
  task.status = 'cancelled';
  await saveTask(task);
  
  return context.reply(`✅ 任务已取消：${task.topic}`);
}
```

---

#### 5. 监控管理命令 ⭐⭐⭐⭐

**问题:** `/cm` 命令没有实现完整

**需要实现:**
```javascript
// src/core/monitor.js (增强)
export async function handleMonitorCommand(context, args) {
  const command = args[0];
  
  switch (command) {
    case 'add':
      return await handleAddMonitor(context, args.slice(1).join(' '));
    case 'list':
      return await handleListMonitors(context);
    case 'toggle':
      return await handleToggleMonitor(context, args[1]);
    case 'delete':
      return await handleDeleteMonitor(context, args[1]);
    default:
      return buildMonitorHelpCard();
  }
}
```

---

### P1 - 重要实现

#### 6. 监控模板数据 ⭐⭐⭐

**问题:** `monitorTemplates.js` 有模板定义，但**没有集成到创建流程**

**需要实现:**
```javascript
// src/core/monitor.js (增强)
export async function handleAddMonitor(context, topic) {
  // 1. 智能推荐模板
  const templates = recommendTemplates(topic);
  
  // 2. 让用户选择
  if (templates.length > 1) {
    return context.reply(buildTemplateSelectionCard(templates));
  }
  
  // 3. 创建监控
  const monitor = await createMonitor({
    topic,
    template: templates[0]
  });
  
  return context.reply(buildMonitorCreatedCard(monitor));
}
```

---

#### 7. 通知内容生成 ⭐⭐⭐

**问题:** 没有研究完成后的通知逻辑

**需要实现:**
```javascript
// src/notifier/index.js (新增)
export async function sendResearchCompleteNotification(context, report) {
  // 业务逻辑:
  // 1. 生成通知内容
  // 2. 调用 context.reply() 发送
  
  const card = buildResearchCompleteCard(report);
  return context.reply(card);
}
```

**注意:** 不需要实现通知队列、通知发送底层逻辑，OpenClaw 已经处理了！

---

### P2 - 优化实现

#### 8. 用户偏好管理 ⭐⭐

**问题:** 没有用户偏好设置

**需要实现:**
```javascript
// src/core/userState.js (新增)
export async function getUserPreference(context, key) {
  // 从 workspace 读取用户偏好
  const prefs = await readUserPreferences(context);
  return prefs[key];
}

export async function setUserPreference(context, key, value) {
  // 写入用户偏好
  const prefs = await readUserPreferences(context);
  prefs[key] = value;
  await writeUserPreferences(context, prefs);
}
```

---

## 📊 真正的工作量

| 优先级 | 功能 | 工作量 | 说明 |
|--------|------|--------|------|
| **P0** | `runMonitorCheck` | 2h | 监控守护进程业务逻辑 |
| **P0** | 监控卡片内容 | 1h | 生成飞书卡片内容 |
| **P0** | 任务状态查询 | 1h | 读取任务 + 生成卡片 |
| **P0** | 取消任务 | 0.5h | 更新任务状态 |
| **P0** | 监控管理命令 | 2h | add/list/toggle/delete |
| **P1** | 监控模板集成 | 1h | 智能推荐模板 |
| **P1** | 通知内容生成 | 1h | 生成通知卡片 |
| **P2** | 用户偏好管理 | 1h | 读写偏好 |

**总工作量:** 约 9.5 小时

---

## 🚀 关键区别

### ❌ 错误思路 (我之前的分析)

```
需要实现:
- 原子写入 ❌ (OpenClaw 已提供)
- JSON 恢复 ❌ (OpenClaw 已提供)
- Cron 守护 ❌ (OpenClaw 已提供)
- 卡片交互底层 ❌ (OpenClaw 已提供)
- 通知队列 ❌ (OpenClaw 已提供)
```

### ✅ 正确思路

```
只需要实现:
- runMonitorCheck 函数 ✅ (业务逻辑)
- 卡片内容生成 ✅ (业务逻辑)
- 任务管理逻辑 ✅ (业务逻辑)
- 监控管理逻辑 ✅ (业务逻辑)
- 通知内容生成 ✅ (业务逻辑)
```

---

## 📝 核心原则

**新版 cue-research 应该:**

1. ✅ **利用 OpenClaw 的底层能力** (storage/cron/message/interactive)
2. ✅ **只实现业务逻辑** (监控/任务/通知的内容生成)
3. ✅ **符合 OpenClaw Skill 规范** (onCommand/onMessage/onCardAction/onCron)
4. ✅ **保持代码精简** (不重复造轮子)

**不应该:**

1. ❌ 自己实现原子写入 (OpenClaw 已处理)
2. ❌ 自己实现 cron 调度 (OpenClaw 已处理)
3. ❌ 自己实现卡片交互底层 (OpenClaw 已处理)
4. ❌ 自己实现通知队列 (OpenClaw 已处理)

---

## 🎯 立即实现？

**需要我立即实现哪个业务逻辑？**

推荐顺序：
1. `runMonitorCheck` (最关键)
2. 任务状态查询 (最常用)
3. 取消任务 (快速)

**要我开始实现吗？** 🤖
