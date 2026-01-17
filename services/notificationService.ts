import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification, NotificationType } from '@/types';

// 알림 생성
export async function createNotification(
  uid: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: { courseId?: string; orderId?: string; courseName?: string }
): Promise<string> {
  try {
    const notificationData = {
      uid,
      type,
      title,
      message,
      isRead: false,
      data: data || {},
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('알림 생성에 실패했습니다.');
  }
}

// 사용자 알림 조회
export async function getNotifications(uid: string, limitCount: number = 20): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
    } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('알림을 불러오는데 실패했습니다.');
  }
}

// 읽지 않은 알림 개수 조회
export async function getUnreadCount(uid: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

// 알림 읽음 처리
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('알림 읽음 처리에 실패했습니다.');
  }
}

// 모든 알림 읽음 처리
export async function markAllAsRead(uid: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { isRead: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('알림 읽음 처리에 실패했습니다.');
  }
}

// === 알림 생성 헬퍼 함수들 ===

// 결제 승인 알림 생성
export async function notifyPaymentApproved(
  uid: string,
  courseName: string,
  courseId: string,
  orderId: string
): Promise<void> {
  await createNotification(
    uid,
    'PAYMENT_APPROVED',
    'Thanh toán đã được duyệt! / 결제가 승인되었습니다!',
    `Khóa học "${courseName}" đã sẵn sàng. Nhấn để bắt đầu học ngay!\n"${courseName}" 코스가 준비되었습니다. 지금 바로 수강을 시작하세요!`,
    { courseId, orderId, courseName }
  );
}

// 수강 시작 알림 생성
export async function notifyCourseStarted(
  uid: string,
  courseName: string,
  courseId: string,
  endDate: Date
): Promise<void> {
  const formattedDate = endDate.toLocaleDateString('vi-VN');
  await createNotification(
    uid,
    'COURSE_STARTED',
    'Bắt đầu học! / 수강이 시작되었습니다!',
    `Khóa học "${courseName}" đã bắt đầu. Thời hạn: đến ${formattedDate}.\n"${courseName}" 수강이 시작되었습니다. 수강 기한: ${formattedDate}까지`,
    { courseId, courseName }
  );
}

// 만료 임박 알림 생성 (7일 전)
export async function notifyExpiringSoon(
  uid: string,
  courseName: string,
  courseId: string,
  daysRemaining: number
): Promise<void> {
  await createNotification(
    uid,
    'EXPIRING_SOON',
    'Sắp hết hạn! / 수강 기간이 곧 만료됩니다!',
    `Khóa học "${courseName}" sẽ hết hạn sau ${daysRemaining} ngày. Hãy gia hạn ngay!\n"${courseName}" 코스가 ${daysRemaining}일 후 만료됩니다. 지금 연장하세요!`,
    { courseId, courseName }
  );
}

// 만료 알림 생성
export async function notifyExpired(
  uid: string,
  courseName: string,
  courseId: string
): Promise<void> {
  await createNotification(
    uid,
    'EXPIRED',
    'Đã hết hạn / 수강 기간이 만료되었습니다',
    `Khóa học "${courseName}" đã hết hạn. Gia hạn để tiếp tục học.\n"${courseName}" 코스의 수강 기간이 만료되었습니다. 연장하여 계속 학습하세요.`,
    { courseId, courseName }
  );
}

// 입금 확인 요청 알림 (관리자용)
export async function notifyDepositRequest(
  adminUid: string,
  userName: string,
  courseName: string,
  orderId: string,
  amount: number
): Promise<void> {
  await createNotification(
    adminUid,
    'DEPOSIT_REQUEST',
    '입금 확인 요청 / Yêu cầu xác nhận thanh toán',
    `${userName}님이 "${courseName}" 코스에 ${amount.toLocaleString()}원 입금 완료를 알렸습니다. 확인이 필요합니다.`,
    { orderId, courseName }
  );
}

// 관리자 UID 조회 (알림 발송용)
export async function getAdminUids(): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching admin UIDs:', error);
    return [];
  }
}
