import { UserProfile } from "../types";
import { callLongCatAPI } from "../api/longcat";
import { redis } from "../db/redis";

export class TopicRecommendationService {
  private readonly TOPIC_KEY = (topicId: string) => `topic:${topicId}`;

  async generateRecommendations(userProfile: UserProfile, category?: string): Promise<any[]> {
    const prompt = `基于以下用户信息生成10个适合在小红书创作的主题推荐：

用户信息：
- 年龄：${userProfile.ageRange}
- 职业：${userProfile.profession}
- 兴趣：${userProfile.interests.join(", ")}
- 专长：${userProfile.expertise.join(", ")}
- 创作目标：${userProfile.contentGoals.join(", ")}
- 表达风格：${userProfile.contentStyle}

${category ? `内容分类：${category}` : ""}

每个主题需要包含：
1. 标题（吸引人的主题名称）
2. 内容角度（具体的创作方向）
3. 分类（所属内容类别）
4. 热度评分（0-100，基于当前小红书平台热度）
5. 预估互动率（0-100，基于主题吸引力）
6. 匹配度（0-100，基于与用户的匹配程度）
7. 难度（easy、medium、hard）

要求：
- 主题要符合小红书平台特点
- 与用户的兴趣和专长相关
- 有明确的创作角度
- 覆盖不同的内容类型
- 适合素人创作者

输出JSON格式：
[
  {
    "id": "唯一标识符",
    "title": "主题标题",
    "contentAngle": "创作角度",
    "category": "内容分类",
    "trendingScore": 85,
    "estimatedEngagement": 75,
    "matchScore": 90,
    "difficulty": "medium"
  }
]`;

    const response = await callLongCatAPI(prompt);
    const topics = JSON.parse(response);

    // 为每个主题生成唯一ID
    return topics.map((topic: any, index: number) => ({
      ...topic,
      id: `topic_${Date.now()}_${index}`
    }));
  }

  async getRecommendation(topicId: string): Promise<any | null> {
    const data = await redis.get(this.TOPIC_KEY(topicId));
    return typeof data === 'string' ? JSON.parse(data) : null;
  }

  async saveRecommendation(topic: any): Promise<void> {
    await redis.set(this.TOPIC_KEY(topic.id), JSON.stringify(topic));
  }

  async getPopularTopics(category?: string, limit: number = 20): Promise<any[]> {
    const prompt = `推荐当前小红书平台最热门的${category ? category + "" : ""}主题，输出${limit}个。

每个主题需要包含：
1. 标题（吸引人的主题名称）
2. 内容角度（具体的创作方向）
3. 分类（所属内容类别）
4. 热度评分（0-100，基于当前小红书平台热度）
5. 预估互动率（0-100，基于主题吸引力）
6. 难度（easy、medium、hard）

要求：
- 主题要符合小红书平台特点
- 覆盖当前热门趋势
- 适合素人创作者

输出JSON格式：
[
  {
    "id": "唯一标识符",
    "title": "主题标题",
    "contentAngle": "创作角度",
    "category": "内容分类",
    "trendingScore": 85,
    "estimatedEngagement": 75,
    "difficulty": "medium"
  }
]`;

    const response = await callLongCatAPI(prompt);
    const topics = JSON.parse(response);

    // 为每个主题生成唯一ID
    return topics.map((topic: any, index: number) => ({
      ...topic,
      id: `topic_popular_${Date.now()}_${index}`
    }));
  }
}
