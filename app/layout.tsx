import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'AJU E&J LMS - 베트남 유학생 온라인 교육 플랫폼',
  description: 'AJU E&J 소속 베트남 유학생을 위한 전용 온라인 교육 서비스',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}