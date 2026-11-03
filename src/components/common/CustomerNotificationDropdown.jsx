import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  X,
} from 'lucide-react';
import { useCustomerNotifStore } from '../../store/customerNotifStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';

export default function CustomerNotificationDropdown({
  placement = 'bottom',
  isFloating = false,
  customButtonClass = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'orders' | 'payments'
  const dropdownRef = useRef(null);
  const mobileModalRef = useRef(null);
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  const { notifications, unreadCount, markAsRead, fetchNotifications } =
    useCustomerNotifStore();

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If clicking inside desktop dropdown container
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      // If clicking inside mobile modal container
      if (mobileModalRef.current && mobileModalRef.current.contains(e.target)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Poll notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications(user);
    const interval = setInterval(() => {
      fetchNotifications(user);
    }, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchNotifications]);

  const ordersCount = useMemo(
    () => notifications.filter((n) => n.category !== 'payment').length,
    [notifications]
  );
  const paymentsCount = useMemo(
    () => notifications.filter((n) => n.category === 'payment').length,
    [notifications]
  );

  const filteredNotifs = useMemo(() => {
    if (filter === 'orders') return notifications.filter((n) => n.category !== 'payment');
    if (filter === 'payments') return notifications.filter((n) => n.category === 'payment');
    return notifications;
  }, [notifications, filter]);

  if (!isAuthenticated || !user) return null;

  const handleItemClick = (notif) => {
    markAsRead(notif.id, user.id);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const renderIcon = (item) => {
    if (item.category === 'payment' || item.iconType === 'payment_verified') {
      return (
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
          isLight
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        }`}>
          <CreditCard size={18} />
        </div>
      );
    }
    return (
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
        isLight
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-primary/10 text-primary border-primary/25'
      }`}>
        <ShoppingBag size={18} />
      </div>
    );
  };

  const buttonStyle = customButtonClass || (isFloating
    ? `w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer relative hover:scale-105 active:scale-95 border ${
        isLight
          ? 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-md shadow-slate-900/5'
          : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200 hover:text-white'
      }`
    : `relative p-2 rounded-xl transition-all duration-200 cursor-pointer border ${
        isLight
          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
      }`);

  const renderDropdownContent = () => (
    <>
      {/* Header */}
      <div className={`p-4 border-b shrink-0 ${isLight ? 'border-slate-200 bg-slate-50/90' : 'border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className={`font-heading text-lg sm:text-[18px] font-bold tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isEn ? "Incoming Notifications" : "Notifikasi Masuk"}
            </h4>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full border border-primary/30 animate-pulse">
                {unreadCount} {isEn ? "New" : "Baru"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title={isEn ? "Close" : "Tutup Notifikasi"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl border text-xs ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#120a16] border-white/10'
        }`}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
              filter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isEn ? "All" : "Semua"} ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('orders')}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
              filter === 'orders'
                ? 'bg-primary text-white shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isEn ? "Orders" : "Pesanan"} ({ordersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('payments')}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
              filter === 'payments'
                ? 'bg-primary text-white shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isEn ? "Payment" : "Bayar"} ({paymentsCount})
          </button>
        </div>
      </div>

      {/* Items List */}
      {filteredNotifs.length > 0 ? (
        <div className={`max-h-[55vh] sm:max-h-80 overflow-y-auto divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'} custom-scrollbar`}>
          {filteredNotifs.map((item) => (
            <Link
              key={item.id}
              to={item.link || '/pesanan-saya'}
              onClick={() => handleItemClick(item)}
              className={`flex items-start gap-3 p-3.5 sm:p-4 transition-colors cursor-pointer group no-underline relative ${
                !item.isRead
                  ? (isLight ? 'bg-primary/[0.04] hover:bg-primary/[0.08]' : 'bg-primary/[0.06] hover:bg-primary/[0.12]')
                  : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.03]')
              }`}
            >
              {/* Icon */}
              {renderIcon(item)}

              {/* Body */}
              <div className="flex-1 min-w-0">
                {/* Row 1: Order Code & Badge Pill */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`font-mono font-bold text-[13.5px] sm:text-[14px] tracking-tight group-hover:text-primary transition-colors truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {item.orderCode ? `#${item.orderCode}` : item.title}
                  </span>
                  <span className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                    item.category === 'payment'
                      ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30')
                      : (isLight ? 'bg-primary/10 text-primary border-primary/30' : 'bg-primary/20 text-primary border-primary/30')
                  }`}>
                    {item.category === 'payment'
                      ? (isEn ? 'PAYMENT PROOF' : 'BUKTI BAYAR')
                      : (item.badge || (isEn ? 'ORDER STATUS' : 'PESANAN BARU'))}
                  </span>
                </div>

                {/* Row 2: Message Description */}
                <p className={`text-[12px] leading-snug line-clamp-2 mt-0.5 ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  {item.message}
                </p>

                {/* Row 3: Amount/Detail & Date */}
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {item.detail || item.ctaLabel || 'Rp 0'}
                  </span>
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : (isEn ? 'Just now' : 'Baru saja')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Bell size={28} className={`mx-auto mb-2 opacity-50 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
          <p className={`text-[13px] font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isEn ? "No new notifications" : "Tidak ada notifikasi baru"}
          </p>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            {filter === 'orders'
              ? (isEn ? 'All orders are processed' : 'Semua pesanan sudah diproses')
              : filter === 'payments'
              ? (isEn ? 'No pending payment verification' : 'Tidak ada pembayaran yang perlu diproses')
              : (isEn ? 'All orders and status are up to date' : 'Semua pesanan dan pembayaran sudah up to date')}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className={`p-3 px-4 border-t shrink-0 flex items-center justify-between text-xs font-semibold ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#120a16] border-white/10 text-zinc-400'
      }`}>
        <Link
          to="/pesanan-saya"
          onClick={() => setIsOpen(false)}
          className={`flex items-center gap-1.5 transition-colors ${
            isLight ? 'text-slate-600 hover:text-primary' : 'text-zinc-400 hover:text-primary'
          }`}
        >
          {isEn ? "All Orders" : "Semua Pesanan"} <ArrowRight size={14} />
        </Link>
        <Link
          to="/histori-pesanan"
          onClick={() => setIsOpen(false)}
          className={`flex items-center gap-1.5 transition-colors ${
            isLight ? 'text-slate-600 hover:text-primary' : 'text-zinc-400 hover:text-primary'
          }`}
        >
          {isEn ? "All Payments" : "Semua Pembayaran"} <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonStyle}
        aria-label={isEn ? "Order Notifications" : "Notifikasi Pesanan"}
        title={isEn ? "Order Status Notifications" : "Notifikasi Status Pesanan"}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-primary to-[#ff60a8] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(236,74,150,0.7)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 1. MOBILE PORTAL: Escapes any parent containing block, guarantees 100% viewport alignment */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div
            ref={mobileModalRef}
            onClick={(e) => e.stopPropagation()}
            className={`fixed left-3 right-3 top-16 mt-1 z-[9999] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${
              isLight
                ? 'bg-white/98 border border-slate-200 text-slate-800 shadow-slate-400/25'
                : 'bg-[#160d1c]/98 border border-white/10 text-white shadow-black/90 ring-1 ring-white/10'
            } backdrop-blur-2xl flex flex-col max-h-[calc(100vh-5.5rem)]`}
          >
            {renderDropdownContent()}
          </div>
        </div>,
        document.body
      )}

      {/* 2. DESKTOP DROPDOWN: Positioned relative to parent button */}
      {isOpen && (
        <div
          className={`hidden sm:flex flex-col absolute ${
            placement === 'top' ? 'bottom-full mb-3 origin-bottom-right' : 'top-full mt-2.5 origin-top-right'
          } right-0 w-96 rounded-3xl overflow-hidden z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white/98 border border-slate-200 text-slate-800 shadow-slate-400/25'
              : 'bg-[#160d1c]/98 border border-white/10 text-white shadow-black/90 ring-1 ring-white/10'
          } backdrop-blur-2xl`}
        >
          {renderDropdownContent()}
        </div>
      )}
    </div>
  );
}
