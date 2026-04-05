import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    apiTests: {},
    systemInfo: {}
  };

  // 1. Check environment variables
  diagnostics.environment = {
    LONGCAT_API_URL: process.env.LONGCAT_API_URL || 'NOT_SET',
    LONGCAT_API_KEY: process.env.LONGCAT_API_KEY ? '✓ SET (length: ' + process.env.LONGCAT_API_KEY.length + ')' : 'NOT_SET',
    OPENAI_API_URL: process.env.OPENAI_API_URL || 'NOT_SET',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✓ SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT_SET',
    ZHIPU_API_URL: process.env.ZHIPU_API_URL || 'NOT_SET',
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY ? '✓ SET (length: ' + process.env.ZHIPU_API_KEY.length + ')' : 'NOT_SET',
    TAVILY_API_URL: process.env.TAVILY_API_URL || 'NOT_SET',
    TAVILY_API_KEY: process.env.TAVILY_API_KEY ? '✓ SET (length: ' + process.env.TAVILY_API_KEY.length + ')' : 'NOT_SET',
    REDIS_URL: process.env.REDIS_URL ? '✓ SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
  };

  // 2. Test LLM API connectivity and capability (ZhiPu/OpenAI/LongCat)
  console.log('[API-DIAGNOSTICS] Testing LLM API (ZhiPu/OpenAI/LongCat)...');
  try {
    const apiUrl = process.env.ZHIPU_API_URL || process.env.OPENAI_API_URL || process.env.LONGCAT_API_URL;
    const apiKey = process.env.ZHIPU_API_KEY || process.env.OPENAI_API_KEY || process.env.LONGCAT_API_KEY;
    const usingZhiPu = !!process.env.ZHIPU_API_KEY;
    const usingOpenAI = !!process.env.OPENAI_API_KEY && !usingZhiPu;

    if (!apiUrl || !apiKey) {
      diagnostics.apiTests.longcat = {
        status: 'FAILED',
        reason: 'Missing API configuration for ZhiPu, OpenAI, or LongCat',
        action: 'Please set ZHIPU_API_KEY (recommended), OPENAI_API_KEY, or LONGCAT_API_KEY in .env.local'
      };
    } else {
      const testPrompt = "你是助手。请用一句话回复：你配置正确吗？";

      console.log(`[API-DIAGNOSTICS] Calling ${usingZhiPu ? 'ZhiPu' : usingOpenAI ? 'OpenAI' : 'LongCat'} API at: ${apiUrl}`);

      let requestBody: any;
      let endpoint: string;

      if (usingZhiPu) {
        endpoint = `${apiUrl}/chat/completions`;
        requestBody = {
          model: 'glm-4',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 100,
          temperature: 0.7
        };
      } else {
        endpoint = `${apiUrl}/completions`;
        requestBody = {
          model: usingOpenAI ? 'gpt-3.5-turbo-instruct' : undefined,
          prompt: testPrompt,
          max_tokens: 100,
          temperature: 0.7
        };
      }

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      });

      let responseText: string;
      if (usingZhiPu) {
        responseText = response.data.choices?.[0]?.message?.content || '';
      } else {
        responseText = response.data.choices?.[0]?.text || '';
      }

      if (responseText) {
        diagnostics.apiTests.longcat = {
          status: 'SUCCESS',
          message: `✓ ${usingZhiPu ? 'ZhiPu' : usingOpenAI ? 'OpenAI' : 'LongCat'} API is working correctly`,
          responseText: responseText.substring(0, 100),
          fullResponse: response.data,
          apiType: usingZhiPu ? 'ZhiPu' : usingOpenAI ? 'OpenAI' : 'LongCat'
        };
        console.log(`[API-DIAGNOSTICS] ${usingZhiPu ? 'ZhiPu' : usingOpenAI ? 'OpenAI' : 'LongCat'} API test successful`);
      } else {
        diagnostics.apiTests.longcat = {
          status: 'FAILED',
          reason: 'Unexpected response format from API',
          rawResponse: response.data
        };
      }
    }
  } catch (error: any) {
    console.error('[API-DIAGNOSTICS] LLM API test failed:', error.message);
    diagnostics.apiTests.longcat = {
      status: 'FAILED',
      error: error.message,
      code: error.code,
      status_code: error.response?.status,
      details: error.response?.data || 'No response data'
    };
  }

  // 3. Test Tavily API connectivity
  console.log('[API-DIAGNOSTICS] Testing Tavily API...');
  try {
    if (!process.env.TAVILY_API_KEY) {
      diagnostics.apiTests.tavily = {
        status: 'FAILED',
        reason: 'Missing TAVILY_API_KEY environment variable',
        action: 'Please set TAVILY_API_KEY in .env.local'
      };
    } else {
      console.log('[API-DIAGNOSTICS] Calling Tavily API...');
      
      const response = await axios.post(
        'https://api.tavily.com/search',
        {
          api_key: process.env.TAVILY_API_KEY,
          query: '2026年趋势',
          max_results: 1
        },
        {
          timeout: 10000
        }
      );

      if (response.data && response.data.results) {
        diagnostics.apiTests.tavily = {
          status: 'SUCCESS',
          message: '✓ Tavily API is working correctly',
          resultCount: response.data.results.length
        };
        console.log('[API-DIAGNOSTICS] Tavily API test successful');
      } else {
        diagnostics.apiTests.tavily = {
          status: 'FAILED',
          reason: 'Unexpected response format',
          rawResponse: response.data
        };
      }
    }
  } catch (error: any) {
    console.error('[API-DIAGNOSTICS] Tavily API test failed:', error.message);
    diagnostics.apiTests.tavily = {
      status: 'FAILED',
      error: error.message,
      code: error.code,
      status_code: error.response?.status,
      details: error.response?.data || 'No response data'
    };
  }

  // 4. System info
  diagnostics.systemInfo = {
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  };

  // 5. Summary and recommendations
  const recommendations: string[] = [];
  
  if (!process.env.ZHIPU_API_KEY && !process.env.OPENAI_API_KEY && !process.env.LONGCAT_API_KEY) {
    recommendations.push('❌ LLM API is missing - This causes all content generation and summary features to fail with mock responses. Please set ZHIPU_API_KEY (recommended), OPENAI_API_KEY, or LONGCAT_API_KEY');
  }
  if (!process.env.TAVILY_API_KEY) {
    recommendations.push('❌ TAVILY_API_KEY is missing - This causes hot topics feature to show fallback/mock data');
  }
  if (diagnostics.apiTests.longcat?.status !== 'SUCCESS') {
    recommendations.push('⚠️  LLM API is not responding correctly - Check API URL and KEY validity');
  }
  if (diagnostics.apiTests.tavily?.status !== 'SUCCESS') {
    recommendations.push('⚠️  Tavily API is not responding correctly - Check API KEY validity');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All APIs are properly configured and working!');
  }

  const summary = {
    allApisConfigured: !!((process.env.ZHIPU_API_KEY || process.env.OPENAI_API_KEY || process.env.LONGCAT_API_KEY) && process.env.TAVILY_API_KEY),
    longcatApiWorking: diagnostics.apiTests.longcat?.status === 'SUCCESS',
    tavilyApiWorking: diagnostics.apiTests.tavily?.status === 'SUCCESS',
    recommendations
  };

  console.log('[API-DIAGNOSTICS] Diagnostics complete:', {
    longcatWorking: diagnostics.apiTests.longcat?.status === 'SUCCESS',
    tavilyWorking: diagnostics.apiTests.tavily?.status === 'SUCCESS'
  });

  res.status(200).json({
    ...diagnostics,
    summary
  });
}
