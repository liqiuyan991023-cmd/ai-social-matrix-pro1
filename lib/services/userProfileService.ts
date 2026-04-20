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
    const creations: CreationRecord[] = await contentGenerationService.getUserCreations(userId, 15);
    
    let prompt = `# 风格蒸馏：用户表达风格画像生成\n\n`;
    prompt += `## 用户基本信息\n`;
    prompt += `- 年龄：${profile.ageRange}\n`;
    prompt += `- 职业：${profile.profession}\n`;
    prompt += `- 兴趣：${profile.interests.join(", ")}\n`;
    prompt += `- 专长：${profile.expertise.join(", ")}\n`;
    prompt += `- 创作目标：${profile.contentGoals.join(", ")}\n`;
    prompt += `- 表达风格：${profile.contentStyle}\n`;
    prompt += `- 内容长度偏好：${profile.preferredLength}\n\n`;
    
    if (creations.length > 0) {
      prompt += `## 历史创作分析\n`;
      prompt += `### 创作概览\n`;
      prompt += `- 总创作数量：${creations.length}\n`;
      prompt += `- 时间范围：${new Date(creations[creations.length - 1].createdAt).toLocaleDateString('zh-CN')} 至 ${new Date(creations[0].createdAt).toLocaleDateString('zh-CN')}\n\n`;
      
      prompt += `### 详细创作记录\n`;
      creations.forEach((creation: CreationRecord, index: number) => {
        prompt += `#### 创作 ${index + 1}\n`;
        prompt += `- 标题：${creation.title}\n`;
        prompt += `- 内容：${creation.content.substring(0, 400)}...\n`;
        if (creation.feedback && creation.feedback.length > 0) {
          prompt += `- 用户反馈：\n`;
          creation.feedback.forEach((feedback, feedbackIndex) => {
            if (feedback.presetFeedback) {
              prompt += `  - 预设反馈：${feedback.presetFeedback.join('; ')}\n`;
            }
            if (feedback.customFeedback) {
              prompt += `  - 自定义反馈：${feedback.customFeedback}\n`;
            }
            if (feedback.improvements) {
              prompt += `  - 改进建议：${feedback.improvements.styleAdjustments?.join('; ') || '无'}\n`;
            }
          });
        }
        prompt += `\n`;
      });
    }
    
    prompt += `## 风格蒸馏要求\n`;
    prompt += `1. **深度分析**：基于用户的所有创作和反馈，提取核心表达特征\n`;
    prompt += `2. **模式识别**：识别用户的语言习惯、句式结构、修辞手法等\n`;
    prompt += `3. **反馈整合**：将用户的反馈转化为风格调整建议\n`;
    prompt += `4. **动态适应**：考虑用户最近的创作趋势，反映最新的表达偏好\n`;
    prompt += `5. **精准画像**：生成详细的表达风格画像，包含多个维度\n\n`;
    
    prompt += `## 输出格式\n`;
    prompt += `请输出JSON格式，包含以下字段：\n`;
    prompt += `{\n`;
    prompt += `  "personaSummary": "表达风格总结（200字以内）",\n`;
    prompt += `  "ageRange": "年龄范围",\n`;
    prompt += `  "profession": "职业或身份",\n`;
    prompt += `  "interests": ["兴趣1", "兴趣2"],\n`;
    prompt += `  "contentStyle": "表达风格",\n`;
    prompt += `  "contentGoals": ["创作目标1", "创作目标2"],\n`;
    prompt += `  "preferredLength": "内容长度偏好",\n`;
    prompt += `  "creativePurpose": "创作目的",\n`;
    prompt += `  "targetAudience": "目标受众",\n`;
    prompt += `  "personality": "风格记忆（详细描述用户的表达个性）",\n`;
    prompt += `  "tone": "表达基调（如温暖、专业、活泼等）",\n`;
    prompt += `  "uniqueAngle": "独特视角",\n`;
    prompt += `  "contentStrengths": ["优势1", "优势2"],\n`;
    prompt += `  "languageFeatures": {\n`;
    prompt += `    "sentenceStructure": "句式特点",\n`;
    prompt += `    "vocabulary": "词汇偏好",\n`;
    prompt += `    "rhetoric": "修辞手法",\n`;
    prompt += `    "emojiUsage": "表情符号使用习惯",\n`;
    prompt += `    "paragraphStructure": "段落结构"
`;
    prompt += `  },\n`;
    prompt += `  "recentTrends": "最近的表达趋势",\n`;
    prompt += `  "feedbackIntegration": "基于反馈的风格调整",\n`;
    prompt += `  "generatedAt": "${new Date().toISOString()}"\n`;
    prompt += `}`;

    try {
      const personaJson = await callLongCatAPI(prompt);
      const persona = JSON.parse(personaJson);
      
      await this.updateProfile(userId, { creativePersona: persona });
    } catch (error) {
      console.error("Failed to generate creative persona:", error);
      // 如果生成失败，使用增强版默认表达风格画像
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
        contentStrengths: ["实用性强", "内容具体", "情感共鸣"],
        languageFeatures: {
          sentenceStructure: "短句为主，结构清晰",
          vocabulary: "通俗易懂，贴近生活",
          rhetoric: "比喻、拟人等修辞手法",
          emojiUsage: "适度使用表情符号",
          paragraphStructure: "段落短小，层次分明"
        },
        recentTrends: "保持稳定的表达风格",
        feedbackIntegration: "根据反馈持续优化",
        generatedAt: new Date().toISOString()
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
