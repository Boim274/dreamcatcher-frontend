import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  History,
  X,
  RotateCcw,
  Package,
  Calendar,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import OptimizedImage from '../../components/ui/OptimizedImage';

const paymentStatusBadge = {
  pending: 'waiting_payment',
  waiting_verification: 'waiting_payment',
  dp: 'paid',
  paid: 'completed',
  rejected: 'cancelled',
};

const HISTORY_STATUSES = ['completed', 'cancelled'];

const emptyFilters = { status: '', payment_status: '', search: '', date_from: '', date_to: '' };

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Skeleton Cards on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
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
          </div>
        ))}
      </div>

      {/* Skeleton Table on Desktop */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden animate-pulse">
        <div className="h-11 bg-ink" />
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="h-4 w-20 bg-ink rounded shrink-0" />
              <div className="h-4 w-28 bg-ink rounded shrink-0" />
              <div className="h-4 w-32 bg-ink rounded" />
              <div className="h-4 w-16 bg-ink rounded ml-auto" />
              <div className="h-5 w-20 bg-ink rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

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
        params.status = HISTORY_STATUSES;
      }
      if (f.payment_status) params.payment_status = f.payment_status;
      if (f.search) params.search = f.search;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      params.page = page;

      const result = await adminService.getOrders(params, signal);
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch order history:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitSearch = () => fetchOrders(undefined, 1);

  const clearSearch = () => {
    const next = { ...filters, search: '' };
    setFilters(next);
    fetchOrders(undefined, 1, next);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    fetchOrders(undefined, 1, emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <ErrorBoundary>
      <div>
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="font-heading text-[28px] text-white tracking-[1px]">Histori Pesanan</h1>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm text-gray hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}
        </div>

        {error && !loading && (
          <div className="bg-card border border-fire/40 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <p className="text-gray text-sm">Gagal memuat histori pesanan. Periksa koneksi Anda dan coba lagi.</p>
            <button
              onClick={() => fetchOrders()}
              className="text-primary text-sm font-medium hover:underline flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="input-icon-wrapper relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitSearch();
                  }}
                  placeholder="Cari kode/nama/HP..."
                  className="input-dark pl-11 pr-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                {filters.search && (
                  <button
                    onClick={clearSearch}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Semua Histori</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>

            <select
              value={filters.payment_status}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
              className="input-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Semua Pembayaran</option>
              <option value="dp">DP</option>
              <option value="paid">Lunas</option>
              <option value="rejected">Ditolak</option>
            </select>

            <label className="sr-only" htmlFor="history-date-from">Dari tanggal</label>
            <input
              id="history-date-from"
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="input-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />

            <label className="sr-only" htmlFor="history-date-to">Sampai tanggal</label>
            <input
              id="history-date-to"
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="input-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          {filters.date_from && filters.date_to && filters.date_from > filters.date_to && (
            <p className="text-fire text-[12px] mt-2">Tanggal "dari" tidak boleh setelah tanggal "sampai".</p>
          )}
        </div>

        {loading ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-20 text-center">
            <History size={32} className="text-gray-medium mx-auto mb-3" />
            <p className="text-gray">Belum ada histori pesanan</p>
            <p className="text-gray-medium text-sm mt-1">
              {hasActiveFilters ? 'Coba ubah atau reset filter pencarian Anda' : 'Pesanan selesai atau dibatalkan akan muncul di sini'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 text-primary text-sm font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Card View (< lg screens) */}
            <div className="lg:hidden space-y-3">
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const thumb = firstItem?.design?.thumbnail_url || firstItem?.design?.image_url
                  || firstItem?.product?.images?.[0]?.thumbnail_url || firstItem?.product?.images?.[0]?.image_url
                  || null;
                const names = order.items?.map((i) => i.product?.name || i.service?.name || i.product_name).filter(Boolean).join(', ') || 'Pesanan Sablon';
                const totalQty = order.items?.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0) || 1;
                const cleanPhone = (order.phone || '').replace(/\D/g, '');
                const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

                return (
                  <div
                    key={order.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all space-y-3.5"
                  >
                    {/* Top Row: Code, Copy, Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-sm font-bold text-primary truncate">
                          {order.order_code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(order.order_code, e)}
                          className="p-1 rounded text-gray hover:text-white hover:bg-ink transition-colors shrink-0"
                          title="Salin Kode Pesanan"
                          aria-label="Salin Kode"
                        >
                          {copiedCode === order.order_code ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    {/* Customer & Phone / WA */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-[15px] truncate">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gray truncate">{order.phone || '-'}</p>
                      </div>
                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors shrink-0"
                        >
                          <MessageCircle size={13} />
                          <span>WA</span>
                        </a>
                      )}
                    </div>

                    {/* Product & Total */}
                    <div className="bg-ink/60 border border-border/50 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {thumb ? (
                          <OptimizedImage
                            src={thumb}
                            variant="thumbnail"
                            alt="Item thumbnail"
                            containerClassName="w-10 h-10 rounded-lg bg-ink border border-border flex-shrink-0"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-ink border border-border flex items-center justify-center text-gray flex-shrink-0">
                            <Package size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-light truncate">{names}</p>
                          <p className="text-[11px] text-gray mt-0.5">{totalQty} pcs</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-gray">Total Bayar</p>
                        <p className="text-sm font-bold text-white font-mono">{formatRupiah(order.total_price)}</p>
                      </div>
                    </div>

                    {/* Payment Status & Date */}
                    <div className="flex items-center justify-between text-xs text-gray pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <span>Bayar:</span>
                        {order.payment_status ? (
                          <StatusBadge status={paymentStatusBadge[order.payment_status] || 'pending'} />
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-medium" />
                        <span>{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/admin/pesanan/${order.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary/10 border border-primary/25 text-primary hover:bg-primary hover:text-white font-medium text-sm transition-all"
                    >
                      <Eye size={15} />
                      <span>Lihat Rincian Pesanan</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= lg screens) */}
            <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-ink/80 border-b border-border">
                    <tr>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Kode</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Customer</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Produk / Layanan</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Total</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Status</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Pembayaran</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Tanggal</th>
                      <th className="px-3.5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray sticky right-0 bg-ink/90 backdrop-blur-sm z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                      const firstItem = order.items?.[0];
                      const thumb = firstItem?.design?.thumbnail_url || firstItem?.design?.image_url
                        || firstItem?.product?.images?.[0]?.thumbnail_url || firstItem?.product?.images?.[0]?.image_url
                        || null;
                      const names = order.items?.map((i) => i.product?.name || i.service?.name || i.product_name).filter(Boolean).join(', ') || '-';
                      return (
                        <tr key={order.id} className="transition-colors hover:bg-ink/60 group">
                          <td className="px-3.5 py-3 font-mono font-semibold text-primary whitespace-nowrap text-sm">
                            {order.order_code}
                          </td>
                          <td className="px-3.5 py-3">
                            <p className="font-medium text-white text-sm">{order.customer_name}</p>
                            <p className="text-gray text-xs">{order.phone || '-'}</p>
                          </td>
                          <td className="px-3.5 py-3 text-sm text-gray-light max-w-[200px]">
                            <div className="flex items-center gap-2">
                              {thumb ? (
                                <OptimizedImage
                                  src={thumb}
                                  variant="thumbnail"
                                  alt="Item thumbnail"
                                  containerClassName="w-8 h-8 rounded-lg bg-ink border border-border flex-shrink-0"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-ink border border-border flex items-center justify-center text-gray flex-shrink-0">
                                  <Package size={14} />
                                </div>
                              )}
                              <span className="truncate">{names}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 font-bold text-white whitespace-nowrap text-sm">
                            {formatRupiah(order.total_price)}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {order.payment_status ? (
                              <StatusBadge status={paymentStatusBadge[order.payment_status] || 'pending'} />
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-xs text-gray whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap sticky right-0 bg-card group-hover:bg-ink/90 transition-colors z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.25)]">
                            <Link
                              to={`/admin/pesanan/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Eye size={13} />
                              Detail
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination for both views */}
            {pagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-card border border-border rounded-xl">
                <p className="text-gray text-xs sm:text-sm text-center sm:text-left">
                  Menampilkan <span className="font-semibold text-white">{orders.length}</span> dari{' '}
                  <span className="font-semibold text-white">{pagination.total}</span> pesanan
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="p-2 rounded-lg bg-ink hover:bg-border disabled:opacity-40 text-gray-light disabled:text-gray-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1.5 bg-ink border border-border rounded-lg text-white font-mono text-xs sm:text-sm font-semibold">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="p-2 rounded-lg bg-ink hover:bg-border disabled:opacity-40 text-gray-light disabled:text-gray-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
