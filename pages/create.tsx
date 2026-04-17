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
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // 创建服务实例
  // const contentService = new ContentGenerationService(); // 未使用，暂时注释
  // const topicService = new TopicRecommendationService(); // 未使用，暂时注释

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/onboarding");
      return;
    }
    setUserId(storedUserId);
    // 同时从localStorage和API获取用户画像，确保加载成功
    loadUserProfile(storedUserId);
  }, [router, isMounted]);

  const loadUserProfile = async (userId: string) => {
    if (typeof window === 'undefined') return;

    try {
      setIsLoadingProfile(true);
      // 首先尝试从localStorage获取
      const storedProfile = localStorage.getItem(`userProfile_${userId}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
      }

      // 同时调用API获取最新数据
      await fetchUserProfile(userId);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // 即使出错，也尝试从localStorage获取作为备用
      const storedProfile = localStorage.getItem(`userProfile_${userId}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (typeof window === 'undefined') return null;

    try {
      setIsLoadingProfile(true);
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        // 保存到localStorage作为备份
        localStorage.setItem(`userProfile_${userId}`, JSON.stringify(data.profile));
        return data.profile;
      }

      // API失败时，尝试从localStorage获取
      const storedProfile = localStorage.getItem(`userProfile_${userId}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
        return parsedProfile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // 网络错误时，尝试从localStorage获取
      const storedProfile = localStorage.getItem(`userProfile_${userId}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
        return parsedProfile;
      }
      return null;
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
      let profile = userProfile;
      if (!profile) {
        profile = await fetchUserProfile(userId);
      }

      if (!profile) {
        throw new Error('用户画像加载失败，请重新设置人设画像');
      }

      // 获取创作人格总结
      const storedPersona = localStorage.getItem(`creativePersona_${userId}`);
      const personaData = storedPersona ? JSON.parse(storedPersona) : null;
      const personaSummary = personaData?.personaSummary || personaData?.personality || '';

      // 调用API生成内容
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          topicId: 'default_topic',
          idea: idea,
          userInput: idea,
          personaSummary: personaSummary
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
                // 只有当stageData.content不为空时才更新fullContent
                if (stageData.content) {
                  fullContent = stageData.content;
                  setGeneratedContent(fullContent);
                }
              } else if (stageData.stage === 'keywords') {
                setKeywords(stageData.content?.tags || []);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // 检查fullContent是否为undefined或null，允许空字符串
      if (fullContent === undefined || fullContent === null) {
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

  // 重新生成内容，基于反馈优化
  const handleRegenerate = async (feedback: string | string[]) => {
    if (!generatedContent) {
      alert('没有可优化的内容');
      return;
    }

    setIsGenerating(true);
    try {
      const storedPersona = localStorage.getItem(`creativePersona_${userId}`);
      const personaData = storedPersona ? JSON.parse(storedPersona) : null;
      const personaSummary = personaData?.personaSummary || personaData?.personality || '';

      // 处理feedback参数，可以是字符串或字符串数组
      const regenerateFeedback = Array.isArray(feedback)
        ? feedback.join('，')
        : feedback;

      // 构建优化后的prompt，包含原有内容和新反馈
      const optimizationPrompt = `基于以下内容进行优化：\n\n${generatedContent}\n\n优化要求：${regenerateFeedback}\n\n请根据优化要求调整内容，保持原有风格但改进表达方式。`;

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          topicId: 'default_topic',
          idea: idea,
          userInput: optimizationPrompt,
          personaSummary: personaSummary,
          regenerate: regenerateFeedback
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '内容重新生成失败，请重试');
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
                // 只有当stageData.content不为空时才更新fullContent
                if (stageData.content) {
                  fullContent = stageData.content;
                  setGeneratedContent(fullContent);
                }
              } else if (stageData.stage === 'keywords') {
                setKeywords(stageData.content?.tags || []);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // 检查fullContent是否为undefined或null，允许空字符串
      if (fullContent === undefined || fullContent === null) {
        throw new Error('内容重新生成失败，请重试');
      }

      setHasResult(true);

    } catch (error) {
      console.error('Regeneration error:', error);
      alert(error instanceof Error ? error.message : '内容重新生成失败，请检查网络连接或稍后重试');
    } finally {
      setIsGenerating(false);
    }
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
                className="w-full mt-4 bg-red-500 text-white py-3.5 rounded-xl hover:shadow-soft-lg font-medium disabled:bg-red-300 disabled:text-white disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
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
                  <h3 className="font-semibold text-sm text-gray-800">你的表达助手</h3>
                </div>

                {/* 显示完整的表达助手描述 */}
                <div className="mb-4">
                  <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-2 text-xs">目前我对你的了解</span>
                    <div className="text-sm text-gray-800 leading-relaxed">
                      {(() => {
                        try {
                          const storedPersona = localStorage.getItem(`creativePersona_${userId}`);
                          if (storedPersona) {
                            const personaData = JSON.parse(storedPersona);
                            if (personaData.personaSummary) {
                              return personaData.personaSummary;
                            }
                            if (personaData.personality) {
                              return personaData.personality;
                            }
                          }
                          if (userProfile) {
                            return `你喜欢用${userProfile.contentStyle || '自然随性'}的语气分享日常，句子偏${userProfile.preferredLength === 'short' ? '简短' : userProfile.preferredLength === 'medium' ? '中等长度' : '较长'}，不喜欢夸张的表达。`;
                          }
                          return '我会按你的习惯帮你润色，也可以随时告诉我你的新想法～';
                        } catch (error) {
                          console.error('Error loading creative persona:', error);
                          if (userProfile) {
                            return `你喜欢用${userProfile.contentStyle || '自然随性'}的语气分享日常，句子偏${userProfile.preferredLength === 'short' ? '简短' : userProfile.preferredLength === 'medium' ? '中等长度' : '较长'}，不喜欢夸张的表达。`;
                          }
                          return '我会按你的习惯帮你润色，也可以随时告诉我你的新想法～';
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">语气</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.contentStyle || '自然随性'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">偏好</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.contentGoals?.[0] || '生活分享'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">句长</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.preferredLength === 'short' ? '短句' : userProfile.preferredLength === 'medium' ? '中句' : '长句'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-soft-sm">
                    <span className="text-gray-500 block mb-1">身份</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.profession || '创作者'}</span>
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

              {/* 修复内容截断问题：添加CSS支持滚动、自动换行 */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 mb-6 p-4 bg-gray-50 rounded-xl max-h-96 overflow-y-auto break-words">
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
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2 transition-all duration-300"
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
                  onClick={async () => {
                    try {
                      const creationData = {
                        id: `creation_${Date.now()}`,
                        userId: userId!,
                        title: idea,
                        content: generatedContent,
                        keywords: { tags: keywords },
                        topic: selectedTopic || { category: '生活方式' },
                        createdAt: Date.now(),
                      };

                      // 保存到localStorage
                      const existingCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
                      existingCreations.push(creationData);
                      localStorage.setItem('userCreations', JSON.stringify(existingCreations));

                      alert("内容已保存到草稿！");
                      router.push("/dashboard");
                    } catch (error) {
                      console.error('Error saving to draft:', error);
                      alert('保存草稿失败，请重试');
                    }
                  }}
                  className="flex-1 py-3.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-all duration-300"
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
                        id: `creation_${Date.now()}`,
                        userId: userId!,
                        title: idea,
                        content: generatedContent,
                        keywords: { tags: keywords },
                        topic: selectedTopic || { category: '生活方式' },
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
                  className="flex-1 py-3.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition-all duration-300"
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
                  className="flex-1 py-3.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-all duration-300"
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
                          // 切换选中状态
                          setSelectedOptimizations(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border shadow-soft-sm ${
                          selectedOptimizations.includes(tag)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 mb-2 block">自定义反馈：</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入您的优化建议..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={customFeedback}
                      onChange={(e) => setCustomFeedback(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      // 合并处理：选中优化 + 自定义反馈
                      const optimizations = [...selectedOptimizations];
                      if (customFeedback.trim()) {
                        optimizations.push(customFeedback.trim());
                      }
                      if (optimizations.length > 0) {
                        await handleRegenerate(optimizations);
                        setSelectedOptimizations([]);
                        setCustomFeedback('');
                      }
                    }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all duration-300"
                  >
                    应用优化 ({selectedOptimizations.length + (customFeedback.trim() ? 1 : 0)})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOptimizations([]);
                      setCustomFeedback('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-all duration-300"
                  >
                    清空
                  </button>
                </div>

                <button
                  onClick={() => {
                    setHasResult(false);
                    setIdea('');
                  }}
                  className="w-full py-3.5 bg-red-500 text-white rounded-xl hover:shadow-soft-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
                >
                  <Sparkles className="w-4 h-4" />
                  重新创建
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
