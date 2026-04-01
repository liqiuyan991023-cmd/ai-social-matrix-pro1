import { NextApiRequest, NextApiResponse } from "next";
import { ContentGenerationService } from "@/lib/services/contentGenerationService";
import { UserProfileService } from "@/lib/services/userProfileService";
import { TopicRecommendationService } from "@/lib/services/topicRecommendationService";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
    return;
  }
  
  try {
    const { userId, topicId, regenerate } = req.body;
    
    if (!userId || !topicId) {
      return res.status(400).json({ error: "User ID and Topic ID are required" });
    }
    
    const profileService = new UserProfileService();
    const userProfile = await profileService.getProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    const topicService = new TopicRecommendationService();
    const topic = await topicService.getRecommendation(topicId);
    
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
  res.write(\`data: \${JSON.stringify({ stage: "title", content: "" })}\n\n\`);
  
  const titles = await contentService.generateTitle(userProfile, topic, regenerate);
  const selectedTitle = titles[0];
  
  res.write(\`data: \${JSON.stringify({ stage: "title", content: selectedTitle })}\n\n\`);
  
  res.write(\`data: \${JSON.stringify({ stage: "content", content: "" })}\n\n\`);
  
  const content = await contentService.generateContent(userProfile, topic, selectedTitle, regenerate);
  
  res.write(\`data: \${JSON.stringify({ stage: "content", content })}\n\n\`);
  
  res.write(\`data: \${JSON.stringify({ stage: "keywords", content: {} })}\n\n\`);
  
  const keywords = await contentService.generateKeywords(userProfile, topic, selectedTitle, content);
  
  res.write(\`data: \${JSON.stringify({ stage: "keywords", content: keywords })}\n\n\`);
  
  const creationId = await contentService.saveCreation(userProfile.userId, {
    title: selectedTitle,
    content,
    keywords,
    topic,
  });
  
  res.write(\`data: \${JSON.stringify({ 
    stage: "complete", 
    content: { id: creationId, title: selectedTitle, content, keywords } 
  })}\n\n\`);
  
  res.write("data: [DONE]\n\n");
  res.end();
}
