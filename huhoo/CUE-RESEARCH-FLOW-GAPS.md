# 🔄 Cue Research 流程差距分析

**分析日期:** 2026-03-12  
**方法:** 对比旧版完整流程，找出新版缺失的细节

---

## 📊 流程对比

### 流程 1: 用户发起调研

#### 旧版 cuebot (完整)

```
用户消息
  ↓
onMessage
  ↓
detectResearchIntent (NLU 意图识别)
  ↓
handleResearchCommand
  ↓
1. 检查 API Key ✅
2. 创建 taskId ✅
3. 检测研究模式 ✅
4. 写入任务文件 ✅
5. 发送启动通知 ✅
6. 后台执行
   ├─ 调用 API ✅
   ├─ 更新进度 ✅
   └─ 发送完成通知 ❌ (卡片内容不完整)
```

#### 新版 cue-research

**缺失的细节:**
- ❌ 完成通知的卡片内容 (只有框架，没有实际内容)
- ❌ 任务失败后的处理逻辑 (有 Bug)

---

### 流程 2: 查询任务状态 (/ct)

#### 旧版 cuebot (完整)

```
/ct 命令
  ↓
handleTaskStatus
  ↓
1. 读取用户的任务目录
2. 过滤出 running 状态的任务
3. 按时间排序
4. 生成状态卡片
   ├─ 任务主题
   ├─ 当前进度
   ├─ 开始时间
   ├─ 预计剩余时间
   └─ 取消按钮
5. 发送卡片
```

#### 新版 cue-research

**当前代码:**
```javascript
export async function handleTaskStatus(context) {
  return context.reply('📊 任务状态查询功能正常，具体数据接入存储层即可。');  // ❌ 占位文本
}
```

**缺失的细节:**
- ❌ 读取任务目录的逻辑
- ❌ 过滤 running 状态的逻辑
- ❌ 生成状态卡片的逻辑
- ❌ 取消按钮的集成

---

### 流程 3: 取消任务 (/cancel)

#### 旧版 cuebot (完整)

```
/cancel 命令 或 点击"取消任务"按钮
  ↓
handleCancelTask
  ↓
1. 获取当前运行中的任务
2. 更新状态为 cancelled
3. 如果是后台子 Agent，发送停止信号
4. 更新任务文件
5. 发送取消确认通知
```

#### 新版 cue-research

**当前代码:** 无

**缺失的细节:**
- ❌ 整个取消流程
- ❌ 后台任务停止机制
- ❌ 取消确认通知

---

### 流程 4: 监控管理 (/cm)

#### 旧版 cuebot (完整)

```
/cm add <主题>
  ↓
handleMonitorAdd
  ↓
1. 智能推荐监控模板
   ├─ 分析主题关键词
   ├─ 匹配预设模板
   └─ 返回最相关的 1-3 个模板
2. 用户选择模板 (或直接使用默认)
3. 创建监控项
   ├─ 生成 monitorId
   ├─ 写入监控文件
   ├─ 设置触发条件
   └─ 设置通知偏好
4. 发送创建成功卡片
   ├─ 监控主题
   ├─ 触发条件
   ├─ 通知频率
   └─ 启停/删除按钮

/cm list
  ↓
handleMonitorList
  ↓
1. 读取所有监控项
2. 按状态分组 (活跃/暂停)
3. 生成列表卡片
4. 发送卡片

/cm toggle <id>
  ↓
handleMonitorToggle
  ↓
1. 找到监控项
2. 切换 isActive 状态
3. 更新文件
4. 发送确认通知

/cm delete <id>
  ↓
handleMonitorDelete
  ↓
1. 找到监控项
2. 删除文件
3. 发送确认通知
```

#### 新版 cue-research

**当前代码:**
```javascript
// handleCardAction 中只有 create_monitor
if (actionData.action === 'create_monitor') {
  // ✅ 只有这一个
}
```

**缺失的细节:**
- ❌ 智能推荐模板逻辑
- ❌ 监控创建完整流程
- ❌ 监控列表生成
- ❌ 监控启停逻辑
- ❌ 监控删除逻辑
- ❌ 所有相关卡片内容

---

### 流程 5: 监控守护进程 (Cron)

#### 旧版 cuebot (完整)

```
每 30 分钟触发
  ↓
monitor-daemon.js
  ↓
1. 读取所有活跃监控项
2. 对每个监控:
   ├─ 检查最后触发时间
   ├─ 检查触发条件
   └─ 如果触发:
       ├─ 调用 API 发起调研
       ├─ 记录触发历史
       └─ 发送通知
3. 清理过期监控
4. 生成执行报告
```

#### 新版 cue-research

**当前配置:**
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

**缺失的细节:**
- ❌ `runMonitorCheck` 函数本身
- ❌ 读取监控项的逻辑
- ❌ 检查触发条件的逻辑
- ❌ 自动发起调研的逻辑
- ❌ 发送通知的逻辑
- ❌ 清理过期监控的逻辑

---

### 流程 6: 卡片按钮交互

#### 旧版 cuebot (完整)

```
用户点击卡片按钮
  ↓
onCardAction
  ↓
buttonHandler.js
  ↓
switch (action.type):
  case 'cancel_task':
    handleCancelTask()
  case 'create_monitor':
    handleCreateMonitor()
  case 'view_report':
    handleViewReport()
  case 'dismiss_notification':
    handleDismissNotification()
  case 'monitor_toggle':
    handleMonitorToggle()
  case 'monitor_delete':
    handleMonitorDelete()
```

#### 新版 cue-research

**当前代码:**
```javascript
export async function handleCardAction(context) {
  const { actionData, reply } = context;
  if (actionData.action === 'create_monitor') {
    // ✅ 只有这一个
  }
}
```

**缺失的细节:**
- ❌ cancel_task 处理
- ❌ view_report 处理
- ❌ dismiss_notification 处理
- ❌ monitor_toggle 处理
- ❌ monitor_delete 处理

---

### 流程 7: 通知发送

#### 旧版 cuebot (完整)

```
研究完成
  ↓
sendResearchCompleteNotification
  ↓
1. 生成报告摘要
   ├─ 提取核心观点
   ├─ 提取关键数据
   └─ 提取来源链接
2. 生成卡片内容
   ├─ 标题
   ├─ 摘要 (300 字)
   ├─ 核心观点 (列表)
   ├─ 完整报告链接
   └─ 开启监控按钮
3. 发送通知
```

#### 新版 cue-research

**当前代码:**
```javascript
await context.reply(buildResearchCompleteCard(topic, reportUrl, 15));
// ❌ buildResearchCompleteCard 只有框架，没有实际内容生成逻辑
```

**缺失的细节:**
- ❌ 报告摘要生成
- ❌ 核心观点提取
- ❌ 卡片内容格式化
- ❌ 监控推荐逻辑

---

## 📊 完整差距清单

### P0 - 核心流程缺失

| 流程 | 缺失环节 | 工作量 |
|------|----------|--------|
| **调研流程** | 完成通知卡片内容 | 1h |
| **任务状态** | 完整查询逻辑 | 1h |
| **取消任务** | 完整取消流程 | 0.5h |
| **监控管理** | add/list/toggle/delete | 3h |
| **监控守护** | runMonitorCheck 完整实现 | 2h |
| **卡片交互** | 6 种按钮事件处理 | 1h |
| **通知发送** | 报告摘要生成 | 1h |

**总计:** 约 9.5 小时

---

## 🎯 核心问题

**新版的问题不是"缺少模块"，而是:**

1. ❌ **流程细节没实现** - 有框架，没有具体逻辑
2. ❌ **函数是占位文本** - 如 `handleTaskStatus` 返回占位文本
3. ❌ **配置了但没实现** - 如 `backgroundJobs` 配置了但 `runMonitorCheck` 不存在
4. ❌ **卡片只有框架** - 如 `buildResearchCompleteCard` 没有内容生成逻辑

---

## 🚀 实现优先级

### 第一阶段 (立即)
1. ✅ 实现 `runMonitorCheck` (监控功能核心)
2. ✅ 实现任务状态查询 (`/ct` 命令)
3. ✅ 实现取消任务 (`/cancel` 命令)

### 第二阶段 (本周)
4. ✅ 实现监控管理 (`/cm` 命令)
5. ✅ 实现卡片按钮处理 (6 种事件)

### 第三阶段 (下周)
6. ✅ 完善通知内容生成 (报告摘要)

---

**需要我立即实现哪个流程？** 🤖
