/**
 * 研究模式检测器
 * 支持内置基础模式 + 用户自定义扩展
 * 符合"零隐式画像"原则：仅分析当前消息，不持久化状态
 */

import fs from 'fs-extra';
import path from 'path';
import { getUserWorkspace } from '../utils/storage.js';

/**
 * 内置基础模式（不可变）
 * 优先级：10=高，5=中，3=低
 */
const BUILTIN_MODES = {
  trader: {
    keywords: ['龙虎榜', '涨停', '跌停', '资金流向', '短线', '打板', '连板', '换手率', '主力资金', '游资', '席位', '明天买', '技术面'],
    priority: 10,
    name: '短线交易视角'
  },
  researcher: {
    keywords: ['产业链', '赛道', '竞争格局', '技术路线', '市场空间', '行业分析', '市场份额', '供应链', '上下游', '壁垒'],
    priority: 5,
    name: '产业研究视角'
  },
  fundManager: {
    keywords: ['财报', '估值', 'PE', 'PB', 'ROE', '基本面', '长期', '投资', '业绩', '年报', '季报', '现金流', '盈利'],
    priority: 3,
    name: '基金经理视角'
  },
  advisor: {
    keywords: ['定投', '理财', '配置', '风险', '收益', '组合', '保守', '稳健', '激进', '养老金', '教育金', '适合买', '怎么买'],
    priority: 8,
    name: '理财顾问视角'
  },
  macro: {
    keywords: ['GDP', 'CPI', '货币政策', '宏观', '利率', '降息', '加息', '降准', '通胀', '通缩', '经济', '财政'],
    priority: 7,
    name: '宏观分析视角'
  },
  techAnalyst: {
    keywords: ['技术架构', '技术原理', '技术趋势', 'AI', '人工智能', '大模型', '算法', '代码', '开发', '产品分析', 'SaaS', '软件'],
    priority: 6,
    name: '技术分析视角'
  },
  businessAnalyst: {
    keywords: ['商业模式', '市场竞争', '盈利', '商业化', '战略', '竞品', '对标', '独角兽', '创业公司', 'SaaS'],
    priority: 9,
    name: '商业分析视角'
  },
  academic: {
    keywords: ['理论', '方法论', '学术研究', '文献综述', '论文', '期刊', '研究方法', '学术'],
    priority: 5,
    name: '学术研究视角'
  }
};

/**
 * 加载用户自定义模式（可选）
 * 从 workspace 的 modes.json 加载
 */
export async function loadCustomModes(context) {
  try {
    // 优先从 context 获取，其次从环境变量获取
    const workspace = context?.env?.OPENCLAW_WORKSPACE || 
                      process.env.OPENCLAW_WORKSPACE || 
                      process.cwd();
    const customPath = path.join(workspace, 'modes.json');
    
    if (await fs.pathExists(customPath)) {
      const customModes = await fs.readJson(customPath);
      return customModes;
    }
  } catch (e) {
    console.warn('Failed to load custom modes:', e.message);
  }
  
  return {};
}

/**
 * 合并模式库
 * 自定义模式覆盖内置模式
 */
export function mergeModes(builtin, custom) {
  return { ...builtin, ...custom };
}

/**
 * 检测研究模式
 * @param {string} topic - 研究主题
 * @param {Object} modes - 模式库（可选，默认使用内置）
 * @returns {string} 检测到的模式
 */
export function detectMode(topic, modes = BUILTIN_MODES) {
  // 输入验证
  if (!topic || typeof topic !== 'string') {
    return 'researcher';  // 默认产业研究
  }
  
  const topicLower = topic.toLowerCase().slice(0, 500);  // 限制长度
  let bestMode = 'researcher';
  let maxScore = 0;
  
  for (const [mode, config] of Object.entries(modes)) {
    if (!config.keywords || !Array.isArray(config.keywords)) {
      continue;
    }
    
    let score = 0;
    for (const keyword of config.keywords) {
      if (topicLower.includes(keyword.toLowerCase())) {
        score += config.priority || 5;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMode = mode;
    }
  }
  
  // 如果没有任何匹配，返回默认模式
  return maxScore > 0 ? bestMode : 'researcher';
}

/**
 * 获取模式详细信息
 * @param {string} mode - 模式名称
 * @param {Object} modes - 模式库
 * @returns {Object} 模式信息
 */
export function getModeInfo(mode, modes = BUILTIN_MODES) {
  return modes[mode] || { name: '综合研究视角', priority: 0 };
}

/**
 * 获取所有可用模式列表
 * @param {Object} modes - 模式库
 * @returns {Array} 模式列表
 */
export function listModes(modes = BUILTIN_MODES) {
  return Object.entries(modes).map(([key, config]) => ({
    key,
    name: config.name,
    priority: config.priority,
    keywords: config.keywords
  }));
}
