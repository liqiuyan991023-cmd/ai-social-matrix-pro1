import { useState } from "react";

interface CreationHistoryProps {
  creations: any[];
  isLoading: boolean;
  onSelectCreation?: (creation: any) => void;
}

export default function CreationHistory({ creations, isLoading, onSelectCreation }: CreationHistoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(creations.map(c => c.topic.category)))];
  const filteredCreations = selectedCategory === "all"
    ? creations
    : creations.filter(c => c.topic.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">创作历史</h2>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === "all" ? "全部分类" : category}
            </option>
          ))}
        </select>
      </div>

      {filteredCreations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>还没有创作记录</p>
          <button
            onClick={() => window.location.href = '/create'}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            开始第一次创作 →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCreations.map(creation => (
            <div
              key={creation.id}
              onClick={() => onSelectCreation?.(creation)}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex-1">{creation.title}</h3>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {creation.topic.category}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {creation.content}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{new Date(creation.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex gap-2">
                  {creation.keywords.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span key={index} className="text-blue-500">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}