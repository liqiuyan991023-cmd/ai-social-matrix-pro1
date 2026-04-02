import { useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Sparkles, Target, User } from 'lucide-react';
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import PersonaDisplay from "../components/onboarding/PersonaDisplay";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    ageRange: '',
    profession: '',
    interests: '',
    contentPreference: '',
    contentStyle: '',
    preferredLength: ''
  });
  
  const createProfile = async (data: any) => {
    setIsLoading(true);
    try {
      // 处理数据格式
      const processedData = {
        userId,
        ageRange: data.ageRange,
        profession: data.profession,
        interests: data.interests.split(',').map((i: string) => i.trim()),
        expertise: data.interests.split(',').map((i: string) => i.trim()), // 使用兴趣作为专长
        contentGoals: [data.contentPreference],
        contentStyle: data.contentStyle,
        preferredLength: data.preferredLength
      };
      
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create profile");
      }
      
      const result = await response.json();
      // 存储 userId 到 localStorage
      localStorage.setItem('userId', userId);
      // 不直接跳转到 dashboard，而是等待创作人格生成
      // 创作人格会通过 SWR 轮询自动获取
      return result;
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("创建画像失败，请重试");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const { data: personaData, isLoading: personaLoading } = useSWR(
    userId ? `/api/user/profile?userId=${userId}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) return null;
      return response.json();
    },
    {
      refreshInterval: 2000,
    }
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ageRange && formData.profession && formData.interests && formData.contentPreference && formData.contentStyle && formData.preferredLength) {
      createProfile(formData);
    } else {
      alert('请填写所有必填项');
    }
  };
  
  const handleRecreate = () => {
    // 重置表单
    setFormData({
      ageRange: '',
      profession: '',
      interests: '',
      contentPreference: '',
      contentStyle: '',
      preferredLength: ''
    });
    // 清除 SWR 缓存
    mutate(`/api/user/profile?userId=${userId}`, null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar title="人设诊断" showIcon={false} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!personaData?.profile ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <User className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">挖掘你的专属人设</h2>
              <p className="text-sm text-gray-600 text-center">回答几个问题，AI 为你定制小红书文风与选材方向。</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">1. 年龄范围 *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="18-25">18-25岁</option>
                      <option value="26-35">26-35岁</option>
                      <option value="36-45">36-45岁</option>
                      <option value="45+">45岁以上</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">2. 职业或主要身份 *</label>
                    <input
                      type="text"
                      placeholder="例如：互联网打工人、大二学生、新手宝妈"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">3. 平时关注的内容 *</label>
                    <input
                      type="text"
                      placeholder="例如：极简穿搭、探店、数码测评"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">4. 创作内容偏好 *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentPreference === '生活分享' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentPreference: '生活分享' })}
                      >
                        生活分享
                      </div>
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentPreference === '专业干货' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentPreference: '专业干货' })}
                      >
                        专业干货
                      </div>
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentPreference === '兴趣爱好' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentPreference: '兴趣爱好' })}
                      >
                        兴趣爱好
                      </div>
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentPreference === '职场经验' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentPreference: '职场经验' })}
                      >
                        职场经验
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">5. 表达风格 *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentStyle === '亲切自然' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentStyle: '亲切自然' })}
                      >
                        亲切自然
                      </div>
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentStyle === '专业细致' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentStyle: '专业细致' })}
                      >
                        专业细致
                      </div>
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentStyle === '幽默风趣' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentStyle: '幽默风趣' })}
                      >
                        幽默风趣
                      </div>
                      <div
                        className={`px-4 py-3 border rounded-lg text-center cursor-pointer ${formData.contentStyle === '情感共鸣' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => setFormData({ ...formData, contentStyle: '情感共鸣' })}
                      >
                        情感共鸣
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">6. 内容长度 *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.preferredLength}
                      onChange={(e) => setFormData({ ...formData, preferredLength: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="short">短篇（300-500字）</option>
                      <option value="medium">中篇（500-800字）</option>
                      <option value="long">长篇（800-1200字）</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-4 rounded-lg hover:bg-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "生成中..." : "生成专属人设"}
              </button>
            </form>
          </div>
        ) : personaLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">正在生成你的创作人格</h3>
              <p className="text-sm text-gray-600">AI正在分析你的特点，打造专属的创作风格...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">人设创建成功！</h3>
                  <p className="text-sm text-green-700 mt-1">你已经成功创建了专属的创作人格，开始你的创作之旅吧！</p>
                </div>
              </div>
            </div>
            
            <PersonaDisplay 
              persona={personaData.profile.creativePersona}
              onEdit={() => setShowConfirmDialog(true)}
            />
            
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                开始创作
              </button>
              
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full border border-red-500 text-red-500 py-3 rounded-lg hover:bg-red-50 font-medium transition-colors"
              >
                重新创建人设
              </button>
            </div>
          </div>
        )}
        
        {/* 确认对话框 */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">确认重新创建</h3>
              <p className="text-sm text-gray-600 mb-4">重新创建人设将覆盖当前的创作人格，确定要继续吗？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRecreate}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                >
                  确定
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
