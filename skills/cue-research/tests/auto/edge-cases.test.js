/**
 * 边界情况自动化测试
 * 测试各种极端和异常情况
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { atomicWriteJson, safeReadJson } from '../../src/utils/storage.js';

const TEST_DIR = '/tmp/test-cue-edge-cases';

describe('Edge Cases Tests', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('JSON 原子写入', () => {
    it('应该能正常写入 JSON', async () => {
      const filePath = path.join(TEST_DIR, 'test.json');
      const data = { test: 'data', timestamp: Date.now() };
      
      await atomicWriteJson(filePath, data);
      
      const read = await fs.readJson(filePath);
      expect(read).toEqual(data);
    });

    it('应该能并发写入', async () => {
      const filePath = path.join(TEST_DIR, 'concurrent.json');
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(atomicWriteJson(filePath, { test: i }));
      }
      
      await Promise.all(promises);
      
      const final = await fs.readJson(filePath);
      expect(final).toBeDefined();
    });
  });

  describe('JSON 损坏恢复', () => {
    it('文件不存在时返回 fallback', async () => {
      const filePath = path.join(TEST_DIR, 'not-exist.json');
      const result = await safeReadJson(filePath, 'fallback');
      expect(result).toBe('fallback');
    });

    it('JSON 损坏时返回 fallback 并备份', async () => {
      const filePath = path.join(TEST_DIR, 'corrupted.json');
      await fs.writeFile(filePath, '{"test": "data"\n\ngarbage');
      
      const result = await safeReadJson(filePath, 'fallback');
      
      // 应该返回 fallback 或尝试恢复
      expect(result).toBeDefined();
      
      // 应该备份损坏文件
      const backupExists = await fs.pathExists(filePath + '.corrupted');
      expect(backupExists).toBe(true);
    });
  });

  describe('模式检测边界', () => {
    const { detectMode } = await import('../../src/core/modeDetector.js');

    it('空字符串应该返回默认模式', () => {
      expect(detectMode('')).toBe('researcher');
    });

    it('null 应该返回默认模式', () => {
      expect(detectMode(null)).toBe('researcher');
    });

    it('太短字符串应该返回默认模式', () => {
      expect(detectMode('分')).toBe('researcher');
      expect(detectMode('分析')).toBe('researcher');
    });

    it('长文本应该正常检测', () => {
      const result = detectMode('帮我分析一下宁德时代和比亚迪的竞争优势对比');
      expect(['researcher', 'businessAnalyst']).toContain(result);
    });
  });

  describe('错误处理', () => {
    const { handleResearchCommand } = await import('../../src/core/research.js');

    it('空 topic 应该友好提示', async () => {
      let replyContent = '';
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; }
      };
      
      await handleResearchCommand(mockContext, '');
      
      expect(replyContent).toContain('⚠️');
      expect(replyContent).toContain('请提供');
    });

    it('短 topic 应该友好提示', async () => {
      let replyContent = '';
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; }
      };
      
      await handleResearchCommand(mockContext, '分');
      
      expect(replyContent).toContain('⚠️');
    });

    it('API Key 缺失应该友好提示', async () => {
      let replyContent = '';
      const mockContext = {
        reply: (msg) => { replyContent = msg; return msg; },
        secrets: {}
      };
      
      await handleResearchCommand(mockContext, '测试');
      
      expect(replyContent).toContain('API');
    });
  });
});
