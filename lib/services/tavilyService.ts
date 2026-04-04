import axios from 'axios';
import { HotTopic } from '../types';

export class TavilyService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: HotTopic[]; timestamp: number }>;
  private cacheExpiry: number; // 缓存过期时间（毫秒）

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || 'YOUR_TAVILY_API_KEY';
    this.baseUrl = process.env.TAVILY_API_URL || 'https://api.tavily.com/v1';
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

    // 检查缓存 - 对于2026年相关查询，不使用缓存以确保获取最新内容
    if (!query.includes('2026') && !query.includes('2026年')) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
        return cachedData.data;
      }
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          api_key: this.apiKey,
          query,
          category,
          max_results: 6,
          include_domains: ['xiaohongshu.com', 'weibo.com', 'zhihu.com', 'douban.com'],
          search_depth: 'advanced'
        }
      });

      // 处理返回的数据
      const results = response.data.results || [];

      // 转换为我们需要的格式
      const hotTopics: HotTopic[] = results.map((result: any) => ({
        title: result.title,
        tag: category || '科技',
        heat: `${Math.floor(Math.random() * 100) + 50}k`, // 模拟热度
        url: result.url
      }));

      // 只缓存非2026年查询的结果
      if (!query.includes('2026') && !query.includes('2026年')) {
        this.cache.set(cacheKey, {
          data: hotTopics,
          timestamp: Date.now()
        });
      }

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
        title: "2026年春季穿搭新趋势",
        tag: "时尚",
        heat: "120k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2026%E5%B9%B4%E6%98%A5%E5%AD%A3%E7%A9%BF%E6%90%AD%E6%96%B0%E8%B6%8B%E5%8A%BF"
      },
      {
        title: "AI工具提升工作效率的10种方法",
        tag: "效率工具",
        heat: "150k",
        url: "https://www.xiaohongshu.com/search_result?keyword=AI%E5%B7%A5%E5%85%B7%E6%8F%90%E5%8D%87%E5%B7%A5%E4%BD%9C%E6%95%88%E7%8E%87"
      },
      {
        title: "居家办公必备的智能家居",
        tag: "家居",
        heat: "110k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E5%B1%85%E5%AE%B6%E5%8A%9E%E5%85%AC%E5%BF%85%E5%A4%87%E7%9A%84%E6%99%BA%E8%83%BD%E5%AE%B6%E5%B1%85"
      },
      {
        title: "2026年最值得入手的数码新品",
        tag: "数码",
        heat: "180k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2026%E5%B9%B4%E6%9C%80%E5%80%BC%E5%BE%97%E5%85%A5%E6%89%8B%E7%9A%84%E6%95%B0%E7%A0%81%E6%96%B0%E5%93%81"
      },
      {
        title: "可持续生活方式指南",
        tag: "生活方式",
        heat: "95k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E5%8F%AF%E6%8C%81%E7%BB%AD%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F%E6%8C%87%E5%8D%97"
      },
      {
        title: "远程工作保持身心健康的秘诀",
        tag: "职场",
        heat: "130k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E8%BF%9C%E7%A8%8B%E5%B7%A5%E4%BD%9C%E4%BF%9D%E6%8C%81%E8%BA%AB%E5%BF%83%E5%81%A5%E5%BA%B7"
      },
      {
        title: "元宇宙社交新体验",
        tag: "科技",
        heat: "200k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E5%85%83%E5%AE%87%E5%AE%99%E7%A4%BE%E4%BA%A4%E6%96%B0%E4%BD%93%E9%AA%8C"
      },
      {
        title: "零食控的健康替代品推荐",
        tag: "美食",
        heat: "140k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E9%9B%B6%E9%A3%9F%E6%8E%A7%E7%9A%84%E5%81%A5%E5%BA%B7%E6%9B%BF%E4%BB%A3%E5%93%81"
      },
      {
        title: "数字游民的生活方式",
        tag: "旅行",
        heat: "160k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E6%95%B0%E5%AD%97%E6%B8%B8%E6%B0%91%E7%9A%84%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F"
      },
      {
        title: "AI写作助手使用技巧",
        tag: "创作",
        heat: "170k",
        url: "https://www.xiaohongshu.com/search_result?keyword=AI%E5%86%99%E4%BD%9C%E5%8A%A9%E6%89%8B%E4%BD%BF%E7%94%A8%E6%8A%80%E5%B7%A7"
      }
    ];

    // 如果指定了分类，过滤出对应分类的主题
    if (category) {
      const filteredTopics = defaultTopics.filter(topic => topic.tag === category);
      return filteredTopics.length > 0 ? filteredTopics : defaultTopics.slice(0, 3);
    }

    // 随机返回6个主题
    return defaultTopics.sort(() => 0.5 - Math.random()).slice(0, 6);
  }

  /**
   * 从标题中提取分类
   * @param title 标题
   * @returns 分类标签
   */
  private extractCategoryFromTitle(title: string): string {
    const categoryKeywords = {
      '时尚': ['穿搭', '衣服', '时尚', '美妆', '护肤', '发型'],
      '数码': ['手机', '电脑', '数码', '科技', '电子产品', 'APP'],
      '美食': ['美食', '菜谱', '烘焙', '甜品', '早餐', '午餐', '晚餐'],
      '家居': ['家居', '装修', '家具', '家装', '智能家居'],
      '旅行': ['旅行', '旅游', '出游', '目的地', '攻略'],
      '职场': ['工作', '职场', '办公', '效率', '职业发展'],
      '生活方式': ['生活', '习惯', '健康', '运动', '阅读'],
      '创作': ['写作', '创作', '设计', '艺术', '摄影']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return '热点';
  }

  /**
   * 获取热门分类
   * @returns 热门分类列表
   */
  getHotCategories(): string[] {
    return ['数码', '个人成长', '效率工具', '职场', '美食', '生活方式', '家居', '效率'];
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}
