import axios from 'axios';
import { HotTopic } from '../types';

export class TavilyService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: HotTopic[]; timestamp: number }>;
  private cacheExpiry: number; // 缓存过期时间（毫秒）

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || 'YOUR_TAVILY_API_KEY';
    this.baseUrl = process.env.TAVILY_API_URL || 'https://api.tavily.com';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30分钟缓存
  }

  /**
   * 获取热点内容
   * @param query 搜索查询
   * @param category 分类
   * @returns 热点内容列表
   */
  async getHotTopics(query: string = '小红书热门话题', category?: string): Promise<HotTopic[]> {
    const cacheKey = `${query}:${category || 'all'}`;
    
    // 检查缓存
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
      return cachedData.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          api_key: this.apiKey,
          query,
          category,
          max_results: 6,
          include_domains: ['xiaohongshu.com'],
          search_depth: 'basic'
        }
      });

      // 处理返回的数据
      const results = response.data.results || [];
      
      // 转换为我们需要的格式
      const hotTopics: HotTopic[] = results.map((result: any) => ({
        title: result.title,
        tag: category || '热点',
        heat: `${Math.floor(Math.random() * 100) + 50}k`, // 模拟热度
        url: result.url
      }));

      // 缓存结果
      this.cache.set(cacheKey, {
        data: hotTopics,
        timestamp: Date.now()
      });

      return hotTopics;
    } catch (error) {
      console.error('Error fetching hot topics from Tavily:', error);
      // 返回默认数据作为 fallback
      const defaultTopics = this.getDefaultHotTopics(category);
      
      // 缓存默认数据
      this.cache.set(cacheKey, {
        data: defaultTopics,
        timestamp: Date.now()
      });
      
      return defaultTopics;
    }
  }

  /**
   * 获取默认热点内容（当API调用失败时使用）
   * @param category 分类
   * @returns 默认热点内容列表
   */
  private getDefaultHotTopics(category?: string): HotTopic[] {
    const defaultTopics: HotTopic[] = [
      {
        title: "2024极简桌面改造指南",
        tag: "数码",
        heat: "98k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2024%E6%9E%81%E7%AE%80%E6%A1%8C%E9%9D%A2%E6%94%B9%E9%80%A0%E6%8C%87%E5%8D%97"
      },
      {
        title: "早起10分钟的微习惯改变人生",
        tag: "个人成长",
        heat: "85k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E6%97%A9%E8%B5%B010%E5%88%86%E9%92%9F%E7%9A%84%E5%BE%AE%E4%B9%A0%E6%83%AF%E6%94%B9%E5%8F%98%E4%BA%BA%E7%94%9F"
      },
      {
        title: "这绝对是被严重低估的宝藏APP",
        tag: "效率工具",
        heat: "120k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E8%B4%AD%E8%97%8FAPP"
      },
      {
        title: "2024年最值得入手的数码产品",
        tag: "数码",
        heat: "156k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2024%E5%B9%B4%E6%9C%80%E5%80%BC%E5%BE%97%E5%85%A5%E6%89%8B%E7%9A%84%E6%95%B0%E7%A0%81%E4%BA%A7%E5%93%81"
      },
      {
        title: "办公室必备的5个解压神器",
        tag: "职场",
        heat: "78k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E5%8A%9E%E5%85%AC%E5%AE%A4%E5%BF%85%E5%A4%87%E7%9A%845%E4%B8%AA%E8%A7%A3%E5%8E%8B%E7%A5%9E%E5%99%A8"
      },
      {
        title: "一周不重样的快手早餐",
        tag: "美食",
        heat: "92k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E4%B8%80%E5%91%A8%E4%B8%8D%E9%87%8D%E6%A0%B7%E7%9A%84%E5%BF%AB%E6%89%8B%E6%97%A9%E9%A4%90"
      },
      {
        title: "极简主义生活方式指南",
        tag: "生活方式",
        heat: "110k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E6%9E%81%E7%AE%80%E4%B8%BB%E4%B9%89%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F%E6%8C%87%E5%8D%97"
      },
      {
        title: "2024年流行的家居装饰趋势",
        tag: "家居",
        heat: "89k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2024%E5%B9%B4%E6%B5%81%E8%A1%8C%E7%9A%84%E5%AE%B6%E5%B1%85%E8%A3%85%E9%A5%B0%E8%B6%8B%E5%8A%BF"
      },
      {
        title: "高效时间管理的5个技巧",
        tag: "效率",
        heat: "135k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E9%AB%98%E6%95%88%E6%97%B6%E9%97%B4%E7%AE%A1%E7%90%86%E7%9A%845%E4%B8%AA%E6%8A%80%E5%B7%A7"
      }
    ];

    // 如果指定了分类，过滤出对应分类的主题
    if (category) {
      const filteredTopics = defaultTopics.filter(topic => topic.tag === category);
      return filteredTopics.length > 0 ? filteredTopics : defaultTopics.slice(0, 3);
    }

    // 随机返回3个主题
    return defaultTopics.sort(() => 0.5 - Math.random()).slice(0, 3);
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
    return ['数码', '个人成长', '效率工具', '职场', '美食', '生活方式', '家居', '效率'];
  }
}
