import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, CourseSubscription } from '@/types';

const STUDENTS_PER_PAGE = 20;

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// 학생 목록 가져오기 (페이지네이션)
export async function getStudents(
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize: number = STUDENTS_PER_PAGE
): Promise<PaginatedResult<User>> {
  try {
    let q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize + 1)
      );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    const data = docs.slice(0, pageSize).map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as User));

    return {
      data,
      lastDoc: docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    throw new Error('학생 목록을 불러오는데 실패했습니다.');
  }
}

// 모든 학생 가져오기 (통계용)
export async function getAllStudents(): Promise<User[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );

    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as User));

    // 생성일 기준 내림차순 정렬
    return students.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching all students:', error);
    throw new Error('학생 목록을 불러오는데 실패했습니다.');
  }
}

// 단일 학생 가져오기
export async function getStudentById(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { ...docSnap.data(), uid: docSnap.id } as User;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw new Error('학생 정보를 불러오는데 실패했습니다.');
  }
}

// 코스별 구독 승인/연장
export async function updateCourseSubscription(
  uid: string,
  courseId: string,
  subscription: CourseSubscription,
  currentSubscriptions?: Record<string, CourseSubscription>
): Promise<void> {
  try {
    const updatedSubscriptions = {
      ...currentSubscriptions,
      [courseId]: subscription
    };

    await updateDoc(doc(db, 'users', uid), {
      courseSubscriptions: updatedSubscriptions,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('구독 정보 업데이트에 실패했습니다.');
  }
}

// 코스별 구독 취소
export async function revokeCourseSubscription(
  uid: string,
  courseId: string,
  currentSubscriptions?: Record<string, CourseSubscription>
): Promise<void> {
  try {
    const updatedSubscriptions = { ...currentSubscriptions };
    delete updatedSubscriptions[courseId];

    await updateDoc(doc(db, 'users', uid), {
      courseSubscriptions: Object.keys(updatedSubscriptions).length > 0 ? updatedSubscriptions : null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error revoking subscription:', error);
    throw new Error('구독 취소에 실패했습니다.');
  }
}
