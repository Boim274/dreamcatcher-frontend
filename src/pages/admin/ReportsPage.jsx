import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Download, TrendingUp, Package, DollarSign } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
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

  const reportStats = [
    {
      label: 'Total Pesanan',
      value: Object.values(stats?.status_counts || {}).reduce((a, b) => a + b, 0),
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      label: 'Pesanan Selesai',
      value: stats?.status_counts?.completed || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Total Pendapatan',
      value: formatRupiah(stats?.stats?.month_revenue || 0),
      icon: DollarSign,
      color: 'bg-primary',
    },
    {
      label: 'Pesanan Aktif',
      value: (stats?.status_counts?.paid || 0) + (stats?.status_counts?.processed || 0),
      icon: Package,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Laporan Penjualan</h1>

        <div className="flex gap-2">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-gray hover:bg-border'
              }`}
            >
              {p === 'day' ? 'Hari Ini' : p === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportStats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border p-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray text-sm">{stat.label}</p>
                <p className="font-heading font-bold text-2xl text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <h2 className="font-heading text-xl font-semibold mb-6 text-white">Grafik Pesanan 7 Hari</h2>
          <div className="space-y-4">
            {stats?.chart_data?.labels?.map((label, i) => {
              const value = stats.chart_data.datasets[0].data[i];
              const max = Math.max(...stats.chart_data.datasets[0].data, 1);
              const percentage = (value / max) * 100;

              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-gray text-sm w-20">{label}</span>
                  <div className="flex-1 bg-border rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {value > 0 && (
                        <span className="text-white text-sm font-bold">{value}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="font-heading text-xl font-semibold mb-6 text-white">Distribusi Status Pesanan</h2>
          <div className="space-y-4">
            {[
              { key: 'pending', label: 'Pending', color: 'bg-gray-400' },
              { key: 'waiting_payment', label: 'Menunggu Pembayaran', color: 'bg-yellow-400' },
              { key: 'paid', label: 'Lunas', color: 'bg-blue-400' },
              { key: 'processed', label: 'Diproses', color: 'bg-purple-400' },
              { key: 'completed', label: 'Selesai', color: 'bg-green-400' },
              { key: 'cancelled', label: 'Batal', color: 'bg-red-400' },
            ].map((status) => {
              const count = stats?.status_counts?.[status.key] || 0;
              const total = Object.values(stats?.status_counts || {}).reduce((a, b) => a + b, 1);
              const percentage = (count / total) * 100;

              return (
                <div key={status.key} className="flex items-center gap-4">
                  <div className={`w-4 h-4 ${status.color} rounded`} />
                  <span className="flex-1 text-sm text-[#ccc]">{status.label}</span>
                  <span className="font-bold text-white">{count}</span>
                  <div className="w-24 bg-border rounded-full h-2">
                    <div
                      className={`h-full ${status.color} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-semibold text-white">Ringkasan per Hari</h2>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Tanggal</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Jumlah Pesanan</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Total Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.chart_data?.labels?.map((label, i) => (
                <tr key={label}>
                  <td className="px-4 py-3 text-[#ccc]">{label}</td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {stats.chart_data.datasets[0].data[i]} pesanan
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {formatRupiah(stats.chart_data.datasets[0].data[i] * 350000)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}