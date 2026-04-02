import { UserProfile, TopicRecommendation } from "../types";
import { callLongCatAPI } from "../api/longcat";
import { redis } from "../db/redis";

export class TopicRecommendationService {
  private readonly TOPIC_KEY = (topicId: string) => `topic:${topicId}`;
  private readonly USER_TOPICS_KEY = (userId: string) => `user:${userId}:topics`;
  private cache: Map<string, { data: TopicRecommendation[]; timestamp: number }>;
  private cacheExpiry: number; // 缓存过期时间（毫秒）

  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1小时缓存
  }

  async generateRecommendations(userProfile: UserProfile, category?: string): Promise<TopicRecommendation[]> {
    const cacheKey = `recommendations:${userProfile.userId}:${category || 'all'}`;
    
    // 检查缓存
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
      return cachedData.data;
    }

    try {
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

      // 为每个主题生成唯一ID并添加similarAccounts字段
      const recommendations: TopicRecommendation[] = topics.map((topic: any, index: number) => ({
        ...topic,
        id: `topic_${Date.now()}_${index}`,
        similarAccounts: [] // 可以根据需要添加相似账号
      }));

      // 缓存结果
      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now()
      });

      // 保存推荐给用户
      await this.saveUserRecommendations(userProfile.userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      // 返回默认推荐主题
      const defaultRecommendations = this.getDefaultRecommendations(userProfile, category);
      
      // 缓存默认结果
      this.cache.set(cacheKey, {
        data: defaultRecommendations,
        timestamp: Date.now()
      });
      
      return defaultRecommendations;
    }
  }

  private getDefaultRecommendations(userProfile: UserProfile, category?: string): TopicRecommendation[] {
    const defaultTopics: TopicRecommendation[] = [
      {
        id: `topic_default_1`,
        title: "5分钟快手早餐食谱",
        contentAngle: "分享适合上班族的快速早餐做法",
        category: "生活方式",
        trendingScore: 85,
        estimatedEngagement: 75,
        matchScore: 90,
        difficulty: "easy",
        similarAccounts: []
      },
      {
        id: `topic_default_2`,
        title: "办公室解压小技巧",
        contentAngle: "如何在工作中缓解压力",
        category: "职场",
        trendingScore: 78,
        estimatedEngagement: 80,
        matchScore: 85,
        difficulty: "medium",
        similarAccounts: []
      },
      {
        id: `topic_default_3`,
        title: "周末短途旅行推荐",
        contentAngle: "城市周边2小时车程内的好去处",
        category: "旅行",
        trendingScore: 90,
        estimatedEngagement: 85,
        matchScore: 80,
        difficulty: "medium",
        similarAccounts: []
      },
      {
        id: `topic_default_4`,
        title: "职场新人必备技能",
        contentAngle: "刚入职场需要掌握的软技能",
        category: "职场",
        trendingScore: 82,
        estimatedEngagement: 78,
        matchScore: 88,
        difficulty: "medium",
        similarAccounts: []
      },
      {
        id: `topic_default_5`,
        title: "平价好物分享",
        contentAngle: "性价比高的日常生活用品",
        category: "生活方式",
        trendingScore: 88,
        estimatedEngagement: 90,
        matchScore: 75,
        difficulty: "easy",
        similarAccounts: []
      }
    ];

    // 如果指定了分类，过滤出对应分类的主题
    if (category) {
      const filteredTopics = defaultTopics.filter(topic => topic.category === category);
      return filteredTopics.length > 0 ? filteredTopics : defaultTopics;
    }

    return defaultTopics;
  }

  async getRecommendation(topicId: string): Promise<TopicRecommendation | null> {
    try {
      const data = await redis.get(this.TOPIC_KEY(topicId));
      return typeof data === 'string' ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get recommendation from Redis:", error);
      // Redis 不可用时，返回 null
      return null;
    }
  }

  async saveRecommendation(topic: TopicRecommendation): Promise<void> {
    try {
      await redis.set(this.TOPIC_KEY(topic.id), JSON.stringify(topic));
    } catch (error) {
      console.error("Failed to save recommendation to Redis:", error);
      // Redis 不可用时，继续执行，不影响其他功能
    }
  }

  async saveUserRecommendations(userId: string, topics: TopicRecommendation[]): Promise<void> {
    try {
      // 保存推荐主题ID列表
      const topicIds = topics.map(topic => topic.id);
      await redis.lpush(this.USER_TOPICS_KEY(userId), ...topicIds);
      await redis.ltrim(this.USER_TOPICS_KEY(userId), 0, 49); // 只保留最近50个推荐

      // 保存每个主题的详细信息
      for (const topic of topics) {
        await this.saveRecommendation(topic);
      }
    } catch (error) {
      console.error("Failed to save user recommendations:", error);
      // Redis 不可用时，继续执行，不影响其他功能
    }
  }

  async getPopularTopics(category?: string, limit: number = 20): Promise<TopicRecommendation[]> {
    const cacheKey = `popular:${category || 'all'}:${limit}`;
    
    // 检查缓存
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
      return cachedData.data;
    }

    try {
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

      // 为每个主题生成唯一ID并添加similarAccounts字段
      const popularTopics: TopicRecommendation[] = topics.map((topic: any, index: number) => ({
        ...topic,
        id: `topic_popular_${Date.now()}_${index}`,
        matchScore: 70, // 默认匹配度
        similarAccounts: [] // 可以根据需要添加相似账号
      }));

      // 缓存结果
      this.cache.set(cacheKey, {
        data: popularTopics,
        timestamp: Date.now()
      });

      return popularTopics;
    } catch (error) {
      console.error("Failed to get popular topics:", error);
      // 返回默认热门主题
      const defaultTopics = this.getDefaultRecommendations({} as UserProfile, category).slice(0, limit);
      
      // 缓存默认结果
      this.cache.set(cacheKey, {
        data: defaultTopics,
        timestamp: Date.now()
      });
      
      return defaultTopics;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取热门分类
   * @returns 热门分类列表
   */
  getHotCategories(): string[] {
    return ['生活方式', '职场', '旅行', '美食', '数码', '美妆', '健身', '家居'];
  }
}
