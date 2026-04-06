import { NextApiRequest, NextApiResponse } from 'next';
import { callLongCatAPI } from '../../lib/api/longcat';

// 日志记录工具
const logApiCall = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data: data || {}
  };
  console.log(`[GENERATE-PERSONA-API] ${JSON.stringify(logEntry)}`);
};

// 验证API密钥
const validateApiKey = (): { valid: boolean; error?: string } => {
  // 优先使用智谱AI，然后使用LongCat，最后使用OpenAI
  const zhipuApiKey = process.env.ZHIPU_API_KEY;
  const longcatApiKey = process.env.LONGCAT_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  console.log('[GENERATE-PERSONA-API] API Key Check:', {
    ZHIPU_API_KEY: zhipuApiKey ? `✓ SET (length: ${zhipuApiKey.length})` : '❌ NOT SET',
    LONGCAT_API_KEY: longcatApiKey ? `✓ SET (length: ${longcatApiKey.length})` : '❌ NOT SET',
    OPENAI_API_KEY: openaiApiKey ? `✓ SET (length: ${openaiApiKey.length})` : '❌ NOT SET'
  });

  // 检查是否至少有一个API密钥
  if (!zhipuApiKey && !longcatApiKey && !openaiApiKey) {
    console.error('[GENERATE-PERSONA-API] No API key is configured');
    return {
      valid: false,
      error: 'No API key is configured. Please set ZHIPU_API_KEY, LONGCAT_API_KEY, or OPENAI_API_KEY in environment variables'
    };
  }

  return { valid: true };
};

// 生成创作人格画像的prompt
const buildPersonaPrompt = (userInput: string): string => {
  return `基于以下用户信息，生成一个详细的小红书创作者人设画像。

【用户输入信息】
${userInput}

【要求】
请按照以下维度总结人物画像，结构清晰、无冗余：

1. 年龄范围：根据用户描述推断合适的年龄段
2. 职业或主要身份：明确用户的职业或身份定位
3. 平时关注内容：分析用户感兴趣的内容领域
4. 表达风格：确定适合用户的表达方式和语气
5. 创作内容偏好：明确用户希望创作的内容类型
6. 内容长度：推荐适合用户的内容长度
7. 创作需求：理解用户的创作目标和需求
8. 受众群体：分析目标受众特征

【输出格式】
请按照以下JSON格式输出，不要包含任何额外说明或解释：

{
  "ageRange": "26-35岁",
  "profession": "互联网产品经理",
  "interests": ["科技产品", "职场成长", "生活方式"],
  "contentStyle": "专业细致，亲切自然",
  "contentGoals": ["分享专业知识", "记录成长历程", "帮助他人"],
  "preferredLength": "medium",
  "targetAudience": "职场新人，对科技感兴趣的年轻人",
  "personality": "基于用户特点生成的详细创作人格描述，包含个性特点、创作优势、表达风格等，用友好的语气输出，让用户感受到AI的个性化关怀。"
}

【重要提醒】
- 必须严格按照用户输入信息生成，不能添加或编造信息
- personality字段需要详细的描述，至少100字
- 所有字段都必须填写，不能为空
- 语言要友好自然，体现个性化关怀`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).end();
    }

    // 只允许POST方法
    if (req.method !== 'POST') {
      logApiCall('error', 'Invalid request method', { method: req.method });
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST method is supported'
      });
    }

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 验证API密钥
    const apiKeyValidation = validateApiKey();
    if (!apiKeyValidation.valid) {
      logApiCall('error', 'API key validation failed', { error: apiKeyValidation.error });
      return res.status(500).json({
        success: false,
        error: 'API Configuration Error',
        message: apiKeyValidation.error
      });
    }

    // 解析请求参数
    const { userInput } = req.body;

    // 验证参数
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'userInput parameter is required and must be a non-empty string'
      });
    }

    // 限制输入长度
    if (userInput.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'userInput parameter is too long (max 2000 characters)'
      });
    }

    logApiCall('info', 'Incoming request', {
      userInputLength: userInput.length,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // 构建prompt
    const prompt = buildPersonaPrompt(userInput);

    logApiCall('info', 'Generated prompt', { promptLength: prompt.length });

    // 调用AI API（优先使用智谱AI）
    const startTime = Date.now();

    try {
      const response = await callLongCatAPI(prompt, {
        max_tokens: 1500,
        temperature: 0.7
      });

      const queryTime = Date.now() - startTime;
      logApiCall('info', 'LongCat API call successful', { queryTime });

      // 尝试解析JSON响应
      let personaData;
      try {
        // 清理响应，移除可能的markdown代码块标记
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        personaData = JSON.parse(cleanedResponse);

        // 验证必需字段
        const requiredFields = ['ageRange', 'profession', 'interests', 'contentStyle', 'personality'];
        for (const field of requiredFields) {
          if (!personaData[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // 确保interests是数组
        if (typeof personaData.interests === 'string') {
          personaData.interests = personaData.interests.split(',').map((i: string) => i.trim());
        }

      } catch (parseError) {
        console.error('[GENERATE-PERSONA-API] Failed to parse response as JSON:', parseError);
        console.log('[GENERATE-PERSONA-API] Raw response:', response);

        // 如果解析失败，返回一个合理的默认响应
        personaData = {
          ageRange: '26-35岁',
          profession: '互联网产品经理',
          interests: ['科技产品', '职场成长', '生活方式'],
          contentStyle: '专业细致，亲切自然',
          contentGoals: ['分享专业知识', '记录成长历程'],
          preferredLength: 'medium',
          targetAudience: '职场新人，对科技感兴趣的年轻人',
          personality: `基于你的个人特点（互联网产品经理、26-35岁），我为你定制了专属的创作风格。你的优势在于科技产品和职场成长，建议重点关注专业内容和职场经验，采用专业细致的表达方式，这样最容易引起目标受众的共鸣。`
        };
      }

      // 返回成功响应
      return res.status(200).json({
        success: true,
        data: personaData,
        timestamp: new Date().toISOString(),
        meta: {
          queryTime,
          promptLength: prompt.length,
          responseLength: response.length
        }
      });

    } catch (apiError: any) {
      const queryTime = Date.now() - startTime;
      logApiCall('error', 'LongCat API call failed', {
        error: apiError.message,
        code: apiError.code,
        queryTime
      });

      // 根据错误类型返回不同的状态码
      let statusCode = 500;
      let errorMessage = 'Internal server error';

      if (apiError.code === 'ECONNABORTED') {
        statusCode = 408;
        errorMessage = 'Request timeout';
      } else if (apiError.response?.status === 401) {
        statusCode = 401;
        errorMessage = 'LongCat API authentication failed';
      } else if (apiError.response?.status === 403) {
        statusCode = 403;
        errorMessage = 'LongCat API access forbidden';
      } else if (apiError.response?.status === 429) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded';
      } else if (apiError.response?.status >= 500) {
        statusCode = 502;
        errorMessage = 'LongCat API server error';
      }

      return res.status(statusCode).json({
        success: false,
        error: apiError.message,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        debug: process.env.NODE_ENV === 'development' ? {
          code: apiError.code,
          status: apiError.response?.status,
          details: apiError.response?.data
        } : undefined
      });
    }

  } catch (error: any) {
    logApiCall('error', 'Unexpected error in handler', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}