'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Course, CourseSubscription } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Filter,
  X,
  CalendarDays,
  AlertTriangle,
  Search,
  BookOpen,
  ChevronRight,
  Settings
} from 'lucide-react';

// 코스별 구독 상태 계산
function getCourseSubscriptionStatus(user: User, courseId: string): {
  status: 'active' | 'expired' | 'pending';
  daysRemaining: number;
  endDate: Date | null;
} {
  const subscription = user.courseSubscriptions?.[courseId];

  if (!subscription || !subscription.approved) {
    // 하위 호환성: 기존 isPaid 사용자는 모든 코스 접근 가능
    if (user.isPaid && user.subscriptionEndDate) {
      const endDate = user.subscriptionEndDate instanceof Date
        ? user.subscriptionEndDate
        : new Date(user.subscriptionEndDate as any);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        return { status: 'active', daysRemaining, endDate };
      } else {
        return { status: 'expired', daysRemaining: 0, endDate };
      }
    }
    if (user.isPaid && !user.subscriptionEndDate) {
      return { status: 'active', daysRemaining: -1, endDate: null };
    }
    return { status: 'pending', daysRemaining: 0, endDate: null };
  }

  if (!subscription.endDate) {
    return { status: 'active', daysRemaining: -1, endDate: null };
  }

  const endDate = subscription.endDate instanceof Date
    ? subscription.endDate
    : new Date(subscription.endDate as any);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining > 0) {
    return { status: 'active', daysRemaining, endDate };
  } else {
    return { status: 'expired', daysRemaining: 0, endDate };
  }
}

// 전체 구독 상태 (하위 호환성)
function getOverallSubscriptionStatus(user: User): {
  status: 'active' | 'expired' | 'pending';
  activeCourses: number;
  totalCourses: number;
} {
  // 기존 isPaid 사용자
  if (user.isPaid && !user.courseSubscriptions) {
    return { status: 'active', activeCourses: -1, totalCourses: 0 };
  }

  if (!user.courseSubscriptions) {
    return { status: 'pending', activeCourses: 0, totalCourses: 0 };
  }

  const subscriptions = Object.values(user.courseSubscriptions);
  const totalCourses = subscriptions.length;
  const activeCourses = subscriptions.filter(sub => {
    if (!sub.approved) return false;
    if (!sub.endDate) return true;
    const endDate = sub.endDate instanceof Date ? sub.endDate : new Date(sub.endDate as any);
    return endDate > new Date();
  }).length;

  if (activeCourses > 0) {
    return { status: 'active', activeCourses, totalCourses };
  } else if (totalCourses > 0) {
    return { status: 'expired', activeCourses: 0, totalCourses };
  }
  return { status: 'pending', activeCourses: 0, totalCourses: 0 };
}

export default function StudentManagement() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 학생 상세 모달 상태
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // 코스별 구독 모달 상태
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [subscriptionMonths, setSubscriptionMonths] = useState<number>(1);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 학생 데이터 가져오기
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentData = studentsSnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as User));

      studentData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      });

      setStudents(studentData);

      // 코스 데이터 가져오기
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const courseData = coursesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Course));

      courseData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCourses(courseData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 학생 상세 모달 열기
  const openStudentModal = (student: User) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  // 코스별 구독 모달 열기
  const openSubscriptionModal = (course: Course, extending: boolean = false) => {
    setSelectedCourse(course);
    setIsExtending(extending);
    setSubscriptionMonths(1);
    setShowSubscriptionModal(true);
  };

  // 코스별 구독 승인/연장 처리
  const handleCourseSubscription = async () => {
    if (!selectedStudent || !selectedCourse) return;

    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      const currentSubscription = selectedStudent.courseSubscriptions?.[selectedCourse.id];

      if (isExtending && currentSubscription?.endDate) {
        const currentEndDate = currentSubscription.endDate instanceof Date
          ? currentSubscription.endDate
          : new Date(currentSubscription.endDate as any);
        startDate = currentEndDate > now ? currentEndDate : now;
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + subscriptionMonths);
      } else {
        startDate = now;
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + subscriptionMonths);
      }

      const newSubscription: CourseSubscription = {
        approved: true,
        startDate: startDate,
        endDate: endDate,
        months: subscriptionMonths
      };

      const updatedSubscriptions = {
        ...selectedStudent.courseSubscriptions,
        [selectedCourse.id]: newSubscription
      };

      await updateDoc(doc(db, 'users', selectedStudent.uid), {
        courseSubscriptions: updatedSubscriptions,
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      const updatedStudent = {
        ...selectedStudent,
        courseSubscriptions: updatedSubscriptions
      };

      setStudents(prev =>
        prev.map(student =>
          student.uid === selectedStudent.uid ? updatedStudent : student
        )
      );
      setSelectedStudent(updatedStudent);

      alert(isExtending ? t('subscription.extended') : t('subscription.approved'));
      setShowSubscriptionModal(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert(t('subscription.error'));
    }
  };

  // 코스별 구독 취소 처리
  const handleRevokeCourse = async (courseId: string) => {
    if (!selectedStudent) return;
    if (!confirm(t('students.confirmRevoke'))) return;

    try {
      const updatedSubscriptions = { ...selectedStudent.courseSubscriptions };
      delete updatedSubscriptions[courseId];

      await updateDoc(doc(db, 'users', selectedStudent.uid), {
        courseSubscriptions: Object.keys(updatedSubscriptions).length > 0 ? updatedSubscriptions : null,
        updatedAt: new Date()
      });

      const updatedStudent = {
        ...selectedStudent,
        courseSubscriptions: Object.keys(updatedSubscriptions).length > 0 ? updatedSubscriptions : undefined
      };

      setStudents(prev =>
        prev.map(student =>
          student.uid === selectedStudent.uid ? updatedStudent : student
        )
      );
      setSelectedStudent(updatedStudent);

      alert(t('students.approvalRevoked'));
    } catch (error) {
      console.error('Error revoking subscription:', error);
      alert(t('students.approvalError'));
    }
  };

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = student.name?.toLowerCase().includes(query);
      const emailMatch = student.email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) return false;
    }

    const overallStatus = getOverallSubscriptionStatus(student);
    if (filter === 'pending') return overallStatus.status === 'pending';
    if (filter === 'active') return overallStatus.status === 'active';
    if (filter === 'expired') return overallStatus.status === 'expired';
    return true;
  });

  // 통계
  const stats = {
    total: students.length,
    pending: students.filter(s => getOverallSubscriptionStatus(s).status === 'pending').length,
    active: students.filter(s => getOverallSubscriptionStatus(s).status === 'active').length,
    expired: students.filter(s => getOverallSubscriptionStatus(s).status === 'expired').length,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
          Student Management
        </span>
        <h1 className="font-serif font-light text-3xl text-espresso mt-1">
          {t('students.title')}
        </h1>
        <p className="text-taupe text-sm mt-2">
          {t('students.description')}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-museum-border p-4 shadow-museum">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-porcelain border border-museum-border flex items-center justify-center">
              <Users className="w-5 h-5 text-espresso" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{stats.total}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">{t('students.total')}</span>
            </div>
          </div>
        </div>
        <div className="bg-museum-gold/10 rounded-2xl border border-museum-gold/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-museum-gold/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-museum-gold" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{stats.pending}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">{t('students.pending')}</span>
            </div>
          </div>
        </div>
        <div className="bg-botanical/10 rounded-2xl border border-botanical/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-botanical/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-botanical" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{stats.active}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">{t('subscription.active')}</span>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-serif font-light text-2xl text-espresso">{stats.expired}</p>
              <span className="text-[9px] uppercase tracking-[0.15em] text-taupe">{t('subscription.expired')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-museum-border p-4 shadow-museum space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('students.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-3 bg-porcelain rounded-xl text-sm text-espresso placeholder:text-taupe focus:outline-none focus:ring-2 focus:ring-botanical/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-taupe/20 flex items-center justify-center hover:bg-taupe/30 transition-colors"
            >
              <X className="w-3 h-3 text-taupe" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-porcelain flex items-center justify-center">
            <Filter className="w-4 h-4 text-taupe" />
          </div>
          <div className="flex flex-1 gap-1 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-espresso text-porcelain shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              {t('students.total')} ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'pending'
                  ? 'bg-museum-gold text-espresso shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              {t('students.pending')} ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'active'
                  ? 'bg-botanical text-porcelain shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              {t('subscription.active')} ({stats.active})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                filter === 'expired'
                  ? 'bg-red-500 text-white shadow-museum'
                  : 'text-taupe hover:bg-porcelain'
              }`}
            >
              {t('subscription.expired')} ({stats.expired})
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
                  {t('students.studentInfo')}
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  {t('students.contact')}
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  {t('subscription.status')}
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  코스 승인
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">
                  {t('chapters.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-museum-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-botanical border-t-transparent animate-spin" />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-taupe">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-porcelain flex items-center justify-center">
                        <Users className="w-6 h-6 text-taupe" />
                      </div>
                      <span className="text-sm text-taupe">{t('students.noStudents')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const overallStatus = getOverallSubscriptionStatus(student);
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
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-taupe" />
                            <span className="text-[10px] text-taupe">
                              {student.location || t('students.notSet')}
                            </span>
                            <GraduationCap className="w-3 h-3 text-taupe ml-2" />
                            <span className="text-[10px] text-taupe">
                              {student.level === 'beginner' ? t('students.beginner') :
                               student.level === 'intermediate' ? t('students.intermediate') :
                               student.level === 'advanced' ? t('students.advanced') : t('students.notSet')}
                            </span>
                          </div>
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
                            <span className="text-[11px] text-taupe/60">{t('students.notRegistered')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-taupe" />
                          <span className="text-[10px] text-taupe">
                            {createdDate.toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {overallStatus.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t('subscription.active')}
                          </span>
                        ) : overallStatus.status === 'expired' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-red-600 bg-red-50 rounded-full border border-red-100">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('subscription.expired')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-museum-gold bg-museum-gold/10 rounded-full border border-museum-gold/20">
                            <Clock className="w-3.5 h-3.5" />
                            {t('students.pending')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {overallStatus.activeCourses === -1 ? (
                          <span className="text-[11px] text-botanical font-medium">전체 승인 (레거시)</span>
                        ) : (
                          <span className="text-[11px] text-taupe">
                            {overallStatus.activeCourses} / {courses.length} 코스
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openStudentModal(student)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] bg-espresso text-porcelain hover:scale-[1.02] shadow-museum transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          코스 관리
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
            <h3 className="font-medium text-espresso mb-2">{t('subscription.guide')}</h3>
            <ul className="text-sm text-taupe space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                각 학생별로 코스를 개별 승인할 수 있습니다.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                코스별로 구독 기간을 다르게 설정할 수 있습니다.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                {t('subscription.guideTip3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-botanical">•</span>
                {t('subscription.guideTip4')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowStudentModal(false);
                setSelectedStudent(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-porcelain flex items-center justify-center hover:bg-museum-border transition-colors z-10"
            >
              <X className="w-4 h-4 text-taupe" />
            </button>

            <div className="p-8">
              {/* Student Info Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-botanical/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-botanical" />
                </div>
                <h2 className="font-serif font-light text-2xl text-espresso mb-1">
                  {selectedStudent.name}
                </h2>
                <p className="text-sm text-taupe">{selectedStudent.email}</p>
              </div>

              {/* Course List */}
              <div className="space-y-4">
                <h3 className="font-medium text-espresso flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  코스별 승인 관리
                </h3>

                {courses.length === 0 ? (
                  <div className="text-center py-8 text-taupe">
                    등록된 코스가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course) => {
                      const courseStatus = getCourseSubscriptionStatus(selectedStudent, course.id);
                      const subscription = selectedStudent.courseSubscriptions?.[course.id];

                      return (
                        <div
                          key={course.id}
                          className="p-4 bg-porcelain rounded-xl border border-museum-border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-espresso">{course.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {courseStatus.status === 'active' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    활성
                                  </span>
                                ) : courseStatus.status === 'expired' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-red-600 bg-red-50 rounded-full">
                                    <AlertTriangle className="w-3 h-3" />
                                    만료
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-museum-gold bg-museum-gold/10 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    미승인
                                  </span>
                                )}
                                {courseStatus.endDate && (
                                  <span className="text-[10px] text-taupe">
                                    만료: {courseStatus.endDate.toLocaleDateString('ko-KR')}
                                    {courseStatus.daysRemaining > 0 && (
                                      <span className={`ml-1 ${
                                        courseStatus.daysRemaining <= 7 ? 'text-red-500' :
                                        courseStatus.daysRemaining <= 30 ? 'text-museum-gold' : 'text-botanical'
                                      }`}>
                                        ({courseStatus.daysRemaining}일 남음)
                                      </span>
                                    )}
                                  </span>
                                )}
                                {courseStatus.status === 'active' && courseStatus.daysRemaining === -1 && (
                                  <span className="text-[10px] text-botanical">무제한</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {courseStatus.status === 'pending' || courseStatus.status === 'expired' ? (
                                <button
                                  onClick={() => openSubscriptionModal(course, courseStatus.status === 'expired')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium bg-botanical text-white hover:bg-botanical/90 transition-all"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {courseStatus.status === 'expired' ? '갱신' : '승인'}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => openSubscriptionModal(course, true)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
                                  >
                                    <CalendarDays className="w-3 h-3" />
                                    연장
                                  </button>
                                  <button
                                    onClick={() => handleRevokeCourse(course.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    취소
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legacy Notice */}
              {selectedStudent.isPaid && !selectedStudent.courseSubscriptions && (
                <div className="mt-6 p-4 bg-museum-gold/10 border border-museum-gold/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-museum-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-espresso text-sm mb-1">레거시 전체 승인 상태</h4>
                      <p className="text-[11px] text-taupe">
                        이 학생은 기존 방식으로 전체 승인되어 있습니다.
                        코스별 승인을 설정하면 새로운 방식으로 전환됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Subscription Modal */}
      {showSubscriptionModal && selectedStudent && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
            <button
              onClick={() => {
                setShowSubscriptionModal(false);
                setSelectedCourse(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-porcelain flex items-center justify-center hover:bg-museum-border transition-colors"
            >
              <X className="w-4 h-4 text-taupe" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-botanical/10 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-7 h-7 text-botanical" />
              </div>
              <h2 className="font-serif font-light text-2xl text-espresso mb-2">
                {isExtending ? '구독 연장' : '코스 승인'}
              </h2>
              <p className="text-sm text-taupe">
                {selectedCourse.title}
              </p>
              <p className="text-[11px] text-taupe mt-1">
                학생: {selectedStudent.name}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-3">
                  {t('subscription.selectPeriod')}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[1, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      onClick={() => setSubscriptionMonths(months)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        subscriptionMonths === months
                          ? 'border-botanical bg-botanical/5'
                          : 'border-museum-border hover:border-botanical/50'
                      }`}
                    >
                      <div className="font-serif font-light text-xl text-espresso">
                        {months}
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.1em] text-taupe">
                        {t('subscription.month')}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 p-4 bg-porcelain rounded-xl">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-taupe whitespace-nowrap">
                    {t('subscription.customInput')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={subscriptionMonths}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= 99) {
                        setSubscriptionMonths(val);
                      }
                    }}
                    className="flex-1 px-4 py-2 border-2 border-museum-border rounded-lg text-center font-serif text-xl text-espresso focus:border-botanical focus:outline-none"
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-taupe">
                    {t('subscription.months')}
                  </span>
                </div>
              </div>

              {isExtending && selectedStudent.courseSubscriptions?.[selectedCourse.id]?.endDate && (
                <div className="p-4 bg-porcelain rounded-xl">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-taupe mb-1">
                    {t('subscription.currentExpiry')}
                  </div>
                  <div className="text-sm text-espresso">
                    {(() => {
                      const endDate = selectedStudent.courseSubscriptions[selectedCourse.id].endDate;
                      return (endDate instanceof Date
                        ? endDate
                        : new Date(endDate as any)
                      ).toLocaleDateString('ko-KR');
                    })()}
                  </div>
                </div>
              )}

              <div className="p-4 bg-botanical/5 rounded-xl">
                <div className="text-[10px] uppercase tracking-[0.2em] text-taupe mb-1">
                  {isExtending ? t('subscription.newExpiry') : t('subscription.expiryDate')}
                </div>
                <div className="text-sm text-botanical font-medium">
                  {(() => {
                    let baseDate = new Date();
                    if (isExtending && selectedStudent.courseSubscriptions?.[selectedCourse.id]?.endDate) {
                      const currentEnd = selectedStudent.courseSubscriptions[selectedCourse.id].endDate;
                      const currentEndDate = currentEnd instanceof Date
                        ? currentEnd
                        : new Date(currentEnd as any);
                      if (currentEndDate > baseDate) {
                        baseDate = currentEndDate;
                      }
                    }
                    const newDate = new Date(baseDate);
                    newDate.setMonth(newDate.getMonth() + subscriptionMonths);
                    return newDate.toLocaleDateString('ko-KR');
                  })()}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedCourse(null);
                }}
                className="flex-1 h-12 bg-porcelain text-espresso rounded-full text-[11px] uppercase tracking-[0.2em] hover:bg-museum-border transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCourseSubscription}
                className="flex-1 h-12 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-museum"
              >
                {isExtending ? t('subscription.extend') : t('subscription.approve')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
