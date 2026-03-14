# 📋 Cue Research 改进清单

**参考:** 旧版 cuebot v1.0.6 (已跑通)  
**目标:** cue-research v1.0.0 (保持架构，逐步改进)

---

## 🎯 改进清单 (按优先级排序)

### P0 - 关键功能 (必须改进)

#### 1. 原子写入保护 ⭐⭐⭐⭐⭐

**问题:** 当前 `atomicWriteJson` 没有临时文件 + 验证机制

**参考:** `old-cuebot/src/core/taskManager.js` Line 36-46

```javascript
async function atomicWriteJson(filePath, data, options = {}) {
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

**改进位置:** `cue-research/src/utils/storage.js`

---

#### 2. JSON 损坏自动修复 ⭐⭐⭐⭐⭐

**问题:** 没有 JSON 损坏恢复机制

**参考:** `old-cuebot/src/core/taskManager.js` Line 53-120

```javascript
async function safeReadJson(filePath, fallback = null) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    
    if (error.name === 'SyntaxError' || error.message?.includes('Unexpected')) {
      logger.warn(`JSON file corrupted: ${filePath}, attempting recovery...`);
      
      // 尝试 1: 正则匹配第一个完整 JSON 对象
      const jsonMatch = content.match(/^\s*(\{[\s\S]*?\})\s*(?:\n|$)/m);
      // 尝试 2: 截取到最后一个完整的 `}`
      // 尝试 3: 备份损坏文件并写入恢复数据
    }
    
    return fallback;
  }
}
```

**改进位置:** `cue-research/src/utils/storage.js`

---

#### 3. 飞书交互式卡片 ⭐⭐⭐⭐⭐

**问题:** 缺少飞书按钮交互支持

**参考:** `old-cuebot/src/ui/interactiveCards.js`

**需要添加:**
- ✅ 调研完成卡片 (带"开启监控"按钮)
- ✅ 监控创建卡片 (带"立即调研"按钮)
- ✅ 通知卡片 (带"查看详情"按钮)
- ✅ 按钮事件处理

**改进位置:** `cue-research/src/ui/cards.js` + 新增 `src/handlers/buttonHandler.js`

---

### P1 - 重要功能 (强烈建议)

#### 4. 后台 Cron 任务 ⭐⭐⭐⭐

**问题:** 缺少后台守护进程

**参考:** `old-cuebot/src/cron/monitor-daemon.js`

**需要添加:**
- [ ] 每 30 分钟检查监控项
- [ ] 自动触发调研
- [ ] 发送通知

**改进位置:** 新增 `cue-research/src/cron/monitor-daemon.js`

**OpenClaw 配置:** `package.json` 中添加：
```json
"backgroundJobs": [
  {
    "name": "monitor-daemon",
    "schedule": "*/30 * * * *",
    "action": "runMonitorCheck"
  }
]
```

---

#### 5. 多平台适配器 ⭐⭐⭐⭐

**问题:** 只支持飞书

**参考:** `old-cuebot/src/adapters/`

**需要添加:**
- [ ] `BaseAdapter.js` - 基础适配器接口
- [ ] `FeishuAdapter.js` - 飞书适配器
- [ ] `TelegramAdapter.js` - Telegram 适配器
- [ ] `DiscordAdapter.js` - Discord 适配器

**改进位置:** 新增 `cue-research/src/adapters/` 目录

---

#### 6. 用户状态管理 ⭐⭐⭐⭐

**问题:** 缺少用户状态追踪

**参考:** `old-cuebot/src/core/userState.js`

**需要添加:**
- [ ] 用户偏好设置
- [ ] 使用历史记录
- [ ] 待确认状态管理

**改进位置:** 新增 `cue-research/src/core/userState.js`

---

### P2 - 优化功能 (建议改进)

#### 7. 智能触发机制 ⭐⭐⭐

**问题:** NLU 意图识别较简单

**参考:** `old-cuebot/src/utils/smartTrigger.js`

**需要添加:**
- [ ] 相似度计算
- [ ] 置信度阈值
- [ ] 需要确认的边界情况

**改进位置:** `cue-research/src/core/intent.js`

---

#### 8. 监控模板系统 ⭐⭐⭐

**问题:** 监控创建需要手动配置

**参考:** `old-cuebot/src/utils/monitorTemplates.js`

**需要添加:**
- [ ] 预设监控模板 (财经/科技/政策)
- [ ] 智能推荐监控
- [ ] 模板配置系统

**改进位置:** 新增 `cue-research/src/utils/monitorTemplates.js`

---

#### 9. 通知队列 ⭐⭐⭐

**问题:** 通知发送没有队列管理

**参考:** `old-cuebot/src/utils/notificationQueue.js`

**需要添加:**
- [ ] 通知队列管理
- [ ] 批量发送
- [ ] 失败重试

**改进位置:** 新增 `cue-research/src/utils/notificationQueue.js`

---

### P3 - 测试与文档 (重要但不紧急)

#### 10. 完整测试覆盖 ⭐⭐⭐

**参考:** `old-cuebot/tests/`

**需要添加:**
- [ ] 单元测试 (vitest)
- [ ] 集成测试
- [ ] E2E 测试 (完整流程)
- [ ] 测试覆盖率报告

**改进位置:** `cue-research/tests/`

**测试框架:** 使用 vitest (参考 `old-cuebot/vitest.config.js`)

---

#### 11. 错误处理增强 ⭐⭐

**参考:** `old-cuebot/src/core/errorHandler.js`

**需要添加:**
- [ ] 统一错误处理中间件
- [ ] 错误格式化
- [ ] 错误日志分类

**改进位置:** `cue-research/src/core/errorHandler.js`

---

#### 12. 日志系统增强 ⭐⭐

**参考:** `old-cuebot/src/core/logger.js`

**需要添加:**
- [ ] 日志级别 (debug/info/warn/error)
- [ ] 日志文件轮转
- [ ] 日志格式化

**改进位置:** `cue-research/src/core/logger.js`

---

## 📊 改进优先级总结

| 优先级 | 功能 | 工作量 | 价值 |
|--------|------|--------|------|
| **P0** | 原子写入保护 | 1h | ⭐⭐⭐⭐⭐ |
| **P0** | JSON 损坏修复 | 1h | ⭐⭐⭐⭐⭐ |
| **P0** | 飞书交互卡片 | 2h | ⭐⭐⭐⭐⭐ |
| **P1** | 后台 Cron 任务 | 2h | ⭐⭐⭐⭐ |
| **P1** | 多平台适配器 | 4h | ⭐⭐⭐⭐ |
| **P1** | 用户状态管理 | 2h | ⭐⭐⭐⭐ |
| **P2** | 智能触发 | 2h | ⭐⭐⭐ |
| **P2** | 监控模板 | 2h | ⭐⭐⭐ |
| **P2** | 通知队列 | 2h | ⭐⭐⭐ |
| **P3** | 完整测试 | 4h | ⭐⭐⭐ |
| **P3** | 错误处理 | 1h | ⭐⭐ |
| **P3** | 日志系统 | 1h | ⭐⭐ |

**总计:** 约 24 小时工作量

---

## 🚀 建议实施顺序

### 第一阶段 (本周)
1. ✅ 原子写入保护 (P0)
2. ✅ JSON 损坏修复 (P0)
3. ✅ 飞书交互卡片 (P0)

### 第二阶段 (下周)
4. ✅ 后台 Cron 任务 (P1)
5. ✅ 用户状态管理 (P1)

### 第三阶段 (下下周)
6. ✅ 智能触发 (P2)
7. ✅ 监控模板 (P2)
8. ✅ 完整测试 (P3)

---

## 📝 参考文件

**旧版 cuebot 关键文件:**

```
old-cuebot/
├── src/
│   ├── core/
│   │   ├── taskManager.js        # 原子写入 + JSON 修复
│   │   ├── monitorManager.js     # 监控管理
│   │   ├── userState.js          # 用户状态
│   │   ├── backgroundExecutor.js # 后台执行
│   │   └── errorHandler.js       # 错误处理
│   ├── ui/
│   │   └── interactiveCards.js   # 飞书交互卡片
│   ├── handlers/
│   │   └── buttonHandler.js      # 按钮事件处理
│   ├── utils/
│   │   ├── fileUtils.js          # 文件工具
│   │   ├── smartTrigger.js       # 智能触发
│   │   ├── monitorTemplates.js   # 监控模板
│   │   └── notificationQueue.js  # 通知队列
│   └── cron/
│       ├── monitor-daemon.js     # 监控守护
│       └── research-worker.js    # 研究工作者
└── tests/                        # 完整测试
```

---

**需要我帮你实现哪个改进？我可以逐个完成！** 🤖
