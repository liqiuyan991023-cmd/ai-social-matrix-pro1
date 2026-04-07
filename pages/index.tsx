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
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }

    // 保留加载状态，用于即时反馈
    setIsRedirecting(false);
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
