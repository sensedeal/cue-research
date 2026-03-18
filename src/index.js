import { handleResearchCommand, handleTaskStatus, handleCancelCommand, handleCardAction, handleQuickReplyCommand } from './core/research.js';
import { handleMonitorCommand, handleNotificationCommand, runMonitorCheck } from './core/monitor.js';
import { detectResearchIntent } from './core/intent.js';
import { 
  buildApiKeyStatusCard, 
  detectKeyType, 
  buildApiKeyMissingGuide,
  buildKeyConfiguredSuccess,
  buildKeyConfigFailed,
  getApiKeyFromSecrets,
  saveApiKeyToSecrets
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
        case 'cancel':
        case 'stop':
          return await handleCancelCommand(context);
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
   * 👇 【方案 C】处理大模型的函数调用（实现自然语言唤醒）
   * OpenClaw 收到大模型的 Tool Call 后，会触发此回调
   */
  async onToolCall(context) {
    const { name, arguments: args } = context.toolCall || context;

    if (name === 'start_deep_research') {
      const topic = args?.topic || '';
      console.log(`[CueSkill] 🤖 主控大模型决定调用深度调研，课题: ${topic}`);
      return await handleResearchCommand(context, topic);
    }
  },

  /**
   * 👇 【方案 C】处理大模型的函数调用（备用名）
   */
  async onFunctionCall(context) {
    return await this.onToolCall(context);
  },

  /**
   * 【备用】保留本地 NLU 作为兜底方案
   * 当大模型未识别到时，本地 NLU 仍可拦截
   */
  async onMessageReceived(context) {
    // 获取用户发送的纯文本
    const text = context.message?.text || context.text || '';
    
    // 空消息忽略
    if (!text || text.trim().length === 0) return;
    
    // 1. 检查是否是快捷回复关键词
    const quickReplyResult = await handleQuickReplyCommand(context, text);
    if (quickReplyResult) {
      return quickReplyResult;
    }
    
    // 2. 【兜底】本地 NLU 作为大模型的补充
    const intent = detectResearchIntent(text);
    
    // 如果确认是调研意图，自动拦截并触发调研逻辑
    if (intent && intent.shouldTrigger) {
      console.log(`[CueSkill] 💡 本地 NLU 兜底拦截调研意图：${intent.topic}`);
      // 复用 /cue 的处理逻辑
      return await handleResearchCommand(context, intent.topic);
    }
    
    // 如果不是调研意图，返回 undefined，OpenClaw 会自动把消息传给下一个插件或底层大模型
  },

  /**
   * 向下兼容的 onMessage 钩子
   */
  async onMessage(context) {
    return await this.onMessageReceived(context);
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
  const { reply } = context;
  
  // 无参数：显示配置状态 + 注册引导
  if (!args || args.length === 0) {
    const configuredKeys = [];
    if (getApiKeyFromSecrets('cuecue')) configuredKeys.push('CUECUE_API_KEY');
    if (getApiKeyFromSecrets('tavily')) configuredKeys.push('TAVILY_API_KEY');
    return reply(buildApiKeyStatusCard(configuredKeys));
  }
  
  // 有参数：配置 API Key
  const apiKey = args.join(' ').trim();
  const keyInfo = detectKeyType(apiKey);
  
  if (!keyInfo) {
    return reply(buildKeyConfigFailed());
  }
  
  // 保存到 secrets.json
  const provider = keyInfo.type.replace('_API_KEY', '').toLowerCase();
  const success = saveApiKeyToSecrets(provider, apiKey);
  
  if (success) {
    return reply(buildKeyConfiguredSuccess(keyInfo.name) + '\n💡 配置已立即生效，无需重启。');
  } else {
    return reply('❌ 配置失败，请检查文件权限或联系管理员。');
  }
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
║  🔔 完成通知支持交互按钮                  ║
║  • 📊 查看完整报告                        ║
║  • 🔔 创建推荐监控                        ║
║  • 💬 追问问题                            ║
╠══════════════════════════════════════════╣
║  🎁 新用户福利                            ║
║  访问 https://cuecue.cn 注册              ║
║  注册送 50 积分，每日 10 积分！             ║
╚══════════════════════════════════════════╝
`;
}
