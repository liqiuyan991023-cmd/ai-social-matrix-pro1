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
  const [formData, setFormData] = useState({
    profession: '',
    interests: '',
    impression: ''
  });
  
  const createProfile = async (data: any) => {
    setIsLoading(true);
    try {
      // 处理数据格式
      const processedData = {
        userId,
        ageRange: '21-30', // 默认值
        profession: data.profession,
        interests: data.interests.split(',').map((i: string) => i.trim()),
        expertise: data.interests.split(',').map((i: string) => i.trim()), // 使用兴趣作为专长
        contentGoals: ['分享生活', '记录成长'], // 默认值
        contentStyle: data.impression === '真诚分享' ? '亲切自然' : 
                      data.impression === '专业干货' ? '专业细致' : 
                      data.impression === '幽默吐槽' ? '幽默风趣' : '情感共鸣',
        preferredLength: 'medium' // 默认值
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
    if (formData.profession && formData.interests && formData.impression) {
      createProfile(formData);
    } else {
      alert('请填写所有必填项');
    }
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
              <p className="text-sm text-gray-600 text-center">只需3个问题，AI 为你定制小红书文风与选材方向。</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">1. 你目前的职业或主要身份是？</label>
                    <input
                      type="text"
                      placeholder="例如：互联网打工人、大二学生、新手宝妈"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">2. 你平时喜欢关注/消费的内容？</label>
                    <input
                      type="text"
                      placeholder="例如：极简穿搭、探店、数码测评"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">3. 你希望给读者留下什么印象？</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className={`px-4 py-3 border rounded-lg text-center ${formData.impression === '真诚分享' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300'}`}
                        onClick={() => setFormData({ ...formData, impression: '真诚分享' })}
                      >
                        真诚分享
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border rounded-lg text-center ${formData.impression === '专业干货' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300'}`}
                        onClick={() => setFormData({ ...formData, impression: '专业干货' })}
                      >
                        专业干货
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border rounded-lg text-center ${formData.impression === '幽默吐槽' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300'}`}
                        onClick={() => setFormData({ ...formData, impression: '幽默吐槽' })}
                      >
                        幽默吐槽
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border rounded-lg text-center ${formData.impression === '情绪共鸣' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-300'}`}
                        onClick={() => setFormData({ ...formData, impression: '情绪共鸣' })}
                      >
                        情绪共鸣
                      </button>
                    </div>
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
            <PersonaDisplay 
              persona={personaData.profile.creativePersona}
              onEdit={() => router.push("/dashboard")}
            />
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-medium transition-colors"
            >
              开始创作
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
