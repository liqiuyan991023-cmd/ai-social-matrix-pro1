import { useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Sparkles, Target } from 'lucide-react';
import TopBar from "../components/TopBar";
import Questionnaire from "../components/onboarding/Questionnaire";
import PersonaDisplay from "../components/onboarding/PersonaDisplay";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(false);
  
  const createProfile = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="创作人格设置" showIcon={true} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!personaData?.profile ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary to-rose-500 border-none text-white shadow-lg shadow-primary/20 rounded-xl p-5">
              <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm mb-3">
                <Target className="w-3 h-3" />
                <span>核心定位</span>
              </div>
              <h3 className="font-semibold text-lg leading-tight mb-2">创建你的专属创作人格</h3>
              <p className="text-sm text-white/80">花2分钟回答几个问题，AI将为你定制独特的创作风格</p>
            </div>
            
            <Questionnaire onSubmit={createProfile} isLoading={isLoading} />
          </div>
        ) : personaLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">正在生成你的创作人格</h3>
              <p className="text-sm text-gray-600">AI正在分析你的特点，打造专属的创作风格...</p>
            </div>
          </div>
        ) : (
          <PersonaDisplay 
            persona={personaData.profile.creativePersona}
            onEdit={() => router.push("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
