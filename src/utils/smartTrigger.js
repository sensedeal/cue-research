export function evaluateSmartTrigger(triggerTopic, content) {
  if (!content || content.length < 50) return { shouldTrigger: false };
  
  // 简易 NLP：计算重合词命中率 (脱离了易挂起的 LLM)
  const triggerWords = triggerTopic.split(/\s+/).filter(w => w.length > 1);
  if (triggerWords.length === 0) return { shouldTrigger: content.includes(triggerTopic) };

  let matchCount = 0;
  for (const word of triggerWords) {
    if (content.includes(word)) matchCount++;
  }
  
  const ratio = matchCount / triggerWords.length;
  return { shouldTrigger: ratio >= 0.4 }; // 40% 命中率即触发
}
