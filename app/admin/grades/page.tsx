'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Submission, Chapter, Course } from '@/types';
import {
  BarChart3,
  Users,
  FileCheck,
  TrendingUp,
  Trophy,
  Award,
  Star,
  AlertTriangle,
  Filter,
  ChevronRight
} from 'lucide-react';

interface GradeData {
  student: User;
  submissions: Submission[];
  averageScore: number;
}

export default function GradesPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // 학생 데이터
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as User));

      // 제출 데이터
      const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Submission));

      // 챕터 데이터
      const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Chapter));

      // 코스 데이터
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Course));

      setStudents(studentsData);
      setSubmissions(submissionsData);
      setChapters(chaptersData);
      setCourses(coursesData);

      // 성적 데이터 생성
      const gradeDataArray: GradeData[] = studentsData.map(student => {
        const studentSubmissions = submissionsData.filter(s => s.userId === student.uid);
        const averageScore = studentSubmissions.length > 0
          ? Math.round(studentSubmissions.reduce((acc, s) => acc + s.score, 0) / studentSubmissions.length)
          : 0;

        return {
          student,
          submissions: studentSubmissions,
          averageScore
        };
      });

      // 평균 점수로 내림차순 정렬
      gradeDataArray.sort((a, b) => b.averageScore - a.averageScore);
      setGradeData(gradeDataArray);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGradeData = () => {
    if (selectedCourse === 'all') return gradeData;

    return gradeData.map(data => ({
      ...data,
      submissions: data.submissions.filter(s => s.courseId === selectedCourse),
      averageScore: (() => {
        const filtered = data.submissions.filter(s => s.courseId === selectedCourse);
        return filtered.length > 0
          ? Math.round(filtered.reduce((acc, s) => acc + s.score, 0) / filtered.length)
          : 0;
      })()
    })).filter(data => data.submissions.length > 0);
  };

  const filteredData = getFilteredGradeData();

  // 문제별 정답률 계산
  const getQuestionStats = () => {
    const stats: { [key: string]: { total: number; correct: number } } = {};

    submissions.forEach(submission => {
      const chapter = chapters.find(c => c.id === submission.chapterId);
      if (!chapter?.quiz) return;

      chapter.quiz.questions.forEach((question, index) => {
        const key = `${submission.chapterId}-${index}`;
        if (!stats[key]) {
          stats[key] = { total: 0, correct: 0 };
        }
        stats[key].total++;
        if (submission.answers[index] === question.correctAnswer) {
          stats[key].correct++;
        }
      });
    });

    return stats;
  };

  const questionStats = getQuestionStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-2 border-botanical border-t-transparent animate-spin mb-4" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-taupe">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
          Grades & Analytics
        </span>
        <h1 className="font-serif font-light text-3xl text-espresso mt-1">
          성적 조회
        </h1>
        <p className="text-taupe text-sm mt-2">
          학생별 퀴즈 성적과 통계를 확인합니다
        </p>
      </div>

      {/* Course Filter */}
      <div className="bg-white rounded-2xl border border-museum-border p-5 shadow-museum">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-porcelain border border-museum-border flex items-center justify-center">
            <Filter className="w-5 h-5 text-taupe" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
              코스별 필터
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full sm:w-64 px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
            >
              <option value="all">전체 코스</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-museum-border p-5 shadow-museum">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">Total Students</span>
              <p className="font-serif font-light text-3xl text-espresso mt-1">{students.length}</p>
              <p className="text-[11px] text-taupe mt-1">전체 학생</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-porcelain flex items-center justify-center">
              <Users className="w-5 h-5 text-espresso" />
            </div>
          </div>
        </div>

        <div className="bg-botanical/10 rounded-2xl border border-botanical/20 p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-botanical">Submissions</span>
              <p className="font-serif font-light text-3xl text-espresso mt-1">{submissions.length}</p>
              <p className="text-[11px] text-taupe mt-1">제출된 퀴즈</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-botanical/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-botanical" />
            </div>
          </div>
        </div>

        <div className="bg-museum-gold/10 rounded-2xl border border-museum-gold/20 p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-museum-gold">Average</span>
              <p className="font-serif font-light text-3xl text-espresso mt-1">
                {submissions.length > 0
                  ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)
                  : 0}
              </p>
              <p className="text-[11px] text-taupe mt-1">전체 평균</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-museum-gold/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-museum-gold" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-museum-border p-5 shadow-museum">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">Highest</span>
              <p className="font-serif font-light text-3xl text-espresso mt-1">
                {submissions.length > 0
                  ? Math.max(...submissions.map(s => s.score))
                  : 0}
              </p>
              <p className="text-[11px] text-taupe mt-1">최고 점수</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-museum-gold/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-museum-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Grades Table */}
      <div className="bg-white rounded-[2rem] border border-museum-border shadow-museum overflow-hidden">
        <div className="px-6 py-4 bg-porcelain border-b border-museum-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-botanical/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-botanical" />
          </div>
          <div>
            <h2 className="font-serif font-light text-lg text-espresso">학생별 성적</h2>
            <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">Student Rankings</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-porcelain/50 border-b border-museum-border">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">순위</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">학생 정보</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">제출 수</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">평균 점수</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-museum-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-porcelain flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-taupe" />
                      </div>
                      <span className="text-sm text-taupe">데이터가 없습니다</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((data, index) => (
                  <tr key={data.student.uid} className="hover:bg-porcelain/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-museum-gold text-espresso' :
                        index === 1 ? 'bg-taupe/30 text-espresso' :
                        index === 2 ? 'bg-museum-gold/30 text-espresso' :
                        'bg-porcelain text-taupe border border-museum-border'
                      }`}>
                        {index < 3 ? (
                          <Trophy className="w-4 h-4" />
                        ) : (
                          <span className="font-serif text-sm">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-espresso">{data.student.name}</div>
                        <div className="text-[11px] text-taupe mt-0.5">{data.student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-espresso bg-porcelain rounded-full border border-museum-border">
                        <FileCheck className="w-3.5 h-3.5 text-taupe" />
                        {data.submissions.length}개
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-serif font-light text-2xl ${
                        data.averageScore >= 80 ? 'text-botanical' :
                        data.averageScore >= 60 ? 'text-museum-gold' :
                        'text-red-500'
                      }`}>
                        {data.averageScore}
                        <span className="text-sm text-taupe ml-1">점</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {data.averageScore >= 80 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                          <Award className="w-3.5 h-3.5" />
                          우수
                        </span>
                      ) : data.averageScore >= 60 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-museum-gold bg-museum-gold/10 rounded-full border border-museum-gold/20">
                          <Star className="w-3.5 h-3.5" />
                          보통
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-red-500 bg-red-50 rounded-full border border-red-100">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          노력 필요
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chapter Quiz Stats */}
      <div className="bg-white rounded-[2rem] border border-museum-border p-8 shadow-museum">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-museum-gold/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-museum-gold" />
          </div>
          <div>
            <h2 className="font-serif font-light text-xl text-espresso">챕터별 퀴즈 정답률</h2>
            <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">Question Analytics</span>
          </div>
        </div>

        <div className="space-y-6">
          {chapters.filter(ch => ch.quiz).map(chapter => {
            const chapterSubmissions = submissions.filter(s => s.chapterId === chapter.id);
            if (chapterSubmissions.length === 0) return null;

            return (
              <div key={chapter.id} className="bg-porcelain rounded-2xl p-5 border border-museum-border">
                <div className="flex items-center gap-2 mb-4">
                  <ChevronRight className="w-4 h-4 text-botanical" />
                  <h3 className="font-medium text-espresso">{chapter.title}</h3>
                  <span className="text-[10px] text-taupe ml-auto">
                    {chapterSubmissions.length}명 응시
                  </span>
                </div>
                <div className="space-y-3">
                  {chapter.quiz!.questions.map((question, index) => {
                    const statKey = `${chapter.id}-${index}`;
                    const stat = questionStats[statKey];
                    const percentage = stat ? Math.round((stat.correct / stat.total) * 100) : 0;

                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-museum-border flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-medium text-taupe">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-taupe truncate mb-1.5">
                            {question.text.substring(0, 50)}...
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-museum-border">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  percentage >= 70 ? 'bg-gradient-to-r from-botanical to-botanical/70' :
                                  percentage >= 50 ? 'bg-gradient-to-r from-museum-gold to-museum-gold/70' :
                                  'bg-gradient-to-r from-red-400 to-red-300'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium w-12 text-right ${
                              percentage >= 70 ? 'text-botanical' :
                              percentage >= 50 ? 'text-museum-gold' :
                              'text-red-500'
                            }`}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
