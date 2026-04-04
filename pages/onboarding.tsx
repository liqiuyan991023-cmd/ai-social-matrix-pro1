import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Sparkles, User, CheckCircle2 } from 'lucide-react';
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import PersonaDisplay from "../components/onboarding/PersonaDisplay";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  const [formData, setFormData] = useState({
    ageRange: '',
    profession: '',
    interests: '',
    contentPreference: [] as string[],
    contentStyle: [] as string[],
    customContentPreference: '',
    customContentStyle: '',
    preferredLength: ''
  });
  
  const createProfile = async (data: any) => {
    setIsLoading(true);
    try {
      // 处理数据格式
      let contentPreferences = [...data.contentPreference];
      if (data.customContentPreference) {
        contentPreferences.push(data.customContentPreference);
      }

      let contentStyles = [...data.contentStyle];
      if (data.customContentStyle) {
        contentStyles.push(data.customContentStyle);
      }

      const processedData = {
        userId,
        ageRange: data.ageRange,
        profession: data.profession,
        interests: data.interests.split(',').map((i: string) => i.trim()),
        expertise: data.interests.split(',').map((i: string) => i.trim()), // 使用兴趣作为专长
        contentGoals: contentPreferences,
        contentStyle: contentStyles.join(', '),
        preferredLength: data.preferredLength
      };

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        throw new Error("Failed to create profile");
      }

      const result = await response.json();
      // 存储 userId 到 localStorage
      localStorage.setItem('userId', userId);
      // 存储用户画像到localStorage
      localStorage.setItem(`userProfile_${userId}`, JSON.stringify(result.profile));
      
      // 调用AI生成创作人格总结，并等待完成
      await generateCreativePersona(result.profile);
      
      // 设置成功状态并停止加载
      setProfileCreated(true);
      setIsLoading(false);
      
      // 手动刷新persona数据
      mutatePersona();

      return result;
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("创建画像失败，请重试");
      setIsLoading(false);
      throw error;
    }
  };

  // 生成创作人格总结
  const generateCreativePersona = async (profile: any): Promise<void> => {
    try {
      const prompt = `基于以下用户信息生成一个详细的创作人格画像：

用户基本信息：
- 年龄范围：${profile.ageRange}
- 职业：${profile.profession}
- 兴趣：${profile.interests.join(', ')}
- 内容目标：${profile.contentGoals.join(', ')}
- 表达风格：${profile.contentStyle}
- 内容长度偏好：${profile.preferredLength}

请生成一个详细的创作人格画像，包含：
1. 创作者人设描述
2. 适合的内容类型和主题
3. 表达风格特点
4. 受众群体分析
5. 内容创作建议

请用友好的语气输出，让用户感受到AI的个性化关怀。`;

      const response = await fetch('/api/content/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        // 保存创作人格到localStorage
        const creativePersona = {
          userId: userId,
          personality: data.summary || '基于你的特点，我为你打造了专属创作风格',
          generatedAt: new Date().toISOString()
        };
        localStorage.setItem(`creativePersona_${userId}`, JSON.stringify(creativePersona));
      } else {
        // 如果API调用失败，仍然保存默认的创作人格
        const defaultPersona = {
          userId: userId,
          personality: `基于你的个人特点（${profile.profession}${profile.ageRange}），我为你定制了专属的创作风格。你的优势在于${profile.interests.split(',')[0] || '生活经验丰富'}，建议重点关注${profile.contentGoals.join('/')}{${profile.contentStyle}的表达方式，这样最容易引起目标受众的共鸣。`,
          generatedAt: new Date().toISOString()
        };
        localStorage.setItem(`creativePersona_${userId}`, JSON.stringify(defaultPersona));
      }
    } catch (error) {
      console.error('Error generating creative persona:', error);
      // 即使生成失败，也保存默认的创作人格，避免数据缺失
      const defaultPersona = {
        userId: userId,
        personality: `基于你的个人特点（${profile.profession}${profile.ageRange}），我为你定制了专属的创作风格。建议重点关注内容质量和用户互动，这是小红书平台成功的关键。`,
        generatedAt: new Date().toISOString()
      };
      localStorage.setItem(`creativePersona_${userId}`, JSON.stringify(defaultPersona));
    }
  };
  
  const { data: personaData, isLoading: personaLoading, mutate: mutatePersona } = useSWR(
    userId ? `/api/user/profile?userId=${userId}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) return null;
      return response.json();
    },
    { revalidateOnFocus: false, shouldRetryOnError: false, refreshInterval: profileCreated ? 1000 : 0 }
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasContentPreference = formData.contentPreference.length > 0 || formData.customContentPreference;
    const hasContentStyle = formData.contentStyle.length > 0 || formData.customContentStyle;

    if (formData.ageRange && formData.profession && formData.interests && hasContentPreference && hasContentStyle && formData.preferredLength) {
      await createProfile(formData);
      // 创建成功后不直接跳转，让页面显示成功信息
    } else {
      alert('请填写所有必填项');
    }
  };
  
  const handleRecreate = () => {
    // 重置表单
    setFormData({
      ageRange: '',
      profession: '',
      interests: '',
      contentPreference: [],
      contentStyle: [],
      customContentPreference: '',
      customContentStyle: '',
      preferredLength: ''
    });
    // 清除 SWR 缓存和localStorage中的创作人格数据
    mutate(`/api/user/profile?userId=${userId}`, null);
    localStorage.removeItem(`creativePersona_${userId}`);
    setProfileCreated(false);
  };

  const handleResetPersona = () => {
    handleRecreate();
    setShowConfirmDialog(false);
  };

  // 检查是否创作人格已生成
  const isCreativePersonaGenerated = () => {
    if (!userId) return false;
    try {
      const savedPersona = localStorage.getItem(`creativePersona_${userId}`);
      return !!savedPersona;
    } catch {
      return false;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="人设诊断" showIcon={false} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!profileCreated && !personaData?.profile ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-soft-lg animate-pulse-soft">
                <User className="w-11 h-11 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">挖掘你的专属人设</h2>
              <p className="text-sm text-gray-600 text-center">回答几个问题，AI 为你定制小红书文风与选材方向。</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow duration-300">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">1. 年龄范围 *</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="18-25">18-25岁</option>
                      <option value="26-35">26-35岁</option>
                      <option value="36-45">36-45岁</option>
                      <option value="45+">45岁以上</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">2. 职业或主要身份 *</label>
                    <input
                      type="text"
                      placeholder="例如：互联网打工人、大二学生、新手宝妈"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">3. 平时关注的内容 *</label>
                    <input
                      type="text"
                      placeholder="例如：极简穿搭、探店、数码测评"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">4. 创作内容偏好 * (可多选)</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentPreference.includes('生活分享')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentPreference = [...formData.contentPreference];
                          if (newContentPreference.includes('生活分享')) {
                            newContentPreference = newContentPreference.filter(item => item !== '生活分享');
                          } else {
                            newContentPreference.push('生活分享');
                          }
                          setFormData({ ...formData, contentPreference: newContentPreference });
                        }}
                      >
                        生活分享
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentPreference.includes('专业干货')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentPreference = [...formData.contentPreference];
                          if (newContentPreference.includes('专业干货')) {
                            newContentPreference = newContentPreference.filter(item => item !== '专业干货');
                          } else {
                            newContentPreference.push('专业干货');
                          }
                          setFormData({ ...formData, contentPreference: newContentPreference });
                        }}
                      >
                        专业干货
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentPreference.includes('兴趣爱好')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentPreference = [...formData.contentPreference];
                          if (newContentPreference.includes('兴趣爱好')) {
                            newContentPreference = newContentPreference.filter(item => item !== '兴趣爱好');
                          } else {
                            newContentPreference.push('兴趣爱好');
                          }
                          setFormData({ ...formData, contentPreference: newContentPreference });
                        }}
                      >
                        兴趣爱好
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentPreference.includes('职场经验')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentPreference = [...formData.contentPreference];
                          if (newContentPreference.includes('职场经验')) {
                            newContentPreference = newContentPreference.filter(item => item !== '职场经验');
                          } else {
                            newContentPreference.push('职场经验');
                          }
                          setFormData({ ...formData, contentPreference: newContentPreference });
                        }}
                      >
                        职场经验
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="其他内容偏好（可选）"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.customContentPreference}
                      onChange={(e) => setFormData({ ...formData, customContentPreference: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">5. 表达风格 * (可多选)</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentStyle.includes('亲切自然')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentStyle = [...formData.contentStyle];
                          if (newContentStyle.includes('亲切自然')) {
                            newContentStyle = newContentStyle.filter(item => item !== '亲切自然');
                          } else {
                            newContentStyle.push('亲切自然');
                          }
                          setFormData({ ...formData, contentStyle: newContentStyle });
                        }}
                      >
                        亲切自然
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentStyle.includes('专业细致')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentStyle = [...formData.contentStyle];
                          if (newContentStyle.includes('专业细致')) {
                            newContentStyle = newContentStyle.filter(item => item !== '专业细致');
                          } else {
                            newContentStyle.push('专业细致');
                          }
                          setFormData({ ...formData, contentStyle: newContentStyle });
                        }}
                      >
                        专业细致
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentStyle.includes('幽默风趣')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentStyle = [...formData.contentStyle];
                          if (newContentStyle.includes('幽默风趣')) {
                            newContentStyle = newContentStyle.filter(item => item !== '幽默风趣');
                          } else {
                            newContentStyle.push('幽默风趣');
                          }
                          setFormData({ ...formData, contentStyle: newContentStyle });
                        }}
                      >
                        幽默风趣
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                          formData.contentStyle.includes('情感共鸣')
                            ? 'border-primary bg-primary/10 text-primary shadow-soft-sm'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => {
                          let newContentStyle = [...formData.contentStyle];
                          if (newContentStyle.includes('情感共鸣')) {
                            newContentStyle = newContentStyle.filter(item => item !== '情感共鸣');
                          } else {
                            newContentStyle.push('情感共鸣');
                          }
                          setFormData({ ...formData, contentStyle: newContentStyle });
                        }}
                      >
                        情感共鸣
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="其他表达风格（可选）"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.customContentStyle}
                      onChange={(e) => setFormData({ ...formData, customContentStyle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">6. 内容长度 *</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.preferredLength}
                      onChange={(e) => setFormData({ ...formData, preferredLength: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="short">短篇（300-500字）</option>
                      <option value="medium">中篇（500-800字）</option>
                      <option value="long">长篇（800-1200字）</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-4 rounded-xl hover:shadow-soft-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
              >
                {isLoading ? "生成中..." : "生成专属人设"}
              </button>
            </form>
          </div>
        ) : profileCreated ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-success rounded-full flex items-center justify-center shadow-soft-sm">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-green-800">你的人设画像设置成功！</h3>
              </div>
              <p className="text-sm text-green-700 mt-2">你的专属创作风格已生成，现在可以开始创作了</p>
            </div>

            {/* 显示创作人格总结 */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">你的创作人格画像</h3>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-rose-100 rounded-xl p-5 mb-4">
                <p className="text-gray-800 leading-relaxed">
                  {(() => {
                    try {
                      const savedPersona = localStorage.getItem(`creativePersona_${userId}`);
                      if (savedPersona) {
                        const personaData = JSON.parse(savedPersona);
                        return personaData.personality || '基于你的特点，AI正在为你打造专属创作风格...';
                      }
                      return '基于你的特点，AI正在为你打造专属创作风格...';
                    } catch (error) {
                      console.error('Error loading creative persona:', error);
                      return '基于你的特点，AI正在为你打造专属创作风格...';
                    }
                  })()}
                </p>
              </div>
              
              {personaData?.profile?.creativePersona && (
                <PersonaDisplay
                  persona={personaData.profile.creativePersona}
                  onEdit={() => setShowConfirmDialog(true)}
                />
              )}
            </div>

            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button
                onClick={() => router.push("/create")}
                className="w-full bg-gradient-primary text-white py-3.5 rounded-xl hover:shadow-soft-lg font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
              >
                开始创作
              </button>

              <button
                onClick={handleResetPersona}
                className="w-full border-2 border-primary text-primary py-3.5 rounded-xl hover:bg-primary/5 font-medium transition-all duration-300"
              >
                重新设置人设画像
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-success rounded-full flex items-center justify-center shadow-soft-sm">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-green-800">你的人设画像设置成功！</h3>
              </div>
              <p className="text-sm text-green-700 mt-2">你可以开始创作了，或重新设置人设画像</p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <PersonaDisplay
                persona={personaData.profile.creativePersona}
                onEdit={() => setShowConfirmDialog(true)}
              />
            </div>

            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gradient-primary text-white py-3.5 rounded-xl hover:shadow-soft-lg font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
              >
                开始创作
              </button>

              <button
                onClick={handleResetPersona}
                className="w-full border-2 border-primary text-primary py-3.5 rounded-xl hover:bg-primary/5 font-medium transition-all duration-300"
              >
                重新设置人设画像
              </button>
            </div>
          </div>
        )}
        
        {/* 确认对话框 */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">确认重新创建</h3>
              <p className="text-sm text-gray-600 mb-4">重新创建人设将覆盖当前的创作人格，确定要继续吗？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRecreate}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
