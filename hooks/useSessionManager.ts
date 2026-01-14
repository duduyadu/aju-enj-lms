'use client';

import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';

export function useSessionManager() {
  const { firebaseUser, userData } = useAuth();
  const currentSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseUser || !userData) return;

    // 현재 세션 ID 저장
    currentSessionId.current = userData.currentSessionId || null;

    // Firestore 실시간 리스너로 세션 변경 감지
    const unsubscribe = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const newSessionId = data.currentSessionId;

          // 세션 ID가 변경되었고, 현재 세션과 다르면 로그아웃
          if (
            newSessionId &&
            currentSessionId.current &&
            newSessionId !== currentSessionId.current
          ) {
            console.log('다른 기기에서 로그인이 감지되었습니다.');
            alert('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
            signOut(auth).catch(console.error);
          }
        }
      },
      (error) => {
        console.error('Session monitoring error:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, userData]);

  return null;
}