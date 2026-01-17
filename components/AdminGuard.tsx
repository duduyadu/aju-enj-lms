"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { userData, loading, firebaseUser } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkComplete, setCheckComplete] = useState(false)

  useEffect(() => {
    // 로딩 중이면 대기
    if (loading) return

    // 로그인 안 된 경우
    if (!firebaseUser || !userData) {
      router.push("/login")
      return
    }

    // 관리자가 아닌 경우
    if (userData.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // 권한 확인 완료
    setIsAuthorized(true)
    setCheckComplete(true)
  }, [userData, loading, firebaseUser, router])

  // 로딩 중이거나 권한 확인 중
  if (loading || (!checkComplete && !isAuthorized)) {
    return (
      <div className="min-h-screen bg-porcelain flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-botanical border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-taupe text-sm">권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 권한 없음 (리다이렉트 대기 중)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-porcelain flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-botanical border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-taupe text-sm">리다이렉트 중...</p>
        </div>
      </div>
    )
  }

  // 권한 있음 - children 렌더링
  return <>{children}</>
}
