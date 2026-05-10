import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import feather from 'feather-icons';

import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import ServicesPage from './pages/admin/ServicesPage';
import ReportsPage from './pages/admin/ReportsPage';

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

function AppContent() {
  useEffect(() => {
    feather.replace();
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/layanan" element={<CatalogPage />} />
        <Route path="/pesan" element={<OrderPage />} />
        <Route path="/pesan/pembayaran/:orderCode" element={<PaymentPage />} />
        <Route path="/lacak-pesanan" element={<TrackOrderPage />} />

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
          <Route path="laporan" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}