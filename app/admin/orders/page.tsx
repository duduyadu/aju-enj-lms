'use client';

import { useState, useEffect } from 'react';
import { getOrders, approveOrder, cancelOrder, updateDeliveryStatus, updateTrackingNumber, BANK_INFO } from '@/services/orderService';
import { notifyPaymentApproved } from '@/services/notificationService';
import { Order, OrderStatus, DeliveryStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  BookOpen,
  Mail,
  Package,
  MapPin,
  Send,
  ChevronDown,
  ChevronUp,
  Bell,
  Truck,
  PackageCheck,
  Edit3,
  Save,
  X
} from 'lucide-react';

type FilterStatus = 'ALL' | OrderStatus;
type DeliveryFilterStatus = 'ALL' | 'NEEDS_SHIPPING' | DeliveryStatus;

export default function AdminOrdersPage() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING_PAYMENT');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilterStatus>('ALL');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [expandedShipping, setExpandedShipping] = useState<string | null>(null);

  // 운송장 입력 상태
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const status = filterStatus === 'ALL' ? undefined : filterStatus;
      const data = await getOrders(status);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(language === 'vi' ? 'Không thể tải danh sách đơn hàng' : '주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    const confirmMsg = language === 'vi'
      ? 'Xác nhận đã nhận tiền và phê duyệt đơn hàng này?'
      : '이 주문의 입금을 확인하고 승인하시겠습니까?';
    if (!confirm(confirmMsg)) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setProcessingOrderId(orderId);
    try {
      await approveOrder(orderId);

      try {
        await notifyPaymentApproved(
          order.uid,
          order.courseName,
          order.courseId,
          orderId
        );
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
      }

      toast.success(language === 'vi' ? 'Đã phê duyệt đơn hàng' : '주문이 승인되었습니다.');
      fetchOrders();
    } catch (error: any) {
      console.error('Error approving order:', error);
      toast.error(error.message || (language === 'vi' ? 'Phê duyệt thất bại' : '주문 승인에 실패했습니다.'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    const confirmMsg = language === 'vi' ? 'Bạn có chắc muốn hủy đơn hàng này?' : '이 주문을 취소하시겠습니까?';
    if (!confirm(confirmMsg)) return;

    setProcessingOrderId(orderId);
    try {
      await cancelOrder(orderId);
      toast.success(language === 'vi' ? 'Đã hủy đơn hàng' : '주문이 취소되었습니다.');
      fetchOrders();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || (language === 'vi' ? 'Hủy đơn thất bại' : '주문 취소에 실패했습니다.'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 운송장 저장
  const handleSaveTracking = async (orderId: string) => {
    if (!trackingInput.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập mã vận đơn' : '운송장 번호를 입력해주세요.');
      return;
    }

    setProcessingOrderId(orderId);
    try {
      await updateTrackingNumber(orderId, trackingInput.trim(), carrierInput.trim());
      toast.success(language === 'vi' ? 'Đã cập nhật mã vận đơn' : '운송장 번호가 저장되었습니다.');
      setEditingTrackingId(null);
      setTrackingInput('');
      setCarrierInput('');
      fetchOrders();
    } catch (error: any) {
      console.error('Error saving tracking:', error);
      toast.error(error.message || (language === 'vi' ? 'Cập nhật thất bại' : '운송장 저장에 실패했습니다.'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 배송 상태 변경
  const handleDeliveryStatusChange = async (orderId: string, newStatus: DeliveryStatus) => {
    setProcessingOrderId(orderId);
    try {
      await updateDeliveryStatus(orderId, newStatus);
      const statusLabel = newStatus === 'DELIVERED'
        ? (language === 'vi' ? 'Đã giao hàng' : '배송 완료')
        : (language === 'vi' ? 'Đang giao hàng' : '배송 중');
      toast.success(`${statusLabel}${language === 'vi' ? ' thành công' : '로 변경되었습니다.'}`);
      fetchOrders();
    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      toast.error(error.message || (language === 'vi' ? 'Cập nhật thất bại' : '배송 상태 변경에 실패했습니다.'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            {language === 'vi' ? 'Chờ thanh toán' : '입금 대기'}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            {language === 'vi' ? 'Đã duyệt' : '승인 완료'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            {language === 'vi' ? 'Đã hủy' : '취소됨'}
          </span>
        );
    }
  };

  const getDeliveryStatusBadge = (status?: DeliveryStatus) => {
    if (!status || status === 'PREPARING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
          <Package className="w-3 h-3" />
          {language === 'vi' ? 'Đang chuẩn bị' : '준비 중'}
        </span>
      );
    }
    if (status === 'SHIPPED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
          <Truck className="w-3 h-3" />
          {language === 'vi' ? 'Đang giao' : '배송 중'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
        <PackageCheck className="w-3 h-3" />
        {language === 'vi' ? 'Đã giao' : '배송 완료'}
      </span>
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    const locale = language === 'vi' ? 'vi-VN' : 'ko-KR';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 필터링된 주문 (배송 필터 적용)
  const filteredOrders = orders.filter(order => {
    if (deliveryFilter === 'ALL') return true;
    if (deliveryFilter === 'NEEDS_SHIPPING') {
      return order.hasTextbook && order.status === 'PAID' &&
        (!order.deliveryStatus || order.deliveryStatus === 'PREPARING');
    }
    return order.deliveryStatus === deliveryFilter;
  });

  // 통계 계산
  const pendingCount = orders.filter(o => o.status === 'PENDING_PAYMENT').length;
  const depositConfirmedCount = orders.filter(o => o.status === 'PENDING_PAYMENT' && o.depositConfirmed).length;
  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const needsShippingCount = orders.filter(o =>
    o.hasTextbook && o.status === 'PAID' && (!o.deliveryStatus || o.deliveryStatus === 'PREPARING')
  ).length;
  const totalPendingAmount = orders
    .filter(o => o.status === 'PENDING_PAYMENT')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-light text-espresso">
            {language === 'vi' ? 'Quản lý đơn hàng & vận chuyển' : '주문 및 배송 관리'}
          </h1>
          <p className="text-sm text-taupe mt-1">
            {language === 'vi' ? 'Quản lý đơn hàng và theo dõi vận chuyển' : '무통장 입금 주문 및 배송을 관리합니다'}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-botanical text-white rounded-xl hover:bg-botanical/90 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {language === 'vi' ? 'Làm mới' : '새로고침'}
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">
                {language === 'vi' ? 'Chờ thanh toán' : '입금 대기'}
              </p>
              <p className="text-2xl font-light text-espresso">{pendingCount}</p>
            </div>
          </div>
          {depositConfirmedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-museum-border">
              <div className="flex items-center gap-2 text-orange-600">
                <Bell className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">
                  {language === 'vi' ? `${depositConfirmedCount} yêu cầu xác nhận` : `입금확인 요청 ${depositConfirmedCount}건`}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">
                {language === 'vi' ? 'Đã duyệt' : '승인 완료'}
              </p>
              <p className="text-2xl font-light text-espresso">{paidCount}</p>
            </div>
          </div>
        </div>

        {/* 배송 대기 카드 */}
        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">
                {language === 'vi' ? 'Chờ gửi hàng' : '배송 대기'}
              </p>
              <p className="text-2xl font-light text-espresso">{needsShippingCount}</p>
            </div>
          </div>
          {needsShippingCount > 0 && (
            <div className="mt-3 pt-3 border-t border-museum-border">
              <button
                onClick={() => {
                  setFilterStatus('PAID');
                  setDeliveryFilter('NEEDS_SHIPPING');
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                {language === 'vi' ? 'Xem ngay →' : '바로 보기 →'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">
                {language === 'vi' ? 'Đã hủy' : '취소됨'}
              </p>
              <p className="text-2xl font-light text-espresso">{orders.filter(o => o.status === 'CANCELLED').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-museum-gold/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-museum-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">
                {language === 'vi' ? 'Số tiền chờ' : '대기 금액'}
              </p>
              <p className="text-xl font-light text-espresso">
                {totalPendingAmount.toLocaleString()}
                <span className="text-sm text-taupe ml-1">{language === 'vi' ? 'đ' : '원'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 입금 계좌 정보 */}
      <div className="bg-botanical/5 border border-botanical/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-botanical" />
          <div>
            <p className="text-sm font-medium text-espresso">
              {language === 'vi' ? 'Thông tin tài khoản nhận tiền' : '입금 계좌 정보'}
            </p>
            <p className="text-lg font-mono text-botanical">
              {BANK_INFO.bankName} {BANK_INFO.accountNumber} ({BANK_INFO.accountHolder})
            </p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-2xl p-4 border border-museum-border space-y-3">
        {/* 주문 상태 필터 */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-taupe" />
          <span className="text-sm text-taupe">{language === 'vi' ? 'Trạng thái:' : '주문 상태:'}</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'ALL' as FilterStatus, label: language === 'vi' ? 'Tất cả' : '전체' },
              { value: 'PENDING_PAYMENT' as FilterStatus, label: language === 'vi' ? 'Chờ thanh toán' : '입금 대기' },
              { value: 'PAID' as FilterStatus, label: language === 'vi' ? 'Đã duyệt' : '승인 완료' },
              { value: 'CANCELLED' as FilterStatus, label: language === 'vi' ? 'Đã hủy' : '취소됨' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setFilterStatus(value);
                  setDeliveryFilter('ALL');
                }}
                className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                  filterStatus === value
                    ? 'bg-botanical text-white'
                    : 'bg-museum-border/50 text-espresso hover:bg-museum-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 배송 상태 필터 (승인 완료 선택 시에만 표시) */}
        {filterStatus === 'PAID' && (
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-museum-border">
            <Truck className="w-4 h-4 text-taupe" />
            <span className="text-sm text-taupe">{language === 'vi' ? 'Vận chuyển:' : '배송 상태:'}</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'ALL' as DeliveryFilterStatus, label: language === 'vi' ? 'Tất cả' : '전체' },
                { value: 'NEEDS_SHIPPING' as DeliveryFilterStatus, label: language === 'vi' ? 'Cần gửi hàng' : '배송 필요' },
                { value: 'SHIPPED' as DeliveryFilterStatus, label: language === 'vi' ? 'Đang giao' : '배송 중' },
                { value: 'DELIVERED' as DeliveryFilterStatus, label: language === 'vi' ? 'Đã giao' : '배송 완료' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDeliveryFilter(value)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    deliveryFilter === value
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-2xl border border-museum-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-botanical animate-spin mx-auto mb-4" />
            <p className="text-taupe">{language === 'vi' ? 'Đang tải...' : '주문 목록을 불러오는 중...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-taupe/50 mx-auto mb-4" />
            <p className="text-taupe">{language === 'vi' ? 'Không có đơn hàng' : '표시할 주문이 없습니다.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-museum-border">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`p-6 transition-colors ${
                  order.status === 'PENDING_PAYMENT' && order.depositConfirmed
                    ? 'bg-orange-50 hover:bg-orange-100/80 border-l-4 border-l-orange-500'
                    : 'hover:bg-museum-border/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* 주문 정보 */}
                  <div className="flex-1 space-y-3">
                    {/* 상태 및 주문번호 */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(order.status)}
                      {order.status === 'PENDING_PAYMENT' && order.depositConfirmed && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full animate-pulse">
                          <Send className="w-3 h-3" />
                          {language === 'vi' ? 'Yêu cầu xác nhận' : '입금확인 요청됨'}
                        </span>
                      )}
                      {order.hasTextbook && (
                        <>
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            <Package className="w-3 h-3" />
                            {language === 'vi' ? 'Có giáo trình' : '교재 포함'}
                          </span>
                          {order.status === 'PAID' && getDeliveryStatusBadge(order.deliveryStatus)}
                        </>
                      )}
                      <span className="text-xs text-taupe font-mono">#{order.id.slice(-8)}</span>
                    </div>

                    {/* 사용자 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-espresso">
                        <User className="w-4 h-4 text-taupe" />
                        <span className="font-medium">{order.userName || (language === 'vi' ? 'Không có tên' : '이름 없음')}</span>
                      </div>
                      {order.userEmail && (
                        <div className="flex items-center gap-2 text-taupe">
                          <Mail className="w-4 h-4" />
                          {order.userEmail}
                        </div>
                      )}
                    </div>

                    {/* 코스 정보 */}
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-taupe" />
                      <span className="text-espresso">{order.courseName}</span>
                      <span className="text-taupe">• {order.months}{language === 'vi' ? ' tháng' : '개월'}</span>
                    </div>

                    {/* 결제 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-taupe" />
                        <span className="font-semibold text-botanical">
                          {order.amount.toLocaleString()}{language === 'vi' ? 'đ' : '원'}
                        </span>
                        {order.hasTextbook && order.courseAmount && (
                          <span className="text-xs text-taupe">
                            ({language === 'vi' ? 'Khóa học' : '강의'} {order.courseAmount.toLocaleString()} + {language === 'vi' ? 'Sách' : '교재'} {order.textbookAmount?.toLocaleString()})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-taupe">
                        <span>{language === 'vi' ? 'Người gửi:' : '입금자:'}</span>
                        <span className="font-medium text-espresso">{order.depositorName}</span>
                      </div>
                    </div>

                    {/* 교재 배송지 정보 */}
                    {order.hasTextbook && order.shippingAddress && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedShipping(expandedShipping === order.id ? null : order.id)}
                          className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>{language === 'vi' ? 'Địa chỉ giao hàng' : '배송지 정보'}</span>
                          {expandedShipping === order.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expandedShipping === order.id && (
                          <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm space-y-1">
                            <p><span className="text-taupe">{language === 'vi' ? 'Người nhận:' : '수취인:'}</span> <span className="text-espresso font-medium">{order.shippingAddress.recipientName}</span></p>
                            <p><span className="text-taupe">{language === 'vi' ? 'SĐT:' : '연락처:'}</span> <span className="text-espresso">{order.shippingAddress.phone}</span></p>
                            <p><span className="text-taupe">{language === 'vi' ? 'Địa chỉ:' : '주소:'}</span> <span className="text-espresso">
                              {order.shippingAddress.province}, {order.shippingAddress.district}, {order.shippingAddress.ward}
                            </span></p>
                            <p><span className="text-taupe">{language === 'vi' ? 'Chi tiết:' : '상세:'}</span> <span className="text-espresso">{order.shippingAddress.streetAddress}</span></p>
                            {order.shippingAddress.note && (
                              <p><span className="text-taupe">{language === 'vi' ? 'Ghi chú:' : '메모:'}</span> <span className="text-espresso">{order.shippingAddress.note}</span></p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 운송장 정보 (승인된 교재 주문만) */}
                    {order.hasTextbook && order.status === 'PAID' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        {editingTrackingId === order.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={carrierInput}
                                onChange={(e) => setCarrierInput(e.target.value)}
                                placeholder={language === 'vi' ? 'Đơn vị vận chuyển (VD: GHTK)' : '택배사 (예: GHTK)'}
                                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                placeholder={language === 'vi' ? 'Mã vận đơn' : '운송장 번호'}
                                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveTracking(order.id)}
                                disabled={processingOrderId === order.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                {processingOrderId === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                {language === 'vi' ? 'Lưu' : '저장'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTrackingId(null);
                                  setTrackingInput('');
                                  setCarrierInput('');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                              >
                                <X className="w-4 h-4" />
                                {language === 'vi' ? 'Hủy' : '취소'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="w-4 h-4 text-blue-600" />
                              {order.trackingNumber ? (
                                <span className="text-espresso">
                                  {order.carrier && <span className="font-medium">{order.carrier}: </span>}
                                  <span className="font-mono">{order.trackingNumber}</span>
                                </span>
                              ) : (
                                <span className="text-taupe">{language === 'vi' ? 'Chưa có mã vận đơn' : '운송장 미입력'}</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingTrackingId(order.id);
                                setTrackingInput(order.trackingNumber || '');
                                setCarrierInput(order.carrier || '');
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                            >
                              <Edit3 className="w-3 h-3" />
                              {order.trackingNumber ? (language === 'vi' ? 'Sửa' : '수정') : (language === 'vi' ? 'Nhập' : '입력')}
                            </button>
                          </div>
                        )}

                        {/* 배송 상태 변경 버튼 */}
                        {order.trackingNumber && order.deliveryStatus !== 'DELIVERED' && (
                          <div className="mt-2 pt-2 border-t border-blue-200 flex gap-2">
                            <button
                              onClick={() => handleDeliveryStatusChange(order.id, 'DELIVERED')}
                              disabled={processingOrderId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {processingOrderId === order.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <PackageCheck className="w-3 h-3" />
                              )}
                              {language === 'vi' ? 'Đánh dấu đã giao' : '배송 완료 처리'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 날짜 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-taupe">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {language === 'vi' ? 'Đặt hàng:' : '신청:'} {formatDate(order.createdAt)}
                      </div>
                      {order.depositConfirmedAt && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Send className="w-3 h-3" />
                          {language === 'vi' ? 'Yêu cầu xác nhận:' : '입금확인요청:'} {formatDate(order.depositConfirmedAt)}
                        </div>
                      )}
                      {order.paidAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          {language === 'vi' ? 'Duyệt:' : '승인:'} {formatDate(order.paidAt)}
                        </div>
                      )}
                      {order.shippedAt && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Truck className="w-3 h-3" />
                          {language === 'vi' ? 'Gửi hàng:' : '발송:'} {formatDate(order.shippedAt)}
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <PackageCheck className="w-3 h-3" />
                          {language === 'vi' ? 'Đã giao:' : '배송완료:'} {formatDate(order.deliveredAt)}
                        </div>
                      )}
                      {order.cancelledAt && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" />
                          {language === 'vi' ? 'Hủy:' : '취소:'} {formatDate(order.cancelledAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(order.id)}
                        disabled={processingOrderId === order.id}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          order.depositConfirmed
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {processingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {order.depositConfirmed
                          ? (language === 'vi' ? 'Xác nhận' : '입금확인 승인')
                          : (language === 'vi' ? 'Duyệt' : '승인')
                        }
                      </button>
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {language === 'vi' ? 'Hủy' : '취소'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
