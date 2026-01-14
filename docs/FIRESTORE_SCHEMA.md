# Firestore Database Schema

## 📚 Collections Structure

### 1. users (컬렉션)
```
/users/{userId}
{
  uid: string,
  email: string,
  name: string,
  zaloId: string,
  location: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  role: 'student' | 'admin',
  isPaid: boolean,                    // 관리자가 수동으로 입금 확인 후 변경
  currentSessionId: string,            // 중복 로그인 방지용
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. courses (컬렉션)
```
/courses/{courseId}
{
  title: string,
  description: string,
  thumbnail: string,                   // Storage URL
  isActive: boolean,
  order: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. chapters (컬렉션)
```
/chapters/{chapterId}
{
  courseId: string,                    // 참조: courses collection
  title: string,
  description: string,
  videoUrl: string,                    // Storage URL or YouTube URL
  order: number,
  duration: number,                    // 분 단위
  quiz: {
    questions: [
      {
        id: string,
        text: string,
        options: string[],
        correctAnswer: number,
        explanation: string
      }
    ]
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. submissions (컬렉션)
```
/submissions/{submissionId}
{
  userId: string,                      // 참조: users collection
  chapterId: string,                   // 참조: chapters collection
  courseId: string,                    // 참조: courses collection
  answers: number[],
  score: number,
  feedback: string,
  createdAt: timestamp
}
```

### 5. progress (컬렉션)
```
/progress/{progressId}
{
  userId: string,                      // 참조: users collection
  courseId: string,                    // 참조: courses collection
  chapterId: string,                   // 참조: chapters collection
  isCompleted: boolean,
  watchedDuration: number,             // 초 단위
  lastWatchedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔐 보안 규칙 (Security Rules) 예시

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 정보
    match /users/{userId} {
      allow read: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // 코스 정보
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 챕터 정보
    match /chapters/{chapterId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isPaid == true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 제출 정보
    match /submissions/{submissionId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // 진도 정보
    match /progress/{progressId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🎯 인덱스 설정 권장사항

1. **users 컬렉션**
   - 단일 필드 인덱스: `email`, `role`, `isPaid`
   - 복합 인덱스: `role` + `isPaid`

2. **chapters 컬렉션**
   - 단일 필드 인덱스: `courseId`, `order`
   - 복합 인덱스: `courseId` + `order`

3. **progress 컬렉션**
   - 복합 인덱스: `userId` + `courseId`

4. **submissions 컬렉션**
   - 복합 인덱스: `userId` + `chapterId`