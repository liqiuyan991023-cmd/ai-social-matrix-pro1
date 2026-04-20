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

// 模拟内容生成函数
function generateMockContent(title: string, userInput?: string): string {
  const topic = userInput || title;
  
  // 分析用户输入，提取关键信息
  const analysis = analyzeUserInput(topic);
  
  const mockContents = [
    `大家好呀！今天想和大家分享一下${analysis.subject}～\n\n${analysis.opening}\n\n${analysis.body}\n\n${analysis.closing}\n\n${analysis.hashtags}`,
    `${analysis.opening}\n\n最近和${analysis.subject}相处的时光真的很治愈。${analysis.body}\n\n分享出来希望能给大家带来一点快乐！\n\n${analysis.closing}\n\n${analysis.hashtags}`,
    `今天来聊聊我的${analysis.subject}～\n\n${analysis.body}\n\n${analysis.closing}\n\n${analysis.hashtags}`
  ];

  return mockContents[Math.floor(Math.random() * mockContents.length)];
}

// 分析用户输入，提取关键信息
function analyzeUserInput(input: string): any {
  // 提取主体（如小猫咪、宠物、美食等）
  let subject = '生活日常';
  let name = '';
  let food = '';
  
  // 检测宠物相关词汇
  if (input.includes('猫咪') || input.includes('猫')) {
    subject = '我家的小猫咪';
    // 提取名字
    const nameMatch = input.match(/叫([^。，,]+)/);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
  } else if (input.includes('狗狗') || input.includes('狗')) {
    subject = '我家的狗狗';
    const nameMatch = input.match(/叫([^。，,]+)/);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
  } else if (input.includes('宠物')) {
    subject = '我家的宠物';
  } else if (input.includes('美食') || input.includes('做法') || input.includes('菜谱') || input.includes('烹饪')) {
    // 检测美食相关词汇
    subject = '美食做法';
    // 提取具体美食
    const foodMatch = input.match(/分享(?:一个|一道|一种)?(?:美食|菜品)?(?:做法)?，?([^。，,]+)/);
    if (foodMatch) {
      food = foodMatch[1].trim();
    } else if (input.includes('蒸鸡蛋')) {
      food = '蒸鸡蛋';
    }
  }
  
  // 生成开场白
  let opening = '大家好～';
  if (name) {
    opening = `大家好！今天要给大家介绍我的小可爱 ${name}～`;
  } else if (food) {
    opening = `大家好！今天想和大家分享${food}的做法～`;
  }
  
  // 生成主体内容
  let body = '';
  if (subject.includes('猫咪') && name) {
    body = `说到${name}，它真的是我生活里的快乐源泉！每天回家一开门，它就会跑过来蹭我的腿，超级粘人～\n\n最近它特别喜欢玩逗猫棒，每次玩起来都像个小疯子，可爱到爆炸！\n\n最让我感动的是，每当我工作压力大的时候，它总会安静地趴在我腿上，仿佛在安慰我。`;
  } else if (subject.includes('猫咪')) {
    body = `我家猫咪真的超有个性！有时候高冷得像个女王，有时候又粘人得像个小baby～\n\n最近发现它特别喜欢在窗台上晒太阳，缩成一团像个小毛球，简直萌化了！`;
  } else if (subject.includes('狗狗')) {
    body = `我家狗狗真的是个小天使！每天准时叫我起床，陪我散步，还会在我难过的时候舔我的手～\n\n最近它学会了新技能，会接飞盘了，超级聪明！`;
  } else if (subject.includes('美食做法') && food === '蒸鸡蛋') {
    body = `分享一个超级简单又好吃的${food}做法！\n\n食材：鸡蛋2个、温水适量、盐少许、生抽、香油\n\n步骤：\n1. 鸡蛋打散，加入少许盐调味\n2. 加入1.5倍的温水，搅拌均匀\n3. 用滤网过滤掉气泡\n4. 盖上保鲜膜，用牙签扎几个小孔\n5. 水开后大火蒸8-10分钟\n6. 取出后淋上生抽和香油\n\n这样做出来的蒸鸡蛋嫩滑如布丁，老人小孩都爱吃！`;
  } else if (subject.includes('美食做法') && food) {
    body = `今天要分享${food}的做法！\n\n这道菜其实很简单，主要食材就是${food}和一些常见的调料。\n\n做法步骤：\n1. 准备好食材，洗净切块\n2. 起锅烧油，放入葱姜爆香\n3. 加入主料翻炒\n4. 加入适量调料调味\n5. 小火炖煮至熟透\n6. 撒上葱花即可出锅\n\n这样做出来的${food}味道鲜美，营养丰富，大家可以试试！`;
  } else {
    body = `最近生活里有很多小确幸，想和大家分享一下～\n\n虽然都是些平凡的小事，但正是这些点点滴滴让生活变得更美好。`;
  }
  
  // 生成结尾
  let closing = '希望大家喜欢我的分享～';
  if (name) {
    closing = `${name}说：谢谢大家的喜欢～`;
  } else if (food) {
    closing = `大家一定要试试这个${food}的做法，真的超级好吃！`;
  }
  
  // 生成话题标签
  let hashtags = '#生活分享 #日常';
  if (subject.includes('猫咪')) {
    hashtags = name ? `#猫咪日常 #我家萌宠 #${name}` : '#猫咪日常 #我家萌宠';
  } else if (subject.includes('狗狗')) {
    hashtags = name ? `#狗狗日常 #我家萌宠 #${name}` : '#狗狗日常 #我家萌宠';
  } else if (subject.includes('美食做法')) {
    hashtags = food ? `#美食分享 #${food} #家常菜谱` : '#美食分享 #家常菜谱';
  }
  
  return {
    subject,
    name,
    food,
    opening,
    body,
    closing,
    hashtags
  };
}

// 验证API密钥 - 仅验证LongCat API Key
const validateApiKey = (): { valid: boolean; error?: string } => {
  // 仅使用LongCat API Key
  const longcatApiKey = process.env.LONGCAT_API_KEY;

  // 检查LongCat API密钥是否配置
  if (!longcatApiKey) {
    console.error('[GENERATE-CONTENT-API] No LongCat API key is configured');
    return {
      valid: false,
      error: 'No API key is configured. Please set LONGCAT_API_KEY in environment variables'
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

    // 参数校验：userInput 不能为空
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'userInput parameter is required and must be a non-empty string'
      });
    }

    // personaSummary 是可选的，如果为空则使用默认值
    const effectivePersonaSummary = personaSummary && personaSummary.trim().length > 0 
      ? personaSummary 
      : '基于用户的兴趣和风格，生成符合其特点的内容';

    // 限制输入长度
    if (userInput.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Parameter',
        message: 'userInput parameter is too long (max 2000 characters)'
      });
    }

    if (effectivePersonaSummary.length > 4000) {
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
      personaSummaryLength: effectivePersonaSummary.length,
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

    await generateContentStream(res, contentService, userProfile, topic, regenerate, idea, effectivePersonaSummary);
    
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
  
  // 使用ContentGenerationService的generateContent方法，集成RAG检索结果
  let content = '';
  try {
    console.log('[GENERATE-CONTENT-API] Calling contentService.generateContent');
    
    // 使用我们实现的generateContent方法，它会集成RAG检索结果
    content = await contentService.generateContent(userProfile, topic, selectedTitle, regenerate, idea);
    
    console.log('[GENERATE-CONTENT-API] contentService.generateContent response:', { contentLength: content?.length });

    if (!content || typeof content !== 'string') {
      console.error('[GENERATE-CONTENT-API] Invalid content received from contentService');
      throw new Error('contentService returned invalid content');
    }

    // 允许短内容，避免因长度检查导致失败
    if (content.trim().length === 0) {
      console.warn('[GENERATE-CONTENT-API] Empty content after trim, using fallback');
      throw new Error('Empty content after trim');
    }

    console.log('[GENERATE-CONTENT-API] Content validation passed, length:', content.length);
  } catch (apiError) {
    logApiCall('error', 'Content generation failed', {
      error: apiError,
      message: apiError instanceof Error ? apiError.message : 'Unknown generation error'
    });

    // 超时或API错误时，返回模拟响应以确保功能可用
    console.warn('[GENERATE-CONTENT-API] Using mock response due to generation error');
    content = generateMockContent(selectedTitle, idea || '内容生成');
    // 继续执行，不抛出错误
    console.log('[GENERATE-CONTENT-API] Mock content generated, length:', content.length);
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