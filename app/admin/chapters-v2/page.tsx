'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, Question } from '@/types';

export default function ChapterManagementV2() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // 챕터 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    order: 1,
    duration: 0
  });

  // 퀴즈 데이터
  const [questions, setQuestions] = useState<Question[]>([]);

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
      courseData.sort((a, b) => a.order - b.order);
      setCourses(courseData);

      // 첫 번째 코스를 기본 선택
      if (courseData.length > 0 && !selectedCourse) {
        setSelectedCourse(courseData[0].id);
      }
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

  const handleSubmit = async () => {
    if (!selectedCourse) {
      alert('코스를 선택해주세요');
      return;
    }

    if (!formData.title || !formData.videoUrl) {
      alert('제목과 유튜브 URL은 필수입니다');
      return;
    }

    setLoading(true);

    try {
      const chapterData = {
        courseId: selectedCourse,
        ...formData,
        quiz: questions.length > 0 ? { questions } : null
      };

      if (editingChapter) {
        await updateDoc(doc(db, 'chapters', editingChapter.id), {
          ...chapterData,
          updatedAt: serverTimestamp()
        });
        alert('✅ 챕터가 수정되었습니다');
      } else {
        await addDoc(collection(db, 'chapters'), {
          ...chapterData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert('✅ 새 챕터가 추가되었습니다');
      }

      // 초기화
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        order: chapters.filter(c => c.courseId === selectedCourse).length + 2,
        duration: 0
      });
      setQuestions([]);
      setShowAddChapter(false);
      setEditingChapter(null);
      fetchChapters();
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('정말로 이 챕터를 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'chapters', chapterId));
      alert('❌ 챕터가 삭제되었습니다');
      fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(ch => ch.courseId === selectedCourse)
    : [];

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">챕터 관리 (간편 모드)</h1>
        <p className="text-gray-600 mt-1">코스를 선택하고 챕터를 쉽게 추가/관리하세요</p>
      </div>

      {/* Step 1: 코스 선택 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-aju-navy text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
          코스 선택 (교과서 폴더)
        </h2>

        {courses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">📚 등록된 코스가 없습니다</p>
            <a
              href="/admin/courses"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              코스 추가하러 가기 →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedCourse === course.id
                    ? 'border-aju-navy bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <h3 className="font-semibold text-gray-800">{course.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {chapters.filter(ch => ch.courseId === course.id).length}개 챕터
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: 선택된 코스의 챕터 목록 */}
      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <span className="bg-aju-navy text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
              {selectedCourseData?.title} - 챕터 목록
            </h2>
            <button
              onClick={() => {
                setShowAddChapter(true);
                setFormData({
                  ...formData,
                  order: filteredChapters.length + 1
                });
              }}
              className="px-4 py-2 bg-aju-navy text-white rounded-lg hover:bg-opacity-90 transition"
            >
              + 챕터 추가
            </button>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">아직 챕터가 없습니다</p>
              <p className="text-sm text-gray-400 mt-2">위의 "챕터 추가" 버튼을 클릭하세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChapters.map((chapter, index) => (
                <div key={chapter.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700 mr-4">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{chapter.title}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>🎥 {chapter.duration || 0}분</span>
                          {chapter.quiz && (
                            <span className="text-green-600">
                              📝 퀴즈 {chapter.quiz.questions.length}문제
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingChapter(chapter);
                          setFormData({
                            title: chapter.title,
                            description: chapter.description || '',
                            videoUrl: chapter.videoUrl,
                            order: chapter.order,
                            duration: chapter.duration || 0
                          });
                          setQuestions(chapter.quiz?.questions || []);
                          setShowAddChapter(true);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(chapter.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 챕터 추가/수정 모달 */}
      {showAddChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingChapter ? '챕터 수정' : '새 챕터 추가'}
            </h3>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  챕터 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="예: 1강. 한국어 기초 인사"
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
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 유튜브에서 영상 주소를 복사해서 붙여넣으세요
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    순서
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
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

              {/* 간단한 퀴즈 추가 */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">퀴즈 (선택사항)</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 문제 추가
                  </button>
                </div>

                {questions.map((question, qIndex) => (
                  <div key={question.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                    <div className="mb-3">
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].text = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full px-3 py-2 border rounded"
                        placeholder={`문제 ${qIndex + 1}`}
                      />
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`q${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => {
                              const updated = [...questions];
                              updated[qIndex].correctAnswer = oIndex;
                              setQuestions(updated);
                            }}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].options[oIndex] = e.target.value;
                              setQuestions(updated);
                            }}
                            className="flex-1 px-3 py-1 border rounded"
                            placeholder={`선택지 ${oIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setQuestions(questions.filter((_, i) => i !== qIndex));
                      }}
                      className="mt-3 text-sm text-red-600 hover:text-red-800"
                    >
                      문제 삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddChapter(false);
                  setEditingChapter(null);
                  setFormData({
                    title: '',
                    description: '',
                    videoUrl: '',
                    order: 1,
                    duration: 0
                  });
                  setQuestions([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-aju-navy text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {loading ? '저장 중...' : editingChapter ? '수정하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 간편 사용법</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>먼저 코스(교과서)를 선택하세요</li>
          <li>"챕터 추가" 버튼을 클릭하세요</li>
          <li>제목과 유튜브 링크만 입력하면 됩니다 (퀴즈는 선택)</li>
          <li>저장하면 바로 학생들이 볼 수 있습니다</li>
        </ol>
      </div>
    </div>
  );
}