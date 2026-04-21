import axios from 'axios';

export async function callLongCatAPI(prompt: string, options: any = {}): Promise<string> {
  const apiUrl = process.env.LONGCAT_API_URL;
  const apiKey = process.env.LONGCAT_API_KEY;
  const model = process.env.LONGCAT_MODEL || 'LongCat-Flash-Thinking-2601';

  console.log('[callLongCatAPI] API Configuration Check:', {
    urlSet: !!apiUrl,
    keySet: !!apiKey,
    keyLength: apiKey?.length || 0,
    usingLongCat: true
  });

  if (!apiUrl || !apiKey) {
    console.error('[callLongCatAPI] CRITICAL: Missing LongCat API configuration!', {
      LONGCAT_API_URL: apiUrl ? 'SET' : 'NOT SET',
      LONGCAT_API_KEY: apiKey ? 'SET' : 'NOT SET'
    });
    throw new Error('Missing LongCat API configuration');
  }

  try {
    console.log('[callLongCatAPI] Calling LongCat API at:', apiUrl);

    const endpoint = apiUrl;
    const requestBody = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.max_tokens || 3000,
      temperature: options.temperature || 0.7
    };

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 120000
    });

    console.log('[callLongCatAPI] SUCCESS: Got response from LongCat API');

    const message = response.data.choices?.[0]?.message;

    let content = message?.content || '';
    const reasoning = message?.reasoning_content || '';

    // 检查 content 是否正常（非乱码）
    const hasReadableContent = content && /[\u4e00-\u9fa5a-zA-Z]/.test(content);

    if (hasReadableContent && content.trim().length > 20) {
      // content 正常，直接使用
      return content;
    }

    // content 不正常，尝试从 reasoning_content 中提取实际内容
    if (reasoning && reasoning.length > 50) {
      // reasoning_content 通常包含：思考过程 + 最终内容
      // 尝试找到实际内容部分（通常在 "现在写" 或 "完整内容" 之后）
      const markers = ['现在写', '完整内容', '输出：', '内容：', '最终：'];
      let actualContent = '';

      for (const marker of markers) {
        const markerIndex = reasoning.lastIndexOf(marker);
        if (markerIndex !== -1 && markerIndex < reasoning.length - 20) {
          actualContent = reasoning.substring(markerIndex + marker.length).trim();
          break;
        }
      }

      // 如果没找到标记，尝试取后半部分（通常实际内容在后面）
      if (!actualContent) {
        const halfIndex = Math.floor(reasoning.length / 2);
        actualContent = reasoning.substring(halfIndex).trim();
      }

      // 清理内容：移除思考过程的部分
      actualContent = actualContent
        .replace(/首先[\s\S]*?其次/g, '')
        .replace(/需要[\s\S]*?输出/g, '')
        .replace(/重要：[\s\S]*?不要/g, '')
        .trim();

      if (actualContent.length > 20) {
        return actualContent;
      }

      // 如果提取失败，返回 reasoning 本身
      return reasoning;
    }

    // 最后的保底方案：返回 content（即使可能是乱码）
    return content || reasoning || '';
  } catch (error: any) {
    console.error('[callLongCatAPI] FAILED: Error calling LongCat API:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.error('[callLongCatAPI] Authentication Failed - Check LONGCAT_API_KEY validity');
    } else if (error.response?.status === 404) {
      console.error('[callLongCatAPI] API Endpoint Not Found - Check LONGCAT_API_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('[callLongCatAPI] Connection Refused - LongCat API service may be down');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('[callLongCatAPI] Request Timeout - LongCat API service may be slow or unreachable');
    }

    throw error;
  }
}