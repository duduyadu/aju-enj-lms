'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import {
  BookOpen,
  Lock,
  LogOut,
  User,
  PlayCircle,
  MessageCircle,
  HelpCircle,
  GraduationCap,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ChapterData {
  id: string;
  title: string;
  courseId: string;
  order: number;
  videoUrl?: string;
  quiz?: {
    questions: any[];
  };
}

interface ProgressData {
  chapterId: string;
  isCompleted: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { firebaseUser, userData, loading } = useAuth();
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useSessionManager();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    } else if (userData) {
      fetchData();
    }
  }, [loading, firebaseUser, userData, router]);

  const fetchData = async () => {
    if (!userData) return;

    try {
      // Fetch chapters
      const chaptersSnapshot = await getDocs(
        query(collection(db, 'chapters'), orderBy('order', 'asc'))
      );
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChapterData[];
      setChapters(chaptersData);

      // Fetch user progress
      const progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', userData.uid)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const progressData = progressSnapshot.docs.map(doc => doc.data()) as ProgressData[];
      setProgress(progressData);
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
    }
  };

  const isChapterCompleted = (chapterId: string) => {
    return progress.some(p => p.chapterId === chapterId && p.isCompleted);
  };

  const completedCount = progress.filter(p => p.isCompleted).length;
  const totalCount = chapters.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F3ED] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E1D8]">
        <div className="max-w-5xl mx-auto px-4 py-4">
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

            <div className="flex items-center gap-3">
              {userData.role === 'admin' && (
                <Link href="/admin">
                  <button className="px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[#8C857E] hover:text-[#2D241E] border border-[#E5E1D8] rounded-lg hover:border-[#8C857E] transition-all">
                    Admin
                  </button>
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3ED] rounded-lg">
                <User className="w-4 h-4 text-[#8C857E]" />
                <span className="text-sm text-[#2D241E] hidden sm:inline">{userData.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-[#8C857E] hover:text-[#2D241E] hover:bg-[#F5F3ED] rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-2">Welcome Back</p>
            <h2 className="text-3xl font-bold text-[#2D241E] mb-2">
              안녕하세요, {userData.name}님!
            </h2>
            <p className="text-[#8C857E]">오늘도 한국어 학습을 시작해볼까요?</p>
          </div>

          {/* Progress Overview */}
          {userData.isPaid && totalCount > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E1D8] p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E] mb-1">My Progress</p>
                  <p className="text-2xl font-bold text-[#2D241E]">{progressPercent}% 완료</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#8C857E]">{completedCount} / {totalCount} 강의</p>
                </div>
              </div>
              <div className="w-full h-2 bg-[#F5F3ED] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A5D4E] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Payment Status - 미결제 시 */}
          {!userData.isPaid && (
            <div className="bg-[#FEF3E2] border border-[#F59E0B]/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#92400E] mb-1">결제 대기 중</h3>
                  <p className="text-sm text-[#B45309] mb-4">
                    강의를 시청하려면 관리자의 승인이 필요합니다. Zalo로 문의해주세요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://zalo.me/ajuenj"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A5D4E] text-white rounded-lg text-sm font-medium hover:bg-[#3A4D3E] transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Zalo 문의하기
                    </a>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#92400E] rounded-lg text-sm font-medium border border-[#F59E0B]/30 hover:bg-[#FEF3E2] transition-all">
                      <HelpCircle className="w-4 h-4" />
                      결제 가이드
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapters Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E] mb-1">Lessons</p>
                <h3 className="text-xl font-bold text-[#2D241E]">강의 목록</h3>
              </div>
              <span className="text-sm text-[#8C857E]">총 {totalCount}개 강의</span>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin" />
              </div>
            ) : chapters.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E1D8] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F5F3ED] flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-[#8C857E]" />
                </div>
                <p className="text-[#8C857E]">아직 등록된 강의가 없습니다.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {chapters.map((chapter, index) => {
                  const completed = isChapterCompleted(chapter.id);
                  const locked = !userData.isPaid;

                  return (
                    <div
                      key={chapter.id}
                      onClick={() => {
                        if (!locked) {
                          router.push(`/learn/${chapter.id}`);
                        }
                      }}
                      className={`
                        bg-white rounded-2xl border border-[#E5E1D8] p-5
                        transition-all duration-300 cursor-pointer
                        ${locked ? 'opacity-60' : 'hover:shadow-lg hover:border-[#4A5D4E]/30 hover:-translate-y-1'}
                        ${completed ? 'border-[#4A5D4E]/50' : ''}
                      `}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4A5D4E] text-white rounded-full text-xs font-semibold">
                          <PlayCircle className="w-3.5 h-3.5" />
                          강의 {index + 1}
                        </span>
                        {locked ? (
                          <Lock className="w-5 h-5 text-[#8C857E]" />
                        ) : completed ? (
                          <div className="w-6 h-6 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#F5F3ED] flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#8C857E]" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-[#2D241E] mb-2 line-clamp-2">
                        {chapter.title}
                      </h4>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-sm text-[#8C857E]">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          퀴즈 {chapter.quiz?.questions?.length || 0}개
                        </span>
                        {completed && (
                          <span className="text-[#4A5D4E] font-medium">완료됨</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E1D8] py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E]">
            © 2024 AJU E&J. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
