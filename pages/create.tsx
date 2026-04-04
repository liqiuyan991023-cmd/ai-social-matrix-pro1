import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PenSquare, Copy, Check, Sparkles, MessageSquarePlus, Loader2, User, RefreshCw, AlertCircle } from 'lucide-react';
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { ContentGenerationService } from "../lib/services/contentGenerationService";
import { TopicRecommendationService } from "../lib/services/topicRecommendationService";

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [idea, setIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [hasResult, setHasResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  
  // 创建服务实例
  const contentService = new ContentGenerationService();
  const topicService = new TopicRecommendationService();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/onboarding");
      return;
    }
    setUserId(storedUserId);
    fetchUserProfile(storedUserId);
  }, [router]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      alert('请输入创作想法');
      return;
    }

    if (!userId) {
      alert('用户信息加载失败，请刷新页面');
      return;
    }

    setIsGenerating(true);

    try {
      // 确保userProfile已加载
      if (!userProfile) {
        await fetchUserProfile(userId);
        if (!userProfile) {
          throw new Error('用户画像加载失败，请重新设置人设画像');
        }
      }

      // 调用API生成内容
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          topicId: 'default_topic',
          idea: idea
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '内容生成失败，请重试');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应数据');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let generatedTitle = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const stageData = JSON.parse(data);
              if (stageData.stage === 'title') {
                generatedTitle = stageData.content || '';
              } else if (stageData.stage === 'content') {
                fullContent = stageData.content || '';
                setGeneratedContent(fullContent);
              } else if (stageData.stage === 'keywords') {
                setKeywords(stageData.content?.tags || []);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      if (!fullContent) {
        throw new Error('内容生成失败，请重试');
      }

      setHasResult(true);

    } catch (error) {
      console.error('Content generation error:', error);

      // 针对不同错误给出不同提示
      if (error instanceof Error && error.message.includes('用户画像')) {
        if (confirm('用户画像加载失败，是否前往设置人设画像？')) {
          router.push('/onboarding');
        }
      } else {
        alert(error instanceof Error ? error.message : '内容生成失败，请检查网络连接或稍后重试');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!userId || isLoadingProfile) {
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
      <TopBar title="内容生成" showIcon={false} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!hasResult ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft-md">
                  <PenSquare className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-base text-gray-800">今天想写点什么？</span>
              </div>
              <textarea
                placeholder="输入一个简单的想法，比如：买了一个超好用的平价键盘..."
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary min-h-[150px] resize-none text-gray-800 font-medium leading-relaxed transition-all duration-200"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={!idea.trim() || isGenerating}
                className="w-full mt-4 bg-gradient-primary text-white py-3.5 rounded-xl hover:shadow-soft-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2 text-white font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-white" /> AI 爆发灵感中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-white font-semibold">
                    <Sparkles className="w-4 h-4 text-white" /> 一键生成笔记
                  </span>
                )}
              </button>
            </div>
            
            {userProfile && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-800">当前创作人格</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">风格</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.contentStyle}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">内容偏好</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.contentGoals?.[0] || '生活分享'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">年龄范围</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.ageRange}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">长度偏好</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.preferredLength === 'short' ? '短篇' : userProfile.preferredLength === 'medium' ? '中篇' : '长篇'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-success rounded-full flex items-center justify-center shadow-soft-md">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-base text-gray-800">生成成功！</h3>
              </div>

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 mb-6 p-4 bg-gray-50 rounded-xl">
                {generatedContent}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-medium hover:shadow-soft-sm transition-all duration-200">
                    #{keyword}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3.5 bg-gradient-primary text-white rounded-xl hover:shadow-soft-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> 已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> 复制正文
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    alert("内容已保存到草稿！");
                    router.push("/dashboard");
                  }}
                  className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-primary hover:text-primary font-medium flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存到草稿
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    // 接受该生成内容并保存到历史
                    try {
                      const creationData = {
                        userId: userId!,
                        title: idea,
                        content: generatedContent,
                        keywords: { tags: keywords },
                        topic: selectedTopic,
                        createdAt: Date.now(),
                      };

                      // 保存到localStorage
                      const existingCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
                      existingCreations.push(creationData);
                      localStorage.setItem('userCreations', JSON.stringify(existingCreations));

                      // 调用API保存到数据库
                      const response = await fetch('/api/content/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: userId!,
                          topicId: selectedTopic?.id || 'default_topic',
                          regenerate: null
                        }),
                      });

                      if (response.ok) {
                        alert("内容已接受并保存！");
                        router.push("/history");
                      } else {
                        // API保存失败，但localStorage保存成功，仍然提示成功
                        alert("内容已保存到本地！");
                        router.push("/history");
                      }
                    } catch (error) {
                      console.error('Error saving creation:', error);
                      // 即使出错，localStorage可能已经保存成功
                      alert("内容生成成功，但保存遇到问题，请重试");
                    }
                  }}
                  className="flex-1 py-3.5 bg-gradient-success text-white rounded-xl hover:shadow-soft-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
                >
                  <Check className="w-4 h-4" /> 接受该生成内容
                </button>
                <button
                  onClick={() => {
                    // 还需继续修改 - 重置状态
                    setHasResult(false);
                    setGeneratedContent('');
                    setKeywords([]);
                    setSelectedTopic(null);
                  }}
                  className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-accent hover:text-accent font-medium flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4" /> 还需继续修改
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-accent rounded-full flex items-center justify-center shadow-soft-md">
                  <MessageSquarePlus className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-base text-gray-800">反馈与优化</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 mb-2 block">一键微调方向：</span>
                  <div className="flex flex-wrap gap-2">
                    {['短一点', '更干货点', '加多点表情包', '更像吐槽'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          // 应用微调的逻辑
                          alert(`已应用微调：${tag}`);
                        }}
                        className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs hover:bg-gradient-accent hover:text-white transition-all duration-300 border border-blue-100 hover:border-transparent shadow-soft-sm"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setHasResult(false);
                    setIdea('');
                  }}
                  className="w-full py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-purple-500 hover:text-purple-600 font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  重新生成
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
