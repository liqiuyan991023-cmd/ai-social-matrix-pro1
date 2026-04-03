import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Sparkles } from 'lucide-react';

export interface TopBarProps {
  title: string;
  showIcon?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function TopBar({ title, showIcon = false, showBackButton = false, onBack }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-soft-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {showIcon && (
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
          <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 可以添加右侧的操作按钮，比如通知、设置等 */}
        </div>
      </div>
    </div>
  );
}
