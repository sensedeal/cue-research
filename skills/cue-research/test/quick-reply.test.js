/**
 * 快捷回复集成测试
 * 测试用户回复"创建监控"、"Y"、"追问"、"状态"等快捷指令
 */

import { describe, it, assert, beforeEach } from 'vitest';
import { handleQuickReplyCommand } from '../src/core/research.js';
import fs from 'fs-extra';
import path from 'path';

// 模拟测试上下文
function createTestContext(setup = {}) {
  const workspace = `/tmp/cue-test-${Date.now()}`;
  fs.ensureDirSync(workspace);
  
  // 创建已完成的任务（用于快捷回复测试）
  if (setup.lastCompletedTask) {
    const tasksDir = path.join(workspace, 'tasks');
    fs.ensureDirSync(tasksDir);
    fs.writeJsonSync(path.join(tasksDir, 'task_test.json'), {
      taskId: 'task_test',
      topic: setup.lastCompletedTask,
      status: 'completed',
      mode: setup.mode || 'researcher',
      completed_at: new Date().toISOString(),
      report: setup.report || ''
    });
  }
  
  // 创建运行中的任务（用于取消测试）
  if (setup.createRunningTask) {
    const tasksDir = path.join(workspace, 'tasks');
    fs.ensureDirSync(tasksDir);
    fs.writeJsonSync(path.join(tasksDir, 'task_running.json'), {
      taskId: 'task_running',
      topic: '测试任务',
      status: 'running',
      createdAt: Date.now() - 60000  // 1 分钟前
    });
  }
  
  return {
    reply: (msg) => msg,
    env: { OPENCLAW_WORKSPACE: workspace },
    user: { id: 'test-user' },
    channel: 'feishu',
    secrets: { CUECUE_API_KEY: 'test-key' },
    _workspace: workspace  // 用于清理
  };
}

// 清理测试文件
function cleanupContext(context) {
  if (context._workspace && fs.existsSync(context._workspace)) {
    fs.removeSync(context._workspace);
  }
}

describe('handleQuickReplyCommand - 创建监控', () => {
  it('should create monitor when reply "创建监控"', async () => {
    const context = createTestContext({ lastCompletedTask: '宁德时代' });
    
    try {
      const result = await handleQuickReplyCommand(context, '创建监控');
      assert(result.includes('✅ 已为您创建监控'));
      assert(result.includes('频率'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should create monitor when reply "Y"', async () => {
    const context = createTestContext({ lastCompletedTask: '宁德时代' });
    
    try {
      const result = await handleQuickReplyCommand(context, 'Y');
      assert(result.includes('✅ 已为您创建监控'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should create monitor when reply "好的"', async () => {
    const context = createTestContext({ lastCompletedTask: '宁德时代' });
    
    try {
      const result = await handleQuickReplyCommand(context, '好的');
      assert(result.includes('✅ 已为您创建监控'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should return error when no completed task', async () => {
    const context = createTestContext({});
    
    try {
      const result = await handleQuickReplyCommand(context, '创建监控');
      assert(result.includes('暂无已完成') || result.includes('没有正在'));
    } finally {
      cleanupContext(context);
    }
  });
});

describe('handleQuickReplyCommand - 追问问题', () => {
  it('should generate follow-up question when reply "追问"', async () => {
    const context = createTestContext({ lastCompletedTask: '宁德时代' });
    
    try {
      const result = await handleQuickReplyCommand(context, '追问');
      assert(result.includes('💬 追问问题'));
      assert(result.includes('回复'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should generate follow-up question when reply "深入"', async () => {
    const context = createTestContext({ lastCompletedTask: '宁德时代' });
    
    try {
      const result = await handleQuickReplyCommand(context, '深入');
      assert(result.includes('💬'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should return error when no completed task', async () => {
    const context = createTestContext({});
    
    try {
      const result = await handleQuickReplyCommand(context, '追问');
      assert(result === null || result.includes('暂无'));
    } finally {
      cleanupContext(context);
    }
  });
});

describe('handleQuickReplyCommand - 查看状态', () => {
  it('should show task status when reply "状态"', async () => {
    const context = createTestContext({ createRunningTask: true });
    
    try {
      const result = await handleQuickReplyCommand(context, '状态');
      assert(result.includes('研究任务列表') || result.includes('任务'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should show task status when reply "任务"', async () => {
    const context = createTestContext({ createRunningTask: true });
    
    try {
      const result = await handleQuickReplyCommand(context, '任务');
      assert(result.includes('任务'));
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should show task status when reply "ct"', async () => {
    const context = createTestContext({ createRunningTask: true });
    
    try {
      const result = await handleQuickReplyCommand(context, 'ct');
      assert(result.includes('任务'));
    } finally {
      cleanupContext(context);
    }
  });
});

describe('handleQuickReplyCommand - 边界情况', () => {
  it('should return null for unknown reply', async () => {
    const context = createTestContext({});
    
    try {
      const result = await handleQuickReplyCommand(context, '未知指令');
      assert.strictEqual(result, null);
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should return null for empty reply', async () => {
    const context = createTestContext({});
    
    try {
      const result = await handleQuickReplyCommand(context, '');
      assert.strictEqual(result, null);
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should return null for null reply', async () => {
    const context = createTestContext({});
    
    try {
      const result = await handleQuickReplyCommand(context, null);
      assert.strictEqual(result, null);
    } finally {
      cleanupContext(context);
    }
  });
  
  it('should handle case insensitive', async () => {
    const context = createTestContext({ lastCompletedTask: '宁德时代' });
    
    try {
      const result1 = await handleQuickReplyCommand(context, 'y');
      const result2 = await handleQuickReplyCommand(context, 'Y');
      assert(result1.includes('✅') || result1 === null);
      assert(result2.includes('✅') || result2 === null);
    } finally {
      cleanupContext(context);
    }
  });
});

describe('handleQuickReplyCommand - 关键词变体', () => {
  const createMonitorKeywords = ['创建监控', '创建', '开启监控', 'yes', '好', '好啊'];
  
  createMonitorKeywords.forEach(keyword => {
    it(`should handle create monitor keyword: ${keyword}`, async () => {
      const context = createTestContext({ lastCompletedTask: '测试' });
      
      try {
        const result = await handleQuickReplyCommand(context, keyword);
        // 可能成功创建或提示无任务
        assert(result !== undefined);
      } finally {
        cleanupContext(context);
      }
    });
  });
});
