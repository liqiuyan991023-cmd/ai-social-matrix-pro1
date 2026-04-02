import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 检查是否有 userId 存储
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUserId) {
      // 如果有 userId，重定向到 dashboard
      router.push('/dashboard');
    } else {
      // 如果没有 userId，重定向到 onboarding
      router.push('/onboarding');
    }
  }, [router]);

  return null;
}
