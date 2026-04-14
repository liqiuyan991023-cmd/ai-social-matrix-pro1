import { NextApiRequest, NextApiResponse } from "next";
import { UserProfileService } from "../../../lib/services/userProfileService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const profileData = req.body;
      
      const requiredFields = ["userId", "ageRange", "profession", "interests", "expertise", "contentGoals", "contentStyle", "preferredLength"];
      for (const field of requiredFields) {
        if (!profileData[field]) {
          return res.status(400).json({ error: `Missing required field: ${field}` });
        }
      }
      
      const service = new UserProfileService();
      const profile = await service.createProfile(profileData);
      
      res.status(200).json({ success: true, profile });
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "GET") {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const service = new UserProfileService();
      let profile = await service.getProfile(userId);

      // 如果Redis中没有找到，尝试从localStorage获取（兼容旧数据）
      if (!profile) {
        // 在服务器端，我们无法访问localStorage，所以直接返回404
        // 客户端会在后续尝试从localStorage获取
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.status(200).json({ profile });
    } catch (error) {
      console.error("Error getting profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PATCH") {
    try {
      const { userId, action } = req.body;
      
      if (!userId || !action) {
        return res.status(400).json({ error: "Missing userId or action" });
      }
      
      const service = new UserProfileService();
      
      switch (action) {
        case "reset":
          const resetSuccess = await service.resetProfile(userId);
          if (!resetSuccess) {
            return res.status(404).json({ error: "Profile not found" });
          }
          res.status(200).json({ success: true, message: "Profile reset successfully" });
          break;
        
        case "updateFromCreations":
          await service.updateProfileFromCreations(userId);
          res.status(200).json({ success: true, message: "Profile updated from creations" });
          break;
        
        default:
          res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      console.error("Error performing profile action:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
