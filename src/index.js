import { handleResearchCommand, handleTaskStatus, handleCardAction } from './core/research.js';
import { handleMonitorCommand, handleNotificationCommand, runMonitorCheck } from './core/monitor.js';
import { detectResearchIntent } from './core/intent.js';

export default {
  name: "cue-research",
  
  /**
   * 显式命令钩子
   */
  async onCommand(context) {
    const { command, args, reply } = context;
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
        case 'ch':
          return reply("🔍 **Cue Research**\n\n• `/cue <问题>` - 深度调研\n• `/ct` - 查看任务状态\n• `/cm` - 查看监控列表\n• `/cm add <主题>` - 添加监控\n• `/cn [天数]` - 查看情报通知\n• `/ch` - 帮助菜单");
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
