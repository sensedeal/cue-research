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
    if (error.code !== 'ENOENT') {
      try { await fs.move(filePath, `${filePath}.corrupted`, { overwrite: true }); } catch(e){}
    }
    return fallback;
  }
}
