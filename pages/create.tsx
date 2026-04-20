import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { PenSquare, Copy, Check, Sparkles, MessageSquarePlus, Loader2, User, RefreshCw } from 'lucide-react';
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

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
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadUserProfile = useCallback(async (uid: string) => {
    try {
      setIsLoadingProfile(true);
      const storedProfile = localStorage.getItem(`userProfile_${uid}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
      }

      await fetchUserProfile(uid);
    } catch (error) {
      console.error('Error loading user profile:', error);
      const storedProfile = localStorage.getItem(`userProfile_${uid}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(`/api/user/profile?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        localStorage.setItem(`userProfile_${uid}`, JSON.stringify(data.profile));
        return data.profile;
      }

      const storedProfile = localStorage.getItem(`userProfile_${uid}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
        return parsedProfile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const storedProfile = localStorage.getItem(`userProfile_${uid}`);
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

  useEffect(() => {
    if (!isMounted) return;

    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/onboarding");
      return;
    }
    setUserId(storedUserId);
    loadUserProfile(storedUserId);

    const { action, creationId, content, title } = router.query;
    if (action && content) {
      const decodedContent = decodeURIComponent(content as string);
      
      if (action === 'optimize') {
        // 重写功能：保留原来的内容，显示在生成结果界面
        setGeneratedContent(decodedContent);
        if (title) {
          const decodedTitle = decodeURIComponent(title as string);
          setGeneratedTitle(decodedTitle);
        }
        setHasResult(true);
        // 不自动生成，让用户在界面上进行修改
      } else if (action === 'feedback') {
        // 反馈功能：保留原来的内容，显示在生成结果界面
        setGeneratedContent(decodedContent);
        if (title) {
          const decodedTitle = decodeURIComponent(title as string);
          setGeneratedTitle(decodedTitle);
        }
        setHasResult(true);
        // 不自动生成，让用户在界面上进行反馈
      } else {
        // 其他操作：设置为创作想法
        setIdea(decodedContent);
      }
    }
  }, [isMounted, loadUserProfile, router]);

  const handleGenerate = async () => {
    if (!idea.trim()) {
      alert('请输入创作想法');
      return;
    }

    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) {
      alert('用户信息加载失败，请刷新页面');
      return;
    }

    setIsGenerating(true);

    try {
      let profile = userProfile;
      if (!profile) {
        profile = await fetchUserProfile(currentUserId);
      }

      if (!profile) {
        throw new Error('用户画像加载失败，请重新设置人设画像');
      }

      const storedPersona = localStorage.getItem(`creativePersona_${currentUserId}`);
      const personaData = storedPersona ? JSON.parse(storedPersona) : null;
      const personaSummary = personaData?.personaSummary || personaData?.personality || '';

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
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
                  setGeneratedTitle(generatedTitle);
                } else if (stageData.stage === 'content') {
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

      if (fullContent === undefined || fullContent === null) {
        throw new Error('内容生成失败，请重试');
      }

      setHasResult(true);

    } catch (error) {
      console.error('Content generation error:', error);

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
    alert('已复制到剪贴板，快去发布吧～');
  };

  const handleRegenerate = async (feedback: string | string[]) => {
    if (!generatedContent) {
      alert('没有可优化的内容');
      return;
    }

    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) {
      alert('用户信息加载失败，请刷新页面');
      return;
    }

    setIsGenerating(true);
    try {
      const storedPersona = localStorage.getItem(`creativePersona_${currentUserId}`);
      const personaData = storedPersona ? JSON.parse(storedPersona) : null;
      const personaSummary = personaData?.personaSummary || personaData?.personality || '';

      const regenerateFeedback = Array.isArray(feedback)
        ? feedback.join('，')
        : feedback;

      const optimizationPrompt = `基于以下内容进行优化：\n\n${generatedContent}\n\n优化要求：${regenerateFeedback}\n\n请根据优化要求调整内容，保持原有风格但改进表达方式。`;

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
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
                  setGeneratedTitle(generatedTitle);
                } else if (stageData.stage === 'content') {
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

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                  <PenSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-gray-800">今天想写点什么？</span>
              </div>
              <textarea
                placeholder="输入一个简单的想法，比如：买了一个超好用的平价键盘..."
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 focus:border-red-500 min-h-[150px] resize-none text-gray-800 font-medium leading-relaxed transition-all duration-200"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={!idea.trim() || isGenerating}
                className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3.5 rounded-xl hover:shadow-lg font-medium disabled:bg-red-300 disabled:text-white disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-md"
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
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-base text-gray-800">你的表达助手</h3>
                </div>

                <div className="mb-4">
                  <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow duration-300">
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
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <span className="text-gray-500 block mb-1">语气</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.contentStyle || '自然随性'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <span className="text-gray-500 block mb-1">偏好</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.contentGoals?.[0] || '生活分享'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <span className="text-gray-500 block mb-1">句长</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.preferredLength === 'short' ? '短句' : userProfile.preferredLength === 'medium' ? '中句' : '长句'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <span className="text-gray-500 block mb-1">身份</span>
                    <span className="font-medium text-gray-800 text-sm">{userProfile.profession || '创作者'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-gray-800">生成成功！</h3>
              </div>

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 mb-6 p-4 bg-gray-50 rounded-xl max-h-96 overflow-y-auto break-words border border-gray-100">
                {generatedContent}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-medium hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
                    #{keyword}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-all duration-300 rounded-lg hover:shadow-md transform hover:-translate-y-0.5"
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
                    if (saved) return;
                    const currentUserId = localStorage.getItem("userId");
                    if (!currentUserId) {
                      alert('用户信息加载失败，请刷新页面');
                      return;
                    }

                    try {
                      const creationData = {
                        id: `creation_${Date.now()}`,
                        userId: currentUserId,
                        title: generatedTitle || idea,
                        content: generatedContent,
                        keywords: { tags: keywords },
                        topic: selectedTopic || { category: '生活方式' },
                        createdAt: Date.now(),
                      };

                      const existingCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
                      existingCreations.push(creationData);
                      localStorage.setItem('userCreations', JSON.stringify(existingCreations));

                      const response = await fetch('/api/content/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: currentUserId,
                          topicId: selectedTopic?.id || 'default_topic',
                          regenerate: null
                        }),
                      });

                      setSaved(true);
                      alert('已保存到你的创作时间轴啦');
                    } catch (error) {
                      console.error('Error saving creation:', error);
                      alert("内容生成成功，但保存遇到问题，请重试");
                    }
                  }}
                  className={`flex-1 py-3.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${saved ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg'}`}
                >
                  <Check className="w-4 h-4" /> {saved ? '已保存' : '保存到历史'}
                </button>
                <button
                  onClick={() => {
                    setHasResult(false);
                    setGeneratedContent('');
                    setKeywords([]);
                    setSelectedTopic(null);
                    setSaved(false);
                  }}
                  className="flex-1 py-3.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-all duration-300 rounded-lg hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-4 h-4" /> 重新编辑
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                  <MessageSquarePlus className="w-5 h-5 text-white" />
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
                          setSelectedOptimizations(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border shadow-sm ${selectedOptimizations.includes(tag)
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md transform scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={customFeedback}
                      onChange={(e) => setCustomFeedback(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const optimizations = [...selectedOptimizations];
                      if (customFeedback.trim()) {
                        optimizations.push(customFeedback.trim());
                      }
                      if (optimizations.length === 0) {
                        alert('请选择微调方向或输入优化建议');
                        return;
                      }
                      await handleRegenerate(optimizations);
                      setSelectedOptimizations([]);
                      setCustomFeedback('');
                      alert('优化完成，看看是不是更合心意啦～');
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg font-medium text-sm transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    应用优化 ({selectedOptimizations.length + (customFeedback.trim() ? 1 : 0)})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOptimizations([]);
                      setCustomFeedback('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-all duration-300 rounded-lg hover:shadow-md"
                  >
                    清空
                  </button>
                </div>

                <button
                  onClick={() => {
                    setHasResult(false);
                    setIdea('');
                    setGeneratedContent('');
                    setKeywords([]);
                    setSelectedTopic(null);
                    setSelectedOptimizations([]);
                    setCustomFeedback('');
                    setSaved(false);
                    alert('写下你的新想法吧～');
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 shadow-md"
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
