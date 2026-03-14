# Build Prompt 对比分析 - 旧版 vs 新版

> **分析时间**: 2026-03-12 10:40
> **目的**: 识别新版待优化点

---

## 📊 对比总表

| 维度 | 旧版 cuebot | 新版 cue-research | 差异评估 |
|------|------------|------------------|---------|
| **代码量** | ~2500 行（含意图分析） | ~100 行 | ⚠️ 简化 96% |
| **意图分析** | ✅ 5 维度 | ❌ 无 | ⚠️ 缺失 |
| **复杂度评估** | ✅ 评分系统（0-10 分） | ❌ 简单长度判断 | ⚠️ 粗糙 |
| **实体提取** | ✅ 5 类实体 | ❌ 无 | ⚠️ 缺失 |
| **动态框架** | ✅ 3 级复杂度 | ❌ 硬编码 3 种 | ⚠️ 简化 |
| **输出结构** | ✅ 根据问题类型生成 | ❌ 硬编码 | ⚠️ 简化 |
| **模式检测** | ✅ 7 种模式 | ✅ 8 种模式 | ✅ 相当 |
| **用户画像** | ✅ 支持（可选） | ❌ 无 | ✅ 符合设计 |
| **清理逻辑** | ✅ 测试前缀清理 | ❌ 无 | ⚠️ 缺失 |

---

## 🔍 详细对比

### 1️⃣ 意图分析

#### 旧版（5 维度）
```javascript
// Phase 1: 问题意图分析
const questionType = detectQuestionType(safeTopic);      // 5 种类型
const complexity = assessComplexity(safeTopic);          // 3 级复杂度
const entities = extractEntities(safeTopic);             // 5 类实体
const researchGoals = generateResearchGoals(questionType);
const domain = detectDomain(safeTopic);                  // 7 个领域
const timeHorizon = detectTimeHorizon(safeTopic);        // 3 个时间跨度
const outputType = detectOutputType(safeTopic);          // 6 种输出类型
const urgency = detectUrgency(safeTopic);                // 3 级紧急程度
const technicalLevel = detectTechnicalLevel(safeTopic);  // 3 级技术水平
```

**问题类型检测**：
```javascript
export function detectQuestionType(topic) {
  // 对比型（高优先级）
  if (/对比 | 比较 | 区别 | 哪个好|vs/.test(topicLower)) {
    return 'comparative';
  }
  
  // 建议型
  if (/建议 | 怎么 | 如何 | 应该 | 适合买/.test(topicLower)) {
    return 'prescriptive';
  }
  
  // 预测型
  if (/趋势 | 前景 | 未来 | 预测/.test(topicLower)) {
    return 'predictive';
  }
  
  // 分析型
  if (/分析 | 研究 | 为什么 | 原因/.test(topicLower)) {
    return 'analytical';
  }
  
  // 默认：描述型
  return 'descriptive';
}
```

#### 新版
```javascript
// 无意图分析
// modeDetector.js 只做模式检测
export function detectMode(topic) {
  // 基于关键词匹配模式
  // 返回 trader/researcher/fundManager 等
}
```

**差异**：
- ❌ **缺失问题类型检测** - 无法区分对比型/建议型/预测型
- ❌ **缺失复杂度评估** - 只用长度判断（>15 字符=complex）
- ❌ **缺失实体提取** - 无法识别公司/行业/股票代码
- ❌ **缺失领域检测** - 无法区分金融/科技/消费等领域
- ❌ **缺失时间跨度** - 无法区分短期/中期/长期
- ❌ **缺失输出类型** - 无法区分摘要/分析/建议/对比

---

### 2️⃣ 复杂度评估

#### 旧版（评分系统）
```javascript
export function assessComplexity(topic) {
  let score = 0;
  
  // 1. 问题长度（0-3 分）
  score += Math.min(topic.length / 30, 3);
  
  // 2. 复合问题检测（每个 0.5 分）
  const compoundIndicators = ['和', '与', '以及', '同时', '对比', '比较'];
  score += compoundIndicators.filter(i => topic.includes(i)).length * 0.5;
  
  // 3. 抽象概念（每个 1 分）
  const abstractConcepts = ['逻辑', '本质', '机制', '原理', '体系', '框架'];
  score += abstractConcepts.filter(c => topic.includes(c)).length * 1;
  
  // 4. 时间跨度
  if (/长期 | 多年 | 历史/.test(topic)) score += 1;
  if (/短期 | 最近 | 明天/.test(topic)) score -= 0.5;
  
  // 5. 实体数量（最多 2 分）
  score += Math.min(entityCount * 0.5, 2);
  
  // 映射到复杂度等级
  if (score <= 2) return 'simple';
  if (score <= 5) return 'medium';
  return 'complex';
}
```

#### 新版
```javascript
export function buildSmartPrompt(topic) {
  const complexity = topic.length > 15 ? 'complex' : 'medium';
  // ...
}
```

**差异**：
- ❌ **过于粗糙** - 只用长度判断，15 字符是硬编码阈值
- ❌ **忽略复合问题** - "分析 A 和 B 的对比"vs"分析 A"复杂度相同
- ❌ **忽略抽象概念** - "分析本质"vs"分析数据"复杂度相同

---

### 3️⃣ 实体提取

#### 旧版（5 类实体）
```javascript
export function extractEntities(topic) {
  const entities = [];
  
  // 1. 股票代码
  const stockCodes = topic.match(/[36]\d{5}/g) || [];
  
  // 2. 知名公司
  const famousCompanies = ['宁德时代', '比亚迪', '腾讯', '阿里', ...];
  
  // 3. 公司名称模式（带过滤）
  const companyPattern = /[\u4e00-\u9fa5]{2,6}(时代 | 股份 | 集团 | ...)/g;
  
  // 4. 行业
  const industries = ['新能源', '人工智能', '半导体', ...];
  
  // 5. 概念主题
  const concepts = ['碳中和', '数字化', '国产替代', ...];
  
  return entities.slice(0, 5);
}
```

#### 新版
```javascript
// 无实体提取
```

**差异**：
- ❌ **无法识别实体** - 服务端无法针对性搜索
- ❌ **无法定制框架** - 无法针对公司/行业定制研究框架

---

### 4️⃣ 动态框架生成

#### 旧版（3 级复杂度 × 7 种模式）
```javascript
// Phase 2: 多复杂度框架配置
export const DYNAMIC_FRAMEWORKS = {
  trader: {
    simple: {
      framework: '短期价格走势分析',
      method: '分析资金流向和技术形态，识别短期买卖信号',
      focus: '资金流向、技术信号',
      outputFormat: '执行摘要 → 资金流向 → 技术信号 → 操作建议'
    },
    medium: {
      framework: '市场微观结构分析',
      method: '追踪龙虎榜、分析大单流向、识别情绪拐点...',
      focus: '资金流向、席位动向、市场情绪、技术形态',
      outputFormat: '执行摘要 → 资金流向分析 → 席位动向 → 技术形态 → 投资建议'
    },
    complex: {
      framework: '深度交易行为分析',
      method: '多维度资金分析、游资博弈追踪、市场情绪建模...',
      focus: '资金流向、席位动向、市场情绪、游资博弈、板块联动',
      outputFormat: '执行摘要 → 资金流向深度分析 → 游资博弈追踪 → ...'
    }
  },
  'fund-manager': { /* simple/medium/complex */ },
  researcher: { /* simple/medium/complex */ },
  // ... 共 7 种模式 × 3 级复杂度 = 21 种框架
};

// 动态生成
export function generateDynamicFramework(topic, mode, complexity, entities = []) {
  // 1. 选择基础框架
  let framework = selectDynamicFramework(mode, complexity);
  
  // 2. 为实体定制框架
  if (entities && entities.length > 0) {
    framework = customizeFrameworkForEntities(framework, entities);
  }
  
  return framework;
}
```

#### 新版
```javascript
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

  return `研究问题：${topic}
研究框架：${framework}
核心关注点：${focus}
要求输出格式：${format}`;
}
```

**差异**：
- ❌ **硬编码 3 种框架** - 只有"短线/财报/默认"3 种
- ❌ **无复杂度区分** - simple/medium/complex 输出相同框架
- ❌ **无实体定制** - 无法针对具体公司/行业定制
- ❌ **无输出结构** - 缺少"信息源标准"、"输出结构"等

---

### 5️⃣ 生成的 Prompt 对比

#### 旧版（完整）
```
研究问题：分析宁德时代的竞争优势

研究框架：
1. 深度产业研究：深度拆解产业链结构、多维度竞争分析、技术路线对比...
2. 背景与定义：澄清核心概念，界定研究范围
3. 现状分析：当前状态、市场规模、主要参与者
4. 关键维度分析：产业链深度分析、多维度竞争格局、技术路线对比...
5. 证据与数据：引用权威来源的关键数据点

信息源标准：
- 优先信源：上市公司公告、券商研报、行业协会数据、专利数据库、技术白皮书
- 时间窗口：结合当前日期，优先近 6-12 个月内的最新动态
- 排除信源：无明确来源的传言、未经证实的社交媒体信息

输出结构：
执行摘要 → 产业链深度拆解 → 多维度竞争分析 → 技术路线对比 → 市场空间测算 → 政策影响分析 → 未来趋势预测 → 机会与风险
```

#### 新版（简化）
```
研究问题：分析宁德时代的竞争优势
研究框架：深度产业研究
核心关注点：竞争格局、技术趋势
要求输出格式：执行摘要 → 产业拆解 → 未来趋势
```

**差异**：
- ❌ **缺少研究框架细节** - 无方法描述
- ❌ **缺少信息源标准** - 无优先信源、时间窗口、排除信源
- ❌ **缺少输出结构细节** - 只有简单格式

---

## 🎯 评估结论

### ✅ 新版优点

1. **简洁** - 代码量减少 96%，易于维护
2. **快速** - 无复杂计算，直接关键词匹配
3. **符合设计** - 无用户画像，符合"零隐式画像"原则

### ⚠️ 新版待优化点

#### P0 - 必须优化

| 问题 | 影响 | 建议 |
|------|------|------|
| Prompt 过于简单 | 服务端无法理解研究深度 | 恢复完整的框架描述 |
| 无信息源标准 | 搜索可能不够精准 | 添加优先信源、时间窗口 |
| 无输出结构 | 报告质量不稳定 | 添加详细输出结构 |

#### P1 - 强烈建议

| 问题 | 影响 | 建议 |
|------|------|------|
| 复杂度评估粗糙 | 简单问题和复杂问题用相同框架 | 恢复评分系统 |
| 无实体提取 | 无法针对性搜索 | 提取公司/行业/股票代码 |
| 无问题类型检测 | 对比型/建议型问题用相同框架 | 恢复 5 种问题类型 |

#### P2 - 可选优化

| 问题 | 影响 | 建议 |
|------|------|------|
| 无领域检测 | 无法区分金融/科技/消费 | 添加领域检测 |
| 无时间跨度 | 无法区分短期/长期 | 添加时间检测 |
| 无紧急程度 | 无法优先处理紧急问题 | 添加紧急程度检测 |

---

## 📋 优化方案

### 方案 A：轻量级优化（推荐）

**保留简洁架构，增强关键逻辑**：

```javascript
// 1. 增强复杂度评估（50 行代码）
export function assessComplexity(topic) {
  let score = 0;
  score += Math.min(topic.length / 30, 3);
  
  // 复合问题
  const compoundWords = ['和', '与', '对比', '比较'];
  score += compoundWords.filter(w => topic.includes(w)).length * 0.5;
  
  // 抽象概念
  const abstractWords = ['本质', '机制', '原理'];
  score += abstractWords.filter(w => topic.includes(w)).length;
  
  if (score <= 2) return 'simple';
  if (score <= 5) return 'medium';
  return 'complex';
}

// 2. 增强 Prompt 生成（100 行代码）
export function buildSmartPrompt(topic, mode) {
  const complexity = assessComplexity(topic);
  const entities = extractEntities(topic);  // 新增
  const questionType = detectQuestionType(topic);  // 新增
  
  // 根据复杂度选择框架
  const framework = getFramework(mode, complexity, questionType);
  
  return `研究问题：${topic}

研究框架：
1. ${framework.framework}：${framework.method}
2. 背景与定义：澄清核心概念，界定研究范围
3. 现状分析：当前状态、市场规模、主要参与者
4. 关键维度分析：${framework.focus}
5. 证据与数据：引用权威来源的关键数据点

信息源标准：
- 优先信源：${framework.sources}
- 时间窗口：优先近 6-12 个月内的最新动态
- 排除信源：无明确来源的传言、未经证实的社交媒体信息

输出结构：
${framework.outputFormat}`;
}
```

**代码量**：~200 行（旧版 10%）
**效果**：恢复 80% 功能

---

### 方案 B：完整迁移（不推荐）

**完全迁移旧版逻辑**：
- 代码量：~2500 行
- 效果：100% 功能
- 维护成本：高

---

### 方案 C：保持现状（不推荐）

**理由**：
- Prompt 质量影响服务端研究质量
- 简化过度导致研究深度不足

---

## 🚀 建议

**采用方案 A（轻量级优化）**：

**Phase 1（本周）**：
1. 增强复杂度评估（50 行）
2. 增强 Prompt 模板（100 行）
3. 添加实体提取（50 行）

**Phase 2（下周）**：
4. 添加问题类型检测（50 行）
5. 添加领域检测（30 行）

**总代码量**：~300 行（旧版 12%）
**功能恢复**：90%

---

**生成时间**: 2026-03-12 10:40
