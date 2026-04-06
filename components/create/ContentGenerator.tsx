import { useState, useEffect } from "react";
import { TopicRecommendation } from "../../lib/types/index";

interface ContentGeneratorProps {
  userId: string;
  topic: TopicRecommendation;
  onComplete?: (creation: any) => void;
}

interface GenerationStage {
  stage: "title" | "content" | "keywords" | "complete";
  content: any;
}

export default function ContentGenerator({ userId, topic, onComplete }: ContentGeneratorProps) {
  const [generationStage, setGenerationStage] = useState<GenerationStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (topic && !isGenerating) {
      generateContent();
    }
  }, [topic]);

  const generateContent = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // 获取创作人格总结
      const storedPersona = localStorage.getItem(`creativePersona_${userId}`);
      const personaData = storedPersona ? JSON.parse(storedPersona) : null;
      const personaSummary = personaData?.personaSummary || personaData?.personality || '';

      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          topicId: topic.id,
          regenerate: null,
          userInput: topic.title || '创作内容',
          personaSummary: personaSummary
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsGenerating(false);
              return;
            }

            try {
              const stageData = JSON.parse(data);
              setGenerationStage(stageData);

              if (stageData.stage === "complete") {
                setIsGenerating(false);
                onComplete?.(stageData.content);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "生成失败");
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (feedback: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          topicId: topic.id,
          regenerate: feedback
        }),
      });

      // ... 类似的SSE处理逻辑
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新生成失败");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">生成失败：{error}</p>
          <button
            onClick={() => generateContent()}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            重新生成
          </button>
        </div>
      )}

      {!generationStage && !error && (
        <div className="text-center py-8 text-gray-500">
          准备生成内容...
        </div>
      )}

      {generationStage?.stage === "title" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <h2 className="text-xl font-bold">生成标题中...</h2>
          </div>

          {generationStage.content ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">生成标题</h3>
              <p className="text-lg text-gray-800">{generationStage.content}</p>
            </div>
          ) : (
            <div className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
          )}
        </div>
      )}

      {generationStage?.stage === "content" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <h2 className="text-xl font-bold">生成正文内容...</h2>
          </div>

          {generationStage.content ? (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">笔记正文</h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {generationStage.content}
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="bg-gray-200 rounded h-4"></div>
              <div className="bg-gray-200 rounded h-4 w-5/6"></div>
              <div className="bg-gray-200 rounded h-4 w-4/6"></div>
            </div>
          )}
        </div>
      )}

      {generationStage?.stage === "keywords" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <h2 className="text-xl font-bold">生成关键词...</h2>
          </div>

          {generationStage.content && Object.keys(generationStage.content).length > 0 ? (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">话题关键词</h3>
                <div className="flex flex-wrap gap-2">
                  {generationStage.content.topic.map((keyword: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">搜索关键词</h3>
                <div className="flex flex-wrap gap-2">
                  {generationStage.content.search.map((keyword: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">标签关键词</h3>
                <div className="flex flex-wrap gap-2">
                  {generationStage.content.tags.map((keyword: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
          )}
        </div>
      )}

      {generationStage?.stage === "complete" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600">内容生成完成！</h2>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">最终标题</h3>
              <p className="text-lg text-gray-800">{generationStage.content.title}</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">笔记内容</h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {generationStage.content.content}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">关键词标签</h3>
              <div className="flex flex-wrap gap-2">
                {generationStage.content.keywords.tags.map((tag: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  const text = `${generationStage.content.title}\n\n${generationStage.content.content}\n\n${generationStage.content.keywords.tags.map((t: string) => `#${t}`).join(" ")}`;
                  navigator.clipboard.writeText(text);
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
              >
                一键复制笔记
              </button>

              <button
                onClick={() => handleRegenerate("")}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
              >
                重新生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}