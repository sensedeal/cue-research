# 🔄 旧版 cuebot 整合到 cue-research 方案

**分析日期:** 2026-03-12  
**旧版:** cuebot v1.0.6 (已跑通，功能完整)  
**新版:** cue-research v1.0.0 (架构优秀，需要业务逻辑)

---

## 📊 代码对比分析

### 旧版优势 (cuebot v1.0.6)

| 维度 | 状态 | 说明 |
|------|------|------|
| **业务逻辑** | ✅ 完整 | 全部功能已实现并测试 |
| **功能模块** | ✅ 丰富 | 任务/监控/通知/用户状态 |
| **测试覆盖** | ✅ 完善 | 单元测试 + 集成测试 + E2E |
| **适配器** | ✅ 多平台 | Feishu/Telegram/Discord/Text |
| **交互卡片** | ✅ 飞书按钮 | 完整的交互式卡片支持 |
| **Cron 任务** | ✅ 后台守护 | monitor-daemon + research-worker |

### 新版优势 (cue-research v1.0.0)

| 维度 | 状态 | 说明 |
|------|------|------|
| **代码结构** | ✅ 优秀 | 清晰的模块化设计 |
| **ESM 支持** | ✅ 原生 | 完整的 ESM 模块系统 |
| **OpenClaw 集成** | ✅ 标准 | 符合 OpenClaw Skill 规范 |
| **文档** | ✅ 完整 | README/INSTALL/SKILL.md |
| **安全性** | ✅ 工作区隔离 | 无越权访问 |
| **性能** | ✅ 异步 I/O | 0 子进程开销 |

---

## 🎯 整合策略

### 方案：保留 cue-research 架构，注入 cuebot 业务逻辑

```
cue-research/ (目标架构)
├── src/
│   ├── api/
│   │   └── cuecueClient.js       ← 使用 cuebot 版本 (更成熟)
│   ├── core/
│   │   ├── research.js           ← 保留新版 (简化版)
│   │   ├── taskManager.js        ← 从 cuebot 移植 (带原子写入)
│   │   ├── monitorManager.js     ← 从 cuebot 移植 (带原子写入)
│   │   ├── userState.js          ← 从 cuebot 移植
│   │   ├── backgroundExecutor.js ← 从 cuebot 移植
│   │   ├── modeDetector.js       ← 合并两版 (新版模式 + 旧版逻辑)
│   │   └── intent.js             ← 从 cuebot 移植 (NLU 意图识别)
│   ├── handlers/
│   │   └── buttonHandler.js      ← 从 cuebot 移植 (飞书按钮)
│   ├── ui/
│   │   ├── cards.js              ← 保留新版
│   │   └── interactiveCards.js   ← 从 cuebot 移植 (交互式卡片)
│   ├── utils/
│   │   ├── fileUtils.js          ← 从 cuebot 移植 (原子写入)
│   │   ├── envUtils.js           ← 从 cuebot 移植
│   │   ├── smartTrigger.js       ← 从 cuebot 移植
│   │   └── monitorTemplates.js   ← 从 cuebot 移植
│   └── cron/
│       ├── monitor-daemon.js     ← 从 cuebot 移植
│       └── research-worker.js    ← 从 cuebot 移植
├── adapters/ (新增)
│   ├── BaseAdapter.js            ← 从 cuebot 移植
│   ├── FeishuAdapter.js          ← 从 cuebot 移植
│   └── MessageAdapter.js         ← 从 cuebot 移植
├── tests/ (合并)
│   ├── unit/                     ← 合并两版测试
│   ├── integration/              ← 合并两版测试
│   └── e2e/                      ← 合并两版测试
└── package.json                  ← 合并依赖 (使用 vitest)
```

---

## 📋 移植清单

### 核心模块 (高优先级)

- [ ] `src/core/taskManager.js` - 带原子写入的任务管理
- [ ] `src/core/monitorManager.js` - 监控管理
- [ ] `src/core/userState.js` - 用户状态管理
- [ ] `src/core/backgroundExecutor.js` - 后台执行器
- [ ] `src/core/intent.js` - NLU 意图识别
- [ ] `src/core/modeDetector.js` - 模式检测 (合并两版)

### API 客户端 (高优先级)

- [ ] `src/api/cuecueClient.js` - 使用 cuebot 版本 (更成熟)

### UI 组件 (高优先级)

- [ ] `src/ui/interactiveCards.js` - 飞书交互式卡片
- [ ] `src/handlers/buttonHandler.js` - 按钮事件处理

### 工具函数 (中优先级)

- [ ] `src/utils/fileUtils.js` - 文件工具 (原子写入)
- [ ] `src/utils/envUtils.js` - 环境变量工具
- [ ] `src/utils/smartTrigger.js` - 智能触发
- [ ] `src/utils/monitorTemplates.js` - 监控模板
- [ ] `src/utils/notificationQueue.js` - 通知队列

### Cron 任务 (中优先级)

- [ ] `src/cron/monitor-daemon.js` - 监控守护进程
- [ ] `src/cron/research-worker.js` - 研究工作者

### 适配器 (低优先级 - 可选)

- [ ] `adapters/BaseAdapter.js` - 基础适配器
- [ ] `adapters/FeishuAdapter.js` - 飞书适配器
- [ ] `adapters/MessageAdapter.js` - 消息适配器

### 测试 (中优先级)

- [ ] `tests/unit/` - 单元测试 (从 cuebot 移植)
- [ ] `tests/integration/` - 集成测试 (从 cuebot 移植)
- [ ] `tests/e2e/` - E2E 测试 (从 cuebot 移植)
- [ ] `vitest.config.js` - 测试配置

---

## 🔧 实施步骤

### Phase 1: 核心功能移植 (1-2 小时)

1. **复制核心模块**
   ```bash
   cp old-cuebot/cuebot-main/src/core/taskManager.js cue-research/src/core/
   cp old-cuebot/cuebot-main/src/core/monitorManager.js cue-research/src/core/
   cp old-cuebot/cuebot-main/src/core/userState.js cue-research/src/core/
   cp old-cuebot/cuebot-main/src/core/backgroundExecutor.js cue-research/src/core/
   ```

2. **复制 API 客户端**
   ```bash
   cp old-cuebot/cuebot-main/src/api/cuecueClient.js cue-research/src/api/
   ```

3. **复制 UI 组件**
   ```bash
   cp old-cuebot/cuebot-main/src/ui/interactiveCards.js cue-research/src/ui/
   cp old-cuebot/cuebot-main/src/handlers/buttonHandler.js cue-research/src/handlers/
   ```

4. **复制工具函数**
   ```bash
   cp old-cuebot/cuebot-main/src/utils/fileUtils.js cue-research/src/utils/
   cp old-cuebot/cuebot-main/src/utils/envUtils.js cue-research/src/utils/
   cp old-cuebot/cuebot-main/src/utils/smartTrigger.js cue-research/src/utils/
   cp old-cuebot/cuebot-main/src/utils/monitorTemplates.js cue-research/src/utils/
   ```

5. **复制 Cron 任务**
   ```bash
   cp old-cuebot/cuebot-main/src/cron/monitor-daemon.js cue-research/src/cron/
   cp old-cuebot/cuebot-main/src/cron/research-worker.js cue-research/src/cron/
   ```

### Phase 2: 代码适配 (1-2 小时)

1. **统一导入路径**
   - 确保所有 import 路径正确
   - 修复相对路径问题

2. **统一错误处理**
   - 合并两版的错误处理逻辑
   - 使用 cuebot 的 errorHandler

3. **统一日志系统**
   - 使用 cuebot 的 logger

4. **统一配置**
   - 合并 modeDetector 的模式定义
   - 统一意图识别逻辑

### Phase 3: 测试验证 (1 小时)

1. **运行单元测试**
   ```bash
   npm test
   ```

2. **运行集成测试**
   ```bash
   npm run test:integration
   ```

3. **运行 E2E 测试**
   ```bash
   npm run test:e2e
   ```

4. **真实场景测试**
   - 配置 API Key
   - 测试完整流程

### Phase 4: 文档更新 (30 分钟)

1. **更新 README.md**
   - 添加功能列表
   - 更新使用示例

2. **更新 INSTALL.md**
   - 更新安装步骤
   - 添加配置说明

3. **更新 SKILL.md**
   - 更新命令列表
   - 添加功能说明

---

## ✅ 完成标准

| 检查项 | 状态 |
|--------|------|
| 所有核心模块移植完成 | ⏸️ |
| 所有测试通过 | ⏸️ |
| 文档完整 | ⏸️ |
| 真实场景测试通过 | ⏸️ |
| 代码质量符合 cue-research 标准 | ⏸️ |

---

## 🎯 预期收益

**整合后的 cue-research 将拥有：**

1. ✅ **cue-research 的优秀架构** - 清晰、可维护
2. ✅ **cuebot 的完整功能** - 任务/监控/通知/交互
3. ✅ **完整的测试覆盖** - 单元/集成/E2E
4. ✅ **多平台支持** - 飞书/Telegram/Discord
5. ✅ **成熟的业务逻辑** - 已验证的功能
6. ✅ **完整的文档** - README/INSTALL/SKILL

---

**准备好开始整合了吗？** 🚀
