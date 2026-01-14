'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import Link from 'next/link';

export default function CoursesPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
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
      const q = query(collection(db, 'courses'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const courseData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Course));

      // 순서대로 정렬
      courseData.sort((a, b) => a.order - b.order);
      setCourses(courseData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">강의 목록</h1>
          <p className="text-gray-600">
            AJU E&J가 제공하는 베트남 유학생 전용 교육 콘텐츠
          </p>
        </div>

        {/* 권한 확인 알림 */}
        {!userData.isPaid && (
          <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-900 mb-1">수강 권한 대기 중</h3>
                <p className="text-yellow-800">
                  관리자의 승인을 기다리고 있습니다. 승인 후 모든 강의를 시청할 수 있습니다.
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  문의: admin@ajuenj.com
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 코스 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">강의를 불러오는 중...</div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">등록된 강의가 없습니다.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* 썸네일 */}
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-aju-navy to-aju-sky flex items-center justify-center">
                    <span className="text-white text-6xl">📚</span>
                  </div>
                )}

                {/* 코스 정보 */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {userData.isPaid ? (
                    <Link
                      href={`/courses/${course.id}`}
                      className="block w-full text-center px-4 py-2 bg-aju-navy text-white rounded-lg hover:bg-opacity-90 transition"
                    >
                      강의 시작하기
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="block w-full text-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      승인 대기 중
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 브랜드 강조 섹션 */}
        <div className="mt-12 p-6 bg-gradient-to-r from-aju-navy to-blue-900 rounded-xl text-white">
          <h2 className="text-2xl font-bold text-aju-gold mb-3">AJU E&J Education</h2>
          <p className="text-gray-200 mb-4">
            베트남 유학생의 성공적인 한국 생활을 위한 맞춤형 교육 프로그램
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <span>체계적인 커리큘럼</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <span>실무 중심 교육</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">📱</span>
              <span>언제 어디서나 학습</span>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}