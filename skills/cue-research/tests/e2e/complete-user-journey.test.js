/**
 * E2E 完整用户旅程测试
 * 测试从安装到使用的全流程
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

const TEST_CHAT_ID = 'ou_test_e2e_user';
const WORKSPACE_DIR = `/root/.openclaw/workspaces/feishu-${TEST_CHAT_ID}`;

describe('E2E Complete User Journey', () => {
  beforeEach(async () => {
    // 清理测试环境
    await fs.remove(WORKSPACE_DIR);
    await fs.ensureDir(WORKSPACE_DIR);
  });

  describe('阶段 1: 安装与配置', () => {
    it('应该能加载模块', async () => {
      const module = await import('../../src/index.js');
      expect(module.default).toBeDefined();
      expect(module.default.name).toBe('cue-research');
    });

    it('应该有所有必需的钩子函数', async () => {
      const module = await import('../../src/index.js');
      expect(module.default.onCommand).toBeDefined();
      expect(module.default.onMessage).toBeDefined();
      expect(module.default.onCardAction).toBeDefined();
      expect(module.default.onCron).toBeDefined();
    });
  });

  describe('阶段 2: 帮助命令', () => {
    it('/ch 应该返回帮助菜单', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        command: 'ch',
        args: []
      };
      
      await module.default.onCommand(mockContext);
      
      expect(replyContent).toContain('Cue Research');
      expect(replyContent).toContain('/cue');
      expect(replyContent).toContain('/ct');
      expect(replyContent).toContain('/cm');
    });
  });

  describe('阶段 3: NLU 唤醒', () => {
    it('应该识别调研意图', async () => {
      const { detectResearchIntent } = await import('../../src/core/intent.js');
      
      const testCases = [
        { input: '帮我分析宁德时代', shouldTrigger: true },
        { input: '研究一下 AI 行业', shouldTrigger: true },
        { input: '你好', shouldTrigger: false }
      ];
      
      for (const tc of testCases) {
        const result = detectResearchIntent(tc.input);
        const triggered = result?.shouldTrigger || false;
        expect(triggered).toBe(tc.shouldTrigger);
      }
    });
  });

  describe('阶段 4: 任务状态查询', () => {
    it('/ct 应该显示任务列表', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        command: 'ct',
        args: [],
        user: { id: TEST_CHAT_ID },
        channel: 'feishu'
      };
      
      await module.default.onCommand(mockContext);
      
      expect(replyContent).toContain('暂无研究任务');
    });
  });

  describe('阶段 5: 监控功能', () => {
    it('/cm add 应该创建监控', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        command: 'cm',
        args: ['add', '测试监控'],
        user: { id: TEST_CHAT_ID },
        channel: 'feishu'
      };
      
      await module.default.onCommand(mockContext);
      
      expect(replyContent).toContain('✅');
      expect(replyContent).toContain('测试监控');
    });

    it('/cm 应该显示监控列表', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      // 先创建一个监控
      const createContext = {
        reply: () => {},
        command: 'cm',
        args: ['add', '测试监控'],
        user: { id: TEST_CHAT_ID },
        channel: 'feishu'
      };
      await module.default.onCommand(createContext);
      
      // 查询列表
      const listContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        command: 'cm',
        args: [],
        user: { id: TEST_CHAT_ID },
        channel: 'feishu'
      };
      await module.default.onCommand(listContext);
      
      expect(replyContent).toContain('测试监控');
    });
  });

  describe('阶段 6: 卡片交互', () => {
    it('应该处理 create_monitor 按钮', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        actionData: { action: 'create_monitor', topic: '测试', template: 'industry' }
      };
      
      await module.default.onCardAction(mockContext);
      
      expect(replyContent).toContain('✅');
    });
  });

  describe('阶段 7: 监控守护', () => {
    it('runMonitorCheck 应该能执行', async () => {
      const { runMonitorCheck } = await import('../../src/core/monitor.js');
      
      const mockContext = {
        user: { id: TEST_CHAT_ID },
        channel: 'feishu',
        secrets: { CUECUE_API_KEY: 'test-key' }
      };
      
      await expect(runMonitorCheck(mockContext)).resolves.not.toThrow();
    });
  });

  describe('阶段 8: 错误处理', () => {
    it('应该处理空 topic', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        command: 'cue',
        args: []
      };
      
      await module.default.onCommand(mockContext);
      
      expect(replyContent).toContain('⚠️');
      expect(replyContent).toContain('请提供');
    });

    it('应该处理短 topic', async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        command: 'cue',
        args: ['分']
      };
      
      await module.default.onCommand(mockContext);
      
      expect(replyContent).toContain('⚠️');
    });
  });
});
