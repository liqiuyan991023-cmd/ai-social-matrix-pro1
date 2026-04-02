import { UserProfile } from "../types";
import { callLongCatAPI } from "../api/longcat";
import { redis } from "../db/redis";

export class ContentGenerationService {
  private readonly CREATION_KEY = (creationId: string) => `creation:${creationId}`;

  async generateTitle(userProfile: UserProfile, topic: any, regenerate?: string): Promise<string[]> {
    const prompt = `基于以下信息为小红书笔记生成3个吸引人的标题：

用户信息：
- 年龄：${userProfile.ageRange}
- 职业：${userProfile.profession}
- 兴趣：${userProfile.interests.join(", ")}
- 表达风格：${userProfile.contentStyle}

创作主题：
- 标题：${topic.title}
- 角度：${topic.contentAngle}
- 分类：${topic.category}

${regenerate ? `用户反馈：${regenerate}` : ""}

要求：
1. 符合小红书平台风格
2. 吸引目标用户点击
3. 包含关键词
4. 简洁有力
5. 有个人特色

请输出3个标题，每个一行`;

    const response = await callLongCatAPI(prompt);
    return response.split('\n').filter(line => line.trim());
  }

  async generateContent(userProfile: UserProfile, topic: any, title: string, regenerate?: string): Promise<string> {
    const prompt = `基于以下信息生成小红书笔记正文：

用户信息：
- 年龄：${userProfile.ageRange}
- 职业：${userProfile.profession}
- 兴趣：${userProfile.interests.join(", ")}
- 表达风格：${userProfile.contentStyle}
- 内容长度：${userProfile.preferredLength}

创作主题：
- 标题：${title}
- 原始主题：${topic.title}
- 角度：${topic.contentAngle}
- 分类：${topic.category}

${regenerate ? `用户反馈：${regenerate}` : ""}

要求：
1. 符合小红书平台风格
2. 语言口语化，亲切自然
3. 结构清晰，有开头、中间、结尾
4. 内容具体，有细节和个人感受
5. 包含适当的emoji
6. 段落分明，易于阅读
7. 符合用户的表达风格
8. 长度符合用户偏好`;

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

    const response = await callLongCatAPI(prompt);
    return JSON.parse(response);
  }

  async saveCreation(userId: string, creation: any): Promise<string> {
    const creationId = `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullCreation = {
      id: creationId,
      userId,
      ...creation,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await redis.set(this.CREATION_KEY(creationId), JSON.stringify(fullCreation));
    await redis.lpush(`user:${userId}:creations`, creationId);

    return creationId;
  }

  async getCreation(creationId: string): Promise<any | null> {
    const data = await redis.get(this.CREATION_KEY(creationId));
    return typeof data === 'string' ? JSON.parse(data) : null;
  }

  async getUserCreations(userId: string, limit: number = 20): Promise<any[]> {
    const creationIds = await redis.lrange(`user:${userId}:creations`, 0, limit - 1);
    const creations = [];

    for (const id of creationIds) {
      const creation = await this.getCreation(id);
      if (creation) {
        creations.push(creation);
      }
    }

    return creations;
  }
}
