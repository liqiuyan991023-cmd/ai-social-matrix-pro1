import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, TrendingUp, ChevronRight, Zap, Target, Home, User, PenSquare, History, Loader2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { TavilyService } from '../lib/services/tavilyService';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [isLoadingHotTopics, setIsLoadingHotTopics] = useState(false);

  // 创建TavilyService实例
  const tavilyService = new TavilyService();

  useEffect(() => {
    // 检查是否有 userId 存储
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/onboarding');
      return;
    }
    setUserId(storedUserId);

    // 获取热点话题 - 使用正确的分类参数
    fetchHotTopics();
  }, [router]);

  const fetchHotTopics = async () => {
    setIsLoadingHotTopics(true);
    try {
      // 从Tavily API获取小红书热门话题
      // 使用category参数指定小红书相关内容
      const topics = await tavilyService.getHotTopics('小红书热门话题', '生活方式');
      setHotTopics(topics);
    } catch (error) {
      console.error('Error fetching hot topics:', error);
      // API调用失败时设置一些默认的热门话题
      setHotTopics(getDefaultHotTopics());
    } finally {
      setIsLoadingHotTopics(false);
    }
  };

  // 默认热点话题（当API调用失败时使用）
  const getDefaultHotTopics = () => {
    return [
      {
        title: "2025春季穿搭趋势",
        tag: "时尚",
        heat: "95k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2025春季穿搭"
      },
      {
        title: "办公室养生小妙招",
        tag: "职场",
        heat: "82k",
        url: "https://www.xiaohongshu.com/search_result?keyword=办公室养生"
      },
      {
        title: "周末短途旅行推荐",
        tag: "旅行",
        heat: "135k",
        url: "https://www.xiaohongshu.com/search_result?keyword=周末短途旅行"
      }
    ];
  };

  const handleRefreshHotTopics = async () => {
    await fetchHotTopics();
  };

  // 处理话题点击
  const handleTopicClick = (topic: any) => {
    if (topic.url && topic.url.startsWith('http')) {
      window.open(topic.url, '_blank', 'noopener,noreferrer');
    } else {
      // 如果URL无效，尝试生成一个小红书搜索链接
      const searchKeyword = encodeURIComponent(topic.title);
      window.open(`https://www.xiaohongshu.com/search_result?keyword=${searchKeyword}`, '_blank', 'noopener,noreferrer');
    }
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
      <TopBar title="RedSpark" showIcon={true} />
      
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
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : hotTopics.length > 0 ? (
              // 显示热点话题
              hotTopics.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleTopicClick(item)}
                  className="w-full bg-white rounded-xl shadow-card border border-gray-200 p-4 flex items-center justify-between hover:shadow-card-hover hover:border-primary transition-all duration-300 text-left"
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
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </button>
              ))
            ) : (
              // 无数据状态
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-600">暂无热点灵感，点击"换一批"试试</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
