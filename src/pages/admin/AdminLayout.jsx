import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useToast } from '../../components/ui/Toast';
import { adminService } from '../../services/adminService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminProfileModal from '../../components/admin/AdminProfileModal';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import UserAvatar from '../../components/common/UserAvatar';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  Image,
  BarChart3,
  LogOut,
  Bell,
  ChevronDown,
  User,
  Lock,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Ruler,
  MessageSquare,
  Settings,
  Shirt,
  Tags,
  Users,
  Sun,
  Moon,
  History,
  Ban,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Tag,
  Scissors,
} from 'lucide-react';

const adminNavSections = [
  {
    label: 'Ringkasan & Analitik',
    items: [
      { to: '/admin', label: 'Dashboard Utama', icon: LayoutDashboard },
      { to: '/admin/laporan', label: 'Laporan Penjualan', icon: BarChart3 },
    ],
  },
  {
    label: 'Transaksi & Pesanan',
    items: [
      { to: '/admin/pesanan', label: 'Kelola Pesanan', icon: ShoppingBag },
      { to: '/admin/histori-pesanan', label: 'Histori Pesanan', icon: History },
      { to: '/admin/pembayaran', label: 'Verifikasi Bayar', icon: CreditCard },
      { to: '/admin/histori-pembayaran', label: 'Histori Bayar', icon: History },
    ],
  },
  {
    label: 'Katalog Apparel & Produk',
    items: [
      { to: '/admin/produk', label: 'Produk Apparel', icon: Shirt },
      { to: '/admin/kategori', label: 'Kategori Produk', icon: Tags },
      { to: '/admin/warna', label: 'Warna Apparel', icon: Palette },
      { to: '/admin/ukuran', label: 'Ukuran Apparel', icon: Ruler },
    ],
  },
  {
    label: 'Konten & Toko',
    items: [
      { to: '/admin/portfolio', label: 'Portofolio Produksi', icon: Image },
      { to: '/admin/testimoni', label: 'Testimoni Customer', icon: MessageSquare },
      { to: '/admin/pengguna', label: 'Kelola User & Role', icon: Users },
      { to: '/admin/pengaturan', label: 'Pengaturan Toko', icon: Settings },
    ],
  },
];

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/pesanan': 'Kelola Pesanan',
  '/admin/histori-pesanan': 'Histori Pesanan',
  '/admin/pembayaran': 'Kelola Pembayaran',
  '/admin/histori-pembayaran': 'Histori Pembayaran',
  '/admin/portfolio': 'Kelola Portofolio Produksi',
  '/admin/produk': 'Kelola Produk Apparel',
  '/admin/kategori': 'Kelola Kategori',
  '/admin/warna': 'Kelola Warna Apparel',
  '/admin/ukuran': 'Kelola Ukuran Apparel',
  '/admin/testimoni': 'Kelola Testimoni',
  '/admin/pengaturan': 'Pengaturan',
  '/admin/laporan': 'Laporan',
  '/admin/pengguna': 'Kelola User & Role',
  '/admin/users': 'Kelola User & Role',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuthStore();
  const toast = useToast();

  const { theme, toggleTheme } = useThemeStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'orders' | 'payments'
  const [pendingOrders, setPendingOrders] = useState(0);
  const [cancelRequests, setCancelRequests] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [unifiedNotifs, setUnifiedNotifs] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevTotalCount = useRef(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const fetchNotifications = useCallback(async (signal) => {
    try {
      const [pendingRes, cancelRes, paymentRes] = await Promise.all([
        adminService.getOrders({ status: 'waiting_payment', per_page: 8 }, signal),
        adminService.getOrders({ status: 'cancel_requested', per_page: 8 }, signal),
        adminService.getPayments({ status: 'pending', per_page: 8 }, signal),
      ]);
      const pendingOrdersList = pendingRes.data || [];
      const cancelOrdersList = cancelRes.data || [];
      const pendingPaymentsList = paymentRes.data || [];
      const newPending = pendingRes.pagination?.total ?? pendingOrdersList.length;
      const newCancel = cancelRes.pagination?.total ?? cancelOrdersList.length;
      const newPendingPayments = paymentRes.pagination?.total ?? pendingPaymentsList.length;

      const totalCount = newPending + newCancel + newPendingPayments;
      if (prevTotalCount.current > 0 && totalCount > prevTotalCount.current) {
        toast?.info?.(`Ada ${totalCount - prevTotalCount.current} notifikasi baru!`);
      }
      prevTotalCount.current = totalCount;

      setPendingOrders(newPending);
      setCancelRequests(newCancel);
      setPendingPayments(newPendingPayments);

      const orderItems = pendingOrdersList.map((o) => ({
        id: `order-${o.id}`,
        category: 'orders',
        type: 'order',
        title: `#${o.order_code}`,
        customer: o.customer_name,
        message: `${o.customer_name} membuat pesanan baru`,
        detail: formatRupiah(o.total_price),
        createdAt: o.created_at,
        link: `/admin/pesanan/${o.id}`,
        badge: 'Pesanan Baru',
        badgeColor: 'bg-primary/20 text-primary border-primary/30',
        icon: ShoppingBag,
        iconColor: 'text-primary bg-primary/10',
      }));

      const cancelItems = cancelOrdersList.map((o) => ({
        id: `cancel-${o.id}`,
        category: 'orders',
        type: 'cancel',
        title: `#${o.order_code}`,
        customer: o.customer_name,
        message: `${o.customer_name} meminta pembatalan pesanan`,
        detail: 'Menunggu konfirmasi admin',
        createdAt: o.created_at,
        link: `/admin/pesanan/${o.id}`,
        badge: 'Batal',
        badgeColor: 'bg-danger/20 text-danger border-danger/30',
        icon: Ban,
        iconColor: 'text-danger bg-danger/10',
      }));

      const paymentItems = pendingPaymentsList.map((p) => ({
        id: `payment-${p.id}`,
        category: 'payments',
        type: 'payment',
        title: `#${p.order?.order_code || ('Order #' + p.order_id)}`,
        customer: p.order?.customer_name || 'Customer',
        message: `${p.order?.customer_name || 'Customer'} mengunggah bukti bayar`,
        detail: formatRupiah(p.amount),
        createdAt: p.created_at,
        link: p.order?.id ? `/admin/pesanan/${p.order.id}` : `/admin/pembayaran`,
        badge: 'Bukti Bayar',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CreditCard,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
      }));

      const allCombined = [...orderItems, ...cancelItems, ...paymentItems].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setUnifiedNotifs(allCombined);
    } catch (error) {
      if (error?.name !== 'CanceledError') console.error('Failed to fetch notifications:', error);
    }
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchNotifications(controller.signal);
    const interval = setInterval(() => fetchNotifications(controller.signal), 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    if (location.pathname.match(/\/admin\/pesanan\/\d+/)) return 'Detail Pesanan';
    return pageTitles[location.pathname] || 'Admin';
  };

  const openProfile = (tab = 'profile') => {
    setProfileModalTab(tab);
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-64';
  const mainMargin = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  const totalNotifs = pendingOrders + cancelRequests + pendingPayments;
  const filteredNotifs = notifFilter === 'all'
    ? unifiedNotifs
    : unifiedNotifs.filter((item) => item.category === notifFilter);

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <ErrorBoundary>
      <div className={`min-h-screen admin-theme selection:bg-primary selection:text-white ${theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c0711] text-white'}`} data-theme={theme}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${sidebarWidth} ${theme === 'light' ? 'bg-white text-slate-800 border-r border-slate-200 shadow-xl' : 'bg-[#120a16]/95 text-white border-r border-white/10 shadow-2xl backdrop-blur-2xl'} z-50 transition-all duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo & Workspace Header */}
        <div className={`p-4 ${theme === 'light' ? 'border-b border-slate-200' : 'border-b border-white/10'} ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-[#ff60a8] p-[1.5px] shadow-md shadow-primary/20 shrink-0">
              <div className="w-full h-full rounded-[9px] bg-[#120817] flex items-center justify-center">
                <img src="/logo.png" alt="Dreamcatcher" className="h-5 w-5 object-contain" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-heading text-[17px] font-bold tracking-[1px] block leading-none text-white">
                  DREAM<span className="text-gradient">CATCHER</span>
                </span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono">Studio Admin</span>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden ml-auto text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className={`mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.04] border-white/10 text-zinc-300'
            }`}>
              <span className="font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Aktif
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">v2.4</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 mt-3 ${sidebarCollapsed ? 'px-2' : 'px-3'} overflow-y-auto custom-scrollbar`}>
          {adminNavSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className={`px-3 mb-1.5 text-[10px] font-bold tracking-[1.5px] uppercase ${
                  theme === 'light' ? 'text-slate-400' : 'text-zinc-500'
                }`}>
                  {section.label}
                </p>
              )}
              {sidebarCollapsed && (
                <div className={`mx-auto my-2 w-6 h-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
              )}
              {section.items.map((item) => {
                const currentUrl = location.pathname + (location.search || '');
                const isActive = item.to.includes('?')
                  ? currentUrl === item.to
                  : (location.pathname === item.to && !location.search);
                const badge = item.to === '/admin/pesanan' ? pendingOrders + cancelRequests : item.to === '/admin/pembayaran' ? pendingPayments : 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 rounded-xl mb-1 transition-all duration-200 no-underline cursor-pointer ${
                      sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-lg shadow-primary/30 font-bold'
                        : theme === 'light'
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-[13px]">{item.label}</span>
                        {badge > 0 && (
                          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                            isActive ? 'bg-white text-primary' : 'bg-primary/20 text-primary border border-primary/30'
                          }`}>
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-[#120a16]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar toggle (desktop only) */}
        <div className="hidden lg:block px-3 pb-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center justify-center w-full py-2 rounded-xl transition-colors cursor-pointer ${
              theme === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* User + Logout */}
        <div className={`border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'} p-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
          <div className="px-3 mb-2 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-[13px] truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{user?.name || 'Admin'}</p>
              <p className={`text-[11px] truncate ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>{user?.email}</p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
              Admin
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-2 w-full rounded-xl transition-colors text-[12px] font-medium mb-1 cursor-pointer ${
              theme === 'light' ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            <span>{theme === 'dark' ? 'Tema Terang' : 'Tema Gelap'}</span>
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex items-center gap-2 px-3 py-2 w-full rounded-xl transition-colors text-[12px] font-medium cursor-pointer ${
              theme === 'light' ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className={`fixed top-0 left-0 right-0 h-16 glass-header border-b ${theme === 'light' ? 'bg-white/92 border-slate-200 text-slate-800 shadow-sm' : 'bg-[#120a16]/90 border-white/10 text-white shadow-xl backdrop-blur-2xl'} flex items-center justify-between px-4 lg:px-6 z-40 ${mainMargin} transition-all duration-300`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(!mobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${theme === 'light' ? 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'border-white/10 text-zinc-300 hover:text-white hover:bg-white/5'}`}
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h2 className={`font-heading text-[18px] tracking-[1px] leading-tight truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {getPageTitle()}
            </h2>
            <div className={`hidden sm:flex items-center gap-1.5 text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
              <span>Admin Studio</span>
              {location.pathname !== '/admin' && (
                <>
                  <ChevronRight size={10} className={theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} />
                  <span className="text-primary font-medium truncate">{getPageTitle()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Preview Web Button */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all no-underline ${
              theme === 'light'
                ? 'border-slate-200 bg-slate-100/90 text-slate-700 hover:text-slate-900 hover:border-primary/50'
                : 'border-border/70 bg-card/60 text-gray-light hover:text-white hover:border-primary/40'
            }`}
            title="Buka Website Toko di Tab Baru"
          >
            <ExternalLink size={13} className="text-primary" />
            <span>Lihat Toko</span>
          </a>
          {/* Unified Notification Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowProfileDropdown(false);
              }}
              className={`relative p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-gray-light hover:bg-white/5'}`}
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {totalNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-fire text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                  {totalNotifs > 99 ? '99+' : totalNotifs}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className={`absolute right-0 top-full mt-2.5 w-80 sm:w-96 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                theme === 'light'
                  ? 'bg-white/98 border border-slate-200 text-slate-800 shadow-2xl shadow-slate-400/25'
                  : 'bg-[#160d1c]/98 border border-white/10 text-white shadow-2xl shadow-black/90 ring-1 ring-white/10'
              } backdrop-blur-2xl`}>
                {/* Header */}
                <div className={`p-4 border-b ${theme === 'light' ? 'border-slate-200 bg-slate-50/90' : 'border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-heading text-[16px] font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Notifikasi Masuk</h4>
                      {totalNotifs > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/20 text-primary rounded-full border border-primary/30 animate-pulse">
                          {totalNotifs} Baru
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] ${
                    theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-[#120a16] border-white/10'
                  }`}>
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        notifFilter === 'all'
                          ? 'bg-primary text-white shadow-sm'
                          : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Semua ({totalNotifs})
                    </button>
                    <button
                      onClick={() => setNotifFilter('orders')}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        notifFilter === 'orders'
                          ? 'bg-primary text-white shadow-sm'
                          : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Pesanan ({pendingOrders + cancelRequests})
                    </button>
                    <button
                      onClick={() => setNotifFilter('payments')}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        notifFilter === 'payments'
                          ? 'bg-primary text-white shadow-sm'
                          : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Bayar ({pendingPayments})
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {filteredNotifs.length > 0 ? (
                  <div className={`max-h-80 overflow-y-auto divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'} custom-scrollbar`}>
                    {filteredNotifs.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.id}
                          to={item.link}
                          onClick={() => setShowNotifs(false)}
                          className={`flex items-start gap-3 p-3.5 transition-colors no-underline group ${
                            theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            theme === 'light' ? 'border-slate-200' : 'border-white/10'
                          } ${item.iconColor}`}>
                            <IconComponent size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`font-semibold text-[13px] group-hover:text-primary transition-colors truncate ${
                                theme === 'light' ? 'text-slate-900' : 'text-white'
                              }`}>
                                {item.title}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className={`text-[12px] leading-snug ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                              {item.message}
                            </p>
                            <div className={`flex items-center justify-between mt-1 text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                              <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-zinc-300'}`}>{item.detail}</span>
                              <span>
                                {new Date(item.createdAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={28} className={`mx-auto mb-2 opacity-50 ${theme === 'light' ? 'text-slate-400' : 'text-zinc-600'}`} />
                    <p className={`text-[13px] font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Tidak ada notifikasi baru</p>
                    <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {notifFilter === 'orders'
                        ? 'Semua pesanan sudah diproses'
                        : notifFilter === 'payments'
                        ? 'Tidak ada bukti bayar yang menunggu verifikasi'
                        : 'Semua pesanan dan pembayaran sudah up to date'}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className={`p-2.5 border-t flex items-center justify-between text-[11px] ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#120a16] border-white/10 text-zinc-400'
                }`}>
                  <Link
                    to="/admin/pesanan"
                    onClick={() => setShowNotifs(false)}
                    className={`flex items-center gap-1 transition-colors font-medium px-2 py-1 rounded-lg ${
                      theme === 'light' ? 'text-slate-600 hover:text-primary' : 'text-zinc-400 hover:text-primary'
                    }`}
                  >
                    Semua Pesanan <ArrowRight size={12} />
                  </Link>
                  <Link
                    to="/admin/pembayaran"
                    onClick={() => setShowNotifs(false)}
                    className={`flex items-center gap-1 transition-colors font-medium px-2 py-1 rounded-lg ${
                      theme === 'light' ? 'text-slate-600 hover:text-primary' : 'text-zinc-400 hover:text-primary'
                    }`}
                  >
                    Semua Pembayaran <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifs(false); }}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-800'
                  : 'border-white/10 hover:bg-white/5 text-white'
              }`}
            >
              <UserAvatar user={user} size="sm" rounded="rounded-full" border />
              <span className={`text-[13px] font-semibold hidden md:block max-w-[120px] truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{user?.name || 'Admin'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'} ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <div className={`absolute right-0 top-full mt-2.5 w-60 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                theme === 'light'
                  ? 'bg-white/98 border border-slate-200 text-slate-800 shadow-2xl shadow-slate-400/25'
                  : 'bg-[#160d1c]/98 border border-white/10 text-white shadow-2xl shadow-black/90 ring-1 ring-white/10'
              } backdrop-blur-2xl`}>
                {/* Header User Info */}
                <div className={`p-4 border-b ${theme === 'light' ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="md" rounded="rounded-xl" border showGlow />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-[13px] truncate leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{user?.name || 'Administrator'}</p>
                      <p className={`text-[11px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>{user?.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                        Super Admin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Navigation Actions */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => openProfile('profile')}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl transition-all text-[13px] font-medium group cursor-pointer ${
                      theme === 'light'
                        ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      theme === 'light'
                        ? 'bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary'
                        : 'bg-white/5 text-zinc-400 group-hover:bg-primary/20 group-hover:text-primary'
                    }`}>
                      <User size={15} />
                    </div>
                    <span>Profil Administrator</span>
                  </button>

                  <button
                    onClick={() => openProfile('password')}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl transition-all text-[13px] font-medium group cursor-pointer ${
                      theme === 'light'
                        ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      theme === 'light'
                        ? 'bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary'
                        : 'bg-white/5 text-zinc-400 group-hover:bg-primary/20 group-hover:text-primary'
                    }`}>
                      <Lock size={15} />
                    </div>
                    <span>Keamanan Sandi</span>
                  </button>

                  <div className={`my-1 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`} />

                  <button
                    onClick={() => { setShowProfileDropdown(false); setShowLogoutConfirm(true); }}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl transition-all text-[13px] font-medium group cursor-pointer ${
                      theme === 'light'
                        ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                        : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                      <LogOut size={15} />
                    </div>
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${mainMargin} pt-16 min-h-screen transition-all duration-300 ${theme === 'light' ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0f0a13] text-white'}`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Confirm Dialog for Logout */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Apakah Anda yakin ingin keluar dari panel admin?"
        confirmLabel="Ya, Logout"
        variant="danger"
      />

      {/* Profile Modal */}
      <AdminProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialTab={profileModalTab}
      />
    </div>
    </ErrorBoundary>
  );
}
