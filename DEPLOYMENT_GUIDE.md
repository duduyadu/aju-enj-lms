# 🚀 AJU E&J LMS 배포 가이드

## 📌 배포 URL
- **메인 도메인**: https://aju-enj-lms.web.app
- **대체 도메인**: https://aju-enj-lms.firebaseapp.com

## 🔧 배포 전 준비사항

### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인
```bash
firebase login
```

### 3. 환경 변수 설정
`.env.local` 파일이 제대로 설정되어 있는지 확인:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

## 📦 빌드 및 배포

### 로컬 테스트
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

### Firebase 배포
```bash
npm run deploy
```

### 미리보기 채널 배포 (테스트용)
```bash
npm run deploy:preview
```

## 🔐 관리자 계정 설정

1. Firebase Console 접속
2. Firestore Database → users 컬렉션
3. 관리자로 만들 계정 선택
4. `role` 필드를 `admin`으로 변경
5. 저장

## 📱 관리자 페이지 접속

### 관리자 패널 URL
```
https://aju-enj-lms.web.app/admin
```

### 관리자 메뉴 구성
- `/admin` - 대시보드
- `/admin/students` - 학생 관리
- `/admin/courses` - 코스 관리
- `/admin/chapters-v2` - 챕터 관리 (간편 모드)
- `/admin/chapters` - 챕터 관리 (상세 모드)
- `/admin/grades` - 성적 조회

## ✅ 배포 후 체크리스트

### 기능 테스트
- [ ] 학생 회원가입
- [ ] 학생 로그인
- [ ] 관리자 로그인
- [ ] 관리자 페이지 접근 권한
- [ ] 학생 승인 기능
- [ ] 코스/챕터 추가
- [ ] 강의 시청
- [ ] 퀴즈 제출 및 자동 채점

### 보안 확인
- [ ] 일반 학생 계정으로 /admin 접근 차단 확인
- [ ] Firebase 보안 규칙 적용 확인
- [ ] 중복 로그인 차단 기능 확인

## 🛠 트러블슈팅

### 빌드 오류 발생 시
```bash
# node_modules 재설치
rm -rf node_modules
npm install
```

### 배포 실패 시
```bash
# Firebase 재인증
firebase logout
firebase login

# 프로젝트 재선택
firebase use --add
```

### 404 에러 발생 시
firebase.json의 rewrites 설정 확인:
```json
{
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

## 📞 문의

배포 관련 문제 발생 시:
- Email: admin@ajuenj.com
- 관리자 매뉴얼: /docs 폴더 참조