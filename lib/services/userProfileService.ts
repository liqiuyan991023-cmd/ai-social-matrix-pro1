import { UserProfile } from "../types";
import { redis } from "../db/redis";
import { callLongCatAPI } from "../api/longcat";

export class UserProfileService {
  private readonly PROFILE_KEY = (userId: string) => `user:${userId}:profile`;

  async createProfile(data: Omit<UserProfile, "createdAt" | "updatedAt" | "creativePersona">): Promise<UserProfile> {
    const profile: UserProfile = {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await redis.set(this.PROFILE_KEY(data.userId), JSON.stringify(profile));
    } catch (error) {
      console.error("Failed to store profile in Redis:", error);
      // Redis 不可用时，继续执行，不影响用户注册流程
    }
    
    // 异步生成创作人格
    this.generateCreativePersona(data.userId).catch(console.error);
    
    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const data = await redis.get(this.PROFILE_KEY(userId));
      return typeof data === 'string' ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get profile from Redis:", error);
      // Redis 不可用时，返回 null
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };

    try {
      await redis.set(this.PROFILE_KEY(userId), JSON.stringify(updatedProfile));
    } catch (error) {
      console.error("Failed to update profile in Redis:", error);
      // Redis 不可用时，继续执行，返回更新后的 profile
    }
    return updatedProfile;
  }

  async generateCreativePersona(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile || profile.creativePersona) return;

    const prompt = `基于以下用户信息生成创作人格画像：
    年龄: ${profile.ageRange}
    职业: ${profile.profession}
    兴趣: ${profile.interests.join(", ")}
    专长: ${profile.expertise.join(", ")}
    创作目标: ${profile.contentGoals.join(", ")}
    表达风格: ${profile.contentStyle}
    
    请输出JSON格式：
    {
      "personality": "性格特点描述",
      "tone": "表达风格",
      "uniqueAngle": "独特创作角度",
      "contentStrengths": ["优势1", "优势2", "优势3"]
    }`;

    try {
      const personaJson = await callLongCatAPI(prompt);
      const persona = JSON.parse(personaJson);
      
      await this.updateProfile(userId, { creativePersona: persona });
    } catch (error) {
      console.error("Failed to generate creative persona:", error);
      // 如果生成失败，使用默认创作人格
      const defaultPersona = {
        personality: "亲切友好，注重生活品质，喜欢分享实用的生活技巧",
        tone: "温暖自然，口语化，像是和朋友聊天一样",
        uniqueAngle: "从个人经验出发，分享真实的生活感悟",
        contentStrengths: ["实用性强", "内容具体", "情感共鸣"]
      };
      await this.updateProfile(userId, { creativePersona: defaultPersona });
    }
  }
}
