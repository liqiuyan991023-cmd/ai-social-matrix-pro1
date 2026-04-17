import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { History as HistoryIcon, Sparkles, MessageSquare, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { ContentGenerationService } from '../lib/services/contentGenerationService';

interface Creation {
  id: string;
  title: string;
  content: string;
  topic: {
    category: string;
    id?: string;
  };
  keywords: {
    tags: string[];
  };
  createdAt: number;
  likes?: number;
  views?: number;
}

interface Feedback {
  creationId: string;
  userId: string;
  feedbackType: 'preset' | 'custom';
  presetFeedback: string | null;
  customFeedback: string | null;
  createdAt: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('一周内');
  const [userRequirements, setUserRequirements] = useState<string>('');
  const [showSummaryOptions, setShowSummaryOptions] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  // 创建服务实例
  const contentService = new ContentGenerationService();

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // 检查是否有 userId 存储
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/onboarding');
      return;
    }
    setUserId(storedUserId);
    fetchUserProfile(storedUserId);

    // 从localStorage获取用户的创作历史
    const userCreations = JSON.parse(localStorage.getItem('userCreations') || '[]') as Creation[];
    if (userCreations.length > 0) {
      setCreations(userCreations);
    } else {
      // 如果没有本地数据，获取用户的创作历史
      fetchCreations(storedUserId);
    }
  }, [router, isMounted]);


  const fetchCreations = async (userId: string) => {
    try {
      setIsLoading(true);

      // 优先从localStorage获取创作历史
      const localCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
      if (localCreations.length > 0) {
        setCreations(localCreations);
        await generateAiSummary(localCreations);
        setIsLoading(false);
        return;
      }

      // 如果没有本地数据，从ContentGenerationService获取
      const userCreations = await contentService.getUserCreations(userId);

      if (userCreations.length > 0) {
        setCreations(userCreations);
        await generateAiSummary(userCreations);
      } else {
        // 如果都没有数据，不显示创作历史，也不生成总结
        setCreations([]);
        setAiSummary('暂无创作记录，开始创作吧！');
      }
    } catch (error) {
      console.error('Error fetching creations:', error);
      // 发生错误时尝试从localStorage获取
      const localCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
      if (localCreations.length > 0) {
        setCreations(localCreations);
        await generateAiSummary(localCreations);
      } else {
        // 没有数据时显示空状态
        setCreations([]);
        setAiSummary('暂无创作记录，开始创作吧！');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreationClick = (creation: any) => {
    // 跳转到创作内容界面
    router.push(`/creation/${creation.id}`);
  };

  const handleFeedback = async (creation: Creation) => {
    // 跳转到创作页面进行反馈
    router.push(`/create?action=feedback&creationId=${creation.id}&content=${encodeURIComponent(creation.content.substring(0, 100))}`);
  };

  const handleOptimize = async (creation: Creation) => {
    // 跳转到创作页面进行优化
    router.push(`/create?action=optimize&creationId=${creation.id}&content=${encodeURIComponent(creation.content.substring(0, 100))}`);
  };

  // 删除创作记录
  const handleDeleteCreation = (creationId: string) => {
    if (confirm('确定要删除这条创作记录吗？此操作不可恢复。')) {
      try {
        const existingCreations = JSON.parse(localStorage.getItem('userCreations') || '[]') as Creation[];
        const updatedCreations = existingCreations.filter((c: Creation) => c.id !== creationId);
        localStorage.setItem('userCreations', JSON.stringify(updatedCreations));

        // 同时删除相关的反馈
        const existingFeedbacks = JSON.parse(localStorage.getItem('userFeedbacks') || '[]') as Feedback[];
        const updatedFeedbacks = existingFeedbacks.filter((f: Feedback) => f.creationId !== creationId);
        localStorage.setItem('userFeedbacks', JSON.stringify(updatedFeedbacks));

        // 刷新页面显示
        setCreations(updatedCreations);

        // 重新生成AI总结
        generateAiSummary(updatedCreations, updatedFeedbacks);

        alert('删除成功！');
      } catch (error) {
        console.error('Error deleting creation:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 更新generateAiSummary函数以包含反馈信息和时间筛选
  const generateAiSummary = async (creations: any[], feedbacks: any[] = []) => {
    setIsGeneratingSummary(true);
    try {
      // 过滤创作记录根据时间范围
      const now = Date.now();
      const timeRangeMs = {
        '一天内': 24 * 60 * 60 * 1000,
        '一周内': 7 * 24 * 60 * 60 * 1000,
        '两周内': 14 * 24 * 60 * 60 * 1000,
        '一个月': 30 * 24 * 60 * 60 * 1000
      };

      const filteredCreations = creations.filter(creation => {
        return (now - creation.createdAt) <= timeRangeMs[selectedTimeRange as keyof typeof timeRangeMs];
      });

      if (filteredCreations.length === 0) {
        setAiSummary('暂无创作记录，开始创作吧！');
        return;
      }

      const storedFeedbacks = JSON.parse(localStorage.getItem('userFeedbacks') || '[]') as any[];
      const feedbacksToUse = feedbacks.length > 0 ? feedbacks : storedFeedbacks;

      let profile = userProfile;
      if (!profile && userId) {
        profile = await fetchUserProfile(userId);
      }

      const requestBody = {
        creations: filteredCreations,
        feedbacks: feedbacksToUse,
        userProfile: profile || null,
        userRequirements: userRequirements || ''
      };

      const response = await fetch('/api/content/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary || 'AI 创作总结生成失败，请稍后再试。');
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary('AI 创作总结生成失败，请稍后再试。');
    } finally {
      setIsGeneratingSummary(false);
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="创作历史" showIcon={false} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* AI Growth Summary */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-purple rounded-full flex items-center justify-center shadow-soft-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-base">我的成长轨迹</h3>
            </div>
            <button
              onClick={() => setShowSummaryOptions(!showSummaryOptions)}
              className="text-xs text-gray-600 hover:text-primary transition-colors"
            >
              设置
            </button>
          </div>
          {showSummaryOptions && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="一天内">一天内</option>
                  <option value="一周内">一周内</option>
                  <option value="两周内">两周内</option>
                  <option value="一个月">一个月</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分析要求（可选）</label>
                <textarea
                  value={userRequirements}
                  onChange={(e) => setUserRequirements(e.target.value)}
                  placeholder="例如：重点分析我的标题创作技巧"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={2}
                />
              </div>
              <button
                onClick={() => generateAiSummary(creations)}
                disabled={isGeneratingSummary}
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:shadow-soft-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isGeneratingSummary ? '生成中...' : '重新生成总结'}
              </button>
            </div>
          )}

          {isGeneratingSummary ? (
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-6 flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mr-3"></div>
              <div>
                <span className="text-sm font-medium text-gray-800">AI 正在分析你的创作...</span>
                <p className="text-xs text-gray-600 mt-1">这可能需要几分钟时间</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-5 text-sm text-gray-800 font-medium leading-relaxed hover:shadow-soft-md transition-shadow duration-300 max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100">
              <div className="whitespace-pre-wrap break-words">
                {aiSummary || "暂无创作记录，开始创作吧！"}
              </div>
            </div>
          )}
        </div>

        {/* Creation History - 时间线展示 */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft-md">
                <HistoryIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-lg">我的创作时间轴</h3>
            </div>
            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
              共 {creations.length} 篇
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">记录你每一次分享的瞬间，看看自己的生活关注点有什么变化吧～</p>
          <div className="relative">
            {/* 时间线指示器 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-300 via-pink-300 to-rose-400"></div>
            <div className="space-y-4">
              {creations.map((creation, index) => (
                <div key={creation.id} className="relative pl-10">
                  {/* 时间线节点 */}
                  <div className="absolute left-2.5 top-4 w-3 h-3 bg-gradient-primary rounded-full border-2 border-white shadow-soft-sm z-10"></div>
                  <div
                    className="bg-white rounded-2xl shadow-card border border-gray-200 p-5 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 hover:border-primary"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800 flex-1 cursor-pointer hover:text-primary transition-colors" onClick={() => handleCreationClick(creation)}>{creation.title}</h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleCreationClick(creation)}>
                      {creation.content}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {creation.keywords?.tags?.slice(0, 3).map((tag: string, index: number) => (
                        <span key={index} className="text-xs px-3 py-1.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full hover:shadow-soft-sm transition-all duration-200">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{new Date(creation.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      {creation.likes && (
                        <span className="flex items-center gap-1">
                          <span className="text-red-500">❤️</span> {creation.likes}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeedback(creation);
                        }}
                        className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-accent hover:text-accent font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1 text-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        反馈
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOptimize(creation);
                        }}
                        className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-purple-500 hover:text-purple-600 font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1 text-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        优化
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCreation(creation.id);
                        }}
                        className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-red-500 hover:text-red-600 font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
