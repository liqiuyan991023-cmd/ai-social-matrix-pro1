import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "swr";
import TopicSelector from "@/components/create/TopicSelector";
import ContentGenerator from "@/components/create/ContentGenerator";
import FeedbackPanel from "@/components/create/FeedbackPanel";
import { TopicRecommendation } from "@/lib/types";

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicRecommendation | null>(null);
  const [generatedCreation, setGeneratedCreation] = useState<any | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/onboarding");
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                !selectedTopic ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {!selectedTopic ? '1' : '✓'}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                !selectedTopic ? 'text-blue-600' : 'text-gray-500'
              }`}>选择选题</span>
            </div>

            <div className="w-16 h-0.5 bg-gray-300"></div>

            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                !generatedCreation ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {!generatedCreation ? '2' : '✓'}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                !generatedCreation ? 'text-blue-600' : 'text-gray-500'
              }`}>生成内容</span>
            </div>

            <div className="w-16 h-0.5 bg-gray-300"></div>

            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                generatedCreation ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${
                generatedCreation ? 'text-blue-600' : 'text-gray-500'
              }`}>反馈优化</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!selectedTopic && (
            <TopicSelector
              userId={userId}
              onSelect={setSelectedTopic}
              selectedTopic={selectedTopic}
            />
          )}

          {selectedTopic && !generatedCreation && (
            <ContentGenerator
              userId={userId}
              topic={selectedTopic}
              onComplete={setGeneratedCreation}
            />
          )}

          {generatedCreation && (
            <FeedbackPanel
              userId={userId}
              creationId={generatedCreation.id}
              onFeedbackSubmit={(feedback) => {
                console.log("Feedback submitted:", feedback);
              }}
            />
          )}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          {selectedTopic && (
            <button
              onClick={() => {
                setSelectedTopic(null);
                setGeneratedCreation(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              返回选题
            </button>
          )}

          {generatedCreation && (
            <button
              onClick={() => {
                alert("内容已保存到草稿！");
                router.push("/dashboard");
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              保存到草稿
            </button>
          )}
        </div>
      </div>
    </div>
  );
}