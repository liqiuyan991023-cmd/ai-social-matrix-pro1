import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { History as HistoryIcon } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

export default function HistoryPage() {
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
          title: '打工人的救命神器分享',
          content: '这绝对是打工人必备的桌面好物！平时天天对着电脑，颈椎真的受不了...',
          topic: {
            category: '生活方式'
          },
          keywords: {
            tags: ['打工人', '桌面改造', '好物分享']
          },
          createdAt: Date.now() - 86400000, // 1天前
          likes: 128,
          views: 1200
        },
        {
          id: 'creation_2',
          title: '极简穿搭：周五下班直接去约会',
          content: '谁懂啊！这种一衣多穿的快乐。今天这套Look真是闭眼穿都好看...',
          topic: {
            category: '时尚'
          },
          keywords: {
            tags: ['极简穿搭', '职场穿搭', '约会穿搭']
          },
          createdAt: Date.now() - 172800000, // 2天前
          likes: 450,
          views: 3500
        },
        {
          id: 'creation_3',
          title: '探店 | 这家藏在巷子里的咖啡馆',
          content: '终于被我挖到了！人少安静，咖啡好喝，超级适合带电脑来办公...',
          topic: {
            category: '探店'
          },
          keywords: {
            tags: ['咖啡馆', '探店', '办公好去处']
          },
          createdAt: Date.now() - 259200000, // 3天前
          likes: 65,
          views: 800
        }
      ];
      
      setCreations(mockCreations);
    } catch (error) {
      console.error('Error fetching creations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreationClick = (creation: any) => {
    // 跳转到创作内容界面
    router.push(`/creation/${creation.id}`);
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar title="创作历史" showIcon={false} />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          {creations.map(creation => (
            <div 
              key={creation.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-red-300 transition-colors cursor-pointer"
              onClick={() => handleCreationClick(creation)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex-1">{creation.title}</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {creation.content}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{new Date(creation.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="red" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {creation.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {creation.views} 曝光
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
