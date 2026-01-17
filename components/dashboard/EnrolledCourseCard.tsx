'use client';

import { useMemo } from 'react';
import { Course, CourseSubscription, Progress, EXPIRY_WARNING_DAYS } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, Clock, AlertTriangle, Play, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface EnrolledCourseCardProps {
  course: Course;
  subscription: CourseSubscription;
  progressData: Progress[];
  totalChapters: number;
}

export default function EnrolledCourseCard({
  course,
  subscription,
  progressData,
  totalChapters,
}: EnrolledCourseCardProps) {
  const { t, language } = useLanguage();

  const { completedChapters, progressPercent, remainingDays, isExpiringSoon, statusText, statusColor } = useMemo(() => {
    const completed = progressData.filter(p => p.isCompleted).length;
    const percent = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;

    let remaining = 0;
    let expiringSoon = false;

    if (subscription.endDate) {
      const endDate = subscription.endDate instanceof Date
        ? subscription.endDate
        : new Date(subscription.endDate as any);
      const now = new Date();
      remaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expiringSoon = remaining <= EXPIRY_WARNING_DAYS && remaining > 0;
    }

    let text = '';
    let color = '';

    if (subscription.status === 'EXPIRED' || remaining <= 0) {
      text = t('dashboard.expired');
      color = 'text-red-500';
    } else if (subscription.status === 'READY') {
      text = t('dashboard.notStarted');
      color = 'text-amber-500';
    } else if (expiringSoon) {
      text = language === 'vi'
        ? `Còn ${remaining} ngày`
        : `${remaining}${t('dashboard.daysLeft')}`;
      color = 'text-orange-500';
    } else {
      text = language === 'vi'
        ? `Còn ${remaining} ngày`
        : `${remaining}${t('dashboard.daysLeft')}`;
      color = 'text-[#4A5D4E]';
    }

    return {
      completedChapters: completed,
      progressPercent: percent,
      remainingDays: remaining,
      isExpiringSoon: expiringSoon,
      statusText: text,
      statusColor: color,
    };
  }, [progressData, totalChapters, subscription, t, language]);

  const isExpired = subscription.status === 'EXPIRED' || remainingDays <= 0;

  return (
    <div className={`bg-white rounded-xl border ${isExpiringSoon ? 'border-orange-300' : 'border-[#E5E1D8]'} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      {isExpiringSoon && !isExpired && (
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-orange-700 font-medium">
            {t('dashboard.expiringWarning')}
          </span>
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F5F3ED] flex-shrink-0">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#8C857E]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#2D241E] mb-1 line-clamp-1">
              {course.title}
            </h3>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#8C857E]">
                  {completedChapters}/{totalChapters} {t('dashboard.lessonsProgress')}
                </span>
                <span className="font-medium text-[#4A5D4E]">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-[#F5F3ED] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4A5D4E] to-[#5d7361] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              <span className={statusColor}>{statusText}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {isExpired ? (
            <a
              href={`/courses/${course.id}/`}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm text-center hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              {t('dashboard.extend')}
            </a>
          ) : subscription.status === 'READY' ? (
            <a
              href={`/courses/${course.id}/`}
              className="flex-1 py-2.5 bg-[#4A5D4E] text-white rounded-lg font-medium text-sm text-center hover:bg-[#3a4a3e] transition-colors flex items-center justify-center gap-1"
            >
              <Play className="w-4 h-4" />
              {t('dashboard.start')}
            </a>
          ) : (
            <a
              href={`/learn/${getLastChapterId(progressData, course.id)}/`}
              className="flex-1 py-2.5 bg-[#4A5D4E] text-white rounded-lg font-medium text-sm text-center hover:bg-[#3a4a3e] transition-colors flex items-center justify-center gap-1"
            >
              <Play className="w-4 h-4" />
              {t('dashboard.continue')}
            </a>
          )}

          <a
            href={`/courses/${course.id}/`}
            className="px-3 py-2.5 bg-[#F5F3ED] text-[#2D241E] rounded-lg hover:bg-[#E5E1D8] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function getLastChapterId(progressData: Progress[], courseId: string): string {
  const courseProgress = progressData
    .filter(p => p.courseId === courseId)
    .sort((a, b) => {
      const dateA = a.lastWatchedAt instanceof Date ? a.lastWatchedAt : new Date(a.lastWatchedAt as any);
      const dateB = b.lastWatchedAt instanceof Date ? b.lastWatchedAt : new Date(b.lastWatchedAt as any);
      return dateB.getTime() - dateA.getTime();
    });

  if (courseProgress.length > 0) {
    return courseProgress[0].chapterId;
  }

  return '';
}
