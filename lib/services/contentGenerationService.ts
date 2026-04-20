import { UserProfile, CreationRecord, Feedback } from "../types";
import { callLongCatAPI } from "../api/longcat";
import { redis } from "../db/redis";
import { UserProfileService } from "./userProfileService";
import { StyleRagService } from "./styleRagService";

export class ContentGenerationService {
  private readonly CREATION_KEY = (creationId: string) => `creation:${creationId}`;
  private readonly USER_CREATIONS_KEY = (userId: string) => `user:${userId}:creations`;

  async generateTitle(userProfile: UserProfile, topic: any, regenerate?: string, idea?: string): Promise<string[]> {
    const prompt = `基于以下信息生成3个自然真实的标题，体现用户的个人风格：

用户信息：
- 年龄：${userProfile.ageRange}
- 职业：${userProfile.profession}
- 兴趣：${userProfile.interests.join(", ")}
- 表达风格：${userProfile.contentStyle}

创作主题：
- 标题：${topic.title}
- 角度：${topic.contentAngle}
- 分类：${topic.category}

${idea ? `用户创作想法：${idea}` : ""}

${regenerate ? `用户反馈：${regenerate}` : ""}

要求：
1. 自然真实，体现个人风格
2. 简洁有力，有个人特色
3. 包含关键词
4. 不刻意追求爆款或平台优化
5. 像是用户自己想出来的标题

请输出3个标题，每个一行`;

    try {
      const response = await callLongCatAPI(prompt);
      const titles = response.split('\n').filter(line => line.trim());
      if (titles.length === 0) {
        throw new Error('No titles generated');
      }
      return titles;
    } catch (error) {
      console.error('Error generating title:', error);
      // 返回默认标题
      return [
        `记录${idea || topic.title}的美好瞬间`,
        `分享我的${idea || topic.title}体验`,
        `${idea || topic.title}的真实感受`
      ];
    }
  }

  async generateContent(userProfile: UserProfile, topic: any, title: string, regenerate?: string, idea?: string): Promise<string> {
    const styleRagService = new StyleRagService();
    
    const query = `${title} ${topic.contentAngle} ${idea || ""}`;
    const styleContext = await styleRagService.getStyleContext(userProfile.userId, query);
    
    let prompt = '';
    
    // 核心创作任务 - 放在最前面，突出用户的具体需求
    if (idea) {
      prompt += `# 内容创作任务\n\n`;
      prompt += `## 用户创作需求（这是最重要的）\n`;
      prompt += `${idea}\n\n`;
      prompt += `请根据以上用户需求，生成一篇完整的原创内容。\n\n`;
    }
    
    // 风格指导
    prompt += `## 风格指导\n`;
    if (userProfile.creativePersona) {
      prompt += `- 整体风格：${userProfile.creativePersona.personaSummary}\n`;
      prompt += `- 语气基调：${userProfile.creativePersona.tone}\n`;
      prompt += `- 语言特点：${userProfile.creativePersona.languageFeatures?.rhetoric || '自然口语化'}\n`;
      prompt += `- 常用表达：${userProfile.creativePersona.languageFeatures?.vocabulary || '亲切随性'}\n`;
    } else {
      prompt += `- 整体风格：亲切自然，像和朋友聊天\n`;
      prompt += `- 语气基调：${userProfile.contentStyle || '轻松随性'}\n`;
      prompt += `- 长度偏好：${userProfile.preferredLength === 'short' ? '简短精炼' : userProfile.preferredLength === 'medium' ? '中等长度' : '详细丰富'}\n`;
    }
    prompt += `\n`;
    
    // 参考示例
    if (styleContext.examples.length > 0) {
      prompt += `## 参考示例\n`;
      styleContext.examples.forEach((example, index) => {
        prompt += `【示例${index + 1}】${example.content.substring(0, 150)}...\n\n`;
      });
    }
    
    // 最近创作
    if (styleContext.recentCreations.length > 0) {
      prompt += `## 最近创作风格参考\n`;
      styleContext.recentCreations.slice(0, 2).forEach((creation, index) => {
        prompt += `【最近${index + 1}】${creation.content.substring(0, 100)}...\n\n`;
      });
    }
    
    // 主题背景
    prompt += `## 主题背景\n`;
    prompt += `- 主题：${topic.title}\n`;
    prompt += `- 角度：${topic.contentAngle}\n`;
    prompt += `- 分类：${topic.category}\n\n`;
    
    // 修正指令
    if (idea) {
      prompt += `## 重要指令\n`;
      prompt += `1. 严格围绕"${idea}"这个具体需求来创作\n`;
      prompt += `2. 内容必须与用户需求高度相关，不能偏离主题\n`;
      prompt += `3. 风格要贴近用户的表达习惯\n`;
      prompt += `4. 语言口语化，有个人特色和真实情感\n`;
      prompt += `5. 结构清晰：开头吸引人，中间内容充实，结尾有互动性\n\n`;
    }
    
    // 用户反馈
    if (regenerate) {
      prompt += `## 用户反馈\n`;
      prompt += `${regenerate}\n\n`;
    }
    
    // 输出要求
    prompt += `## 输出要求\n`;
    prompt += `重要：只输出最终内容，不要输出思考过程，不要输出解释说明，不要输出分析步骤。\n`;
    prompt += `只输出完整的原创内容文本。`;

    return await callLongCatAPI(prompt);
  }

  async generateKeywords(userProfile: UserProfile, topic: any, title: string, content: string): Promise<{ topic: string[]; search: string[]; tags: string[] }> {
    const prompt = `基于以下内容生成三类关键词：

标题：${title}
内容：${content}

1. 话题关键词（与主题直接相关的核心词）
2. 搜索关键词（用户可能搜索的词）
3. 标签关键词（适合作为小红书标签的词）

要求：
- 每类关键词3-5个
- 符合小红书平台特点
- 与内容高度相关
- 标签关键词不要带#号

输出JSON格式：
{
  "topic": ["关键词1", "关键词2"],
  "search": ["关键词1", "关键词2"],
  "tags": ["关键词1", "关键词2"]
}`;

    try {
      const response = await callLongCatAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing keywords response:', error);
      // 返回默认关键词
      return {
        topic: [topic.title, topic.category, "生活分享"],
        search: [title, topic.title, `${topic.title} ${topic.category}`],
        tags: [topic.title, topic.category, "生活方式"]
      };
    }
  }

  async saveCreation(userId: string, creation: Partial<CreationRecord>): Promise<string> {
    const creationId = `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullCreation: CreationRecord = {
      id: creationId,
      userId,
      title: creation.title || "未命名",
      content: creation.content || "",
      keywords: creation.keywords || {
        topic: [],
        search: [],
        tags: []
      },
      topic: creation.topic || {
        id: "default_topic",
        title: "默认主题",
        category: "生活方式",
        difficulty: "easy",
        trendingScore: 50,
        matchScore: 50,
        estimatedEngagement: 50,
        contentAngle: "默认角度",
        similarAccounts: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      feedback: creation.feedback
    };

    try {
      await redis.set(this.CREATION_KEY(creationId), JSON.stringify(fullCreation));
      await redis.lpush(this.USER_CREATIONS_KEY(userId), creationId);
    } catch (error) {
      console.error('Error saving creation to Redis:', error);
      // Redis 不可用时，继续执行，不影响用户体验
    }

    // 存储到向量数据库，用于RAG检索
    try {
      const styleRagService = new StyleRagService();
      await styleRagService.storeCreationEmbedding(fullCreation);
    } catch (error) {
      console.error('Error storing creation embedding:', error);
      // 失败不影响创作保存
    }

    // 自动更新表达风格画像
    try {
      const userProfileService = new UserProfileService();
      await userProfileService.updateProfileFromCreations(userId);
    } catch (error) {
      console.error('Error updating profile from creation:', error);
      // 失败不影响创作保存
    }

    return creationId;
  }

  async getCreation(creationId: string): Promise<CreationRecord | null> {
    try {
      const data = await redis.get(this.CREATION_KEY(creationId));
      return typeof data === 'string' ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting creation from Redis:', error);
      return null;
    }
  }

  async getUserCreations(userId: string, limit: number = 20): Promise<CreationRecord[]> {
    try {
      const creationIds = await redis.lrange(this.USER_CREATIONS_KEY(userId), 0, limit - 1);
      const creations: CreationRecord[] = [];

      for (const id of creationIds) {
        const creation = await this.getCreation(id);
        if (creation) {
          creations.push(creation);
        }
      }

      return creations;
    } catch (error) {
      console.error('Error getting user creations:', error);
      return [];
    }
  }

  async updateCreation(creationId: string, updates: Partial<CreationRecord>): Promise<CreationRecord | null> {
    try {
      const creation = await this.getCreation(creationId);
      if (!creation) return null;

      const updatedCreation = {
        ...creation,
        ...updates,
        updatedAt: Date.now()
      };

      await redis.set(this.CREATION_KEY(creationId), JSON.stringify(updatedCreation));
      return updatedCreation;
    } catch (error) {
      console.error('Error updating creation:', error);
      return null;
    }
  }

  async addFeedback(creationId: string, feedback: Feedback): Promise<CreationRecord | null> {
    try {
      const creation = await this.getCreation(creationId);
      if (!creation) return null;

      const updatedCreation = {
        ...creation,
        feedback: [...(creation.feedback || []), feedback],
        updatedAt: Date.now()
      };

      await redis.set(this.CREATION_KEY(creationId), JSON.stringify(updatedCreation));

      // 自动更新表达风格画像，强化反馈影响
      try {
        const userProfileService = new (require('./userProfileService').UserProfileService)();
        
        // 立即更新表达风格画像，确保反馈能够实时影响
        await userProfileService.updateProfileFromCreations(creation.userId);
        
        // 如果有风格调整建议，额外处理
        if (feedback.improvements && feedback.improvements.styleAdjustments && feedback.improvements.styleAdjustments.length > 0) {
          // 可以在这里添加更详细的反馈处理逻辑
          console.log('Style adjustments received:', feedback.improvements.styleAdjustments);
        }
      } catch (error) {
        console.error('Error updating profile from feedback:', error);
        // 失败不影响反馈添加
      }

      return updatedCreation;
    } catch (error) {
      console.error('Error adding feedback:', error);
      return null;
    }
  }

  async generateSummary(creations: CreationRecord[], userProfile?: UserProfile, feedbacks?: any[]): Promise<string> {
    if (creations.length === 0) {
      return "您还没有创作记录，开始创作吧！";
    }

    const creationTexts = creations.map(c => c.content).join('\n\n');
    const creationTitles = creations.map(c => c.title).join('\n');
    const creationCategories = [...new Set(creations.map(c => c.topic.category))].join(', ');

    // 计算时间范围
    const timeRange = creations.length > 0
      ? `${new Date(creations[creations.length - 1].createdAt).toLocaleDateString('zh-CN')} - ${new Date(creations[0].createdAt).toLocaleDateString('zh-CN')}`
      : '暂无创作历史';

    // 构建反馈信息
    const feedbackInfo = feedbacks && feedbacks.length > 0
      ? `用户反馈信息：\n${feedbacks.map(f => `- ${f.customFeedback || f.presetFeedback}`).join('\n')}`
      : '暂无用户反馈';

    const prompt = `基于以下用户的创作历史和反馈，生成一份AI创作总结：

创作时间范围：
${timeRange}

用户创作人设：
- 年龄：${userProfile?.ageRange || '未知'}
- 职业：${userProfile?.profession || '未知'}
- 兴趣：${userProfile?.interests?.join('、') || '未知'}
- 表达风格：${userProfile?.contentStyle || '亲切自然'}
- 主要创作领域：${userProfile?.contentGoals?.join('、') || '生活分享'}
- 内容长度偏好：${userProfile?.preferredLength || '中篇'}

创作标题：
${creationTitles}

创作内容：
${creationTexts}

创作分类：
${creationCategories}

${feedbackInfo}

要求：
1. 分析用户的创作风格和特点
2. 指出用户的创作优势
3. 基于用户反馈提供具体的改进建议
4. 结合用户的创作人设信息进行个性化分析
5. 内容要专业、有针对性
6. 语言要自然、友好
7. 适合小红书平台的创作者
8. 提供可执行的优化建议`;

    try {
      return await callLongCatAPI(prompt);
    } catch (error) {
      console.error('Error generating summary:', error);
      return "AI 创作总结生成失败，请稍后再试。";
    }
  }
}
