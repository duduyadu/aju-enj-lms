'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course } from '@/types';
import Link from 'next/link';

export default function ChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { userData, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (userData && !userData.isPaid) {
      alert('수강 권한이 없습니다. 관리자 승인을 기다려주세요.');
      router.push('/courses');
    } else if (userData && courseId) {
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userData || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
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
              className="text-blue-600 hover:text-blue-800 mr-3"
            >
              ← 코스 목록
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* 챕터 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            강의 목차 ({chapters.length}개)
          </h2>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 강의가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/learn/${chapter.id}`}
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-aju-navy text-white rounded-lg flex items-center justify-center font-bold mr-4">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {chapter.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            {chapter.duration && (
                              <span>⏱ {chapter.duration}분</span>
                            )}
                            {chapter.quiz && (
                              <span className="text-green-600">
                                ✓ 퀴즈 {chapter.quiz.questions.length}문제
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-aju-sky">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AJU E&J 학습 안내 */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl">
          <h3 className="font-bold text-blue-900 mb-2">📚 AJU E&J 학습 가이드</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 각 강의를 순서대로 수강하는 것을 권장합니다</li>
            <li>• 강의 시청 후 퀴즈를 풀어 학습 내용을 확인하세요</li>
            <li>• 모든 학습 기록은 자동으로 저장됩니다</li>
            <li>• 문의사항은 admin@ajuenj.com으로 연락주세요</li>
          </ul>
        </div>
      </div>
    </StudentLayout>
  );
}