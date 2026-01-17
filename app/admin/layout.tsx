'use client';

import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import LanguageToggle from '@/components/LanguageToggle';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  FileVideo,
  BarChart3,
  LogOut,
  Settings,
  ArrowLeft,
  Wallet
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useLanguage();
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
    { href: '/admin', label: t('adminNav.dashboard'), labelSub: t('adminNav.dashboardSub'), icon: LayoutDashboard },
    { href: '/admin/orders', label: t('adminNav.orders'), labelSub: t('adminNav.ordersSub'), icon: Wallet },
    { href: '/admin/students', label: t('adminNav.students'), labelSub: t('adminNav.studentsSub'), icon: Users },
    { href: '/admin/courses', label: t('adminNav.courses'), labelSub: t('adminNav.coursesSub'), icon: BookOpen },
    { href: '/admin/chapters-v2', label: t('adminNav.chaptersSimple'), labelSub: t('adminNav.chaptersSub'), icon: Video },
    { href: '/admin/chapters', label: t('adminNav.chaptersDetail'), labelSub: t('adminNav.chaptersDetailSub'), icon: FileVideo },
    // { href: '/admin/grades', label: t('adminNav.grades'), labelSub: t('adminNav.gradesSub'), icon: BarChart3 }, // 퀴즈 기능 비활성화
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
                    {t('adminNav.adminPanel')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageToggle />
                <div className="[&_button]:text-porcelain [&_.text-\[\#2D241E\]]:text-porcelain">
                  <NotificationBell />
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-porcelain/70 hover:text-porcelain transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('adminNav.studentView')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row">
          {/* Sidebar */}
          <nav className="w-full sm:w-72 bg-white border-r border-museum-border min-h-[calc(100vh-4rem)] relative z-10">
            <div className="p-6">
              <span className="text-[9px] uppercase tracking-[0.3em] text-taupe block mb-4">
                {t('adminNav.navigation')}
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
                          {item.labelSub}
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
