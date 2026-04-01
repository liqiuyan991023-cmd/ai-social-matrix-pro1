interface PersonaDisplayProps {
  persona: {
    personality: string;
    tone: string;
    uniqueAngle: string;
    contentStrengths: string[];
  };
  onEdit?: () => void;
}

export default function PersonaDisplay({ persona, onEdit }: PersonaDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">你的创作人格画像</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            编辑
          </button>
        )}
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">性格特点</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{persona.personality}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">表达风格</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{persona.tone}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">独特创作角度</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{persona.uniqueAngle}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">内容优势</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {persona.contentStrengths.map((strength, index) => (
              <li key={index} className="bg-gray-50 px-3 py-1 rounded-md">{strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <p className="text-blue-800 text-sm">
            <strong>提示：</strong>这个创作人格将帮助你生成更个性化的内容。随着使用次数的增加，系统会根据你的反馈不断优化这个画像。
          </p>
        </div>
      </div>
    </div>
  );
}
