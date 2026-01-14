# AJU E&J LMS Firebase 배포 가이드

## ✅ 완료된 준비사항
- ✅ Firebase 프로젝트 생성 완료 (online-education-8e1cb)
- ✅ 빌드 오류 해결 (Tailwind CSS 및 Next.js 설정)
- ✅ npm run build 성공
- ✅ firebase-tools 전역 설치 완료

## 배포 완료를 위한 다음 단계

### 1단계: Firebase 로그인 (수동 작업 필요)
터미널이나 명령 프롬프트를 열고 다음 명령어를 실행하세요:
```bash
firebase login
```
- 브라우저 창이 자동으로 열립니다
- Firebase 프로젝트에 접근 권한이 있는 Google 계정으로 로그인하세요
- 필요한 권한을 승인하세요

### 2단계: Firebase Hosting 초기화
로그인이 성공하면 다음 명령어를 실행하세요:
```bash
firebase init hosting
```

프롬프트가 나타나면 다음과 같이 선택하세요:
1. **"Use an existing project"** → `online-education-8e1cb` 선택
2. **"What do you want to use as your public directory?"** → `out` 입력
3. **"Configure as a single-page app?"** → Yes (y 입력)
4. **"Set up automatic builds and deploys with GitHub?"** → No (n 입력)
5. **"Overwrite out/404.html?"** → No (n 입력)
6. **"Overwrite out/index.html?"** → No (n 입력)

### 3단계: Firebase에 배포
배포 명령어를 실행하세요:
```bash
npm run deploy
```

또는 직접 실행:
```bash
firebase deploy --only hosting
```

### 4단계: 배포된 앱 접속
배포가 성공하면 다음과 같은 메시지가 표시됩니다:
```
✔ Deploy complete!
Project Console: https://console.firebase.google.com/project/online-education-8e1cb/overview
Hosting URL: https://online-education-8e1cb.web.app
```

앱 주소: **https://online-education-8e1cb.web.app**

## 관리자 계정 설정

### 1단계: 관리자 계정 생성
1. 배포된 앱 접속: https://online-education-8e1cb.web.app
2. Google로 로그인
3. 프로필 설정 완료 (이름, Zalo ID, 지역, 한국어 레벨)

### 2단계: 관리자 권한 부여
1. [Firebase Console](https://console.firebase.google.com/project/online-education-8e1cb/firestore) 접속
2. **Firestore Database** → **users** 컬렉션으로 이동
3. 본인 이메일로 사용자 문서 찾기
4. 문서를 클릭하여 편집
5. `role` 필드를 `"student"`에서 `"admin"`으로 변경
6. **Update** 클릭

### 3단계: 관리자 패널 접속
1. 로그아웃 후 다시 로그인 (권한 새로고침)
2. `/admin`으로 이동하여 관리자 패널 접속
3. 상단에 "AJU E&J Admin Panel" 확인

## 문제 해결

### "out 디렉토리를 찾을 수 없음" 오류가 나타날 경우:
```bash
npm run build
```
빌드 후 다시 배포를 시도하세요.

### 권한 오류가 발생할 경우:
1. 올바른 Google 계정으로 로그인했는지 확인
2. Firebase Console에서 Editor 또는 Owner 역할이 있는지 확인
3. 로그아웃 후 다시 로그인:
```bash
firebase logout
firebase login
```

### 배포 후 404 오류가 나타날 경우:
1. 빌드가 성공적으로 완료되었는지 확인
2. `out` 디렉토리가 존재하고 내용이 있는지 확인
3. firebase.json에 올바른 호스팅 설정이 있는지 확인

## 배포 명령어 요약
```bash
# 전체 배포 순서
firebase login               # 최초 1회 설정
firebase init hosting       # 최초 1회 설정
npm run build              # 앱 빌드
npm run deploy             # Firebase에 배포
```

## 주요 URL
- **메인 앱**: https://online-education-8e1cb.web.app
- **Firebase 콘솔**: https://console.firebase.google.com/project/online-education-8e1cb
- **호스팅 대시보드**: https://console.firebase.google.com/project/online-education-8e1cb/hosting

## 지원
배포 중 문제가 발생하면 다음을 확인하세요:
1. Firebase 상태: https://status.firebase.google.com/
2. Firebase 문서: https://firebase.google.com/docs/hosting
3. Next.js 배포: https://nextjs.org/docs/deployment

## 추가 참고사항

### 배포 후 확인사항
- ✅ 학생 로그인 기능 작동
- ✅ 관리자 패널 접속 가능
- ✅ 과정/챕터 추가 기능 작동
- ✅ 학생 승인/거부 기능 작동
- ✅ 모바일 반응형 디자인 확인

### 보안 설정 (배포 후 필수)
Firebase Console에서 다음 보안 규칙을 설정하세요:

1. **Firestore 보안 규칙** (Firestore → Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 문서만 읽기/쓰기 가능
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // 관리자는 모든 사용자 문서 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 과정과 챕터는 모든 인증된 사용자가 읽기 가능, 관리자만 쓰기 가능
    match /courses/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /chapters/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

2. **Storage 보안 규칙** (Storage → Rules):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```