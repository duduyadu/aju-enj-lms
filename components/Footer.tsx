export default function Footer() {
  return (
    <footer className="bg-[#2D241E] text-[#F5F3ED] py-10 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold text-lg mb-3">AJU E&J</h3>
            <p className="text-sm text-[#F5F3ED]/70 leading-relaxed">
              베트남 유학생을 위한 전문 한국어 교육 플랫폼
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold text-lg mb-3">Contact</h3>
            <ul className="text-sm text-[#F5F3ED]/70 space-y-2">
              <li>Email: admin@ajuenj.com</li>
              <li>Zalo: AJU E&J</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold text-lg mb-3">Legal</h3>
            <ul className="text-sm text-[#F5F3ED]/70 space-y-2">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#F5F3ED]/10 pt-6">
          <div className="text-center text-sm text-[#F5F3ED]/50">
            <p className="mb-2">© 2026 AJU E&J. All rights reserved.</p>
            <p className="text-xs">
              본 사이트의 모든 콘텐츠(영상, 텍스트, 이미지 등)는 AJU E&J의 자산으로서
              저작권법에 의해 보호됩니다. 무단 복제, 배포, 전송을 금지합니다.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
