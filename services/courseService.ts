import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, Chapter } from '@/types';

const COURSES_PER_PAGE = 10;
const CHAPTERS_PER_PAGE = 20;

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// 활성화된 코스 목록 가져오기 (페이지네이션)
export async function getActiveCourses(
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize: number = COURSES_PER_PAGE
): Promise<PaginatedResult<Course>> {
  try {
    let q = query(
      collection(db, 'courses'),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
      limit(pageSize + 1) // 다음 페이지 확인을 위해 1개 더 가져옴
    );

    if (lastDoc) {
      q = query(
        collection(db, 'courses'),
        where('isActive', '==', true),
        orderBy('order', 'asc'),
        startAfter(lastDoc),
        limit(pageSize + 1)
      );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    const data = docs.slice(0, pageSize).map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Course));

    return {
      data,
      lastDoc: docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error('코스 목록을 불러오는데 실패했습니다.');
  }
}

// 모든 코스 가져오기 (관리자용)
export async function getAllCourses(): Promise<Course[]> {
  try {
    const snapshot = await getDocs(collection(db, 'courses'));
    const courses = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Course));

    return courses.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw new Error('코스 목록을 불러오는데 실패했습니다.');
  }
}

// 단일 코스 가져오기
export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { ...docSnap.data(), id: docSnap.id } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw new Error('코스 정보를 불러오는데 실패했습니다.');
  }
}

// 코스별 챕터 목록 가져오기
export async function getChaptersByCourseId(courseId: string): Promise<Chapter[]> {
  try {
    const q = query(
      collection(db, 'chapters'),
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Chapter));
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw new Error('챕터 목록을 불러오는데 실패했습니다.');
  }
}

// 단일 챕터 가져오기
export async function getChapterById(chapterId: string): Promise<Chapter | null> {
  try {
    const docRef = doc(db, 'chapters', chapterId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { ...docSnap.data(), id: docSnap.id } as Chapter;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw new Error('챕터 정보를 불러오는데 실패했습니다.');
  }
}
