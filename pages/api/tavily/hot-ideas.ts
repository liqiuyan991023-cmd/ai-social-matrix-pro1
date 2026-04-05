import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// 日志记录工具
const logApiCall = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data: data || {}
  };
  console.log(`[TAVILY-API] ${JSON.stringify(logEntry)}`);
};

// 配置常量
const TAVILY_API_URL = process.env.TAVILY_API_URL || 'https://api.tavily.com';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// 调试日志
console.log('[TAVILY-API] Initializing with:', {
  TAVILY_API_URL,
  TAVILY_API_KEY: TAVILY_API_KEY ? `SET (length: ${TAVILY_API_KEY.length})` : 'NOT SET'
});
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL,
  'https://redspark.app' // 生产环境域名
].filter(Boolean);

// CORS配置
const setCorsHeaders = (res: NextApiResponse, origin: string) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
};

// 验证API密钥
const validateApiKey = (): { valid: boolean; error?: string } => {
  if (!TAVILY_API_KEY) {
    console.error('[TAVILY-API] TAVILY_API_KEY is undefined or empty');
    return {
      valid: false,
      error: 'TAVILY_API_KEY is not configured in environment variables'
    };
  }

  console.log('[TAVILY-API] TAVILY_API_KEY found, length:', TAVILY_API_KEY.length);

  if (TAVILY_API_KEY.length < 20) {
    console.error('[TAVILY-API] TAVILY_API_KEY appears to be invalid (too short)');
    return {
      valid: false,
      error: 'TAVILY_API_KEY appears to be invalid (too short)'
    };
  }

  return { valid: true };
};

// 生成缓存键
const generateCacheKey = (query: string, category?: string): string => {
  return `hot-ideas:${query}:${category || 'all'}`;
};

// 默认热点话题（API失败时使用）
const getDefaultHotTopics = (): any[] => [
  {
    title: "2026年春季穿搭新趋势：可持续时尚引领潮流",
    tag: "时尚",
    heat: `${Math.floor(Math.random() * 50) + 150}k`,
    url: "https://www.xiaohongshu.com/search_result?keyword=2026%E5%B9%B4%E6%98%A5%E5%AD%A3%E7%A9%BF%E6%90%AD%E6%96%B0%E8%B6%8B%E5%8A%BF"
  },
  {
    title: "AI助手重塑工作方式：2026年效率工具大盘点",
    tag: "效率工具",
    heat: `${Math.floor(Math.random() * 50) + 180}k`,
    url: "https://www.xiaohongshu.com/search_result?keyword=AI%E5%8A%A9%E6%89%8B%E9%87%8D%E6%96%97%E5%B7%A5%E4%BD%9C%E6%96%B9%E5%BC%8F"
  },
  {
    title: "智能家居进化：2026年必备的未来生活设备",
    tag: "家居",
    heat: `${Math.floor(Math.random() * 50) + 120}k`,
    url: "https://www.xiaohongshu.com/search_result?keyword=%E6%99%BA%E8%83%BD%E5%AE%B6%E5%B1%85%E8%BF%9B%E5%8C%96"
  },
  {
    title: "2026年科技新品：折叠屏手机与AR眼镜的较量",
    tag: "数码",
    heat: `${Math.floor(Math.random() * 50) + 200}k`,
    url: "https://www.xiaohongshu.com/search_result?keyword=2026%E5%B9%B4%E7%A7%91%E6%8A%80%E6%96%B0%E5%93%81"
  },
  {
    title: "零碳生活指南：2026年可持续生活方式",
    tag: "生活方式",
    heat: `${Math.floor(Math.random() * 50) + 140}k`,
    url: "https://www.xiaohongshu.com/search_result?keyword=%E9%9B%B6%E7%A2%B3%E7%94%9F%E6%B4%BB%E6%8C%87%E5%8D%97"
  },
  {
    title: "远程办公新常态：2026年数字游民生活攻略",
    tag: "职场",
    heat: `${Math.floor(Math.random() * 50) + 160}k`,
    url: "https://www.xiaohongshu.com/search_result?keyword=%E8%BF%9C%E7%A8%8B%E5%8A%9E%E5%85%AC%E6%96%B0%E5%B8%B8%E6%80%81"
  }
];

// 主处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin || req.headers.referer || '';
      setCorsHeaders(res, origin);
      return res.status(204).end();
    }

    // 只允许GET和POST方法
    if (req.method !== 'GET' && req.method !== 'POST') {
      logApiCall('error', 'Invalid request method', { method: req.method });
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only GET and POST methods are supported'
      });
    }

    // 设置CORS头
    const origin = req.headers.origin || req.headers.referer || '';
    setCorsHeaders(res, origin);

  // 验证API密钥
    const apiKeyValidation = validateApiKey();
    if (!apiKeyValidation.valid) {
      logApiCall('error', 'API key validation failed', { error: apiKeyValidation.error });
      return res.status(500).json({
        success: false,
        error: 'API Configuration Error',
        message: apiKeyValidation.error,
        data: getDefaultHotTopics()
      });
    }

    // 解析请求参数
    const requestData = req.method === 'GET' ? req.query : req.body;
    const { query = '小红书热门话题 2026年趋势', category, maxResults = 6 } = requestData;

    // 验证参数
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'Query parameter is required and must be a string'
      });
    }

    logApiCall('info', 'Incoming request', {
      method: req.method,
      query,
      category,
      maxResults,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // 验证参数
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'Query parameter is required and must be a string'
      });
    }

    // 准备Tavily API请求参数
    const params: Record<string, string> = {
      api_key: TAVILY_API_KEY!,
      query: query as string,
      max_results: maxResults.toString(),
      search_depth: 'advanced'
    };

    // 添加域名过滤（Tavily API支持domains参数）
    params.domains = ['xiaohongshu.com', 'weibo.com', 'zhihu.com', 'douban.com'].join(',');

    if (category) {
      params.category = category as string;
    }

    console.log('[TAVILY-API] Request params:', {
      ...params,
      api_key: params.api_key ? 'SET' : 'NOT SET' // 不打印完整的密钥
    });

    // 调用Tavily API
    logApiCall('info', 'Calling Tavily API', { url: `${TAVILY_API_URL}/search`, params });

    const startTime = Date.now();
    let response;

    try {
      // 尝试使用POST方法（Tavily API推荐）
      response = await axios.post(`${TAVILY_API_URL}/search`, params, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'RedSpark-Tavily-Proxy/1.0'
        }
      });
    } catch (postError: any) {
      // 如果POST失败且是405错误，尝试GET方法
      if (postError.response?.status === 405) {
        console.log('[TAVILY-API] POST method not allowed, trying GET method');
        try {
          response = await axios.get(`${TAVILY_API_URL}/search`, {
            params,
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'RedSpark-Tavily-Proxy/1.0'
            }
          });
        } catch (getError: any) {
          // 如果GET也失败，抛出POST的错误
          throw postError;
        }
      } else {
        throw postError;
      }
    }
    const queryTime = Date.now() - startTime;

    // 处理API响应
    if (response.data && Array.isArray(response.data.results)) {
      const results = response.data.results;

      // 转换数据格式
      const hotTopics = results.slice(0, maxResults).map((result: any) => ({
        title: result.title || '无标题',
        tag: category || extractCategoryFromTitle(result.title),
        heat: `${Math.floor(Math.random() * 100) + 50}k`,
        url: result.url || '#'
      }));

      logApiCall('info', 'Tavily API call successful', {
        resultCount: results.length,
        topicsReturned: hotTopics.length,
        queryTime
      });

      return res.status(200).json({
        success: true,
        data: hotTopics,
        source: 'tavily_api',
        cached: false,
        timestamp: new Date().toISOString(),
        meta: {
          totalResults: results.length,
          queryTime,
          category: category || 'general'
        }
      });
    } else {
      throw new Error('Unexpected response format from Tavily API');
    }

  } catch (error: any) {
    logApiCall('error', 'Tavily API call failed', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      details: error.response?.data
    });

    // 根据错误类型返回不同的状态码
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.code === 'ECONNABORTED') {
      statusCode = 408;
      errorMessage = 'Request timeout';
    } else if (error.response?.status === 401) {
      statusCode = 401;
      errorMessage = 'Tavily API authentication failed';
    } else if (error.response?.status === 403) {
      statusCode = 403;
      errorMessage = 'Tavily API access forbidden';
    } else if (error.response?.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    } else if (error.response?.status >= 500) {
      statusCode = 502;
      errorMessage = 'Tavily API server error';
    }

    // 返回fallback数据
    const fallbackTopics = getDefaultHotTopics();

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      message: errorMessage,
      data: fallbackTopics, // 重要：始终返回fallback数据
      source: 'fallback',
      timestamp: new Date().toISOString(),
      debug: {
        code: error.code,
        status: error.response?.status,
        details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
      }
    });
  }
}

// 从标题中提取分类
function extractCategoryFromTitle(title: string): string {
  const categoryKeywords: { [key: string]: string[] } = {
    '时尚': ['穿搭', '衣服', '时尚', '美妆', '护肤', '发型'],
    '数码': ['手机', '电脑', '数码', '科技', '电子产品', 'APP'],
    '美食': ['美食', '菜谱', '烘焙', '甜品', '早餐', '午餐', '晚餐'],
    '家居': ['家居', '装修', '家具', '家装', '智能家居'],
    '旅行': ['旅行', '旅游', '出游', '目的地', '攻略'],
    '职场': ['工作', '职场', '办公', '效率', '职业发展'],
    '生活方式': ['生活', '习惯', '健康', '运动', '阅读'],
    '创作': ['写作', '创作', '设计', '艺术', '摄影']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }

  return '热点';
}