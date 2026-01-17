'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  MessageCircle,
  Plus,
  Video,
  ChevronRight,
  Edit3,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

// 구독 상태 계산 유틸리티 함수
function getSubscriptionStatus(user: User): {
  status: 'active' | 'expired' | 'pending';
} {
  if (!user.subscriptionEndDate) {
    if (user.isPaid) {
      return { status: 'active' };
    }
    return { status: 'pending' };
  }

  const endDate = user.subscriptionEndDate instanceof Date
    ? user.subscriptionEndDate
    : new Date(user.subscriptionEndDate as any);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining > 0) {
    return { status: 'active' };
  } else {
    return { status: 'expired' };
  }
}

interface ChapterData {
  id: string;
  title: string;
  order: number;
  courseId: string;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'students' | 'content'>('students');
  const [students, setStudents] = useState<User[]>([]);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      const studentData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as User));
      studentData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      });
      setStudents(studentData);

      // Fetch chapters
      const chaptersSnapshot = await getDocs(
        query(collection(db, 'chapters'), orderBy('order', 'asc'))
      );
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChapterData[];
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통계
  const stats = {
    total: students.length,
    pending: students.filter(s => getSubscriptionStatus(s).status === 'pending').length,
    active: students.filter(s => getSubscriptionStatus(s).status === 'active').length,
    expired: students.filter(s => getSubscriptionStatus(s).status === 'expired').length,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
          Dashboard
        </span>
        <h1 className="font-serif font-light text-3xl text-espresso mt-1">
          {t('admin.dashboard')}
        </h1>
        <p className="text-taupe text-sm mt-2">
          {t('admin.description')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-museum">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-porcelain flex items-center justify-center">
              <Users className="w-5 h-5 text-espresso" />
            </div>
            <div>
              <p className="text-2xl font-serif font-light text-espresso">{stats.total}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-taupe">{t('admin.totalStudents')}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-serif font-light text-amber-800">{stats.pending}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700">{t('admin.pending')}</p>
            </div>
          </div>
        </div>
        <div className="bg-botanical/5 rounded-2xl p-5 border border-botanical/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-botanical/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-botanical" />
            </div>
            <div>
              <p className="text-2xl font-serif font-light text-botanical">{stats.active}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-botanical">{t('subscription.active')}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-serif font-light text-red-600">{stats.expired}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-red-500">{t('subscription.expired')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-museum-border p-1.5 inline-flex">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'students'
              ? 'bg-espresso text-porcelain'
              : 'text-taupe hover:text-espresso'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('admin.studentManagement')}
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'content'
              ? 'bg-espresso text-porcelain'
              : 'text-taupe hover:text-espresso'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t('admin.contentManagement')}
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-[2rem] border border-museum-border shadow-museum overflow-hidden">
          <div className="px-6 py-4 border-b border-museum-border">
            <h2 className="font-serif font-light text-xl text-espresso">{t('admin.studentList')}</h2>
            <p className="text-sm text-taupe">{t('admin.studentListDesc')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-botanical border-t-transparent animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-taupe">
              {t('admin.noStudents')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-porcelain border-b border-museum-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('common.name')}</th>
                    <th className="px-6 py-3 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('admin.zaloId')}</th>
                    <th className="px-6 py-3 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('subscription.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-museum-border">
                  {students.slice(0, 5).map((student) => {
                    const subStatus = getSubscriptionStatus(student);
                    return (
                      <tr key={student.uid} className="hover:bg-porcelain/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-espresso">{student.name || '-'}</div>
                            <div className="text-[11px] text-taupe">{student.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {student.zaloId ? (
                            <span className="flex items-center gap-1.5 text-sm text-botanical">
                              <MessageCircle className="w-4 h-4" />
                              {student.zaloId}
                            </span>
                          ) : (
                            <span className="text-sm text-taupe">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {subStatus.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {t('subscription.active')}
                            </span>
                          ) : subStatus.status === 'expired' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-full border border-red-100">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t('subscription.expired')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              {t('students.pending')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {students.length > 5 && (
                <div className="px-6 py-4 border-t border-museum-border">
                  <Link href="/admin/students">
                    <button className="w-full py-3 text-[11px] uppercase tracking-[0.15em] text-botanical hover:text-espresso transition-colors flex items-center justify-center gap-2">
                      {t('admin.viewAllStudents')} ({students.length})
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-museum-border shadow-museum overflow-hidden">
            <div className="px-6 py-4 border-b border-museum-border flex items-center justify-between">
              <div>
                <h2 className="font-serif font-light text-xl text-espresso">{t('admin.contentManagementTitle')}</h2>
                <p className="text-sm text-taupe">{t('admin.contentManagementDesc')}</p>
              </div>
              <Link href="/admin/chapters">
                <button className="inline-flex items-center gap-2 px-5 py-3 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.15em] font-medium hover:scale-[1.02] transition-all shadow-museum">
                  <Plus className="w-4 h-4" />
                  {t('admin.addNewLesson')}
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-botanical border-t-transparent animate-spin" />
              </div>
            ) : chapters.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-porcelain flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-taupe" />
                </div>
                <p className="text-taupe">{t('admin.noLessonsAdmin')}</p>
              </div>
            ) : (
              <div className="divide-y divide-museum-border">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="px-6 py-4 flex items-center justify-between hover:bg-porcelain/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-botanical flex items-center justify-center text-porcelain font-serif font-light text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-espresso">{chapter.title}</p>
                        <p className="text-[11px] text-taupe uppercase tracking-[0.1em]">{t('admin.lesson')} {chapter.order}</p>
                      </div>
                    </div>
                    <Link href={`/admin/chapters?edit=${chapter.id}`}>
                      <button className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full hover:bg-botanical/20 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                        {t('admin.edit')}
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/courses"
              className="block bg-white rounded-2xl border border-museum-border p-5 hover:shadow-museum-hover hover:border-botanical/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-museum-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-museum-gold" />
                </div>
                <div>
                  <p className="font-medium text-espresso">{t('admin.courseManagement')}</p>
                  <p className="text-sm text-taupe">{t('admin.courseManagementDesc')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-taupe ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/admin/grades"
              className="block bg-white rounded-2xl border border-museum-border p-5 hover:shadow-museum-hover hover:border-botanical/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-botanical/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5 text-botanical" />
                </div>
                <div>
                  <p className="font-medium text-espresso">{t('admin.gradeManagement')}</p>
                  <p className="text-sm text-taupe">{t('admin.gradeManagementDesc')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-taupe ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
