'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, Question } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ChapterManagementV2() {
  const { t } = useLanguage();
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
      alert(t('chaptersV2.selectCourseAlert'));
      return;
    }

    if (!formData.title || !formData.videoUrl) {
      alert(t('chaptersV2.requiredFieldsAlert'));
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
        alert(t('chaptersV2.chapterUpdated'));
      } else {
        await addDoc(collection(db, 'chapters'), {
          ...chapterData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert(t('chaptersV2.chapterAdded'));
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
      alert(t('chaptersV2.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm(t('chapters.confirmDelete'))) return;

    try {
      await deleteDoc(doc(db, 'chapters', chapterId));
      alert(t('chaptersV2.chapterDeleted'));
      fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert(t('chaptersV2.deleteError'));
    }
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(ch => ch.courseId === selectedCourse)
    : [];

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('chaptersV2.title')}</h1>
        <p className="text-gray-600 mt-1">{t('chaptersV2.description')}</p>
      </div>

      {/* Step 1: 코스 선택 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-aju-navy text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
          {t('chaptersV2.step1Title')}
        </h2>

        {courses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">{t('chaptersV2.noCourses')}</p>
            <a
              href="/admin/courses"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('chaptersV2.goAddCourse')}
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
                  {chapters.filter(ch => ch.courseId === course.id).length}{t('chaptersV2.chaptersCount')}
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
              {selectedCourseData?.title} - {t('chaptersV2.chapterList')}
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
              + {t('chaptersV2.addChapter')}
            </button>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">{t('chaptersV2.noChaptersYet')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('chaptersV2.clickAddChapter')}</p>
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
                          <span>🎥 {chapter.duration || 0}{t('chapters.minutes')}</span>
                          {chapter.quiz && (
                            <span className="text-green-600">
                              📝 {t('chaptersV2.quizQuestions').replace('{count}', chapter.quiz.questions.length.toString())}
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
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(chapter.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        {t('common.delete')}
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
              {editingChapter ? t('chaptersV2.editChapter') : t('chaptersV2.addNewChapter')}
            </h3>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chaptersV2.chapterTitle')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder={t('chaptersV2.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chaptersV2.youtubeUrl')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('chaptersV2.youtubeHelp')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('chaptersV2.order')}
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
                    {t('chaptersV2.videoDuration')}
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
                  <h4 className="font-semibold text-gray-800">{t('chaptersV2.quizOptional')}</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + {t('chaptersV2.addQuestion')}
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
                        placeholder={`${t('chaptersV2.question')} ${qIndex + 1}`}
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
                            placeholder={`${t('chaptersV2.option')} ${oIndex + 1}`}
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
                      {t('chaptersV2.deleteQuestion')}
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-aju-navy text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {loading ? t('common.saving') : editingChapter ? t('chaptersV2.update') : t('chaptersV2.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">{t('chaptersV2.helpTitle')}</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>{t('chaptersV2.helpTip1')}</li>
          <li>{t('chaptersV2.helpTip2')}</li>
          <li>{t('chaptersV2.helpTip3')}</li>
          <li>{t('chaptersV2.helpTip4')}</li>
        </ol>
      </div>
    </div>
  );
}
