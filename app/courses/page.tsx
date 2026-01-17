'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SubscriptionStatus } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import StudentLayout from '@/components/StudentLayout';
import { Course } from '@/types';
import { getActiveCourses } from '@/services/courseService';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, Clock, Users, ChevronRight, AlertCircle, Calendar } from 'lucide-react';

export default function CoursesPage() {
  const router = useRouter();
  const { userData, loading: authLoading, getSubscriptionStatus } = useAuth();
  const { t } = useLanguage();
  const subscriptionStatus = getSubscriptionStatus();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (userData) {
      fetchCourses();
    }
  }, [userData, authLoading, router]);

  const fetchCourses = async () => {
    try {
      const result = await getActiveCourses();
      setCourses(result.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error(t('errors.loadCourses') || '코스 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userData) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#2D241E] mb-2">{t('courses.title')}</h1>
          <p className="text-[#8C857E]">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* 구독 상태 표시 */}
        {subscriptionStatus.isActive && subscriptionStatus.status === 'active' && (
          <div className={`mb-8 p-4 rounded-xl flex items-center justify-between ${
            subscriptionStatus.daysRemaining <= 7
              ? 'bg-[#FEF3E2] border border-[#F59E0B]/30'
              : 'bg-[#4A5D4E]/10 border border-[#4A5D4E]/30'
          }`}>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${subscriptionStatus.daysRemaining <= 7 ? 'text-[#F59E0B]' : 'text-[#4A5D4E]'}`} />
              <span className={`text-sm ${subscriptionStatus.daysRemaining <= 7 ? 'text-[#92400E]' : 'text-[#4A5D4E]'}`}>
                {t('subscription.daysRemaining').replace('{days}', String(subscriptionStatus.daysRemaining))}
                {subscriptionStatus.endDate && (
                  <span className="ml-2 text-xs opacity-75">
                    ({t('subscription.until')} {subscriptionStatus.endDate.toLocaleDateString()})
                  </span>
                )}
              </span>
            </div>
            {subscriptionStatus.daysRemaining <= 7 && (
              <a
                href="https://zalo.me/ajuenj"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#F59E0B] text-white rounded-lg text-xs font-medium hover:bg-[#D97706] transition-all"
              >
                {t('subscription.renew')}
              </a>
            )}
          </div>
        )}

        {/* 권한 확인 알림 - 구독이 없거나 만료된 경우 */}
        {!subscriptionStatus.isActive && (
          <div className={`mb-8 p-6 rounded-xl ${
            subscriptionStatus.status === 'expired'
              ? 'bg-[#FEE2E2] border border-[#EF4444]/30'
              : 'bg-[#D4AF37]/10 border border-[#D4AF37]/30'
          }`}>
            <div className="flex items-start">
              <AlertCircle className={`w-6 h-6 mr-3 flex-shrink-0 mt-0.5 ${
                subscriptionStatus.status === 'expired' ? 'text-[#EF4444]' : 'text-[#D4AF37]'
              }`} />
              <div>
                <h3 className={`font-semibold mb-1 ${
                  subscriptionStatus.status === 'expired' ? 'text-[#DC2626]' : 'text-[#2D241E]'
                }`}>
                  {subscriptionStatus.status === 'expired' ? t('subscription.expired') : t('courses.waitingApproval')}
                </h3>
                <p className={subscriptionStatus.status === 'expired' ? 'text-[#B91C1C]' : 'text-[#8C857E]'}>
                  {subscriptionStatus.status === 'expired' ? t('subscription.expiredMessage') : t('courses.waitingMessage')}
                </p>
                <p className="text-[#8C857E] text-sm mt-2">
                  {t('courses.contact')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 코스 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-[#8C857E]">{t('courses.loadingCourses')}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-[#8C857E] mx-auto mb-4" />
            <p className="text-[#8C857E]">{t('courses.noCourses')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-[#E5E1D8]"
              >
                {/* 썸네일 */}
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#4A5D4E] to-[#3a4a3e] flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/80" />
                  </div>
                )}

                {/* 코스 정보 */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#2D241E] mb-2">
                    {course.title}
                  </h3>
                  <p className="text-[#8C857E] mb-4 line-clamp-3 text-sm">
                    {course.description}
                  </p>

                  {subscriptionStatus.isActive ? (
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#4A5D4E] text-white rounded-lg hover:bg-[#3a4a3e] transition-colors text-sm font-medium"
                    >
                      {t('courses.startCourse')}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#E5E1D8] text-[#8C857E] rounded-lg cursor-not-allowed text-sm"
                    >
                      {subscriptionStatus.status === 'expired' ? t('subscription.expired') : t('courses.waitingStatus')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 브랜드 강조 섹션 */}
        <div className="mt-12 p-8 bg-[#2D241E] rounded-xl text-white">
          <h2 className="text-2xl font-serif font-bold text-[#D4AF37] mb-3">{t('courses.brandTitle')}</h2>
          <p className="text-[#F5F3ED]/80 mb-6">
            {t('courses.brandDesc')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm">{t('courses.feature1')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm">{t('courses.feature2')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm">{t('courses.feature3')}</span>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
