import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore, translations } from '../../store/languageStore';
import Icon from '../ui/Icon';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import CustomerProfileModal from './CustomerProfileModal';
import CustomerOrderAlerts from './CustomerOrderAlerts';
import { NAV_LINKS } from '../../constants/nav';
import { scrollToTop } from '../../utils/scrollToTop';
import UserAvatar from './UserAvatar';
import { Sun, Moon, Globe } from 'lucide-react';

const navLinks = NAV_LINKS;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openLogin, openRegister } = useAuthModalStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage, toggleLanguage, t } = useLanguageStore();
  const toast = useToast();
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      prevLocationRef.current = location.pathname;
      setIsOpen(false);
      setShowDropdown(false);
      setShowLangDropdown(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    setShowLogoutConfirm(false);
    toast.success(t('alerts.logoutSuccess'));
  };

  const handleNavClick = () => {
    scrollToTop();
  };

  const getTranslatedNav = (to, defaultLabel) => {
    switch (to) {
      case '/': return t('nav.home');
      case '/layanan': return t('nav.services');
      case '/produk': return t('nav.products');
      case '/design-studio': return t('nav.designStudio');
      case '/pricelist': return t('nav.pricelist');
      case '/size-chart': return t('nav.sizeChart');
      case '/about': return t('nav.about');
      default: return defaultLabel;
    }
  };

  const isLight = theme === 'light';

  return (
    <>
      <nav className={`sticky top-0 z-50 px-[5%] backdrop-blur-2xl border-b transition-all duration-300 ${
        isLight
          ? 'bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.06)] text-slate-800'
          : 'bg-[#130d17]/85 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] text-white'
      }`}>
        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
          {/* LOGO */}
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 no-underline group">
            <div className="relative">
              <img src="/logo.png" alt="Dreamcatcher" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className={`font-heading text-[26px] tracking-[2px] leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Dream<span className="text-primary">catcher</span>
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6">
            <ul className="flex items-center gap-5 lg:gap-6 list-none m-0 p-0">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={handleNavClick}
                      className={`relative py-1 text-[13px] font-medium tracking-[1px] uppercase no-underline transition-all duration-200 ${
                        isActive
                          ? 'text-primary font-bold'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      {getTranslatedNav(link.to, link.label)}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-[#ff60a8] rounded-full shadow-[0_0_8px_rgba(236,74,150,0.8)]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Quick Controls: Theme & Language */}
            <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              {/* Language Switcher */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
                  }`}
                  title={t('lang.selectLang')}
                >
                  <Globe size={13} className="text-primary" />
                  <span>{language === 'id' ? 'ID' : 'EN'}</span>
                </button>

                {showLangDropdown && (
                  <div className={`absolute right-0 mt-2 w-44 rounded-2xl p-1.5 z-50 border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                    isLight ? 'bg-white border-slate-200 shadow-slate-300/40 text-slate-800' : 'bg-[#1b1220]/98 border-white/15 text-white'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('id');
                        setShowLangDropdown(false);
                        toast.info(translations.id.alerts.langSwitched);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        language === 'id'
                          ? 'bg-primary/15 text-primary font-bold'
                          : isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">🇮🇩 Bahasa Indonesia</span>
                      {language === 'id' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setShowLangDropdown(false);
                        toast.info(translations.en.alerts.langSwitched);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-primary/15 text-primary font-bold'
                          : isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">🇬🇧 English</span>
                      {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Switcher */}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  toast.info(theme === 'dark' ? t('alerts.themeSwitchedLight') : t('alerts.themeSwitchedDark'));
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
                }`}
                title={theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} className="text-primary" />
                )}
              </button>
            </div>

            {/* AUTH STATE: USER LOGGED IN OR GUEST */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  <UserAvatar user={user} size="sm" rounded="rounded-full" border />
                  <span className={`text-xs font-semibold max-w-[120px] truncate ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{user?.name || 'User'}</span>
                  <Icon name="chevron-down" size={13} className={`text-zinc-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* USER DROPDOWN POPUP */}
                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-2xl p-2 z-50 border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                    isLight
                      ? 'bg-white/98 border-slate-200 shadow-slate-300/40 text-slate-800'
                      : 'bg-[#1b1220]/98 border-white/15 text-white shadow-black/80'
                  }`}>
                    <div className={`px-3 py-2 border-b mb-1 flex items-center gap-2.5 ${isLight ? 'border-slate-100 bg-slate-50 rounded-xl' : 'border-white/5'}`}>
                      <UserAvatar user={user} size="sm" rounded="rounded-full" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{t('nav.account')}</p>
                        <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name}</p>
                      </div>
                    </div>
                    <Link
                      to="/pesanan-saya"
                      onClick={() => setShowDropdown(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium no-underline ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-primary' : 'text-zinc-200 hover:bg-white/10 hover:text-primary'
                      }`}
                    >
                      <Icon name="package" size={15} /> {t('nav.myOrders')}
                    </Link>
                    <Link
                      to="/histori-pesanan"
                      onClick={() => setShowDropdown(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium no-underline ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-primary' : 'text-zinc-200 hover:bg-white/10 hover:text-primary'
                      }`}
                    >
                      <Icon name="clock" size={15} /> {t('nav.orderHistory')}
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium no-underline ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-primary' : 'text-zinc-200 hover:bg-white/10 hover:text-primary'
                      }`}
                    >
                      <Icon name="user" size={15} /> {t('nav.myProfile')}
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-xs font-semibold text-primary no-underline ${
                          isLight ? 'hover:bg-primary/10' : 'hover:bg-primary/15'
                        }`}
                      >
                        <Icon name="shield" size={15} /> {t('nav.adminPanel')}
                      </Link>
                    )}
                    <div className={`my-1 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`} />
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors w-full text-left text-xs font-semibold cursor-pointer"
                    >
                      <Icon name="log-out" size={15} /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={openLogin}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all duration-200 cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-200 hover:text-white'
                  }`}
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={openRegister}
                  className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase text-white bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 active:scale-95 shadow-md shadow-primary/30 transition-all duration-200 cursor-pointer border-none"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>

          {/* MOBILE CONTROLS & HAMBURGER */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Quick Lang Mobile */}
            <button
              type="button"
              onClick={toggleLanguage}
              className={`p-1.5 px-2 rounded-lg border text-xs font-bold ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
              title={t('lang.selectLang')}
            >
              {language === 'id' ? 'ID' : 'EN'}
            </button>

            {/* Quick Theme Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
              title={theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-primary" />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="inline-flex"
                aria-label="Profil Saya"
              >
                <UserAvatar user={user} size="sm" rounded="rounded-full" border />
              </Link>
            ) : (
              <button
                onClick={openLogin}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/10 border-white/15 text-zinc-200'
                }`}
              >
                {t('nav.login')}
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-xl border cursor-pointer ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
              aria-label="Menu"
            >
              <Icon name={isOpen ? "x" : "menu"} size={20} />
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {isOpen && (
          <div className={`md:hidden py-4 border-t animate-in slide-in-from-top-2 duration-200 ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => { handleNavClick(); setIsOpen(false); }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase no-underline transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary/20 text-primary font-bold'
                      : isLight
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {getTranslatedNav(link.to, link.label)}
                </Link>
              ))}

              {/* Mobile Language & Theme Quick Switchers */}
              <div className={`p-3 rounded-xl my-2 border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/30 border-white/10 text-zinc-300'
              }`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Globe size={14} className="text-primary" />
                  <span>{t('lang.title')}:</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLanguage('id')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      language === 'id' ? 'bg-primary text-white' : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    🇮🇩 ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      language === 'en' ? 'bg-primary text-white' : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              </div>

              {isAuthenticated ? (
                <div className={`mt-2 pt-2 border-t space-y-1 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <div className={`px-3 py-2 rounded-xl mb-2 flex items-center gap-3 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/5 text-white'}`}>
                    <UserAvatar user={user} size="sm" rounded="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{user?.name}</p>
                      <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/pesanan-saya"
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 text-xs font-medium no-underline rounded-lg ${
                      isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {t('nav.myOrders')}
                  </Link>
                  <Link
                    to="/histori-pesanan"
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 text-xs font-medium no-underline rounded-lg ${
                      isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {t('nav.orderHistory')}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 text-xs font-medium no-underline rounded-lg ${
                      isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {t('nav.myProfile')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold text-primary no-underline rounded-lg"
                    >
                      {t('nav.adminPanel')}
                    </Link>
                  )}
                  <button
                    onClick={() => { setShowLogoutConfirm(true); setIsOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-2 mt-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <button
                    onClick={() => { openLogin(); setIsOpen(false); }}
                    className={`py-2.5 rounded-xl text-center text-xs font-bold uppercase ${
                      isLight ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => { openRegister(); setIsOpen(false); }}
                    className="py-2.5 rounded-xl text-center text-xs font-bold uppercase text-white bg-gradient-to-r from-primary to-[#ff60a8]"
                  >
                    {t('nav.register')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <CustomerOrderAlerts />
      <CustomerProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t('alerts.logoutConfirmTitle')}
        message={t('alerts.logoutConfirmMsg')}
        confirmText={t('nav.logout')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </>
  );
}
