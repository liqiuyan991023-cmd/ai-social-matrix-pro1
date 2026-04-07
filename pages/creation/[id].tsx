import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Copy, Check, MessageSquarePlus } from 'lucide-react';
import TopBar from '../../components/TopBar';
import BottomNav from '../../components/BottomNav';

export default function CreationDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [creation, setCreation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (id) {
      fetchCreation(id);
    }
  }, [id, isMounted]);

  const fetchCreation = async (creationId: string) => {
    try {
      setIsLoading(true);
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟创作数据
      const mockCreation = {
        id: creationId,
        title: '打工人的救命神器分享',
        content: '这绝对是打工人必备的桌面好物！😭\n\n平时天天对着电脑，颈椎真的受不了！最近入手了这几个小物件，幸福感直接拉满⬆️\n1️⃣ 屏幕增高架：不仅拯救了我的脖子，底下还能收纳键盘，桌面瞬间清爽！\n2️⃣ 无线磁吸充电座：告别一团乱麻的线，放上去就充电，超省心～\n3️⃣ 护眼挂灯：晚上加班（虽然不想）光线超舒服，不反光！\n\n你们桌面上有什么离不开的宝藏好物吗？评论区抄作业啦！👇\n\n#打工人日常 #桌面改造 #好物分享 #提升幸福感',
        topic: {
          category: '生活方式'
        },
        keywords: {
          tags: ['打工人', '桌面改造', '好物分享', '提升幸福感']
        },
        createdAt: Date.now() - 86400000, // 1天前
        likes: 128,
        views: 1200
      };
      
      setCreation(mockCreation);
    } catch (error) {
      console.error('Error fetching creation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (creation) {
      navigator.clipboard.writeText(creation.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!creation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">创作内容未找到</p>
          <button 
            onClick={() => router.push('/history')}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            返回历史页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar 
        title="创作详情" 
        showIcon={false} 
        showBackButton={true} 
        onBack={() => router.push('/history')}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-4">{creation.title}</h1>
          
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 mb-6">
            {creation.content}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {creation.keywords?.tags?.map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
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
          
          <div className="flex gap-3">
            <button 
              onClick={handleCopy}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制正文'}
            </button>
            <button 
              onClick={() => {
                alert("内容已保存到草稿！");
                router.push("/dashboard");
              }}
              className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              保存到草稿
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">反馈与优化</h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 mb-2 block">一键微调方向：</span>
              <div className="flex flex-wrap gap-2">
                {['短一点', '更干货点', '加多点表情包', '更像吐槽'].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => router.push('/create')}
              className="w-full py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              重新生成
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export async function getServerSideProps({ params }: { params: { id: string } }) {
  return {
    props: {
      id: params.id
    }
  };
}
