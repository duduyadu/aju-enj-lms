'use client';

import { ZALO_CONFIG } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';

interface ZaloContactButtonProps {
  variant?: 'full' | 'compact' | 'floating';
  className?: string;
}

export default function ZaloContactButton({ variant = 'full', className = '' }: ZaloContactButtonProps) {
  const { t } = useLanguage();

  const handleClick = () => {
    window.open(ZALO_CONFIG.getUrl(), '_blank');
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#0068FF] text-white rounded-full shadow-lg hover:bg-[#0055D4] transition-all hover:scale-105 flex items-center justify-center z-50 ${className}`}
        title={t('dashboard.contactZalo')}
      >
        <ZaloIcon className="w-7 h-7" />
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 bg-[#0068FF] text-white rounded-lg text-sm font-medium hover:bg-[#0055D4] transition-colors ${className}`}
      >
        <ZaloIcon className="w-4 h-4" />
        Zalo
      </button>
    );
  }

  // variant === 'full'
  return (
    <div className={`bg-white rounded-xl border border-[#E5E1D8] p-4 shadow-sm ${className}`}>
      <h3 className="font-semibold text-[#2D241E] text-sm mb-2 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#4A5D4E]" />
        {t('dashboard.support')}
      </h3>

      <p className="text-xs text-[#8C857E] mb-3">
        {t('dashboard.supportDesc')}
      </p>

      <button
        onClick={handleClick}
        className="w-full py-2.5 bg-[#0068FF] text-white rounded-lg font-medium hover:bg-[#0055D4] transition-colors flex items-center justify-center gap-2"
      >
        <ZaloIcon className="w-5 h-5" />
        {t('dashboard.contactZalo')}
      </button>
    </div>
  );
}

// Zalo 아이콘 (간단한 SVG)
function ZaloIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
    >
      <path d="M24 4C12.95 4 4 12.95 4 24c0 5.4 2.15 10.3 5.65 13.9L7 44l6.5-3.25c2.95 1.45 6.3 2.25 9.85 2.25h.65c11.05 0 20-8.95 20-20S35.05 4 24 4zm10.15 28.35c-.45 1.25-2.25 2.3-3.6 2.6-.95.2-2.15.35-6.25-1.35-5.25-2.15-8.6-7.5-8.85-7.85-.25-.35-2.1-2.8-2.1-5.35s1.3-3.8 1.8-4.3c.5-.5 1.05-.65 1.4-.65h1c.35 0 .8-.15 1.25.95.45 1.1 1.55 3.8 1.7 4.05.15.25.25.55.05.9-.2.35-.3.55-.6.85-.3.3-.6.65-.85.9-.3.25-.6.55-.25 1.1.35.55 1.55 2.55 3.3 4.15 2.3 2.05 4.2 2.7 4.8 3 .6.3.95.25 1.3-.15.35-.4 1.5-1.75 1.9-2.35.4-.6.8-.5 1.35-.3.55.2 3.5 1.65 4.1 1.95.6.3 1 .45 1.15.7.15.25.15 1.45-.3 2.85z" />
    </svg>
  );
}
