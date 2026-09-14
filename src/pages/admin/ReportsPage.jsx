import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Download,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  RotateCcw,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  Layers,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { useToast } from '../../components/ui/Toast';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const statusMeta = [
  { key: 'pending', label: 'Pesanan Diterima', color: 'bg-zinc-500', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  { key: 'waiting_verification', label: 'Menunggu Verifikasi', color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
  { key: 'ready_to_process', label: 'Siap Diproses', color: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { key: 'processing', label: 'Sedang Diproses', color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30' },
  { key: 'ready_for_pickup', label: 'Siap Diambil / Dikirim', color: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { key: 'completed', label: 'Selesai', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { key: 'cancelled', label: 'Dibatalkan', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
];

export default function ReportsPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState('default'); // 'default' | 'quick' | 'custom'
  const [activeQuickDays, setActiveQuickDays] = useState(null);
  const [filterNonce, setFilterNonce] = useState(0);
  const [chartViewMode, setChartViewMode] = useState('revenue'); // 'revenue' | 'orders'
  const [tableTab, setTableTab] = useState('daily'); // 'daily' | 'orders'

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
        toast.error('Gagal memuat data laporan penjualan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.warning('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
      return;
    }
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

  const filterThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(firstDay.toISOString().slice(0, 10));
    setDateTo(now.toISOString().slice(0, 10));
    setActiveQuickDays('this_month');
    setActiveFilter('quick');
    setFilterNonce((n) => n + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterNonce]);

  const handleExportCSV = useCallback(() => {
    if (!stats?.chart_data?.labels?.length) {
      toast.warning('Tidak ada data laporan untuk diekspor.');
      return;
    }

    const labels = stats.chart_data.labels || [];
    const orderCounts = stats.chart_data.datasets?.[0]?.data || [];
    const completedCounts = stats.chart_data.datasets?.[1]?.data || [];
    const dailyRevenues = stats.chart_data.daily_revenues || stats.chart_data.datasets?.[2]?.data || [];

    const header = ['Tanggal', 'Jumlah Pesanan', 'Pesanan Selesai', 'Pendapatan Riil (Rp)'].join(',');
    const rows = labels.map((label, i) => {
      const orders = orderCounts[i] || 0;
      const completed = completedCounts[i] || 0;
      const revenue = dailyRevenues[i] || 0;
      return [
        `"${label}"`,
        orders,
        completed,
        `"${formatRupiah(revenue)}"`,
      ].join(',');
    });

    const totalOrders = orderCounts.reduce((a, b) => a + b, 0);
    const totalCompleted = completedCounts.reduce((a, b) => a + b, 0);
    const totalRevenue = dailyRevenues.reduce((a, b) => a + b, 0);
    rows.push(['"TOTAL"', totalOrders, totalCompleted, `"${formatRupiah(totalRevenue)}"`].join(','));

    // Append detailed orders list if available
    if (stats.orders_list?.length) {
      rows.push('');
      rows.push(['RINCIAN PESANAN INDIVIDUAL'].join(','));
      rows.push(['Kode Pesanan', 'Nama Customer', 'Email', 'No. HP', 'Metode', 'Status', 'Status Bayar', 'Total Tagihan', 'Waktu Dibuat'].join(','));
      stats.orders_list.forEach((o) => {
        rows.push([
          `"${o.order_code}"`,
          `"${o.customer_name}"`,
          `"${o.customer_email}"`,
          `"${o.phone || '-'}"`,
          `"${o.delivery_method}"`,
          `"${o.status}"`,
          `"${o.payment_status || '-'}"`,
          `"${formatRupiah(o.total_price)}"`,
          `"${o.created_at}"`,
        ].join(','));
      });
    }

    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `laporan-penjualan-dreamcatcher-${dateFrom || 'awal'}-sd-${dateTo || today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan penjualan berhasil diekspor ke format CSV!');
  }, [stats, dateFrom, dateTo, toast]);

  const getChartTitle = () => {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const to = new Date(dateTo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${from} — ${to}`;
    }
    return 'Bulan Ini / 7 Hari Terakhir';
  };

  const hasChartData = stats?.chart_data?.labels?.length > 0;
  const totalRevenue = stats?.stats?.total_revenue ?? stats?.stats?.month_revenue ?? 0;
  const totalOrders = stats?.stats?.period_orders ?? stats?.stats?.today_orders ?? 0;
  const completedOrders = stats?.stats?.completed_orders ?? stats?.status_counts?.completed ?? 0;
  const activeOrders = stats?.stats?.active_orders ?? (stats?.status_counts?.ready_to_process ?? 0) + (stats?.status_counts?.processing ?? 0) + (stats?.status_counts?.ready_for_pickup ?? 0);
  const aov = stats?.stats?.avg_order_value ?? (totalOrders > 0 ? Math.round(totalRevenue / Math.max(1, completedOrders || totalOrders)) : 0);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const chartLabels = stats?.chart_data?.labels || [];
  const chartOrders = stats?.chart_data?.datasets?.[0]?.data || [];
  const chartRevenues = stats?.chart_data?.daily_revenues || stats?.chart_data?.datasets?.[2]?.data || [];

  const maxRevenueVal = Math.max(...chartRevenues, 1);
  const maxOrderVal = Math.max(...chartOrders, 1);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">
                Laporan Penjualan & Analitik Keuangan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Verified Finance
              </span>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Ringkasan pendapatan riil transaksi toko, performa pemesanan sablon kustom, dan histori harian.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setLoading(true);
                fetchReports();
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={loading || !hasChartData}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Export CSV Lengkap</span>
            </button>
          </div>
        </div>

        {/* Filter Bar (Quick & Custom Date Picker) */}
        <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Filter Buttons */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter size={13} className="text-primary" />
                <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider font-heading">
                  Rentang Cepat
                </span>
                {(dateFrom || dateTo) && (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-mono">
                    {getChartTitle()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={resetFilter}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeFilter === 'default'
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Semua / Default
                </button>
                <button
                  type="button"
                  onClick={() => quickFilter(7)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeFilter === 'quick' && activeQuickDays === 7
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => quickFilter(30)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeFilter === 'quick' && activeQuickDays === 30
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={filterThisMonth}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeFilter === 'quick' && activeQuickDays === 'this_month'
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => quickFilter(90)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeFilter === 'quick' && activeQuickDays === 90
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  90 Hari
                </button>
              </div>
            </div>

            {/* Custom Date Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 lg:pt-0 lg:border-l lg:border-white/10 lg:pl-5">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-dark text-xs !py-2 bg-[#120a16] border-white/15 focus:border-primary text-white"
                />
                <span className="text-zinc-400 text-xs">s/d</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-dark text-xs !py-2 bg-[#120a16] border-white/15 focus:border-primary text-white"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={applyDateFilter}
                  disabled={!dateFrom || !dateTo}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/20"
                >
                  Terapkan
                </button>
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={resetFilter}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    title="Reset Filter"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pendapatan Riil */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-primary/25 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider font-heading">
                Total Pendapatan Riil
              </span>
              <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-wide">
              {formatRupiah(totalRevenue)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
              <ArrowUpRight size={14} />
              <span>Pendapatan dari pesanan terverifikasi</span>
            </div>
          </div>

          {/* Card 2: Total Pesanan */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-white/25 transition-all">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider font-heading">
                Volume Transaksi
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/40">
                <ShoppingBag size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-wide">
              {totalOrders} <span className="text-sm font-body text-zinc-400 font-normal">Pesanan</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
              <Clock size={12} className="text-primary" />
              <span>{activeOrders} pesanan sedang diproses</span>
            </div>
          </div>

          {/* Card 3: Pesanan Selesai */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider font-heading">
                Pesanan Sukses
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-heading tracking-wide">
              {completedOrders} <span className="text-sm font-body text-zinc-400 font-normal">Selesai</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
              <span>Tingkat sukses: <strong>{completionRate}%</strong></span>
            </div>
          </div>

          {/* Card 4: Rata-Rata Order Value (AOV) */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-white/25 transition-all">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider font-heading">
                Rata-Rata Order (AOV)
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/40">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-wide">
              {formatRupiah(aov)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
              <Sparkles size={12} className="text-primary" />
              <span>Rata-rata belanja per checkout</span>
            </div>
          </div>
        </div>

        {/* Charts Section: 2 Kolom (Grafik Tren & Distribusi Status) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interactive Bar Chart (2 Kolom) */}
          <div className="lg:col-span-2 bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                  Tren Performa — {getChartTitle()}
                </h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Visualisasi grafik pergerakan pesanan dan pendapatan harian
                </p>
              </div>

              {/* Toggle Chart Mode */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartViewMode('revenue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    chartViewMode === 'revenue'
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pendapatan (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('orders')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    chartViewMode === 'orders'
                      ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Jumlah Pesanan
                </button>
              </div>
            </div>

            {/* Custom Interactive Bars Container */}
            {hasChartData ? (
              <div className="space-y-3 pt-2">
                <div className="h-64 sm:h-72 flex items-end gap-2 sm:gap-3 px-2 py-4 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto">
                  {chartLabels.map((label, i) => {
                    const rev = chartRevenues[i] || 0;
                    const count = chartOrders[i] || 0;
                    const val = chartViewMode === 'revenue' ? rev : count;
                    const maxVal = chartViewMode === 'revenue' ? maxRevenueVal : maxOrderVal;
                    const heightPct = Math.max(8, Math.round((val / maxVal) * 100));

                    return (
                      <div
                        key={label}
                        className="flex-1 min-w-[36px] sm:min-w-[44px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      >
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-14 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 bg-[#1f1326] border border-white/20 text-white text-xs py-1.5 px-2.5 rounded-xl shadow-2xl whitespace-nowrap -translate-y-1">
                          <p className="font-bold text-primary text-[11px]">{label}</p>
                          <p className="text-white text-xs font-semibold">
                            {chartViewMode === 'revenue' ? formatRupiah(rev) : `${count} Pesanan`}
                          </p>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1f1326] border-b border-r border-white/20 rotate-45" />
                        </div>

                        {/* Bar Pillar */}
                        <div
                          className={`w-full rounded-xl transition-all duration-500 ease-out group-hover:brightness-125 flex items-center justify-center relative overflow-hidden ${
                            val > 0
                              ? chartViewMode === 'revenue'
                                ? 'bg-gradient-to-t from-primary/70 via-primary to-[#ff60a8] shadow-md shadow-primary/20'
                                : 'bg-gradient-to-t from-blue-600/70 via-blue-500 to-cyan-400 shadow-md shadow-blue-950/40'
                              : 'bg-white/5 border border-white/5'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        >
                          {val > 0 && (
                            <span className="text-[10px] font-mono font-bold text-white scale-90 sm:scale-100 drop-shadow">
                              {chartViewMode === 'revenue' ? '' : val}
                            </span>
                          )}
                        </div>

                        {/* X-axis Label */}
                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors mt-2 text-center truncate max-w-full">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/10 text-center p-6">
                <BarChart3 size={32} className="text-zinc-600 mb-2" />
                <p className="text-white font-bold text-sm">Belum ada data grafik</p>
                <p className="text-zinc-400 text-xs mt-0.5">Coba sesuaikan filter rentang tanggal laporan</p>
              </div>
            )}
          </div>

          {/* Right Panel: Status Distribution & Production Breakdown (1 Kolom) */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PieChart size={18} className="text-primary" />
                <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                  Distribusi Status
                </h2>
              </div>
              <p className="text-zinc-400 text-xs mb-4">
                Penyebaran status dari total {totalOrders} pesanan di periode ini
              </p>

              <div className="space-y-3">
                {statusMeta.map((status) => {
                  const count = stats?.status_counts?.[status.key] || 0;
                  const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;

                  return (
                    <div key={status.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${status.color} shrink-0`} />
                          <span className="text-zinc-300 truncate text-[12px]">{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-white text-xs">{count}</span>
                          <span className="text-[10px] text-zinc-500 w-7 text-right">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full ${status.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action */}
            <div className="pt-3 border-t border-white/10">
              <Link
                to="/admin/pesanan"
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all no-underline group"
              >
                <span>Buka Manajemen Pesanan</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform text-primary" />
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Tables: Tabs (Ringkasan Harian vs Daftar Transaksi) */}
        <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTableTab('daily')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  tableTab === 'daily'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                    : 'text-zinc-400 hover:text-white bg-white/5'
                }`}
              >
                Ringkasan Harian
              </button>
              <button
                type="button"
                onClick={() => setTableTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  tableTab === 'orders'
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                    : 'text-zinc-400 hover:text-white bg-white/5'
                }`}
              >
                Daftar Pesanan ({stats?.orders_list?.length || 0})
              </button>
            </div>

            <span className="text-zinc-400 text-xs font-mono">
              Periode: <strong className="text-white">{getChartTitle()}</strong>
            </span>
          </div>

          {/* TAB 1: RINGKASAN HARIAN */}
          {tableTab === 'daily' && (
            <div className="overflow-x-auto">
              {hasChartData ? (
                <table className="w-full text-left">
                  <thead className="bg-black/50 border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                    <tr>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5 text-center">Volume Pesanan</th>
                      <th className="px-5 py-3.5 text-center">Pesanan Selesai</th>
                      <th className="px-5 py-3.5 text-right">Pendapatan Riil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {chartLabels.map((label, i) => {
                      const count = chartOrders[i] || 0;
                      const completed = stats?.chart_data?.datasets?.[1]?.data?.[i] || 0;
                      const rev = chartRevenues[i] || 0;

                      return (
                        <tr key={label} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white text-xs">{label}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 text-zinc-300 font-semibold text-xs">
                              {count} pesanan
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-xs">
                              {completed} selesai
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-xs">
                            {formatRupiah(rev)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-black/40 border-t border-white/10 font-bold text-xs text-white">
                    <tr>
                      <td className="px-5 py-3.5 uppercase font-heading text-primary">TOTAL PERIODE</td>
                      <td className="px-5 py-3.5 text-center font-mono">{totalOrders} pesanan</td>
                      <td className="px-5 py-3.5 text-center font-mono text-emerald-400">{completedOrders} selesai</td>
                      <td className="px-5 py-3.5 text-right font-mono text-primary text-sm font-heading">{formatRupiah(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="py-12 text-center text-zinc-500">
                  <p>Belum ada data ringkasan harian di periode ini.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAFTAR TRANSAKSI INDIVIDUAL */}
          {tableTab === 'orders' && (
            <div className="overflow-x-auto">
              {stats?.orders_list?.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-black/50 border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                    <tr>
                      <th className="px-5 py-3.5">Kode Pesanan</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5 text-center">Metode</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Total Tagihan</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {stats.orders_list.map((o) => (
                      <tr key={o.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-primary text-xs">
                          {o.order_code}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-white text-xs truncate max-w-[180px]">{o.customer_name}</p>
                          <p className="text-zinc-500 text-[11px] truncate max-w-[180px]">{o.customer_email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[11px] text-zinc-400 uppercase font-semibold">
                            {o.delivery_method === 'pickup' ? 'Ambil di Toko' : 'Kurir'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-zinc-300 border border-white/10">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-xs">
                          {formatRupiah(o.total_price)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/admin/pesanan/${o.id}`}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white inline-flex items-center gap-1 text-xs font-semibold no-underline"
                            title="Buka Detail Pesanan"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-zinc-500">
                  <p>Tidak ada transaksi pesanan yang ditemukan pada periode ini.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}