import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PenSquare, Copy, Check, Sparkles, MessageSquarePlus, ArrowLeft, Loader2, User } from 'lucide-react';
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
    if (!idea.trim()) return;
    setIsGenerating(true);
    
    try {
      // 生成或获取主题
      if (!selectedTopic && userProfile) {
        // 基于用户输入的想法生成主题
        const topics = await topicService.generateRecommendations(userProfile);
        if (topics && topics.length > 0) {
          setSelectedTopic(topics[0]);
        } else {
          // 如果没有生成主题，使用默认主题
          setSelectedTopic({
            id: 'default_topic',
            title: idea,
            contentAngle: `关于${idea}的分享`,
            category: '生活方式'
          });
        }
      }
      
      if (!userProfile || !selectedTopic) {
        throw new Error('缺少必要的用户信息或主题');
      }
      
      // 生成标题
      const titles = await contentService.generateTitle(userProfile, selectedTopic);
      const selectedTitle = titles[0];
      
      // 生成内容
      const content = await contentService.generateContent(userProfile, selectedTopic, selectedTitle);
      
      // 生成关键词
      const keywordsData = await contentService.generateKeywords(userProfile, selectedTopic, selectedTitle, content);
      const tags = keywordsData.tags || [];
      
      setGeneratedContent(content);
      setKeywords(tags);
      setHasResult(true);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('内容生成失败，请重试');
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
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar title="内容生成" showIcon={false} />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!hasResult ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <PenSquare className="w-4 h-4 text-red-500" />
                </div>
                <span className="font-semibold text-sm text-gray-800">今天想写点什么？</span>
              </div>
              <textarea 
                placeholder="输入一个简单的想法，比如：买了一个超好用的平价键盘..."
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[150px] resize-none text-gray-700"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={!idea.trim() || isGenerating}
                className="w-full mt-4 bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 rounded-lg hover:from-red-600 hover:to-rose-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-200"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI 爆发灵感中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> 一键生成笔记
                  </span>
                )}
              </button>
            </div>
            
            {userProfile && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-800">当前创作人格</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <span className="text-gray-500 block mb-1">风格</span>
                    <span className="font-medium text-gray-800">{userProfile.contentStyle}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <span className="text-gray-500 block mb-1">内容偏好</span>
                    <span className="font-medium text-gray-800">{userProfile.contentGoals?.[0] || '生活分享'}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <span className="text-gray-500 block mb-1">年龄范围</span>
                    <span className="font-medium text-gray-800">{userProfile.ageRange}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <span className="text-gray-500 block mb-1">长度偏好</span>
                    <span className="font-medium text-gray-800">{userProfile.preferredLength === 'short' ? '短篇' : userProfile.preferredLength === 'medium' ? '中篇' : '长篇'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-800">生成成功！</h3>
              </div>
              
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 mb-6 p-4 bg-gray-50 rounded-lg">
                {generatedContent}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                    #{keyword}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 font-medium flex items-center justify-center gap-2 shadow-sm shadow-red-200"
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
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存到草稿
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-800">反馈与优化</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 mb-2 block">一键微调方向：</span>
                  <div className="flex flex-wrap gap-2">
                    {['短一点', '更干货点', '加多点表情包', '更像吐槽'].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors border border-blue-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setHasResult(false);
                    setIdea('');
                  }}
                  className="w-full py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
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
