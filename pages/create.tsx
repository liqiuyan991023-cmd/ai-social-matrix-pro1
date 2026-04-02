import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { PenSquare, Copy, Image as ImageIcon, KeyRound, Check, Sparkles, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import TopBar from "../components/TopBar";
import TopicSelector from "../components/create/TopicSelector";
import ContentGenerator from "../components/create/ContentGenerator";
import FeedbackPanel from "../components/create/FeedbackPanel";
import { TopicRecommendation } from "../lib/types";

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicRecommendation | null>(null);
  const [generatedCreation, setGeneratedCreation] = useState<any | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/onboarding");
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  const handleCopy = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

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
    <div className="min-h-screen bg-gray-50">
      <TopBar 
        title={!selectedTopic ? "选择选题" : generatedCreation ? "反馈优化" : "生成内容"}
        showBackButton={selectedTopic !== null}
        onBack={() => {
          if (generatedCreation) {
            setGeneratedCreation(null);
          } else if (selectedTopic) {
            setSelectedTopic(null);
          }
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative overflow-hidden mb-6">
              <div className="flex items-center gap-2 mb-4">
                <PenSquare className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-lg">生成结果</h3>
              </div>
              
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 mb-8">
                {generatedCreation.content}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {generatedCreation.keywords?.tags?.map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleCopy(generatedCreation.content, 'copy')}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  {copiedTab === 'copy' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedTab === 'copy' ? '已复制' : '复制正文'}
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
            
            <FeedbackPanel
              userId={userId}
              creationId={generatedCreation.id}
              onFeedbackSubmit={(feedback) => {
                console.log("Feedback submitted:", feedback);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
