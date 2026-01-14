'use client';

import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  FileVideo,
  BarChart3,
  LogOut,
  Settings,
  ArrowLeft
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { href: '/admin', label: '대시보드', labelEn: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/students', label: '학생 관리', labelEn: 'Students', icon: Users },
    { href: '/admin/courses', label: '코스 관리', labelEn: 'Courses', icon: BookOpen },
    { href: '/admin/chapters-v2', label: '챕터 관리 (간편)', labelEn: 'Chapters', icon: Video },
    { href: '/admin/chapters', label: '챕터 관리 (상세)', labelEn: 'Chapters Detail', icon: FileVideo },
    { href: '/admin/grades', label: '성적 조회', labelEn: 'Grades', icon: BarChart3 },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-porcelain">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-espresso text-porcelain">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-museum-gold flex items-center justify-center">
                  <Settings className="w-4 h-4 text-espresso" />
                </div>
                <div>
                  <h1 className="font-serif font-light text-lg text-porcelain">
                    AJU E&J Admin
                  </h1>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-porcelain/60">
                    관리자 패널
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-porcelain/70 hover:text-porcelain transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  학생 화면
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row">
          {/* Sidebar */}
          <nav className="w-full sm:w-72 bg-white border-r border-museum-border min-h-[calc(100vh-4rem)]">
            <div className="p-6">
              <span className="text-[9px] uppercase tracking-[0.3em] text-taupe block mb-4">
                Navigation
              </span>
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'bg-botanical text-porcelain shadow-museum'
                          : 'hover:bg-museum-border/50 text-espresso'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-porcelain' : 'text-taupe'}`} />
                      <div>
                        <span className="font-medium text-sm block">{item.label}</span>
                        <span className={`text-[9px] uppercase tracking-[0.15em] ${isActive ? 'text-porcelain/70' : 'text-taupe'}`}>
                          {item.labelEn}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
