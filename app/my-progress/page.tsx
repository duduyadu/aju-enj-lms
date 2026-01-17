'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import StudentLayout from '@/components/StudentLayout';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Progress, Submission, Course, Chapter } from '@/types';
import { BookOpen, FileText, Target, TrendingUp } from 'lucide-react';

export default function MyProgressPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (userData) {
      fetchAllData();
    }
  }, [userData, authLoading, router]);

  const fetchAllData = async () => {
    if (!userData) return;

    try {
      // 진도 데이터
      const progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', userData.uid)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const progressData = progressSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Progress));
      setProgress(progressData);

      // 제출 데이터
      const submissionQuery = query(
        collection(db, 'submissions'),
        where('userId', '==', userData.uid)
      );
      const submissionSnapshot = await getDocs(submissionQuery);
      const submissionData = submissionSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Submission));
      setSubmissions(submissionData);

      // 코스 데이터
      const courseSnapshot = await getDocs(collection(db, 'courses'));
      const courseData = courseSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Course));
      setCourses(courseData);

      // 챕터 데이터
      const chapterSnapshot = await getDocs(collection(db, 'chapters'));
      const chapterData = chapterSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Chapter));
      setChapters(chapterData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedCount = (courseId: string) => {
    return progress.filter(p => p.courseId === courseId && p.isCompleted).length;
  };

  const getChapterCount = (courseId: string) => {
    return chapters.filter(c => c.courseId === courseId).length;
  };

  const getAverageScore = (courseId: string) => {
    const courseSubmissions = submissions.filter(s => s.courseId === courseId);
    if (courseSubmissions.length === 0) return 0;
    const total = courseSubmissions.reduce((acc, s) => acc + s.score, 0);
    return Math.round(total / courseSubmissions.length);
  };

  if (authLoading || loading || !userData) {
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
        <h1 className="text-3xl font-serif font-bold text-[#2D241E] mb-8">{t('progress.title')}</h1>

        {/* 전체 통계 - 퀴즈 관련 통계 숨김으로 1개만 표시 */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8C857E]">{t('progress.completedLessons')}</p>
                <p className="text-2xl font-bold text-[#2D241E]">
                  {progress.filter(p => p.isCompleted).length}{t('progress.count')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#4A5D4E]/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#4A5D4E]" />
              </div>
            </div>
          </div>

          {/* 퀴즈 통계 카드들 비활성화 */}
          {/* <div className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8C857E]">{t('progress.submittedQuizzes')}</p>
                <p className="text-2xl font-bold text-[#2D241E]">
                  {submissions.length}{t('progress.count')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8C857E]">{t('progress.averageScore')}</p>
                <p className="text-2xl font-bold text-[#2D241E]">
                  {submissions.length > 0
                    ? Math.round(
                        submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length
                      )
                    : 0}
                  {t('progress.points')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#4A5D4E]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#4A5D4E]" />
              </div>
            </div>
          </div> */}
        </div>

        {/* 코스별 진도 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-[#4A5D4E]" />
            <h2 className="text-xl font-semibold text-[#2D241E]">{t('progress.progressByCourse')}</h2>
          </div>

          {courses.length === 0 ? (
            <p className="text-[#8C857E] text-center py-8">
              {t('progress.noCourses')}
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map(course => {
                const completed = getCompletedCount(course.id);
                const total = getChapterCount(course.id);
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                const avgScore = getAverageScore(course.id);

                return (
                  <div key={course.id} className="border border-[#E5E1D8] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-[#2D241E]">{course.title}</h3>
                      <span className="text-sm text-[#8C857E]">
                        {completed}/{total} {t('progress.completed')}
                      </span>
                    </div>

                    {/* 진도바 */}
                    <div className="w-full bg-[#E5E1D8] rounded-full h-2.5 mb-3">
                      <div
                        className="bg-[#4A5D4E] h-2.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-[#8C857E]">{t('progress.progressRate')}: {percentage}%</span>
                      {/* 퀴즈 평균 점수 비활성화 */}
                      {/* {avgScore > 0 && (
                        <span className="text-[#8C857E]">{t('progress.averageScore')}: {avgScore}{t('progress.points')}</span>
                      )} */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 최근 퀴즈 결과 - 퀴즈 기능 비활성화 */}
        {false && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-5 h-5 text-[#4A5D4E]" />
            <h2 className="text-xl font-semibold text-[#2D241E]">{t('progress.recentQuizResults')}</h2>
          </div>

          {submissions.length === 0 ? (
            <p className="text-[#8C857E] text-center py-8">
              {t('progress.noQuizzes')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F3ED]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8C857E] uppercase tracking-wider">
                      {t('progress.chapter')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8C857E] uppercase tracking-wider">
                      {t('progress.score')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8C857E] uppercase tracking-wider">
                      {t('progress.submittedDate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E1D8]">
                  {submissions.slice(0, 5).map(submission => {
                    const chapter = chapters.find(c => c.id === submission.chapterId);
                    const submittedAt = submission.createdAt instanceof Date
                      ? submission.createdAt
                      : new Date(submission.createdAt as any);

                    return (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 text-sm text-[#2D241E]">
                          {chapter?.title || t('progress.unknown')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${
                            submission.score >= 80
                              ? 'text-[#4A5D4E]'
                              : submission.score >= 60
                              ? 'text-[#D4AF37]'
                              : 'text-red-600'
                          }`}>
                            {submission.score}{t('progress.points')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8C857E]">
                          {submittedAt.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>
    </StudentLayout>
  );
}
