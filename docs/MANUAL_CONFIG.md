# AJU E&J LMS 수동 설정 가이드

이 문서는 시스템에서 수동으로 설정해야 하는 항목들을 정리합니다.

---

## 1. 은행 계좌 정보 변경

**파일 위치**: `app/courses/[courseId]/page.tsx`

```typescript
// 약 87번째 줄
const BANK_INFO = {
  bankName: 'Vietcombank',           // 은행명
  accountNumber: '1234567890',        // 계좌번호
  accountHolder: 'AJU E&J',          // 예금주
};
```

### 변경 방법
1. 위 파일을 열어 `BANK_INFO` 객체를 찾습니다.
2. 실제 은행 정보로 수정합니다.
3. 저장 후 재배포합니다.

---

## 2. QR 코드 결제 시스템 (추후 구현)

현재 QR 코드 결제 시스템은 구현되어 있지 않습니다.

### 구현 시 고려사항

#### VietQR 연동 방법
1. **VietQR API 연동**: https://vietqr.io/
2. **동적 QR 생성**: 결제 금액에 따라 QR 코드 자동 생성
3. **구현 위치**: 결제 모달 (`app/courses/[courseId]/page.tsx`)

#### 추가해야 할 코드 (예시)
```typescript
// VietQR URL 생성 함수
const generateVietQR = (amount: number, memo: string) => {
  const bankId = 'VCB';  // Vietcombank 코드
  const accountNo = '1234567890';
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}`;
};
```

#### QR 코드 표시 위치
결제 모달의 은행 계좌 정보 아래에 QR 이미지를 추가:
```tsx
<img
  src={generateVietQR(getTotalPrice(selectedMonths), `${user?.name}_${course?.title}`)}
  alt="VietQR Payment"
  className="w-48 h-48 mx-auto"
/>
```

---

## 3. Zalo 연락처 변경

**파일 위치**: `types/index.ts`

```typescript
// 약 226번째 줄
export const ZALO_CONFIG = {
  phoneNumber: '0901234567',  // TODO: 실제 Zalo 번호로 교체
  getUrl: () => `https://zalo.me/${ZALO_CONFIG.phoneNumber}`,
};
```

### 변경 방법
1. `phoneNumber`를 실제 Zalo 번호로 변경합니다.
2. 저장 후 재배포합니다.

---

## 4. 배송업체 추가

**파일 위치**: `types/index.ts`

```typescript
// 약 11번째 줄
export type TrackingCarrier = 'GHTK' | 'VIETTEL_POST' | 'VNPOST' | 'OTHER';

// 약 14번째 줄
export const TRACKING_URLS: Record<TrackingCarrier, string> = {
  GHTK: 'https://tracking.ghtk.vn?code=',
  VIETTEL_POST: 'https://viettelpost.vn/tra-cuu?code=',
  VNPOST: 'https://vnpost.vn/vi-vn/tra-cuu?code=',
  OTHER: '',
};
```

### 새 배송업체 추가 방법
1. `TrackingCarrier` 타입에 새 업체 코드 추가
2. `TRACKING_URLS`에 해당 업체의 추적 URL 추가
3. 관리자 주문 페이지에서 사용 가능

---

## 5. 교재 설정

### 관리자 페이지에서 설정
1. 관리자 → 코스 관리 페이지 이동
2. 코스 추가/수정 시 "교재 설정" 섹션에서:
   - 교재 판매 활성화 체크
   - 교재명 입력
   - 교재 가격 입력 (VND)
   - 교재 이미지 URL (선택)
   - 교재 설명 (선택)

### Firestore에 직접 추가 (필요시)
```json
// courses/{courseId} 문서
{
  "textbookInfo": {
    "name": "TOPIK 한국어 초급",
    "price": 150000,
    "imageUrl": "https://example.com/textbook.jpg",
    "description": "초급 학습자를 위한 교재"
  }
}
```

---

## 6. 기본 가격 설정

**파일 위치**: `app/courses/[courseId]/page.tsx`

```typescript
// 약 75번째 줄
const DEFAULT_PRICES = {
  months1: 120000,
  months3: 300000,
  months6: 500000,
  months12: 800000,
};
```

> **참고**: 이 가격은 코스에 개별 가격이 설정되지 않은 경우에만 사용됩니다.
> 각 코스별 가격은 관리자 페이지에서 설정하세요.

---

## 7. 학습 인정 기준

**파일 위치**: `types/index.ts`

```typescript
// 약 232번째 줄
export const STUDY_CONFIG = {
  minStudyMinutes: 10,  // 최소 10분 이상 학습해야 "학습한 날"로 인정
};
```

---

## 8. 만료 경고 일수

**파일 위치**: `types/index.ts`

```typescript
// 약 237번째 줄
export const EXPIRY_WARNING_DAYS = 7;  // 만료 7일 전부터 경고 표시
```

---

## 체크리스트

배포 전 확인사항:

- [ ] 은행 계좌 정보 설정 완료
- [ ] Zalo 연락처 설정 완료
- [ ] 코스별 가격 설정 완료
- [ ] 교재 정보 설정 완료 (필요시)
- [ ] QR 코드 시스템 연동 (선택)

---

## 문의

기술 지원이 필요한 경우 개발팀에 문의하세요.
