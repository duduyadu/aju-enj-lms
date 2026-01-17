'use client';

import { Order, DeliveryStatus, TRACKING_URLS } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Truck, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface DeliveryStatusWidgetProps {
  orders: Order[];
}

export default function DeliveryStatusWidget({ orders }: DeliveryStatusWidgetProps) {
  const { t } = useLanguage();

  const textbookOrders = orders.filter(
    order => order.status === 'PAID' && order.hasTextbook
  );

  if (textbookOrders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 shadow-sm">
      <h3 className="font-semibold text-[#2D241E] text-sm mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-[#4A5D4E]" />
        {t('dashboard.delivery')}
      </h3>

      <div className="space-y-3">
        {textbookOrders.map((order) => (
          <DeliveryItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function DeliveryItem({ order }: { order: Order }) {
  const { t } = useLanguage();

  const getStatusInfo = (status?: DeliveryStatus) => {
    switch (status) {
      case 'PREPARING':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: t('dashboard.preparing'),
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          step: 1,
        };
      case 'SHIPPED':
        return {
          icon: <Truck className="w-4 h-4" />,
          text: t('dashboard.shipped'),
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          step: 2,
        };
      case 'DELIVERED':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: t('dashboard.delivered'),
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          step: 3,
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: t('dashboard.pending'),
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          step: 0,
        };
    }
  };

  const statusInfo = getStatusInfo(order.deliveryStatus);

  const getTrackingUrl = () => {
    if (!order.trackingNumber || !order.trackingCarrier) return null;
    const baseUrl = TRACKING_URLS[order.trackingCarrier];
    if (!baseUrl) return null;
    return `${baseUrl}${order.trackingNumber}`;
  };

  const trackingUrl = getTrackingUrl();

  return (
    <div className={`rounded-lg p-3 ${statusInfo.bgColor}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs text-[#8C857E] truncate">
            {order.courseName}
          </p>
          <p className={`text-sm font-medium ${statusInfo.color} flex items-center gap-1`}>
            {statusInfo.icon}
            {statusInfo.text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              step <= statusInfo.step ? 'bg-[#4A5D4E]' : 'bg-[#E5E1D8]'
            }`}
          />
        ))}
      </div>

      {order.trackingNumber && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8C857E]">
            {order.trackingNumber}
          </span>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A5D4E] hover:underline flex items-center gap-1"
            >
              {t('dashboard.track')}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {order.shippingAddress && (
        <p className="text-xs text-[#8C857E] mt-1 truncate">
          📍 {order.shippingAddress.district}, {order.shippingAddress.province}
        </p>
      )}
    </div>
  );
}
