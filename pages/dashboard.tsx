import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, TrendingUp, ChevronRight, Zap, Target, Home, User, PenSquare, History, Loader2, AlertCircle } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { tavilyClient, ApiResponse, HotTopic } from '../lib/api/tavilyClient';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [isLoadingHotTopics, setIsLoadingHotTopics] = useState(false);
  const [hotTopicsError, setHotTopicsError] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否有 userId 存储
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/onboarding');
      return;
    }
    setUserId(storedUserId);

    // 获取热点话题
    fetchHotTopics();
  }, [router]);

  const fetchHotTopics = useCallback(async (refresh = false) => {
    setIsLoadingHotTopics(true);
    setHotTopicsError(null);

    try {
      console.log('[Dashboard] Fetching hot topics', { refresh });

      const response: ApiResponse = await tavilyClient.fetchHotIdeas({
        query: '小红书热门话题 2026年趋势',
        category: undefined,
        maxResults: 6,
        refresh
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        setHotTopics(response.data);
        console.log('[Dashboard] Hot topics loaded successfully', {
          count: response.data.length,
          source: response.source,
          cached: response.cached
        });
      } else {
        throw new Error(response.message || 'Invalid data format');
      }
    } catch (error: any) {
      console.error('[Dashboard] Error fetching hot topics:', error);

      const errorMessage = error.message || '获取热点话题失败';
      setHotTopicsError(errorMessage);

      // 获取失败时使用默认数据
      const defaultTopics = getDefaultHotTopics();
      setHotTopics(defaultTopics);
    } finally {
      setIsLoadingHotTopics(false);
    }
  }, []);

  // 添加错误边界效果
  useEffect(() => {
    if (hotTopicsError) {
      console.warn('[Dashboard] Hot topics error state:', hotTopicsError);
    }
  }, [hotTopicsError]);

  // 默认热点话题（当API调用失败时使用）
  const getDefaultHotTopics = () => {
    return [
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
      },
      {
        title: "早起10分钟的微习惯改变人生",
        tag: "个人成长",
        heat: "93k",
        url: "https://www.xiaohongshu.com/search_result?keyword=%E6%97%A9%E8%B5%B710%E5%88%86%E9%92%9F%E7%9A%84%E5%BE%AE%E4%B9%A0%E6%83%AF%E6%94%B9%E5%8F%98%E4%BA%BA%E7%94%9F"
      },
      {
        title: "2024极简桌面改造指南",
        tag: "职场",
        heat: "101k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2024%E6%9E%81%E7%AE%80%E6%A1%8C%E9%9D%A2%E6%94%B9%E9%80%A0%E6%8C%87%E5%8D%97"
      }
    ];
  };

  const handleRefreshHotTopics = async () => {
    await fetchHotTopics(true);
  };

  // 处理话题点击
  const handleTopicClick = async (topic: any) => {
    const url = topic.url || `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(topic.title)}`;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      try {
        // 在新标签页打开链接（更可靠的方式）
        window.open(url, '_blank', 'noopener,noreferrer');
        
        // 同时在当前页面显示提示
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.textContent = `正在打开 ${topic.title} 的搜索结果...`;
        document.body.appendChild(notification);
        
        // 3秒后移除提示
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);

        // 后台埋点统计，不阻塞页面跳转
        await fetch('/api/content/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'click', topicId: topic.id || topic.title })
        });
      } catch (err) {
        console.error('Topic click tracking failed:', err);
        // 如果新窗口被阻止，显示错误信息
        alert(`无法打开链接。请允许弹出窗口，或手动搜索：${topic.title}`);
      }
      return;
    }

    alert('未找到可跳转的链接，请稍后重试');
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar title="RedSpark" showLogo={true} />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800">你好，创作者</h2>
          <p className="text-sm text-gray-600 mt-1">今天想分享点什么？</p>
        </div>

        {/* Call to Action Card */}
        <div className="bg-red-500 border-none text-white shadow-lg shadow-red-200 rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm">
              <Target className="w-3 h-3" />
              <span>核心定位</span>
            </div>
            <h3 className="font-semibold text-lg leading-tight">还未完成人设诊断？</h3>
            <p className="text-sm text-white/80">花1分钟定制你的专属AI写作人格</p>
          </div>
          <button 
            onClick={() => router.push('/onboarding')}
            className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Hot Topics (Tavily API Integration) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-base">近期爆款灵感</h3>
            </div>
            <button
              onClick={handleRefreshHotTopics}
              disabled={isLoadingHotTopics}
              className="text-xs text-gray-600 cursor-pointer hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="换一批热点话题"
            >
              {isLoadingHotTopics ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> 加载中...
                </>
              ) : (
                '换一批'
              )}
            </button>
          </div>
          
          <div className="space-y-3">
            {isLoadingHotTopics ? (
              // 加载状态
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : hotTopicsError ? (
              // 错误状态
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{hotTopicsError}</p>
                    <p className="text-xs text-red-600 mt-1">已显示默认话题</p>
                  </div>
                  <button
                    onClick={handleRefreshHotTopics}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    重试
                  </button>
                </div>
              </div>
            ) : hotTopics.length > 0 ? (
              // 显示热点话题
              hotTopics.map((item, i) => (
                <div
                  key={`${item.title}-${i}`}
                  onClick={() => handleTopicClick(item)}
                  className="w-full bg-white rounded-xl shadow-card border border-gray-200 p-4 flex items-center justify-between hover:shadow-card-hover hover:border-primary transition-all duration-300 cursor-pointer"
                >
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-800 hover:text-primary transition-colors">{item.title}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{item.tag || '热点'}</span>
                      <span className="text-[11px] text-gray-600 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-orange-500" /> {item.heat || '50k'} 热度
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
                </div>
              ))
            ) : (
              // 无数据状态
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                  <p className="text-gray-600">暂无热点灵感</p>
                  <button
                    onClick={handleRefreshHotTopics}
                    className="text-xs text-red-500 hover:text-red-600 underline mt-1"
                  >
                    点击"换一批"重试
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
