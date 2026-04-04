interface PersonaDisplayProps {
  persona: any;
  onEdit?: () => void;
}

export default function PersonaDisplay({ persona, onEdit }: PersonaDisplayProps) {
  // 尝试从不同的数据结构中获取创作人格信息
  const creativePersona = persona?.creativePersona || persona || {};
  const personaSummary = creativePersona.personaSummary || creativePersona.personaSummary || 'AI正在分析你的特点，打造专属的创作风格...';

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
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">AI创作人格总结</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {personaSummary}
          </div>
        </div>

        {creativePersona.personality && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">性格特点</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm">{creativePersona.personality}</p>
          </div>
        )}

        {creativePersona.tone && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">表达风格</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm">{creativePersona.tone}</p>
          </div>
        )}

        {creativePersona.uniqueAngle && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">独特创作角度</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm">{creativePersona.uniqueAngle}</p>
          </div>
        )}

        {creativePersona.contentStrengths && creativePersona.contentStrengths.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">内容优势</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
              {creativePersona.contentStrengths.map((strength: string, index: number) => (
                <li key={index} className="bg-gray-50 px-3 py-1 rounded-md">{strength}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-xs">
            <strong>提示：</strong>这个创作人格将帮助你生成更个性化的内容。随着使用次数的增加，系统会根据你的反馈不断优化这个画像。
          </p>
        </div>
      </div>
    </div>
  );
}
