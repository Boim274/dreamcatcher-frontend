import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
} from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { to: '/admin/layanan', label: 'Layanan', icon: Package },
  { to: '/admin/portfolio', label: 'Portfolio', icon: Image },
  { to: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/pesanan': 'Kelola Pesanan',
  '/admin/pembayaran': 'Kelola Pembayaran',
  '/admin/layanan': 'Kelola Layanan',
  '/admin/portfolio': 'Kelola Portfolio',
  '/admin/laporan': 'Laporan',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuthStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/orders?status=pending&per_page=5');
      const orders = response.data.orders?.data || [];
      setPendingOrders(response.data.orders?.total || orders.length);
      setRecentNotifications(orders.slice(0, 5));
    } catch (error) {
      // silent
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    if (location.pathname.match(/\/admin\/pesanan\/\d+/)) return 'Detail Pesanan';
    return pageTitles[location.pathname] || 'Admin';
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-ink text-white shadow-xl z-40">
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Dreamcatcher" className="h-10" />
            <span className="font-heading text-[22px] text-primary tracking-[2px]">
              Dream<span className="text-[#ff4a1c]">catcher</span>
            </span>
          </Link>
        </div>

        <nav className="px-4 mt-4">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors no-underline ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-[#ccc] hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.to === '/admin/pesanan' && pendingOrders > 0 && (
                  <span className="ml-auto bg-fire text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingOrders > 99 ? '99+' : pendingOrders}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="mb-4 px-4">
            <p className="font-medium text-white">{user?.name || 'Admin'}</p>
            <p className="text-sm text-gray">{user?.email}</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 w-full rounded-lg hover:bg-white/10 transition-colors text-[#ccc]"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-ink border-b border-white/10 flex items-center justify-between px-8 z-30">
        <h2 className="font-heading text-lg text-white tracking-[1px]">{getPageTitle()}</h2>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileDropdown(false); }}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-[#ccc]"
            >
              <Bell className="w-5 h-5" />
              {pendingOrders > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-fire text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingOrders > 99 ? '99+' : pendingOrders}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h4 className="font-heading text-sm font-bold text-white">Notifikasi</h4>
                  <Link
                    to="/admin/pesanan"
                    onClick={() => setShowNotifications(false)}
                    className="text-primary text-xs hover:underline"
                  >
                    Lihat Semua
                  </Link>
                </div>
                {recentNotifications.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {recentNotifications.map((order) => (
                      <Link
                        key={order.id}
                        to={`/admin/pesanan/${order.id}`}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-3 p-3 hover:bg-ink transition-colors no-underline border-b border-border/50 last:border-0"
                      >
                        <div className="w-2 h-2 bg-fire rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-white text-sm font-medium">{order.order_code}</p>
                          <p className="text-gray text-xs">{order.customer_name} — pesanan baru masuk</p>
                          <p className="text-gray text-[10px] mt-0.5">
                            {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray text-sm">Tidak ada notifikasi baru</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-[#ccc]"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-ink font-bold text-sm">
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white hidden lg:block">{user?.name || 'Admin'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border shadow-xl">
                <div className="p-3 border-b border-border">
                  <p className="text-white font-medium text-sm">{user?.name}</p>
                  <p className="text-gray text-xs">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-[#ccc] hover:bg-ink transition-colors text-sm"
                  >
                    <User className="w-4 h-4" />
                    Profil Saya
                  </button>
                  <button
                    onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-[#ccc] hover:bg-ink transition-colors text-sm"
                  >
                    <Lock className="w-4 h-4" />
                    Ganti Password
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { setShowProfileDropdown(false); setShowLogoutConfirm(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-danger hover:bg-ink transition-colors text-sm"
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
      <main className="ml-64 pt-16 p-8">
        <Outlet />
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
      />
    </div>
  );
}
