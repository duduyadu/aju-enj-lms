'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, Submission, Progress, User } from '@/types';
import {
  getProgressByChapter,
  initializeProgress,
  updateProgressWithTransaction,
  markVideoCompleteWithTransaction,
  updateProgress
} from '@/services/progressService';
import { getChapterById, getCourseById } from '@/services/courseService';
import toast from 'react-hot-toast';
import {
  BookOpen,
  ArrowLeft,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  XCircle,
  PlayCircle,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Clock,
  Play,
  Pause
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import LanguageToggle from '@/components/LanguageToggle';

// 코스별 접근 권한 확인 함수
function hasCourseAccess(userData: User | null, courseId: string): boolean {
  if (!userData) return false;

  const subscription = userData.courseSubscriptions?.[courseId];
  if (subscription?.approved) {
    if (!subscription.endDate) return true;
    const endDate = subscription.endDate instanceof Date
      ? subscription.endDate
      : new Date(subscription.endDate as any);
    if (endDate > new Date()) return true;
  }

  if (userData.isPaid && !userData.courseSubscriptions) {
    if (!userData.subscriptionEndDate) return true;
    const endDate = userData.subscriptionEndDate instanceof Date
      ? userData.subscriptionEndDate
      : new Date(userData.subscriptionEndDate as any);
    return endDate > new Date();
  }

  return false;
}

// 시간 포맷팅 함수
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// YouTube IFrame API 타입 선언
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.chapterId as string;
  const { userData, loading: authLoading, checkSessionValid } = useAuth();
  const { t } = useLanguage();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // 비디오 진행률 관련 상태
  const [watchedDuration, setWatchedDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressDocId, setProgressDocId] = useState<string | null>(null);

  // YouTube 플레이어 ref
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  useEffect(() => {
    const checkAccessAndLoad = async () => {
      if (!authLoading && !userData) {
        router.push('/login');
        return;
      }

      if (userData && chapterId) {
        const isValid = await checkSessionValid();
        if (!isValid) {
          router.push('/login');
          return;
        }

        try {
          const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
          if (!chapterDoc.exists()) {
            alert(t('learn.lessonNotFound') || '강의를 찾을 수 없습니다.');
            router.push('/dashboard');
            return;
          }

          const chapterData = { ...chapterDoc.data(), id: chapterDoc.id } as Chapter;
          const isFirstChapter = chapterData.order === 1;

          if (!isFirstChapter && !hasCourseAccess(userData, chapterData.courseId)) {
            alert(`${t('payment.needPermission')}\n${t('payment.firstFree')}`);
            router.push(`/courses/${chapterData.courseId}`);
            return;
          }

          fetchChapterData();
        } catch (error) {
          console.error('Error checking chapter access:', error);
          router.push('/dashboard');
        }
      }
    };

    checkAccessAndLoad();
  }, [userData, authLoading, chapterId, router, checkSessionValid]);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (!chapter) return;

    // YouTube API 스크립트 로드
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [chapter]);

  const initializePlayer = useCallback(() => {
    if (!chapter || !playerContainerRef.current) return;

    const videoId = extractYouTubeId(chapter.videoUrl);
    if (!videoId) return;

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      videoId: videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  }, [chapter]);

  const onPlayerReady = (event: any) => {
    const duration = event.target.getDuration();
    setTotalDuration(duration);

    // 이전 시청 위치로 이동 (저장된 진행률이 있으면)
    if (watchedDuration > 0 && watchedDuration < duration) {
      event.target.seekTo(watchedDuration, true);
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      stopProgressTracking();
      saveProgress();
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
      handleVideoComplete();
    }
  };

  const startProgressTracking = () => {
    if (saveIntervalRef.current) return;

    saveIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        setWatchedDuration(currentTime);
        setTotalDuration(duration);

        const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
        setWatchedPercent(percent);

        // 10초마다 저장 (마지막 저장 시간과 비교)
        if (currentTime - lastSavedTimeRef.current >= 10) {
          saveProgress(currentTime, duration, percent);
          lastSavedTimeRef.current = currentTime;
        }
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  };

  const saveProgress = async (currentTime?: number, duration?: number, percent?: number) => {
    if (!userData || !chapter || !progressDocId) return;

    const watchTime = currentTime ?? (playerRef.current?.getCurrentTime() || watchedDuration);
    const totalTime = duration ?? (playerRef.current?.getDuration() || totalDuration);
    const watchPercent = percent ?? (totalTime > 0 ? Math.round((watchTime / totalTime) * 100) : 0);

    try {
      // Transaction을 사용하여 동시성 문제 해결
      await updateProgressWithTransaction(
        progressDocId,
        watchTime,
        totalTime,
        watchPercent
      );
    } catch (error) {
      console.error('Error saving progress:', error);
      // 진행률 저장 실패는 사용자에게 알리지 않음 (자동 저장이므로)
    }
  };

  const handleVideoComplete = async () => {
    if (!userData || !chapter || !progressDocId) return;

    try {
      // Transaction을 사용하여 동시성 문제 해결
      await markVideoCompleteWithTransaction(progressDocId, totalDuration);
      setWatchedPercent(100);
    } catch (error) {
      console.error('Error marking video as complete:', error);
    }
  };

  const fetchChapterData = async () => {
    try {
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      if (!chapterDoc.exists()) {
        alert(t('learn.lessonNotFound') || '강의를 찾을 수 없습니다.');
        router.push('/dashboard');
        return;
      }

      const chapterData = { ...chapterDoc.data(), id: chapterDoc.id } as Chapter;
      setChapter(chapterData);

      if (chapterData.quiz) {
        setAnswers(new Array(chapterData.quiz.questions.length).fill(-1));
      }

      const courseDoc = await getDoc(doc(db, 'courses', chapterData.courseId));
      if (courseDoc.exists()) {
        setCourse({ ...courseDoc.data(), id: courseDoc.id } as Course);
      }

      await initializeProgress(chapterData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProgress = async (chapterData: Chapter) => {
    if (!userData) return;

    try {
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', userData.uid),
        where('chapterId', '==', chapterId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const docRef = await addDoc(collection(db, 'progress'), {
          userId: userData.uid,
          courseId: chapterData.courseId,
          chapterId: chapterId,
          isCompleted: false,
          watchedDuration: 0,
          totalDuration: 0,
          watchedPercent: 0,
          lastWatchedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setProgressDocId(docRef.id);
      } else {
        const progressDoc = snapshot.docs[0];
        const progressData = progressDoc.data();
        setProgressDocId(progressDoc.id);
        setWatchedDuration(progressData.watchedDuration || 0);
        setTotalDuration(progressData.totalDuration || 0);
        setWatchedPercent(progressData.watchedPercent || 0);

        await updateDoc(doc(db, 'progress', progressDoc.id), {
          lastWatchedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error initializing progress:', error);
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : '';
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleQuizSubmit = async () => {
    if (!chapter?.quiz || !userData) return;

    if (answers.includes(-1)) {
      toast.error(t('learn.answerAll') || '모든 문제에 답해주세요.');
      return;
    }

    setSubmitted(true);

    let correctCount = 0;
    chapter.quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / chapter.quiz.questions.length) * 100);
    setScore(calculatedScore);
    setShowResults(true);

    try {
      await addDoc(collection(db, 'submissions'), {
        userId: userData.uid,
        chapterId: chapterId,
        courseId: chapter.courseId,
        answers: answers,
        score: calculatedScore,
        createdAt: serverTimestamp()
      });

      if (progressDocId) {
        await updateProgress(progressDocId, { isCompleted: true });
      }

      toast.success(t('learn.quizComplete') || '퀴즈를 완료했습니다!');
    } catch (error) {
      console.error('Error saving submission:', error);
      toast.error(t('errors.saveQuiz') || '퀴즈 저장에 실패했습니다.');
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!chapter || !course) {
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
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F5F3ED] rounded-lg">
                <UserIcon className="w-4 h-4 text-[#8C857E]" />
                <span className="text-sm text-[#2D241E]">{userData?.name}</span>
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
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#8C857E] hover:text-[#4A5D4E] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t('learn.backToDashboard')}</span>
            </Link>
          </div>

          {/* Chapter Title */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-2">{t('learn.lesson')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D241E]">{chapter.title}</h2>
          </div>

          {/* Video Player */}
          <div className="bg-[#2D241E] rounded-2xl overflow-hidden mb-4 shadow-lg">
            <div className="relative pb-[56.25%] h-0">
              <div
                ref={playerContainerRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isPlaying ? 'bg-[#4A5D4E]' : 'bg-[#F5F3ED]'
                }`}>
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-[#8C857E]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D241E]">
                    {watchedPercent >= 100 ? '시청 완료!' : '시청 진행률'}
                  </p>
                  <p className="text-xs text-[#8C857E]">
                    {formatTime(watchedDuration)} / {formatTime(totalDuration)} 시청
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#4A5D4E]">{watchedPercent}%</p>
                {watchedPercent >= 100 && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#4A5D4E]">
                    <CheckCircle2 className="w-3 h-3" />
                    완료
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-3 bg-[#F5F3ED] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4A5D4E] to-[#6B8F71] rounded-full transition-all duration-500"
                style={{ width: `${watchedPercent}%` }}
              />
            </div>
          </div>

          {/* Quiz Section */}
          {chapter.quiz && (
            <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden">
              {/* Quiz Header */}
              <div className="bg-[#4A5D4E] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('learn.quiz')}</h3>
                    <p className="text-white/70 text-sm">{t('learn.quizDescription')}</p>
                  </div>
                </div>
              </div>

              {/* Quiz Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {chapter.quiz.questions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="bg-[#F5F3ED] rounded-xl p-5 border border-[#E5E1D8]"
                    >
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4A5D4E] text-white rounded-full text-xs font-semibold mb-3">
                          <PlayCircle className="w-3.5 h-3.5" />
                          {t('learn.question')} {qIndex + 1}
                        </span>
                        <p className="text-lg font-medium text-[#2D241E]">
                          {question.text}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <label
                            key={oIndex}
                            className={`
                              flex items-center p-4 rounded-xl border cursor-pointer transition-all
                              ${answers[qIndex] === oIndex
                                ? 'bg-[#4A5D4E]/10 border-[#4A5D4E]'
                                : 'bg-white border-[#E5E1D8] hover:border-[#4A5D4E]/50'
                              }
                              ${submitted ? 'cursor-not-allowed' : ''}
                              ${showResults && oIndex === question.correctAnswer ? 'bg-green-50 border-green-500' : ''}
                              ${showResults && answers[qIndex] === oIndex && oIndex !== question.correctAnswer ? 'bg-red-50 border-red-500' : ''}
                            `}
                          >
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              checked={answers[qIndex] === oIndex}
                              onChange={() => handleAnswerChange(qIndex, oIndex)}
                              disabled={submitted}
                              className="sr-only"
                            />
                            <div className={`
                              w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0
                              ${answers[qIndex] === oIndex
                                ? 'border-[#4A5D4E] bg-[#4A5D4E]'
                                : 'border-[#8C857E]'
                              }
                              ${showResults && oIndex === question.correctAnswer ? 'border-green-500 bg-green-500' : ''}
                              ${showResults && answers[qIndex] === oIndex && oIndex !== question.correctAnswer ? 'border-red-500 bg-red-500' : ''}
                            `}>
                              {(answers[qIndex] === oIndex || (showResults && oIndex === question.correctAnswer)) && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="flex-1 text-[#2D241E]">{option}</span>

                            {showResults && (
                              <>
                                {oIndex === question.correctAnswer && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-2" />
                                )}
                                {answers[qIndex] === oIndex && oIndex !== question.correctAnswer && (
                                  <XCircle className="w-5 h-5 text-red-600 ml-2" />
                                )}
                              </>
                            )}
                          </label>
                        ))}
                      </div>

                      {showResults && question.explanation && (
                        <div className="mt-4 p-4 bg-[#4A5D4E]/10 rounded-xl border border-[#4A5D4E]/20">
                          <p className="text-sm font-semibold text-[#4A5D4E] mb-1">{t('learn.explanation')}</p>
                          <p className="text-sm text-[#2D241E]">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit Button or Results */}
                <div className="mt-8">
                  {!submitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#4A5D4E] text-white rounded-xl font-medium hover:bg-[#3A4D3E] transition-all"
                    >
                      {t('learn.submitQuiz')}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="bg-[#4A5D4E] rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t('learn.quizComplete')}
                      </h3>
                      <p className="text-4xl font-bold text-[#D4AF37] mb-4">
                        {score}{t('learn.score')}
                      </p>
                      <p className="text-white/80 mb-6">
                        {score! >= 80 ? t('learn.excellent') :
                         score! >= 60 ? t('learn.good') :
                         t('learn.tryAgain')}
                      </p>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#4A5D4E] rounded-xl font-medium hover:bg-[#F5F3ED] transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {t('learn.backToDashboard')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Brand Footer Card */}
          <div className="mt-8 p-5 bg-white rounded-2xl border border-[#E5E1D8] shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <p className="text-[#2D241E] font-medium">
                {t('learn.growWithUs')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E1D8] py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E]">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}
