import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export function getUserWorkspace(context) {
  const baseDir = context.env?.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw/workspaces');
  const userId = context.user?.id || 'unknown';
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error('Invalid User ID');
  return path.join(baseDir, `${context.channel || 'default'}-${userId}`, '.cuecue');
}

export async function atomicWriteJson(filePath, data) {
  const randomId = crypto.randomUUID().split('-')[0];
  const tmpPath = `${filePath}.${Date.now()}_${randomId}.tmp`;
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(tmpPath, data, { spaces: 2 });
  await fs.move(tmpPath, filePath, { overwrite: true });
}

export async function safeReadJson(filePath, fallback = null) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    // 文件不存在
    if (error.code === 'ENOENT') {
      return fallback;
    }
    
    // JSON 解析错误，尝试恢复
    if (error.name === 'SyntaxError' || error.message?.includes('Unexpected')) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        // 尝试提取第一个完整的 JSON 对象
        const jsonMatch = content.match(/^\\s*(\\{[\\s\\S]*?\\})\\s*(?:\\n|$)/m);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const recovered = JSON.parse(jsonMatch[1]);
            // 备份损坏文件
            await fs.move(filePath, `${filePath}.corrupted`, { overwrite: true });
            // 写入恢复的数据
            await fs.writeJson(filePath, recovered, { spaces: 2 });
            console.log(`[Storage] JSON recovered: ${filePath}`);
            return recovered;
          } catch (e) {
            // 恢复失败
          }
        }
      } catch (recoverError) {
        console.warn(`[Storage] Recovery failed: ${filePath}`, recoverError.message);
      }
    }
    
    // 备份损坏文件
    try { await fs.move(filePath, `${filePath}.corrupted`, { overwrite: true }); } catch(e){}
    return fallback;
  }
}
