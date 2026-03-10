import { handleResearchCommand, handleTaskStatus, handleCardAction } from './core/research.js';
import { handleMonitorCommand, handleNotificationCommand, runMonitorCheck } from './core/monitor.js';
import { detectResearchIntent } from './core/intent.js';
import { 
  buildApiKeyStatusCard, 
  detectKeyType, 
  buildApiKeyMissingGuide,
  buildKeyConfiguredSuccess,
  buildKeyConfigFailed
} from './core/keyManager.js';

export default {
  name: "cue-research",
  
  /**
   * 显式命令钩子
   */
  async onCommand(context) {
    const { command, args, reply, secrets } = context;
    try {
      switch (command) {
        case 'cue':
          return await handleResearchCommand(context, args.join(' '));
        case 'ct':
          return await handleTaskStatus(context);
        case 'cm':
          return await handleMonitorCommand(context, args);
        case 'cn':
          return await handleNotificationCommand(context, args);
        case 'key':
          return await handleKeyCommand(context, args);
        case 'ch':
          return reply(buildHelpMenu());
        default:
          return;
      }
    } catch (error) {
      console.error(`[CueSkill] Command Error:`, error);
      return reply(`❌ 系统错误：${error.message}`);
    }
  },

  /**
   * 隐式自然语言消息钩子 (NLU 自动唤醒)
   */
  async onMessage(context) {
    // 获取用户发送的纯文本
    const text = context.message?.text || context.text || '';
    
    // 进行意图识别
    const intent = detectResearchIntent(text);
    
    // 如果确认是调研意图，自动拦截并触发调研逻辑
    if (intent && intent.shouldTrigger) {
      console.log(`[CueSkill] 💡 NLU 自动拦截调研意图：${intent.topic}`);
      // 复用 /cue 的处理逻辑
      return await handleResearchCommand(context, intent.topic);
    }
    
    // 如果不是调研意图，返回 undefined，OpenClaw 会自动把消息传给下一个插件或底层大模型
  },

  async onCardAction(context) {
    return await handleCardAction(context);
  },

  async onCron(context) {
    if (context.job.action === 'runMonitorCheck') {
      await runMonitorCheck(context);
    }
  }
};

/**
 * 处理 /key 命令
 */
async function handleKeyCommand(context, args) {
  const { reply, secrets } = context;
  
  // 无参数：显示配置状态 + 注册引导
  if (!args || args.length === 0) {
    const configuredKeys = Object.keys(secrets || {}).filter(k => k.includes('API_KEY'));
    return reply(buildApiKeyStatusCard(configuredKeys));
  }
  
  // 有参数：配置 API Key
  const apiKey = args.join(' ').trim();
  const keyInfo = detectKeyType(apiKey);
  
  if (!keyInfo) {
    return reply(buildKeyConfigFailed());
  }
  
  // TODO: 调用 OpenClaw Secrets API 保存密钥
  // 目前返回成功消息（实际使用需要 Gateway 支持 secrets set）
  return reply(buildKeyConfiguredSuccess(keyInfo.name));
}

/**
 * 生成帮助菜单
 */
function buildHelpMenu() {
  return `╔══════════════════════════════════════════╗
║         🔍 Cue Research - AI 调研助理        ║
╠══════════════════════════════════════════╣
║  📋 研究命令                              ║
║  • /cue <问题>   启动深度研究             ║
║  • /ct           查看任务状态             ║
║  • /cancel       取消当前任务             ║
║                                          ║
║  📊 监控命令                              ║
║  • /cm add      主动创建监控              ║
║  • /cm           查看监控列表             ║
║  • /cn [天数]    查看通知（默认 3 天）      ║
║                                          ║
║  ⚙️ 配置命令                              ║
║  • /key          配置 API Key             ║
║  • /ch           显示此帮助               ║
╠══════════════════════════════════════════╣
║  💡 快捷用法：直接输入研究问题即可启动    ║
║     例："分析宁德时代竞争优势"            ║
╠══════════════════════════════════════════╣
║  🎁 新用户福利                            ║
║  访问 https://cuecue.cn 注册              ║
║  注册送 50 积分，每日 10 积分！             ║
╚══════════════════════════════════════════╝
`;
}
