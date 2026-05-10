import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  BarChart3,
  LogOut,
  Scissors,
} from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { to: '/admin/layanan', label: 'Layanan', icon: Package },
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
    <div className="min-h-screen bg-bg-light">
      <aside className="fixed left-0 top-0 h-full w-64 bg-secondary text-white shadow-xl">
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl">Dreamcatcher</span>
              <span className="text-primary font-bold">.id</span>
            </div>
          </Link>
        </div>

        <nav className="px-4 mt-4">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'hover:bg-white/10'
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
            <p className="font-medium">{user?.name || 'Admin'}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 w-full rounded-lg hover:bg-white/10 transition-colors"
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