import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import {
  ShoppingBag,
  Clock,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const statConfig = [
  { key: 'today_orders', label: 'Pesanan Hari Ini', icon: ShoppingBag, color: 'bg-blue-500' },
  { key: 'pending_orders', label: 'Menunggu Konfirmasi', icon: Clock, color: 'bg-yellow-500' },
  { key: 'pending_payments', label: 'Pembayaran Pending', icon: CreditCard, color: 'bg-orange-500' },
  { key: 'month_revenue', label: 'Pendapatan Bulan Ini', icon: DollarSign, color: 'bg-green-500', format: 'currency' },
];

const statusBadges = {
  pending: 'bg-gray-100 text-gray-700',
  waiting_payment: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processed: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

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
        <Spinner size="lg" />
      </div>
    );
  }

  const formatValue = (key, value) => {
    if (key === 'month_revenue') {
      return `Rp ${value.toLocaleString('id-ID')}`;
    }
    return value || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Selamat datang di panel admin Dreamcatcher</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statConfig.map((stat) => (
          <Card key={stat.key} className="flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">{stat.label}</p>
              <p className="font-heading font-bold text-2xl">
                {formatValue(stat.key, stats?.stats?.[stat.key])}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Pesanan Terbaru</h2>
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-text-primary">{order.order_code}</p>
                    <p className="text-text-secondary text-sm">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      Rp {order.total_price.toLocaleString('id-ID')}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadges[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-text-secondary py-8">Belum ada pesanan</p>
            )}
          </div>
        </Card>

        {/* Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Statistik 7 Hari</h2>
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
                  <span className="text-text-secondary text-sm w-20">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
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
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <h2 className="font-heading text-xl font-semibold mb-6">Status Pesanan</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="font-bold text-2xl text-text-primary">
                {stats?.status_counts?.[key] || 0}
              </p>
              <p className="text-text-secondary text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}