/**
 * API Key 配置管理
 * 基于 OpenClaw Secrets + 注册引导
 */

/**
 * 生成 API Key 配置状态卡片
 */
export function buildApiKeyStatusCard(configuredKeys) {
  let output = '╔══════════════════════════════════════════╗\n';
  output += '║           当前 API Key 配置状态           ║\n';
  output += '╠══════════════════════════════════════════╣\n';
  
  const services = [
    { name: 'CUECUE_API_KEY', label: 'CueCue 深度研究' },
    { name: 'TAVILY_API_KEY', label: 'Tavily 搜索' }
  ];
  
  for (const svc of services) {
    const isConfigured = configuredKeys.includes(svc.name);
    const status = isConfigured ? '✅' : '❌';
    const masked = isConfigured ? maskKey(configuredKeys.find(k => k.includes(svc.name))) : '未配置';
    output += `║  ${status} ${svc.label.padEnd(18)} ${masked.padEnd(24)} ║\n`;
  }
  
  output += '╠══════════════════════════════════════════╣\n';
  output += '║  🎁 注册福利                              ║\n';
  output += '║  访问 https://cuecue.cn 注册账号          ║\n';
  output += '║  注册即送 50 积分，每日还有 10 免费积分！  ║\n';
  output += '║                                          ║\n';
  output += '║  💡 发送 API Key 即可自动配置              ║\n';
  output += '║  格式：/key skb-xxxxxxxxxxxx              ║\n';
  output += '╚══════════════════════════════════════════╝\n';
  
  return output;
}

/**
 * 掩码 API Key（仅显示前后缀）
 */
function maskKey(key) {
  if (!key || key.length < 10) return '****';
  return `${key.substring(0, 6)}****${key.substring(key.length - 4)}`;
}

/**
 * 识别 API Key 类型
 */
export function detectKeyType(apiKey) {
  if (!apiKey) return null;
  
  const key = apiKey.trim();
  
  // CueCue: skbX- 或 sk- 开头
  if (/^skbX?-/i.test(key)) {
    return { type: 'CUECUE_API_KEY', name: 'CueCue' };
  }
  
  // Tavily: tvly- 开头
  if (/^tvly-/i.test(key)) {
    return { type: 'TAVILY_API_KEY', name: 'Tavily' };
  }
  
  // QVeris: sk- 开头且较长
  if (/^sk-[a-zA-Z0-9]{20,}/i.test(key)) {
    return { type: 'QVERIS_API_KEY', name: 'QVeris' };
  }
  
  return null;
}

/**
 * 生成 API Key 缺失时的引导消息
 */
export function buildApiKeyMissingGuide() {
  let output = '⚠️ 未配置 API Key，无法启动深度研究。\n\n';
  output += '👉 **快速开始**：\n';
  output += '1. 访问 https://cuecue.cn 注册账号\n';
  output += '2. 获取 API Key\n';
  output += '3. 发送 `/key <APIKey>` 完成配置\n\n';
  output += '🎁 **新用户福利**：注册送 50 积分，每日 10 积分\n';
  return output;
}

/**
 * 生成配置成功的消息
 */
export function buildKeyConfiguredSuccess(serviceName) {
  return `✅ ${serviceName} API Key 配置成功！\n\n密钥已保存并生效，无需重启。\n`;
}

/**
 * 生成配置失败的消息
 */
export function buildKeyConfigFailed() {
  return '❌ 无法识别 API Key 类型\n\n支持的格式：\n• CueCue: skbX-xxxxx 或 sk-xxxxx\n• Tavily: tvly-xxxxx\n• QVeris: sk-xxxxx (长格式)';
}
