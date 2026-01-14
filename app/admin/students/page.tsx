'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  MapPin,
  GraduationCap,
  Calendar,
  Lightbulb,
  Filter
} from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      const studentData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as User));

      // 최신 가입순 정렬
      studentData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      });

      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string, isPaid: boolean) => {
    const confirmMsg = isPaid
      ? '정말로 이 학생의 승인을 취소하시겠습니까?'
      : '이 학생에게 수강 권한을 부여하시겠습니까?';

    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'users', studentId), {
        isPaid: !isPaid,
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      setStudents(prev =>
        prev.map(student =>
          student.uid === studentId
            ? { ...student, isPaid: !isPaid }
            : student
        )
      );

      // 토스트 스타일 알림 (간단한 피드백)
      const message = isPaid ? '승인이 취소되었습니다' : '학생이 승인되었습니다';
      alert(message);
    } catch (error) {
      console.error('Error updating student:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const filteredStudents = students.filter(student => {
    if (filter === 'pending') return !student.isPaid;
    if (filter === 'approved') return student.isPaid;
    return true;
  });

  const pendingCount = students.filter(s => !s.isPaid).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
          Student Management
        </span>
        <h1 className="font-serif font-light text-3xl text-espresso mt-1">
          학생 관리
        </h1>
        <p className="text-taupe text-sm mt-2">
          가입한 학생의 결제를 확인하고 수강 권한을 승인합니다
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-museum-border p-4 shadow-museum">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-porcelain border border-museum-border flex items-center justify-center">
              <Users className="w-5 h-5 text-espresso" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{students.length}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">전체</span>
            </div>
          </div>
        </div>
        <div className="bg-museum-gold/10 rounded-2xl border border-museum-gold/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-museum-gold/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-museum-gold" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{pendingCount}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">대기 중</span>
            </div>
          </div>
        </div>
        <div className="bg-botanical/10 rounded-2xl border border-botanical/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-botanical/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-botanical" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{students.length - pendingCount}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">승인됨</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-museum-border p-2 shadow-museum">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-porcelain flex items-center justify-center">
            <Filter className="w-4 h-4 text-taupe" />
          </div>
          <div className="flex flex-1 gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-espresso text-porcelain shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              전체 ({students.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'pending'
                  ? 'bg-museum-gold text-espresso shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              대기 중 ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'approved'
                  ? 'bg-botanical text-porcelain shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              승인됨 ({students.length - pendingCount})
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-[2rem] border border-museum-border shadow-museum overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-porcelain border-b border-museum-border">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  학생 정보
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  연락처
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  지역/레벨
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  가입일
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-museum-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-botanical border-t-transparent animate-spin" />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-taupe">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-porcelain flex items-center justify-center">
                        <Users className="w-6 h-6 text-taupe" />
                      </div>
                      <span className="text-sm text-taupe">학생이 없습니다</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const createdDate = student.createdAt instanceof Date
                    ? student.createdAt
                    : new Date(student.createdAt as any);

                  return (
                    <tr key={student.uid} className="hover:bg-porcelain/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-espresso">
                            {student.name}
                          </div>
                          <div className="text-[11px] text-taupe mt-0.5">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-taupe" />
                          {student.zaloId ? (
                            <span className="text-sm text-botanical font-medium">
                              {student.zaloId}
                            </span>
                          ) : (
                            <span className="text-[11px] text-taupe/60">미등록</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-taupe" />
                            <span className="text-sm text-espresso">
                              {student.location || '미설정'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-taupe" />
                            <span className="text-[11px] text-taupe">
                              {student.level === 'beginner' ? '초급' :
                               student.level === 'intermediate' ? '중급' : '고급'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-taupe" />
                          <span className="text-sm text-taupe">
                            {createdDate.toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            승인됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-museum-gold bg-museum-gold/10 rounded-full border border-museum-gold/20">
                            <Clock className="w-3.5 h-3.5" />
                            대기 중
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleApprove(student.uid, student.isPaid)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] transition-all duration-300 ${
                            student.isPaid
                              ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                              : 'bg-botanical text-porcelain hover:scale-[1.02] shadow-museum'
                          }`}
                        >
                          {student.isPaid ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              취소
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              승인
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Banner */}
      <div className="bg-botanical/5 border border-botanical/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-botanical/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-botanical" />
          </div>
          <div>
            <h3 className="font-medium text-espresso mb-2">승인 가이드</h3>
            <ul className="text-sm text-taupe space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                Zalo ID를 확인하여 실제 수강생인지 확인하세요
              </li>
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                입금이 확인된 학생만 승인 버튼을 눌러주세요
              </li>
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                승인된 학생만 강의 콘텐츠에 접근할 수 있습니다
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
