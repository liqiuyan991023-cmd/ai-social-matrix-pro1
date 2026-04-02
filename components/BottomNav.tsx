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
      path: '/dashboard'
    },
    {
      label: '人设',
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center px-4 py-2"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isActive ? 'bg-red-100' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                </div>
                <span className={`text-xs ${isActive ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
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
