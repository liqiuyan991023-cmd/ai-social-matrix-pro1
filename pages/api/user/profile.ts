import { NextApiRequest, NextApiResponse } from "next";
import { UserProfileService } from "@/lib/services/userProfileService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const profileData = req.body;
      
      const requiredFields = ["userId", "ageRange", "profession", "interests", "expertise", "contentGoals", "contentStyle", "preferredLength"];
      for (const field of requiredFields) {
        if (!profileData[field]) {
          return res.status(400).json({ error: \`Missing required field: \${field}\` });
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
      const profile = await service.getProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.status(200).json({ profile });
    } catch (error) {
      console.error("Error getting profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }
}
