import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AJU E&J LMS - 베트남 유학생 온라인 교육 플랫폼",
  description: "AJU E&J 소속 베트남 유학생을 위한 전용 온라인 교육 서비스",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* FOUC 방지: CSS 로드 완료 후 콘텐츠 표시 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html { visibility: hidden; opacity: 0; }
            html.ready { visibility: visible; opacity: 1; transition: opacity 0.1s ease-in; }
          `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function showPage() {
                document.documentElement.classList.add('ready');
              }
              // window.onload는 CSS 포함 모든 리소스 로드 후 실행
              if (document.readyState === 'complete') {
                showPage();
              } else {
                window.addEventListener('load', showPage);
              }
              // Fallback: 2초 후에도 표시되지 않으면 강제로 표시
              setTimeout(showPage, 2000);
            })();
          `
        }} />
      </head>
      <body className={`${geistSans.className} ${geistMono.className}`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#2D241E',
                  color: '#F5F3ED',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#4A5D4E',
                    secondary: '#F5F3ED',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#F5F3ED',
                  },
                },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}