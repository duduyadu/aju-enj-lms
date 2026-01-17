'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, Question } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Video,
  Plus,
  Edit3,
  Trash2,
  X,
  Type,
  Link as LinkIcon,
  Hash,
  Clock,
  Save,
  HelpCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Filter
} from 'lucide-react';

export default function ChapterManagement() {
  const { t } = useLanguage();
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
        alert(t('chapters.updated'));
      } else {
        // 추가
        await addDoc(collection(db, 'chapters'), {
          ...chapterData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert(t('chapters.added'));
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
      alert(t('chapters.saveFailed'));
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
    if (!confirm(t('chapters.confirmDelete'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'chapters', chapterId));
      alert(t('chapters.deleted'));
      fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert(t('chapters.deleteFailed'));
    }
  };

  const filteredChapters = selectedCourse
    ? chapters.filter(ch => ch.courseId === selectedCourse)
    : chapters;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
            Chapter Management
          </span>
          <h1 className="font-serif font-light text-3xl text-espresso mt-1">
            {t('chapters.title')}
          </h1>
          <p className="text-taupe text-sm mt-2">
            {t('chapters.description')}
          </p>
        </div>
        <button
          onClick={() => {
            if (courses.length === 0) {
              alert(t('chapters.createCourseFirst'));
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
          className="inline-flex items-center gap-2 px-5 py-3 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.15em] font-medium hover:scale-[1.02] transition-all duration-300 shadow-museum"
        >
          <Plus className="w-4 h-4" />
          {t('chapters.addNew')}
        </button>
      </div>

      {/* Course Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-taupe">
          <Filter className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.2em]">{t('chapters.courseFilter')}</span>
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 bg-white border border-museum-border rounded-full text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
        >
          <option value="">{t('chapters.allCourses')}</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {/* Chapter Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-[2rem] border border-museum-border p-8 shadow-museum">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-museum-gold/20 flex items-center justify-center">
                {editingChapter ? <Edit3 className="w-5 h-5 text-museum-gold" /> : <Plus className="w-5 h-5 text-museum-gold" />}
              </div>
              <div>
                <h2 className="font-serif font-light text-xl text-espresso">
                  {editingChapter ? t('chapters.editChapter') : t('chapters.addNew')}
                </h2>
                <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">
                  {editingChapter ? 'Edit Chapter' : 'New Chapter'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setShowQuizForm(false);
                setEditingChapter(null);
              }}
              className="w-8 h-8 rounded-full bg-porcelain flex items-center justify-center hover:bg-museum-border transition-colors"
            >
              <X className="w-4 h-4 text-taupe" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                {t('chapters.selectCourse')} <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                required
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <Type className="w-3.5 h-3.5" />
                {t('chapters.chapterTitle')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                placeholder={t('chapters.titlePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <LinkIcon className="w-3.5 h-3.5" />
                {t('chapters.youtubeUrl')} <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-[11px] text-taupe mt-2 ml-1">
                {t('chapters.youtubeHelp')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                  <Hash className="w-3.5 h-3.5" />
                  {t('chapters.sortOrder')}
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
                  <Clock className="w-3.5 h-3.5" />
                  {t('chapters.videoDuration')}
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  min="0"
                />
              </div>
            </div>

            {/* 퀴즈 섹션 - 퀴즈 기능 비활성화 */}
            {false && (
            <div className="border-t border-museum-border pt-6">
              <button
                type="button"
                onClick={() => setShowQuizForm(!showQuizForm)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-botanical/10 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-botanical" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-espresso">{t('chapters.quizSettings')}</h3>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-taupe">{t('chapters.optional')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {questions.length > 0 && (
                    <span className="px-2.5 py-1 text-[10px] font-medium text-botanical bg-botanical/10 rounded-full">
                      {questions.length}{t('chapters.questions')}
                    </span>
                  )}
                  {showQuizForm ? (
                    <ChevronUp className="w-5 h-5 text-taupe" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-taupe" />
                  )}
                </div>
              </button>

              {showQuizForm && (
                <div className="mt-6 space-y-4 bg-porcelain p-6 rounded-2xl">
                  {questions.map((question, qIndex) => (
                    <div key={question.id} className="bg-white p-5 rounded-xl border border-museum-border">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-taupe font-medium">
                          {t('chapters.question')} {qIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700 text-[11px] uppercase tracking-[0.1em] font-medium"
                        >
                          {t('common.delete')}
                        </button>
                      </div>

                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        className="w-full px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all mb-4"
                        placeholder={t('chapters.questionPlaceholder')}
                      />

                      <div className="space-y-2 mb-4">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                              className="w-4 h-4 text-botanical focus:ring-botanical"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[oIndex] = e.target.value;
                                handleQuestionChange(qIndex, 'options', newOptions);
                              }}
                              className="flex-1 px-4 py-2.5 bg-white border border-museum-border rounded-xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                              placeholder={`${t('chapters.option')} ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                        className="w-full px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all resize-none"
                        rows={2}
                        placeholder={t('chapters.explanationPlaceholder')}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full py-4 border-2 border-dashed border-museum-border rounded-xl text-taupe hover:border-botanical hover:text-botanical transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[11px] uppercase tracking-[0.15em] font-medium">{t('chapters.addQuestion')}</span>
                  </button>
                </div>
              )}
            </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.15em] font-medium hover:scale-[1.02] transition-all duration-300 shadow-museum disabled:opacity-50 disabled:hover:scale-100"
              >
                <Save className="w-4 h-4" />
                {loading ? t('common.saving') : editingChapter ? t('common.edit') : t('chapters.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setShowQuizForm(false);
                  setEditingChapter(null);
                }}
                className="px-6 py-3 bg-porcelain text-taupe rounded-full text-[11px] uppercase tracking-[0.15em] font-medium border border-museum-border hover:bg-museum-border transition-all"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chapter List */}
      <div className="bg-white rounded-[2rem] border border-museum-border shadow-museum overflow-hidden">
        <div className="px-6 py-4 bg-porcelain border-b border-museum-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-botanical/10 flex items-center justify-center">
            <Video className="w-4 h-4 text-botanical" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-taupe">Total</span>
            <span className="ml-2 font-serif font-light text-lg text-espresso">{filteredChapters.length}{t('chapters.chaptersCount')}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-porcelain/50 border-b border-museum-border">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('chapters.order')}</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('chapters.chapterInfo')}</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('chapters.course')}</th>
                {/* 퀴즈 컬럼 비활성화 */}
                {/* <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('chapters.quiz')}</th> */}
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('chapters.actions')}</th>
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
              ) : filteredChapters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-porcelain flex items-center justify-center">
                        <Video className="w-6 h-6 text-taupe" />
                      </div>
                      <span className="text-sm text-taupe">{t('chapters.noChapters')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredChapters.map((chapter) => {
                  const course = courses.find(c => c.id === chapter.courseId);
                  return (
                    <tr key={chapter.id} className="hover:bg-porcelain/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full bg-museum-gold/10 flex items-center justify-center">
                          <span className="font-serif font-light text-lg text-espresso">{chapter.order}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-espresso mb-1">{chapter.title}</div>
                          <div className="flex items-center gap-2 text-[11px] text-taupe">
                            <Clock className="w-3.5 h-3.5" />
                            {chapter.duration ? `${chapter.duration}${t('chapters.minutes')}` : t('chapters.noTime')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-espresso bg-porcelain rounded-full border border-museum-border">
                          <BookOpen className="w-3.5 h-3.5" />
                          {course?.title || t('chapters.noCourse')}
                        </span>
                      </td>
                      {/* 퀴즈 컬럼 비활성화 */}
                      {/* <td className="px-6 py-4">
                        {chapter.quiz ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {chapter.quiz.questions.length}{t('chapters.questions')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-taupe">{t('chapters.none')}</span>
                        )}
                      </td> */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(chapter)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full hover:bg-botanical/20 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(chapter.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('common.delete')}
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
      </div>

      {/* 도움말 */}
      <div className="bg-botanical/5 rounded-2xl border border-botanical/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-botanical/20 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-botanical" />
          </div>
          <h3 className="font-medium text-espresso">{t('chapters.helpGuide')}</h3>
        </div>
        <ul className="text-sm text-taupe space-y-2 ml-11">
          <li>• {t('chapters.helpTip1')}</li>
          <li>• {t('chapters.helpTip2')}</li>
          <li>• {t('chapters.helpTip3')}</li>
          <li>• {t('chapters.helpTip4')}</li>
        </ul>
      </div>
    </div>
  );
}
