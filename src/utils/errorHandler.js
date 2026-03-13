/**
 * 错误处理工具
 * 将技术错误转换为用户友好的提示
 */

/**
 * 错误类型映射
 */
const ERROR_MAP = {
  // 网络/超时错误
  'timeout': {
    pattern: /timeout|timed out|ETIMEDOUT/i,
    message: '请求超时，可能是网络不稳定或服务响应较慢',
    suggestion: '请稍后重试，或检查网络连接'
  },
  
  // API 相关错误
  'API Error': {
    pattern: /API Error|HTTP \d{3}|status \d{3}/i,
    message: '服务暂时不可用',
    suggestion: '请稍后重试，如持续失败请检查 API Key 配置'
  },
  
  'ECONNREFUSED': {
    pattern: /ECONNREFUSED|connection refused/i,
    message: '无法连接到服务',
    suggestion: '请检查网络连接后重试'
  },
  
  'ENOTFOUND': {
    pattern: /ENOTFOUND|getaddrinfo/i,
    message: '无法解析服务地址',
    suggestion: '请检查网络连接或 DNS 设置'
  },
  
  // 文件系统错误
  'ENOENT': {
    pattern: /ENOENT|no such file/i,
    message: '文件或目录不存在',
    suggestion: '可能是数据文件损坏，建议重新开始任务'
  },
  
  'EACCES': {
    pattern: /EACCES|permission denied/i,
    message: '权限不足',
    suggestion: '请检查文件权限或联系管理员'
  },
  
  'EEXIST': {
    pattern: /EEXIST|already exists/i,
    message: '文件已存在',
    suggestion: '可能是重复操作，请检查任务状态'
  },
  
  // JSON 相关错误
  'SyntaxError': {
    pattern: /SyntaxError|JSON.parse|Unexpected token/i,
    message: '数据格式错误',
    suggestion: '可能是数据文件损坏，已尝试自动修复'
  },
  
  // 认证错误
  '401': {
    pattern: /401|unauthorized|invalid.*key/i,
    message: '认证失败',
    suggestion: '请检查 API Key 配置是否正确（使用 /key 命令）'
  },
  
  '403': {
    pattern: /403|forbidden|insufficient.*permission/i,
    message: '权限不足',
    suggestion: 'API Key 可能已过期或权限不足，请重新配置'
  },
  
  // 资源错误
  '404': {
    pattern: /404|not found/i,
    message: '资源不存在',
    suggestion: '请求的资源可能已被删除或移动'
  },
  
  '429': {
    pattern: /429|too many requests|rate limit/i,
    message: '请求过于频繁',
    suggestion: '请稍等片刻后重试'
  },
  
  // 服务端错误
  '500': {
    pattern: /500|internal server error/i,
    message: '服务端错误',
    suggestion: '请稍后重试，如持续失败请联系支持'
  },
  
  '502': {
    pattern: /502|bad gateway/i,
    message: '网关错误',
    suggestion: '服务端可能正在维护，请稍后重试'
  },
  
  '503': {
    pattern: /503|service unavailable/i,
    message: '服务不可用',
    suggestion: '服务端可能正在维护，请稍后重试'
  }
};

/**
 * 将错误转换为用户友好的提示
 * @param {Error} error - 错误对象
 * @param {string} context - 操作上下文（如"研究任务"、"创建监控"）
 * @param {Object} options - 选项
 * @returns {string} 用户友好的错误提示
 */
export function formatErrorForUser(error, context = '操作', options = {}) {
  const { 
    includeSuggestion = true, 
    includeTechnical = false,
    prefix = '❌'
  } = options;
  
  if (!error) {
    return `${prefix} **${context}失败**\n\n未知错误，请稍后重试`;
  }
  
  // 获取错误消息
  const errorMessage = error.message || String(error);
  const statusCode = error.status || error.statusCode || extractStatusCode(errorMessage);
  
  // 查找匹配的错误类型
  let errorType = null;
  
  // 先按状态码匹配
  if (statusCode) {
    errorType = Object.values(ERROR_MAP).find(e => 
      e.pattern.test(String(statusCode))
    );
  }
  
  // 再按错误消息匹配
  if (!errorType) {
    errorType = Object.values(ERROR_MAP).find(e => 
      e.pattern.test(errorMessage)
    );
  }
  
  // 构建输出
  let output = `${prefix} **${context}失败**\n\n`;
  
  if (errorType) {
    output += `${errorType.message}`;
    
    if (includeSuggestion && errorType.suggestion) {
      output += `\n\n💡 ${errorType.suggestion}`;
    }
  } else {
    // 未知错误类型
    output += `${errorMessage}`;
    
    if (includeSuggestion) {
      output += `\n\n💡 请稍后重试，如持续失败请联系支持`;
    }
  }
  
  // 技术细节（调试用，默认不显示）
  if (includeTechnical) {
    output += `\n\n\`\`\`\n错误类型：${error.name || 'Unknown'}\n错误代码：${statusCode || 'N/A'}\n\`\`\``;
  }
  
  return output;
}

/**
 * 从错误消息中提取状态码
 * @param {string} message - 错误消息
 * @returns {number|null}
 */
function extractStatusCode(message) {
  const match = message.match(/status[:\s]*(\d{3})|HTTP[:\s]*(\d{3})|(\d{3})[:\s]*(error|failed)/i);
  if (match) {
    return parseInt(match[1] || match[2] || match[3]);
  }
  return null;
}

/**
 * 判断错误是否可重试
 * @param {Error} error - 错误对象
 * @returns {boolean}
 */
export function isRetryableError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || String(error);
  const statusCode = error.status || error.statusCode || extractStatusCode(errorMessage);
  
  // 网络相关错误：可重试
  if (/timeout|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(errorMessage)) {
    return true;
  }
  
  // 服务端错误：可重试
  if ([500, 502, 503, 504].includes(statusCode)) {
    return true;
  }
  
  // 限流错误：可重试（但需要等待）
  if (statusCode === 429) {
    return true;
  }
  
  // 客户端错误：不可重试
  if (statusCode >= 400 && statusCode < 500) {
    return false;
  }
  
  // 默认：可重试
  return true;
}

/**
 * 获取建议的重试延迟（毫秒）
 * @param {Error} error - 错误对象
 * @param {number} attempt - 当前重试次数
 * @returns {number} 延迟时间（毫秒）
 */
export function getRetryDelay(error, attempt = 1) {
  const statusCode = error?.status || error?.statusCode || extractStatusCode(error?.message || '');
  
  // 限流错误：使用更长的延迟
  if (statusCode === 429) {
    return Math.min(30000, 1000 * Math.pow(2, attempt)); // 指数退避，最多 30 秒
  }
  
  // 其他错误：标准指数退避
  return Math.min(10000, 1000 * Math.pow(2, attempt)); // 最多 10 秒
}
