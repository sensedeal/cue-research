# Cue Research 迁移计划 Review

> **Review 原则**：
> 1. 先查新版有没有（可能用不同方法实现）
> 2. 再评估要不要（基于用户价值，不是"旧版有"）
> 3. 最后定怎么做（按新版架构规范）

---

## 📊 Review 总表

| 功能模块 | 旧版有 | 新版有 | 评估结果 | 行动 |
|---------|-------|-------|---------|------|
| **任务管理** | | | | |
| 任务状态（running/completed/failed） | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| 取消任务（/cancel） | ✅ | ❌ | ⚠️ 有价值 | **需要实现** |
| 索引文件优化 | ✅ | ❌ | ⏸️ 性能优化 | 暂缓（任务少） |
| **监控管理** | | | | |
| 监控 CRUD | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| 监控守护进程 | ✅ | ✅ | ✅ 已有（onCron） | 无需迁移 |
| 智能触发评估 | ✅ | ✅ | ✅ 已有（更简单可靠） | 无需迁移 |
| 搜索集成 | ✅ | ✅ | ✅ 已有（Tavily） | 无需迁移 |
| 监控模板 | ✅ | ✅ | ✅ 已有（10+ 模板） | 无需迁移 |
| **通知推送** | | | | |
| 启动通知 | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| 进度通知 | ✅ | ✅ | ✅ 已有（修复后） | 无需迁移 |
| 完成通知 | ✅ | ✅ | ✅ 已有（增强版） | 无需迁移 |
| 失败通知 | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| 监控建议通知 | ✅ | ❌ | ⚠️ 有价值 | **需要实现** |
| 监控触发通知 | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| **按钮交互** | | | | |
| 创建监控按钮 | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| 追问问题按钮 | ✅ | ❌ | ⚠️ 有价值 | **需要实现** |
| 查看任务状态按钮 | ✅ | ❌ | ⚠️ 有价值 | **需要实现** |
| 监控管理按钮 | ✅ | ❌ | ⏸️ 低频需求 | 暂缓 |
| **工具函数** | | | | |
| 原子写入 | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| JSON 修复 | ✅ | ✅ | ✅ 已有 | 无需迁移 |
| 错误处理 | ✅ | ❌ | ⚠️ 有价值 | **需要实现** |
| 日志 | ✅ | ❌ | ⏸️ 开发需求 | 可选 |
| 用户偏好 | ✅ | ❌ | ⏸️ 个性化需求 | 暂缓 |

---

## 🔍 详细分析

### ✅ 新版已有的功能（无需迁移）

#### 1. 任务状态管理
**新版实现**：
```javascript
// research.js
await atomicWriteJson(taskPath, { 
  taskId, topic, 
  status: 'running',  // ✅ 状态枚举
  progress: '正在启动...', 
  conversationId, reportUrl, mode 
});

// 完成时
taskData.status = 'completed';
taskData.completed_at = new Date().toISOString();

// 失败时
taskData.status = 'failed';
taskData.error = error.message;
```

**评估**：✅ 已满足需求，无需迁移旧版 taskManager

---

#### 2. 监控守护进程
**新版实现**：
```javascript
// index.js
async onCron(context) {
  if (context.job.action === 'runMonitorCheck') {
    await runMonitorCheck(context);
  }
}

// monitor.js
export async function runMonitorCheck(context) {
  const workspace = getUserWorkspace(context);
  const monitorsDir = path.join(workspace, 'monitors');
  
  for (const file of files) {
    const monitor = await safeReadJson(monitorPath);
    if (!monitor?.isActive) continue;

    const searchRes = await searchInternet(monitor.topic, context.secrets);
    const evaluation = evaluateSmartTrigger(monitor.topic, searchRes.content);
    
    if (evaluation.shouldTrigger) {
      // 发送通知
      await context.reply(buildMonitorCard(...));
    }
  }
}
```

**评估**：✅ 已用新版架构实现（onCron 钩子），无需迁移旧版 monitor-daemon.js

---

#### 3. 智能触发评估
**旧版**：调用 LLM 评估（复杂、易挂起）
**新版**：
```javascript
// smartTrigger.js - 简易 NLP 命中率
export function evaluateSmartTrigger(triggerTopic, content) {
  const triggerWords = triggerTopic.split(/\s+/).filter(w => w.length > 1);
  let matchCount = 0;
  for (const word of triggerWords) {
    if (content.includes(word)) matchCount++;
  }
  const ratio = matchCount / triggerWords.length;
  return { shouldTrigger: ratio >= 0.4 }; // 40% 命中率即触发
}
```

**评估**：✅ 新版更简单可靠，无需迁移旧版

---

#### 4. 搜索集成
**新版实现**：
```javascript
// search.js
export async function searchInternet(query, secrets) {
  const apiKey = secrets?.TAVILY_API_KEY;
  if (!apiKey) return { content: '', results: [] };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey, query, max_results: 3 })
  });
  return { content: data.results?.map(r => r.content).join(' '), results: [] };
}
```

**评估**：✅ 已集成 Tavily，无需迁移旧版 dataSource.js

---

### ⚠️ 需要实现的功能（P0/P1）

#### 1. 取消任务功能（P0）

**⚠️ 技术约束**：
- ❌ **无法停止服务端** - CueCue API 未开放取消接口
- ✅ **只能标记本地状态** - 将任务标记为 `cancelled`
- ✅ **清理后台进程** - 如果是本地启动的进程可以终止

**旧版实现**（index.js）：
```javascript
async function handleCancel() {
  const taskManager = createTaskManager(chatId);
  const runningTasks = await taskManager.getRunningTasks();
  
  if (runningTasks.length === 0) {
    return '📭 当前没有正在进行的任务';
  }
  
  const task = runningTasks[0];
  const duration = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 60000);
  
  // 尝试清理任务（标记为 cancelled）
  const cleaned = await taskManager.cleanupStuckTasks();
  
  let output = `✅ 已取消任务：${task.topic}\n\n`;
  output += `📋 任务信息：\n`;
  output += `   运行时长：${duration} 分钟\n`;
  output += `   清理状态：${cleaned > 0 ? '✅ 已清理' : '⚠️ 可能需要手动清理'}\n\n`;
  
  return output;
}
```

**价值**：
- ✅ 用户心理安慰（能表达"不要了"的意图）
- ✅ 本地状态管理（不会再显示"进行中"）
- ⚠️ 但服务端可能继续运行并消耗积分

**实现方案**（新版架构）：
```javascript
// core/research.js
export async function handleCancelCommand(context, args) {
  const workspace = getUserWorkspace(context);
  const tasksDir = path.join(workspace, 'tasks');
  
  // 查找运行中的任务
  const files = await fs.readdir(tasksDir).catch(() => []);
  const runningTasks = [];
  
  for (const file of files) {
    const task = await safeReadJson(path.join(tasksDir, file));
    if (task?.status === 'running') {
      runningTasks.push({ file, task });
    }
  }
  
  if (runningTasks.length === 0) {
    return context.reply('📭 当前没有正在进行的任务\n\n💡 使用 /cue <问题> 开始新研究');
  }
  
  // 取消最新任务（标记状态）
  const latest = runningTasks[0];
  latest.task.status = 'cancelled';
  latest.task.cancelled_at = new Date().toISOString();
  const duration = Math.floor((Date.now() - new Date(latest.task.createdAt || Date.now()).getTime()) / 60000);
  await atomicWriteJson(path.join(tasksDir, latest.file), latest.task);
  
  let output = `✅ 已取消任务：${latest.task.topic}\n\n`;
  output += `📋 任务信息：\n`;
  output += `   运行时长：${duration} 分钟\n`;
  output += `   状态：已标记为取消\n\n`;
  output += `⚠️ 提示：服务端可能继续运行，但本地已不再追踪\n\n`;
  output += `💡 现在可以开始新研究了`;
  
  return context.reply(output);
}

// index.js
case 'cancel':
  return await handleCancelCommand(context, args);
```

---

#### 2. 监控建议通知（P1）

**现状**：
- 完成通知中提到"推荐监控"
- 但没有实际发送监控建议通知

**价值**：
- 研究完成后一键开启监控
- 提升用户留存

**实现方案**（新版架构）：
```javascript
// research.js - 完成通知中
import { recommendMonitors } from '../utils/monitorTemplates.js';

const recommendations = recommendMonitors(topic, mode);
const topRec = recommendations[0];

if (topRec) {
  const suggestionText = `💡 **推荐监控**

研究主题"${topic}"可能值得持续追踪：

**${topRec.title}**
• 类别：${topRec.category}
• 频率：${topRec.expected_frequency}
• 触发条件：${topRec.semantic_trigger}

回复 "创建监控" 即可开启`;
  
  await context.reply(suggestionText);
}
```

---

#### 3. 追问问题按钮处理（P0）

**现状**：
- 完成通知生成追问问题文本
- 但按钮点击无响应

**价值**：
- 引导用户深入调研
- 提升交互体验

**实现方案**（新版架构）：
```javascript
// core/research.js
export async function handleCardAction(context) {
  const { actionData, reply } = context;
  
  switch (actionData.action) {
    case 'create_monitor':
      // 已有实现
      break;
      
    case 'follow_up':
      // 启动新的研究任务
      return await handleResearchCommand(context, actionData.topic);
      
    case 'view_task_status':
      // 查看任务状态
      return await handleTaskStatus(context);
      
    default:
      return;
  }
}
```

---

#### 4. 错误处理（P1）

**现状**：
- 错误直接抛给用户
- 无统一错误处理

**价值**：
- 友好的错误提示
- 便于调试

**实现方案**（新版架构）：
```javascript
// utils/errorHandler.js
export function formatErrorForUser(error, context = '操作') {
  const errorMap = {
    'timeout': `${context}超时，请稍后重试`,
    'ENOENT': `${context}未找到`,
    'EACCES': `${context}权限不足`,
    'API Error': `服务暂时不可用，请稍后重试`
  };
  
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message?.includes(key)) return message;
  }
  
  return `${context}失败：${error.message}`;
}

// research.js
import { formatErrorForUser } from '../utils/errorHandler.js';

catch (error) {
  const failedText = `❌ **研究任务失败**\n\n${formatErrorForUser(error, '研究')}`;
  await context.reply(failedText);
}
```

---

### ⏸️ 暂缓的功能（P2+）

#### 1. 索引文件优化
**评估**：任务数量 < 100 时性能无感知，暂缓

#### 2. 监控管理按钮
**评估**：低频需求（用户很少暂停/删除监控），暂缓

#### 3. 用户偏好学习
**评估**：个性化需求，核心价值已满足，暂缓

#### 4. 日志系统
**评估**：开发需求，可用 console.log 替代，可选

---

## 📋 更新后的迁移计划

### Phase 1 - P0 核心能力（本周）

| 任务 | 必要性 | 实现方式 | 技术约束 |
|------|--------|---------|---------|
| 1.1 取消任务功能 | ⭐⭐⭐ | 本地标记 `cancelled` | ⚠️ 无法停止服务端 |
| 1.2 追问问题按钮 | ⭐⭐⭐ | 增强 `handleCardAction()` | ✅ 无约束 |
| 1.3 查看任务状态按钮 | ⭐⭐⭐ | 增强 `handleCardAction()` | ✅ 无约束 |

### Phase 2 - P1 用户体验（下周）

| 任务 | 必要性 | 实现方式 | 说明 |
|------|--------|---------|------|
| 2.1 监控建议通知 | ⭐⭐ | 完成通知中追加推荐 | ✅ 无约束 |
| 2.2 错误处理 | ⭐⭐ | 新增 `errorHandler.js` | ✅ 无约束 |

### Phase 3 - P2 优化增强（后续）

| 任务 | 必要性 | 说明 |
|------|--------|------|
| 3.1 索引文件优化 | ⭐ | 任务多了再说 |
| 3.2 监控管理按钮 | ⭐ | 低频需求（暂停/删除） |
| 3.3 用户偏好 | ⭐ | 个性化需求 |

---

## 🎯 结论

**旧版 10 个模块中，6 个新版已有（且实现更好），只需补充 5 个功能**：

| 功能 | 优先级 | 技术约束 |
|------|--------|---------|
| **取消任务** | P0 | ⚠️ 只能标记本地状态，无法停止服务端 |
| **追问问题按钮** | P0 | ✅ 无约束 |
| **查看任务状态按钮** | P0 | ✅ 无约束 |
| **监控建议通知** | P1 | ✅ 无约束 |
| **错误处理** | P1 | ✅ 无约束 |

**无需迁移**：
- taskManager.js（新版已有状态管理）
- monitor-daemon.js（新版 onCron 更简洁）
- smartTrigger.js（新版更简单可靠）
- dataSource.js（新版已集成 Tavily）

---

## ⚠️ 重要技术约束

### 取消任务的限制

**无法实现的功能**：
- ❌ 停止服务端研究（CueCue API 未开放）
- ❌ 终止后台进程（已启动的 Node.js 进程独立运行）
- ❌ 退还积分（已消耗的 API 调用）

**能实现的功能**：
- ✅ 标记本地任务状态为 `cancelled`
- ✅ 用户心理安慰（能表达"不要了"的意图）
- ✅ 本地不再追踪该任务（/ct 不显示）
- ✅ 清理卡住的任务文件

**用户提示**：
```
⚠️ 提示：服务端可能继续运行，但本地已不再追踪
```

---

**生成时间**: 2026-03-12 09:30
**Review 依据**: 旧版 cuebot 代码 vs 新版 cue-research 代码
