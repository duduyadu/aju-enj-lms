'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3ED] hover:bg-[#E5E1D8] rounded-lg transition-all text-sm font-medium text-[#2D241E]"
      title={language === 'ko' ? 'Chuyển sang tiếng Việt' : '한국어로 전환'}
    >
      <Globe className="w-4 h-4 text-[#8C857E]" />
      <span>{language === 'ko' ? 'VI' : 'KO'}</span>
    </button>
  );
}
