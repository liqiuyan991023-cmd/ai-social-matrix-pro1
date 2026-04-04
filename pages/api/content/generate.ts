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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }
  
  try {
    const { userId, topicId, regenerate, idea } = req.body;
    
    if (!userId || !topicId) {
      return res.status(400).json({ error: "User ID and Topic ID are required" });
    }
    
    const profileService = new UserProfileService();
    let userProfile = await profileService.getProfile(userId);

    // 如果从Redis获取失败，尝试从数据库或创建默认画像
    if (!userProfile) {
      console.warn(`User profile not found in Redis for userId: ${userId}, trying to create default profile`);

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
        console.log(`Created default profile for userId: ${userId}`);
      } catch (createError) {
        console.error("Failed to create default profile:", createError);
        return res.status(404).json({ error: "User profile not found and cannot create default profile" });
      }
    }

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    const topicService = new TopicRecommendationService();
    let topic = await topicService.getRecommendation(topicId);

    // 如果主题不存在，创建默认主题
    if (!topic) {
      console.warn(`Topic not found for topicId: ${topicId}, trying to generate default topic`);

      try {
        // 尝试为用户生成推荐主题
        const recommendations = await topicService.generateRecommendations(userProfile);
        if (recommendations && recommendations.length > 0) {
          topic = recommendations[0];
        } else {
          // 创建默认主题
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
        }
        console.log(`Created default topic for user: ${userId}`);
      } catch (topicError) {
        console.error("Failed to create default topic:", topicError);
        return res.status(404).json({ error: "Topic not found and cannot generate default topic" });
      }
    }

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    
    const contentService = new ContentGenerationService();
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    await generateContentStream(res, contentService, userProfile, topic, regenerate, idea);
    
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
  idea?: string
) {
  res.write(`data: ${JSON.stringify({ stage: "title", content: "" })}\n\n`);
  
  const titles = await contentService.generateTitle(userProfile, topic, regenerate, idea);
  const selectedTitle = titles[0];
  
  res.write(`data: ${JSON.stringify({ stage: "title", content: selectedTitle })}\n\n`);
  
  res.write(`data: ${JSON.stringify({ stage: "content", content: "" })}\n\n`);
  
  // 构建更强的prompt，包含对idea的强制性约束 + 创作人格
  const enhancedPrompt = buildEnhancedContentPrompt(userProfile, topic, selectedTitle, idea, regenerate);
  
  const content = await callLongCatAPI(enhancedPrompt);
  
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

function buildEnhancedContentPrompt(userProfile: any, topic: any, title: string, idea?: string, regenerate?: string): string {
  // 尝试从环境获取创作人格（如果可用）
  let creativePersonaSummary = '';
  try {
    if (userProfile.creativePersona) {
      creativePersonaSummary = typeof userProfile.creativePersona === 'string' 
        ? userProfile.creativePersona 
        : JSON.stringify(userProfile.creativePersona);
    }
  } catch (error) {
    console.warn('Failed to parse creative persona:', error);
  }

  return `你是一个专业的小红书内容创作助手。现在需要根据以下信息生成一条小红书笔记。

【用户创作人格与基本信息】
- 年龄：${userProfile.ageRange}
- 职业：${userProfile.profession}
- 兴趣：${userProfile.interests.join(", ")}
- 表达风格：${userProfile.contentStyle}
- 创作偏好：${userProfile.contentGoals?.join(" / ") || "生活分享"}
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
` : `创意展现：使用${userProfile.contentStyle}的风格呈现内容`}

【笔记内容要求】
1. ⭐ 内容主题必须完全匹配用户想法${idea ? `（用户说：${idea}）` : ""}，不能偏离
2. 文风应该${userProfile.contentStyle}，充分体现用户的个性和气质
${creativePersonaSummary ? `3. 创作风格参考：${creativePersonaSummary}` : '3. 遵循用户的个人风格'}
4. 内容长度：${userProfile.preferredLength === 'short' ? '简短（150-200字）' : userProfile.preferredLength === 'medium' ? '中等（250-400字）' : '较长（500-800字）'}
5. 包含适当的emoji和换行符，提升可读性
6. 结构清晰：有开头、主体、结尾，逻辑连贯
7. 包含个人感受、细节描写和真实例子
8. 符合小红书平台的风格和规范

${regenerate ? `【用户的优化反馈】
${regenerate}
请根据用户的反馈改进和调整内容。` : ''}

现在，请生成笔记正文内容。记住最重要的是：确保内容与用户的想法完全匹配！`;
}
