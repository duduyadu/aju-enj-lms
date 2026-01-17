'use client';

import { useState, useEffect } from 'react';
import { getOrders, approveOrder, cancelOrder, BANK_INFO } from '@/services/orderService';
import { notifyPaymentApproved } from '@/services/notificationService';
import { Order, OrderStatus } from '@/types';
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
  Bell
} from 'lucide-react';

type FilterStatus = 'ALL' | OrderStatus;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING_PAYMENT');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [expandedShipping, setExpandedShipping] = useState<string | null>(null);

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
      toast.error('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    if (!confirm('이 주문의 입금을 확인하고 승인하시겠습니까?')) return;

    // 승인할 주문 찾기
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setProcessingOrderId(orderId);
    try {
      await approveOrder(orderId);

      // 사용자에게 결제 승인 알림 전송
      try {
        await notifyPaymentApproved(
          order.uid,
          order.courseName,
          order.courseId,
          orderId
        );
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
        // 알림 실패해도 주문 승인은 성공으로 처리
      }

      toast.success('주문이 승인되었습니다.');
      fetchOrders();
    } catch (error: any) {
      console.error('Error approving order:', error);
      toast.error(error.message || '주문 승인에 실패했습니다.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('이 주문을 취소하시겠습니까?')) return;

    setProcessingOrderId(orderId);
    try {
      await cancelOrder(orderId);
      toast.success('주문이 취소되었습니다.');
      fetchOrders();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || '주문 취소에 실패했습니다.');
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
            입금 대기
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            승인 완료
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            취소됨
          </span>
        );
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 통계 계산
  const pendingCount = orders.filter(o => o.status === 'PENDING_PAYMENT').length;
  const depositConfirmedCount = orders.filter(o => o.status === 'PENDING_PAYMENT' && o.depositConfirmed).length;
  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;
  const totalPendingAmount = orders
    .filter(o => o.status === 'PENDING_PAYMENT')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-light text-espresso">주문 관리</h1>
          <p className="text-sm text-taupe mt-1">무통장 입금 주문을 관리합니다</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-botanical text-white rounded-xl hover:bg-botanical/90 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">입금 대기</p>
              <p className="text-2xl font-light text-espresso">{pendingCount}</p>
            </div>
          </div>
          {depositConfirmedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-museum-border">
              <div className="flex items-center gap-2 text-orange-600">
                <Bell className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">
                  입금확인 요청 {depositConfirmedCount}건
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
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">승인 완료</p>
              <p className="text-2xl font-light text-espresso">{paidCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">취소됨</p>
              <p className="text-2xl font-light text-espresso">{cancelledCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-museum-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-museum-gold/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-museum-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-taupe">대기 금액</p>
              <p className="text-2xl font-light text-espresso">
                {totalPendingAmount.toLocaleString()}
                <span className="text-sm text-taupe ml-1">원</span>
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
            <p className="text-sm font-medium text-espresso">입금 계좌 정보</p>
            <p className="text-lg font-mono text-botanical">
              {BANK_INFO.bankName} {BANK_INFO.accountNumber} ({BANK_INFO.accountHolder})
            </p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-2xl p-4 border border-museum-border">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-taupe" />
          <span className="text-sm text-taupe">상태 필터:</span>
          <div className="flex gap-2">
            {[
              { value: 'ALL' as FilterStatus, label: '전체' },
              { value: 'PENDING_PAYMENT' as FilterStatus, label: '입금 대기' },
              { value: 'PAID' as FilterStatus, label: '승인 완료' },
              { value: 'CANCELLED' as FilterStatus, label: '취소됨' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
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
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-2xl border border-museum-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-botanical animate-spin mx-auto mb-4" />
            <p className="text-taupe">주문 목록을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-taupe/50 mx-auto mb-4" />
            <p className="text-taupe">표시할 주문이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-museum-border">
            {orders.map((order) => (
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
                          입금확인 요청됨
                        </span>
                      )}
                      {order.hasTextbook && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          <Package className="w-3 h-3" />
                          교재 포함
                        </span>
                      )}
                      <span className="text-xs text-taupe font-mono">#{order.id.slice(-8)}</span>
                    </div>

                    {/* 사용자 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-espresso">
                        <User className="w-4 h-4 text-taupe" />
                        <span className="font-medium">{order.userName || '이름 없음'}</span>
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
                      <span className="text-taupe">• {order.months}개월</span>
                    </div>

                    {/* 결제 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-taupe" />
                        <span className="font-semibold text-botanical">
                          {order.amount.toLocaleString()}원
                        </span>
                        {order.hasTextbook && order.courseAmount && (
                          <span className="text-xs text-taupe">
                            (강의 {order.courseAmount.toLocaleString()}원 + 교재 {order.textbookAmount?.toLocaleString()}원)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-taupe">
                        <span>입금자:</span>
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
                          <span>배송지 정보</span>
                          {expandedShipping === order.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expandedShipping === order.id && (
                          <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm space-y-1">
                            <p><span className="text-taupe">수취인:</span> <span className="text-espresso font-medium">{order.shippingAddress.recipientName}</span></p>
                            <p><span className="text-taupe">연락처:</span> <span className="text-espresso">{order.shippingAddress.phone}</span></p>
                            <p><span className="text-taupe">주소:</span> <span className="text-espresso">
                              {order.shippingAddress.province}, {order.shippingAddress.district}, {order.shippingAddress.ward}
                            </span></p>
                            <p><span className="text-taupe">상세:</span> <span className="text-espresso">{order.shippingAddress.streetAddress}</span></p>
                            {order.shippingAddress.note && (
                              <p><span className="text-taupe">메모:</span> <span className="text-espresso">{order.shippingAddress.note}</span></p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 날짜 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-taupe">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        신청: {formatDate(order.createdAt)}
                      </div>
                      {order.depositConfirmedAt && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Send className="w-3 h-3" />
                          입금확인요청: {formatDate(order.depositConfirmedAt)}
                        </div>
                      )}
                      {order.paidAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          승인: {formatDate(order.paidAt)}
                        </div>
                      )}
                      {order.cancelledAt && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" />
                          취소: {formatDate(order.cancelledAt)}
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
                        {order.depositConfirmed ? '입금확인 승인' : '승인'}
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
                        취소
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
