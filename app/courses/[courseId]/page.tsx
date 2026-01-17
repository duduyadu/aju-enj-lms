'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import StudentLayout from '@/components/StudentLayout';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chapter, Course, User, Progress, Order, ShippingAddress } from '@/types';
import { createOrder, getOrdersByUser, BANK_INFO, startCourse, checkSubscriptionStatus, confirmDeposit } from '@/services/orderService';
import { notifyDepositRequest, getAdminUids } from '@/services/notificationService';
import TextbookSelector from '@/components/TextbookSelector';
import ShippingForm from '@/components/ShippingForm';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  BookOpen,
  Info,
  Lock,
  Play,
  CreditCard,
  X,
  Wallet,
  Calendar,
  AlertCircle,
  Loader2,
  Copy,
  CheckCheck,
  Send,
  Package
} from 'lucide-react';

// 시간 포맷팅 함수
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 코스별 접근 권한 확인 함수
function hasCourseAccess(userData: User | null, courseId: string): boolean {
  if (!userData) return false;

  // 코스별 구독 확인
  const subscription = userData.courseSubscriptions?.[courseId];
  if (subscription?.approved && subscription.status === 'ACTIVE') {
    if (!subscription.endDate) return true; // 무제한
    const endDate = subscription.endDate instanceof Date
      ? subscription.endDate
      : new Date(subscription.endDate as any);
    if (endDate > new Date()) return true;
  }

  // 레거시: 기존 isPaid 사용자는 모든 코스 접근 가능
  if (userData.isPaid && !userData.courseSubscriptions) {
    if (!userData.subscriptionEndDate) return true; // 무제한
    const endDate = userData.subscriptionEndDate instanceof Date
      ? userData.subscriptionEndDate
      : new Date(userData.subscriptionEndDate as any);
    return endDate > new Date();
  }

  return false;
}

// 구독 상태 타입
type SubscriptionState = 'NONE' | 'PENDING_PAYMENT' | 'READY' | 'ACTIVE' | 'EXPIRED';

// 기본 가격 (가격 정보가 없을 때)
const DEFAULT_PRICES = {
  months3: 300000,
  months6: 500000,
  months12: 800000,
};

interface ProgressData {
  chapterId: string;
  isCompleted: boolean;
  watchedDuration: number;
  totalDuration: number;
  watchedPercent: number;
}

export default function ChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // 클라이언트에서 실제 URL 경로를 파싱하여 courseId 추출
  const [courseId, setCourseId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const courseIndex = pathParts.indexOf('courses');
      if (courseIndex !== -1 && pathParts[courseIndex + 1]) {
        // trailing slash 제거
        const id = pathParts[courseIndex + 1].replace(/\/$/, '');
        if (id && id !== 'dummy') {
          setCourseId(id);
        }
      }
    }
  }, []);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // 결제 모달 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<3 | 6 | 12>(3);
  const [depositorName, setDepositorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // 교재 및 배송 상태
  const [includeTextbook, setIncludeTextbook] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipientName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    streetAddress: '',
    note: ''
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // 수강 시작 로딩
  const [isStarting, setIsStarting] = useState(false);

  // 입금 확인 요청 로딩
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (userData && courseId) {
      fetchCourseData();
      fetchUserOrders();
    }
  }, [userData, authLoading, courseId, router]);

  const fetchCourseData = async () => {
    try {
      // 코스 정보 가져오기
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse({ ...courseDoc.data(), id: courseDoc.id } as Course);
      } else {
        toast.error('코스를 찾을 수 없습니다.');
        router.push('/courses');
        return;
      }

      // 챕터 목록 가져오기
      const q = query(collection(db, 'chapters'), where('courseId', '==', courseId));
      const snapshot = await getDocs(q);
      const chapterData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Chapter));

      chapterData.sort((a, b) => a.order - b.order);
      setChapters(chapterData);

      // 진행률 데이터 가져오기
      if (userData) {
        const progressQuery = query(
          collection(db, 'progress'),
          where('userId', '==', userData.uid),
          where('courseId', '==', courseId)
        );
        const progressSnapshot = await getDocs(progressQuery);
        const progressData = progressSnapshot.docs.map(doc => doc.data()) as ProgressData[];
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    if (!userData) return;
    try {
      const orders = await getOrdersByUser(userData.uid);
      setUserOrders(orders.filter(o => o.courseId === courseId));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // 현재 구독 상태 확인
  const getSubscriptionState = (): SubscriptionState => {
    if (!userData) return 'NONE';

    // 레거시 사용자 체크
    if (userData.isPaid && !userData.courseSubscriptions) {
      return 'ACTIVE';
    }

    const subscription = userData.courseSubscriptions?.[courseId];
    if (!subscription) {
      // 입금 대기 중인 주문이 있는지 확인
      const pendingOrder = userOrders.find(o => o.status === 'PENDING_PAYMENT');
      if (pendingOrder) return 'PENDING_PAYMENT';
      return 'NONE';
    }

    // 만료 체크
    const checkedSubscription = checkSubscriptionStatus(subscription);
    return checkedSubscription.status;
  };

  const subscriptionState = getSubscriptionState();

  // 가격 계산
  const getCoursePrice = (months: 3 | 6 | 12): number => {
    const pricing = course?.pricing || DEFAULT_PRICES;
    switch (months) {
      case 3: return pricing.months3;
      case 6: return pricing.months6;
      case 12: return pricing.months12;
    }
  };

  // 교재 가격
  const getTextbookPrice = (): number => {
    return course?.textbookInfo?.price || 0;
  };

  // 총 결제 금액
  const getTotalPrice = (months: 3 | 6 | 12): number => {
    const coursePrice = getCoursePrice(months);
    const textbookPrice = includeTextbook ? getTextbookPrice() : 0;
    return coursePrice + textbookPrice;
  };

  // 배송지 유효성 검사
  const validateShippingAddress = (): boolean => {
    if (!includeTextbook) return true;

    const errors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!shippingAddress.recipientName.trim()) {
      errors.recipientName = 'Vui lòng nhập tên người nhận / 수취인명을 입력해주세요';
    }
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại / 연락처를 입력해주세요';
    }
    if (!shippingAddress.province.trim()) {
      errors.province = 'Vui lòng nhập Tỉnh/Thành phố / 성/시를 입력해주세요';
    }
    if (!shippingAddress.district.trim()) {
      errors.district = 'Vui lòng nhập Quận/Huyện / 군/구를 입력해주세요';
    }
    if (!shippingAddress.ward.trim()) {
      errors.ward = 'Vui lòng nhập Phường/Xã / 동/면을 입력해주세요';
    }
    if (!shippingAddress.streetAddress.trim()) {
      errors.streetAddress = 'Vui lòng nhập địa chỉ chi tiết / 상세주소를 입력해주세요';
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 결제 신청 핸들러
  const handlePaymentSubmit = async () => {
    if (!userData || !course) return;

    if (!depositorName.trim()) {
      toast.error('Vui lòng nhập tên người gửi tiền / 입금자명을 입력해주세요.');
      return;
    }

    // 교재 구매 시 배송지 검증
    if (!validateShippingAddress()) {
      toast.error('Vui lòng nhập đầy đủ thông tin giao hàng / 배송지 정보를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        uid: userData.uid,
        userEmail: userData.email,
        userName: userData.name,
        courseId,
        courseName: course.title,
        months: selectedMonths,
        courseAmount: getCoursePrice(selectedMonths),
        depositorName: depositorName.trim(),
        hasTextbook: includeTextbook,
        textbookAmount: includeTextbook ? getTextbookPrice() : 0,
        shippingAddress: includeTextbook ? shippingAddress : undefined
      });

      toast.success('Đăng ký thanh toán thành công!\n결제 신청이 완료되었습니다!');
      setShowPaymentModal(false);
      setDepositorName('');
      setIncludeTextbook(false);
      setShippingAddress({
        recipientName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        streetAddress: '',
        note: ''
      });
      fetchUserOrders();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('결제 신청에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 입금 완료 확인 요청
  const handleConfirmDeposit = async () => {
    const pendingOrder = userOrders.find(o => o.status === 'PENDING_PAYMENT');
    if (!pendingOrder || !userData || !course) return;

    if (pendingOrder.depositConfirmed) {
      toast('Đã gửi yêu cầu xác nhận rồi / 이미 입금 확인을 요청했습니다.');
      return;
    }

    setIsConfirmingDeposit(true);
    try {
      await confirmDeposit(pendingOrder.id);

      // 관리자에게 알림 전송
      const adminUids = await getAdminUids();
      for (const adminUid of adminUids) {
        await notifyDepositRequest(
          adminUid,
          userData.name,
          course.title,
          pendingOrder.id,
          pendingOrder.amount
        );
      }

      toast.success('Đã gửi yêu cầu xác nhận thanh toán!\n입금 확인 요청이 전송되었습니다!');
      fetchUserOrders();
    } catch (error) {
      console.error('Confirm deposit error:', error);
      toast.error('요청에 실패했습니다.');
    } finally {
      setIsConfirmingDeposit(false);
    }
  };

  // 수강 시작 핸들러
  const handleStartCourse = async () => {
    if (!userData) return;

    setIsStarting(true);
    try {
      await startCourse(userData.uid, courseId);
      toast.success('수강이 시작되었습니다!');
      // 페이지 새로고침하여 상태 업데이트
      window.location.reload();
    } catch (error: any) {
      console.error('Start course error:', error);
      toast.error(error.message || '수강 시작에 실패했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  // 계좌번호 복사
  const copyAccountNumber = () => {
    navigator.clipboard.writeText(BANK_INFO.accountNumber);
    setCopiedAccount(true);
    toast.success('계좌번호가 복사되었습니다.');
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const getChapterProgress = (chapterId: string): ProgressData | undefined => {
    return progress.find((p) => p.chapterId === chapterId);
  };

  // 남은 일수 계산
  const getRemainingDays = (): number => {
    const subscription = userData?.courseSubscriptions?.[courseId];
    if (!subscription?.endDate) return -1;
    const endDate = subscription.endDate instanceof Date
      ? subscription.endDate
      : new Date(subscription.endDate as any);
    const diff = endDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const pendingOrder = userOrders.find(o => o.status === 'PENDING_PAYMENT');

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 코스 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/courses"
              className="flex items-center gap-2 text-[#4A5D4E] hover:text-[#3a4a3e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">코스 목록</span>
            </Link>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2D241E] mb-2">{course.title}</h1>
          <p className="text-[#8C857E]">{course.description}</p>
        </div>

        {/* 구독 상태 카드 */}
        <div className="mb-8">
          {subscriptionState === 'NONE' && (
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D241E] mb-1">수강권 구매가 필요합니다</h3>
                    <p className="text-sm text-[#8C857E]">
                      1강은 무료로 체험할 수 있습니다. 전체 강의를 수강하시려면 수강권을 구매해주세요.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3 bg-[#D4AF37] text-white rounded-xl font-medium hover:bg-[#C49F2E] transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Wallet className="w-5 h-5" />
                  수강권 구매
                </button>
              </div>
            </div>
          )}

          {subscriptionState === 'PENDING_PAYMENT' && pendingOrder && (
            <div className="bg-[#FEF3E2] border border-[#F59E0B]/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#92400E]">
                      Đang chờ xác nhận thanh toán / 입금 확인 대기 중
                    </h3>
                    {pendingOrder.depositConfirmed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Đã gửi yêu cầu / 확인 요청됨
                      </span>
                    )}
                  </div>
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[#8C857E]">Số tiền / 입금 금액:</span>
                        <span className="ml-2 font-semibold text-[#2D241E]">
                          {pendingOrder.amount.toLocaleString()}원
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8C857E]">Thời hạn / 수강 기간:</span>
                        <span className="ml-2 font-semibold text-[#2D241E]">{pendingOrder.months} tháng/개월</span>
                      </div>
                      <div>
                        <span className="text-[#8C857E]">Người gửi / 입금자명:</span>
                        <span className="ml-2 font-semibold text-[#2D241E]">{pendingOrder.depositorName}</span>
                      </div>
                      <div>
                        <span className="text-[#8C857E]">Ngày đăng ký / 신청일:</span>
                        <span className="ml-2 font-semibold text-[#2D241E]">
                          {pendingOrder.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      {pendingOrder.hasTextbook && (
                        <div className="col-span-2">
                          <span className="text-[#8C857E] flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            Giáo trình / 교재:
                          </span>
                          <span className="ml-2 font-semibold text-[#2D241E]">
                            Có mua giáo trình / 교재 포함 ({pendingOrder.textbookAmount?.toLocaleString()}원)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-white/50 rounded-lg p-3 mb-3">
                    <span className="text-[#92400E]">Tài khoản / 입금 계좌:</span>
                    <span className="font-mono font-semibold text-[#2D241E]">
                      {BANK_INFO.bankName} {BANK_INFO.accountNumber} ({BANK_INFO.accountHolder})
                    </span>
                    <button
                      onClick={copyAccountNumber}
                      className="ml-2 p-1 hover:bg-[#F59E0B]/10 rounded transition-colors"
                    >
                      {copiedAccount ? (
                        <CheckCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#92400E]" />
                      )}
                    </button>
                  </div>

                  {/* 입금 완료 버튼 */}
                  {!pendingOrder.depositConfirmed && (
                    <button
                      onClick={handleConfirmDeposit}
                      disabled={isConfirmingDeposit}
                      className="w-full py-3 bg-[#F59E0B] text-white rounded-xl font-medium hover:bg-[#D97706] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isConfirmingDeposit ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Tôi đã chuyển khoản / 입금 완료했습니다
                        </>
                      )}
                    </button>
                  )}
                  {pendingOrder.depositConfirmed && (
                    <p className="text-sm text-[#92400E] text-center">
                      Quản trị viên sẽ xác nhận trong 1-2 ngày làm việc.
                      <br />
                      관리자가 영업일 기준 1-2일 내에 확인합니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {subscriptionState === 'READY' && (
            <div className="bg-[#4A5D4E]/10 border border-[#4A5D4E]/30 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#4A5D4E]/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#4A5D4E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D241E] mb-1">결제가 완료되었습니다!</h3>
                    <p className="text-sm text-[#8C857E]">
                      수강 시작 버튼을 누르면 학습이 시작됩니다. 시작일로부터{' '}
                      <strong className="text-[#4A5D4E]">
                        {userData?.courseSubscriptions?.[courseId]?.months || 1}개월
                      </strong>
                      간 수강 가능합니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartCourse}
                  disabled={isStarting}
                  className="px-6 py-3 bg-[#4A5D4E] text-white rounded-xl font-medium hover:bg-[#3a4a3e] transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isStarting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  수강 시작하기
                </button>
              </div>
            </div>
          )}

          {subscriptionState === 'ACTIVE' && (
            <div className="bg-[#4A5D4E]/10 border border-[#4A5D4E]/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#4A5D4E]" />
                  <span className="text-sm text-[#4A5D4E]">
                    {getRemainingDays() > 0 ? (
                      <>
                        수강 기간: <strong>{getRemainingDays()}일</strong> 남음
                      </>
                    ) : getRemainingDays() === -1 ? (
                      <strong>무제한 수강</strong>
                    ) : (
                      '수강 기간 확인 중...'
                    )}
                  </span>
                </div>
                <span className="px-3 py-1 bg-[#4A5D4E] text-white text-xs font-medium rounded-full">
                  수강 중
                </span>
              </div>
            </div>
          )}

          {subscriptionState === 'EXPIRED' && (
            <div className="bg-[#FEE2E2] border border-[#EF4444]/30 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-[#EF4444]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#DC2626] mb-1">수강 기간이 만료되었습니다</h3>
                    <p className="text-sm text-[#B91C1C]">
                      계속 학습하시려면 수강권을 다시 구매해주세요.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3 bg-[#EF4444] text-white rounded-xl font-medium hover:bg-[#DC2626] transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Wallet className="w-5 h-5" />
                  수강권 갱신
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 챕터 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-[#4A5D4E]" />
            <h2 className="text-xl font-semibold text-[#2D241E]">
              강의 목차 ({chapters.length}개)
            </h2>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-[#8C857E]">
              등록된 강의가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter, index) => {
                const isFirstChapter = chapter.order === 1;
                const canAccess = hasCourseAccess(userData, courseId) || isFirstChapter;
                const chapterProgress = getChapterProgress(chapter.id);
                const watchedPercent = chapterProgress?.watchedPercent || 0;
                const watchedDuration = chapterProgress?.watchedDuration || 0;
                const totalDuration = chapterProgress?.totalDuration || 0;
                const isCompleted = chapterProgress?.isCompleted || false;

                const ChapterContent = (
                  <div className={`border rounded-lg p-4 transition-colors ${
                    canAccess
                      ? 'border-[#E5E1D8] hover:bg-[#F5F3ED] cursor-pointer group'
                      : 'border-[#E5E1D8] bg-[#F5F3ED]/50 opacity-75'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold mr-4 text-lg ${
                          isCompleted
                            ? 'bg-[#4A5D4E] text-white'
                            : isFirstChapter
                              ? 'bg-[#D4AF37] text-white'
                              : canAccess
                                ? 'bg-[#4A5D4E] text-white'
                                : 'bg-[#8C857E] text-white'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold transition-colors ${
                              canAccess
                                ? 'text-[#2D241E] group-hover:text-[#4A5D4E]'
                                : 'text-[#8C857E]'
                            }`}>
                              {chapter.title}
                            </h3>
                            {isFirstChapter && (
                              <span className="px-2 py-0.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full uppercase">
                                무료
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-[#4A5D4E] text-white text-[10px] font-bold rounded-full">
                                완료
                              </span>
                            )}
                            {!canAccess && (
                              <span className="px-2 py-0.5 bg-[#8C857E] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                수강권 필요
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-[#8C857E]">
                            {chapter.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {chapter.duration}분
                              </span>
                            )}
                            {/* 퀴즈 표시 비활성화 */}
                            {/* {chapter.quiz && (
                              <span className="flex items-center gap-1 text-[#4A5D4E]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                퀴즈 {chapter.quiz.questions.length}문제
                              </span>
                            )} */}
                          </div>

                          {/* 진행률 표시 */}
                          {canAccess && (watchedPercent > 0 || isCompleted) && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[#8C857E]">
                                  {formatTime(watchedDuration)} / {formatTime(totalDuration)}
                                </span>
                                <span className={`text-[10px] font-medium ${
                                  isCompleted ? 'text-[#4A5D4E]' : 'text-[#D4AF37]'
                                }`}>
                                  {Math.round(watchedPercent)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#F5F3ED] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isCompleted ? 'bg-[#4A5D4E]' : 'bg-[#D4AF37]'
                                  }`}
                                  style={{ width: `${Math.min(watchedPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`transition-colors ${
                        canAccess
                          ? 'text-[#8C857E] group-hover:text-[#4A5D4E]'
                          : 'text-[#8C857E]'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-[#4A5D4E]" />
                        ) : canAccess ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                );

                return canAccess ? (
                  <a key={chapter.id} href={`/learn/${chapter.id}/`} className="block">
                    {ChapterContent}
                  </a>
                ) : (
                  <div
                    key={chapter.id}
                    onClick={() => {
                      if (subscriptionState === 'NONE' || subscriptionState === 'EXPIRED') {
                        setShowPaymentModal(true);
                      } else if (subscriptionState === 'READY') {
                        toast('수강 시작 버튼을 눌러주세요.');
                      } else if (subscriptionState === 'PENDING_PAYMENT') {
                        toast('입금 확인 후 수강 가능합니다.');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {ChapterContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AJU E&J 학습 안내 */}
        <div className="mt-8 p-6 bg-[#4A5D4E]/5 border border-[#4A5D4E]/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#4A5D4E] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#2D241E] mb-3">AJU E&J 학습 가이드</h3>
              <ul className="text-sm text-[#8C857E] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  각 강의를 순서대로 수강하는 것을 권장합니다
                </li>
                {/* 퀴즈 가이드 비활성화 */}
                {/* <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  강의 시청 후 퀴즈를 풀어 학습 내용을 확인하세요
                </li> */}
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  모든 학습 기록은 자동으로 저장됩니다
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4A5D4E]">•</span>
                  문의사항은 Zalo로 연락주세요
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 신청 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#2D241E]">
                  Mua khóa học <span className="text-[#8C857E] font-normal text-base">/ 수강권 구매</span>
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F3ED] flex items-center justify-center hover:bg-[#E5E1D8] transition-colors"
                >
                  <X className="w-4 h-4 text-[#8C857E]" />
                </button>
              </div>

              {/* 코스 정보 */}
              <div className="bg-[#F5F3ED] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#8C857E]">Khóa học đã chọn / 선택한 코스</p>
                <p className="font-semibold text-[#2D241E]">{course?.title}</p>
              </div>

              {/* 기간 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2D241E] mb-3">
                  Chọn thời hạn học <span className="text-[#8C857E] font-normal">/ 수강 기간 선택</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([3, 6, 12] as const).map((months) => (
                    <button
                      key={months}
                      onClick={() => setSelectedMonths(months)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedMonths === months
                          ? 'border-[#4A5D4E] bg-[#4A5D4E]/5'
                          : 'border-[#E5E1D8] hover:border-[#4A5D4E]/50'
                      }`}
                    >
                      <div className="text-2xl font-bold text-[#2D241E]">{months}</div>
                      <div className="text-xs text-[#8C857E]">tháng/개월</div>
                      <div className="text-sm font-semibold text-[#4A5D4E] mt-2">
                        {getCoursePrice(months).toLocaleString()}원
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 교재 선택 (교재 정보가 있을 때만 표시) */}
              {course?.textbookInfo && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D241E] mb-3">
                    Giáo trình <span className="text-[#8C857E] font-normal">/ 교재 (선택)</span>
                  </label>
                  <TextbookSelector
                    textbook={course.textbookInfo}
                    selected={includeTextbook}
                    onToggle={setIncludeTextbook}
                  />
                </div>
              )}

              {/* 배송지 입력 (교재 선택 시) */}
              {includeTextbook && (
                <div className="mb-6">
                  <ShippingForm
                    value={shippingAddress}
                    onChange={setShippingAddress}
                    errors={shippingErrors}
                  />
                </div>
              )}

              {/* 입금자명 입력 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2D241E] mb-2">
                  Tên người gửi tiền <span className="text-[#8C857E] font-normal">/ 입금자명</span>
                </label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="Nhập tên người gửi tiền / 입금자명을 입력해주세요"
                  className="w-full px-4 py-3 bg-[#F5F3ED] rounded-xl text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30"
                />
              </div>

              {/* 입금 계좌 정보 */}
              <div className="bg-[#4A5D4E]/5 border border-[#4A5D4E]/20 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-[#4A5D4E] mb-2">
                  Tài khoản ngân hàng / 입금 계좌
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-semibold text-[#2D241E]">
                      {BANK_INFO.bankName} {BANK_INFO.accountNumber}
                    </p>
                    <p className="text-sm text-[#8C857E]">Chủ TK / 예금주: {BANK_INFO.accountHolder}</p>
                  </div>
                  <button
                    onClick={copyAccountNumber}
                    className="p-2 hover:bg-[#4A5D4E]/10 rounded-lg transition-colors"
                  >
                    {copiedAccount ? (
                      <CheckCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-[#4A5D4E]" />
                    )}
                  </button>
                </div>
              </div>

              {/* 결제 금액 내역 */}
              <div className="border-t border-[#E5E1D8] pt-4 mb-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8C857E]">Khóa học / 강의 ({selectedMonths} tháng/개월)</span>
                  <span className="text-[#2D241E]">{getCoursePrice(selectedMonths).toLocaleString()}원</span>
                </div>
                {includeTextbook && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8C857E]">Giáo trình / 교재</span>
                    <span className="text-[#2D241E]">{getTextbookPrice().toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E1D8]">
                  <span className="font-medium text-[#2D241E]">Tổng cộng / 총 결제 금액</span>
                  <span className="text-2xl font-bold text-[#4A5D4E]">
                    {getTotalPrice(selectedMonths).toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-[#F5F3ED] text-[#8C857E] rounded-xl font-medium hover:bg-[#E5E1D8] transition-colors"
                >
                  Hủy / 취소
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting || !depositorName.trim()}
                  className="flex-1 py-3 bg-[#4A5D4E] text-white rounded-xl font-medium hover:bg-[#3a4a3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Đăng ký / 결제 신청
                    </>
                  )}
                </button>
              </div>

              {/* 안내 */}
              <p className="text-xs text-[#8C857E] text-center mt-4">
                Sau khi xác nhận thanh toán, khóa học sẽ bắt đầu (trong 1-2 ngày làm việc).
                <br />
                입금 확인 후 수강이 시작됩니다. (영업일 기준 1-2일 소요)
              </p>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
