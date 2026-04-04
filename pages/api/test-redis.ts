import { NextApiRequest, NextApiResponse } from "next";
import { UserProfileService } from "../../lib/services/userProfileService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Testing User Profile Service connection...");

    // 测试用户画像服务
    const testUserId = "test:user:redis";
    const profileService = new UserProfileService();

    // 尝试获取用户画像
    const userProfile = await profileService.getProfile(testUserId);
    console.log("UserProfileService GET result:", userProfile);

    if (userProfile) {
      return res.status(200).json({
        success: true,
        message: "UserProfileService is working correctly",
        data: { userId: testUserId, profile: userProfile }
      });
    } else {
      // 尝试创建默认用户画像
      const defaultProfileData: any = {
        userId: testUserId,
        ageRange: "26-35",
        profession: "创作者",
        interests: ["生活分享", "内容创作"],
        expertise: ["生活分享", "内容创作"],
        contentGoals: ["生活分享"],
        contentStyle: "亲切自然",
        preferredLength: "medium"
      };

      try {
        const createdProfile = await profileService.createProfile(defaultProfileData);
        console.log("Created default profile:", createdProfile);

        return res.status(200).json({
          success: true,
          message: "UserProfileService is working (created default profile)",
          data: { userId: testUserId, profile: createdProfile }
        });
      } catch (createError) {
        return res.status(500).json({
          error: "UserProfileService test failed: cannot create profile",
          details: createError instanceof Error ? createError.message : "Unknown error"
        });
      }
    }

  } catch (error) {
    console.error("UserProfileService test failed:", error);
    return res.status(500).json({
      error: "UserProfileService test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}