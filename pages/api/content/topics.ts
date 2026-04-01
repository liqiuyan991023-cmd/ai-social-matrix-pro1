import { NextApiRequest, NextApiResponse } from "next";
import { TopicRecommendationService } from "@/lib/services/topicRecommendationService";
import { UserProfileService } from "@/lib/services/userProfileService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
    return;
  }
  
  try {
    const { userId, category } = req.query;
    
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const profileService = new UserProfileService();
    const userProfile = await profileService.getProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    const topicService = new TopicRecommendationService();
    const recommendations = await topicService.generateRecommendations(
      userProfile,
      category as string | undefined
    );
    
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("Error generating topics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
