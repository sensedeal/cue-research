import { buildSmartPrompt } from '../core/promptEngine.js';

export async function executeResearchStream(apiKey, topic, onProgress) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 分钟总超时

  try {
    const response = await fetch('https://cuecue.cn/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: buildSmartPrompt(topic) }] }),
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
              onProgress({ percent: 40, stage: `智能体 ${event.data.agent_name} 推理中...` });
            } else if (event.type === 'message' && event.data.delta?.content) {
              reportContent += event.data.delta.content.replace(/【\d+-\d+】/g, '');
            } else if (event.type === 'final_session_state') {
              onProgress({ percent: 99, stage: '生成总结' });
            }
          } catch (e) {}
        }
      }
    }
    return { report: reportContent, reportUrl: `https://cuecue.cn/c/${Date.now()}` };
  } finally {
    clearTimeout(timeoutId);
  }
}
