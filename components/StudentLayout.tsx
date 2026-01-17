"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LayoutDashboard, TrendingUp, ShoppingBag, User, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import LanguageToggle from "@/components/LanguageToggle"
import NotificationBell from "@/components/NotificationBell"

interface StudentLayoutProps {
  children: ReactNode
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const { userData } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navigation = [
    { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('nav.courses'), href: "/courses", icon: BookOpen },
    { name: t('nav.myProgress'), href: "/my-progress", icon: TrendingUp },
    { name: t('nav.myOrders'), href: "/my-orders", icon: ShoppingBag },
  ]

  return (
    <div className="min-h-screen bg-[#F5F3ED]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E1D8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-[#2D241E]">AJU E&J</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C857E]">Korean Academy</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                      isActive ? "bg-[#4A5D4E] text-white" : "text-[#8C857E] hover:bg-[#F5F3ED] hover:text-[#2D241E]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F5F3ED] rounded-lg">
                <User className="w-4 h-4 text-[#8C857E]" />
                <span className="text-sm text-[#2D241E]">{userData?.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-[#8C857E] hover:text-[#2D241E] hover:bg-[#F5F3ED] rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-[#E5E1D8] px-4 py-2 flex gap-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm flex-1 justify-center transition-all ${
                  isActive ? "bg-[#4A5D4E] text-white" : "text-[#8C857E] hover:bg-[#F5F3ED] hover:text-[#2D241E]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#2D241E] text-[#F5F3ED] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-[#F5F3ED]/70 mb-2">{t('footer.copyright')}</p>
          <p className="text-xs text-[#F5F3ED]/50">
            {t('footer.disclaimer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
