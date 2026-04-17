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
请严格按照以下8个维度总结人物画像，结构清晰、无冗余：

1. 年龄范围：根据用户描述推断合适的年龄段
2. 职业或主要身份：明确用户的职业或身份定位
3. 平时关注内容：分析用户感兴趣的内容领域
4. 表达风格：确定适合用户的表达方式和语气
5. 创作内容偏好：明确用户希望创作的内容类型
6. 内容长度：推荐适合用户的内容长度
7. 创作目的：理解用户的创作目标和意图
8. 受众群体：分析目标受众特征和偏好

【输出格式】
请按照以下JSON格式输出，不要包含任何额外说明或解释：

{
  "ageRange": "26-35岁",
  "profession": "互联网产品经理",
  "interests": ["科技产品", "职场成长", "生活方式"],
  "contentStyle": "专业细致，亲切自然",
  "contentGoals": ["专业干货", "职场经验"],
  "preferredLength": "medium",
  "creativePurpose": "分享专业知识，帮助职场新人成长",
  "targetAudience": "职场新人，对科技感兴趣的年轻人",
  "personaSummary": "基于用户特点生成的AI创作人格总结，包含创作者人设描述、适合的内容类型和主题、表达风格特点、受众群体分析、内容创作建议等，用友好的语气输出，让用户感受到AI的个性化关怀。"
}

【重要提醒】
- 必须严格按照用户输入信息生成，不能添加或编造信息
- personaSummary字段需要详细的描述，至少100字，体现个性化关怀
- 所有字段都必须填写，不能为空
- 语言要友好自然，像是AI助手在和用户对话
- interests字段必须是数组格式
- contentGoals字段必须是数组格式`;
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
      // 优化API调用参数，减少响应时间
      const response = await callLongCatAPI(prompt, {
        max_tokens: 1000, // 减少最大令牌数
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

        // 如果解析失败，基于用户输入生成一个合理的默认响应
        // 解析用户输入的各个字段
        const userLines = userInput.split('\n');
        const userData: any = {};
        userLines.forEach(line => {
          const [key, value] = line.split('：');
          if (key && value) {
            userData[key.trim()] = value.trim();
          }
        });

        // 构建个性化的人格总结
        const ageRange = userData['年龄范围'] || '26-35岁';
        const profession = userData['职业'] || '创作者';
        const interests = userData['兴趣'] || '生活分享';
        const contentGoals = userData['内容偏好'] || '生活分享';
        const contentStyle = userData['表达风格'] || '亲切自然';
        const creativePurpose = userData['创作目的'] || userData['创作需求'] || '分享生活经验';

        // 将兴趣字符串转换为数组
        const interestsArray = interests.includes('、') || interests.includes(',')
          ? interests.split(/[、,]/).map((i: string) => i.trim())
          : [interests];

        // 将内容偏好字符串转换为数组
        const contentGoalsArray = contentGoals.includes('、') || contentGoals.includes(',')
          ? contentGoals.split(/[、,]/).map((i: string) => i.trim())
          : [contentGoals];

        personaData = {
          ageRange,
          profession,
          interests: interestsArray,
          contentStyle,
          contentGoals: contentGoalsArray,
          preferredLength: userData['内容长度'] || 'medium',
          creativePurpose,
          targetAudience: '对相关内容感兴趣的读者',
          personaSummary: `基于你的个人特点（${profession}、${ageRange}），我为你定制了专属的创作风格。你的优势在于${interests}，建议重点关注${contentGoals}，采用${contentStyle}的表达方式，以${creativePurpose}为创作目的，这样最容易吸引对你的内容感兴趣的读者群体。`
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