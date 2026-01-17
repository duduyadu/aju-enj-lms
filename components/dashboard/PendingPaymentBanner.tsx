'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BANK_INFO, confirmDeposit } from '@/services/orderService';
import { notifyDepositRequest, getAdminUids } from '@/services/notificationService';
import { AlertCircle, Copy, CheckCheck, Send, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PendingPaymentBannerProps {
  order: Order;
  userName: string;
  onUpdate: () => void;
}

export default function PendingPaymentBanner({ order, userName, onUpdate }: PendingPaymentBannerProps) {
  const { t, language } = useLanguage();
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(BANK_INFO.accountNumber);
    setCopiedAccount(true);
    toast.success(t('dashboard.accountCopied'));
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleConfirmDeposit = async () => {
    if (order.depositConfirmed) {
      toast(t('dashboard.alreadyRequested'));
      return;
    }

    setIsConfirming(true);
    try {
      await confirmDeposit(order.id);

      // 관리자에게 알림 전송
      const adminUids = await getAdminUids();
      for (const adminUid of adminUids) {
        await notifyDepositRequest(
          adminUid,
          userName,
          order.courseName,
          order.id,
          order.amount
        );
      }

      toast.success(t('dashboard.depositRequestSent'));
      onUpdate();
    } catch (error) {
      console.error('Confirm deposit error:', error);
      toast.error(t('dashboard.requestFailed'));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-6 relative">
      {/* 닫기 버튼 */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 hover:bg-amber-200/50 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-amber-600" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-800 mb-1">
            {t('dashboard.pendingPayment')}
          </h3>

          <p className="text-sm text-amber-700 mb-3">
            "<span className="font-medium">{order.courseName}</span>" {t('dashboard.enrollmentComplete')}
            <br />
            {t('dashboard.pleaseDeposit')} <span className="font-bold">{order.amount.toLocaleString()}{t('dashboard.won')}</span>
          </p>

          {/* 계좌 정보 */}
          <div className="bg-white rounded-lg p-3 mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#8C857E]">{t('dashboard.depositAccount')}</p>
              <p className="font-mono font-semibold text-[#2D241E] text-sm sm:text-base truncate">
                {BANK_INFO.bankName} {BANK_INFO.accountNumber}
              </p>
              <p className="text-xs text-[#8C857E]">
                {t('dashboard.accountHolder')}: {BANK_INFO.accountHolder}
              </p>
            </div>
            <button
              onClick={copyAccountNumber}
              className="p-2 hover:bg-[#F5F3ED] rounded-lg transition-colors flex-shrink-0"
            >
              {copiedAccount ? (
                <CheckCheck className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-[#8C857E]" />
              )}
            </button>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!order.depositConfirmed ? (
              <button
                onClick={handleConfirmDeposit}
                disabled={isConfirming}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('dashboard.depositConfirm')}
                  </>
                )}
              </button>
            ) : (
              <div className="flex-1 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2">
                <CheckCheck className="w-4 h-4" />
                {t('dashboard.confirmRequestComplete')}
              </div>
            )}

            <Link
              href={`/courses/${order.courseId}`}
              className="px-4 py-2.5 bg-white border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors text-center text-sm"
            >
              {t('dashboard.viewDetails')}
            </Link>
          </div>

          {order.depositConfirmed && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              {t('dashboard.adminWillConfirm')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
