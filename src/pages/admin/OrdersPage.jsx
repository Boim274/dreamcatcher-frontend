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

function TableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
      <div className="h-12 bg-ink/80" />
      <div className="divide-y divide-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-6">
            <div className="h-4 w-24 bg-ink rounded" />
            <div className="h-4 w-32 bg-ink rounded" />
            <div className="h-4 w-40 bg-ink rounded hidden md:block" />
            <div className="h-4 w-20 bg-ink rounded ml-auto" />
            <div className="h-6 w-24 bg-ink rounded-full" />
          </div>
        ))}
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

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray hover:text-white bg-card border border-border hover:border-primary/40 rounded-xl transition-all self-start sm:self-auto"
            >
              <RotateCcw size={13} />
              <span>Reset Semua Filter</span>
            </button>
          )}
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

        {/* Table Content */}
        {loading ? (
          <TableSkeleton />
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
                className="mt-4 px-4 py-2 bg-ink border border-border hover:border-primary/40 rounded-xl text-xs font-medium text-white transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-ink/80 border-b border-border text-[11px] font-semibold text-gray uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Kode Pesanan</th>
                    <th className="px-5 py-3.5">Pelanggan</th>
                    <th className="px-5 py-3.5">Produk / Layanan</th>
                    <th className="px-5 py-3.5">Total Harga</th>
                    <th className="px-5 py-3.5">Status Pesanan</th>
                    <th className="px-5 py-3.5">Pembayaran</th>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
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
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-primary text-xs tracking-wider">
                              #{order.order_code}
                            </span>
                            <button
                              onClick={(e) => handleCopyCode(order.order_code, e)}
                              className="text-gray hover:text-white transition-colors p-1"
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
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-ink border border-border flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">
                              {order.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate max-w-[150px]">
                                {order.customer_name}
                              </p>
                              <div className="flex items-center gap-1.5 text-gray text-[11px]">
                                <span>{order.phone}</span>
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300"
                                    title="Chat via WhatsApp"
                                  >
                                    <MessageCircle size={12} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Produk / Layanan */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
                            {itemThumb ? (
                              <OptimizedImage
                                src={itemThumb}
                                variant="thumbnail"
                                alt={firstTitle}
                                containerClassName="w-8 h-8 rounded-lg bg-ink border border-border flex-shrink-0"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-ink border border-border flex items-center justify-center text-gray flex-shrink-0">
                                <Package size={14} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-white text-xs truncate">
                                {firstTitle}
                              </p>
                              {items.length > 1 && (
                                <p className="text-[10px] text-gray truncate">
                                  +{items.length - 1} item lainnya
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total Harga */}
                        <td className="px-5 py-4 font-bold text-white whitespace-nowrap">
                          {formatRupiah(order.total_price)}
                        </td>

                        {/* Status Pesanan */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Status Pembayaran */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {order.payment_status ? (
                            <StatusBadge
                              status={paymentStatusBadge[order.payment_status] || 'pending'}
                            />
                          ) : (
                            <span className="text-gray text-xs">-</span>
                          )}
                        </td>

                        {/* Tanggal */}
                        <td className="px-5 py-4 text-gray text-xs whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Aksi */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptOrder(order)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer"
                              title="Lihat & Cetak Struk Belanja"
                            >
                              <Receipt size={13} className="text-primary" />
                              <span>Struk</span>
                            </button>
                            <Link
                              to={`/admin/pesanan/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-xs font-semibold no-underline"
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

            {/* Pagination Controls */}
            {pagination && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-ink/40 text-xs text-gray">
                <p>
                  Menampilkan <span className="text-white font-medium">{orders.length}</span> dari{' '}
                  <span className="text-white font-medium">{pagination.total}</span> pesanan
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="p-2 rounded-lg bg-card border border-border hover:border-primary/40 text-gray hover:text-white disabled:opacity-40 disabled:hover:border-border transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1.5 rounded-lg bg-card border border-border text-white font-medium font-mono">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="p-2 rounded-lg bg-card border border-border hover:border-primary/40 text-gray hover:text-white disabled:opacity-40 disabled:hover:border-border transition-colors"
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