import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

export interface HotTopic {
  title: string;
  tag: string;
  heat: string;
  url: string;
}

export interface ApiResponse {
  success: boolean;
  data: HotTopic[];
  source: 'tavily_api' | 'fallback' | 'cache';
  cached?: boolean;
  timestamp?: string;
  error?: string;
  message?: string;
  meta?: {
    totalResults?: number;
    queryTime?: number;
    category?: string;
  };
  debug?: any;
}

export interface FetchOptions {
  query?: string;
  category?: string;
  maxResults?: number;
  refresh?: boolean;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  data: HotTopic[];
  source: 'fallback';
  timestamp: string;
}

class TavilyApiClient {
  private client: AxiosInstance;
  private cache: Map<string, { data: ApiResponse; timestamp: number }>;
  private cacheExpiry: number;

  constructor() {
    // 创建Axios实例
    this.client = axios.create({
      baseURL: '/api/tavily', // 使用相对路径，由Next.js处理
      timeout: 15000, // 15秒超时
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加时间戳防止缓存
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // 统一错误处理
        if (error.code === 'ECONNABORTED') {
          return Promise.reject({
            ...error,
            message: '请求超时，请检查网络连接'
          });
        }
        return Promise.reject(error);
      }
    );

    // 初始化缓存
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(params: FetchOptions): string {
    const { query = '', category, maxResults = 6 } = params;
    return `hot-ideas:${query}:${category || 'all'}:${maxResults}`;
  }

  /**
   * 获取热点内容灵感
   */
  async fetchHotIdeas(options: FetchOptions = {}): Promise<ApiResponse> {
    const {
      query = '小红书热门话题 2026年趋势',
      category,
      maxResults = 6,
      refresh = false
    } = options;

    const cacheKey = this.generateCacheKey({ query, category, maxResults });

    // 检查缓存（如果不强制刷新）
    if (!refresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('[TavilyClient] Using cached data');
        return {
          ...cached.data,
          cached: true
        };
      }
    }

    try {
      console.log('[TavilyClient] Fetching hot ideas from API', { query, category, maxResults });

      const response: AxiosResponse<ApiResponse> = await this.client.get('/hot-ideas', {
        params: {
          query,
          category,
          maxResults
        }
      });

      const data = response.data;

      // 缓存成功响应
      if (data.success && data.data) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;

    } catch (error: any) {
      console.error('[TavilyClient] API call failed:', error);

      // 错误处理
      const apiError = this.handleApiError(error);

      // 尝试从缓存获取数据
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('[TavilyClient] Returning cached data after error');
        return {
          ...cached.data,
          cached: true,
          error: apiError.message
        };
      }

      // 返回默认数据
      return {
        success: false,
        data: this.getDefaultHotTopics(),
        source: 'fallback',
        error: apiError.message,
        message: '无法获取实时数据，显示默认内容'
      };
    }
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any): { message: string; status?: number } {
    const defaultError = {
      message: '网络请求失败，请稍后重试',
      status: undefined
    };

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return { message: '请求超时，请检查网络连接', status: 408 };
      }
      if (error.code === 'ERR_NETWORK') {
        return { message: '网络连接失败，请检查网络设置', status: 0 };
      }
      return defaultError;
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        return { message: '请求参数错误', status };
      case 401:
        return { message: 'API认证失败，请联系管理员', status };
      case 403:
        return { message: '访问被拒绝', status };
      case 404:
        return { message: 'API接口不存在', status };
      case 429:
        return { message: '请求过于频繁，请稍后再试', status };
      case 500:
      case 502:
      case 503:
        return { message: '服务器暂时无法响应，请稍后重试', status };
      default:
        return {
          message: data?.message || `服务器错误 (${status})`,
          status
        };
    }
  }

  /**
   * 获取默认热点话题（当API完全失败时使用）
   */
  private getDefaultHotTopics(): HotTopic[] {
    const defaultTopics: HotTopic[] = [
      {
        title: "办公室必备的5个解压神器",
        tag: "职场",
        heat: "92k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E5%8A%9E%E5%85%AC%E5%AE%A4%E5%BF%85%E5%A4%87%E7%9A%845%E4%B8%AA%E8%A7%A3%E5%8E%8B%E7%A5%9E%E5%99%A8"
      },
      {
        title: "2024年最值得入手的数码产品",
        tag: "数码",
        heat: "110k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2024%E5%B9%B4%E6%9C%80%E5%80%BC%E5%BE%97%E5%85%A5%E6%89%8B%E7%9A%84%E6%95%B0%E7%A0%81%E4%BA%A7%E5%93%81"
      },
      {
        title: "极简主义生活方式指南",
        tag: "生活方式",
        heat: "88k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E6%9E%81%E7%AE%80%E4%B8%BB%E4%B9%89%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F%E6%8C%87%E5%8D%97"
      },
      {
        title: "这绝对是被严重低估的宝藏APP",
        tag: "效率工具",
        heat: "120k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E8%B4%AF%E8%B4%A8APP"
      },
      {
        title: "2024年流行的家居装饰趋势",
        tag: "家居",
        heat: "99k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2024%E5%B9%B4%E6%B5%81%E8%A1%8C%E7%9A%84%E5%AE%B6%E5%B1%85%E8%A3%85%E9%A5%B0%E8%B6%8B%E5%8A%BF"
      },
      {
        title: "高效时间管理的5个技巧",
        tag: "效率",
        heat: "86k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E9%AB%98%E6%95%88%E6%97%B6%E9%97%B4%E7%AE%A1%E7%90%86%E7%9A%845%E4%B8%AA%E6%8A%80%E5%B7%A7"
      }
    ];

    // 随机返回6个主题
    return defaultTopics.sort(() => 0.5 - Math.random()).slice(0, 6);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[TavilyClient] Cache cleared');
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例实例
export const tavilyClient = new TavilyApiClient();

