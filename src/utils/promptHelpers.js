/**
 * Prompt 辅助函数
 * 提供复杂度评估、问题类型检测、实体提取等功能
 */

/**
 * 评估问题复杂度（简化版评分系统）
 * @param {string} topic - 研究主题
 * @returns {string} 'simple' | 'medium' | 'complex'
 */
export function assessComplexity(topic) {
  if (!topic || typeof topic !== 'string') return 'medium';
  
  let score = 0;
  const topicLower = topic.toLowerCase();
  
  // 1. 问题长度（0-5 分）
  score += Math.min(topic.length / 20, 5);
  
  // 2. 复合问题检测（每个 0.8 分）
  const compoundWords = ['和', '与', '以及', '同时', '对比', '比较', 'vs', '及', '还有'];
  score += compoundWords.filter(w => topicLower.includes(w)).length * 0.8;
  
  // 3. 抽象概念（每个 1.5 分）
  const abstractWords = ['逻辑', '本质', '机制', '原理', '体系', '框架', '模式', '方法论', '深度', '全面'];
  score += abstractWords.filter(w => topicLower.includes(w)).length * 1.5;
  
  // 4. 时间跨度
  if (/长期 | 多年 | 历史 | 未来几年 | 未来 3 年 | 未来 5 年/.test(topic)) score += 1.5;
  if (/短期 | 最近 | 明天 | 下周/.test(topic)) score += 0.5;
  
  // 映射到复杂度等级
  score = Math.max(0, score);
  if (score <= 3) return 'simple';
  if (score <= 7) return 'medium';
  return 'complex';
}

/**
 * 检测问题类型
 * @param {string} topic - 研究主题
 * @returns {string} 'descriptive' | 'analytical' | 'predictive' | 'prescriptive' | 'comparative'
 */
export function detectQuestionType(topic) {
  if (!topic || typeof topic !== 'string') return 'analytical';
  
  const t = topic.toLowerCase().slice(0, 500);
  
  // 对比型（高优先级）
  if (t.includes('对比') || t.includes('比较') || t.includes('区别') || t.includes('哪个好') || t.includes('vs') || /和.*比/.test(t) || /与.*比/.test(t)) {
    return 'comparative';
  }
  
  // 预测型（优先级 2）
  if (t.includes('趋势') || t.includes('前景') || t.includes('未来') || t.includes('预测') || t.includes('会怎样') || t.includes('发展方向') || t.includes('走势')) {
    return 'predictive';
  }
  
  // 建议型（优先级 3）
  if (t.includes('建议') || t.includes('怎么') || t.includes('如何') || t.includes('应该') || t.includes('适合买') || t.includes('可以买') || t.includes('推荐') || t.includes('怎么办') || t.includes('买入') || t.includes('卖出')) {
    return 'prescriptive';
  }
  
  // 分析型（优先级 4）
  if (t.includes('分析') || t.includes('研究') || t.includes('为什么') || t.includes('原因') || t.includes('因素') || t.includes('影响') || t.includes('机制') || t.includes('原理') || t.includes('财报') || t.includes('估值')) {
    return 'analytical';
  }
  
  // 默认：分析型
  return 'analytical';
}

/**
 * 提取核心实体（简化版）
 * @param {string} topic - 研究主题
 * @returns {Array} [{ type, value }]
 */
export function extractEntities(topic) {
  if (!topic || typeof topic !== 'string') return [];
  
  const entities = [];
  const seen = new Set();
  
  // 1. 股票代码
  const stockCodes = topic.match(/[36]\d{5}/g) || [];
  for (const code of stockCodes) {
    if (!['300000', '600000', '000000'].includes(code) && !seen.has(code)) {
      entities.push({ type: 'stock_code', value: code });
      seen.add(code);
    }
  }
  
  // 2. 知名公司
  const famousCompanies = [
    '宁德时代', '比亚迪', '贵州茅台', '腾讯', '阿里', '阿里巴巴',
    '百度', '美团', '京东', '华为', '小米', '苹果', '特斯拉',
    '谷歌', '微软', '亚马逊', 'Meta', '英伟达'
  ];
  for (const company of famousCompanies) {
    if (topic.includes(company) && !seen.has(company)) {
      entities.push({ type: 'company', value: company });
      seen.add(company);
    }
  }
  
  // 3. 行业
  const industries = [
    '新能源', '人工智能', '半导体', '医药', '消费', '金融',
    '新能源汽车', '光伏', '风电', '储能', '芯片', '互联网',
    '电商', '游戏', '教育', '医疗', '地产', '军工'
  ];
  for (const industry of industries) {
    if (topic.includes(industry) && !seen.has(industry)) {
      entities.push({ type: 'industry', value: industry });
      seen.add(industry);
    }
  }
  
  // 4. 概念主题
  const concepts = [
    '碳中和', '数字化', '国产替代', '消费升级', '人口老龄化',
    'AI', '大模型', 'ChatGPT', '具身智能', '元宇宙', '区块链'
  ];
  for (const concept of concepts) {
    if (topic.includes(concept) && !seen.has(concept)) {
      entities.push({ type: 'concept', value: concept });
      seen.add(concept);
    }
  }
  
  return entities.slice(0, 5);
}

/**
 * 根据问题类型生成研究目标
 * @param {string} type - 问题类型
 * @returns {string}
 */
export function generateResearchGoals(type) {
  const goals = {
    descriptive: '1. 梳理核心概念、关键要素与背景信息\n2. 提供清晰的定义和基本情况介绍',
    analytical: '1. 梳理核心概念、关键要素与背景信息\n2. 分析现状、趋势、主要参与者与关键数据\n3. 识别核心问题、机会点与关键证据',
    predictive: '1. 梳理历史发展脉络和当前现状\n2. 分析关键驱动因素和制约条件\n3. 预测未来趋势和可能的情景',
    prescriptive: '1. 分析当前市场环境和投资机会\n2. 评估不同选项的风险收益特征\n3. 提供具体的行动建议和操作方案',
    comparative: '1. 明确对比维度和评估标准\n2. 收集各方的关键数据和信息\n3. 进行多维度对比分析'
  };
  return goals[type] || goals.analytical;
}

/**
 * 获取复杂度标签（用于显示）
 * @param {string} complexity - 复杂度
 * @returns {string}
 */
export function getComplexityLabel(complexity) {
  const labels = {
    simple: '简单',
    medium: '中等',
    complex: '复杂'
  };
  return labels[complexity] || '中等';
}

/**
 * 获取问题类型标签（用于显示）
 * @param {string} type - 问题类型
 * @returns {string}
 */
export function getQuestionTypeLabel(type) {
  const labels = {
    descriptive: '描述型（是什么）',
    analytical: '分析型（为什么）',
    predictive: '预测型（会怎样）',
    prescriptive: '建议型（怎么做）',
    comparative: '对比型（哪个好）'
  };
  return labels[type] || '分析型';
}
