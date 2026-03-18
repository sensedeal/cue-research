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
    
    // 构建提示词（增强版 Prompt）
    const prompt = buildSmartPrompt(topic, mode);
    
    // 生成 messageId（必需参数）
    const messageId = `msg_${randomUUID().replace(/-/g, '')}`;
    // 生成 chat_id（必需参数，必须是 UUID）
    const chatId = randomUUID().replace(/-/g, '');
    
    const response = await fetch('https://cuecue.cn/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: prompt, id: messageId, type: 'text' }],
        chat_id: chatId,
        conversation_id: finalConversationId,
        need_confirm: false,
        need_analysis: false,
        need_underlying: false,
        need_recommend: false,
        verbose: true
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
            
            // 检查智能体启动事件
            if (event.agent_name) {
              onProgress({ 
                percent: 40, 
                stage: `智能体 ${event.agent_name} 推理中...`,
                subtask: event.agent_name
              });
            }
            // 检查工具调用事件
            else if (event.tool_title) {
              onProgress({ 
                percent: 60, 
                stage: `执行工具：${event.tool_title}`,
                subtask: event.tool_name || event.tool_title
              });
            }
            // 检查消息内容
            else if (event.delta?.content) {
              reportContent += event.delta.content.replace(/【\\d+-\\d+】/g, '');
            }
            // 检查完成状态
            else if (event.conversation_status === 'finished') {
              onProgress({ percent: 99, stage: '生成总结', subtask: 'finalizing' });
            }
          } catch (e) {
            console.log('[Parse Error]', e.message, 'data:', dataStr.substring(0, 100));
          }
        }
      }
    }
    
    const reportUrl = `https://cuecue.cn/c/${finalConversationId}`;
    return { report: reportContent, reportUrl, conversationId: finalConversationId };
  } finally {
    clearTimeout(timeoutId);
  }
}
