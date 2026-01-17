'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { Course, Chapter, Progress, Order, STUDY_CONFIG } from '@/types';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  BookOpen,
  LogOut,
  User,
  Clock,
  CheckCircle2,
  Flame,
  Loader2,
  GraduationCap,
} from 'lucide-react';

// 대시보드 컴포넌트들
import StatCard from '@/components/dashboard/StatCard';
import PendingPaymentBanner from '@/components/dashboard/PendingPaymentBanner';
import StudyCalendar from '@/components/dashboard/StudyCalendar';
import FeaturedCourseSlider from '@/components/dashboard/FeaturedCourseSlider';
import EnrolledCourseCard from '@/components/dashboard/EnrolledCourseCard';
import DeliveryStatusWidget from '@/components/dashboard/DeliveryStatusWidget';
import ZaloContactButton from '@/components/dashboard/ZaloContactButton';

export default function DashboardPage() {
  const router = useRouter();
  const { firebaseUser, userData, loading } = useAuth();
  const { t } = useLanguage();

  // 데이터 상태
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push('/login');
      } else if (userData) {
        fetchAllData();
      }
    }
  }, [loading, firebaseUser, userData, router]);

  const fetchAllData = async () => {
    if (!userData) return;

    try {
      // 코스 목록 가져오기
      const coursesSnapshot = await getDocs(
        query(collection(db, 'courses'), where('isActive', '==', true), orderBy('order', 'asc'))
      );
      const coursesData = coursesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Course[];
      setCourses(coursesData);

      // 챕터 목록 가져오기
      const chaptersSnapshot = await getDocs(
        query(collection(db, 'chapters'), orderBy('order', 'asc'))
      );
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Chapter[];
      setChapters(chaptersData);

      // 진도 데이터 가져오기
      const progressSnapshot = await getDocs(
        query(collection(db, 'progress'), where('userId', '==', userData.uid))
      );
      const progressDataArray = progressSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Progress[];
      setProgressData(progressDataArray);

      // 주문 데이터 가져오기
      const ordersSnapshot = await getDocs(
        query(collection(db, 'orders'), where('uid', '==', userData.uid), orderBy('createdAt', 'desc'))
      );
      const ordersData = ordersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/');
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    // 이번 주 학습 시간 (분)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let weeklyMinutes = 0;
    progressData.forEach(p => {
      const updateDate = p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt as any);
      if (updateDate >= weekStart) {
        weeklyMinutes += Math.floor((p.watchedDuration || 0) / 60);
      }
    });

    // 완료한 강의 수
    const completedLessons = progressData.filter(p => p.isCompleted).length;

    // 연속 학습 일수
    const dailyStudyMinutes: Record<string, number> = {};
    progressData.forEach(p => {
      if (!p.updatedAt) return;
      const date = p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt as any);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const minutes = Math.floor((p.watchedDuration || 0) / 60);
      dailyStudyMinutes[dateKey] = (dailyStudyMinutes[dateKey] || 0) + minutes;
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

      if ((dailyStudyMinutes[dateKey] || 0) >= STUDY_CONFIG.minStudyMinutes) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return { weeklyMinutes, completedLessons, streak };
  }, [progressData]);

  // 수강 중인 코스 목록
  const enrolledCourses = useMemo(() => {
    if (!userData?.courseSubscriptions) return [];

    return courses.filter(course => {
      const subscription = userData.courseSubscriptions?.[course.id];
      return subscription?.approved;
    });
  }, [courses, userData]);

  // 추천 코스 (isFeatured = true 또는 수강 중이 아닌 코스)
  const featuredCourses = useMemo(() => {
    const featured = courses.filter(course => course.isFeatured);
    if (featured.length > 0) return featured;
    return courses.filter(course => !enrolledCourses.find(e => e.id === course.id));
  }, [courses, enrolledCourses]);

  // 입금 대기 중인 주문
  const pendingOrder = useMemo(() => {
    return orders.find(order => order.status === 'PENDING_PAYMENT');
  }, [orders]);

  // 코스별 챕터 수 계산
  const getChapterCount = (courseId: string) => {
    return chapters.filter(ch => ch.courseId === courseId).length;
  };

  // 코스별 진도 데이터
  const getCourseProgress = (courseId: string) => {
    return progressData.filter(p => p.courseId === courseId);
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#4A5D4E] animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3ED] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E1D8]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-[#2D241E]">AJU E&J</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C857E]">Korean Academy</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {userData.role === 'admin' && (
                <Link href="/admin">
                  <button className="px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[#8C857E] hover:text-[#2D241E] border border-[#E5E1D8] rounded-lg hover:border-[#8C857E] transition-all">
                    {t('dashboard.admin')}
                  </button>
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F5F3ED] rounded-lg">
                <User className="w-4 h-4 text-[#8C857E]" />
                <span className="text-sm text-[#2D241E]">{userData.name}</span>
              </div>
              <LanguageToggle />
              <button
                onClick={handleSignOut}
                className="p-2 text-[#8C857E] hover:text-[#2D241E] hover:bg-[#F5F3ED] rounded-lg transition-all"
                title={t('common.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Hero Section - 인사말 + 통계 */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-1">
              {t('dashboard.welcomeBack')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D241E] mb-4">
              {t('dashboard.hello')}, {userData.name}!
            </h2>

            {/* 통계 카드 그리드 */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<Clock className="w-5 h-5 text-[#4A5D4E]" />}
                labelKey="dashboard.weeklyStudy"
                value={`${stats.weeklyMinutes}${t('dashboard.minutes')}`}
                iconBgColor="bg-[#4A5D4E]/10"
              />
              <StatCard
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                labelKey="dashboard.completedLessonsLabel"
                value={stats.completedLessons}
                subValue={`/ ${chapters.length} ${t('dashboard.lessonsProgress')}`}
                iconBgColor="bg-emerald-100"
                valueColor="text-emerald-600"
              />
              <StatCard
                icon={<Flame className="w-5 h-5 text-orange-500" />}
                labelKey="dashboard.streak"
                value={`${stats.streak}${t('dashboard.days')}`}
                iconBgColor="bg-orange-100"
                valueColor="text-orange-500"
              />
            </div>
          </div>

          {/* 입금 대기 배너 */}
          {pendingOrder && (
            <PendingPaymentBanner
              order={pendingOrder}
              userName={userData.name}
              onUpdate={fetchAllData}
            />
          )}

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#4A5D4E] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 메인 콘텐츠 영역 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 수강 중인 코스가 있는 경우 */}
                {enrolledCourses.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-[#2D241E] mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#4A5D4E]" />
                      {t('dashboard.myCourses')}
                    </h3>
                    <div className="space-y-4">
                      {enrolledCourses.map(course => {
                        const subscription = userData.courseSubscriptions?.[course.id];
                        if (!subscription) return null;

                        return (
                          <EnrolledCourseCard
                            key={course.id}
                            course={course}
                            subscription={subscription}
                            progressData={getCourseProgress(course.id)}
                            totalChapters={getChapterCount(course.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 수강 중인 코스가 없는 경우 - 추천 코스 */
                  <FeaturedCourseSlider courses={featuredCourses} />
                )}

                {/* 수강 중이면서 추천 코스도 있는 경우 */}
                {enrolledCourses.length > 0 && featuredCourses.length > 0 && (
                  <FeaturedCourseSlider courses={featuredCourses} />
                )}
              </div>

              {/* 사이드바 */}
              <div className="space-y-4">
                {/* 학습 캘린더 */}
                <StudyCalendar progressData={progressData} />

                {/* 배송 현황 */}
                <DeliveryStatusWidget orders={orders} />

                {/* Zalo 문의 */}
                <ZaloContactButton variant="full" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Zalo Button (모바일용) */}
      <div className="lg:hidden">
        <ZaloContactButton variant="floating" />
      </div>

      {/* Footer */}
      <footer className="bg-[#2D241E] text-[#F5F3ED] py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[#F5F3ED]/70 mb-2">{t('footer.copyright')}</p>
          <p className="text-xs text-[#F5F3ED]/50">{t('footer.disclaimer')}</p>
        </div>
      </footer>
    </div>
  );
}
