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
    
    // LongCat-Flash-Thinking 模型：content 可能包含最终内容，reasoning_content 是思考过程
    // content 经常有 UTF-8 编码问题，需要尝试解码
    let responseText = message?.content || '';
    
    // 如果 content 解码后看起来正常（包含实际内容），使用它
    // 否则使用 reasoning_content
    if (responseText && responseText.trim().length > 20) {
      // 检查是否看起来像实际内容（中文、字母等，而不是乱码）
      const hasReadableContent = /[\u4e00-\u9fa5a-zA-Z0-9]/.test(responseText);
      if (hasReadableContent) {
        // content 看起来正常，直接使用
        return responseText;
      }
    }
    
    // 如果 content 为空、乱码或太短，使用 reasoning_content
    responseText = message?.reasoning_content || responseText || '';
    
    return responseText;
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