export async function searchInternet(query, secrets) {
  const apiKey = secrets?.TAVILY_API_KEY;
  if (!apiKey) return { content: '', results: [] };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒硬超时

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query, max_results: 3 }),
      signal: controller.signal
    });
    const data = await response.json();
    return {
      content: data.results?.map(r => r.content).join(' ') || '',
      results: data.results || []
    };
  } catch (error) {
    return { content: '', results: [] };
  } finally {
    clearTimeout(timeoutId);
  }
}
