import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  CreditCard,
  Package,
  Truck,
  AlertCircle,
  Check,
  ArrowUpRight,
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
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'completed' | 'payment'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } =
    useCustomerNotifStore();

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications(user);
    const interval = setInterval(() => {
      fetchNotifications(user);
    }, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchNotifications]);

  const filteredNotifs = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    if (filter === 'completed') return notifications.filter((n) => n.category === 'completed');
    if (filter === 'payment') return notifications.filter((n) => n.category === 'payment');
    return notifications;
  }, [notifications, filter]);

  if (!isAuthenticated || !user) return null;

  const handleItemClick = (notif) => {
    markAsRead(notif.id, user.id);
    setIsOpen(false);
    navigate(notif.link);
  };

  // Sleek, simple, and clean notification icon
  const renderIcon = (iconType) => {
    const baseClass = `w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors`;
    switch (iconType) {
      case 'completed':
        return (
          <div className={`${baseClass} ${isLight ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
            <CheckCircle size={15} />
          </div>
        );
      case 'payment_verified':
        return (
          <div className={`${baseClass} ${isLight ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/15 text-primary border border-primary/25'}`}>
            <CreditCard size={15} />
          </div>
        );
      case 'processing':
        return (
          <div className={`${baseClass} ${isLight ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
            <Package size={15} />
          </div>
        );
      case 'shipped':
        return (
          <div className={`${baseClass} ${isLight ? 'bg-sky-50 text-sky-600 border border-sky-200/60' : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'}`}>
            <Truck size={15} />
          </div>
        );
      case 'dp_remaining':
        return (
          <div className={`${baseClass} ${isLight ? 'bg-rose-50 text-rose-600 border border-rose-200/60' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
            <AlertCircle size={15} />
          </div>
        );
      default:
        return (
          <div className={`${baseClass} ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-white/10 text-white border border-white/10'}`}>
            <Bell size={15} />
          </div>
        );
    }
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

  const popupPlacementClass = placement === 'top'
    ? 'bottom-full mb-3 right-0 sm:right-0 origin-bottom-right'
    : 'top-full mt-2.5 right-0 origin-top-right';

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

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div
          className={`absolute ${popupPlacementClass} w-80 sm:w-96 max-w-[92vw] rounded-2xl border shadow-2xl overflow-hidden z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white/98 border-slate-200 text-slate-900 shadow-slate-900/15'
              : 'bg-[#181120]/98 border-white/15 text-white shadow-black/80'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b ${isLight ? 'bg-slate-50/70 border-slate-100' : 'bg-white/[0.02] border-white/10'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isLight ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary'}`}>
                  <Bell size={13} />
                </div>
                <h4 className={`font-heading text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? "Notifications" : "Notifikasi"}
                </h4>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    isLight ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary/20 text-primary border-primary/30'
                  }`}>
                    {unreadCount} {isEn ? "New" : "Baru"}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead(user.id)}
                  className={`text-[11px] transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                    isLight ? 'text-slate-500 hover:text-primary' : 'text-zinc-400 hover:text-primary'
                  }`}
                >
                  <Check size={12} /> {isEn ? "Mark all read" : "Tandai dibaca"}
                </button>
              )}
            </div>

            {/* Filter Tabs (Simple, minimalist pills) */}
            <div className={`flex items-center gap-1 p-1 rounded-xl text-[11px] ${isLight ? 'bg-slate-100 border border-slate-200/80' : 'bg-white/5 border border-white/10'}`}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  filter === 'all'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'bg-primary text-white shadow-sm')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                {isEn ? "All" : "Semua"}
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  filter === 'unread'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'bg-primary text-white shadow-sm')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                {isEn ? "Unread" : "Belum Baca"}
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  filter === 'completed'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'bg-primary text-white shadow-sm')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                {isEn ? "Done" : "Selesai"}
              </button>
              <button
                type="button"
                onClick={() => setFilter('payment')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  filter === 'payment'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'bg-primary text-white shadow-sm')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                {isEn ? "Payment" : "Bayar"}
              </button>
            </div>
          </div>

          {/* List Items */}
          <div className={`max-h-80 overflow-y-auto divide-y custom-scrollbar ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 transition-all cursor-pointer group flex items-start gap-3 relative ${
                    !item.isRead
                      ? (isLight ? 'bg-primary/[0.04] hover:bg-primary/[0.08]' : 'bg-primary/[0.06] hover:bg-primary/[0.12]')
                      : (isLight ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.03]')
                  }`}
                >
                  {/* Subtle Unread indicator dot */}
                  {!item.isRead && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}

                  {renderIcon(item.iconType)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`font-heading text-xs font-bold transition-colors truncate ${
                        isLight ? 'text-slate-900 group-hover:text-primary' : 'text-white group-hover:text-primary'
                      }`}>
                        {item.title}
                      </span>
                      {item.orderCode && (
                        <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                          #{item.orderCode}
                        </span>
                      )}
                    </div>

                    <p className={`text-[12px] leading-snug mb-1.5 line-clamp-2 ${
                      isLight ? 'text-slate-600' : 'text-zinc-300'
                    }`}>
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className={isLight ? 'text-slate-400 font-mono' : 'text-zinc-500 font-mono'}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : (isEn ? 'Just now' : 'Baru saja')}
                      </span>

                      <span className={`font-semibold flex items-center gap-0.5 group-hover:underline ${
                        isLight ? 'text-primary' : 'text-primary'
                      }`}>
                        {item.ctaLabel}
                        <ArrowUpRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className={`w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center ${
                  isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-zinc-500'
                }`}>
                  <Bell size={18} />
                </div>
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-200'}`}>
                  {isEn ? "No Notifications Yet" : "Belum Ada Notifikasi"}
                </p>
                <p className={`text-[11px] mt-0.5 max-w-[200px] mx-auto ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                  {isEn
                    ? "Status updates for your orders and payments will appear here."
                    : "Pembaruan status pesanan dan pembayaran akan muncul di sini."}
                </p>
              </div>
            )}
          </div>

          {/* Footer Quick Links */}
          <div className={`p-2.5 px-4 border-t flex items-center justify-between text-[11px] ${
            isLight ? 'bg-slate-50/80 border-slate-100 text-slate-600' : 'bg-[#120a16] border-white/10 text-zinc-400'
          }`}>
            <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              {filteredNotifs.length} {isEn ? "items" : "notifikasi"}
            </span>

            <Link
              to="/pesanan-saya"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-1.5 font-medium transition-colors px-2.5 py-1 rounded-lg no-underline ${
                isLight ? 'text-slate-600 hover:text-primary hover:bg-slate-100' : 'text-zinc-300 hover:text-primary hover:bg-white/5'
              }`}
            >
              <Package size={13} /> {isEn ? "My Orders" : "Pesanan Saya"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
