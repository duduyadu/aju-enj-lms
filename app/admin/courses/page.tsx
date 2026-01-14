'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Image,
  Type,
  FileText,
  Hash,
  ToggleLeft,
  Save
} from 'lucide-react';

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    isActive: true,
    order: 1
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'courses'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCourse) {
        // 수정
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert('코스가 수정되었습니다.');
      } else {
        // 추가
        await addDoc(collection(db, 'courses'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert('새 코스가 추가되었습니다.');
      }

      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        thumbnail: '',
        isActive: true,
        order: courses.length + 1
      });
      setShowForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail || '',
      isActive: course.isActive,
      order: course.order
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('정말로 이 코스를 삭제하시겠습니까? 관련된 모든 챕터도 확인해주세요.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      alert('코스가 삭제되었습니다.');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
            Course Management
          </span>
          <h1 className="font-serif font-light text-3xl text-espresso mt-1">
            코스 관리
          </h1>
          <p className="text-taupe text-sm mt-2">
            교육 코스를 추가, 수정, 삭제할 수 있습니다
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCourse(null);
            setFormData({
              title: '',
              description: '',
              thumbnail: '',
              isActive: true,
              order: courses.length + 1
            });
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.15em] font-medium hover:scale-[1.02] transition-all duration-300 shadow-museum"
        >
          <Plus className="w-4 h-4" />
          새 코스 추가
        </button>
      </div>

      {/* Course Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-[2rem] border border-museum-border p-8 shadow-museum">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-museum-gold/20 flex items-center justify-center">
                {editingCourse ? <Edit3 className="w-5 h-5 text-museum-gold" /> : <Plus className="w-5 h-5 text-museum-gold" />}
              </div>
              <div>
                <h2 className="font-serif font-light text-xl text-espresso">
                  {editingCourse ? '코스 수정' : '새 코스 추가'}
                </h2>
                <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">
                  {editingCourse ? 'Edit Course' : 'New Course'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCourse(null);
              }}
              className="w-8 h-8 rounded-full bg-porcelain flex items-center justify-center hover:bg-museum-border transition-colors"
            >
              <X className="w-4 h-4 text-taupe" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <Type className="w-3.5 h-3.5" />
                코스 제목 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                placeholder="예: 한국어 초급 과정"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <FileText className="w-3.5 h-3.5" />
                코스 설명 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all resize-none"
                rows={3}
                placeholder="이 코스에 대한 간단한 설명을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <Image className="w-3.5 h-3.5" />
                썸네일 이미지 URL <span className="text-taupe/50">(선택)</span>
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                  <Hash className="w-3.5 h-3.5" />
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                  <ToggleLeft className="w-3.5 h-3.5" />
                  활성화 상태
                </label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                >
                  <option value="true">활성화</option>
                  <option value="false">비활성화</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.15em] font-medium hover:scale-[1.02] transition-all duration-300 shadow-museum disabled:opacity-50 disabled:hover:scale-100"
              >
                <Save className="w-4 h-4" />
                {loading ? '저장 중...' : editingCourse ? '수정하기' : '추가하기'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
                className="px-6 py-3 bg-porcelain text-taupe rounded-full text-[11px] uppercase tracking-[0.15em] font-medium border border-museum-border hover:bg-museum-border transition-all"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course List */}
      <div className="bg-white rounded-[2rem] border border-museum-border shadow-museum overflow-hidden">
        <div className="px-6 py-4 bg-porcelain border-b border-museum-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-botanical/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-botanical" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">Total</span>
            <span className="ml-2 font-serif font-light text-lg text-espresso">{courses.length}개 코스</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-porcelain/50 border-b border-museum-border">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">순서</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">코스 정보</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">상태</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-museum-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-botanical border-t-transparent animate-spin" />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-taupe">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-porcelain flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-taupe" />
                      </div>
                      <span className="text-sm text-taupe">등록된 코스가 없습니다</span>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-porcelain/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-museum-gold/10 flex items-center justify-center">
                        <span className="font-serif font-light text-lg text-espresso">{course.order}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-espresso mb-1">{course.title}</div>
                        <div className="text-[11px] text-taupe line-clamp-2">{course.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          활성화
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-red-500 bg-red-50 rounded-full border border-red-100">
                          <XCircle className="w-3.5 h-3.5" />
                          비활성화
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full hover:bg-botanical/20 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
