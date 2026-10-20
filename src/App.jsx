import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuthModalStore } from './store/authModalStore';
import { useCartStore } from './store/cartStore';
import { useOrderStore } from './store/orderStore';
import { authService } from './services/authService';
import feather from 'feather-icons';

import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import ShirtModelSelectPage from './pages/ShirtModelSelectPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import MyOrdersPage from './pages/MyOrdersPage';
import CustomerOrderHistoryPage from './pages/CustomerOrderHistoryPage';
import PricelistPage from './pages/PricelistPage';
import DesignStudioPage from './pages/DesignStudio';
import SizeChartPage from './pages/SizeChartPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderHistoryPage from './pages/admin/OrderHistoryPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import PaymentHistoryPage from './pages/admin/PaymentHistoryPage';
import PortfoliosPage from './pages/admin/PortfoliosPage';
import ProductsPage from './pages/admin/ProductsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ColorsPage from './pages/admin/ColorsPage';
import SizesPage from './pages/admin/SizesPage';
import TestimonialsPage from './pages/admin/TestimonialsPage';
import SettingsPage from './pages/admin/SettingsPage';
import ReportsPage from './pages/admin/ReportsPage';
import UsersPage from './pages/admin/UsersPage';
import AuthModal from './components/ui/AuthModal';
import FloatingCustomerBar from './components/common/FloatingCustomerBar';
import { ToastProvider } from './components/ui/Toast';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  if (!isInitialized) return null;
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

function CustomerProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { openLogin, isOpen } = useAuthModalStore();
  const navigate = useNavigate();
  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      openLogin();
    }
  }, [isInitialized, isAuthenticated, openLogin]);

  useEffect(() => {
    if (prevIsOpen.current && !isOpen && !isAuthenticated) {
      navigate('/', { replace: true });
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, isAuthenticated, navigate]);

  if (!isInitialized) return null;
  if (!isAuthenticated) return null;
  return children;
}

function AppContent() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Keep cart & order draft scoped to the logged-in user: switching accounts (or logging
  // out) loads that account's own state instead of a shared global one.
  useEffect(() => {
    const syncCart = () => {
      const id = authService.getUser()?.id;
      if (id == null) {
        useCartStore.setState({ items: [] });
        return;
      }
      try {
        const raw = localStorage.getItem(`cart-u${id}`);
        const stored = raw ? JSON.parse(raw) : null;
        useCartStore.setState({ items: stored?.state?.items || stored?.items || [] });
      } catch {
        useCartStore.setState({ items: [] });
      }
    };

    const syncOrder = () => {
      const id = authService.getUser()?.id;
      if (id == null) {
        useOrderStore.getState().resetAll();
        return;
      }
      try {
        const raw = localStorage.getItem(`order-u${id}`);
        const stored = raw ? JSON.parse(raw) : null;
        if (stored?.state) {
          useOrderStore.setState(stored.state);
        } else if (stored) {
          useOrderStore.setState(stored);
        } else {
          useOrderStore.getState().resetAll();
        }
      } catch {
        useOrderStore.getState().resetAll();
      }
    };

    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      if (state.user?.id !== prev.user?.id) {
        syncCart();
        syncOrder();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    feather.replace();
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [window.location.pathname]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/layanan" element={<CatalogPage />} />
        <Route path="/layanan/kaos" element={<ShirtModelSelectPage />} />
        <Route path="/layanan/model-kaos" element={<ShirtModelSelectPage />} />
        <Route path="/produk" element={<ProductListPage />} />
        <Route path="/produk/:id" element={<ProductDetailPage />} />
        <Route path="/keranjang" element={
          <CustomerProtectedRoute>
            <CartPage />
          </CustomerProtectedRoute>
        } />
        <Route path="/pesan" element={
          <CustomerProtectedRoute>
            <OrderPage />
          </CustomerProtectedRoute>
        } />
        <Route path="/pesan/pembayaran/:orderCode" element={
          <CustomerProtectedRoute>
            <PaymentPage />
          </CustomerProtectedRoute>
        } />
        <Route path="/pricelist" element={<PricelistPage />} />
        <Route path="/design-studio" element={
          <CustomerProtectedRoute>
            <DesignStudioPage />
          </CustomerProtectedRoute>
        } />
        <Route path="/size-chart" element={<SizeChartPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/tentang" element={<AboutPage />} />
        <Route path="/pesanan-saya" element={
          <CustomerProtectedRoute>
            <MyOrdersPage />
          </CustomerProtectedRoute>
        } />
        <Route path="/histori-pesanan" element={
          <CustomerProtectedRoute>
            <CustomerOrderHistoryPage />
          </CustomerProtectedRoute>
        } />
        <Route path="/profile" element={
          <CustomerProtectedRoute>
            <ProfilePage />
          </CustomerProtectedRoute>
        } />
        <Route path="/profil" element={
          <CustomerProtectedRoute>
            <ProfilePage />
          </CustomerProtectedRoute>
        } />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="pesanan" element={<OrdersPage />} />
          <Route path="histori-pesanan" element={<OrderHistoryPage />} />
          <Route path="pesanan/:id" element={<OrderDetailPage />} />
          <Route path="pembayaran" element={<PaymentsPage />} />
          <Route path="histori-pembayaran" element={<PaymentHistoryPage />} />
          <Route path="layanan" element={<Navigate to="/admin" replace />} />
          <Route path="portfolio" element={<PortfoliosPage />} />
          <Route path="produk" element={<ProductsPage />} />
          <Route path="kategori" element={<CategoriesPage />} />
          <Route path="warna" element={<ColorsPage />} />
          <Route path="ukuran" element={<SizesPage />} />
          <Route path="testimoni" element={<TestimonialsPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
          <Route path="laporan" element={<ReportsPage />} />
          <Route path="pengguna" element={<UsersPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
      <FloatingCustomerBar />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}