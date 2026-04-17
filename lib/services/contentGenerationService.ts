import { UserProfile, CreationRecord, Feedback } from "../types";
import { callLongCatAPI } from "../api/longcat";
import { redis } from "../db/redis";

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

    const response = await callLongCatAPI(prompt);
    return response.split('\n').filter(line => line.trim());
  }

  async generateContent(userProfile: UserProfile, topic: any, title: string, regenerate?: string, idea?: string): Promise<string> {
    const prompt = `基于以下信息生成自然真实的内容，体现用户的个人表达风格：

用户信息：
- 年龄：${userProfile.ageRange}
- 职业：${userProfile.profession}
- 兴趣：${userProfile.interests.join(", ")}
- 表达风格：${userProfile.contentStyle}
- 内容长度：${userProfile.preferredLength}

${idea ? `【重要】用户创作想法（必须严格遵循）：${idea}

请基于用户的这个具体想法来创作内容，不能偏离这个主题！` : ""}

创作主题：
- 标题：${title}
- 原始主题：${topic.title}
- 角度：${topic.contentAngle}
- 分类：${topic.category}

${regenerate ? `用户反馈：${regenerate}` : ""}

要求：
1. ${idea ? "严格基于用户的创作想法来生成内容，不能生成无关的内容" : "自然真实，体现个人风格"}
2. 语言口语化，亲切自然，像是用户自己写的
3. 结构清晰，有开头、中间、结尾
4. 内容具体，有细节和个人感受
5. 包含适当的emoji（如果符合用户风格）
6. 段落分明，易于阅读
7. 符合用户的表达风格
8. 长度符合用户偏好
9. 不刻意追求平台优化或爆款效果
10. 体现真实的个人表达，而非虚拟人设`;

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

    // 自动更新表达风格画像
    try {
      const userProfileService = new (require('./userProfileService').UserProfileService)();
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

      // 自动更新表达风格画像
      try {
        const userProfileService = new (require('./userProfileService').UserProfileService)();
        await userProfileService.updateProfileFromCreations(creation.userId);
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
