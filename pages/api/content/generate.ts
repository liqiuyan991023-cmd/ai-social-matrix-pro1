import { NextApiRequest, NextApiResponse } from "next";
import { ContentGenerationService } from "../../../lib/services/contentGenerationService";
import { UserProfileService } from "../../../lib/services/userProfileService";
import { TopicRecommendationService } from "../../../lib/services/topicRecommendationService";

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
    const { userId, topicId, regenerate } = req.body;
    
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
    
    await generateContentStream(res, contentService, userProfile, topic, regenerate);
    
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
  regenerate?: string
) {
  res.write(`data: ${JSON.stringify({ stage: "title", content: "" })}\n\n`);
  
  const titles = await contentService.generateTitle(userProfile, topic, regenerate);
  const selectedTitle = titles[0];
  
  res.write(`data: ${JSON.stringify({ stage: "title", content: selectedTitle })}\n\n`);
  
  res.write(`data: ${JSON.stringify({ stage: "content", content: "" })}\n\n`);
  
  const content = await contentService.generateContent(userProfile, topic, selectedTitle, regenerate);
  
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
