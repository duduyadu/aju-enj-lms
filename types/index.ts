// 코스별 구독 정보
export interface CourseSubscription {
  approved: boolean;          // 승인 여부
  startDate?: Date;           // 구독 시작일
  endDate?: Date;             // 구독 만료일
  months?: number;            // 구독 기간 (개월 수)
}

// User 타입 정의
export interface User {
  uid: string;                // Firebase Auth UID
  email: string;              // 이메일
  name: string;               // 이름
  zaloId?: string;            // Zalo ID (베트남 메신저)
  location?: string;          // 거주 지역
  level?: 'beginner' | 'intermediate' | 'advanced';  // 학습 수준
  role: 'student' | 'admin'; // 사용자 역할
  isPaid: boolean;            // 결제 승인 여부 (하위 호환성 유지)
  currentSessionId?: string;  // 현재 세션 ID (중복 로그인 방지)

  // 코스별 구독 정보
  courseSubscriptions?: {
    [courseId: string]: CourseSubscription;
  };

  // 전역 구독 관련 필드 (하위 호환성)
  subscriptionStartDate?: Date;  // 구독 시작일
  subscriptionEndDate?: Date;    // 구독 만료일
  subscriptionMonths?: number;   // 구독 기간 (개월 수)

  createdAt: Date;            // 가입일
  updatedAt: Date;            // 마지막 수정일
}

// Course 타입 정의
export interface Course {
  id: string;                 // 코스 ID
  title: string;              // 코스 제목
  description: string;        // 코스 설명
  thumbnail?: string;         // 썸네일 이미지 URL
  isActive: boolean;          // 코스 활성화 여부
  order: number;              // 정렬 순서
  createdAt: Date;            // 생성일
  updatedAt: Date;            // 마지막 수정일
}

// Chapter 타입 정의
export interface Chapter {
  id: string;                 // 챕터 ID
  courseId: string;           // 소속 코스 ID
  title: string;              // 챕터 제목
  description?: string;       // 챕터 설명
  videoUrl: string;           // 비디오 URL (Firebase Storage or YouTube)
  order: number;              // 정렬 순서
  duration?: number;          // 영상 길이 (분)
  quiz?: Quiz;                // 퀴즈 (선택사항)
  createdAt: Date;            // 생성일
  updatedAt: Date;            // 마지막 수정일
}

// Quiz 타입 정의
export interface Quiz {
  questions: Question[];      // 문제 배열
}

// Question 타입 정의
export interface Question {
  id: string;                 // 문제 ID
  text: string;               // 문제 내용
  options: string[];          // 선택지 배열
  correctAnswer: number;      // 정답 인덱스
  explanation?: string;       // 해설 (선택사항)
}

// Submission 타입 정의 (퀴즈 제출)
export interface Submission {
  id: string;                 // 제출 ID
  userId: string;             // 사용자 ID
  chapterId: string;          // 챕터 ID
  courseId: string;           // 코스 ID
  answers: number[];          // 사용자가 선택한 답안
  score: number;              // 점수
  feedback?: string;          // 피드백 (선택사항)
  createdAt: Date;            // 제출일
}

// Progress 타입 정의 (학습 진도)
export interface Progress {
  id: string;                 // 진도 ID
  userId: string;             // 사용자 ID
  courseId: string;           // 코스 ID
  chapterId: string;          // 챕터 ID
  isCompleted: boolean;       // 완료 여부
  watchedDuration: number;    // 시청 시간 (초)
  totalDuration: number;      // 영상 전체 길이 (초)
  watchedPercent: number;     // 시청 진행률 (0-100)
  lastWatchedAt: Date;        // 마지막 시청 시간
  createdAt: Date;            // 최초 시청일
  updatedAt: Date;            // 마지막 수정일
}