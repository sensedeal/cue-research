/**
 * 监控模板库
 * 预定义高价值、低噪音的监控配置
 */

/**
 * 监控模板定义
 * 每个模板包含：
 * - title: 监控名称
 * - category: 监控类别 (Standard/M&A/Financial/Product/Data)
 * - description: 监控描述
 * - trigger_keywords: 触发关键词列表
 * - exclude_keywords: 排除关键词列表（噪音过滤）
 * - sources: 推荐信源（可选）
 * - frequency_cron: 执行频率（cron 表达式）
 * - value_score: 价值评分 (0-100)
 * - expected_frequency: 预计通知频率描述
 */
export const MONITOR_TEMPLATES = {
  // ========== 行业标准类 ==========
  industry_standard: {
    title: '行业标准动态',
    category: 'Standard',
    description: '跟踪行业标准、政策、规范的发布和更新',
    trigger_keywords: ['标准发布', '行业标准', '国家标准', '征求意见稿', '信通院', '工信部'],
    exclude_keywords: ['招聘', '展会', '培训', '广告', '促销'],
    sources: ['caict.ac.cn', 'miit.gov.cn', 'gov.cn', 'samr.gov.cn'],
    frequency_cron: '0 9 * * 1', // 每周一 9 点
    value_score: 92,
    expected_frequency: '2-4 次/月',
    significance: 'High',
    actionable_threshold: 'high'
  },

  // ========== 竞争格局类 ==========
  competitive_landscape: {
    title: '竞争动态监控',
    category: 'M&A',
    description: '跟踪行业主要厂商的并购、合作、战略调整',
    trigger_keywords: ['并购', '收购', '投资', '战略合作', '融资', 'IPO'],
    exclude_keywords: ['招聘', '展会', '产品更新', '版本发布', '营销'],
    sources: ['gartner.com', 'bloomberg.com', 'reuters.com', 'caixin.com'],
    frequency_cron: '0 9 * * 1-5', // 工作日 9 点
    value_score: 85,
    expected_frequency: '3-6 次/月',
    significance: 'High',
    actionable_threshold: 'high'
  },

  // ========== 财报类 ==========
  financial_report: {
    title: '财报监控',
    category: 'Financial',
    description: '跟踪目标公司的财报发布和关键财务数据',
    trigger_keywords: ['财报', '年报', '季报', '营收', '净利润', '毛利率'],
    exclude_keywords: ['招聘', '广告', '产品推广'],
    sources: ['sse.com.cn', 'szse.cn', 'hkexnews.hk', 'sec.gov'],
    frequency_cron: '0 9 1,15 * *', // 每月 1 号和 15 号
    value_score: 80,
    expected_frequency: '2-4 次/月',
    significance: 'Medium',
    actionable_threshold: 'medium'
  },

  // ========== 技术趋势类 ==========
  technology_trend: {
    title: '技术趋势监控',
    category: 'Product',
    description: '跟踪行业核心技术突破和创新',
    trigger_keywords: ['技术突破', '专利', '研发', '创新', '首发', '领先'],
    exclude_keywords: ['招聘', '展会', '营销', '软文', '推广'],
    sources: ['arxiv.org', 'ieee.org', 'acm.org', 'github.com/trending'],
    frequency_cron: '0 9 * * 1', // 每周一 9 点
    value_score: 75,
    expected_frequency: '4-8 次/月',
    significance: 'Medium',
    actionable_threshold: 'medium'
  },

  // ========== 市场数据类 ==========
  market_data: {
    title: '市场数据监控',
    category: 'Data',
    description: '跟踪市场规模、增长率、份额等关键数据',
    trigger_keywords: ['市场规模', '增长率', '市场份额', '渗透率', '出货量'],
    exclude_keywords: ['招聘', '广告', '营销'],
    sources: ['gartner.com', 'idc.com', 'forrester.com', 'statista.com'],
    frequency_cron: '0 9 1 * *', // 每月 1 号
    value_score: 65,
    expected_frequency: '1-2 次/月',
    significance: 'Low',
    actionable_threshold: 'low'
  },

  // ========== 政策法规类 ==========
  policy_regulation: {
    title: '政策法规监控',
    category: 'Standard',
    description: '跟踪行业相关政策法规变化',
    trigger_keywords: ['政策', '法规', '监管', '处罚', '合规', '指导意见'],
    exclude_keywords: ['招聘', '广告'],
    sources: ['gov.cn', 'csrc.gov.cn', 'pbc.gov.cn', 'samr.gov.cn'],
    frequency_cron: '0 9 * * 1', // 每周一 9 点
    value_score: 88,
    expected_frequency: '2-4 次/月',
    significance: 'High',
    actionable_threshold: 'high'
  },

  // ========== 产品动态类 ==========
  product_updates: {
    title: '产品动态监控',
    category: 'Product',
    description: '跟踪竞品和行业产品更新、发布、迭代',
    trigger_keywords: ['新品发布', '产品更新', '版本迭代', '功能升级', '发布会'],
    exclude_keywords: ['招聘', '广告', '营销', '促销'],
    sources: ['36kr.com', 'techcrunch.com', 'pingwest.com', 'geekpark.net'],
    frequency_cron: '0 9 * * 1-5', // 工作日 9 点
    value_score: 78,
    expected_frequency: '4-8 次/月',
    significance: 'Medium',
    actionable_threshold: 'medium'
  },

  // ========== 舆情监控类 ==========
  public_opinion: {
    title: '舆情热点监控',
    category: 'Event',
    description: '跟踪行业相关舆情热点、突发事件',
    trigger_keywords: ['热议', '热搜', '舆论', '争议', '危机', '突发'],
    exclude_keywords: ['娱乐', '明星', '八卦', '体育'],
    sources: ['weibo.com', 'zhihu.com', 'toutiao.com', '36kr.com'],
    frequency_cron: '0 */4 * * *', // 每 4 小时
    value_score: 82,
    expected_frequency: '6-12 次/月',
    significance: 'High',
    actionable_threshold: 'high'
  },

  // ========== 供应链类 ==========
  supply_chain: {
    title: '供应链动态监控',
    category: 'Data',
    description: '跟踪供应链变化、原材料价格、物流信息',
    trigger_keywords: ['供应链', '原材料', '价格上涨', '缺货', '物流', '断供'],
    exclude_keywords: ['招聘', '广告'],
    sources: ['1688.com', 'alibaba.com', 'chinawuliu.com.cn'],
    frequency_cron: '0 9 * * 1,3,5', // 周一、三、五 9 点
    value_score: 75,
    expected_frequency: '3-6 次/月',
    significance: 'Medium',
    actionable_threshold: 'medium'
  },

  // ========== 人才流动类 ==========
  talent_movement: {
    title: '人才流动监控',
    category: 'M&A',
    description: '跟踪行业核心人才变动、高管任命',
    trigger_keywords: ['任命', '离职', '加盟', 'CEO', 'CTO', '高管', '合伙人'],
    exclude_keywords: ['招聘', '广告', '校招'],
    sources: ['linkedin.com', '36kr.com', 'latepost.com', 'huxiu.com'],
    frequency_cron: '0 9 * * 1', // 每周一 9 点
    value_score: 70,
    expected_frequency: '2-4 次/月',
    significance: 'Medium',
    actionable_threshold: 'medium'
  },

  // ========== 投融资类 ==========
  investment_financing: {
    title: '投融资动态监控',
    category: 'M&A',
    description: '跟踪行业投融资事件、估值变化',
    trigger_keywords: ['融资', '估值', '上市', 'IPO', '战略投资', '领投', '跟投'],
    exclude_keywords: ['招聘', '广告'],
    sources: ['36kr.com', 'itjuzi.com', 'pedata.cn', 'cyzone.cn'],
    frequency_cron: '0 9 * * 1-5', // 工作日 9 点
    value_score: 85,
    expected_frequency: '5-10 次/月',
    significance: 'High',
    actionable_threshold: 'high'
  }
};

/**
 * 根据研究主题智能推荐监控模板
 * @param {string} topic - 研究主题
 * @param {string} mode - 研究模式 (researcher/trader/fund-manager/etc.)
 * @param {Object} preferences - 用户偏好（可选）
 * @returns {Array} 推荐的监控模板列表（已排序）
 */
export function recommendMonitors(topic, mode = 'default', preferences = null) {
  const recommendations = [];
  
  // 关键词匹配权重
  const keywordWeights = {
    // 行业/标准相关
    '标准': ['industry_standard', 'policy_regulation'],
    '政策': ['policy_regulation', 'industry_standard'],
    '法规': ['policy_regulation'],
    '监管': ['policy_regulation'],
    
    // 竞争/投资相关
    '并购': ['competitive_landscape', 'financial_report'],
    '投资': ['competitive_landscape', 'financial_report'],
    '融资': ['competitive_landscape'],
    '竞争': ['competitive_landscape'],
    
    // 财务相关
    '财报': ['financial_report'],
    '财务': ['financial_report'],
    '估值': ['financial_report'],
    
    // 技术相关
    '技术': ['technology_trend', 'industry_standard'],
    '研发': ['technology_trend'],
    '专利': ['technology_trend'],
    '创新': ['technology_trend'],
    
    // 市场相关
    '市场': ['market_data', 'competitive_landscape'],
    '规模': ['market_data'],
    '增长': ['market_data', 'competitive_landscape'],
    '份额': ['market_data']
  };
  
  // 统计匹配得分
  const scores = {};
  const topicLower = topic.toLowerCase();
  
  for (const [keyword, templates] of Object.entries(keywordWeights)) {
    if (topicLower.includes(keyword.toLowerCase())) {
      templates.forEach(template => {
        scores[template] = (scores[template] || 0) + 1;
      });
    }
  }
  
  // 根据研究模式调整权重
  const modeBoost = {
    'researcher': { 'industry_standard': 2, 'technology_trend': 2 },
    'trader': { 'competitive_landscape': 2, 'financial_report': 1 },
    'fund-manager': { 'financial_report': 3, 'competitive_landscape': 2 },
    'advisor': { 'financial_report': 2, 'policy_regulation': 1 },
    'macro': { 'policy_regulation': 2, 'market_data': 1 },
    'industry': { 'industry_standard': 2, 'competitive_landscape': 2 }
  };
  
  if (modeBoost[mode]) {
    for (const [template, boost] of Object.entries(modeBoost[mode])) {
      scores[template] = (scores[template] || 0) + boost;
    }
  }
  
  // 生成推荐列表
  const allTemplates = Object.keys(MONITOR_TEMPLATES);
  
  for (const templateKey of allTemplates) {
    const template = MONITOR_TEMPLATES[templateKey];
    recommendations.push({
      key: templateKey,
      ...template,
      match_score: scores[templateKey] || 0,
      // 综合评分 = 基础价值分 + 匹配分 * 10
      total_score: template.value_score + (scores[templateKey] || 0) * 10
    });
  }
  
  // 如果有用户偏好，调整分数
  if (preferences && preferences.selections) {
    recommendations = recommendations.map(rec => ({
      ...rec,
      // 极简公式：基础分 + 选择次数 × 10
      adjusted_score: rec.total_score + (preferences.selections[rec.key] || 0) * 10
    }));
    // 按调整后的分数排序
    recommendations.sort((a, b) => (b.adjusted_score || b.total_score) - (a.adjusted_score || a.total_score));
  } else {
    // 按综合评分排序
    recommendations.sort((a, b) => b.total_score - a.total_score);
  }
  
  // 返回 TOP 3
  return recommendations.slice(0, 3);
}

/**
 * 获取单个监控模板
 * @param {string} key - 模板键
 * @returns {Object|null} 监控模板
 */
export function getMonitorTemplate(key) {
  return MONITOR_TEMPLATES[key] || null;
}

/**
 * 获取所有监控模板
 * @returns {Object} 所有监控模板
 */
export function getAllTemplates() {
  return MONITOR_TEMPLATES;
}

/**
 * 生成监控配置（用于创建 API 调用）
 * @param {string} templateKey - 模板键
 * @param {string} topic - 研究主题
 * @param {string} chatId - 用户 ID
 * @returns {Object} 完整的监控配置
 */
export function buildMonitorConfig(templateKey, topic, chatId) {
  const template = getMonitorTemplate(templateKey);
  if (!template) return null;
  
  return {
    title: `${topic.substring(0, 15)}... - ${template.title}`,
    category: template.category,
    description: template.description,
    semantic_trigger: `${topic}相关的${template.trigger_keywords.join('、')}`,
    trigger_keywords: template.trigger_keywords,
    exclude_keywords: template.exclude_keywords,
    sources: template.sources,
    frequency_cron: template.frequency_cron,
    significance: template.significance,
    actionable_threshold: template.actionable_threshold,
    is_active: true,
    created_at: new Date().toISOString()
  };
}
