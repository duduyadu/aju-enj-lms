'use client';

import { useState, useEffect } from 'react';
import { Course, Chapter } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronLeft, ChevronRight, Users, Play, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedCourseSliderProps {
  courses: Course[];
}

export default function FeaturedCourseSlider({ courses }: FeaturedCourseSliderProps) {
  const { t, language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [firstChapters, setFirstChapters] = useState<Record<string, Chapter | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFirstChapters = async () => {
      const chapters: Record<string, Chapter | null> = {};

      for (const course of courses) {
        try {
          const q = query(
            collection(db, 'chapters'),
            where('courseId', '==', course.id),
            orderBy('order', 'asc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            chapters[course.id] = {
              ...snapshot.docs[0].data(),
              id: snapshot.docs[0].id
            } as Chapter;
          } else {
            chapters[course.id] = null;
          }
        } catch (error) {
          console.error(`Error fetching chapter for course ${course.id}:`, error);
          chapters[course.id] = null;
        }
      }

      setFirstChapters(chapters);
      setLoading(false);
    };

    if (courses.length > 0) {
      fetchFirstChapters();
    } else {
      setLoading(false);
    }
  }, [courses]);

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E1D8] p-8 text-center">
        <BookOpen className="w-12 h-12 text-[#8C857E]/50 mx-auto mb-3" />
        <p className="text-[#8C857E]">
          {t('dashboard.noCourses')}
        </p>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const getLowestPrice = (course: Course): number => {
    if (!course.pricing) return 0;
    return Math.min(course.pricing.months3, course.pricing.months6, course.pricing.months12);
  };

  const getStudentCount = (course: Course): number => {
    return course.studentCount || 0;
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E1D8] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#2D241E] flex items-center gap-2">
          <span className="text-lg">🎓</span>
          {t('dashboard.featuredCourses')}
        </h2>

        {courses.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="w-8 h-8 rounded-full bg-[#F5F3ED] hover:bg-[#E5E1D8] flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#2D241E]" />
            </button>
            <button
              onClick={nextSlide}
              className="w-8 h-8 rounded-full bg-[#F5F3ED] hover:bg-[#E5E1D8] flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#2D241E]" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#4A5D4E] animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {courses.map((course) => {
                const firstChapter = firstChapters[course.id];
                const lowestPrice = getLowestPrice(course);
                const studentCount = getStudentCount(course);

                return (
                  <div key={course.id} className="w-full flex-shrink-0 px-1">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-48 h-32 sm:h-36 rounded-lg overflow-hidden bg-[#F5F3ED] flex-shrink-0">
                        {course.thumbnail ? (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-[#8C857E]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#2D241E] text-lg mb-1 line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-[#8C857E] mb-3 line-clamp-2">
                          {course.description}
                        </p>

                        {studentCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-[#4A5D4E] mb-2">
                            <Users className="w-4 h-4" />
                            <span>{studentCount.toLocaleString()}{t('dashboard.studentsEnrolled')}</span>
                          </div>
                        )}

                        {lowestPrice > 0 && (
                          <p className="text-lg font-bold text-[#4A5D4E] mb-3">
                            {lowestPrice.toLocaleString()}원~
                          </p>
                        )}

                        <div className="flex gap-2">
                          {firstChapter && (
                            <a
                              href={`/courses/${course.id}/`}
                              className="flex items-center gap-1 px-3 py-2 bg-[#F5F3ED] text-[#2D241E] rounded-lg text-sm font-medium hover:bg-[#E5E1D8] transition-colors"
                            >
                              <Play className="w-4 h-4" />
                              {t('dashboard.preview')}
                            </a>
                          )}
                          <a
                            href={`/courses/${course.id}/`}
                            className="flex items-center gap-1 px-4 py-2 bg-[#4A5D4E] text-white rounded-lg text-sm font-medium hover:bg-[#3a4a3e] transition-colors"
                          >
                            {t('dashboard.enroll')}
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {courses.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {courses.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-[#4A5D4E]' : 'bg-[#E5E1D8]'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
