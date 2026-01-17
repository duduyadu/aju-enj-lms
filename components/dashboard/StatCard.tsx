'use client';

import { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatCardProps {
  icon: ReactNode;
  labelKey: string;
  value: string | number;
  subValue?: string;
  iconBgColor?: string;
  valueColor?: string;
}

export default function StatCard({
  icon,
  labelKey,
  value,
  subValue,
  iconBgColor = 'bg-[#4A5D4E]/10',
  valueColor = 'text-[#2D241E]',
}: StatCardProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[#8C857E] truncate">
            {t(labelKey)}
          </p>
          <p className={`text-xl font-bold ${valueColor} truncate`}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-[#8C857E]">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}
