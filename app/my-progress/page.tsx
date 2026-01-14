'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Progress, Submission, Course, Chapter } from '@/types';

export default function MyProgressPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">내 학습 현황</h1>

        {/* 전체 통계 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">완료한 강의</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.filter(p => p.isCompleted).length}개
                </p>
              </div>
              <span className="text-3xl">📚</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">제출한 퀴즈</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.length}개
                </p>
              </div>
              <span className="text-3xl">✏️</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.length > 0
                    ? Math.round(
                        submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length
                      )
                    : 0}
                  점
                </p>
              </div>
              <span className="text-3xl">🎯</span>
            </div>
          </div>
        </div>

        {/* 코스별 진도 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">코스별 진도</h2>

          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              등록된 코스가 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map(course => {
                const completed = getCompletedCount(course.id);
                const total = getChapterCount(course.id);
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                const avgScore = getAverageScore(course.id);

                return (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800">{course.title}</h3>
                      <span className="text-sm text-gray-600">
                        {completed}/{total} 완료
                      </span>
                    </div>

                    {/* 진도바 */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div
                        className="bg-aju-sky h-2.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">진도율: {percentage}%</span>
                      {avgScore > 0 && (
                        <span className="text-gray-600">평균 점수: {avgScore}점</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 최근 퀴즈 결과 */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">최근 퀴즈 결과</h2>

          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 제출한 퀴즈가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      챕터
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      점수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      제출일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.slice(0, 5).map(submission => {
                    const chapter = chapters.find(c => c.id === submission.chapterId);
                    const submittedAt = submission.createdAt instanceof Date
                      ? submission.createdAt
                      : new Date(submission.createdAt as any);

                    return (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {chapter?.title || '알 수 없음'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${
                            submission.score >= 80
                              ? 'text-green-600'
                              : submission.score >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {submission.score}점
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {submittedAt.toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}