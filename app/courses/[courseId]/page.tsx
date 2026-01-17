'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, User, Progress } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, ChevronRight, BookOpen, Info, Lock, Play } from 'lucide-react';

// 시간 포맷팅 함수
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 코스별 접근 권한 확인 함수
function hasCourseAccess(userData: User | null, courseId: string): boolean {
  if (!userData) return false;

  // 코스별 구독 확인
  const subscription = userData.courseSubscriptions?.[courseId];
  if (subscription?.approved) {
    if (!subscription.endDate) return true; // 무제한
    const endDate = subscription.endDate instanceof Date
      ? subscription.endDate
      : new Date(subscription.endDate as any);
    if (endDate > new Date()) return true;
  }

  // 레거시: 기존 isPaid 사용자는 모든 코스 접근 가능
  if (userData.isPaid && !userData.courseSubscriptions) {
    if (!userData.subscriptionEndDate) return true; // 무제한
    const endDate = userData.subscriptionEndDate instanceof Date
      ? userData.subscriptionEndDate
      : new Date(userData.subscriptionEndDate as any);
    return endDate > new Date();
  }

  return false;
}

interface ProgressData {
  chapterId: string;
  isCompleted: boolean;
  watchedDuration: number;
  totalDuration: number;
  watchedPercent: number;
}

export default function ChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { userData, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (userData && courseId) {
      // 모든 유저가 코스 상세를 볼 수 있음 (1강은 무료)
      fetchCourseData();
    }
  }, [userData, authLoading, courseId, router]);

  const fetchCourseData = async () => {
    try {
      // 코스 정보 가져오기
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse({ ...courseDoc.data(), id: courseDoc.id } as Course);
      } else {
        alert('코스를 찾을 수 없습니다.');
        router.push('/courses');
        return;
      }

      // 챕터 목록 가져오기
      const q = query(collection(db, 'chapters'), where('courseId', '==', courseId));
      const snapshot = await getDocs(q);
      const chapterData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Chapter));

      // 순서대로 정렬
      chapterData.sort((a, b) => a.order - b.order);
      setChapters(chapterData);

      // 진행률 데이터 가져오기
      if (userData) {
        const progressQuery = query(
          collection(db, 'progress'),
          where('userId', '==', userData.uid),
          where('courseId', '==', courseId)
        );
        const progressSnapshot = await getDocs(progressQuery);
        const progressData = progressSnapshot.docs.map(doc => doc.data()) as ProgressData[];
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChapterProgress = (chapterId: string): ProgressData | undefined => {
    return progress.find((p) => p.chapterId === chapterId);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 코스 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/courses"
              className="flex items-center gap-2 text-[#4A5D4E] hover:text-[#3a4a3e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">코스 목록</span>
            </Link>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2D241E] mb-2">{course.title}</h1>
          <p className="text-[#8C857E]">{course.description}</p>
        </div>

        {/* 챕터 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-[#4A5D4E]" />
            <h2 className="text-xl font-semibold text-[#2D241E]">
              강의 목차 ({chapters.length}개)
            </h2>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-[#8C857E]">
              등록된 강의가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter, index) => {
                const isFirstChapter = chapter.order === 1;
                const canAccess = hasCourseAccess(userData, courseId) || isFirstChapter;
                const chapterProgress = getChapterProgress(chapter.id);
                const watchedPercent = chapterProgress?.watchedPercent || 0;
                const watchedDuration = chapterProgress?.watchedDuration || 0;
                const totalDuration = chapterProgress?.totalDuration || 0;
                const isCompleted = chapterProgress?.isCompleted || false;

                const ChapterContent = (
                  <div className={`border rounded-lg p-4 transition-colors ${
                    canAccess
                      ? 'border-[#E5E1D8] hover:bg-[#F5F3ED] cursor-pointer group'
                      : 'border-[#E5E1D8] bg-[#F5F3ED]/50 opacity-75'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold mr-4 text-lg ${
                          isCompleted
                            ? 'bg-[#4A5D4E] text-white'
                            : isFirstChapter
                              ? 'bg-[#D4AF37] text-white'
                              : canAccess
                                ? 'bg-[#4A5D4E] text-white'
                                : 'bg-[#8C857E] text-white'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold transition-colors ${
                              canAccess
                                ? 'text-[#2D241E] group-hover:text-[#4A5D4E]'
                                : 'text-[#8C857E]'
                            }`}>
                              {chapter.title}
                            </h3>
                            {isFirstChapter && (
                              <span className="px-2 py-0.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full uppercase">
                                무료
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-[#4A5D4E] text-white text-[10px] font-bold rounded-full">
                                완료
                              </span>
                            )}
                            {!canAccess && (
                              <span className="px-2 py-0.5 bg-[#8C857E] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                승인 필요
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-[#8C857E]">
                            {chapter.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {chapter.duration}분
                              </span>
                            )}
                            {chapter.quiz && (
                              <span className="flex items-center gap-1 text-[#4A5D4E]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                퀴즈 {chapter.quiz.questions.length}문제
                              </span>
                            )}
                          </div>

                          {/* 진행률 표시 */}
                          {canAccess && (watchedPercent > 0 || isCompleted) && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[#8C857E]">
                                  {formatTime(watchedDuration)} / {formatTime(totalDuration)}
                                </span>
                                <span className={`text-[10px] font-medium ${
                                  isCompleted ? 'text-[#4A5D4E]' : 'text-[#D4AF37]'
                                }`}>
                                  {Math.round(watchedPercent)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#F5F3ED] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isCompleted ? 'bg-[#4A5D4E]' : 'bg-[#D4AF37]'
                                  }`}
                                  style={{ width: `${Math.min(watchedPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`transition-colors ${
                        canAccess
                          ? 'text-[#8C857E] group-hover:text-[#4A5D4E]'
                          : 'text-[#8C857E]'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-[#4A5D4E]" />
                        ) : canAccess ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                );

                return canAccess ? (
                  <Link key={chapter.id} href={`/learn/${chapter.id}`} className="block">
                    {ChapterContent}
                  </Link>
                ) : (
                  <div key={chapter.id} onClick={() => alert('수강 권한이 필요합니다. 관리자 승인을 기다려주세요.')}>
                    {ChapterContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AJU E&J 학습 안내 */}
        <div className="mt-8 p-6 bg-[#4A5D4E]/5 border border-[#4A5D4E]/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#4A5D4E] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#2D241E] mb-3">AJU E&J 학습 가이드</h3>
              <ul className="text-sm text-[#8C857E] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  각 강의를 순서대로 수강하는 것을 권장합니다
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  강의 시청 후 퀴즈를 풀어 학습 내용을 확인하세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  모든 학습 기록은 자동으로 저장됩니다
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  문의사항은 admin@ajuenj.com으로 연락주세요
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
