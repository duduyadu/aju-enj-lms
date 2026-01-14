# 프로젝트: AJU E&J 유학 온라인 교육 플랫폼 (AJU E&J LMS)

## 🎯 프로젝트 목표
- AJU E&J 소속 베트남 유학생을 위한 전용 온라인 교육 서비스
- 브랜드 아이덴티티(AJU E&J)를 반영한 전문적인 디자인
- 모바일 우선(Mobile-First) 반응형 디자인 및 계정 공유 방지 보안

## 🛠 테크 스택
- Framework: Next.js (App Router)
- Backend/Auth: Firebase (Auth, Firestore, Storage)
- Styling: Tailwind CSS
- Design System: AJU E&J 전용 테마 (Navy & Gold/Sky Blue 포인트)

## 🏛 데이터베이스 구조
- **users**: { uid, email, name, zaloId, location, level, role, isPaid, currentSessionId }
- **courses**: { id, title, description, thumbnail, isActive }
- **chapters**: { id, courseId, title, videoUrl, order, quiz: { questions: [] } }
- **submissions**: { id, userId, chapterId, score, feedback, createdAt }

## 🔒 핵심 보안 및 운영 규칙
1. **Single Session**: AJU E&J 계정 보안을 위해 중복 로그인 시 기존 세션 강제 로그아웃.
2. **Access Control**: AJU E&J 관리자가 입금 확인 후 'isPaid' 승인을 해야 강의 시청 가능.
3. **Branding**: 모든 페이지 헤더 및 푸터에 'AJU E&J' 로고 및 명칭 노출.