import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShoppingBag,
  Clock,
  CreditCard,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

const statConfig = [
  { key: 'today_orders', label: 'Pesanan Hari Ini', icon: ShoppingBag, color: 'bg-info' },
  { key: 'pending_orders', label: 'Menunggu Konfirmasi', icon: Clock, color: 'bg-warning' },
  { key: 'pending_payments', label: 'Pembayaran Pending', icon: CreditCard, color: 'bg-fire' },
  { key: 'month_revenue', label: 'Pendapatan Bulan Ini', icon: DollarSign, color: 'bg-success', format: 'currency' },
];

const statusLabels = {
  pending: 'Pending',
  waiting_payment: 'Menunggu Bayar',
  paid: 'Lunas',
  processed: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Batal',
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatValue = (key, value) => {
    if (key === 'month_revenue') {
      return formatRupiah(value);
    }
    return value || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Dashboard</h1>
        <p className="text-gray mt-1">Selamat datang di panel admin Dreamcatcher</p>
      </div>

      {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statConfig.map((stat) => (
          <div key={stat.key} className="bg-card border border-border p-4 flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray text-sm">{stat.label}</p>
              <p className="font-heading font-bold text-2xl text-white">
                {formatValue(stat.key, stats?.stats?.[stat.key])}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Orders */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-white">Pesanan Terbaru</h2>
            <Link 
              to="/admin/pesanan" 
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recent_orders?.length > 0 ? (
              stats.recent_orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/pesanan/${order.id}`}
                  className="flex items-center justify-between p-4 bg-ink border border-border rounded-xl hover:border-gray-dark transition-colors no-underline"
                >
                  <div>
                    <p className="font-semibold text-white">{order.order_code}</p>
                    <p className="text-gray text-sm">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatRupiah(order.total_price)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingBag size={24} className="text-gray-medium mx-auto mb-2" />
                <p className="text-gray text-sm">Belum ada pesanan</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-white">Statistik 7 Hari</h2>
            <Link 
              to="/admin/laporan" 
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              Lihat Laporan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.chart_data?.labels?.map((label, i) => {
              const value = stats.chart_data.datasets[0].data[i];
              const max = Math.max(...stats.chart_data.datasets[0].data, 1);
              const percentage = (value / max) * 100;

              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-gray text-sm w-20">{label}</span>
                  <div className="flex-1 bg-border rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {value > 0 && (
                        <span className="text-white text-xs font-bold">{value}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-card border border-border p-6">
        <h2 className="font-heading text-xl font-semibold mb-6 text-white">Status Pesanan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="text-center p-4 bg-ink border border-border rounded-xl">
              <p className="font-bold text-2xl text-white">
                {stats?.status_counts?.[key] || 0}
              </p>
              <p className="text-gray text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
