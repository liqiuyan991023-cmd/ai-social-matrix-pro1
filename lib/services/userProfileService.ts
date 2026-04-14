import { UserProfile, CreationRecord } from "../types";
import { redis } from "../db/redis";
import { callLongCatAPI } from "../api/longcat";

export class UserProfileService {
  private readonly PROFILE_KEY = (userId: string) => `user:${userId}:profile`;
  private readonly USER_KEY = (userId: string) => `user:${userId}`;

  async createProfile(data: Omit<UserProfile, "createdAt" | "updatedAt" | "creativePersona">): Promise<UserProfile> {
    const profile: UserProfile = {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await redis.set(this.PROFILE_KEY(data.userId), JSON.stringify(profile));
      // 同时存储用户基本信息
      await redis.set(this.USER_KEY(data.userId), JSON.stringify({
        userId: data.userId,
        createdAt: Date.now()
      }));
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
    
    // 如果更新了影响创作人格的字段，重新生成创作人格
    if (updates.ageRange || updates.profession || updates.interests || updates.expertise || updates.contentGoals || updates.contentStyle) {
      this.generateCreativePersona(userId).catch(console.error);
    }
    
    return updatedProfile;
  }

  async generateCreativePersona(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) return;

    const contentGenerationService = new (require('./contentGenerationService').ContentGenerationService)();
    const creations: CreationRecord[] = await contentGenerationService.getUserCreations(userId, 10);
    
    let prompt = `基于以下用户信息和历史创作记录，梳理用户的表达风格画像：
    年龄: ${profile.ageRange}
    职业: ${profile.profession}
    兴趣: ${profile.interests.join(", ")}
    专长: ${profile.expertise.join(", ")}
    创作目标: ${profile.contentGoals.join(", ")}
    表达风格: ${profile.contentStyle}
    `;
    
    if (creations.length > 0) {
      prompt += `\n\n历史创作记录：\n`;
      creations.forEach((creation: CreationRecord, index: number) => {
        prompt += `创作 ${index + 1}：\n`;
        prompt += `标题：${creation.title}\n`;
        prompt += `内容：${creation.content.substring(0, 300)}...\n`;
        if (creation.feedback && creation.feedback.length > 0) {
          prompt += `用户反馈：${creation.feedback.map(f => f.customFeedback || f.presetFeedback).join('; ')}\n`;
        }
        prompt += `\n`;
      });
    }
    
    prompt += `\n请输出JSON格式，包含以下字段：
    {
      "personaSummary": "表达风格总结",
      "ageRange": "年龄范围",
      "profession": "职业或身份",
      "interests": ["兴趣1", "兴趣2"],
      "contentStyle": "表达风格",
      "contentGoals": ["创作目标1", "创作目标2"],
      "preferredLength": "内容长度偏好",
      "creativePurpose": "创作目的",
      "targetAudience": "目标受众",
      "personality": "风格记忆",
      "tone": "表达基调",
      "uniqueAngle": "独特视角",
      "contentStrengths": ["优势1", "优势2"]
    }`;

    try {
      const personaJson = await callLongCatAPI(prompt);
      const persona = JSON.parse(personaJson);
      
      await this.updateProfile(userId, { creativePersona: persona });
    } catch (error) {
      console.error("Failed to generate creative persona:", error);
      // 如果生成失败，使用默认表达风格画像
      const defaultPersona = {
        personaSummary: "基于你的特点，AI正在为你梳理表达风格...",
        ageRange: profile.ageRange,
        profession: profile.profession,
        interests: profile.interests,
        contentStyle: profile.contentStyle,
        contentGoals: profile.contentGoals,
        preferredLength: profile.preferredLength,
        creativePurpose: "记录生活，分享真实的自己",
        targetAudience: "志同道合的朋友",
        personality: "亲切友好，注重生活品质，喜欢分享实用的生活技巧",
        tone: "温暖自然，口语化，像是和朋友聊天一样",
        uniqueAngle: "从个人经验出发，分享真实的生活感悟",
        contentStrengths: ["实用性强", "内容具体", "情感共鸣"]
      };
      await this.updateProfile(userId, { creativePersona: defaultPersona });
    }
  }

  async updateProfileFromCreations(userId: string): Promise<void> {
    // 基于历史创作和反馈更新用户表达风格画像
    await this.generateCreativePersona(userId);
  }

  async resetProfile(userId: string): Promise<boolean> {
    // 一键重置用户表达风格画像
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return false;
      
      // 保留基本信息，重置表达风格画像
      const resetProfile = {
        ...profile,
        creativePersona: undefined,
        updatedAt: Date.now()
      };
      
      await redis.set(this.PROFILE_KEY(userId), JSON.stringify(resetProfile));
      // 重新生成表达风格画像
      await this.generateCreativePersona(userId);
      return true;
    } catch (error) {
      console.error("Failed to reset profile:", error);
      return false;
    }
  }

  async deleteProfile(userId: string): Promise<boolean> {
    try {
      await redis.del(this.PROFILE_KEY(userId));
      await redis.del(this.USER_KEY(userId));
      return true;
    } catch (error) {
      console.error("Failed to delete profile from Redis:", error);
      return false;
    }
  }

  async exists(userId: string): Promise<boolean> {
    try {
      const data = await redis.get(this.USER_KEY(userId));
      return typeof data === 'string';
    } catch (error) {
      console.error("Failed to check user existence:", error);
      return false;
    }
  }

  async getAllUsers(limit: number = 100): Promise<string[]> {
    try {
      const keys = await redis.keys("user:*:profile");
      return keys.map((key: string) => key.split(":")[1]).slice(0, limit);
    } catch (error) {
      console.error("Failed to get all users:", error);
      return [];
    }
  }
}
