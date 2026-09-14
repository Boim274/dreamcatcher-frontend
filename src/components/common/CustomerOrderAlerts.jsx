import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  CreditCard,
  Truck,
  Package,
  X,
  ArrowRight,
} from 'lucide-react';
import { useCustomerNotifStore } from '../../store/customerNotifStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function CustomerOrderAlerts() {
  const { isAuthenticated, user } = useAuthStore();
  const { activePopups, dismissPopup, fetchNotifications } = useCustomerNotifStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications(user);
  }, [isAuthenticated, user, fetchNotifications]);

  if (!isAuthenticated || !user) return null;

  // Render popup toasts
  return (
    <div className="fixed top-20 right-4 z-[9998] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-2">
      {activePopups.map((popup) => {
        const isCompleted = popup.type === 'completed';
        const isPayment = popup.type === 'payment_verified';
        const isShipped = popup.type === 'shipped';

        return (
          <div
            key={popup.id}
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border shadow-xl backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              isLight
                ? (isCompleted
                    ? 'bg-white/98 border-emerald-300 shadow-slate-900/10 ring-1 ring-emerald-200'
                    : isPayment
                    ? 'bg-white/98 border-primary/40 shadow-slate-900/10 ring-1 ring-primary/20'
                    : 'bg-white/98 border-purple-300 shadow-slate-900/10 ring-1 ring-purple-200')
                : (isCompleted
                    ? 'bg-[#151c14]/95 border-emerald-500/40 shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                    : isPayment
                    ? 'bg-[#1c0f1c]/95 border-primary/40 shadow-primary/20 ring-1 ring-primary/20'
                    : 'bg-[#170e1c]/95 border-purple-500/40 shadow-purple-950/40 ring-1 ring-purple-500/20')
            }`}
          >
            {/* Left Clean Minimalist Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isCompleted
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isPayment
                  ? isLight
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-primary/20 text-primary border-primary/30'
                  : isLight
                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}
            >
              {isCompleted ? (
                <CheckCircle size={18} />
              ) : isPayment ? (
                <CreditCard size={18} />
              ) : isShipped ? (
                <Truck size={18} />
              ) : (
                <Package size={18} />
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`font-heading text-xs sm:text-sm font-bold tracking-wide ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {popup.title}
                </span>
              </div>
              <p className={`text-xs leading-relaxed mb-3 ${
                isLight ? 'text-slate-600' : 'text-zinc-300'
              }`}>
                {popup.message}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dismissPopup(popup.id);
                    navigate(popup.link);
                  }}
                  className={`text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 text-white shadow-primary/25'
                  }`}
                >
                  <span>{popup.ctaLabel}</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => dismissPopup(popup.id)}
                  className={`text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => dismissPopup(popup.id)}
              className={`transition-colors shrink-0 p-1 rounded-lg cursor-pointer ${
                isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Tutup Notifikasi"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
