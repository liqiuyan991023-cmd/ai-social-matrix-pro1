import { useState } from "react";
import { useForm } from "react-hook-form";

interface QuestionnaireProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function Questionnaire({ onSubmit, isLoading }: QuestionnaireProps) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmitForm = (data: any) => {
    const processedData = {
      ...data,
      interests: data.interests ? data.interests.split(",").map((i: string) => i.trim()) : [],
      expertise: data.expertise ? data.expertise.split(",").map((e: string) => e.trim()) : [],
      contentGoals: data.contentGoals ? data.contentGoals.split(",").map((g: string) => g.trim()) : [],
    };
    
    onSubmit(processedData);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">创建你的创作画像</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年龄范围 *</label>
            <select 
              {...register("ageRange", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="18-20">18-20岁</option>
              <option value="21-25">21-25岁</option>
              <option value="26-30">26-30岁</option>
              <option value="31-35">31-35岁</option>
              <option value="36-40">36-40岁</option>
              <option value="40+">40岁以上</option>
            </select>
            {errors.ageRange && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">职业背景 *</label>
            <input
              {...register("profession", { required: true })}
              type="text"
              placeholder="例如：学生、设计师、程序员"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.profession && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">兴趣爱好 *</label>
            <input
              {...register("interests", { required: true })}
              type="text"
              placeholder="例如：美食, 旅行, 摄影（用逗号分隔）"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.interests && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">专长领域 *</label>
            <input
              {...register("expertise", { required: true })}
              type="text"
              placeholder="例如：烹饪, 健身, 写作（用逗号分隔）"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.expertise && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">创作目标 *</label>
            <input
              {...register("contentGoals", { required: true })}
              type="text"
              placeholder="例如：分享生活, 记录成长, 帮助他人（用逗号分隔）"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.contentGoals && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表达风格 *</label>
            <select
              {...register("contentStyle", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="亲切自然">亲切自然</option>
              <option value="专业细致">专业细致</option>
              <option value="幽默风趣">幽默风趣</option>
              <option value="文艺清新">文艺清新</option>
              <option value="简洁明了">简洁明了</option>
            </select>
            {errors.contentStyle && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容长度偏好 *</label>
            <select
              {...register("preferredLength", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="short">短篇（300-500字）</option>
              <option value="medium">中篇（500-800字）</option>
              <option value="long">长篇（800-1200字）</option>
            </select>
            {errors.preferredLength && <p className="text-red-500 text-xs mt-1">此字段为必填项</p>}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-8 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "生成中..." : "生成创作画像"}
        </button>
      </div>
    </form>
  );
}
