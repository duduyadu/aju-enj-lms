'use client';

import { useMemo } from 'react';
import { Progress, STUDY_CONFIG } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Flame } from 'lucide-react';

interface StudyCalendarProps {
  progressData: Progress[];
}

export default function StudyCalendar({ progressData }: StudyCalendarProps) {
  const { t, language } = useLanguage();

  const { studyDays, streak, calendarData } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const dailyStudyMinutes: Record<string, number> = {};

    progressData.forEach(p => {
      if (!p.updatedAt) return;
      const date = p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt as any);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const minutes = Math.floor((p.watchedDuration || 0) / 60);
      dailyStudyMinutes[dateKey] = (dailyStudyMinutes[dateKey] || 0) + minutes;
    });

    let studyDaysCount = 0;
    const calendarDays: { day: number; studied: boolean }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const studied = (dailyStudyMinutes[dateKey] || 0) >= STUDY_CONFIG.minStudyMinutes;
      if (studied) studyDaysCount++;
      calendarDays.push({ day, studied });
    }

    let streakCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

      if ((dailyStudyMinutes[dateKey] || 0) >= STUDY_CONFIG.minStudyMinutes) {
        streakCount++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      studyDays: studyDaysCount,
      streak: streakCount,
      calendarData: {
        daysInMonth,
        startDayOfWeek,
        days: calendarDays,
      },
    };
  }, [progressData]);

  // 요일 (베트남어/한국어)
  const weekDays = language === 'vi'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['일', '월', '화', '수', '목', '금', '토'];

  // 월 이름 (베트남어/한국어)
  const monthNames = language === 'vi'
    ? ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    : ['1월', '2월', '3월', '4월', '5월', '6월',
       '7월', '8월', '9월', '10월', '11월', '12월'];

  const now = new Date();

  return (
    <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-[#4A5D4E]" />
        <h3 className="font-semibold text-[#2D241E] text-sm">
          {monthNames[now.getMonth()]}
        </h3>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[10px] text-[#8C857E] font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {Array.from({ length: calendarData.startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {calendarData.days.map(({ day, studied }) => {
          const isToday = day === now.getDate();
          return (
            <div
              key={day}
              className={`aspect-square rounded-sm flex items-center justify-center text-[10px] ${
                studied
                  ? 'bg-[#4A5D4E] text-white font-medium'
                  : isToday
                    ? 'bg-[#F5F3ED] text-[#2D241E] ring-1 ring-[#4A5D4E]'
                    : 'bg-[#F5F3ED]/50 text-[#8C857E]'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 통계 */}
      <div className="border-t border-[#E5E1D8] pt-3 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8C857E]">{t('dashboard.studyDays')}</span>
          <span className="font-semibold text-[#2D241E]">
            {studyDays}{t('dashboard.days')}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8C857E] flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            {t('dashboard.consecutiveDays')}
          </span>
          <span className="font-semibold text-orange-500">
            {streak}{t('dashboard.days')}
          </span>
        </div>
      </div>
    </div>
  );
}
