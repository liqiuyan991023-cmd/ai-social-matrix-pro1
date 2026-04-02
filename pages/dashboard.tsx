import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, TrendingUp, ChevronRight, Zap, Target } from 'lucide-react';
import TopBar from '../components/TopBar';
import CreationHistory from '../components/dashboard/CreationHistory';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [creations, setCreations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否有 userId 存储
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/onboarding');
      return;
    }
    setUserId(storedUserId);

    // 获取用户的创作历史
    fetchCreations(storedUserId);
  }, [router]);

  const fetchCreations = async (userId: string) => {
    try {
      // 这里应该调用 API 获取创作历史
      // 由于我们没有实现这个 API，暂时使用模拟数据
      setIsLoading(true);
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟创作历史数据
      const mockCreations = [
        {
          id: 'creation_1',
          title: '5分钟快手早餐食谱',
          content: '大家好呀！今天想和大家分享一下我的早餐日常～作为一个上班族，每天早上时间都很紧张，所以我特别喜欢简单又营养的早餐...',
          topic: {
            category: '生活方式'
          },
          keywords: {
            tags: ['早餐', '健康饮食', '上班族必备']
          },
          createdAt: Date.now() - 86400000 // 1天前
        },
        {
          id: 'creation_2',
          title: '办公室解压小技巧',
          content: '工作压力大？试试这些办公室解压小技巧！在紧张的工作中，适当的放松可以提高效率...',
          topic: {
            category: '职场'
          },
          keywords: {
            tags: ['职场', '解压', '效率']
          },
          createdAt: Date.now() - 172800000 // 2天前
        }
      ];
      
      setCreations(mockCreations);
    } catch (error) {
      console.error('Error fetching creations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="AI Social Matrix Pro" showIcon={true} />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">你好，创作者</h2>
          <p className="text-sm text-gray-600 mt-1">今天想分享点什么？</p>
        </div>

        {/* Call to Action Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 border-none text-white shadow-lg shadow-blue-200 rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm">
              <Target className="w-3 h-3" />
              <span>核心定位</span>
            </div>
            <h3 className="font-semibold text-lg leading-tight">开始你的创作之旅</h3>
            <p className="text-sm text-white/80">AI 助力，轻松生成高质量内容</p>
          </div>
          <button 
            onClick={() => router.push('/create')}
            className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Hot Topics (Simulated Tavily API Concept) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-base">近期爆款灵感</h3>
            </div>
            <span className="text-xs text-gray-600 cursor-pointer">换一批</span>
          </div>
          
          <div className="space-y-3">
            {[
              { title: "2024极简桌面改造指南", tag: "数码", heat: "98k" },
              { title: "早起10分钟的微习惯改变人生", tag: "个人成长", heat: "85k" },
              { title: "这绝对是被严重低估的宝藏APP", tag: "效率工具", heat: "120k" }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push('/create')}>
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
            ))}
          </div>
        </div>

        {/* AI Growth Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-base">AI 创作总结</h3>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
            根据你最近 3 篇笔记的分析，你的**“情绪化表达”**数据较好。建议接下来继续保持这种拉近距离的语调，同时可以在末尾增加互动式提问，引导更多评论。
          </div>
        </div>

        {/* Creation History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-lg">创作历史</h3>
          </div>
          <CreationHistory
            creations={creations}
            isLoading={isLoading}
            onSelectCreation={(creation) => {
              console.log('Selected creation:', creation);
              // 这里可以导航到创作详情页
            }}
          />
        </div>
      </div>
    </div>
  );
}
