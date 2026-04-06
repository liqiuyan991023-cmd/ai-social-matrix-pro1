interface PersonaDisplayProps {
  persona: any;
  onEdit?: () => void;
}

export default function PersonaDisplay({ persona, onEdit }: PersonaDisplayProps) {
  // 尝试从不同的数据结构中获取创作人格信息
  const creativePersona = persona?.creativePersona || persona || {};
  const personaSummary = creativePersona.personaSummary || creativePersona.personality || 'AI正在分析你的特点，打造专属的创作风格...';

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-gray-800">你的创作人格画像</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-red-500 hover:text-red-600 text-sm font-medium"
          >
            编辑
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* AI创作人格总结 - 支持滚动和自动换行 */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">AI创作人格总结</h3>
          <div className="max-h-48 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {personaSummary}
          </div>
        </div>

        {/* 只保留创作人格相关字段，移除性格特点等冗余信息 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-500 mb-1">创作风格</h4>
          <div className="max-h-32 overflow-y-auto text-sm text-gray-700 leading-relaxed break-words">
            {creativePersona.contentStyle || '亲切自然'}
          </div>
        </div>
      </div>
    </div>
  );
}
