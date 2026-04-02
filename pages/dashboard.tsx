import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, TrendingUp, ChevronRight, Zap, Target, Home, User, PenSquare, History } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import CreationHistory from '../components/dashboard/CreationHistory';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [creations, setCreations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hotTopicsIndex, setHotTopicsIndex] = useState(0);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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

  const hotTopics = [
    [
      { title: "2024极简桌面改造指南", tag: "数码", heat: "98k", url: "https://www.xiaohongshu.com/search_result?keyword=2024%E6%9E%81%E7%AE%80%E6%A1%8C%E9%9D%A2%E6%94%B9%E9%80%A0%E6%8C%87%E5%8D%97" },
      { title: "早起10分钟的微习惯改变人生", tag: "个人成长", heat: "85k", url: "https://www.xiaohongshu.com/search_result?keyword=%E6%97%A9%E8%B5%B010%E5%88%86%E9%92%9F%E7%9A%84%E5%BE%AE%E4%B9%A0%E6%83%AF%E6%94%B9%E5%8F%98%E4%BA%BA%E7%94%9F" },
      { title: "这绝对是被严重低估的宝藏APP", tag: "效率工具", heat: "120k", url: "https://www.xiaohongshu.com/search_result?keyword=%E8%B4%AD%E8%97%8FAPP" }
    ],
    [
      { title: "2024年最值得入手的数码产品", tag: "数码", heat: "156k", url: "https://www.xiaohongshu.com/search_result?keyword=2024%E5%B9%B4%E6%9C%80%E5%80%BC%E5%BE%97%E5%85%A5%E6%89%8B%E7%9A%84%E6%95%B0%E7%A0%81%E4%BA%A7%E5%93%81" },
      { title: "办公室必备的5个解压神器", tag: "职场", heat: "78k", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%8A%9E%E5%85%AC%E5%AE%A4%E5%BF%85%E5%A4%87%E7%9A%845%E4%B8%AA%E8%A7%A3%E5%8E%8B%E7%A5%9E%E5%99%A8" },
      { title: "一周不重样的快手早餐", tag: "美食", heat: "92k", url: "https://www.xiaohongshu.com/search_result?keyword=%E4%B8%80%E5%91%A8%E4%B8%8D%E9%87%8D%E6%A0%B7%E7%9A%84%E5%BF%AB%E6%89%8B%E6%97%A9%E9%A4%90" }
    ],
    [
      { title: "极简主义生活方式指南", tag: "生活方式", heat: "110k", url: "https://www.xiaohongshu.com/search_result?keyword=%E6%9E%81%E7%AE%80%E4%B8%BB%E4%B9%89%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F%E6%8C%87%E5%8D%97" },
      { title: "2024年流行的家居装饰趋势", tag: "家居", heat: "89k", url: "https://www.xiaohongshu.com/search_result?keyword=2024%E5%B9%B4%E6%B5%81%E8%A1%8C%E7%9A%84%E5%AE%B6%E5%B1%85%E8%A3%85%E9%A5%B0%E8%B6%8B%E5%8A%BF" },
      { title: "高效时间管理的5个技巧", tag: "效率", heat: "135k", url: "https://www.xiaohongshu.com/search_result?keyword=%E9%AB%98%E6%95%88%E6%97%B6%E9%97%B4%E7%AE%A1%E7%90%86%E7%9A%845%E4%B8%AA%E6%8A%80%E5%B7%A7" }
    ]
  ];

  const handleRefreshHotTopics = () => {
    setHotTopicsIndex((prevIndex) => (prevIndex + 1) % hotTopics.length);
  };

  const generateAiSummary = async (creations: any[]) => {
    setIsGeneratingSummary(true);
    try {
      // 这里应该调用 API 生成 AI 创作总结
      // 由于我们没有实现这个 API，暂时使用模拟数据
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 基于创作内容生成总结
      // 这里模拟大语言模型的处理逻辑
      const summaries = [
        '根据你最近 3 篇笔记的分析，你的"情绪化表达"数据较好。建议接下来继续保持这种拉近距离的语调，同时可以在末尾增加互动式提问，引导更多评论。',
        '分析了你的近期创作，发现你在"生活分享"领域表现突出，尤其是关于职场和生活方式的内容。建议尝试结合热点话题，提高内容的传播度。',
        '你的创作风格偏向"亲切自然"，这种风格在小红书平台非常受欢迎。建议在内容中增加更多个人故事和真实体验，进一步增强与读者的连接。'
      ];
      
      // 随机选择一个总结
      const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
      setAiSummary(randomSummary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary('AI 创作总结生成失败，请稍后再试。');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

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
          title: '打工人的救命神器分享',
          content: '这绝对是打工人必备的桌面好物！平时天天对着电脑，颈椎真的受不了...',
          topic: {
            category: '生活方式'
          },
          keywords: {
            tags: ['打工人', '桌面改造', '好物分享']
          },
          createdAt: Date.now() - 86400000, // 1天前
          likes: 128,
          views: 1200
        },
        {
          id: 'creation_2',
          title: '极简穿搭：周五下班直接去约会',
          content: '谁懂啊！这种一衣多穿的快乐。今天这套Look真是闭眼穿都好看...',
          topic: {
            category: '时尚'
          },
          keywords: {
            tags: ['极简穿搭', '职场穿搭', '约会穿搭']
          },
          createdAt: Date.now() - 172800000, // 2天前
          likes: 450,
          views: 3500
        },
        {
          id: 'creation_3',
          title: '探店 | 这家藏在巷子里的咖啡馆',
          content: '终于被我挖到了！人少安静，咖啡好喝，超级适合带电脑来办公...',
          topic: {
            category: '探店'
          },
          keywords: {
            tags: ['咖啡馆', '探店', '办公好去处']
          },
          createdAt: Date.now() - 259200000, // 3天前
          likes: 65,
          views: 800
        }
      ];
      
      setCreations(mockCreations);
      // 生成 AI 创作总结
      await generateAiSummary(mockCreations);
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
        <div>
          <h2 className="text-2xl font-bold text-gray-800">你好，创作者</h2>
          <p className="text-sm text-gray-600 mt-1">今天想分享点什么？</p>
        </div>

        {/* Call to Action Card */}
        <div className="bg-gradient-to-br from-red-500 to-rose-500 border-none text-white shadow-lg shadow-red-200 rounded-xl p-5 flex items-center justify-between">
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

        {/* Hot Topics (Simulated Tavily API Concept) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-base">近期爆款灵感</h3>
            </div>
            <span className="text-xs text-gray-600 cursor-pointer hover:text-red-500 transition-colors" onClick={handleRefreshHotTopics}>换一批</span>
          </div>
          
          <div className="space-y-3">
            {hotTopics[hotTopicsIndex].map((item, i) => (
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
            ))}
          </div>
        </div>

        {/* AI Growth Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-base">AI 创作总结</h3>
          </div>
          {isGeneratingSummary ? (
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mr-3"></div>
              <span className="text-sm text-gray-700">AI 正在分析你的创作...</span>
            </div>
          ) : (
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              {aiSummary || "根据你最近 3 篇笔记的分析，你的**“情绪化表达”**数据较好。建议接下来继续保持这种拉近距离的语调，同时可以在末尾增加互动式提问，引导更多评论。"}
            </div>
          )}
        </div>

        {/* Creation History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-lg">创作历史</h3>
          </div>
          <div className="space-y-4">
            {creations.map(creation => (
              <div key={creation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-red-300 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 flex-1">{creation.title}</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {creation.content}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{new Date(creation.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="red" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {creation.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {creation.views} 曝光
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
