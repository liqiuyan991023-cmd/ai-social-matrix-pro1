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
        <h2 className="text-xl font-bold text-gray-800">你的表达风格画像</h2>
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
        {/* 表达风格总结 - 支持滚动和自动换行 */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">表达风格总结</h3>
          <div className="max-h-48 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {personaSummary}
          </div>
        </div>

        {/* 表达风格维度展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">表达习惯</h4>
            <p className="text-sm text-gray-700 break-words">{creativePersona.contentStyle || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">创作偏好</h4>
            <div className="text-sm text-gray-700 break-words">
              {Array.isArray(creativePersona.contentGoals)
                ? creativePersona.contentGoals.join('、')
                : creativePersona.contentGoals || '-'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">生活记录</h4>
            <div className="text-sm text-gray-700 break-words">
              {Array.isArray(creativePersona.interests)
                ? creativePersona.interests.join('、')
                : creativePersona.interests || '-'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">风格记忆</h4>
            <p className="text-sm text-gray-700 break-words">{creativePersona.personality || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">个人成长轨迹</h4>
            <p className="text-sm text-gray-700 break-words">{creativePersona.creativePurpose || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">内容长度</h4>
            <p className="text-sm text-gray-700 break-words">
              {creativePersona.preferredLength === 'short' ? '短篇（300-500字）' :
               creativePersona.preferredLength === 'medium' ? '中篇（500-800字）' :
               creativePersona.preferredLength === 'long' ? '长篇（800-1200字）' : '-'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">职业或身份</h4>
            <p className="text-sm text-gray-700 break-words">{creativePersona.profession || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">目标受众</h4>
            <p className="text-sm text-gray-700 break-words">{creativePersona.targetAudience || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
