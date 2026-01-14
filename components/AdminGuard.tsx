'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { userData, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        // 로그인하지 않은 경우
        alert('로그인이 필요합니다.');
        router.push('/login');
      } else if (userData.role !== 'admin') {
        // 관리자가 아닌 경우
        alert('관리자만 접근할 수 있습니다.');
        router.push('/dashboard');
      }
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">권한 확인 중...</div>
      </div>
    );
  }

  if (!userData || userData.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}