import { NextApiRequest, NextApiResponse } from "next";
import { ContentGenerationService } from "../../../lib/services/contentGenerationService";
import { UserProfileService } from "../../../lib/services/userProfileService";
import { TopicRecommendationService } from "../../../lib/services/topicRecommendationService";
import { callLongCatAPI } from "../../../lib/api/longcat";

export const config = {
  api: {
    bodyParser: true,
  },
};

// 日志记录工具
const logApiCall = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data: data || {}
  };
  console.log(`[GENERATE-CONTENT-API] ${JSON.stringify(logEntry)}`);
};

// 验证API密钥
const validateApiKey = (): { valid: boolean; error?: string } => {
  const longcatApiKey = process.env.LONGCAT_API_KEY;

  if (!longcatApiKey) {
    console.error('[GENERATE-CONTENT-API] LONGCAT_API_KEY is not configured');
    return {
      valid: false,
      error: 'LONGCAT_API_KEY is not configured in environment variables'
    };
  }

  return { valid: true };
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
    if (req.method !== "POST") {
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
    const { userId, topicId, regenerate, idea, userInput, personaSummary } = req.body;

    // 严格参数校验：userInput 和 personaSummary 不能为空
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'userInput parameter is required and must be a non-empty string'
      });
    }

    if (!personaSummary || typeof personaSummary !== 'string' || personaSummary.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'personaSummary parameter is required and must be a non-empty string'
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

    if (personaSummary.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'personaSummary parameter is too long (max 4000 characters)'
      });
    }

    if (!userId || !topicId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'User ID and Topic ID are required'
      });
    }

    logApiCall('info', 'Incoming request', {
      userInputLength: userInput.length,
      personaSummaryLength: personaSummary.length,
      userId,
      topicId,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    let userProfile: any = null;
    let topic: any = null;

    try {
      const profileService = new UserProfileService();
      userProfile = await profileService.getProfile(userId);

      // 如果从Redis获取失败，尝试从数据库或创建默认画像
      if (!userProfile) {
        logApiCall('warn', `User profile not found in Redis for userId: ${userId}, trying to create default profile`);

        // 尝试创建默认用户画像
        const defaultProfileData: any = {
          userId,
          ageRange: "26-35",
          profession: "创作者",
          interests: ["生活分享", "内容创作"],
          expertise: ["生活分享", "内容创作"],
          contentGoals: ["生活分享"],
          contentStyle: "亲切自然",
          preferredLength: "medium"
        };

        try {
          userProfile = await profileService.createProfile(defaultProfileData);
          logApiCall('info', `Created default profile for userId: ${userId}`);
        } catch (createError) {
          logApiCall('error', "Failed to create default profile", { error: createError });
          // 继续执行，使用最小化用户画像
          userProfile = {
            userId,
            ageRange: "26-35",
            profession: "创作者",
            interests: ["生活分享"],
            expertise: ["内容创作"],
            contentGoals: ["生活分享"],
            contentStyle: "亲切自然",
            preferredLength: "medium"
          };
        }
      }

      const topicService = new TopicRecommendationService();
      topic = await topicService.getRecommendation(topicId);

      // 如果主题不存在，创建默认主题
      if (!topic) {
        logApiCall('warn', `Topic not found for topicId: ${topicId}, creating default topic`);

        topic = {
          id: `topic_default_${Date.now()}`,
          title: "生活分享",
          contentAngle: "分享生活中的美好瞬间",
          category: "生活方式",
          trendingScore: 85,
          estimatedEngagement: 75,
          matchScore: 90,
          difficulty: "easy",
          similarAccounts: []
        };
        logApiCall('info', `Created default topic for user: ${userId}`);
      }
    } catch (error) {
      logApiCall('error', 'Error fetching profile or topic', { error });
      // 使用最小化配置继续执行
      userProfile = userProfile || {
        userId,
        ageRange: "26-35岁",
        profession: "创作者",
        interests: ["生活分享"],
        expertise: ["内容创作"],
        contentGoals: ["生活分享"],
        contentStyle: "亲切自然",
        preferredLength: "medium"
      };
      topic = topic || {
        id: `topic_default_${Date.now()}`,
        title: "生活分享",
        contentAngle: "分享生活中的美好瞬间"
      };
    }

    const contentService = new ContentGenerationService();
    const startTime = Date.now();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await generateContentStream(res, contentService, userProfile, topic, regenerate, idea, personaSummary);
    
  } catch (error) {
    console.error("Error in content generation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function generateContentStream(
  res: NextApiResponse,
  contentService: ContentGenerationService,
  userProfile: any,
  topic: any,
  regenerate?: string,
  idea?: string,
  personaSummary?: string
) {
  res.write(`data: ${JSON.stringify({ stage: "title", content: "" })}\n\n`);
  
  const titles = await contentService.generateTitle(userProfile, topic, regenerate, idea);
  const selectedTitle = titles[0];
  
  res.write(`data: ${JSON.stringify({ stage: "title", content: selectedTitle })}\n\n`);
  
  res.write(`data: ${JSON.stringify({ stage: "content", content: "" })}\n\n`);
  
  // 构建更强的prompt，包含对idea的强制性约束 + 创作人格
  const enhancedPrompt = buildEnhancedContentPrompt(userProfile, topic, selectedTitle, idea, regenerate, personaSummary);
  
  let content = '';
    try {
      content = await callLongCatAPI(enhancedPrompt);
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('LLM API returned empty content');
      }
    } catch (apiError) {
      logApiCall('error', 'LLM API call failed', {
        error: apiError,
        message: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });

      // 异常兜底：返回友好错误信息，而不是直接抛出
      return res.status(500).json({
        success: false,
        error: 'LLM_API_Error',
        message: '内容生成服务暂时不可用，请稍后重试',
        timestamp: new Date().toISOString(),
        debug: process.env.NODE_ENV === 'development' ? {
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          prompt: enhancedPrompt.substring(0, 100) + '...'
        } : undefined
      });
    }
  
  res.write(`data: ${JSON.stringify({ stage: "content", content })}\n\n`);
  
  res.write(`data: ${JSON.stringify({ stage: "keywords", content: {} })}\n\n`);
  
  const keywords = await contentService.generateKeywords(userProfile, topic, selectedTitle, content);
  
  res.write(`data: ${JSON.stringify({ stage: "keywords", content: keywords })}\n\n`);
  
  const creationId = await contentService.saveCreation(userProfile.userId, {
    title: selectedTitle,
    content,
    keywords,
    topic,
  });
  
  res.write(`data: ${JSON.stringify({ 
    stage: "complete", 
    content: { id: creationId, title: selectedTitle, content, keywords } 
  })}\n\n`);
  
  res.write("data: [DONE]\n\n");
  res.end();
}

function buildEnhancedContentPrompt(userProfile: any, topic: any, title: string, idea?: string, regenerate?: string, personaSummary?: string): string {
  // 使用请求体中的personaSummary，如果不存在则尝试从userProfile获取
  let creativePersonaSummary = personaSummary || '';
  try {
    if (!creativePersonaSummary && userProfile.creativePersona) {
      creativePersonaSummary = typeof userProfile.creativePersona === 'string'
        ? userProfile.creativePersona
        : JSON.stringify(userProfile.creativePersona);
    }
  } catch (error) {
    logApiCall('warn', 'Failed to parse creative persona', { error });
  }

  // 确保所有必要字段都有值，防止undefined
  const safeUserProfile = {
    ageRange: userProfile.ageRange || '26-35岁',
    profession: userProfile.profession || '创作者',
    interests: Array.isArray(userProfile.interests) ? userProfile.interests : ['生活分享'],
    contentStyle: userProfile.contentStyle || '亲切自然',
    contentGoals: Array.isArray(userProfile.contentGoals) ? userProfile.contentGoals : ['生活分享'],
    preferredLength: userProfile.preferredLength || 'medium'
  };

  const lengthText = safeUserProfile.preferredLength === 'short' ? '简短（150-200字）' :
                     safeUserProfile.preferredLength === 'medium' ? '中等（250-400字）' :
                     safeUserProfile.preferredLength === 'long' ? '较长（500-800字）' : '中等（250-400字）';

  return `你是一个专业的小红书内容创作助手。现在需要根据以下信息生成一条小红书笔记。

【用户创作人格与基本信息】
- 年龄：${safeUserProfile.ageRange}
- 职业：${safeUserProfile.profession}
- 兴趣：${safeUserProfile.interests.join(", ")}
- 表达风格：${safeUserProfile.contentStyle}
- 创作偏好：${safeUserProfile.contentGoals.join(" / ")}
${creativePersonaSummary ? `- AI总结的创作人格：${creativePersonaSummary}` : ''}

【笔记标题】
${title}

【核心要求】
${idea ? `
⚠️ 【最高优先级】用户的创作想法：${idea}

你必须严格按照用户的想法来创作内容。这是最重要的要求。
- 如果用户想分享"穿搭"，必须是穿搭相关的内容
- 如果用户想讨论"工作压力"，必须是职场相关的内容
- 禁止偏离用户的主题，生成无关或错误的内容

用户的创作想法是核心。即使自动推荐的主题与用户想法不完全一致，也要优先遵循用户的想法。
` : `创意展现：使用${safeUserProfile.contentStyle}的风格呈现内容`}

【笔记内容要求】
1. ⭐ 内容主题必须完全匹配用户想法${idea ? `（用户说：${idea}）` : ""}，不能偏离
2. 文风应该${safeUserProfile.contentStyle}，充分体现用户的个性和气质
${creativePersonaSummary ? `3. 创作风格参考：${creativePersonaSummary}` : '3. 遵循用户的个人风格'}
4. 内容长度： ${lengthText}
5. 包含适当的emoji和换行符，提升可读性
6. 结构清晰：有开头、主体、结尾，逻辑连贯
7. 包含个人感受、细节描写和真实例子
8. 符合小红书平台的风格和规范
9. 内容真实可信，避免夸大或虚假信息
10. 语言流畅自然，符合目标受众阅读习惯

${regenerate ? `【用户的优化反馈】
${regenerate}
请根据用户的反馈改进和调整内容。` : ''}

【重要提醒】
- 生成的内容必须贴合用户的创作人格画像
- 确保内容原创，避免抄袭
- 保持积极正面的价值观
- 符合小红书社区规范

现在，请生成笔记正文内容。记住最重要的是：确保内容与用户的想法完全匹配！`;
}
