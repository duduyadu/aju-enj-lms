'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, Question } from '@/types';

export default function ChapterManagement() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  // 챕터 기본 정보
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    videoUrl: '',
    order: 1,
    duration: 0
  });

  // 퀴즈 정보
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuizForm, setShowQuizForm] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchChapters();
  }, []);

  const fetchCourses = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'courses'));
      const courseData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Course));
      setCourses(courseData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'chapters'));
      const chapterData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Chapter));

      // 순서대로 정렬
      chapterData.sort((a, b) => a.order - b.order);
      setChapters(chapterData);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    if (field === 'options') {
      updatedQuestions[index].options = value;
    } else {
      (updatedQuestions[index] as any)[field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const chapterData = {
        ...formData,
        quiz: questions.length > 0 ? { questions } : null
      };

      if (editingChapter) {
        // 수정
        await updateDoc(doc(db, 'chapters', editingChapter.id), {
          ...chapterData,
          updatedAt: serverTimestamp()
        });
        alert('챕터가 수정되었습니다.');
      } else {
        // 추가
        await addDoc(collection(db, 'chapters'), {
          ...chapterData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert('새 챕터가 추가되었습니다.');
      }

      // 폼 초기화
      setFormData({
        courseId: '',
        title: '',
        description: '',
        videoUrl: '',
        order: 1,
        duration: 0
      });
      setQuestions([]);
      setShowForm(false);
      setShowQuizForm(false);
      setEditingChapter(null);
      fetchChapters();
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      courseId: chapter.courseId,
      title: chapter.title,
      description: chapter.description || '',
      videoUrl: chapter.videoUrl,
      order: chapter.order,
      duration: chapter.duration || 0
    });
    setQuestions(chapter.quiz?.questions || []);
    setShowForm(true);
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('정말로 이 챕터를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'chapters', chapterId));
      alert('챕터가 삭제되었습니다.');
      fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(ch => ch.courseId === selectedCourse)
    : chapters;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">챕터 관리</h1>
          <p className="text-gray-600 mt-1">강의 영상과 퀴즈를 관리합니다</p>
        </div>
        <button
          onClick={() => {
            if (courses.length === 0) {
              alert('먼저 코스를 생성해주세요.');
              return;
            }
            setShowForm(true);
            setEditingChapter(null);
            setFormData({
              courseId: courses[0].id,
              title: '',
              description: '',
              videoUrl: '',
              order: chapters.filter(ch => ch.courseId === courses[0].id).length + 1,
              duration: 0
            });
            setQuestions([]);
          }}
          className="px-4 py-2 bg-aju-navy text-white rounded-lg hover:bg-opacity-90 transition"
        >
          + 새 챕터 추가
        </button>
      </div>

      {/* 코스 필터 */}
      <div className="mb-4">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">모든 코스</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {/* 챕터 추가/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editingChapter ? '챕터 수정' : '새 챕터 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                코스 선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                챕터 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="예: 1강. 한국어 인사말"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                유튜브 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                유튜브 동영상 링크를 그대로 붙여넣으세요
              </p>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  영상 길이 (분)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>
            </div>

            {/* 퀴즈 섹션 */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">퀴즈 설정 (선택사항)</h3>
                <button
                  type="button"
                  onClick={() => setShowQuizForm(!showQuizForm)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showQuizForm ? '퀴즈 숨기기' : '퀴즈 추가'}
                </button>
              </div>

              {showQuizForm && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  {questions.map((question, qIndex) => (
                    <div key={question.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between mb-3">
                        <h4 className="font-medium">문제 {qIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      </div>

                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mb-3"
                        placeholder="문제를 입력하세요"
                      />

                      <div className="space-y-2 mb-3">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[oIndex] = e.target.value;
                                handleQuestionChange(qIndex, 'options', newOptions);
                              }}
                              className="flex-1 px-3 py-1 border rounded"
                              placeholder={`선택지 ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="정답 해설 (한국어/베트남어 모두 가능)"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
                  >
                    + 문제 추가
                  </button>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-aju-navy text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {loading ? '저장 중...' : editingChapter ? '수정하기' : '추가하기'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setShowQuizForm(false);
                  setEditingChapter(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 챕터 목록 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순서</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">챕터 정보</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코스</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">퀴즈</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : filteredChapters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  등록된 챕터가 없습니다
                </td>
              </tr>
            ) : (
              filteredChapters.map((chapter) => {
                const course = courses.find(c => c.id === chapter.courseId);
                return (
                  <tr key={chapter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{chapter.order}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{chapter.title}</div>
                        <div className="text-sm text-gray-500">
                          {chapter.duration ? `${chapter.duration}분` : '시간 미설정'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {course?.title || '코스 없음'}
                    </td>
                    <td className="px-6 py-4">
                      {chapter.quiz ? (
                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          {chapter.quiz.questions.length}문제
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(chapter)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 도움말 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 사용 가이드</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 유튜브 링크는 브라우저 주소창에서 그대로 복사해서 붙여넣으세요</li>
          <li>• 퀴즈는 선택사항이며, 자동 채점됩니다</li>
          <li>• 정답 해설은 한국어와 베트남어 모두 입력 가능합니다</li>
          <li>• 챕터 순서는 숫자로 관리되며, 학생에게는 순서대로 표시됩니다</li>
        </ul>
      </div>
    </div>
  );
}