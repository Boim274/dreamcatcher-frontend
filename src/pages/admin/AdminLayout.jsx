import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useToast } from '../../components/ui/Toast';
import { adminService } from '../../services/adminService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminProfileModal from '../../components/admin/AdminProfileModal';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
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
} from 'lucide-react';

const adminNavSections = [
  {
    label: 'Ringkasan & Analitik',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
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
    label: 'Katalog & Sablon',
    items: [
      { to: '/admin/produk', label: 'Produk Pakaian', icon: Shirt },
      { to: '/admin/kategori', label: 'Kategori Produk', icon: Tags },
      { to: '/admin/layanan', label: 'Layanan Sablon', icon: Package },
      { to: '/admin/warna', label: 'Warna Sablon', icon: Palette },
      { to: '/admin/ukuran', label: 'Ukuran Kaos', icon: Ruler },
    ],
  },
  {
    label: 'Konten & Toko',
    items: [
      { to: '/admin/portfolio', label: 'Portfolio Galeri', icon: Image },
      { to: '/admin/testimoni', label: 'Testimoni Customer', icon: MessageSquare },
      { to: '/admin/pengguna', label: 'User & Kuota AI', icon: Users },
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
  '/admin/layanan': 'Kelola Layanan',
  '/admin/portfolio': 'Kelola Portfolio',
  '/admin/produk': 'Kelola Produk',
  '/admin/kategori': 'Kelola Kategori',
  '/admin/warna': 'Kelola Warna Sablon',
  '/admin/ukuran': 'Kelola Ukuran',
  '/admin/testimoni': 'Kelola Testimoni',
  '/admin/pengaturan': 'Pengaturan',
  '/admin/laporan': 'Laporan',
  '/admin/pengguna': 'User & Kuota AI',
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
      <div className="min-h-screen admin-theme bg-cream" data-theme={theme}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${sidebarWidth} bg-ink text-white shadow-2xl z-50 transition-all duration-300 flex flex-col border-r border-border ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo & Workspace Header */}
        <div className={`p-4 border-b border-border ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Dreamcatcher" className="h-8 flex-shrink-0" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-heading text-[18px] text-primary tracking-[2px] block leading-none">
                  Dream<span className="text-fire">catcher</span>
                </span>
                <span className="text-[10px] text-gray uppercase tracking-widest font-mono">Studio Admin</span>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden ml-auto text-gray-light hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="mt-3 flex items-center justify-between px-2.5 py-1 rounded-lg bg-card/60 border border-border/80 text-[11px]">
              <span className="text-gray font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Aktif
              </span>
              <span className="text-gray-dark text-[10px] font-mono">v2.4</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 mt-3 ${sidebarCollapsed ? 'px-2' : 'px-3'} overflow-y-auto`}>
          {adminNavSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold tracking-[1.5px] uppercase text-gray/70">
                  {section.label}
                </p>
              )}
              {sidebarCollapsed && (
                <div className="mx-auto my-2 w-6 h-px bg-border" />
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                const badge = item.to === '/admin/pesanan' ? pendingOrders + cancelRequests : item.to === '/admin/pembayaran' ? pendingPayments : 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 rounded-xl mb-1 transition-all duration-200 no-underline ${
                      sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/25 font-semibold'
                        : 'text-gray-light hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray'}`} />
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
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-ink" />
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
            className="flex items-center justify-center w-full py-2 rounded-xl text-gray hover:bg-white/5 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* User + Logout */}
        <div className={`border-t border-border p-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
          <div className="px-3 mb-2">
            <p className="font-medium text-white text-[13px] truncate">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-gray truncate">{user?.email}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-xl hover:bg-white/5 transition-colors text-gray-light text-[13px] mb-1"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            <span>{theme === 'dark' ? 'Tema Terang' : 'Tema Gelap'}</span>
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-xl hover:bg-white/5 transition-colors text-gray-light text-[13px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className={`fixed top-0 left-0 right-0 h-16 glass-header border-b border-border flex items-center justify-between px-4 lg:px-6 z-40 ${mainMargin} transition-all duration-300`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(!mobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className="p-2 rounded-xl border border-border/70 hover:bg-white/5 transition-colors text-gray-light hover:text-white"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="font-heading text-[18px] text-white tracking-[1px] leading-tight truncate">
              {getPageTitle()}
            </h2>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray">
              <span>Admin</span>
              {location.pathname !== '/admin' && (
                <>
                  <ChevronRight size={10} className="text-gray/60" />
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
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card/60 text-gray-light hover:text-white hover:border-primary/40 text-[12px] font-medium transition-all no-underline"
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
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-light"
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
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50">
                {/* Header */}
                <div className="p-4 border-b border-border bg-ink/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-[15px] font-bold text-white tracking-wide">Notifikasi</h4>
                      {totalNotifs > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-fire/20 text-fire rounded-full border border-fire/30">
                          {totalNotifs} Baru
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-ink p-1 rounded-lg border border-border/50 text-[11px]">
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
                        notifFilter === 'all'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-light hover:text-white'
                      }`}
                    >
                      Semua ({totalNotifs})
                    </button>
                    <button
                      onClick={() => setNotifFilter('orders')}
                      className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
                        notifFilter === 'orders'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-light hover:text-white'
                      }`}
                    >
                      Pesanan ({pendingOrders + cancelRequests})
                    </button>
                    <button
                      onClick={() => setNotifFilter('payments')}
                      className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
                        notifFilter === 'payments'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-light hover:text-white'
                      }`}
                    >
                      Bayar ({pendingPayments})
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {filteredNotifs.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                    {filteredNotifs.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.id}
                          to={item.link}
                          onClick={() => setShowNotifs(false)}
                          className="flex items-start gap-3 p-3.5 hover:bg-ink/60 transition-colors no-underline group"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.iconColor}`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-semibold text-white text-[13px] group-hover:text-primary transition-colors truncate">
                                {item.title}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-gray-light text-[12px] leading-snug">
                              {item.message}
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-gray-medium">
                              <span className="font-medium text-white/80">{item.detail}</span>
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
                    <Bell size={28} className="text-gray-medium mx-auto mb-2 opacity-50" />
                    <p className="text-white text-[13px] font-medium">Tidak ada notifikasi baru</p>
                    <p className="text-gray text-[11px] mt-0.5">
                      {notifFilter === 'orders'
                        ? 'Semua pesanan sudah diproses'
                        : notifFilter === 'payments'
                        ? 'Tidak ada bukti bayar yang menunggu verifikasi'
                        : 'Semua pesanan dan pembayaran sudah up to date'}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="p-2.5 bg-ink/70 border-t border-border flex items-center justify-between text-[11px]">
                  <Link
                    to="/admin/pesanan"
                    onClick={() => setShowNotifs(false)}
                    className="flex items-center gap-1 text-gray-light hover:text-primary transition-colors font-medium px-2 py-1 rounded"
                  >
                    Semua Pesanan <ArrowRight size={12} />
                  </Link>
                  <Link
                    to="/admin/pembayaran"
                    onClick={() => setShowNotifs(false)}
                    className="flex items-center gap-1 text-gray-light hover:text-primary transition-colors font-medium px-2 py-1 rounded"
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
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-[12px]">
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-white hidden md:block">{user?.name || 'Admin'}</span>
              <ChevronDown className="w-4 h-4 text-gray-light" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border shadow-2xl rounded-xl overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="text-white font-medium text-[13px]">{user?.name}</p>
                  <p className="text-gray text-[11px]">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => openProfile('profile')}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-light hover:bg-ink/50 hover:text-white transition-colors text-[13px]"
                  >
                    <User className="w-4 h-4" />
                    Profil Saya
                  </button>
                  <button
                    onClick={() => openProfile('password')}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-light hover:bg-ink/50 hover:text-white transition-colors text-[13px]"
                  >
                    <Lock className="w-4 h-4" />
                    Ganti Password
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { setShowProfileDropdown(false); setShowLogoutConfirm(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-danger hover:bg-ink/50 transition-colors text-[13px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${mainMargin} pt-16 min-h-screen transition-all duration-300 bg-card`}>
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
