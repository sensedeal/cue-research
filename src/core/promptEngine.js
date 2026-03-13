/**
 * Prompt 引擎 - 增强版
 * 基于意图分析生成智能研究框架
 */

import { assessComplexity, detectQuestionType, extractEntities, generateResearchGoals } from '../utils/promptHelpers.js';
import { detectMode, getModeInfo } from './modeDetector.js';

/**
 * 动态框架配置（简化版）
 * 3 种模式 × 3 级复杂度 = 9 种框架
 */
const FRAMEWORKS = {
  trader: {
    simple: {
      framework: '短期价格走势分析',
      method: '分析资金流向和技术形态，识别短期买卖信号',
      focus: '资金流向、技术信号',
      sources: '交易所龙虎榜、Level-2 行情数据、东方财富/同花顺资金数据',
      outputFormat: '执行摘要 → 资金流向 → 技术信号 → 操作建议'
    },
    medium: {
      framework: '市场微观结构分析',
      method: '追踪龙虎榜、分析大单流向、识别情绪拐点、研判技术形态',
      focus: '资金流向、席位动向、市场情绪、技术形态',
      sources: '交易所龙虎榜、Level-2 行情数据、东方财富资金数据、游资席位追踪',
      outputFormat: '执行摘要 → 资金流向分析 → 席位动向 → 技术形态 → 投资建议'
    },
    complex: {
      framework: '深度交易行为分析',
      method: '多维度资金分析、游资博弈追踪、市场情绪建模、技术形态研判、板块联动分析',
      focus: '资金流向、席位动向、市场情绪、游资博弈、板块联动',
      sources: '交易所龙虎榜、Level-2 行情数据、东方财富/同花顺资金数据、游资席位追踪、板块资金流',
      outputFormat: '执行摘要 → 资金流向深度分析 → 游资博弈追踪 → 市场情绪建模 → 技术形态研判 → 板块联动分析 → 投资建议'
    }
  },
  researcher: {
    simple: {
      framework: '行业概况梳理',
      method: '梳理行业基本情况和主要参与者',
      focus: '行业概况、主要参与者',
      sources: '上市公司公告、行业协会数据、市场调研报告',
      outputFormat: '执行摘要 → 行业概况 → 主要参与者 → 关键数据'
    },
    medium: {
      framework: '产业链与竞争力分析',
      method: '梳理产业链结构、分析竞争格局、研判技术趋势',
      focus: '产业链分析、竞争格局、技术趋势',
      sources: '上市公司公告、券商研报、行业协会数据、专利数据库、技术白皮书',
      outputFormat: '执行摘要 → 行业概况 → 竞争格局 → 技术趋势 → 市场预测'
    },
    complex: {
      framework: '深度产业研究',
      method: '深度拆解产业链结构、多维度竞争分析、技术路线对比、市场空间测算、政策影响分析、未来趋势预测',
      focus: '产业链深度分析、多维度竞争格局、技术路线对比、市场空间测算',
      sources: '上市公司公告、券商深度研报、行业协会数据、专利数据库、技术白皮书、政策文件',
      outputFormat: '执行摘要 → 产业链深度拆解 → 多维度竞争分析 → 技术路线对比 → 市场空间测算 → 政策影响分析 → 未来趋势预测'
    }
  },
  'fund-manager': {
    simple: {
      framework: '基础财务分析',
      method: '分析关键财务指标和估值水平',
      focus: '关键财务指标、估值水平',
      sources: '上市公司财报、交易所公告、Wind 数据',
      outputFormat: '执行摘要 → 财务指标 → 估值分析 → 投资建议'
    },
    medium: {
      framework: '基本面分析与估值',
      method: '分析财务报表、构建估值模型、评估内在价值',
      focus: '财务分析、估值模型、投资决策',
      sources: '上市公司财报、交易所公告、Wind/同花顺数据、券商深度研报',
      outputFormat: '执行摘要 → 财务分析 → 估值评估 → 投资建议'
    },
    complex: {
      framework: '深度基本面研究',
      method: '深度分析财务报表、构建多维度估值模型（DCF/PE/PB/PS）、评估内在价值、分析竞争优势、识别风险因素',
      focus: '财务深度分析、多维度估值、竞争优势、风险因素',
      sources: '上市公司财报、交易所公告、Wind/同花顺数据、券商深度研报、管理层访谈纪要',
      outputFormat: '执行摘要 → 深度财务分析 → 多维度估值 → 竞争优势分析 → 风险因素识别 → 投资建议'
    }
  },
  advisor: {
    simple: {
      framework: '基础理财建议',
      method: '提供基础的投资建议和风险提示',
      focus: '投资建议、风险控制',
      sources: '公募基金报告、保险产品说明书、银行理财公告',
      outputFormat: '执行摘要 → 投资建议 → 风险提示'
    },
    medium: {
      framework: '资产配置建议',
      method: '分析市场环境、提供资产配置建议、评估风险收益特征',
      focus: '投资建议、资产配置、风险控制',
      sources: '公募基金报告、保险产品说明书、银行理财公告、权威财经媒体',
      outputFormat: '执行摘要 → 资产配置建议 → 产品分析 → 风险提示'
    },
    complex: {
      framework: '深度财富规划',
      method: '全面分析市场环境、构建个性化资产配置方案、评估各类资产风险收益特征、提供税务筹划建议、制定长期财富规划',
      focus: '全面资产配置、风险收益评估、税务筹划、长期规划',
      sources: '公募基金报告、保险产品说明书、银行理财公告、权威财经媒体、税务政策',
      outputFormat: '执行摘要 → 市场环境分析 → 个性化资产配置 → 风险收益评估 → 税务筹划建议 → 长期财富规划'
    }
  },
  macro: {
    simple: {
      framework: '宏观经济概况',
      method: '分析关键宏观经济指标和政策动向',
      focus: 'GDP、CPI、货币政策',
      sources: '国家统计局、央行公告、财政部数据',
      outputFormat: '执行摘要 → 宏观指标 → 政策分析 → 市场影响'
    },
    medium: {
      framework: '宏观政策与市场分析',
      method: '分析货币政策、财政政策对各类资产的影响',
      focus: '货币政策、财政政策、利率汇率',
      sources: '央行公告、财政部数据、统计局报告、券商宏观研报',
      outputFormat: '执行摘要 → 政策分析 → 市场影响 → 投资建议'
    },
    complex: {
      framework: '深度宏观研究',
      method: '全面分析宏观经济周期、政策组合、全球联动、资产配置策略',
      focus: '经济周期、政策组合、全球联动、资产配置',
      sources: '央行公告、财政部数据、统计局报告、IMF/世界银行数据、券商宏观研报',
      outputFormat: '执行摘要 → 经济周期 → 政策分析 → 全球联动 → 资产配置建议'
    }
  }
};

// 默认框架（未匹配模式时使用 researcher）
const DEFAULT_FRAMEWORKS = FRAMEWORKS.researcher;

/**
 * 选择动态框架
 * @param {string} mode - 研究模式
 * @param {string} complexity - 复杂度等级
 * @returns {Object} 框架配置
 */
function selectFramework(mode, complexity) {
  const modeFrameworks = FRAMEWORKS[mode] || DEFAULT_FRAMEWORKS;
  return modeFrameworks[complexity] || modeFrameworks.medium;
}

/**
 * 构建智能 Prompt（增强版）
 * @param {string} topic - 研究主题
 * @param {string} mode - 研究模式（可选，默认自动检测）
 * @returns {string}
 */
export function buildSmartPrompt(topic, mode = null) {
  // 输入验证
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Invalid topic: must be non-empty string');
  }
  
  const safeTopic = topic.trim().slice(0, 500);
  
  // 1. 意图分析
  const questionType = detectQuestionType(safeTopic);
  const complexity = assessComplexity(safeTopic);
  const entities = extractEntities(safeTopic);
  
  // 2. 模式检测（如果未指定）
  const detectedMode = mode || detectMode(safeTopic);
  const modeInfo = getModeInfo(detectedMode);
  
  // 3. 选择框架
  const framework = selectFramework(detectedMode, complexity);
  
  // 4. 生成研究目标
  const researchGoals = generateResearchGoals(questionType);
  
  // 5. 实体列表（用于定制搜索）
  const entityList = entities.length > 0 
    ? entities.map(e => `• ${e.type === 'company' ? '公司' : e.type === 'industry' ? '行业' : e.type === 'stock_code' ? '股票代码' : '概念'}: ${e.value}`).join('\n')
    : '无特定实体';
  
  // 6. 构建 Prompt
  return `研究问题：${safeTopic}

研究视角：${modeInfo.name}
问题类型：${questionType}
复杂度等级：${complexity}

核心实体：
${entityList}

研究框架：
1. ${framework.framework}：${framework.method}
2. 背景与定义：澄清核心概念，界定研究范围
3. 现状分析：当前状态、市场规模、主要参与者
4. 关键维度分析：${framework.focus}
5. 证据与数据：引用权威来源的关键数据点

研究目标：
${researchGoals}

信息源标准：
- 优先信源：${framework.sources}
- 时间窗口：结合当前日期，优先近 6-12 个月内的最新动态
- 排除信源：无明确来源的传言、未经证实的社交媒体信息

输出结构：
${framework.outputFormat}`;
}
