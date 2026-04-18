import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { User, CheckCircle2 } from 'lucide-react';
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    ageRange: '',
    profession: '',
    interests: '',
    contentPreference: [] as string[],
    contentStyle: [] as string[],
    customContentPreference: '',
    customContentStyle: '',
    preferredLength: '',
    creativePurpose: ''
  });

  // 组件加载时检查是否已存在用户画像
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const initializeOnboarding = () => {
      const storedUserId = localStorage.getItem('userId');

      if (storedUserId) {
        const storedPersona = localStorage.getItem(`creativePersona_${storedUserId}`);
        const storedProfile = localStorage.getItem(`userProfile_${storedUserId}`);

        if (storedPersona) {
          try {
            const personaData = JSON.parse(storedPersona);
            // 检查数据是否有效（包含必要的字段）
            if (personaData.personality || personaData.personaSummary) {
              // 数据有效，显示成功界面
              setUserId(storedUserId);
              setProfileCreated(true);
              return;
            }
          } catch (e) {
            // JSON 解析失败，清除无效数据
            console.error('Failed to parse stored persona:', e);
            localStorage.removeItem(`creativePersona_${storedUserId}`);
          }
        }

        if (storedProfile) {
          try {
            const profileData = JSON.parse(storedProfile);
            // 如果有 profile 但没有有效的 persona，清除 profile
            if (!localStorage.getItem(`creativePersona_${storedUserId}`)) {
              localStorage.removeItem(`userProfile_${storedUserId}`);
            }
          } catch (e) {
            console.error('Failed to parse stored profile:', e);
            localStorage.removeItem(`userProfile_${storedUserId}`);
          }
        }
      }

      // 生成新的用户ID
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      setUserId(newUserId);
      setProfileCreated(false);
      // 保存userId到localStorage
      localStorage.setItem('userId', newUserId);
      // 自动跳转到dashboard页面
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    initializeOnboarding();
  }, [isMounted]);
  
  // 使用新的generate-persona API生成创作人格
  const generatePersona = async (userInput: string): Promise<any> => {
    try {
      const response = await fetch('/api/generate-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: userInput
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '生成创作人格失败');
      }

      if (!data.success || !data.data) {
        throw new Error('API返回数据格式不正确');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error generating persona:', error);
      
      // 生成默认数据作为备用
      const userLines = userInput.split('\n');
      const userData: any = {};
      userLines.forEach(line => {
        const [key, value] = line.split('：');
        if (key && value) {
          userData[key.trim()] = value.trim();
        }
      });

      const ageRange = userData['年龄范围'] || '26-35岁';
      const profession = userData['职业'] || '创作者';
      const interests = userData['兴趣'] || '生活分享';
      const contentGoals = userData['内容偏好'] || '生活分享';
      const contentStyle = userData['表达风格'] || '亲切自然';
      const creativePurpose = userData['创作目的'] || '分享生活经验';

      const interestsArray = interests.includes('、') || interests.includes(',')
        ? interests.split(/[、,]/).map((i: string) => i.trim())
        : [interests];

      const contentGoalsArray = contentGoals.includes('、') || contentGoals.includes(',')
        ? contentGoals.split(/[、,]/).map((i: string) => i.trim())
        : [contentGoals];

      return {
        ageRange,
        profession,
        interests: interestsArray,
        contentStyle,
        contentGoals: contentGoalsArray,
        preferredLength: userData['内容长度'] || 'medium',
        creativePurpose,
        targetAudience: '对相关内容感兴趣的读者',
        personaSummary: `基于你的个人特点（${profession}、${ageRange}），我为你定制了专属的创作风格。你的优势在于${interests}，建议重点关注${contentGoals}，采用${contentStyle}的表达方式，以${creativePurpose}为创作目的，这样最容易吸引对你的内容感兴趣的读者群体。`,
        personality: `你是一个${profession}，喜欢分享${interestsArray.join('、')}相关内容。你的表达风格${contentStyle}，偏好${userData['内容长度'] === 'short' ? '短小精悍' : userData['内容长度'] === 'long' ? '详细深入' : '中等长度'}的内容形式。`
      };
    }
  };

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

      const userInput = `年龄范围：${data.ageRange}
职业：${data.profession}
兴趣：${data.interests}
内容偏好：${contentPreferences.join(', ')}
表达风格：${contentStyles.join(', ')}
内容长度：${data.preferredLength}
创作目的：${data.creativePurpose || '分享生活经验'}`;

      // 调用新的generate-persona API生成创作人格
      const personaData = await generatePersona(userInput);

      // 处理API返回的数据格式
      const processedData = {
        userId,
        ageRange: personaData.ageRange || data.ageRange,
        profession: personaData.profession || data.profession,
        interests: personaData.interests || data.interests.split(',').map((i: string) => i.trim()),
        expertise: personaData.interests || data.interests.split(',').map((i: string) => i.trim()),
        contentGoals: personaData.contentGoals || contentPreferences,
        contentStyle: personaData.contentStyle || contentStyles.join(', '),
        preferredLength: personaData.preferredLength || data.preferredLength,
        creativePurpose: personaData.creativePurpose || data.creativePurpose,
        creativePersona: {
          personaSummary: personaData.personaSummary,
          ageRange: personaData.ageRange,
          profession: personaData.profession,
          interests: personaData.interests,
          contentStyle: personaData.contentStyle,
          contentGoals: personaData.contentGoals,
          preferredLength: personaData.preferredLength,
          creativePurpose: personaData.creativePurpose,
          targetAudience: personaData.targetAudience,
          generatedAt: new Date().toISOString()
        }
      };

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        throw new Error("创建画像失败，请稍后重试");
      }

      const result = await response.json();
      // 存储 userId 到 localStorage
      localStorage.setItem('userId', userId);
      // 存储用户画像到localStorage
      localStorage.setItem(`userProfile_${userId}`, JSON.stringify(result.profile));
      // 保存AI生成的创作人格到localStorage
      const savedPersonaData = {
        userId: userId,
        personaSummary: personaData.personaSummary,
        personality: personaData.personality,
        ageRange: personaData.ageRange,
        profession: personaData.profession,
        interests: personaData.interests,
        contentStyle: personaData.contentStyle,
        contentGoals: personaData.contentGoals,
        preferredLength: personaData.preferredLength,
        creativePurpose: personaData.creativePurpose,
        targetAudience: personaData.targetAudience,
        generatedAt: new Date().toISOString()
      };
      localStorage.setItem(`creativePersona_${userId}`, JSON.stringify(savedPersonaData));

      // 设置成功状态并停止加载
      setProfileCreated(true);
      setIsLoading(false);

      // 自动跳转到创作页面
      setTimeout(() => {
        router.push('/create');
      }, 1000);

      return result;
    } catch (error: any) {
      console.error("Error creating profile:", error);
      // 提供更友好的错误提示
      let errorMessage = '创建画像失败，请稍后重试';
      if (error.message.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接后重试';
      } else if (error.message.includes('API')) {
        errorMessage = '服务暂时不可用，请稍后重试';
      }
      alert(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasContentPreference = formData.contentPreference.length > 0 || formData.customContentPreference;
    const hasContentStyle = formData.contentStyle.length > 0 || formData.customContentStyle;

    if (formData.ageRange && formData.profession && formData.interests && hasContentPreference && hasContentStyle && formData.preferredLength && formData.creativePurpose) {
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
      preferredLength: '',
      creativePurpose: ''
    });
    // 清除localStorage中的创作人格数据
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
      <TopBar title="表达风格设置" showIcon={false} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!profileCreated ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-soft-lg animate-pulse-soft">
                <User className="w-11 h-11 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">探索你的表达风格</h2>
              <p className="text-sm text-gray-600 text-center">回答几个问题，AI 为你梳理真实的表达习惯与创作偏好。</p>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">7. 创作目的 *</label>
                    <input
                      type="text"
                      placeholder="例如：分享专业知识、记录成长历程、帮助他人"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      value={formData.creativePurpose || ''}
                      onChange={(e) => setFormData({ ...formData, creativePurpose: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-4 rounded-xl hover:shadow-soft-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-soft-md"
              >
                {isLoading ? "生成中..." : "梳理表达风格"}
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
                <h3 className="font-semibold text-green-800">你的表达习惯已梳理完成！</h3>
              </div>
              <div className="text-sm text-green-700 mt-3 space-y-2">
                {(() => {
                  try {
                    const savedPersona = localStorage.getItem(`creativePersona_${userId}`);
                    if (savedPersona) {
                      const personaData = JSON.parse(savedPersona);
                      const summary = personaData.personaSummary || personaData.personality || '';
                      if (summary) {
                        return <p className="leading-relaxed">{summary}</p>;
                      }
                    }
                    return <p className="text-gray-500 italic">正在加载你的表达习惯...</p>;
                  } catch (error) {
                    console.error('Error loading creative persona:', error);
                    return <p className="text-gray-500 italic">加载失败，请刷新页面重试</p>;
                  }
                })()}
                <p className="mt-2 text-green-800">👉 这些只是你的"现在"，你想怎么变都可以，AI 会跟着你一起变～</p>
              </div>
            </div>

            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button
                onClick={() => router.push("/create")}
                className="w-full bg-rose-500 text-white py-3.5 rounded-xl hover:bg-rose-600 font-medium transition-all duration-300"
              >
                开始创作
              </button>

              <button
                onClick={handleResetPersona}
                className="w-full border-2 border-rose-500 text-rose-500 py-3.5 rounded-xl hover:bg-rose-50 font-medium transition-all duration-300"
              >
                随时更新我的偏好
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
                <h3 className="font-semibold text-green-800">你的表达习惯已梳理完成！</h3>
              </div>
              <div className="text-sm text-green-700 mt-3 space-y-2">
                {(() => {
                  try {
                    const savedPersona = localStorage.getItem(`creativePersona_${userId}`);
                    if (savedPersona) {
                      const personaData = JSON.parse(savedPersona);
                      const summary = personaData.personaSummary || personaData.personality || '';
                      if (summary) {
                        return <p className="leading-relaxed">{summary}</p>;
                      }
                    }
                    return <p className="text-gray-500 italic">正在加载你的表达习惯...</p>;
                  } catch (error) {
                    console.error('Error loading creative persona:', error);
                    return <p className="text-gray-500 italic">加载失败，请刷新页面重试</p>;
                  }
                })()}
                <p className="mt-2 text-green-800">👉 这些只是你的"现在"，你想怎么变都可以，AI 会跟着你一起变～</p>
              </div>
            </div>

            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-rose-500 text-white py-3.5 rounded-xl hover:bg-rose-600 font-medium transition-all duration-300"
              >
                开始创作
              </button>

              <button
                onClick={handleResetPersona}
                className="w-full border-2 border-rose-500 text-rose-500 py-3.5 rounded-xl hover:bg-rose-50 font-medium transition-all duration-300"
              >
                随时更新我的偏好
              </button>
            </div>
          </div>
        )}
        
        {/* 确认对话框 */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">确认更新偏好</h3>
              <p className="text-sm text-gray-600 mb-4">更新表达偏好将覆盖当前的设置，确定要继续吗？</p>
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
