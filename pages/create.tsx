import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PenSquare, Copy, Check, Sparkles, MessageSquarePlus, ArrowLeft } from 'lucide-react';
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
  const [keywords, setKeywords] = useState<string[]>([]);

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
      // 构建包含人设信息的 prompt
      let prompt = `基于以下创作者人设，为小红书平台生成一篇关于"${idea}"的笔记：\n`;
      
      if (userProfile) {
        prompt += `\n创作者人设：\n`;
        prompt += `年龄范围：${userProfile.ageRange}\n`;
        prompt += `职业：${userProfile.profession}\n`;
        prompt += `兴趣：${userProfile.interests.join('、')}\n`;
        prompt += `创作风格：${userProfile.contentStyle}\n`;
        prompt += `内容长度偏好：${userProfile.preferredLength === 'short' ? '短篇（300-500字）' : userProfile.preferredLength === 'medium' ? '中篇（500-800字）' : '长篇（800-1200字）'}\n`;
      }
      
      prompt += `\n要求：\n`;
      prompt += `1. 符合小红书平台的内容风格和格式\n`;
      prompt += `2. 语言生动有趣，有个人特色\n`;
      prompt += `3. 包含相关的话题标签\n`;
      prompt += `4. 内容结构清晰，有吸引力\n`;
      
      console.log('生成内容的 prompt:', prompt);
      
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟生成的内容
      const mockContent = `这绝对是打工人必备的桌面好物！😭

平时天天对着电脑，颈椎真的受不了！最近入手了这几个小物件，幸福感直接拉满⬆️
1️⃣ 屏幕增高架：不仅拯救了我的脖子，底下还能收纳键盘，桌面瞬间清爽！
2️⃣ 无线磁吸充电座：告别一团乱麻的线，放上去就充电，超省心～
3️⃣ 护眼挂灯：晚上加班（虽然不想）光线超舒服，不反光！

你们桌面上有什么离不开的宝藏好物吗？评论区抄作业啦！👇

#打工人日常 #桌面改造 #好物分享 #提升幸福感`;
      
      const mockKeywords = ['打工人日常', '桌面改造', '好物分享', '提升幸福感'];
      
      setGeneratedContent(mockContent);
      setKeywords(mockKeywords);
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
                <PenSquare className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-sm">今天想写点什么？</span>
              </div>
              <textarea 
                placeholder="输入一个简单的想法，比如：买了一个超好用的平价键盘..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] resize-none"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={!idea.trim() || isGenerating}
                className="w-full mt-4 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> AI 爆发灵感中...
                  </span>
                ) : '一键生成笔记'}
              </button>
            </div>
            
            {userProfile && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">当前创作人格</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>风格：{userProfile.contentStyle}</p>
                  <p>内容偏好：{userProfile.contentGoals?.[0] || '生活分享'}</p>
                  <p>长度偏好：{userProfile.preferredLength === 'short' ? '短篇' : userProfile.preferredLength === 'medium' ? '中篇' : '长篇'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 mb-6">
                {generatedContent}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs">
                    #{keyword}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制正文'}
                </button>
                <button 
                  onClick={() => {
                    alert("内容已保存到草稿！");
                    router.push("/dashboard");
                  }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  保存到草稿
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg mb-4">反馈与优化</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 mb-2 block">一键微调方向：</span>
                  <div className="flex flex-wrap gap-2">
                    {['短一点', '更干货点', '加多点表情包', '更像吐槽'].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200">
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
                  className="w-full py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
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
