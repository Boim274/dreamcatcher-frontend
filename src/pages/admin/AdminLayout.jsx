import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  Image,
  BarChart3,
  LogOut,
} from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { to: '/admin/layanan', label: 'Layanan', icon: Package },
  { to: '/admin/portfolio', label: 'Portfolio', icon: Image },
  { to: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed left-0 top-0 h-full w-64 bg-ink text-white shadow-xl">
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Dreamcatcher" className="h-10" />
            <span className="font-heading text-[22px] text-primary tracking-[2px]">
              Dream<span className="text-[#ea6fab]">catcher</span>
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
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 w-full rounded-lg hover:bg-white/10 transition-colors text-[#ccc]"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}