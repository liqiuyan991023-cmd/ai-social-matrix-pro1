import { useState } from 'react';

interface FeedbackPanelProps {
  userId: string;
  creationId: string;
  onFeedbackSubmit?: (feedback: any) => void;
}

const presetOptions = [
  { id: 'title', label: '标题不够吸引人', value: '标题缺乏吸引力，需要更有点击欲望' },
  { id: 'content', label: '内容缺乏具体细节', value: '内容比较空泛，需要更多具体例子或数据' },
  { id: 'length', label: '内容长度不合适', value: '内容长度不符合预期，需要调整' },
  { id: 'style', label: '表达风格不匹配', value: '表达风格与个人风格不符' },
  { id: 'practical', label: '缺乏实用价值', value: '内容缺乏实用性和可操作性' },
  { id: 'structure', label: '结构不够清晰', value: '内容结构混乱，需要更好的逻辑组织' },
  { id: 'emotion', label: '情感表达不足', value: '内容缺乏情感共鸣，需要更有温度' },
  { id: 'keywords', label: '关键词不准确', value: '生成的关键词不够精准或有遗漏' },
];

export default function FeedbackPanel({ userId, creationId, onFeedbackSubmit }: FeedbackPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  const handlePresetChange = (optionId: string) => {
    setSelectedPreset(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSubmitFeedback = async () => {
    if (selectedPreset.length === 0 && !customFeedback.trim()) {
      alert('请选择至少一项预设反馈或填写自定义反馈');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          creationId,
          feedbackType: customFeedback.trim() ? 'custom' : 'preset',
          presetFeedback: selectedPreset.length > 0
            ? selectedPreset.map(id => presetOptions.find(opt => opt.id === id)?.value || '')
            : undefined,
          customFeedback: customFeedback.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();
      setSuggestions(result.feedback.improvements);
      setShowSuggestions(true);
      onFeedbackSubmit?.(result.feedback);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('提交反馈失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    console.log('Applying suggestion:', suggestion);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">反馈与优化</h2>

      {!showSuggestions ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              请选择需要改进的方面（可多选）
            </label>
            <div className="space-y-2">
              {presetOptions.map(option => (
                <label
                  key={option.id}
                  className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPreset.includes(option.id)}
                    onChange={() => handlePresetChange(option.id)}
                    className="mr-3 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              或者填写自定义反馈
            </label>
            <textarea
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="请详细描述您希望如何改进内容..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
          </div>

          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '分析中...' : '提交反馈并获取优化建议'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✓ 反馈提交成功！</h3>
            <p className="text-green-700 text-sm">
              根据您的反馈，AI已经生成了具体的优化建议：
            </p>
          </div>

          {suggestions?.promptAdjustments && suggestions.promptAdjustments.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Prompt调整建议</h3>
              <div className="space-y-2">
                {suggestions.promptAdjustments.map((adjustment: string, index: number) => (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 rounded-md p-3 flex justify-between items-center"
                  >
                    <span className="text-sm text-blue-800">{adjustment}</span>
                    <button
                      onClick={() => handleApplySuggestion(adjustment)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      应用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions?.styleAdjustments && suggestions.styleAdjustments.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">风格调整建议</h3>
              <div className="space-y-2">
                {suggestions.styleAdjustments.map((adjustment: string, index: number) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-200 rounded-md p-3 flex justify-between items-center"
                  >
                    <span className="text-sm text-purple-800">{adjustment}</span>
                    <button
                      onClick={() => handleApplySuggestion(adjustment)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      应用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">后续操作</h3>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
              >
                重新生成内容
              </button>

              <button
                onClick={() => {
                  setShowSuggestions(false);
                  setSelectedPreset([]);
                  setCustomFeedback('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
              >
                返回修改反馈
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
