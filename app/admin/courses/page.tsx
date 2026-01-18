'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Save,
  DollarSign,
  Package,
  BookMarked
} from 'lucide-react';

export default function CourseManagement() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    isActive: true,
    order: 1,
    pricing: {
      months1: 0,
      months3: 0,
      months6: 0,
      months12: 0
    },
    textbookInfo: {
      name: '',
      price: 0,
      imageUrl: '',
      description: ''
    },
    hasTextbook: false
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
      // 저장할 데이터 준비 (교재 정보는 활성화된 경우에만 포함)
      const dataToSave = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail,
        isActive: formData.isActive,
        order: formData.order,
        pricing: formData.pricing,
        ...(formData.hasTextbook && formData.textbookInfo.name ? {
          textbookInfo: {
            name: formData.textbookInfo.name,
            price: formData.textbookInfo.price,
            imageUrl: formData.textbookInfo.imageUrl || '',
            description: formData.textbookInfo.description || ''
          }
        } : { textbookInfo: null })
      };

      if (editingCourse) {
        // 수정
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        });
        alert(t('courses.courseUpdated'));
      } else {
        // 추가
        await addDoc(collection(db, 'courses'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert(t('courses.courseAdded'));
      }

      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        thumbnail: '',
        isActive: true,
        order: courses.length + 1,
        pricing: {
          months1: 0,
          months3: 0,
          months6: 0,
          months12: 0
        },
        textbookInfo: {
          name: '',
          price: 0,
          imageUrl: '',
          description: ''
        },
        hasTextbook: false
      });
      setShowForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert(t('courses.saveFailed'));
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
      order: course.order,
      pricing: {
        months1: course.pricing?.months1 || 0,
        months3: course.pricing?.months3 || 0,
        months6: course.pricing?.months6 || 0,
        months12: course.pricing?.months12 || 0
      },
      textbookInfo: {
        name: course.textbookInfo?.name || '',
        price: course.textbookInfo?.price || 0,
        imageUrl: course.textbookInfo?.imageUrl || '',
        description: course.textbookInfo?.description || ''
      },
      hasTextbook: !!course.textbookInfo?.name
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm(t('courses.confirmDelete'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      alert(t('courses.courseDeleted'));
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(t('courses.deleteFailed'));
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
            {t('courses.managementTitle')}
          </h1>
          <p className="text-taupe text-sm mt-2">
            {t('courses.managementDesc')}
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
              order: courses.length + 1,
              pricing: {
                months1: 0,
                months3: 0,
                months6: 0,
                months12: 0
              },
              textbookInfo: {
                name: '',
                price: 0,
                imageUrl: '',
                description: ''
              },
              hasTextbook: false
            });
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.15em] font-medium hover:scale-[1.02] transition-all duration-300 shadow-museum"
        >
          <Plus className="w-4 h-4" />
          {t('courses.addNew')}
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
                  {editingCourse ? t('courses.editCourse') : t('courses.addNew')}
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
                {t('courses.courseTitle')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                placeholder={t('courses.titlePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <FileText className="w-3.5 h-3.5" />
                {t('courses.courseDescription')} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all resize-none"
                rows={3}
                placeholder={t('courses.descriptionPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                <Image className="w-3.5 h-3.5" />
                {t('courses.thumbnailUrl')} <span className="text-taupe/50">({t('chapters.optional')})</span>
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                placeholder="https://example.com/image.jpg"
              />
              {formData.thumbnail && (
                <div className="mt-3 p-3 bg-porcelain rounded-xl border border-museum-border">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">미리보기 / Preview</p>
                  <img
                    src={formData.thumbnail}
                    alt="Thumbnail preview"
                    className="w-full max-w-xs h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 가격 설정 섹션 */}
            <div className="border-t border-museum-border pt-6">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-4">
                <DollarSign className="w-3.5 h-3.5" />
                {t('courses.pricingSettings')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                    {t('courses.price1Month')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.pricing.months1}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, months1: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all pr-12"
                      min="0"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-taupe">VND</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                    {t('courses.price3Months')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.pricing.months3}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, months3: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all pr-12"
                      min="0"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-taupe">VND</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                    {t('courses.price6Months')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.pricing.months6}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, months6: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all pr-12"
                      min="0"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-taupe">VND</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                    {t('courses.price12Months')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.pricing.months12}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, months12: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-3 bg-porcelain border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all pr-12"
                      min="0"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-taupe">VND</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 교재 설정 섹션 */}
            <div className="border-t border-museum-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe">
                  <BookMarked className="w-3.5 h-3.5" />
                  {t('courses.textbookSettings')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasTextbook}
                    onChange={(e) => setFormData({ ...formData, hasTextbook: e.target.checked })}
                    className="w-4 h-4 rounded border-museum-border text-botanical focus:ring-botanical/30"
                  />
                  <span className="text-[11px] text-espresso">{t('courses.enableTextbook')}</span>
                </label>
              </div>

              {formData.hasTextbook && (
                <div className="space-y-4 p-4 bg-porcelain/50 rounded-xl border border-museum-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                        {t('courses.textbookName')} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.textbookInfo.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          textbookInfo: { ...formData.textbookInfo, name: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-white border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                        placeholder={t('courses.textbookNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                        {t('courses.textbookPrice')} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.textbookInfo.price}
                          onChange={(e) => setFormData({
                            ...formData,
                            textbookInfo: { ...formData.textbookInfo, price: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-3 bg-white border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all pr-12"
                          min="0"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-taupe">VND</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                      {t('courses.textbookImage')} <span className="text-taupe/50">({t('chapters.optional')})</span>
                    </label>
                    <input
                      type="url"
                      value={formData.textbookInfo.imageUrl}
                      onChange={(e) => setFormData({
                        ...formData,
                        textbookInfo: { ...formData.textbookInfo, imageUrl: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-white border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                      placeholder="https://example.com/textbook-image.jpg"
                    />
                    {formData.textbookInfo.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.textbookInfo.imageUrl}
                          alt="Textbook preview"
                          className="w-24 h-32 object-cover rounded-lg border border-museum-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-taupe mb-2">
                      {t('courses.textbookDescription')} <span className="text-taupe/50">({t('chapters.optional')})</span>
                    </label>
                    <textarea
                      value={formData.textbookInfo.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        textbookInfo: { ...formData.textbookInfo, description: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-white border border-museum-border rounded-xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all resize-none"
                      rows={2}
                      placeholder={t('courses.textbookDescPlaceholder')}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Package className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700">
                      {t('courses.textbookNote')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                  <Hash className="w-3.5 h-3.5" />
                  {t('courses.sortOrder')}
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
                  {t('courses.activeStatus')}
                </label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-5 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                >
                  <option value="true">{t('courses.active')}</option>
                  <option value="false">{t('courses.inactive')}</option>
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
                {loading ? t('common.saving') : editingCourse ? t('common.edit') : t('courses.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
                className="px-6 py-3 bg-porcelain text-taupe rounded-full text-[11px] uppercase tracking-[0.15em] font-medium border border-museum-border hover:bg-museum-border transition-all"
              >
                {t('common.cancel')}
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
            <span className="ml-2 font-serif font-light text-lg text-espresso">{courses.length}{t('courses.coursesCount')}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-porcelain/50 border-b border-museum-border">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('courses.order')}</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('courses.courseInfo')}</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('admin.status')}</th>
                <th className="px-6 py-4 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-taupe">{t('chapters.actions')}</th>
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
                      <span className="text-sm text-taupe">{t('courses.noCourses')}</span>
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
                      <div className="flex items-center gap-4">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-20 h-14 object-cover rounded-lg border border-museum-border flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).className = 'w-20 h-14 bg-porcelain rounded-lg border border-museum-border flex-shrink-0 flex items-center justify-center';
                            }}
                          />
                        ) : (
                          <div className="w-20 h-14 bg-porcelain rounded-lg border border-museum-border flex-shrink-0 flex items-center justify-center">
                            <Image className="w-6 h-6 text-taupe/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-espresso mb-1">{course.title}</div>
                          <div className="text-[11px] text-taupe line-clamp-2">{course.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-botanical bg-botanical/10 rounded-full border border-botanical/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t('courses.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-red-500 bg-red-50 rounded-full border border-red-100">
                          <XCircle className="w-3.5 h-3.5" />
                          {t('courses.inactive')}
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
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t('common.delete')}
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
