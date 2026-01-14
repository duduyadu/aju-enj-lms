'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Footer from './Footer';
import Link from 'next/link';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-aju-navy text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl sm:text-2xl font-bold text-aju-gold hover:text-aju-sky transition">
                AJU E&J LMS
              </Link>

              {/* 네비게이션 메뉴 */}
              <nav className="hidden sm:flex space-x-4 ml-8">
                <Link href="/courses" className="hover:text-aju-sky transition">
                  강의
                </Link>
                <Link href="/my-progress" className="hover:text-aju-sky transition">
                  내 학습
                </Link>
                {userData?.role === 'admin' && (
                  <Link href="/admin" className="hover:text-aju-gold transition font-semibold">
                    관리자
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {userData && (
                <>
                  <span className="text-sm sm:text-base hidden sm:block">
                    {userData.name}님
                  </span>
                  {userData.role === 'admin' && (
                    <Link href="/admin" className="sm:hidden px-3 py-1 bg-aju-gold text-aju-navy rounded-lg hover:bg-opacity-90 transition text-sm font-semibold">
                      관리자
                    </Link>
                  )}
                  {!userData.isPaid && userData.role !== 'admin' && (
                    <span className="px-2 py-1 bg-yellow-500 text-xs rounded-full">
                      미승인
                    </span>
                  )}
                </>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {children}
      </main>

      {/* AJU E&J 푸터 */}
      <Footer />
    </div>
  );
}