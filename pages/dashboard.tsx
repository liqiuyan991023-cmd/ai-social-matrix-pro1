import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, TrendingUp, ChevronRight, Zap, Target, Home, User, PenSquare, History, Loader2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { TavilyService } from '../lib/services/tavilyService';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

    // 获取热点话题
    fetchHotTopics();
  }, [router]);

  const fetchHotTopics = async () => {
    setIsLoadingHotTopics(true);
    try {
      // 从Tavily API获取热点话题
      const topics = await tavilyService.getHotTopics();
      setHotTopics(topics);
    } catch (error) {
      console.error('Error fetching hot topics:', error);
    } finally {
      setIsLoadingHotTopics(false);
    }
  };

  const handleRefreshHotTopics = () => {
    fetchHotTopics();
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
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center justify-between hover:border-red-300 transition-colors cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-gray-800">{item.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-normal">{item.tag}</span>
                      <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-orange-400" /> {item.heat} 热度
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
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
