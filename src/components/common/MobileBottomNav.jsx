import { useLocation, Link } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import { useMobileNavStore } from '../../store/mobileNavStore';
import { scrollToTop } from '../../utils/scrollToTop';

export default function MobileBottomNav() {
  const location = useLocation();
  const { pathname } = location;

  // Hide on admin panel routes
  if (pathname.startsWith('/admin')) return null;

  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { isAuthenticated, user } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const { isDrawerOpen, toggleDrawer, closeDrawer } = useMobileNavStore();

  const isEn = language === 'en';
  const isLight = theme === 'light';

  // Navigation Items
  const isHomeActive = pathname === '/';
  const isServicesActive = pathname === '/layanan' || pathname.startsWith('/layanan');
  const isProductsActive = pathname.startsWith('/produk');
  const isCartActive = pathname === '/keranjang' || pathname === '/cart';
  const isAccountActive =
    isDrawerOpen ||
    pathname === '/profile' ||
    pathname === '/profil' ||
    pathname === '/pesanan-saya' ||
    pathname === '/histori-pesanan';

  const handleLinkClick = () => {
    scrollToTop();
    closeDrawer();
  };

  const handleCartClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLogin();
      return;
    }
    handleLinkClick();
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    toggleDrawer();
  };

  return (
    <>
      {/* Spacer to prevent page content from being covered on mobile */}
      <div className="h-16 md:hidden pb-[env(safe-area-inset-bottom,0px)] pointer-events-none" aria-hidden="true" />

      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label={isEn ? "Mobile Bottom Navigation" : "Navigasi Bawah Mobile"}
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-2xl border-t transition-all duration-300 pb-[env(safe-area-inset-bottom,0px)] ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] text-slate-800'
            : 'bg-[#120a16]/95 border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] text-white'
        }`}
      >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-stretch px-1">
        {/* 1. BERANDA */}
        <Link
          to="/"
          onClick={handleLinkClick}
          className={`group flex flex-col items-center justify-center gap-1 relative select-none transition-all duration-200 no-underline cursor-pointer ${
            isHomeActive
              ? 'text-primary'
              : isLight
              ? 'text-slate-500 hover:text-slate-800'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all duration-200 ${isHomeActive ? 'bg-primary/15' : 'group-hover:bg-white/5'}`}>
            <Home size={19} className={`transition-transform duration-200 ${isHomeActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(236,74,150,0.6)]' : ''}`} />
          </div>
          <span className={`text-[10px] tracking-tight leading-none ${isHomeActive ? 'font-bold text-primary' : 'font-medium'}`}>
            {isEn ? 'Home' : 'Beranda'}
          </span>
          {isHomeActive && (
            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(236,74,150,1)] animate-pulse" />
          )}
        </Link>

        {/* 2. LAYANAN */}
        <Link
          to="/layanan"
          onClick={handleLinkClick}
          className={`group flex flex-col items-center justify-center gap-1 relative select-none transition-all duration-200 no-underline cursor-pointer ${
            isServicesActive
              ? 'text-primary'
              : isLight
              ? 'text-slate-500 hover:text-slate-800'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all duration-200 ${isServicesActive ? 'bg-primary/15' : 'group-hover:bg-white/5'}`}>
            <LayoutGrid size={19} className={`transition-transform duration-200 ${isServicesActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(236,74,150,0.6)]' : ''}`} />
          </div>
          <span className={`text-[10px] tracking-tight leading-none ${isServicesActive ? 'font-bold text-primary' : 'font-medium'}`}>
            {isEn ? 'Services' : 'Layanan'}
          </span>
          {isServicesActive && (
            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(236,74,150,1)] animate-pulse" />
          )}
        </Link>

        {/* 3. PRODUK */}
        <Link
          to="/produk"
          onClick={handleLinkClick}
          className={`group flex flex-col items-center justify-center gap-1 relative select-none transition-all duration-200 no-underline cursor-pointer ${
            isProductsActive
              ? 'text-primary'
              : isLight
              ? 'text-slate-500 hover:text-slate-800'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all duration-200 ${isProductsActive ? 'bg-primary/15' : 'group-hover:bg-white/5'}`}>
            <ShoppingBag size={19} className={`transition-transform duration-200 ${isProductsActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(236,74,150,0.6)]' : ''}`} />
          </div>
          <span className={`text-[10px] tracking-tight leading-none ${isProductsActive ? 'font-bold text-primary' : 'font-medium'}`}>
            {isEn ? 'Products' : 'Produk'}
          </span>
          {isProductsActive && (
            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(236,74,150,1)] animate-pulse" />
          )}
        </Link>

        {/* 4. KERANJANG */}
        <Link
          to="/keranjang"
          onClick={handleCartClick}
          className={`group flex flex-col items-center justify-center gap-1 relative select-none transition-all duration-200 no-underline cursor-pointer ${
            isCartActive
              ? 'text-primary'
              : isLight
              ? 'text-slate-500 hover:text-slate-800'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all duration-200 relative ${isCartActive ? 'bg-primary/15' : 'group-hover:bg-white/5'}`}>
            <ShoppingCart size={19} className={`transition-transform duration-200 ${isCartActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(236,74,150,0.6)]' : ''}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[17px] h-[17px] bg-gradient-to-r from-primary to-[#ff60a8] text-white text-[9.5px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-primary/40 animate-pulse">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] tracking-tight leading-none ${isCartActive ? 'font-bold text-primary' : 'font-medium'}`}>
            {isEn ? 'Cart' : 'Keranjang'}
          </span>
          {isCartActive && (
            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(236,74,150,1)] animate-pulse" />
          )}
        </Link>

        {/* 5. AKUN / MORE DRAWER TRIGGER */}
        <button
          type="button"
          onClick={handleAccountClick}
          className={`group flex flex-col items-center justify-center gap-1 relative select-none transition-all duration-200 cursor-pointer ${
            isAccountActive
              ? 'text-primary'
              : isLight
              ? 'text-slate-500 hover:text-slate-800'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all duration-200 relative ${isAccountActive ? 'bg-primary/15' : 'group-hover:bg-white/5'}`}>
            <User size={19} className={`transition-transform duration-200 ${isAccountActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(236,74,150,0.6)]' : ''}`} />
            {isAuthenticated && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight leading-none ${isAccountActive ? 'font-bold text-primary' : 'font-medium'}`}>
            {isEn ? 'Account' : 'Akun'}
          </span>
          {isAccountActive && (
            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(236,74,150,1)] animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  </>
  );
}
