import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  User,
  Package,
  History,
  Sparkles,
  Tag,
  Ruler,
  Info,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import { useMobileNavStore } from '../../store/mobileNavStore';
import { getWhatsAppUrl } from '../../constants/whatsapp';
import UserAvatar from './UserAvatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { scrollToTop } from '../../utils/scrollToTop';

export default function MobileMenuDrawer() {
  const location = useLocation();
  const { isDrawerOpen, closeDrawer } = useMobileNavStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openLogin, openRegister } = useAuthModalStore();
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const toast = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isEn = language === 'en';
  const isLight = theme === 'light';

  // Automatically close drawer when route changes
  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen || typeof document === 'undefined') return null;

  const handleLinkClick = () => {
    scrollToTop();
    closeDrawer();
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    closeDrawer();
    toast.success(t('alerts.logoutSuccess', 'Berhasil keluar akun'));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* 2. Slide-In Drawer Panel */}
      <aside
        aria-label={isEn ? "Account and More Menu" : "Menu Akun dan Lainnya"}
        className={`fixed top-0 right-0 bottom-0 w-[86%] max-w-sm z-[10000] flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 backdrop-blur-2xl border-l ${
          isLight
            ? 'bg-white/98 border-slate-200 text-slate-800'
            : 'bg-[#150c1b]/98 border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className={`p-4 px-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/90' : 'border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold tracking-wide uppercase leading-none">
                {isEn ? "Menu & Account" : "Menu & Akun"}
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                {isEn ? "App navigation & settings" : "Navigasi & pengaturan"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-zinc-300 hover:text-white'
            }`}
            aria-label={isEn ? "Close Menu" : "Tutup Menu"}
          >
            <X size={19} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar">
          {/* USER CARD / LOGIN PROMPT */}
          {isAuthenticated && user ? (
            <div className={`p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 shadow-sm'
                : 'bg-white/[0.03] border-white/10'
            }`}>
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="md" rounded="rounded-full" border />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {user.name}
                    </p>
                    {user.role === 'admin' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary to-[#ff60a8] text-white">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {user.email || user.phone}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}>
              <p className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                {isEn ? "Welcome to Dreamcatcher" : "Selamat Datang di Dreamcatcher"}
              </p>
              <p className={`text-[11px] mb-3.5 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                {isEn
                  ? "Sign in to save custom designs and track order status"
                  : "Masuk untuk simpan desain custom dan pantau pesanan Anda"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { closeDrawer(); openLogin(); }}
                  className="btn-gradient-primary py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isEn ? "Login" : "Masuk"}
                </button>
                <button
                  type="button"
                  onClick={() => { closeDrawer(); openRegister(); }}
                  className={`py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 hover:bg-slate-200 text-slate-800'
                      : 'border-white/15 hover:bg-white/10 text-white'
                  }`}
                >
                  {isEn ? "Register" : "Daftar"}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: AKTIVITAS AKUN (Jika Login) */}
          {isAuthenticated && (
            <div>
              <p className={`text-[10.5px] uppercase font-bold tracking-wider mb-2 px-1 ${
                isLight ? 'text-slate-400' : 'text-zinc-400'
              }`}>
                {isEn ? "Account & Orders" : "Akun & Pesanan"}
              </p>
              <div className={`rounded-2xl border divide-y overflow-hidden ${
                isLight ? 'bg-white border-slate-200 divide-slate-100' : 'bg-white/[0.02] border-white/10 divide-white/5'
              }`}>
                <Link
                  to="/pesanan-saya"
                  onClick={handleLinkClick}
                  className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                    location.pathname === '/pesanan-saya'
                      ? 'bg-primary/10 text-primary font-bold'
                      : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Package size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{isEn ? "My Orders" : "Pesanan Saya"}</p>
                      <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {isEn ? "Track ongoing orders" : "Pantau progres pesanan aktif"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="opacity-50" />
                </Link>

                <Link
                  to="/histori-pesanan"
                  onClick={handleLinkClick}
                  className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                    location.pathname === '/histori-pesanan'
                      ? 'bg-primary/10 text-primary font-bold'
                      : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                      <History size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{isEn ? "Order History" : "Histori Pesanan"}</p>
                      <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {isEn ? "Past transactions & reviews" : "Riwayat transaksi & testimoni"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="opacity-50" />
                </Link>

                <Link
                  to="/profile"
                  onClick={handleLinkClick}
                  className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                    location.pathname === '/profile' || location.pathname === '/profil'
                      ? 'bg-primary/10 text-primary font-bold'
                      : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <User size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{isEn ? "My Profile" : "Profil Saya"}</p>
                      <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {isEn ? "Address & account details" : "Pengaturan data & alamat"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="opacity-50" />
                </Link>
              </div>
            </div>
          )}

          {/* SECTION 2: MENU LAINNYA & EKSPLORASI */}
          <div>
            <p className={`text-[10.5px] uppercase font-bold tracking-wider mb-2 px-1 ${
              isLight ? 'text-slate-400' : 'text-zinc-400'
            }`}>
              {isEn ? "Explore Features" : "Layanan & Fitur"}
            </p>
            <div className={`rounded-2xl border divide-y overflow-hidden ${
              isLight ? 'bg-white border-slate-200 divide-slate-100' : 'bg-white/[0.02] border-white/10 divide-white/5'
            }`}>
              {/* Studio Desain */}
              <Link
                to="/design-studio"
                onClick={handleLinkClick}
                className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                  location.pathname === '/design-studio'
                    ? 'bg-primary/10 text-primary font-bold'
                    : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold leading-tight">{isEn ? "Design Studio" : "Studio Desain"}</p>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-primary/20 text-primary border border-primary/30">
                        AI 3D
                      </span>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {isEn ? "Create & preview 3D mockups" : "Buat & preview mockup kaos custom"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="opacity-50" />
              </Link>

              {/* Harga */}
              <Link
                to="/pricelist"
                onClick={handleLinkClick}
                className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                  location.pathname === '/pricelist'
                    ? 'bg-primary/10 text-primary font-bold'
                    : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Tag size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{isEn ? "Price List" : "Daftar Harga"}</p>
                    <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {isEn ? "Plastisol & DTF screen printing rates" : "Pricelist sablon Plastisol, DTF, & kaos"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="opacity-50" />
              </Link>

              {/* Size Chart */}
              <Link
                to="/size-chart"
                onClick={handleLinkClick}
                className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                  location.pathname === '/size-chart'
                    ? 'bg-primary/10 text-primary font-bold'
                    : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Ruler size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{isEn ? "Size Chart" : "Size Chart"}</p>
                    <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {isEn ? "T-shirt measurement & fitting guide" : "Panduan ukuran kaos lokal & oversize"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="opacity-50" />
              </Link>

              {/* Tentang Kami */}
              <Link
                to="/about"
                onClick={handleLinkClick}
                className={`flex items-center justify-between p-3 px-3.5 transition-colors no-underline ${
                  location.pathname === '/about' || location.pathname === '/tentang'
                    ? 'bg-primary/10 text-primary font-bold'
                    : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <Info size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{isEn ? "About Us" : "Tentang Kami"}</p>
                    <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {isEn ? "Workshop profile & location" : "Profil workshop & garansi konveksi"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="opacity-50" />
              </Link>
            </div>
          </div>

          {/* SECTION 3: PANEL ADMIN (Khusus Admin) */}
          {user?.role === 'admin' && (
            <div>
              <p className={`text-[10.5px] uppercase font-bold tracking-wider mb-2 px-1 ${
                isLight ? 'text-slate-400' : 'text-zinc-400'
              }`}>
                {isEn ? "Administration" : "Akses Administrator"}
              </p>
              <Link
                to="/admin"
                onClick={handleLinkClick}
                className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-gradient-to-r from-primary/15 via-purple-600/15 to-primary/15 border border-primary/30 text-white font-semibold transition-all hover:scale-[1.01] active:scale-95 no-underline shadow-md shadow-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary/40">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-primary leading-tight">
                        {isEn ? "Admin Dashboard" : "Panel Admin"}
                      </p>
                      <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full bg-primary text-white">
                        PANEL
                      </span>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
                      {isEn ? "Manage orders, stock, & payments" : "Kelola pesanan, stok, & bukti bayar"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-primary" />
              </Link>
            </div>
          )}

          {/* SECTION 4: PREFERENSI & KONTROL CEPAT */}
          <div>
            <p className={`text-[10.5px] uppercase font-bold tracking-wider mb-2 px-1 ${
              isLight ? 'text-slate-400' : 'text-zinc-400'
            }`}>
              {isEn ? "Preferences & Help" : "Preferensi & Bantuan"}
            </p>
            <div className="space-y-2">
              {/* Bahasa & Tema row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Language Button */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/[0.03] border-white/10'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Globe size={15} className="text-primary shrink-0" />
                    <span>{language === 'id' ? 'ID' : 'EN'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLanguage('id')}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        language === 'id' ? 'bg-primary text-white' : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        language === 'en' ? 'bg-primary text-white' : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer text-xs font-semibold ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-zinc-200'
                  }`}
                >
                  <span className="truncate">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                  {theme === 'dark' ? (
                    <Sun size={15} className="text-amber-400 shrink-0" />
                  ) : (
                    <Moon size={15} className="text-primary shrink-0" />
                  )}
                </button>
              </div>

              {/* WhatsApp CS Consultation Card */}
              <a
                href={getWhatsAppUrl('general')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeDrawer}
                className="w-full p-3 px-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center justify-between transition-all no-underline"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle size={15} />
                  </div>
                  <div>
                    <p className="font-bold text-xs leading-none text-emerald-400">
                      {isEn ? "Consultation on WhatsApp" : "Konsultasi CS WhatsApp"}
                    </p>
                    <p className="text-[10px] text-emerald-400/80 mt-0.5">
                      {isEn ? "Direct customer service assistance" : "Bantuan langsung admin sablon"}
                    </p>
                  </div>
                </div>
                <ExternalLink size={13} className="text-emerald-400 opacity-60" />
              </a>
            </div>
          </div>

          {/* SECTION 5: LOGOUT (Jika Login) */}
          {isAuthenticated && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className={`w-full py-3 px-4 rounded-2xl border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isLight ? 'bg-rose-50' : 'bg-rose-500/5'
                }`}
              >
                <LogOut size={15} />
                <span>{isEn ? "Log Out" : "Keluar Akun"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className={`p-3 px-5 border-t text-center text-[10.5px] shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] ${
          isLight ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-white/10 text-zinc-400 bg-black/20'
        }`}>
          Dreamcatcher App v2.0 • Sablon & Konveksi
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t('alerts.logoutConfirmTitle', 'Konfirmasi Keluar')}
        message={t('alerts.logoutConfirmMsg', 'Apakah Anda yakin ingin keluar dari akun ini?')}
        confirmText={t('nav.logout', 'Keluar')}
        cancelText={t('common.cancel', 'Batal')}
        variant="danger"
      />
    </div>,
    document.body
  );
}
