import { buildSmartPrompt } from '../core/promptEngine.js';

/**
 * 执行流式研究任务（新版 - 无用户画像）
 * @param {Object} options
 * @param {string} options.apiKey - CUECUE API Key
 * @param {string} options.topic - 研究主题
 * @param {string} options.mode - 研究模式 (trader|fund-manager|researcher|...)
 * @param {string} options.conversationId - 16 位 UUID
 * @param {Function} options.onProgress - 进度回调
 */
export async function executeResearchStream({
  apiKey,
  topic,
  mode = 'default',
  conversationId,
  onProgress
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 分钟总超时

  try {
    // 生成 conversationId（如果没有提供）
    const { randomUUID } = await import('crypto');
    const finalConversationId = conversationId || randomUUID().replace(/-/g, '').substring(0, 16);
    
    // 构建提示词（无需用户画像）
    const prompt = buildSmartPrompt(topic, { mode });
    
    const response = await fetch('https://cuecue.cn/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: prompt }],
        mode,
        conversationId: finalConversationId
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let reportContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const event = JSON.parse(dataStr);
            if (event.type === 'start_of_agent') {
              onProgress({ 
                percent: 40, 
                stage: `智能体 ${event.data.agent_name} 推理中...`,
                subtask: event.data.agent_name
              });
            } else if (event.type === 'message' && event.data.delta?.content) {
              reportContent += event.data.delta.content.replace(/【\d+-\d+】/g, '');
            } else if (event.type === 'final_session_state') {
              onProgress({ percent: 99, stage: '生成总结', subtask: 'finalizing' });
            }
          } catch (e) {}
        }
      }
    }
    
    const reportUrl = `https://cuecue.cn/c/${finalConversationId}`;
    return { report: reportContent, reportUrl, conversationId: finalConversationId };
  } finally {
    clearTimeout(timeoutId);
  }
}
