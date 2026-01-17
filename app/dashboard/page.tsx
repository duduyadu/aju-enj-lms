"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth, SubscriptionStatus } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import LanguageToggle from "@/components/LanguageToggle"
import {
  BookOpen,
  Lock,
  LogOut,
  User,
  PlayCircle,
  MessageCircle,
  HelpCircle,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react"

interface ChapterData {
  id: string
  title: string
  courseId: string
  order: number
  videoUrl?: string
  quiz?: {
    questions: any[]
  }
}

interface ProgressData {
  chapterId: string
  isCompleted: boolean
  watchedDuration: number
  totalDuration: number
  watchedPercent: number
}

// 시간 포맷팅 함수
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}


export default function DashboardPage() {
  const router = useRouter()
  const { firebaseUser, userData, loading, checkSessionValid, hasValidSubscription, getSubscriptionStatus } = useAuth()
  const { t } = useLanguage()
  const subscriptionStatus = getSubscriptionStatus()
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [progress, setProgress] = useState<ProgressData[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push("/login")
      } else if (userData) {
        fetchData()
      }
    }
  }, [loading, firebaseUser, userData, router])

  const fetchData = async () => {
    if (!userData) return

    try {
      const { db } = await import("@/lib/firebase")
      const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore")

      // Fetch chapters (실제 업로드된 강의만)
      const chaptersSnapshot = await getDocs(query(collection(db, "chapters"), orderBy("order", "asc")))
      const chaptersData = chaptersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChapterData[]
      setChapters(chaptersData)

      // Fetch user progress
      const progressQuery = query(collection(db, "progress"), where("userId", "==", userData.uid))
      const progressSnapshot = await getDocs(progressQuery)
      const progressData = progressSnapshot.docs.map((doc) => doc.data()) as ProgressData[]
      setProgress(progressData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setChapters([])
      setProgress([])
    } finally {
      setDataLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebase")
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      router.push("/")
    }
  }

  const isChapterCompleted = (chapterId: string) => {
    return progress.some((p) => p.chapterId === chapterId && p.isCompleted)
  }

  const getChapterProgress = (chapterId: string): ProgressData | undefined => {
    return progress.find((p) => p.chapterId === chapterId)
  }

  const completedCount = progress.filter((p) => p.isCompleted).length
  const totalCount = chapters.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3ED] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E1D8]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-[#2D241E]">AJU E&J</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C857E]">Korean Academy</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {userData.role === "admin" && (
                <Link href="/admin">
                  <button className="px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[#8C857E] hover:text-[#2D241E] border border-[#E5E1D8] rounded-lg hover:border-[#8C857E] transition-all">
                    {t('dashboard.admin')}
                  </button>
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F5F3ED] rounded-lg">
                <User className="w-4 h-4 text-[#8C857E]" />
                <span className="text-sm text-[#2D241E]">{userData.name}</span>
              </div>
              <LanguageToggle />
              <button
                onClick={handleSignOut}
                className="p-2 text-[#8C857E] hover:text-[#2D241E] hover:bg-[#F5F3ED] rounded-lg transition-all"
                title={t('common.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mb-2">{t('dashboard.welcomeBack')}</p>
            <h2 className="text-3xl font-bold text-[#2D241E] mb-2">{t('dashboard.hello')}, {userData.name}!</h2>
            <p className="text-[#8C857E]">{t('dashboard.startLearning')}</p>
          </div>

          {/* Progress Overview */}
          {subscriptionStatus.isActive && totalCount > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E1D8] p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E] mb-1">{t('dashboard.myProgress')}</p>
                  <p className="text-2xl font-bold text-[#2D241E]">{progressPercent}% {t('dashboard.completed')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#8C857E]">
                    {completedCount} / {totalCount} {t('dashboard.lessons').toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="w-full h-2 bg-[#F5F3ED] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A5D4E] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 구독 상태 표시 */}
              {subscriptionStatus.status === 'active' && subscriptionStatus.daysRemaining >= 0 && (
                <div className={`mt-4 pt-4 border-t border-[#E5E1D8] flex items-center justify-between ${
                  subscriptionStatus.daysRemaining <= 7 ? 'text-[#F59E0B]' : 'text-[#8C857E]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {t('subscription.daysRemaining').replace('{days}', String(subscriptionStatus.daysRemaining))}
                    </span>
                  </div>
                  {subscriptionStatus.endDate && (
                    <span className="text-xs">
                      {t('subscription.until')} {subscriptionStatus.endDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              {subscriptionStatus.status === 'unlimited' && (
                <div className="mt-4 pt-4 border-t border-[#E5E1D8] flex items-center gap-2 text-[#4A5D4E]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('subscription.unlimited')}</span>
                </div>
              )}
            </div>
          )}

          {/* 구독 만료 경고 (7일 이하 남은 경우) */}
          {subscriptionStatus.isActive && subscriptionStatus.status === 'active' && subscriptionStatus.daysRemaining <= 7 && subscriptionStatus.daysRemaining > 0 && (
            <div className="bg-[#FEF3E2] border border-[#F59E0B]/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                <div className="flex-1">
                  <p className="text-sm text-[#92400E] font-medium">
                    {t('subscription.expiringMessage').replace('{days}', String(subscriptionStatus.daysRemaining))}
                  </p>
                </div>
                <a
                  href="https://zalo.me/ajuenj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#F59E0B] text-white rounded-lg text-xs font-medium hover:bg-[#D97706] transition-all"
                >
                  {t('subscription.renew')}
                </a>
              </div>
            </div>
          )}

          {/* Payment Status - 구독이 없거나 만료된 경우 */}
          {(!subscriptionStatus.isActive) && (
            <div className={`rounded-2xl p-6 mb-6 ${
              subscriptionStatus.status === 'expired'
                ? 'bg-[#FEE2E2] border border-[#EF4444]/30'
                : 'bg-[#FEF3E2] border border-[#F59E0B]/30'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  subscriptionStatus.status === 'expired'
                    ? 'bg-[#EF4444]/20'
                    : 'bg-[#F59E0B]/20'
                }`}>
                  <Lock className={`w-6 h-6 ${
                    subscriptionStatus.status === 'expired' ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-1 ${
                    subscriptionStatus.status === 'expired' ? 'text-[#DC2626]' : 'text-[#92400E]'
                  }`}>
                    {subscriptionStatus.status === 'expired' ? t('subscription.expired') : t('payment.waiting')}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    subscriptionStatus.status === 'expired' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                  }`}>
                    {subscriptionStatus.status === 'expired'
                      ? t('subscription.expiredMessage')
                      : t('payment.waitingMessage')
                    }
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://zalo.me/ajuenj"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A5D4E] text-white rounded-lg text-sm font-medium hover:bg-[#3A4D3E] transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {subscriptionStatus.status === 'expired' ? t('subscription.renew') : t('payment.contactZalo')}
                    </a>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#92400E] rounded-lg text-sm font-medium border border-[#F59E0B]/30 hover:bg-[#FEF3E2] transition-all">
                      <HelpCircle className="w-4 h-4" />
                      {t('payment.paymentGuide')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapters Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C857E] mb-1">{t('dashboard.lessons')}</p>
                <h3 className="text-xl font-bold text-[#2D241E]">{t('dashboard.lessonList')}</h3>
              </div>
              <span className="text-sm text-[#8C857E]">{t('dashboard.totalLessons').replace('{count}', String(totalCount))}</span>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin" />
              </div>
            ) : chapters.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E1D8] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F5F3ED] flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-[#8C857E]" />
                </div>
                <p className="text-[#8C857E]">{t('dashboard.noLessons')}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {chapters.map((chapter, index) => {
                  const completed = isChapterCompleted(chapter.id)
                  const chapterProgress = getChapterProgress(chapter.id)
                  const watchedPercent = chapterProgress?.watchedPercent || 0
                  const watchedDuration = chapterProgress?.watchedDuration || 0
                  const totalDuration = chapterProgress?.totalDuration || 0
                  const isFirstChapter = chapter.order === 1
                  const canAccess = subscriptionStatus.isActive || isFirstChapter
                  const locked = !canAccess

                  return (
                    <div
                      key={chapter.id}
                      onClick={async () => {
                        if (canAccess) {
                          // 세션 유효성 확인 후 강의 페이지로 이동
                          const isValid = await checkSessionValid()
                          if (isValid) {
                            router.push(`/learn/${chapter.id}`)
                          } else {
                            router.push('/login')
                          }
                        } else {
                          alert(`${t('payment.needPermission')}\n${t('payment.firstFree')}`)
                        }
                      }}
                      className={`
                        bg-white rounded-2xl border border-[#E5E1D8] p-5
                        transition-all duration-300 cursor-pointer
                        ${locked ? "opacity-60" : "hover:shadow-lg hover:border-[#4A5D4E]/30 hover:-translate-y-1"}
                        ${completed ? "border-[#4A5D4E]/50" : ""}
                      `}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isFirstChapter ? 'bg-[#D4AF37] text-white' : 'bg-[#4A5D4E] text-white'
                          }`}>
                            <PlayCircle className="w-3.5 h-3.5" />
                            Lesson {chapter.order}
                          </span>
                          {isFirstChapter && !subscriptionStatus.isActive && (
                            <span className="px-2 py-0.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">
                              {t('common.free')}
                            </span>
                          )}
                        </div>
                        {locked ? (
                          <Lock className="w-5 h-5 text-[#8C857E]" />
                        ) : completed ? (
                          <div className="w-6 h-6 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : watchedPercent > 0 ? (
                          <div className="text-right">
                            <span className="text-sm font-bold text-[#4A5D4E]">{watchedPercent}%</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#F5F3ED] flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#8C857E]" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-[#2D241E] mb-3 line-clamp-2">{chapter.title}</h4>

                      {/* Progress Bar */}
                      {!locked && (watchedPercent > 0 || completed) && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-[#8C857E]">
                              {formatTime(watchedDuration)} / {formatTime(totalDuration)}
                            </span>
                            <span className={`text-[10px] font-medium ${
                              completed ? 'text-[#4A5D4E]' : 'text-[#8C857E]'
                            }`}>
                              {completed ? t('dashboard.completedStatus') : `${watchedPercent}%`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F5F3ED] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                completed ? 'bg-[#4A5D4E]' : 'bg-gradient-to-r from-[#4A5D4E] to-[#6B8F71]'
                              }`}
                              style={{ width: `${completed ? 100 : watchedPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-sm text-[#8C857E]">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          {t('dashboard.quiz')} {t('dashboard.quizCount').replace('{count}', String(chapter.quiz?.questions?.length || 0))}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2D241E] text-[#F5F3ED] py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-[#F5F3ED]/70 mb-2">{t('footer.copyright')}</p>
          <p className="text-xs text-[#F5F3ED]/50">
            {t('footer.disclaimer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
