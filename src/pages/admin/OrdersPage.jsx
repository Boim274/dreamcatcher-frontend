import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
  RotateCcw,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Filter,
  Package,
  Receipt,
  Printer,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import OptimizedImage from '../../components/ui/OptimizedImage';
import OrderReceipt from '../../components/common/OrderReceipt';

const paymentStatusBadge = {
  pending: 'waiting_payment',
  waiting_verification: 'waiting_verification',
  dp: 'dp',
  paid: 'paid',
  rejected: 'rejected',
};

const ACTIVE_STATUSES = [
  'pending',
  'waiting_payment',
  'waiting_verification',
  'ready_to_process',
  'processing',
  'ready_for_pickup',
  'cancel_requested',
];

const STATUS_TABS = [
  { value: '', label: 'Semua Aktif' },
  { value: 'waiting_payment', label: 'Menunggu Bayar' },
  { value: 'waiting_verification', label: 'Menunggu Verifikasi' },
  { value: 'ready_to_process', label: 'Siap Diproses' },
  { value: 'processing', label: 'Sedang Diproses' },
  { value: 'ready_for_pickup', label: 'Siap Ambil / Kirim' },
  { value: 'cancel_requested', label: 'Permintaan Batal' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function TableSkeleton({ viewMode = 'auto' }) {
  return (
    <div className="space-y-4">
      {/* Skeleton Cards (visible on mobile or card mode) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 ${viewMode === 'table' ? 'hidden' : viewMode === 'card' ? 'grid' : 'grid lg:hidden'}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-ink rounded" />
              <div className="h-3.5 w-20 bg-ink rounded" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-ink shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-ink rounded" />
                <div className="h-3 w-24 bg-ink rounded" />
              </div>
            </div>
            <div className="h-10 bg-ink/70 rounded-xl" />
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <div className="h-4 w-20 bg-ink rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-16 bg-ink rounded-lg" />
                <div className="h-7 w-20 bg-ink rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Table (visible on desktop or table mode) */}
      <div className={`bg-card border border-border rounded-2xl overflow-hidden animate-pulse ${viewMode === 'card' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden lg:block'}`}>
        <div className="h-11 bg-ink/80" />
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="h-4 w-24 bg-ink rounded shrink-0" />
              <div className="h-4 w-32 bg-ink rounded shrink-0" />
              <div className="h-4 w-36 bg-ink rounded hidden md:block" />
              <div className="h-4 w-20 bg-ink rounded ml-auto" />
              <div className="h-6 w-24 bg-ink rounded-full shrink-0" />
              <div className="h-6 w-24 bg-ink rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // viewMode: 'auto' (Card on mobile/tablet, Table on desktop), 'card', or 'table'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('admin_orders_view_mode') || 'auto';
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('admin_orders_view_mode', mode);
  };

  const [filters, setFilters] = useState({
    status: initialStatus,
    payment_status: '',
    search: '',
    date_from: '',
    date_to: '',
  });

  // Keep filters in sync if query param changes
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam !== null && statusParam !== filters.status) {
      setFilters((prev) => ({ ...prev, status: statusParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.payment_status, filters.date_from, filters.date_to]);

  const fetchOrders = async (signal, page = 1, overrideFilters) => {
    setLoading(true);
    try {
      setError(false);
      const f = overrideFilters || filters;
      const params = {};
      if (f.status) {
        params.status = f.status;
      } else {
        params.status = ACTIVE_STATUSES;
      }
      if (f.payment_status) params.payment_status = f.payment_status;
      if (f.search) params.search = f.search;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      params.page = page;

      const result = await adminService.getOrders(params, signal);
      setOrders(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch orders:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (statusValue) => {
    const next = { ...filters, status: statusValue };
    setFilters(next);
    if (statusValue) {
      setSearchParams({ status: statusValue });
    } else {
      setSearchParams({});
    }
    fetchOrders(undefined, 1, next);
  };

  const submitSearch = () => fetchOrders(undefined, 1);

  const clearSearch = () => {
    const next = { ...filters, search: '' };
    setFilters(next);
    fetchOrders(undefined, 1, next);
  };

  const resetFilters = () => {
    const cleared = { status: '', payment_status: '', search: '', date_from: '', date_to: '' };
    setFilters(cleared);
    setSearchParams({});
    fetchOrders(undefined, 1, cleared);
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const hasActiveFilters = Boolean(
    filters.status || filters.payment_status || filters.search || filters.date_from || filters.date_to
  );

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">
              Kelola Pesanan
            </h1>
            <p className="text-gray text-xs sm:text-sm mt-0.5">
              Pantau seluruh pesanan aktif, verifikasi pembayaran, dan perbarui proses sablon / konveksi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* View Switcher: Auto / Kartu / Tabel */}
            <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => handleSetViewMode('auto')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'auto'
                    ? 'bg-primary text-white shadow-sm shadow-primary/30 font-semibold'
                    : 'text-gray hover:text-white hover:bg-white/5'
                }`}
                title="Tampilan Otomatis (Kartu di HP/Tablet, Tabel di Desktop)"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('card')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-primary text-white shadow-sm shadow-primary/30 font-semibold'
                    : 'text-gray hover:text-white hover:bg-white/5'
                }`}
                title="Tampilan Kartu (Sangat Nyaman di Layar Sentuh & HP)"
              >
                <LayoutGrid size={13} />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-primary text-white shadow-sm shadow-primary/30 font-semibold'
                    : 'text-gray hover:text-white hover:bg-white/5'
                }`}
                title="Tampilan Tabel (Lebar Penuh)"
              >
                <LayoutList size={13} />
                <span>Tabel</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray hover:text-white bg-card border border-border hover:border-primary/40 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Tabs Strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((tab) => {
            const isActive = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-card border-border text-gray hover:text-white hover:border-primary/40'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 lg:col-span-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitSearch();
                  }}
                  placeholder="Cari kode pesanan, produk, layanan, atau customer..."
                  className="input-dark pl-11 pr-9 text-xs sm:text-sm"
                />
                {filters.search && (
                  <button
                    onClick={clearSearch}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Payment Status Filter */}
            <div className="lg:col-span-3">
              <select
                value={filters.payment_status}
                onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                className="input-dark text-xs sm:text-sm"
              >
                <option value="">Semua Pembayaran</option>
                <option value="pending">Belum Dibayar</option>
                <option value="waiting_verification">Menunggu Verifikasi</option>
                <option value="dp">DP Terbayar</option>
                <option value="paid">Lunas</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            {/* Date From */}
            <div className="lg:col-span-2">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-dark text-xs"
                title="Dari tanggal"
              />
            </div>

            {/* Date To */}
            <div className="lg:col-span-2">
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-dark text-xs"
                title="Sampai tanggal"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <div className="bg-card border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-gray text-xs sm:text-sm">
              Gagal memuat daftar pesanan. Periksa koneksi atau database lalu coba lagi.
            </p>
            <button
              onClick={() => fetchOrders()}
              className="text-primary text-xs font-semibold hover:underline flex-shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Content Section: Cards for Mobile/Tablet & Table for Desktop */}
        {loading ? (
          <TableSkeleton viewMode={viewMode} />
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-16 text-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-ink border border-border flex items-center justify-center mx-auto mb-3 text-gray">
              <ShoppingBag size={24} />
            </div>
            <h3 className="font-heading text-xl text-white tracking-[1px] mb-1">
              Tidak Ada Pesanan Ditemukan
            </h3>
            <p className="text-gray text-xs sm:text-sm max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Tidak ada data pesanan yang cocok dengan kriteria filter saat ini.'
                : 'Belum ada pesanan dalam status ini.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-ink border border-border hover:border-primary/40 rounded-xl text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. MOBILE & TABLET CARD VIEW (Visible by default on < lg, or when card mode selected) */}
            <div className={viewMode === 'card' ? 'block' : viewMode === 'table' ? 'hidden' : 'block lg:hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {orders.map((order) => {
                  const items = order.items || [];
                  const firstItem = items[0];
                  const firstTitle = firstItem?.product?.name || firstItem?.service?.name || firstItem?.product_name || 'Item';
                  const itemThumb = firstItem?.design?.thumbnail_url || firstItem?.design?.image_url
                    || firstItem?.product?.images?.[0]?.thumbnail_url || firstItem?.product?.images?.[0]?.image_url
                    || null;

                  const cleanPhone = order.phone?.replace(/[^0-9]/g, '');
                  const waLink = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                        `Halo kak ${order.customer_name}, kami dari Dreamcatcher ingin mengonfirmasi pesanan #${order.order_code}.`
                      )}`
                    : null;

                  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={order.id}
                      className="bg-card border border-border rounded-2xl p-4 shadow-md hover:border-primary/40 transition-all flex flex-col justify-between gap-3 group"
                    >
                      {/* Top: Order Code & Date */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/80">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary text-xs tracking-wider">
                            #{order.order_code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(order.order_code, e)}
                            className="text-gray hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                            title="Salin Kode Pesanan"
                          >
                            {copiedCode === order.order_code ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-gray text-[11px]">
                          <Calendar size={12} className="opacity-60" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Customer Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {order.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white text-xs sm:text-sm truncate">
                              {order.customer_name}
                            </p>
                            <p className="text-[11px] text-gray truncate">
                              {order.phone || '-'}
                            </p>
                          </div>
                        </div>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-medium shrink-0 transition-colors no-underline"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle size={12} />
                            <span>Chat WA</span>
                          </a>
                        )}
                      </div>

                      {/* Product & Service Box */}
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-ink/60 border border-border/60">
                        {itemThumb ? (
                          <OptimizedImage
                            src={itemThumb}
                            variant="thumbnail"
                            alt={firstTitle}
                            containerClassName="w-9 h-9 rounded-lg bg-ink border border-border shrink-0"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-ink border border-border flex items-center justify-center text-gray shrink-0">
                            <Package size={15} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white text-xs truncate">
                            {firstTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {items.length > 1 && (
                              <span className="text-[10px] text-primary font-medium">
                                +{items.length - 1} item lain
                              </span>
                            )}
                            {firstItem?.quantity && (
                              <span className="text-[10px] text-gray">
                                ({firstItem.quantity} pcs)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges & Price */}
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={order.status} />
                          {order.payment_status ? (
                            <StatusBadge
                              status={paymentStatusBadge[order.payment_status] || 'pending'}
                            />
                          ) : (
                            <span className="text-gray text-[11px]">-</span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs text-gray">Total Tagihan:</span>
                          <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                            {formatRupiah(order.total_price)}
                          </span>
                        </div>
                      </div>

                      {/* Touch-Friendly Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/80">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
                          title="Lihat & Cetak Struk"
                        >
                          <Receipt size={14} className="text-primary" />
                          <span>Struk</span>
                        </button>
                        <Link
                          to={`/admin/pesanan/${order.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all text-xs font-semibold no-underline shadow-lg shadow-primary/25"
                        >
                          <Eye size={14} />
                          <span>Detail & Kelola</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. DESKTOP UNCLIPPED TABLE VIEW (Visible on >= lg, or when table mode selected) */}
            <div className={viewMode === 'table' ? 'block' : viewMode === 'card' ? 'hidden' : 'hidden lg:block'}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-ink/90 border-b border-border text-[11px] font-semibold text-gray uppercase tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Kode Pesanan</th>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Pelanggan</th>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Produk / Layanan</th>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Total Harga</th>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Status Pesanan</th>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Pembayaran</th>
                        <th className="px-3.5 py-3.5 whitespace-nowrap">Tanggal</th>
                        <th className="px-3.5 py-3.5 text-right whitespace-nowrap sticky right-0 bg-ink/95 backdrop-blur z-10 shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.35)]">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs sm:text-sm">
                      {orders.map((order) => {
                        const items = order.items || [];
                        const firstItem = items[0];
                        const firstTitle = firstItem?.product?.name || firstItem?.service?.name || firstItem?.product_name || 'Item';
                        const itemThumb = firstItem?.design?.thumbnail_url || firstItem?.design?.image_url
                          || firstItem?.product?.images?.[0]?.thumbnail_url || firstItem?.product?.images?.[0]?.image_url
                          || null;

                        const cleanPhone = order.phone?.replace(/[^0-9]/g, '');
                        const waLink = cleanPhone
                          ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                              `Halo kak ${order.customer_name}, kami dari Dreamcatcher ingin mengonfirmasi pesanan #${order.order_code}.`
                            )}`
                          : null;

                        return (
                          <tr
                            key={order.id}
                            className="transition-colors hover:bg-ink/60 group"
                          >
                            {/* Kode Pesanan */}
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-primary text-xs tracking-wider">
                                  #{order.order_code}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyCode(order.order_code, e)}
                                  className="text-gray hover:text-white transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
                                  title="Salin Kode"
                                >
                                  {copiedCode === order.order_code ? (
                                    <Check size={11} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Customer Info */}
                            <td className="px-3.5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[11px] text-primary shrink-0">
                                  {order.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-white truncate max-w-[130px] text-xs">
                                    {order.customer_name}
                                  </p>
                                  <div className="flex items-center gap-1 text-gray text-[10px]">
                                    <span className="truncate max-w-[95px]">{order.phone}</span>
                                    {waLink && (
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 shrink-0"
                                        title="Chat via WhatsApp"
                                      >
                                        <MessageCircle size={11} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Produk / Layanan */}
                            <td className="px-3.5 py-3">
                              <div className="flex items-center gap-2 min-w-0 max-w-[170px]">
                                {itemThumb ? (
                                  <OptimizedImage
                                    src={itemThumb}
                                    variant="thumbnail"
                                    alt={firstTitle}
                                    containerClassName="w-7 h-7 rounded-lg bg-ink border border-border shrink-0"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-ink border border-border flex items-center justify-center text-gray shrink-0">
                                    <Package size={13} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-white text-xs truncate">
                                    {firstTitle}
                                  </p>
                                  {items.length > 1 && (
                                    <p className="text-[10px] text-primary truncate">
                                      +{items.length - 1} item lainnya
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Total Harga */}
                            <td className="px-3.5 py-3 font-bold text-white whitespace-nowrap text-xs">
                              {formatRupiah(order.total_price)}
                            </td>

                            {/* Status Pesanan */}
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <StatusBadge status={order.status} />
                            </td>

                            {/* Status Pembayaran */}
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              {order.payment_status ? (
                                <StatusBadge
                                  status={paymentStatusBadge[order.payment_status] || 'pending'}
                                />
                              ) : (
                                <span className="text-gray text-xs">-</span>
                              )}
                            </td>

                            {/* Tanggal */}
                            <td className="px-3.5 py-3 text-gray text-xs whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Aksi (Sticky Right - Never Cut Off!) */}
                            <td className="px-3.5 py-3 text-right whitespace-nowrap sticky right-0 bg-card group-hover:bg-[#1a1222] transition-colors z-10 shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.35)]">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptOrder(order)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer"
                                  title="Lihat & Cetak Struk Belanja"
                                >
                                  <Receipt size={13} className="text-primary" />
                                  <span>Struk</span>
                                </button>
                                <Link
                                  to={`/admin/pesanan/${order.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-primary hover:bg-primary hover:text-white transition-all text-xs font-semibold no-underline"
                                >
                                  <Eye size={13} />
                                  <span>Detail</span>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Unified Pagination Controls (Applies to both Card and Table views) */}
            {pagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-lg text-xs text-gray">
                <p className="text-center sm:text-left">
                  Menampilkan <span className="text-white font-medium">{orders.length}</span> dari{' '}
                  <span className="text-white font-medium">{pagination.total}</span> pesanan
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="p-2 rounded-lg bg-ink border border-border hover:border-primary/40 text-gray hover:text-white disabled:opacity-40 disabled:hover:border-border transition-colors cursor-pointer"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1.5 rounded-lg bg-ink border border-border text-white font-medium font-mono">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="p-2 rounded-lg bg-ink border border-border hover:border-primary/40 text-gray hover:text-white disabled:opacity-40 disabled:hover:border-border transition-colors cursor-pointer"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Struk Belanja Langsung dari Daftar Pesanan */}
        {selectedReceiptOrder && (
          <OrderReceipt
            mode="modal"
            order={selectedReceiptOrder}
            showActions={true}
            onClose={() => setSelectedReceiptOrder(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}