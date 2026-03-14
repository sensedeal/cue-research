/**
 * 命令响应自动化测试
 * 测试所有命令的响应是否符合预期
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

const TEST_CHAT_ID = 'ou_test_auto_command';
const WORKSPACE_DIR = `/root/.openclaw/workspaces/feishu-${TEST_CHAT_ID}`;

describe('Command Response Tests', () => {
  beforeEach(async () => {
    // 清理测试环境
    await fs.remove(WORKSPACE_DIR);
    await fs.ensureDir(WORKSPACE_DIR);
  });

  const testCases = [
    {
      name: '/ch - 帮助菜单',
      command: 'ch',
      args: [],
      expectContains: ['Cue Research', '/cue', '/ct', '/cm'],
      expectNotContains: []
    },
    {
      name: '/ct - 无任务时',
      command: 'ct',
      args: [],
      expectContains: ['暂无', '任务'],
      expectNotContains: ['错误', '失败']
    },
    {
      name: '/cm - 无监控时',
      command: 'cm',
      args: [],
      expectContains: ['监控'],
      expectNotContains: ['错误']
    },
    {
      name: '/cm add - 创建监控',
      command: 'cm',
      args: ['add', '测试监控'],
      expectContains: ['✅', '成功', '测试监控'],
      expectNotContains: ['错误', '失败']
    },
    {
      name: '/cn - 查询通知',
      command: 'cn',
      args: ['7'],
      expectContains: ['暂无', '通知'],
      expectNotContains: ['错误']
    },
    {
      name: '/key - 查看密钥状态',
      command: 'key',
      args: [],
      expectContains: ['API', 'Key'],
      expectNotContains: []
    },
    {
      name: '/cue - 空参数',
      command: 'cue',
      args: [],
      expectContains: ['⚠️', '请提供'],
      expectNotContains: []
    },
    {
      name: '/cue - 参数太短',
      command: 'cue',
      args: ['分'],
      expectContains: ['⚠️', '请提供'],
      expectNotContains: []
    }
  ];

  testCases.forEach(testCase => {
    it(testCase.name, async () => {
      const module = await import('../../src/index.js');
      let replyContent = '';
      
      const mockContext = {
        reply: (msg) => {
          replyContent = msg;
          return msg;
        },
        command: testCase.command,
        args: testCase.args,
        user: { id: TEST_CHAT_ID },
        channel: 'feishu',
        secrets: { CUECUE_API_KEY: 'test-key' }
      };
      
      await module.default.onCommand(mockContext);
      
      // 验证响应内容
      testCase.expectContains.forEach(text => {
        expect(replyContent).toContain(text);
      });
      
      testCase.expectNotContains.forEach(text => {
        expect(replyContent).not.toContain(text);
      });
    });
  });
});
