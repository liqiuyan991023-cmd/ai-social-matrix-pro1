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
      max_tokens: options.max_tokens || 2000,
      temperature: options.temperature || 0.7
    };

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    console.log('[callLongCatAPI] SUCCESS: Got response from LongCat API');

    const responseText = response.data.choices?.[0]?.message?.content || '';
    if (responseText) {
      return responseText;
    } else {
      console.error('[callLongCatAPI] Unexpected LongCat response format:', response.data);
      throw new Error('Unexpected response format from LongCat API');
    }
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