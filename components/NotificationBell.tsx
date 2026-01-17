'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/services/notificationService';
import { Notification } from '@/types';
import { Bell, CheckCircle, Clock, AlertCircle, X, Check, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { userData } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userData?.uid) {
      fetchUnreadCount();
      // 30초마다 알림 개수 확인
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userData?.uid]);

  useEffect(() => {
    // 드롭다운 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    if (!userData?.uid) return;
    try {
      const count = await getUnreadCount(userData.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    try {
      const data = await getNotifications(userData.uid, 20);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // 읽음 처리
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // 관련 페이지로 이동
    if (notification.data?.courseId) {
      router.push(`/courses/${notification.data.courseId}`);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userData?.uid) return;
    try {
      await markAllAsRead(userData.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'COURSE_STARTED':
        return <BookOpen className="w-5 h-5 text-[#4A5D4E]" />;
      case 'EXPIRING_SOON':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'EXPIRED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'DEPOSIT_REQUEST':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-[#8C857E]" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Vừa xong / 방금 전';
    if (minutes < 60) return `${minutes} phút / ${minutes}분 전`;
    if (hours < 24) return `${hours} giờ / ${hours}시간 전`;
    if (days < 7) return `${days} ngày / ${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (!userData) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 벨 버튼 */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-[#F5F3ED] transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-[#2D241E]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-[#E5E1D8] z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E1D8] bg-[#F5F3ED]">
            <h3 className="font-semibold text-[#2D241E]">
              Thông báo <span className="text-[#8C857E] font-normal">/ 알림</span>
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#4A5D4E] hover:text-[#3a4a3e] flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Đánh dấu đã đọc / 모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#E5E1D8] rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-[#8C857E]" />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[#8C857E]">
                <div className="w-6 h-6 border-2 border-[#4A5D4E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải... / 로딩 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8C857E]">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Không có thông báo</p>
                <p className="text-xs">알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-[#E5E1D8] last:border-b-0 hover:bg-[#F5F3ED] transition-colors ${
                    !notification.isRead ? 'bg-[#4A5D4E]/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold text-[#2D241E]' : 'text-[#2D241E]'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-[#8C857E] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[#8C857E] mt-1">
                        {notification.createdAt && formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-[#4A5D4E] rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#E5E1D8] bg-[#F5F3ED]">
              <p className="text-xs text-[#8C857E] text-center">
                Hiển thị {notifications.length} thông báo gần đây nhất
                <br />
                최근 {notifications.length}개 알림 표시 중
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
