import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, CourseSubscription, ShippingAddress } from '@/types';

// 은행 계좌 정보 (상수)
export const BANK_INFO = {
  bankName: '신한은행',
  accountNumber: '110-123-456789',
  accountHolder: 'AJU E&J',
};

// 주문 생성 파라미터
export interface CreateOrderParams {
  uid: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseName: string;
  months: number;
  courseAmount: number;      // 강의 금액
  depositorName: string;
  hasTextbook: boolean;      // 교재 구매 여부
  textbookAmount?: number;   // 교재 금액
  shippingAddress?: ShippingAddress; // 배송지 정보
}

// 주문 생성 (무통장 입금 신청)
export async function createOrder(params: CreateOrderParams): Promise<string> {
  try {
    const {
      uid,
      userEmail,
      userName,
      courseId,
      courseName,
      months,
      courseAmount,
      depositorName,
      hasTextbook,
      textbookAmount = 0,
      shippingAddress
    } = params;

    // 총 결제 금액 계산
    const totalAmount = courseAmount + (hasTextbook ? textbookAmount : 0);

    const orderData: Omit<Order, 'id' | 'createdAt' | 'paidAt' | 'cancelledAt'> & { createdAt: any } = {
      uid,
      userEmail,
      userName,
      courseId,
      courseName,
      months,
      amount: totalAmount,
      courseAmount,
      depositorName,
      hasTextbook,
      status: 'PENDING_PAYMENT' as OrderStatus,
      createdAt: serverTimestamp(),
    };

    // 교재 구매 시 추가 정보
    if (hasTextbook) {
      orderData.textbookAmount = textbookAmount;
      if (shippingAddress) {
        orderData.shippingAddress = shippingAddress;
      }
    }

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('주문 생성에 실패했습니다.');
  }
}

// 주문 목록 조회 (관리자용)
export async function getOrders(status?: OrderStatus): Promise<Order[]> {
  try {
    let q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(
        collection(db, 'orders'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      paidAt: doc.data().paidAt?.toDate(),
      cancelledAt: doc.data().cancelledAt?.toDate(),
      depositConfirmedAt: doc.data().depositConfirmedAt?.toDate(),
    } as Order));

    // 입금 확인 요청한 주문을 우선 정렬
    return orders.sort((a, b) => {
      // PENDING_PAYMENT 상태에서 depositConfirmed가 true인 것을 우선
      if (a.status === 'PENDING_PAYMENT' && b.status === 'PENDING_PAYMENT') {
        if (a.depositConfirmed && !b.depositConfirmed) return -1;
        if (!a.depositConfirmed && b.depositConfirmed) return 1;
      }
      return 0; // 기본 정렬 유지 (createdAt desc)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('주문 목록을 불러오는데 실패했습니다.');
  }
}

// 사용자별 주문 조회
export async function getOrdersByUser(uid: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      paidAt: doc.data().paidAt?.toDate(),
      cancelledAt: doc.data().cancelledAt?.toDate(),
      depositConfirmedAt: doc.data().depositConfirmedAt?.toDate(),
    } as Order));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw new Error('주문 목록을 불러오는데 실패했습니다.');
  }
}

// 입금 완료 확인 요청 (유저가 입금 후 클릭)
export async function confirmDeposit(orderId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      depositConfirmed: true,
      depositConfirmedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error confirming deposit:', error);
    throw new Error('입금 확인 요청에 실패했습니다.');
  }
}

// 주문 승인 (입금 확인) - Transaction 사용
export async function approveOrder(orderId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      const orderData = orderDoc.data();

      if (orderData.status !== 'PENDING_PAYMENT') {
        throw new Error('이미 처리된 주문입니다.');
      }

      // 주문 상태 업데이트
      transaction.update(orderRef, {
        status: 'PAID',
        paidAt: serverTimestamp(),
      });

      // 사용자 구독 정보 업데이트
      const userRef = doc(db, 'users', orderData.uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentSubscriptions = userData.courseSubscriptions || {};

      // 새 구독 정보 (READY 상태 - 유저가 시작 버튼 누르면 ACTIVE로 변경)
      const newSubscription: CourseSubscription = {
        approved: true,
        status: 'READY',
        isStarted: false,
        months: orderData.months,
        orderId: orderId,
        approvedAt: new Date(),
      };

      transaction.update(userRef, {
        courseSubscriptions: {
          ...currentSubscriptions,
          [orderData.courseId]: newSubscription,
        },
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('Error approving order:', error);
    throw error;
  }
}

// 주문 취소
export async function cancelOrder(orderId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'CANCELLED',
      cancelledAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw new Error('주문 취소에 실패했습니다.');
  }
}

// 수강 시작 (유저가 직접 시작) - Transaction 사용
export async function startCourse(uid: string, courseId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const subscription = userData.courseSubscriptions?.[courseId];

      if (!subscription) {
        throw new Error('구독 정보를 찾을 수 없습니다.');
      }

      if (!subscription.approved) {
        throw new Error('승인되지 않은 구독입니다.');
      }

      if (subscription.isStarted || subscription.status === 'ACTIVE') {
        throw new Error('이미 수강이 시작된 코스입니다.');
      }

      // 시작일과 만료일 계산
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (subscription.months || 1));

      // 구독 상태 업데이트
      transaction.update(userRef, {
        [`courseSubscriptions.${courseId}`]: {
          ...subscription,
          status: 'ACTIVE',
          isStarted: true,
          startDate: startDate,
          endDate: endDate,
        },
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('Error starting course:', error);
    throw error;
  }
}

// 구독 상태 확인 및 만료 처리
export function checkSubscriptionStatus(subscription: CourseSubscription): CourseSubscription {
  if (!subscription) return subscription;

  // 이미 만료 상태면 그대로 반환
  if (subscription.status === 'EXPIRED') return subscription;

  // ACTIVE 상태이고 endDate가 지났으면 EXPIRED로 변경
  if (subscription.status === 'ACTIVE' && subscription.endDate) {
    const endDate = subscription.endDate instanceof Date
      ? subscription.endDate
      : new Date(subscription.endDate as any);

    if (endDate < new Date()) {
      return { ...subscription, status: 'EXPIRED' };
    }
  }

  return subscription;
}
