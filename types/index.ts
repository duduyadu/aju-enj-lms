// 주문 상태
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

// 구독 상태
export type SubscriptionStatusType = 'READY' | 'ACTIVE' | 'EXPIRED';

// 배송지 정보 (베트남 주소 체계)
export interface ShippingAddress {
  recipientName: string;      // 수취인명 (Tên người nhận)
  phone: string;              // 연락처 (Số điện thoại)
  province: string;           // 성/시 (Tỉnh/Thành phố)
  district: string;           // 군/구 (Quận/Huyện)
  ward: string;               // 동/면 (Phường/Xã)
  streetAddress: string;      // 상세주소 (Địa chỉ chi tiết)
  note?: string;              // 배송 메모 (Ghi chú)
}

// 주문 정보 (무통장 입금)
export interface Order {
  id: string;                 // 주문 ID
  uid: string;                // 사용자 ID
  courseId: string;           // 코스 ID
  courseName: string;         // 코스명
  months: number;             // 구독 기간 (개월 수)
  amount: number;             // 결제 금액 (강의 + 교재)
  courseAmount: number;       // 강의 금액
  depositorName: string;      // 입금자명
  status: OrderStatus;        // 주문 상태
  userEmail?: string;         // 사용자 이메일
  userName?: string;          // 사용자 이름

  // 교재 관련
  hasTextbook: boolean;       // 교재 구매 여부
  textbookAmount?: number;    // 교재 금액
  shippingAddress?: ShippingAddress; // 배송지 정보

  // 입금 확인 요청
  depositConfirmed?: boolean; // 유저가 입금 완료 버튼 눌렀는지
  depositConfirmedAt?: Date;  // 입금 완료 버튼 누른 시간

  createdAt: Date;            // 주문일
  paidAt?: Date;              // 입금 확인일
  cancelledAt?: Date;         // 취소일
}

// 코스별 구독 정보
export interface CourseSubscription {
  approved: boolean;          // 승인 여부
  status: SubscriptionStatusType; // 구독 상태 (READY: 시작 대기, ACTIVE: 수강 중, EXPIRED: 만료)
  isStarted: boolean;         // 수강 시작 여부
  startDate?: Date;           // 구독 시작일 (유저가 시작 버튼 누른 시점)
  endDate?: Date;             // 구독 만료일
  months?: number;            // 구독 기간 (개월 수)
  orderId?: string;           // 연결된 주문 ID
  approvedAt?: Date;          // 승인일
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

// 코스 가격 정보
export interface CoursePricing {
  months3: number;            // 3개월 가격
  months6: number;            // 6개월 가격
  months12: number;           // 12개월 가격
}

// 교재 정보
export interface TextbookInfo {
  name: string;               // 교재명 (Tên giáo trình)
  price: number;              // 가격 (Giá)
  imageUrl?: string;          // 이미지 URL
  description?: string;       // 설명
}

// Course 타입 정의
export interface Course {
  id: string;                 // 코스 ID
  title: string;              // 코스 제목
  description: string;        // 코스 설명
  thumbnail?: string;         // 썸네일 이미지 URL
  isActive: boolean;          // 코스 활성화 여부
  order: number;              // 정렬 순서
  pricing?: CoursePricing;    // 가격 정보
  textbookInfo?: TextbookInfo; // 교재 정보
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

// 알림 타입
export type NotificationType =
  | 'PAYMENT_APPROVED'        // 결제 승인됨
  | 'COURSE_STARTED'          // 수강 시작됨
  | 'EXPIRING_SOON'           // 만료 임박 (7일 전)
  | 'EXPIRED'                 // 만료됨
  | 'DEPOSIT_REQUEST';        // 입금 확인 요청 (관리자용)

// 알림 정보
export interface Notification {
  id: string;                 // 알림 ID
  uid: string;                // 수신자 ID
  type: NotificationType;     // 알림 타입
  title: string;              // 제목
  message: string;            // 메시지
  isRead: boolean;            // 읽음 여부
  data?: {                    // 관련 데이터
    courseId?: string;
    orderId?: string;
    courseName?: string;
  };
  createdAt: Date;            // 생성일
}