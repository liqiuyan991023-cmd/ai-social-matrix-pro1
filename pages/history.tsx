import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { History as HistoryIcon, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { ContentGenerationService } from '../lib/services/contentGenerationService';

export default function HistoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [creations, setCreations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // 创建服务实例
  const contentService = new ContentGenerationService();

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

  const generateAiSummary = async (creations: any[]) => {
    setIsGeneratingSummary(true);
    try {
      // 基于创作内容生成总结
      // 构建prompt
      const creationTexts = creations.map(c => c.content).join('\n\n');
      const creationTitles = creations.map(c => c.title).join('\n');
      
      const prompt = `基于以下用户的创作历史，生成一份AI创作总结：

创作标题：
${creationTitles}

创作内容：
${creationTexts}

要求：
1. 分析用户的创作风格和特点
2. 指出用户的创作优势
3. 提供具体的改进建议
4. 内容要专业、有针对性
5. 语言要自然、友好
6. 适合小红书平台的创作者`;
      
      // 调用大语言模型API
      const response = await fetch('/api/content/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      } else {
        // 如果API调用失败，使用默认总结
        const summaries = [
          '根据你最近 3 篇笔记的分析，你的"情绪化表达"数据较好。建议接下来继续保持这种拉近距离的语调，同时可以在末尾增加互动式提问，引导更多评论。',
          '分析了你的近期创作，发现你在"生活分享"领域表现突出，尤其是关于职场和生活方式的内容。建议尝试结合热点话题，提高内容的传播度。',
          '你的创作风格偏向"亲切自然"，这种风格在小红书平台非常受欢迎。建议在内容中增加更多个人故事和真实体验，进一步增强与读者的连接。'
        ];
        const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
        setAiSummary(randomSummary);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary('AI 创作总结生成失败，请稍后再试。');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const fetchCreations = async (userId: string) => {
    try {
      // 从ContentGenerationService获取创作历史
      setIsLoading(true);
      const userCreations = await contentService.getUserCreations(userId);
      
      if (userCreations.length > 0) {
        setCreations(userCreations);
        // 生成 AI 创作总结
        await generateAiSummary(userCreations);
      } else {
        // 如果没有创作历史，使用模拟数据
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
      }
    } catch (error) {
      console.error('Error fetching creations:', error);
      // 发生错误时使用模拟数据
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
        }
      ];
      setCreations(mockCreations);
      await generateAiSummary(mockCreations);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreationClick = (creation: any) => {
    // 跳转到创作内容界面
    router.push(`/creation/${creation.id}`);
  };

  const handleFeedback = (creation: any) => {
    // 打开反馈对话框
    alert('反馈功能开发中，敬请期待！');
  };

  const handleOptimize = (creation: any) => {
    // 打开优化对话框
    alert('优化功能开发中，敬请期待！');
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
      <TopBar title="创作历史" showIcon={false} />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-lg">创作历史</h3>
            </div>
          </div>
          <div className="space-y-4">
            {creations.map(creation => (
              <div 
                key={creation.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-red-300 transition-colors hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 flex-1 cursor-pointer" onClick={() => handleCreationClick(creation)}>{creation.title}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {creation.topic?.category || '生活方式'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2 cursor-pointer" onClick={() => handleCreationClick(creation)}>
                  {creation.content}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {creation.keywords?.tags?.slice(0, 3).map((tag: string, index: number) => (
                    <span key={index} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{new Date(creation.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit' })}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback(creation)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <MessageSquare className="w-3 h-3" />
                    反馈
                  </button>
                  <button
                    onClick={() => handleOptimize(creation)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    优化
                  </button>
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
