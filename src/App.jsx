import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useAuthModalStore } from './store/authModalStore';
import feather from 'feather-icons';

import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import MyOrdersPage from './pages/MyOrdersPage';
import PricelistPage from './pages/PricelistPage';
import DesignStudioPage from './pages/DesignStudio';
import SizeChartPage from './pages/SizeChartPage';
import AboutPage from './pages/AboutPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import ServicesPage from './pages/admin/ServicesPage';
import PortfoliosPage from './pages/admin/PortfoliosPage';
import ColorsPage from './pages/admin/ColorsPage';
import SizesPage from './pages/admin/SizesPage';
import TestimonialsPage from './pages/admin/TestimonialsPage';
import SettingsPage from './pages/admin/SettingsPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuthModal from './components/ui/AuthModal';
import { ToastProvider } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
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
        <Route path="/pesanan-saya" element={
          <CustomerProtectedRoute>
            <MyOrdersPage />
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
          <Route path="pesanan/:id" element={<OrderDetailPage />} />
          <Route path="pembayaran" element={<PaymentsPage />} />
          <Route path="layanan" element={<ServicesPage />} />
          <Route path="portfolio" element={<PortfoliosPage />} />
          <Route path="warna" element={<ColorsPage />} />
          <Route path="ukuran" element={<SizesPage />} />
          <Route path="testimoni" element={<TestimonialsPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
          <Route path="laporan" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  );
}