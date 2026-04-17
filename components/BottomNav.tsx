import React from 'react';
import { useRouter } from 'next/router';
import { Home, User, PenSquare, History } from 'lucide-react';

export default function BottomNav() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    {
      label: '首页',
      icon: Home,
      path: '/'
    },
    {
      label: '风格',
      icon: User,
      path: '/onboarding'
    },
    {
      label: '创作',
      icon: PenSquare,
      path: '/create'
    },
    {
      label: '历史',
      icon: History,
      path: '/history'
    }
  ];

  const handleNavClick = (path: string) => {
    // 确保正确的导航，避免跳回首页
    router.push(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-soft-lg z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={index}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary/10 -translate-y-0.5' : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
                  isActive ? 'bg-gradient-primary shadow-soft-md' : ''
                }`}>
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                </div>
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
