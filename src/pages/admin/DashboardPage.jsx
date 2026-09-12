import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShoppingBag,
  Clock,
  CreditCard,
  DollarSign,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Package,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border p-5 rounded-2xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-ink/80" />
        <div className="h-5 w-16 bg-ink/80 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-28 bg-ink/80 rounded" />
        <div className="h-7 w-20 bg-ink/80 rounded" />
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl animate-pulse">
      <div className="h-5 w-44 bg-ink rounded mb-6" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-ink rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchDashboard = async (signal) => {
    try {
      setError(false);
      const data = await adminService.getDashboard(signal);
      setStats(data);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch dashboard:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const pendingOrdersCount = stats?.stats?.pending_orders || 0;
  const pendingPaymentsCount = stats?.stats?.pending_payments || 0;
  const needsAttention = pendingOrdersCount > 0 || pendingPaymentsCount > 0;

  const statCards = [
    {
      key: 'today_orders',
      title: 'Pesanan Periode Ini',
      value: stats?.stats?.today_orders ?? 0,
      icon: ShoppingBag,
      iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      badge: 'Bulan Ini',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      key: 'pending_orders',
      title: 'Perlu Konfirmasi',
      value: pendingOrdersCount,
      icon: Clock,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: pendingOrdersCount > 0 ? 'Perlu Tindakan' : 'Terkendali',
      badgeColor: pendingOrdersCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      key: 'pending_payments',
      title: 'Bukti Bayar Pending',
      value: pendingPaymentsCount,
      icon: CreditCard,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Verifikasi` : 'Semua Beres',
      badgeColor: pendingPaymentsCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      link: '/admin/pembayaran',
    },
    {
      key: 'month_revenue',
      title: 'Estimasi Omset',
      value: formatRupiah(stats?.stats?.month_revenue || 0),
      icon: DollarSign,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Lunas & Berjalan',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  const pipelineSteps = [
    { key: 'waiting_payment', label: 'Menunggu Bayar', count: stats?.status_counts?.waiting_payment || 0, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { key: 'pending', label: 'Pending', count: stats?.status_counts?.pending || 0, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { key: 'processed', label: 'Diproses Produksi', count: stats?.status_counts?.processed || 0, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { key: 'delivered', label: 'Siap Kirim / Ambil', count: stats?.status_counts?.delivered || 0, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { key: 'completed', label: 'Selesai', count: stats?.status_counts?.completed || 0, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Hero Greeting Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card to-card/70 border border-border p-6 sm:p-7 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray mb-1.5">
                <Calendar size={13} className="text-primary" />
                <span>{todayFormatted}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Server
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">
                {getGreeting()}, Admin Dreamcatcher!
              </h1>
              <p className="text-gray-light text-sm mt-1 max-w-xl">
                Pantau performa penjualan kaos, status antrean sablon, dan verifikasi bukti transfer secara langsung.
              </p>
            </div>

            {needsAttention ? (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-300">Perhatian Diperlukan</p>
                  <p className="text-amber-200/80">
                    {pendingOrdersCount > 0 && `${pendingOrdersCount} pesanan menunggu`}
                    {pendingOrdersCount > 0 && pendingPaymentsCount > 0 && ' · '}
                    {pendingPaymentsCount > 0 && `${pendingPaymentsCount} bukti bayar`}
                  </p>
                </div>
                <Link
                  to={pendingPaymentsCount > 0 ? '/admin/pembayaran' : '/admin/pesanan'}
                  className="ml-2 px-3 py-1.5 bg-amber-500 text-ink font-semibold rounded-lg hover:bg-amber-400 text-xs transition-colors flex-shrink-0 no-underline"
                >
                  Tinjau
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl flex-shrink-0">
                <CheckCircle2 size={16} />
                <span>Semua alur transaksi dalam status aman</span>
              </div>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="bg-card border border-rose-500/40 p-4 rounded-xl flex items-center justify-between gap-4">
            <p className="text-gray text-sm">
              Gagal memuat data dashboard. Silakan periksa koneksi Anda dan coba lagi.
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchDashboard();
              }}
              className="text-primary text-sm font-semibold hover:underline flex-shrink-0 focus:outline-none"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* 4 Modern KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((stat) => (
                <div
                  key={stat.key}
                  className="bg-card border border-border p-5 rounded-2xl transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 shadow-lg group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.iconColor} transition-transform group-hover:scale-105`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${stat.badgeColor}`}>
                      {stat.badge}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray text-xs font-medium">{stat.title}</p>
                    <p className="font-heading font-bold text-2xl text-white mt-1 tracking-wide truncate">
                      {stat.value}
                    </p>
                  </div>
                  {stat.link && (
                    <Link
                      to={stat.link}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
                    >
                      Buka Verifikasi <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              ))}
        </div>

        {/* Order Pipeline Strip */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <h2 className="font-heading text-lg font-semibold text-white tracking-[1px]">
                Pipeline Alur Pesanan
              </h2>
            </div>
            <Link
              to="/admin/pesanan"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              Semua Pesanan <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pipelineSteps.map((step) => (
              <Link
                key={step.key}
                to={`/admin/pesanan?status=${step.key}`}
                className="p-3.5 rounded-xl bg-ink/70 border border-border hover:border-primary/40 transition-all text-center block no-underline group"
              >
                <p className="font-heading text-2xl font-bold text-white group-hover:text-primary transition-colors">
                  {step.count}
                </p>
                <p className="text-[11px] text-gray mt-0.5 truncate">{step.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-Column: Recent Orders & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Orders List (7 cols) */}
          <div className="lg:col-span-7">
            {loading ? (
              <PanelSkeleton />
            ) : (
              <div className="bg-card border border-border p-6 rounded-2xl shadow-lg flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-primary" />
                    <h2 className="font-heading text-xl font-semibold text-white tracking-[1px]">
                      Pesanan Terbaru
                    </h2>
                  </div>
                  <Link
                    to="/admin/pesanan"
                    className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  {stats?.recent_orders?.length > 0 ? (
                    stats.recent_orders.map((order) => {
                      const items = order.items || [];
                      const firstItem = items[0];
                      const itemName = firstItem?.product?.name || firstItem?.product_name || firstItem?.service?.name || 'Item Pesanan';
                      const itemImg = firstItem?.product?.images?.[0]?.image_url
                        ? getImageUrl(firstItem.product.images[0].image_url)
                        : null;

                      return (
                        <Link
                          key={order.id}
                          to={`/admin/pesanan/${order.id}`}
                          className="flex items-center justify-between p-3.5 bg-ink/70 border border-border rounded-xl transition-all duration-200 hover:border-primary/40 hover:bg-ink no-underline group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {itemImg ? (
                              <img
                                src={itemImg}
                                alt={itemName}
                                className="w-11 h-11 rounded-lg object-contain bg-card border border-border flex-shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-card border border-border flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                {order.customer_name?.charAt(0)?.toUpperCase() || 'P'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-white group-hover:text-primary transition-colors">
                                  #{order.order_code}
                                </span>
                                <span className="text-[11px] text-gray truncate max-w-[140px]">
                                  {order.customer_name}
                                </span>
                              </div>
                              <p className="text-gray-light text-[12px] truncate mt-0.5">
                                {itemName} {items.length > 1 && `(+${items.length - 1} item)`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 pl-3">
                            <p className="font-semibold text-primary text-sm whitespace-nowrap">
                              {formatRupiah(order.total_price)}
                            </p>
                            <div className="mt-1 flex justify-end">
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-ink border border-border flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag size={20} className="text-gray-medium" />
                      </div>
                      <p className="text-white text-sm font-medium">Belum ada pesanan terbaru</p>
                      <p className="text-gray text-xs mt-1">Pesanan masuk akan otomatis muncul di sini</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Analytics & Quick Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 7-Day Chart Panel */}
            {loading ? (
              <PanelSkeleton />
            ) : (
              <div className="bg-card border border-border p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    <h2 className="font-heading text-xl font-semibold text-white tracking-[1px]">
                      Aktivitas 7 Hari
                    </h2>
                  </div>
                  <Link
                    to="/admin/laporan"
                    className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    Laporan <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {stats?.chart_data?.labels?.length > 0 ? (
                  <div className="space-y-3.5">
                    {stats.chart_data.labels.map((label, i) => {
                      const value = stats.chart_data.datasets[0].data[i] || 0;
                      const max = Math.max(...stats.chart_data.datasets[0].data, 1);
                      const percentage = (value / max) * 100;

                      return (
                        <div key={label} className="flex items-center gap-3 text-xs">
                          <span className="text-gray w-14 flex-shrink-0 font-medium">{label}</span>
                          <div className="flex-1 bg-ink rounded-full h-5 overflow-hidden border border-border/50 p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-end pr-2 transition-all duration-700 ease-out"
                              style={{ width: `${Math.max(percentage, value > 0 ? 12 : 0)}%` }}
                            >
                              {value > 0 && (
                                <span className="text-white text-[10px] font-bold">{value}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-gray w-8 text-right font-mono font-medium">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 size={24} className="text-gray mx-auto mb-2 opacity-40" />
                    <p className="text-white text-xs font-medium">Belum ada statistik 7 hari</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Shortcuts */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-lg">
              <h3 className="font-heading text-base font-semibold text-white tracking-[1px] mb-3">
                Aksi Cepat Admin
              </h3>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <Link
                  to="/admin/produk"
                  className="p-3 rounded-xl bg-ink/70 border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all flex items-center gap-2 no-underline"
                >
                  <PlusCircle size={15} className="text-primary flex-shrink-0" />
                  <span className="font-medium truncate">Tambah Produk</span>
                </Link>
                <Link
                  to="/admin/pembayaran"
                  className="p-3 rounded-xl bg-ink/70 border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all flex items-center gap-2 no-underline"
                >
                  <CreditCard size={15} className="text-amber-400 flex-shrink-0" />
                  <span className="font-medium truncate">Cek Bukti Bayar</span>
                </Link>
                <Link
                  to="/admin/layanan"
                  className="p-3 rounded-xl bg-ink/70 border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all flex items-center gap-2 no-underline"
                >
                  <Package size={15} className="text-sky-400 flex-shrink-0" />
                  <span className="font-medium truncate">Layanan Sablon</span>
                </Link>
                <Link
                  to="/admin/laporan"
                  className="p-3 rounded-xl bg-ink/70 border border-border hover:border-primary/40 text-gray-light hover:text-white transition-all flex items-center gap-2 no-underline"
                >
                  <BarChart3 size={15} className="text-emerald-400 flex-shrink-0" />
                  <span className="font-medium truncate">Cek Laporan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}