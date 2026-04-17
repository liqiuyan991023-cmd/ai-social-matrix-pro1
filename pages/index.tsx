import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const storedUserId = localStorage.getItem('userId');

    if (storedUserId) {
      router.push('/dashboard').catch(err => {
        console.error('Navigation error:', err);
        setIsRedirecting(false);
      });
    } else {
      router.push('/onboarding').catch(err => {
        console.error('Navigation error:', err);
        setIsRedirecting(false);
      });
    }

    // 跳转完成后再设置加载状态为 false
    // 这里不立即设置，让加载状态保持直到跳转完成
  }, [router, isMounted]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4">页面跳转中，请稍候...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
      <p>正在跳转...</p>
    </div>
  );
}
