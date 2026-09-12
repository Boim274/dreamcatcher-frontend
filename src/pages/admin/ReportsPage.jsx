import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { Download, TrendingUp, Package, DollarSign, Calendar, BarChart3, PieChart, RotateCcw } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const statusMeta = [
  { key: 'pending', label: 'Pending', color: 'bg-gray-400' },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', color: 'bg-yellow-400' },
  { key: 'paid', label: 'Lunas', color: 'bg-blue-400' },
  { key: 'processed', label: 'Diproses', color: 'bg-purple-400' },
  { key: 'delivered', label: 'Dikirim / Siap Diambil', color: 'bg-violet-400' },
  { key: 'completed', label: 'Selesai', color: 'bg-green-400' },
  { key: 'cancelled', label: 'Batal', color: 'bg-red-400' },
];

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-ink flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-ink rounded" />
          <div className="h-6 w-16 bg-ink rounded" />
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton({ rows = 5 }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
      <div className="h-5 w-56 bg-ink rounded mb-6" />
      <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-8 bg-ink rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState('default');
  const [activeQuickDays, setActiveQuickDays] = useState(null);
  const [filterNonce, setFilterNonce] = useState(0);

  const fetchReports = async (signal) => {
    setLoading(true);
    try {
      setError(false);
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await adminService.getReports(params, signal);
      setStats(response);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch reports:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) return;
    setActiveQuickDays(null);
    setActiveFilter('custom');
    setFilterNonce((n) => n + 1);
  };

  const resetFilter = () => {
    setDateFrom('');
    setDateTo('');
    setActiveQuickDays(null);
    setActiveFilter('default');
    setFilterNonce((n) => n + 1);
  };

  const quickFilter = (days) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days + 1);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(today.toISOString().slice(0, 10));
    setActiveQuickDays(days);
    setActiveFilter('quick');
    setFilterNonce((n) => n + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(() => fetchReports(controller.signal), 0);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, filterNonce]);

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

  const hasChartData = stats?.chart_data?.labels?.length > 0;
  const hasExportData = !loading && hasChartData;

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
    <ErrorBoundary>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="font-heading text-[28px] text-white tracking-[1px]">Laporan Penjualan</h1>

          <button
            onClick={handleExportCSV}
            disabled={!hasExportData}
            title={hasExportData ? undefined : 'Belum ada data untuk diekspor'}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="bg-card border border-fire/40 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
            <p className="text-gray text-sm">
              Gagal memuat data laporan. Periksa koneksi Anda dan coba lagi.
            </p>
            <button
              onClick={() => fetchReports()}
              className="text-primary text-sm font-medium hover:underline flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Date Filter — stays visible while data reloads */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5 text-gray min-w-0">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-semibold text-white">Filter Rentang</span>
              {(dateFrom || dateTo) && (
                <span className="hidden sm:inline-flex text-[11px] text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 truncate">
                  {getChartTitle()}
                </span>
              )}
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={resetFilter}
                className="flex items-center gap-1.5 text-[12px] text-gray hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quick range */}
            <div>
              <p className="text-fire text-[10px] font-bold tracking-[1px] uppercase mb-2">Rentang Cepat</p>
              <div className="inline-flex bg-ink border border-border rounded-lg p-1 gap-1">
                <button
                  onClick={resetFilter}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeFilter === 'default' ? 'bg-primary text-white' : 'text-gray-light hover:text-white hover:bg-border'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => quickFilter(7)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeFilter === 'quick' && activeQuickDays === 7 ? 'bg-primary text-white' : 'text-gray-light hover:text-white hover:bg-border'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => quickFilter(30)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeFilter === 'quick' && activeQuickDays === 30 ? 'bg-primary text-white' : 'text-gray-light hover:text-white hover:bg-border'
                  }`}
                >
                  30 Hari
                </button>
                <button
                  onClick={() => quickFilter(90)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeFilter === 'quick' && activeQuickDays === 90 ? 'bg-primary text-white' : 'text-gray-light hover:text-white hover:bg-border'
                  }`}
                >
                  90 Hari
                </button>
              </div>
            </div>

            {/* Custom range */}
            <div className="md:border-l md:border-border md:pl-5">
              <p className="text-fire text-[10px] font-bold tracking-[1px] uppercase mb-2">Rentang Kustom</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="date-from">Dari tanggal</label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-dark text-[13px] !py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span className="text-gray text-[12px]">s/d</span>
                <label className="sr-only" htmlFor="date-to">Sampai tanggal</label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-dark text-[13px] !py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  onClick={applyDateFilter}
                  disabled={!dateFrom || !dateTo}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p className="text-fire text-[12px] mt-3">Tanggal "dari" tidak boleh setelah tanggal "sampai".</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading
            ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
            : reportStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:border-gray-dark hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray text-sm truncate">{stat.label}</p>
                      <p className="font-heading font-bold text-2xl text-white truncate">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <PanelSkeleton rows={7} />
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold mb-6 text-white">
                Grafik Pesanan — {getChartTitle()}
              </h2>
              {hasChartData ? (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {stats.chart_data.labels.map((label, i) => {
                    const value = stats.chart_data.datasets[0].data[i];
                    const max = Math.max(...stats.chart_data.datasets[0].data, 1);
                    const percentage = (value / max) * 100;

                    return (
                      <div key={label} className="flex items-center gap-4">
                        <span className="text-gray text-sm w-20 flex-shrink-0">{label}</span>
                        <div className="flex-1 bg-ink rounded-full h-8 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out"
                            style={{ width: `${Math.max(percentage, value > 0 ? 8 : 0)}%` }}
                          >
                            {value > 0 && <span className="text-white text-sm font-bold">{value}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={BarChart3} title="Belum ada data pesanan" subtitle="Coba ubah rentang tanggal filter" />
              )}
            </div>
          )}

          {loading ? (
            <PanelSkeleton rows={7} />
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold mb-6 text-white">Distribusi Status Pesanan</h2>
              {Object.values(stats?.status_counts || {}).some((v) => v > 0) ? (
                <div className="space-y-4">
                  {statusMeta.map((status) => {
                    const count = stats?.status_counts?.[status.key] || 0;
                    const total = Object.values(stats?.status_counts || {}).reduce((a, b) => a + b, 0) || 1;
                    const percentage = (count / total) * 100;

                    return (
                      <div key={status.key} className="flex items-center gap-4">
                        <div className={`w-4 h-4 ${status.color} rounded flex-shrink-0`} />
                        <span className="flex-1 text-sm text-[#ccc] truncate">{status.label}</span>
                        <span className="font-bold text-white w-8 text-right flex-shrink-0">{count}</span>
                        <div className="w-24 bg-ink rounded-full h-2 flex-shrink-0">
                          <div
                            className={`h-full ${status.color} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={PieChart} title="Belum ada pesanan" subtitle="Distribusi status akan tampil di sini" />
              )}
            </div>
          )}
        </div>

        {/* Daily Summary Table */}
        {loading ? (
          <div className="mt-6">
            <PanelSkeleton rows={6} />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold text-white">Ringkasan per Hari</h2>
            </div>

            {hasChartData ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-ink">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray rounded-l-lg">Tanggal</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray">Jumlah Pesanan</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray rounded-r-lg">Total Penjualan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.chart_data.labels.map((label, i) => (
                      <tr key={label} className="transition-colors hover:bg-ink/60">
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
            ) : (
              <EmptyState icon={Package} title="Belum ada ringkasan" subtitle="Ringkasan harian akan tampil setelah ada pesanan" />
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-full bg-ink border border-border flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className="text-gray-medium" />
      </div>
      <p className="text-white text-sm font-medium">{title}</p>
      <p className="text-gray text-xs mt-1">{subtitle}</p>
    </div>
  );
}