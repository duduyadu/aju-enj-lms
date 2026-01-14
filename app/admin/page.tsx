'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  MapPin,
  GraduationCap,
  Settings,
  Plus,
  Video,
  ChevronRight
} from 'lucide-react';

interface ChapterData {
  id: string;
  title: string;
  order: number;
  courseId: string;
}

export default function AdminDashboard() {
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

  const handleTogglePaid = async (studentId: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus
      ? '정말로 이 학생의 승인을 취소하시겠습니까?'
      : '이 학생에게 수강 권한을 부여하시겠습니까?';

    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'users', studentId), {
        isPaid: !currentStatus,
        updatedAt: new Date()
      });
      fetchData();
    } catch (error) {
      console.error('Error updating student:', error);
      alert('권한 업데이트에 실패했습니다.');
    }
  };

  const pendingCount = students.filter(s => !s.isPaid).length;
  const approvedCount = students.filter(s => s.isPaid).length;

  return (
    <div className="min-h-screen bg-[#F5F3ED]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#2D241E] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#2D241E]" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AJU E&J 관리자</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">Admin Panel</p>
              </div>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-white/80 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-all">
                학생 화면
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F3ED] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#2D241E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2D241E]">{students.length}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#8C857E]">전체 학생</p>
              </div>
            </div>
          </div>
          <div className="bg-[#FEF3E2] rounded-2xl p-5 border border-[#F59E0B]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#92400E]">{pendingCount}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#B45309]">대기 중</p>
              </div>
            </div>
          </div>
          <div className="bg-[#ECFDF5] rounded-2xl p-5 border border-[#10B981]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#065F46]">{approvedCount}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#047857]">승인됨</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-1.5 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'students'
                ? 'bg-[#2D241E] text-white'
                : 'text-[#8C857E] hover:text-[#2D241E]'
            }`}
          >
            <Users className="w-4 h-4" />
            학생 관리
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'content'
                ? 'bg-[#2D241E] text-white'
                : 'text-[#8C857E] hover:text-[#2D241E]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            강의 관리
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E1D8]">
              <h2 className="font-bold text-[#2D241E]">학생 목록</h2>
              <p className="text-sm text-[#8C857E]">등록된 학생들의 정보와 수강 권한을 관리합니다</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="py-16 text-center text-[#8C857E]">
                아직 등록된 학생이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F3ED] border-b border-[#E5E1D8]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">이름</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">이메일</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">Zalo ID</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">거주지</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">레벨</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">상태</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C857E]">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    {students.map((student) => (
                      <tr key={student.uid} className="hover:bg-[#F5F3ED]/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-[#2D241E]">{student.name || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8C857E]">{student.email}</td>
                        <td className="px-6 py-4">
                          {student.zaloId ? (
                            <span className="flex items-center gap-1.5 text-sm text-[#4A5D4E]">
                              <MessageCircle className="w-4 h-4" />
                              {student.zaloId}
                            </span>
                          ) : (
                            <span className="text-sm text-[#8C857E]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.location ? (
                            <span className="flex items-center gap-1.5 text-sm text-[#8C857E]">
                              <MapPin className="w-4 h-4" />
                              {student.location}
                            </span>
                          ) : (
                            <span className="text-sm text-[#8C857E]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8C857E] bg-[#F5F3ED] rounded-full border border-[#E5E1D8]">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {student.level === 'beginner' ? '초급' :
                             student.level === 'intermediate' ? '중급' : '고급'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {student.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-[#065F46] bg-[#ECFDF5] rounded-full border border-[#10B981]/20">
                              <CheckCircle className="w-3.5 h-3.5" />
                              수강 가능
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-[#92400E] bg-[#FEF3E2] rounded-full border border-[#F59E0B]/20">
                              <Clock className="w-3.5 h-3.5" />
                              대기 중
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleTogglePaid(student.uid, student.isPaid)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                              student.isPaid
                                ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/20 hover:bg-[#FEE2E2]'
                                : 'bg-[#4A5D4E] text-white hover:bg-[#3A4D3E]'
                            }`}
                          >
                            {student.isPaid ? '권한 취소' : '권한 부여'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E1D8] flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[#2D241E]">강의 콘텐츠 관리</h2>
                  <p className="text-sm text-[#8C857E]">강의 영상과 퀴즈를 추가, 수정, 삭제합니다</p>
                </div>
                <Link href="/admin/chapters">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A5D4E] text-white rounded-lg text-sm font-medium hover:bg-[#3A4D3E] transition-all">
                    <Plus className="w-4 h-4" />
                    새 강의 추가
                  </button>
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin" />
                </div>
              ) : chapters.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F5F3ED] flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-[#8C857E]" />
                  </div>
                  <p className="text-[#8C857E]">등록된 강의가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E1D8]">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F5F3ED]/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[#2D241E]">{chapter.title}</p>
                          <p className="text-sm text-[#8C857E]">강의 {chapter.order}</p>
                        </div>
                      </div>
                      <Link href={`/admin/chapters?edit=${chapter.id}`}>
                        <button className="p-2 text-[#8C857E] hover:text-[#2D241E] hover:bg-[#F5F3ED] rounded-lg transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/courses">
                <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 hover:shadow-md hover:border-[#4A5D4E]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2D241E]">코스 관리</p>
                      <p className="text-sm text-[#8C857E]">코스 추가 및 수정</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/admin/grades">
                <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 hover:shadow-md hover:border-[#4A5D4E]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4A5D4E]/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-[#4A5D4E]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2D241E]">성적 관리</p>
                      <p className="text-sm text-[#8C857E]">학생 성적 확인</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E1D8] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E]">
            © 2024 AJU E&J Admin Panel
          </p>
        </div>
      </footer>
    </div>
  );
}
