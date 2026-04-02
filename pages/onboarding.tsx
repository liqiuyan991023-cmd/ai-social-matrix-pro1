import { useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
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
      router.push("/dashboard");
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {!personaData?.profile ? (
          <Questionnaire onSubmit={createProfile} isLoading={isLoading} />
        ) : personaLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">正在生成你的创作人格...</p>
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
