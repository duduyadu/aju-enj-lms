'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { User } from '@/types';

// sessionStorage 사용 (창 닫으면 삭제됨)
const SESSION_STORAGE_KEY = 'aju_session_id';

// 구독 상태 타입 정의
export interface SubscriptionStatus {
  isActive: boolean;
  status: 'active' | 'expired' | 'pending' | 'unlimited';
  daysRemaining: number;
  endDate: Date | null;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  register: (email: string, password: string, name: string, zaloId?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  checkSessionValid: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  getSubscriptionStatus: () => SubscriptionStatus;
  hasValidSubscription: () => boolean;
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
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const unsubscribeSessionRef = useRef<(() => void) | null>(null);
  const isAuthenticatingRef = useRef(false); // 로그인/회원가입 진행 중 플래그

  // 세션 ID 생성 함수
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  };

  // sessionStorage에서 세션 ID 가져오기 (창 닫으면 자동 삭제)
  const getSessionId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  };

  // sessionStorage에 세션 ID 저장
  const setSessionId = (sessionId: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    currentSessionIdRef.current = sessionId;
  };

  // sessionStorage에서 세션 ID 삭제
  const removeSessionId = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    currentSessionIdRef.current = null;
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

  // 세션 유효성 확인 (서버의 세션 ID와 비교)
  const checkSessionValid = useCallback(async (): Promise<boolean> => {
    if (!firebaseUser || !currentSessionIdRef.current) {
      return false;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        return false;
      }

      const serverSessionId = userDoc.data().currentSessionId;
      const localSessionId = currentSessionIdRef.current;

      // 서버 세션 ID와 로컬 세션 ID가 다르면 다른 기기에서 로그인한 것
      if (serverSessionId && serverSessionId !== localSessionId) {
        console.log('Session invalidated: Another device logged in');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return true; // 에러 시에는 일단 유효하다고 처리
    }
  }, [firebaseUser]);

  // 실시간 세션 모니터링 시작
  const startSessionMonitoring = (uid: string, expectedSessionId?: string) => {
    // 이전 리스너 정리
    if (unsubscribeSessionRef.current) {
      unsubscribeSessionRef.current();
    }

    // 초기 스냅샷인지 확인하는 플래그
    let isInitialSnapshot = true;
    // 예상 세션 ID (로그인 시 전달됨)
    const validSessionId = expectedSessionId || currentSessionIdRef.current;

    // Firestore 실시간 리스너
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const serverSessionId = docSnapshot.data().currentSessionId;
        const localSessionId = currentSessionIdRef.current;

        // 초기 스냅샷이면 검증 스킵 (방금 로그인한 경우)
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          // 로그인 직후라면 서버 세션과 예상 세션이 같아야 함
          if (expectedSessionId && serverSessionId === expectedSessionId) {
            console.log('Session monitoring started - session is valid');
            return;
          }
          // 예상 세션이 없는 경우 (페이지 새로고침 등) 현재 상태 확인만
          console.log('Session monitoring started - checking current state');
          return;
        }

        // 이후 스냅샷: 세션 ID가 다르면 다른 곳에서 로그인한 것
        if (localSessionId && serverSessionId && serverSessionId !== localSessionId) {
          console.log('Session invalidated by another login');
          setSessionInvalid(true);
        }
      }
    }, (error) => {
      console.error('Session monitoring error:', error);
    });

    unsubscribeSessionRef.current = unsubscribe;
  };

  // 세션 모니터링 중지
  const stopSessionMonitoring = () => {
    if (unsubscribeSessionRef.current) {
      unsubscribeSessionRef.current();
      unsubscribeSessionRef.current = null;
    }
  };

  // 강제 로그아웃 (다른 기기에서 로그인됨)
  const forceLogout = useCallback(async () => {
    removeSessionId();
    stopSessionMonitoring();

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Force logout error:', error);
    }

    setFirebaseUser(null);
    setUserData(null);
    setSessionInvalid(false);
  }, []);

  // 세션 무효화 감지 시 처리
  useEffect(() => {
    if (sessionInvalid) {
      alert('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
      forceLogout();
    }
  }, [sessionInvalid, forceLogout]);

  // 이메일 로그인
  const login = async (email: string, password: string) => {
    isAuthenticatingRef.current = true; // 로그인 시작
    try {
      // 세션 지속성 설정 (브라우저 세션 동안만 유지 - 창 닫으면 로그아웃)
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const newSessionId = generateSessionId();

      // 세션 ID 저장 (먼저 로컬에 저장)
      setSessionId(newSessionId);

      // 서버에 세션 ID 업데이트 (이전 세션 무효화 - 나중에 로그인한 기기가 유효)
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        currentSessionId: newSessionId,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 사용자 데이터 가져오기
      const updatedUserData = await fetchUserData(userCredential.user.uid);
      setUserData(updatedUserData);

      // 세션 모니터링 시작 (새 세션 ID 전달)
      startSessionMonitoring(userCredential.user.uid, newSessionId);

      // 로딩 완료
      setLoading(false);

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('사용자를 찾을 수 없습니다.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        throw new Error('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      isAuthenticatingRef.current = false; // 로그인 완료
    }
  };

  // 구글 로그인
  const loginWithGoogle = async (): Promise<boolean> => {
    isAuthenticatingRef.current = true; // 로그인 시작
    try {
      // 세션 지속성 설정
      await setPersistence(auth, browserSessionPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const newSessionId = generateSessionId();

      // 세션 ID 저장
      setSessionId(newSessionId);

      // 기존 사용자 확인
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        // 신규 사용자 - 프로필 수집 필요
        const newUserData: User = {
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
          ...newUserData,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        setUserData(newUserData);
        startSessionMonitoring(result.user.uid, newSessionId);
        setLoading(false);
        return true; // 프로필 수집 필요
      } else {
        // 기존 사용자 - 세션 업데이트 (이전 세션 무효화 - 나중에 로그인한 기기가 유효)
        await updateDoc(doc(db, 'users', result.user.uid), {
          currentSessionId: newSessionId,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const updatedUserData = await fetchUserData(result.user.uid);
        setUserData(updatedUserData);
        startSessionMonitoring(result.user.uid, newSessionId);
        setLoading(false);
        return false; // 프로필 수집 불필요
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('로그인이 취소되었습니다.');
      }
      throw new Error('구글 로그인 중 오류가 발생했습니다.');
    } finally {
      isAuthenticatingRef.current = false; // 로그인 완료
    }
  };

  // 회원가입
  const register = async (email: string, password: string, name: string, zaloId?: string) => {
    isAuthenticatingRef.current = true; // 회원가입 시작
    try {
      // 세션 지속성 설정
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newSessionId = generateSessionId();

      // 세션 ID 저장
      setSessionId(newSessionId);

      // Firestore에 사용자 정보 저장
      const newUserData: User = {
        uid: userCredential.user.uid,
        email,
        name,
        zaloId: zaloId || '',
        location: '',
        level: 'beginner',
        role: 'student',
        isPaid: false,
        currentSessionId: newSessionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newUserData,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setUserData(newUserData);
      startSessionMonitoring(userCredential.user.uid, newSessionId);
      setLoading(false);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      } else {
        throw new Error('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      isAuthenticatingRef.current = false; // 회원가입 완료
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
      // 세션 모니터링 중지
      stopSessionMonitoring();

      // 로컬 세션 ID 삭제
      removeSessionId();

      if (firebaseUser) {
        // 서버에서 세션 ID 제거
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          currentSessionId: null,
          updatedAt: serverTimestamp()
        });
      }

      // Firebase 로그아웃
      await signOut(auth);

      setFirebaseUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 로컬 상태는 정리
      removeSessionId();
      stopSessionMonitoring();
      setFirebaseUser(null);
      setUserData(null);
    }
  };

  // 비밀번호 재설정 이메일 전송
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('등록되지 않은 이메일입니다.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      } else {
        throw new Error('비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.');
      }
    }
  };

  // 구독 상태 확인
  const getSubscriptionStatus = useCallback((): SubscriptionStatus => {
    if (!userData) {
      return { isActive: false, status: 'pending', daysRemaining: 0, endDate: null };
    }

    // 관리자는 항상 활성 상태
    if (userData.role === 'admin') {
      return { isActive: true, status: 'unlimited', daysRemaining: -1, endDate: null };
    }

    // 구독 만료일이 없는 경우
    if (!userData.subscriptionEndDate) {
      // 기존 isPaid 필드로 판단 (하위 호환성)
      if (userData.isPaid) {
        return { isActive: true, status: 'unlimited', daysRemaining: -1, endDate: null };
      }
      return { isActive: false, status: 'pending', daysRemaining: 0, endDate: null };
    }

    // 구독 만료일 확인
    const endDate = userData.subscriptionEndDate instanceof Date
      ? userData.subscriptionEndDate
      : new Date(userData.subscriptionEndDate as any);

    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
      return { isActive: true, status: 'active', daysRemaining, endDate };
    } else {
      return { isActive: false, status: 'expired', daysRemaining: 0, endDate };
    }
  }, [userData]);

  // 유효한 구독이 있는지 확인 (간단한 boolean 반환)
  const hasValidSubscription = useCallback((): boolean => {
    return getSubscriptionStatus().isActive;
  }, [getSubscriptionStatus]);

  // Auth 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        // 로그인/회원가입 진행 중이면 완전히 건너뛰기
        // login/register/loginWithGoogle 함수에서 모든 것을 직접 처리함
        if (isAuthenticatingRef.current) {
          console.log('Authentication in progress - letting login function handle everything');
          return; // loading도 login 함수에서 처리
        }

        // 로컬 세션 ID 확인 (페이지 새로고침 등의 경우)
        const localSessionId = getSessionId();

        if (!localSessionId) {
          // 로컬 세션 ID가 없으면 (창 닫기 후 재접속 또는 새 탭)
          // 브라우저 세션 스토리지는 탭마다 독립적이므로 로그아웃 처리
          console.log('No local session ID found - logging out');
          await signOut(auth);
          setFirebaseUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        // 사용자 데이터 가져오기
        const data = await fetchUserData(user.uid);

        if (data) {
          // 로컬 세션 ID 설정
          currentSessionIdRef.current = localSessionId;
          setUserData(data);

          // 세션 모니터링 시작 (실시간 리스너가 세션 무효화 감지)
          // 여기서는 세션 검증을 하지 않음 - 리스너가 처리
          startSessionMonitoring(user.uid);
        } else {
          setUserData(null);
        }
      } else {
        setUserData(null);
        removeSessionId();
        stopSessionMonitoring();
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      stopSessionMonitoring();
    };
  }, []);

  const value = {
    firebaseUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile,
    checkSessionValid,
    resetPassword,
    getSubscriptionStatus,
    hasValidSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
