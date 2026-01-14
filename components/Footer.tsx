import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-porcelain border-t border-museum-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
          {/* 브랜드 정보 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-botanical flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-porcelain" />
              </div>
              <span className="font-serif font-light text-xl text-espresso">AJU E&J</span>
            </div>
            <p className="text-taupe text-sm leading-relaxed">
              베트남 유학생을 위한<br />
              전문 온라인 교육 플랫폼
            </p>
          </div>

          {/* 연락처 */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-museum-gold mb-4">Contact</h4>
            <div className="space-y-2">
              <p className="text-taupe text-sm">admin@ajuenj.com</p>
              <p className="text-taupe text-sm">평일 09:00 - 18:00</p>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-museum-gold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-taupe text-sm hover:text-botanical transition-colors">
                  대시보드
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-taupe text-sm hover:text-botanical transition-colors">
                  강의 목록
                </Link>
              </li>
              <li>
                <Link href="/profile-setup" className="text-taupe text-sm hover:text-botanical transition-colors">
                  프로필 설정
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Gold Line */}
        <div className="gold-line w-full mb-8" />

        {/* 구분선 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">
            © 2024 AJU E&J. All rights reserved.
          </p>
          <p className="text-[10px] text-taupe/60">
            본 플랫폼의 모든 콘텐츠는 AJU E&J의 지적재산입니다
          </p>
        </div>
      </div>
    </footer>
  );
}