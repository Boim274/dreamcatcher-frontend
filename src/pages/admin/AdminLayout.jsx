import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminProfileModal from '../../components/admin/AdminProfileModal';
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
  Sun,
  Moon,
} from 'lucide-react';

const adminNavSections = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
    ],
  },
  {
    label: 'Pesanan',
    items: [
      { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
      { to: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
    ],
  },
  {
    label: 'Produk',
    items: [
      { to: '/admin/produk', label: 'Produk', icon: Shirt },
      { to: '/admin/kategori', label: 'Kategori', icon: Tags },
    ],
  },
  {
    label: 'Sablon',
    items: [
      { to: '/admin/layanan', label: 'Layanan', icon: Package },
      { to: '/admin/warna', label: 'Warna Sablon', icon: Palette },
      { to: '/admin/ukuran', label: 'Ukuran', icon: Ruler },
    ],
  },
  {
    label: 'Konten',
    items: [
      { to: '/admin/portfolio', label: 'Portfolio', icon: Image },
      { to: '/admin/testimoni', label: 'Testimoni', icon: MessageSquare },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
    ],
  },
];

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/pesanan': 'Kelola Pesanan',
  '/admin/pembayaran': 'Kelola Pembayaran',
  '/admin/layanan': 'Kelola Layanan',
  '/admin/portfolio': 'Kelola Portfolio',
  '/admin/produk': 'Kelola Produk',
  '/admin/kategori': 'Kelola Kategori',
  '/admin/warna': 'Kelola Warna Sablon',
  '/admin/ukuran': 'Kelola Ukuran',
  '/admin/testimoni': 'Kelola Testimoni',
  '/admin/pengaturan': 'Pengaturan',
  '/admin/laporan': 'Laporan',
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
  const [showOrderNotifs, setShowOrderNotifs] = useState(false);
  const [showPaymentNotifs, setShowPaymentNotifs] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [cancelRequests, setCancelRequests] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [recentOrderNotifs, setRecentOrderNotifs] = useState([]);
  const [recentPaymentNotifs, setRecentPaymentNotifs] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevOrderCount = useRef(0);
  const prevPaymentCount = useRef(0);

  const dropdownRef = useRef(null);
  const orderNotifRef = useRef(null);
  const paymentNotifRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const fetchNotifications = useCallback(async () => {
    try {
      const [pendingRes, cancelRes, paymentRes] = await Promise.all([
        api.get('/admin/orders?status=pending&per_page=5'),
        api.get('/admin/orders?status=cancel_requested&per_page=5'),
        api.get('/admin/payments?status=pending&per_page=5'),
      ]);
      const pendingOrdersList = pendingRes.data.orders?.data || [];
      const cancelOrdersList = cancelRes.data.orders?.data || [];
      const pendingPaymentsList = paymentRes.data.payments?.data || [];
      const newPending = pendingRes.data.orders?.total || pendingOrdersList.length;
      const newCancel = cancelRes.data.orders?.total || cancelOrdersList.length;
      const newPendingPayments = paymentRes.data.payments?.total || pendingPaymentsList.length;

      const orderCount = newPending + newCancel;
      if (prevOrderCount.current > 0 && orderCount > prevOrderCount.current) {
        toast?.info?.(`Pesanan baru! (${orderCount} menunggu aksi)`);
      }
      if (prevPaymentCount.current > 0 && newPendingPayments > prevPaymentCount.current) {
        toast?.info?.(`Pembayaran baru! (${newPendingPayments} menunggu verifikasi)`);
      }
      prevOrderCount.current = orderCount;
      prevPaymentCount.current = newPendingPayments;

      setPendingOrders(newPending);
      setCancelRequests(newCancel);
      setPendingPayments(newPendingPayments);

      const combinedOrders = [
        ...pendingOrdersList,
        ...cancelOrdersList.map(o => ({ ...o, _type: 'cancel' })),
      ];
      setRecentOrderNotifs(combinedOrders.slice(0, 8));
      setRecentPaymentNotifs(pendingPaymentsList.slice(0, 8));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (orderNotifRef.current && !orderNotifRef.current.contains(e.target)) {
        setShowOrderNotifs(false);
      }
      if (paymentNotifRef.current && !paymentNotifRef.current.contains(e.target)) {
        setShowPaymentNotifs(false);
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

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-cream" data-theme={theme}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${sidebarWidth} bg-ink text-white shadow-xl z-50 transition-all duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`p-5 border-b border-white/10 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
          <img src="/logo.png" alt="Dreamcatcher" className="h-9 flex-shrink-0" />
          {!sidebarCollapsed && (
            <span className="font-heading text-[20px] text-primary tracking-[2px]">
              Dream<span className="text-fire">catcher</span>
            </span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto text-gray-light hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 mt-4 ${sidebarCollapsed ? 'px-2' : 'px-3'} overflow-y-auto`}>
          {adminNavSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-4 mb-2 text-[10px] font-bold tracking-[2px] uppercase text-gray-dark">
                  {section.label}
                </p>
              )}
              {sidebarCollapsed && (
                <div className="mx-auto my-2 w-6 h-px bg-white/10" />
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
                    className={`flex items-center gap-3 rounded-lg mb-1 transition-all duration-200 no-underline ${
                      sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-gray-light hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-[13px] font-medium">{item.label}</span>
                        {badge > 0 && (
                          <span className="ml-auto bg-fire text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-fire rounded-full" />
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
            className="flex items-center justify-center w-full py-2 rounded-lg text-gray-light hover:bg-white/5 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* User + Logout */}
        <div className={`border-t border-white/10 p-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
          <div className="px-3 mb-2">
            <p className="font-medium text-white text-[13px] truncate">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-gray truncate">{user?.email}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-white/5 transition-colors text-gray-light text-[13px] mb-1"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Tema Terang' : 'Tema Gelap'}
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-white/5 transition-colors text-gray-light text-[13px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className={`fixed top-0 left-0 right-0 h-14 bg-ink border-b border-border flex items-center justify-between px-4 lg:px-6 z-40 ${mainMargin} transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(!mobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-light"
          >
            <Menu size={20} />
          </button>
          <h2 className="font-heading text-[18px] text-white tracking-[1px]">{getPageTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Order Notifications */}
          <div className="relative" ref={orderNotifRef}>
            <button
              onClick={() => { setShowOrderNotifs(!showOrderNotifs); setShowPaymentNotifs(false); setShowProfileDropdown(false); }}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-light"
              title="Notifikasi Pesanan"
            >
              <Bell className="w-5 h-5" />
              {(pendingOrders + cancelRequests) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-fire text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {(pendingOrders + cancelRequests) > 99 ? '99+' : (pendingOrders + cancelRequests)}
                </span>
              )}
            </button>

            {showOrderNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h4 className="font-heading text-[14px] font-bold text-white tracking-wide">Pesanan</h4>
                  <Link
                    to="/admin/pesanan"
                    onClick={() => setShowOrderNotifs(false)}
                    className="text-primary text-[11px] hover:underline font-medium"
                  >
                    Lihat Semua
                  </Link>
                </div>
                {recentOrderNotifs.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {recentOrderNotifs.map((item) => {
                      const isCancel = item._type === 'cancel';
                      return (
                        <Link
                          key={`order-${item.id}`}
                          to={`/admin/pesanan/${item.id}`}
                          onClick={() => setShowOrderNotifs(false)}
                          className="flex items-start gap-3 p-3 hover:bg-ink/50 transition-colors no-underline border-b border-border/30 last:border-0"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isCancel ? 'bg-warning' : 'bg-primary'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[13px] font-medium">
                              #{item.order_code}
                            </p>
                            <p className="text-gray text-[11px] truncate">
                              {isCancel
                                ? `${item.customer_name} — meminta pembatalan`
                                : `${item.customer_name} — pesanan baru`
                              }
                            </p>
                            <p className="text-gray-medium text-[10px] mt-0.5">
                              {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={24} className="text-gray-medium mx-auto mb-2" />
                    <p className="text-gray text-[12px]">Tidak ada notifikasi pesanan</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Notifications */}
          <div className="relative" ref={paymentNotifRef}>
            <button
              onClick={() => { setShowPaymentNotifs(!showPaymentNotifs); setShowOrderNotifs(false); setShowProfileDropdown(false); }}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-light"
              title="Notifikasi Pembayaran"
            >
              <CreditCard className="w-5 h-5" />
              {pendingPayments > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingPayments > 99 ? '99+' : pendingPayments}
                </span>
              )}
            </button>

            {showPaymentNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h4 className="font-heading text-[14px] font-bold text-white tracking-wide">Pembayaran</h4>
                  <Link
                    to="/admin/pembayaran"
                    onClick={() => setShowPaymentNotifs(false)}
                    className="text-primary text-[11px] hover:underline font-medium"
                  >
                    Lihat Semua
                  </Link>
                </div>
                {recentPaymentNotifs.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {recentPaymentNotifs.map((item) => (
                      <Link
                        key={`payment-${item.id}`}
                        to="/admin/pembayaran"
                        onClick={() => setShowPaymentNotifs(false)}
                        className="flex items-start gap-3 p-3 hover:bg-ink/50 transition-colors no-underline border-b border-border/30 last:border-0"
                      >
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[13px] font-medium">
                            #{item.order?.order_code || item.order_id}
                          </p>
                          <p className="text-gray text-[11px] truncate">
                            {item.order?.customer_name || 'Customer'} — upload bukti bayar
                          </p>
                          <p className="text-gray-medium text-[10px] mt-0.5">
                            {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CreditCard size={24} className="text-gray-medium mx-auto mb-2" />
                    <p className="text-gray text-[12px]">Tidak ada notifikasi pembayaran</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowOrderNotifs(false); setShowPaymentNotifs(false); }}
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
      <main className={`${mainMargin} pt-14 min-h-screen transition-all duration-300 bg-card`}>
        <div className="p-6 lg:p-8">
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
  );
}
