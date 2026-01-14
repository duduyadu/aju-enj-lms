'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  register: (email: string, password: string, name: string, zaloId?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 세션 ID 생성 함수
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  };

  // 사용자 데이터 가져오기
  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // 이메일 로그인
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const newSessionId = generateSessionId();

      // 세션 ID 업데이트
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        currentSessionId: newSessionId,
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('사용자를 찾을 수 없습니다.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('비밀번호가 올바르지 않습니다.');
      } else {
        throw new Error('로그인 중 오류가 발생했습니다.');
      }
    }
  };

  // 구글 로그인
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const newSessionId = generateSessionId();

      // 기존 사용자 확인
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        // 신규 사용자 - 프로필 수집 필요
        const userData: User = {
          uid: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || '',
          zaloId: '',
          location: '',
          level: 'beginner',
          role: 'student',
          isPaid: false,
          currentSessionId: newSessionId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(doc(db, 'users', result.user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return true; // 프로필 수집 필요
      } else {
        // 기존 사용자 - 세션 업데이트
        await updateDoc(doc(db, 'users', result.user.uid), {
          currentSessionId: newSessionId,
          updatedAt: serverTimestamp()
        });

        return false; // 프로필 수집 불필요
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error('구글 로그인 중 오류가 발생했습니다.');
    }
  };

  // 회원가입
  const register = async (email: string, password: string, name: string, zaloId?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newSessionId = generateSessionId();

      // Firestore에 사용자 정보 저장
      const userData: User = {
        uid: userCredential.user.uid,
        email,
        name,
        zaloId: zaloId || '',
        location: '',
        level: 'beginner',
        role: 'student',
        isPaid: false, // 기본값: 미결제
        currentSessionId: newSessionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      } else {
        throw new Error('회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  // 프로필 업데이트
  const updateUserProfile = async (data: Partial<User>) => {
    try {
      if (!firebaseUser) throw new Error('로그인이 필요합니다.');

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...data,
        updatedAt: serverTimestamp()
      });

      // 로컬 상태 업데이트
      const updatedUser = await fetchUserData(firebaseUser.uid);
      setUserData(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      if (firebaseUser) {
        // 세션 ID 제거
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          currentSessionId: null,
          updatedAt: serverTimestamp()
        });
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // Auth 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        const userData = await fetchUserData(user.uid);
        setUserData(userData);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    firebaseUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}