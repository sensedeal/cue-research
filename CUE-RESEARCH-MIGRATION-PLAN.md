# Cue Research 迁移计划 - 旧版逻辑 + 新版架构

> **原则**：不是覆盖，是迁移。保留旧版经过验证的业务逻辑，用新版架构实现。

---

## 📊 模块对比总览

| 模块 | 旧版 cuebot | 新版 cue-research | 迁移状态 |
|------|------------|------------------|---------|
| **核心研究** | ✅ research-worker.js | ✅ research.js | ⚠️ 部分迁移 |
| **任务管理** | ✅ taskManager.js | ❌ 缺失 | ❌ 未迁移 |
| **监控管理** | ✅ monitorManager.js | ⚠️ monitor.js | ⚠️ 部分迁移 |
| **通知推送** | ✅ notifier/index.js | ⚠️ 部分在 research.js | ⚠️ 部分迁移 |
| **按钮处理** | ✅ buttonHandler.js | ❌ 缺失 | ❌ 未迁移 |
| **监控守护** | ✅ monitor-daemon.js | ❌ 缺失 | ❌ 未迁移 |
| **工具函数** | ✅ 10+ utils | ✅ 6 utils | ⚠️ 部分迁移 |
| **Adapter** | ✅ 5 平台 Adapter | ❌ 无（用 OpenClaw） | ✅ 正确删除 |

---

## 🔍 详细业务逻辑对比

### 1️⃣ 研究任务管理

#### 旧版逻辑（taskManager.js）
```javascript
// ✅ 索引文件优化 - 避免遍历目录
_indexPath = path.join(tasksDir, 'index.json')
async _updateIndex(taskId) {
  // 维护任务 ID 列表，限制最近 1000 个
}

// ✅ 原子写入 + JSON 损坏修复
async function atomicWriteJson(filePath, data)
async function safeReadJson(filePath, fallback)

// ✅ 任务状态枚举
export const TaskStatus = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
}

// ✅ 任务操作方法
createTask(taskId, topic, mode)
updateTask(taskId, updates)
updateTaskProgress(taskId, progress, percent)
completeTask(taskId, result)
failTask(taskId, error)
getTask(taskId)
listTasks(limit = 10)
cancelTask(taskId)
```

#### 新版现状
- ❌ 无索引文件优化
- ✅ 有 `atomicWriteJson` 和 `safeReadJson`（在 storage.js）
- ❌ 无任务状态枚举
- ❌ 无取消任务功能
- ⚠️ 任务操作分散在 research.js 中

#### 迁移建议
**P0 - 必须迁移**：
1. ✅ 任务状态枚举（定义清晰的状态流转）
2. ✅ 取消任务功能（用户说"不要了"时能取消）
3. ✅ 索引文件优化（任务多了后性能关键）

---

### 2️⃣ 监控管理

#### 旧版逻辑（monitorManager.js + monitor-daemon.js）
```javascript
// ✅ 监控项结构
{
  monitor_id: 'mon_xxx',
  title: '特斯拉财报发布提醒',
  symbol: 'TSLA',
  category: 'Data|Event|Policy|Sentiment',
  semantic_trigger: '特斯拉发布财报',
  trigger_keywords: ['财报', '业绩'],
  frequency_cron: '0 9 * * 1-5',
  start_date: '2026-03-20',
  is_active: true,
  created_at: '2026-03-12',
  last_triggered_at: null,
  trigger_count: 0
}

// ✅ 监控操作方法
createMonitor(monitorData)
updateMonitor(monitorId, updates)
getMonitor(monitorId)
listMonitors(chatId)
deleteMonitor(monitorId)

// ✅ 守护进程逻辑
async function checkMonitor(monitor, chatId) {
  // 1. 检查开始日期
  if (!shouldCheckNow(monitor)) return;
  
  // 2. 执行搜索
  const searchResult = await searchForTrigger(trigger);
  
  // 3. 智能触发评估（LLM 判断）
  const evaluation = await evaluateSmartTrigger(trigger, content);
  
  // 4. 发送通知
  if (evaluation.shouldTrigger) {
    await sendMonitorTriggerNotification(...);
    await updateMonitor(monitorId, { last_triggered_at, trigger_count });
  }
}

// ✅ 自动注册 OpenClaw Cron
await registerCronTask({
  name: `cue-monitor-${chatId}`,
  schedule: '*/30 * * * *',
  message: '/cm check'
});
```

#### 新版现状
- ⚠️ 有 monitor.js，但只有基础 CRUD
- ❌ 无监控守护进程（monitor-daemon.js）
- ❌ 无智能触发评估（smartTrigger.js）
- ❌ 无 OpenClaw Cron 集成（openclawUtils.js）
- ❌ 无搜索集成（dataSource.js）

#### 迁移建议
**P0 - 必须迁移**：
1. ✅ 监控守护进程（核心功能）
2. ✅ 智能触发评估（核心价值）
3. ✅ OpenClaw Cron 集成（用 backgroundJobs 替代 node-cron）

**P1 - 强烈建议**：
4. ✅ 监控项完整结构（start_date, trigger_count 等）
5. ✅ 搜索集成（复用 OpenClaw web_search）

---

### 3️⃣ 通知推送

#### 旧版逻辑（notifier/index.js）
```javascript
// ✅ 通知类型
- sendResearchStartNotification()
- sendProgressNotification()  // 每 5 分钟 OR subtask 变化
- sendResearchCompleteNotification()  // 单个卡片 + 3 按钮
- sendResearchFailedNotification()
- sendMonitorTriggerNotification()
- sendMonitorSuggestionNotification()

// ✅ 进度通知逻辑
const shouldNotify = 
  (progress.subtask && displayMessage !== notifyState.lastNotifiedSubtask) ||
  (elapsedMinutes % 5 === 0 && ...);

// ✅ 完成通知卡片
- 核心摘要（前 300 字）
- 时间 + 耗时 + 模式
- 3 个按钮：查看报告/创建监控/追问问题
- 本地生成追问问题（避免重复已研究内容）

// ✅ 失败通知
- 失败类型：timeout/aborted/error/unknown
- 友好的错误提示 + 重试建议
```

#### 新版现状
- ✅ 已实现启动通知
- ✅ 已实现进度通知（修复后）
- ✅ 已实现完成通知（增强版）
- ✅ 已实现失败通知
- ❌ 无监控建议通知

#### 迁移建议
**P0 - 已完成**：
1. ✅ 启动通知
2. ✅ 进度通知（每 5 分钟/subtask 变化）
3. ✅ 完成通知（含追问问题）
4. ✅ 失败通知

**P1 - 待实现**：
5. ✅ 监控建议通知（研究完成后推荐监控）

---

### 4️⃣ 按钮/交互处理

#### 旧版逻辑（buttonHandler.js）
```javascript
// ✅ 按钮类型
- create_monitor: 创建监控
- view_more_monitors: 查看更多监控建议
- dismiss_monitor_suggestion: 隐藏监控建议
- list_monitors: 查看监控列表
- manage_monitor: 管理监控（暂停/删除）
- follow_up: 追问问题
- view_task_status: 查看任务状态
- deep_research: 从监控触发深度研究

// ✅ 处理逻辑
async function handleButtonClick(event) {
  switch (action) {
    case 'create_monitor':
      // 1. 获取监控配置
      // 2. 创建监控
      // 3. 记录用户偏好
      // 4. 发送成功通知
      break;
    case 'follow_up':
      // 启动新的研究任务
      break;
    // ...
  }
}
```

#### 新版现状
- ⚠️ 有 `handleCardAction()` 但只支持 `create_monitor`
- ❌ 无追问问题处理
- ❌ 无任务状态查看
- ❌ 无监控管理

#### 迁移建议
**P1 - 强烈建议**：
1. ✅ 追问问题处理（`follow_up` 按钮）
2. ✅ 任务状态查看（`view_task_status` 按钮）
3. ✅ 监控管理（`manage_monitor` 按钮）

**P2 - 可选**：
4. ⏸️ 查看更多监控建议
5. ⏸️ 隐藏监控建议

---

### 5️⃣ 工具函数对比

| 工具函数 | 旧版 | 新版 | 迁移状态 |
|---------|------|------|---------|
| 原子写入 | ✅ | ✅ | ✅ 已迁移 |
| JSON 修复 | ✅ | ✅ | ✅ 已迁移 |
| 监控模板 | ✅ | ✅ | ✅ 已迁移 |
| 智能触发 | ✅ | ⚠️ | ⚠️ 需增强 |
| 数据源 | ✅ Tavily/QVeris | ❌ | ❌ 需实现 |
| OpenClaw 工具 | ✅ | ❌ | ❌ 需实现 |
| 用户偏好 | ✅ | ❌ | ❌ 需实现 |
| 错误处理 | ✅ | ❌ | ❌ 需实现 |
| 日志 | ✅ | ❌ | ❌ 需实现 |

---

## 📋 迁移推进计划

### Phase 1 - P0 核心能力（本周）

| 任务 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
| 1.1 | 任务状态枚举 + 取消任务 | P0 | ❌ |
| 1.2 | 监控守护进程（backgroundJobs） | P0 | ❌ |
| 1.3 | 智能触发评估 | P0 | ❌ |
| 1.4 | 追问问题按钮处理 | P0 | ❌ |
| 1.5 | 任务状态查看按钮 | P0 | ❌ |

### Phase 2 - P1 用户体验（下周）

| 任务 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
| 2.1 | 监控建议通知 | P1 | ❌ |
| 2.2 | 监控管理（暂停/删除） | P1 | ❌ |
| 2.3 | 索引文件优化 | P1 | ❌ |
| 2.4 | 错误处理 + 日志 | P1 | ❌ |
| 2.5 | OpenClaw Cron 集成 | P1 | ❌ |

### Phase 3 - P2 优化增强（后续）

| 任务 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
| 3.1 | 用户偏好学习 | P2 | ⏸️ |
| 3.2 | 查看更多监控建议 | P2 | ⏸️ |
| 3.3 | 多轮对话支持 | P2 | ⏸️ |
| 3.4 | 个性化推荐 | P2 | ⏸️ |

---

## 🎯 当前进度

### ✅ 已完成
- [x] 启动通知
- [x] 进度通知（每 5 分钟/subtask 变化）
- [x] 完成通知（含追问问题）
- [x] 失败通知
- [x] 原子写入 + JSON 修复
- [x] 通知辅助函数

### ❌ 待实现
- [ ] 任务管理（取消任务、状态枚举）
- [ ] 监控守护进程
- [ ] 智能触发评估
- [ ] 按钮处理（追问、查看状态）
- [ ] 监控管理

---

## 📝 下一步行动

**立即执行**：
1. 实现任务状态枚举 + 取消任务功能
2. 实现监控守护进程（用 OpenClaw backgroundJobs）
3. 实现按钮处理（追问问题、查看状态）

**验证标准**：
- ✅ 用户说"不要了"能取消任务
- ✅ 监控能自动检查并推送通知
- ✅ 点击"追问问题"能启动新研究

---

**生成时间**: 2026-03-12 09:20
**基于**: 旧版 cuebot 代码分析 + 新版 cue-research 现状
