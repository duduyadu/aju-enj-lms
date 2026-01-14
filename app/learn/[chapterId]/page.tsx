'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, Submission, Progress } from '@/types';
import {
  BookOpen,
  ArrowLeft,
  User,
  LogOut,
  CheckCircle2,
  XCircle,
  PlayCircle,
  GraduationCap,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.chapterId as string;
  const { userData, loading: authLoading } = useAuth();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (userData && !userData.isPaid) {
      alert('수강 권한이 없습니다. 관리자 승인을 기다려주세요.');
      router.push('/dashboard');
    } else if (userData && chapterId) {
      fetchChapterData();
    }
  }, [userData, authLoading, chapterId, router]);

  const fetchChapterData = async () => {
    try {
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      if (!chapterDoc.exists()) {
        alert('강의를 찾을 수 없습니다.');
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

      await updateProgress(chapterData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (chapterData: Chapter) => {
    if (!userData) return;

    try {
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', userData.uid),
        where('chapterId', '==', chapterId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, 'progress'), {
          userId: userData.uid,
          courseId: chapterData.courseId,
          chapterId: chapterId,
          isCompleted: false,
          watchedDuration: 0,
          lastWatchedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const progressDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'progress', progressDoc.id), {
          lastWatchedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
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
      alert('모든 문제에 답해주세요.');
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

      const q = query(
        collection(db, 'progress'),
        where('userId', '==', userData.uid),
        where('chapterId', '==', chapterId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const progressDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'progress', progressDoc.id), {
          isCompleted: true,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving submission:', error);
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
          <p className="text-[#8C857E] text-sm">강의를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!chapter || !course) {
    return null;
  }

  const youtubeId = extractYouTubeId(chapter.videoUrl);

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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3ED] rounded-lg">
                <User className="w-4 h-4 text-[#8C857E]" />
                <span className="text-sm text-[#2D241E] hidden sm:inline">{userData?.name}</span>
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
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#8C857E] hover:text-[#4A5D4E] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">대시보드로 돌아가기</span>
            </Link>
          </div>

          {/* Chapter Title */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-2">Lesson</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D241E]">{chapter.title}</h2>
          </div>

          {/* Video Player */}
          <div className="bg-[#2D241E] rounded-2xl overflow-hidden mb-8 shadow-lg">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title={chapter.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onEnded={() => setVideoEnded(true)}
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
                    <h3 className="text-lg font-bold text-white">학습 확인 퀴즈</h3>
                    <p className="text-white/70 text-sm">강의 내용을 잘 이해했는지 확인해보세요</p>
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
                          문제 {qIndex + 1}
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
                          <p className="text-sm font-semibold text-[#4A5D4E] mb-1">해설</p>
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
                      퀴즈 제출하기
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="bg-[#4A5D4E] rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        퀴즈 완료!
                      </h3>
                      <p className="text-4xl font-bold text-[#D4AF37] mb-4">
                        {score}점
                      </p>
                      <p className="text-white/80 mb-6">
                        {score! >= 80 ? '훌륭합니다! 다음 강의로 진행하세요.' :
                         score! >= 60 ? '좋습니다! 복습하면 더 좋을 것 같아요.' :
                         '다시 한번 강의를 시청해보세요.'}
                      </p>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#4A5D4E] rounded-xl font-medium hover:bg-[#F5F3ED] transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        대시보드로 돌아가기
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
                AJU E&J와 함께 성장하세요! 모든 학습 기록은 자동 저장됩니다.
              </p>
            </div>
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
