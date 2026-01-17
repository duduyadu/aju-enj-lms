import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Progress } from '@/types';

// 사용자의 챕터별 진행률 가져오기
export async function getProgressByChapter(
  userId: string,
  chapterId: string
): Promise<{ progress: Progress | null; docId: string | null }> {
  try {
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('chapterId', '==', chapterId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { progress: null, docId: null };
    }

    const doc = snapshot.docs[0];
    return {
      progress: doc.data() as Progress,
      docId: doc.id
    };
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw new Error('진행률 정보를 불러오는데 실패했습니다.');
  }
}

// 사용자의 코스별 진행률 가져오기
export async function getProgressByCourse(
  userId: string,
  courseId: string
): Promise<Progress[]> {
  try {
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Progress));
  } catch (error) {
    console.error('Error fetching course progress:', error);
    throw new Error('코스 진행률을 불러오는데 실패했습니다.');
  }
}

// 진행률 초기화 (새 챕터 시작 시)
export async function initializeProgress(
  userId: string,
  courseId: string,
  chapterId: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'progress'), {
      userId,
      courseId,
      chapterId,
      isCompleted: false,
      watchedDuration: 0,
      totalDuration: 0,
      watchedPercent: 0,
      lastWatchedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error initializing progress:', error);
    throw new Error('진행률 초기화에 실패했습니다.');
  }
}

// 진행률 업데이트 (동시성 처리 - Transaction 사용)
export async function updateProgressWithTransaction(
  progressDocId: string,
  watchedDuration: number,
  totalDuration: number,
  watchedPercent: number
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const progressRef = doc(db, 'progress', progressDocId);
      const progressDoc = await transaction.get(progressRef);

      if (!progressDoc.exists()) {
        throw new Error('진행률 문서를 찾을 수 없습니다.');
      }

      const currentData = progressDoc.data();
      const currentWatchedDuration = currentData.watchedDuration || 0;

      // 새로운 시청 시간이 기존보다 크거나, 다른 위치에서 재생 중일 때만 업데이트
      // 이렇게 하면 여러 기기에서 동시에 시청해도 가장 긴 시청 시간이 유지됨
      const newWatchedDuration = Math.max(currentWatchedDuration, watchedDuration);
      const newWatchedPercent = totalDuration > 0
        ? Math.round((newWatchedDuration / totalDuration) * 100)
        : watchedPercent;

      transaction.update(progressRef, {
        watchedDuration: newWatchedDuration,
        totalDuration,
        watchedPercent: newWatchedPercent,
        lastWatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error updating progress with transaction:', error);
    throw new Error('진행률 업데이트에 실패했습니다.');
  }
}

// 비디오 완료 처리 (동시성 처리)
export async function markVideoCompleteWithTransaction(
  progressDocId: string,
  totalDuration: number
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const progressRef = doc(db, 'progress', progressDocId);
      const progressDoc = await transaction.get(progressRef);

      if (!progressDoc.exists()) {
        throw new Error('진행률 문서를 찾을 수 없습니다.');
      }

      transaction.update(progressRef, {
        isCompleted: true,
        watchedPercent: 100,
        watchedDuration: totalDuration,
        lastWatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error marking video complete:', error);
    throw new Error('비디오 완료 처리에 실패했습니다.');
  }
}

// 단순 진행률 업데이트 (transaction 없이 - 낮은 빈도 업데이트용)
export async function updateProgress(
  progressDocId: string,
  data: Partial<Progress>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'progress', progressDocId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    throw new Error('진행률 업데이트에 실패했습니다.');
  }
}
