import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Download, TrendingUp, Package, DollarSign, Calendar, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState('default');

  useEffect(() => {
    fetchReports();
  }, [activeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await api.get('/admin/dashboard', { params });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) return;
    setActiveFilter('custom');
  };

  const resetFilter = () => {
    setDateFrom('');
    setDateTo('');
    setActiveFilter('default');
  };

  const quickFilter = (days) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days + 1);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(today.toISOString().slice(0, 10));
    setActiveFilter('quick');
  };

  const handleExportCSV = useCallback(() => {
    if (!stats?.chart_data) return;

    const labels = stats.chart_data.labels || [];
    const orderCounts = stats.chart_data.datasets[0]?.data || [];
    const avgRevenuePerOrder = 350000;

    const header = 'Tanggal,Jumlah Pesanan,Total Penjualan';
    const rows = labels.map((label, i) => {
      const count = orderCounts[i] || 0;
      const revenue = count * avgRevenuePerOrder;
      return `${label},${count},"Rp ${revenue.toLocaleString('id-ID')}"`;
    });

    const totalOrders = orderCounts.reduce((a, b) => a + b, 0);
    const totalRevenue = totalOrders * avgRevenuePerOrder;
    rows.push(`TOTAL,${totalOrders},"Rp ${totalRevenue.toLocaleString('id-ID')}"`);

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `laporan-dreamcatcher-${dateFrom || 'all'}-sd-${dateTo || today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [stats, dateFrom, dateTo]);

  const getChartTitle = () => {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const to = new Date(dateTo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${from} — ${to}`;
    }
    return '7 Hari Terakhir';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="font-heading text-[28px] text-white tracking-[1px]">Laporan Penjualan</h1>

        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-card border border-border rounded-xl p-4 mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-center gap-2 text-gray">
            <Calendar className="w-4 h-4" />
            <span className="text-[13px] font-medium">Filter Tanggal:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => resetFilter()} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${activeFilter === 'default' ? 'bg-primary text-white' : 'bg-ink text-gray-light hover:bg-border'}`}>
              Default
            </button>
            <button onClick={() => quickFilter(7)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${dateFrom && dateTo && activeFilter === 'quick' ? 'bg-primary text-white' : 'bg-ink text-gray-light hover:bg-border'}`}>
              7 Hari
            </button>
            <button onClick={() => quickFilter(30)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${activeFilter === 'quick' && dateFrom && new Date(dateTo).getDate() - new Date(dateFrom).getDate() >= 29 ? 'bg-primary text-white' : 'bg-ink text-gray-light hover:bg-border'}`}>
              30 Hari
            </button>
            <button onClick={() => quickFilter(90)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${activeFilter === 'quick' && dateFrom && new Date(dateTo).getDate() - new Date(dateFrom).getDate() >= 89 ? 'bg-primary text-white' : 'bg-ink text-gray-light hover:bg-border'}`}>
              90 Hari
            </button>
          </div>

          <div className="h-6 w-px bg-border hidden lg:block" />

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-dark text-[13px] !py-1.5"
            />
            <span className="text-gray text-[12px]">s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-dark text-[13px] !py-1.5"
            />
            <button
              onClick={applyDateFilter}
              disabled={!dateFrom || !dateTo}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Terapkan
            </button>
            {(dateFrom || dateTo) && (
              <button onClick={resetFilter} className="p-1.5 text-gray hover:text-white transition-colors" title="Reset filter">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <h2 className="font-heading text-xl font-semibold mb-6 text-white">Grafik Pesanan — {getChartTitle()}</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {stats?.chart_data?.labels?.map((label, i) => {
              const value = stats.chart_data.datasets[0].data[i];
              const max = Math.max(...stats.chart_data.datasets[0].data, 1);
              const percentage = (value / max) * 100;

              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-gray text-sm w-20 flex-shrink-0">{label}</span>
                  <div className="flex-1 bg-border rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, value > 0 ? 8 : 0)}%` }}
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
              { key: 'delivered', label: 'Dikirim / Siap Diambil', color: 'bg-violet-400' },
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

      {/* Daily Summary Table */}
      <div className="bg-card border border-border p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-semibold text-white">Ringkasan per Hari</h2>
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
