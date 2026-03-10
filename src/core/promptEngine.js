export function buildSmartPrompt(topic) {
  const complexity = topic.length > 15 ? 'complex' : 'medium';
  let framework = '深度产业研究';
  let focus = '竞争格局、技术趋势';
  let format = '执行摘要 → 产业拆解 → 未来趋势';

  if (/短线 | 龙虎榜 | 涨停/.test(topic)) {
    framework = '市场微观与资金流向';
    focus = '资金博弈、情绪拐点';
    format = '摘要 → 资金流向 → 技术形态 → 操作建议';
  } else if (/财报 | 估值 | 财报/.test(topic)) {
    framework = '基本面分析与估值模型';
    focus = '财务分析、模型测算';
    format = '摘要 → 财务诊断 → 估值结论';
  }

  return `研究问题：${topic}\n研究框架：${framework}\n核心关注点：${focus}\n要求输出格式：${format}`;
}
