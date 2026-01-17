'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOrdersByUser, confirmDeposit, BANK_INFO } from '@/services/orderService';
import { Order } from '@/types';
import StudentLayout from '@/components/StudentLayout';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Package,
  Truck,
  PackageCheck,
  ExternalLink,
  BookOpen,
  CreditCard,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function MyOrdersPage() {
  const { userData, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.uid) {
      fetchOrders();
    }
  }, [userData?.uid]);

  const fetchOrders = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    try {
      const data = await getOrdersByUser(userData.uid);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccount = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.accountNumber);
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleConfirmDeposit = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      await confirmDeposit(orderId);
      // Refresh orders to get updated status
      await fetchOrders();
    } catch (error) {
      console.error('Error confirming deposit:', error);
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (order: Order) => {
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            {t('orders.pendingPayment')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            {t('orders.paid')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <XCircle className="w-3 h-3" />
            {t('orders.cancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  const getDeliveryStatusBadge = (status?: string) => {
    switch (status) {
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Package className="w-3 h-3" />
            {t('orders.preparing')}
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Truck className="w-3 h-3" />
            {t('orders.shipped')}
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <PackageCheck className="w-3 h-3" />
            {t('orders.delivered')}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-gradient-to-b from-[#F5F3ED] to-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#4A5D4E] border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#F5F3ED] to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D241E] mb-2">
              {t('orders.title')}
            </h1>
            <p className="text-[#8C857E]">
              {t('orders.subtitle')}
            </p>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E1D8] p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-[#8C857E] opacity-50" />
              <p className="text-[#8C857E] mb-4">{t('orders.noOrders')}</p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A5D4E] text-white rounded-xl hover:bg-[#3a4a3e] transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                {t('orders.goEnroll')}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-[#E5E1D8] overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-[#E5E1D8] bg-[#FAFAF8]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-[#8C857E]">{t('orders.orderDate')}</p>
                          <p className="font-medium text-[#2D241E]">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="h-8 w-px bg-[#E5E1D8]" />
                        <div>
                          <p className="text-xs text-[#8C857E]">{t('orders.orderId')}</p>
                          <p className="font-mono text-sm text-[#2D241E]">{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      {getStatusBadge(order)}
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    {/* Course Info */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-[#4A5D4E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-[#4A5D4E]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-[#2D241E] mb-1">
                          {order.courseName}
                        </h3>
                        <p className="text-[#8C857E]">
                          {t('orders.period')}: {order.months} {t('orders.months')}
                        </p>
                      </div>
                    </div>

                    {/* Amount Details */}
                    <div className="bg-[#F5F3ED] rounded-xl p-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#8C857E]">{t('orders.courseAmount')}</span>
                          <span className="text-[#2D241E]">{formatAmount(order.courseAmount)} {t('orders.won')}</span>
                        </div>
                        {order.hasTextbook && order.textbookAmount && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#8C857E]">{t('orders.textbookAmount')}</span>
                            <span className="text-[#2D241E]">{formatAmount(order.textbookAmount)} {t('orders.won')}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-[#E5E1D8]">
                          <div className="flex justify-between font-semibold">
                            <span className="text-[#2D241E]">{t('orders.totalAmount')}</span>
                            <span className="text-[#4A5D4E]">{formatAmount(order.amount)} {t('orders.won')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Payment - Bank Info */}
                    {order.status === 'PENDING_PAYMENT' && (
                      <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-5 h-5 text-amber-600" />
                          <h4 className="font-semibold text-amber-800">{t('orders.depositInfo')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-amber-700">{t('orders.bankName')}</span>
                            <span className="font-medium text-amber-900">{BANK_INFO.bankName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-amber-700">{t('orders.accountNumber')}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-amber-900">{BANK_INFO.accountNumber}</span>
                              <button
                                onClick={() => handleCopyAccount(order.id)}
                                className="p-1 hover:bg-amber-100 rounded transition-colors"
                                title={t('orders.copyAccount')}
                              >
                                {copiedId === order.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-amber-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-700">{t('orders.accountHolder')}</span>
                            <span className="font-medium text-amber-900">{BANK_INFO.accountHolder}</span>
                          </div>
                        </div>

                        {/* Confirm Deposit Button */}
                        <div className="mt-4 pt-4 border-t border-amber-200">
                          {order.depositConfirmed ? (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">{t('orders.waitingConfirm')}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleConfirmDeposit(order.id)}
                              disabled={confirmingId === order.id}
                              className="w-full py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {confirmingId === order.id ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-5 h-5" />
                                  {t('orders.confirmDeposit')}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery Info (for textbook orders) */}
                    {order.hasTextbook && order.status === 'PAID' && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-800">{t('orders.deliveryInfo')}</h4>
                        </div>

                        <div className="space-y-3">
                          {/* Delivery Status */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">{t('orders.deliveryStatus')}</span>
                            {order.deliveryStatus ? (
                              getDeliveryStatusBadge(order.deliveryStatus)
                            ) : (
                              getDeliveryStatusBadge('PREPARING')
                            )}
                          </div>

                          {/* Tracking Number */}
                          {order.trackingNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">{t('orders.trackingNumber')}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-blue-900">
                                  {order.trackingNumber}
                                </span>
                                {order.carrier && (
                                  <span className="text-xs text-blue-600">({order.carrier})</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Shipping Address */}
                          {order.shippingAddress && (
                            <div className="pt-3 border-t border-blue-200">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-blue-900">
                                    {order.shippingAddress.recipientName}
                                  </p>
                                  <p className="text-blue-700">{order.shippingAddress.phone}</p>
                                  <p className="text-blue-700">
                                    {order.shippingAddress.streetAddress}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
                                  </p>
                                  {order.shippingAddress.note && (
                                    <p className="text-blue-600 italic mt-1">{order.shippingAddress.note}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
