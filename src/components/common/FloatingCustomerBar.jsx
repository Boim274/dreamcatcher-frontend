import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, ShoppingCart } from 'lucide-react';
import { WA_URL } from '../../constants/whatsapp';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import CustomerNotificationDropdown from './CustomerNotificationDropdown';

export default function FloatingCustomerBar() {
  const location = useLocation();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) return null;

  const isEn = language === 'en';
  const isLight = theme === 'light';

  return (
    <aside
      aria-label={isEn ? "Customer Quick Actions" : "Aksi Cepat Pelanggan"}
      className={`fixed bottom-6 right-5 sm:right-7 z-50 flex items-center gap-2.5 p-2 rounded-full backdrop-blur-2xl border transition-all duration-300 ${
        isLight
          ? 'bg-white/95 border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-slate-100 hover:border-primary/40'
          : 'bg-[#130c18]/92 border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/10 hover:border-primary/40'
      }`}
    >
      {/* 1. WHATSAPP FLOATING BUTTON */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer no-underline group relative"
        aria-label={isEn ? "Chat Support via WhatsApp" : "Chat WhatsApp CS"}
        title={isEn ? "Chat Support via WhatsApp" : "Chat CS via WhatsApp"}
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      {/* 2. CUSTOMER ORDER NOTIFICATIONS BELL (Only when logged in) */}
      {isAuthenticated && (
        <div className="relative">
          <CustomerNotificationDropdown
            placement="top"
            isFloating
            customButtonClass={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer relative hover:scale-110 active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200 hover:text-white'
            }`}
          />
        </div>
      )}

      {/* 3. CART FLOATING BUTTON */}
      <Link
        to="/keranjang"
        className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 no-underline relative hover:scale-110 active:scale-95 ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200 hover:text-white'
        }`}
        aria-label={isEn ? "Shopping Cart" : "Keranjang Belanja"}
        title={isEn ? "Open Shopping Cart" : "Buka Keranjang Belanja"}
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-primary to-[#ff60a8] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(236,74,150,0.8)] animate-pulse">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </Link>
    </aside>
  );
}
