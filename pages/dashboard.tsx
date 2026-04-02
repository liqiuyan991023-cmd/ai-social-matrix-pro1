import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CreationHistory from '../components/dashboard/CreationHistory';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [creations, setCreations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否有 userId 存储
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/onboarding');
      return;
    }
    setUserId(storedUserId);

    // 获取用户的创作历史
    fetchCreations(storedUserId);
  }, [router]);

  const fetchCreations = async (userId: string) => {
    try {
      // 这里应该调用 API 获取创作历史
      // 由于我们没有实现这个 API，暂时使用模拟数据
      setIsLoading(true);
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟创作历史数据
      const mockCreations = [
        {
          id: 'creation_1',
          title: '5分钟快手早餐食谱',
          content: '大家好呀！今天想和大家分享一下我的早餐日常～作为一个上班族，每天早上时间都很紧张，所以我特别喜欢简单又营养的早餐...',
          topic: {
            category: '生活方式'
          },
          keywords: {
            tags: ['早餐', '健康饮食', '上班族必备']
          },
          createdAt: Date.now() - 86400000 // 1天前
        },
        {
          id: 'creation_2',
          title: '办公室解压小技巧',
          content: '工作压力大？试试这些办公室解压小技巧！在紧张的工作中，适当的放松可以提高效率...',
          topic: {
            category: '职场'
          },
          keywords: {
            tags: ['职场', '解压', '效率']
          },
          createdAt: Date.now() - 172800000 // 2天前
        }
      ];
      
      setCreations(mockCreations);
    } catch (error) {
      console.error('Error fetching creations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">AI Social Matrix Pro</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              开始创作
            </button>
            <div className="text-sm text-gray-600">
              欢迎回来！
            </div>
          </div>
        </div>

        <CreationHistory
          creations={creations}
          isLoading={isLoading}
          onSelectCreation={(creation) => {
            console.log('Selected creation:', creation);
            // 这里可以导航到创作详情页
          }}
        />
      </div>
    </div>
  );
}
