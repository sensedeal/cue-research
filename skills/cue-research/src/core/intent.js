import { detectMode } from './modeDetector.js';

/**
 * 自然语言研究意图检测 (NLU)
 * @param {string} input - 用户输入的原始文本
 * @returns {Object|null} 包含解析后的 topic、detectedMode 和触发标志
 */
export function detectResearchIntent(input) {
  if (!input || typeof input !== 'string') return null;
  
  const text = input.trim();
  
  // 1. 长度限制防卡死 (太短的不是好问题，太长的直接拒绝正则处理)
  if (text.length < 4 || text.length > 500) return null;

  // 2. 排除词（防误触日常聊天）
  const excludeKeywords = ['测试', '你好', '在吗', '帮助', '取消', '停止', '命令'];
  if (excludeKeywords.some(kw => text.includes(kw))) {
    return null;
  }

  // 3. 核心动词检测（扩展覆盖自然语言表达）
  const researchKeywords = [
    '分析', '研究', '调研', '看看', '评估', '了解',
    '前景', '竞争力', '对比', '估值', '基本面',
    '买', '卖', '买入', '卖出', '适合', '合适',
    '趋势', '未来', '发展', '走势', '怎么样', '如何',
    '优势', '劣势', '机会', '风险', '空间', '格局'
  ];
  const hasAction = researchKeywords.some(kw => text.includes(kw));

  // 4. 金融/实体名词检测（扩展关键词覆盖）
  const entityPattern = /(宁德时代 | 比亚迪 | 腾讯 | 阿里 | 特斯拉 | 苹果 | 茅台 | 行业 | 赛道 | 大模型|AI|人工智能 | 股票 | 财报 | 年报 | 季报 | 新能源 | 光伏 | 风电 | 芯片 | 半导体|ETF|基金 | 周报 | 月报 | 年报 | 市场 | 大盘 | 板块 | 指数)/;
  const hasEntity = entityPattern.test(text);

  // 5. 意图打分机制（降低触发阈值）
  let score = 0;
  if (hasAction) score += 50;  // 有动作词给 50 分
  if (hasEntity) score += 40;  // 有实体词给 40 分（提高权重）
  if (text.length > 8) score += 10;  // 长度加分

  // 达到 40 分即认为用户在请求深度调研（纯实体词如"ETF 周报"也能触发）
  if (score >= 40) {
    // 提取核心 Topic：去掉前面的"帮我"、"请"等语气词
    let topic = text;
    const prefixes = ['帮我', '请', '给我', '我想了解'];
    for (const p of prefixes) {
      if (topic.startsWith(p)) {
        topic = topic.replace(p, '').trim();
      }
    }
    
    // 自动检测研究模式
    const detectedMode = detectMode(topic);
    
    return { 
      shouldTrigger: true, 
      topic,
      detectedMode  // 新增：自动匹配的研究模式
    };
  }

  return null; // 不是调研意图，放行给其他插件或底层大模型
}
