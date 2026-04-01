import { useState } from "react";
import { useSWRConfig } from "swr";
import { TopicRecommendation } from "@/lib/types";

interface TopicSelectorProps {
  userId: string;
  onSelect: (topic: TopicRecommendation) => void;
  selectedTopic?: TopicRecommendation | null;
}

export default function TopicSelector({ userId, onSelect, selectedTopic }: TopicSelectorProps) {
  const [category, setCategory] = useState<string>("");
  const { mutate } = useSWRConfig();
  
  const { data, error, isLoading } = useSWR(
    \`/api/content/topics?userId=\${userId}\${category ? \`&category=\${category}\` : ""}\`,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    }
  );
  
  const handleTopicSelect = (topic: TopicRecommendation) => {
    onSelect(topic);
    localStorage.setItem("selectedTopic", JSON.stringify(topic));
  };
  
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    mutate(\`/api/content/topics?userId=\${userId}\${newCategory ? \`&category=\${newCategory}\` : ""}\`);
  };
  
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        加载选题失败，请刷新页面重试
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">选择创作选题</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">内容分类</label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="生活方式">生活方式</option>
            <option value="美食">美食</option>
            <option value="旅行">旅行</option>
            <option value="时尚">时尚</option>
            <option value="学习">学习</option>
            <option value="职场">职场</option>
          </select>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">正在分析热点话题...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.recommendations?.map((topic: TopicRecommendation) => (
              <div
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className={\`cursor-pointer rounded-lg border p-4 transition-all \${
                  selectedTopic?.id === topic.id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }\`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 flex-1">{topic.title}</h3>
                  <span className={\`ml-2 px-2 py-1 text-xs rounded-full \${
                    topic.difficulty === "easy" ? "bg-green-100 text-green-800" :
                    topic.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }\`}>
                    {topic.difficulty === "easy" ? "简单" :
                     topic.difficulty === "medium" ? "中等" : "困难"}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{topic.category}</span>
                  <span className="mx-2">•</span>
                  <span>匹配度: {topic.matchScore}%</span>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">{topic.contentAngle}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>热度: {topic.trendingScore}%</span>
                  <span>预估互动: {topic.estimatedEngagement}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedTopic && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>已选择：</strong>{selectedTopic.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
