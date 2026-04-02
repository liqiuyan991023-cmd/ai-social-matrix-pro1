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
    
    await redis.set(this.PROFILE_KEY(data.userId), JSON.stringify(profile));
    
    // 异步生成创作人格
    this.generateCreativePersona(data.userId).catch(console.error);
    
    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const data = await redis.get(this.PROFILE_KEY(userId));
    return typeof data === 'string' ? JSON.parse(data) : null;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };

    await redis.set(this.PROFILE_KEY(userId), JSON.stringify(updatedProfile));
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
    }
  }
}
