import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Eye, ChevronLeft, ChevronRight, History, X, RotateCcw, Package } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

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
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-11 bg-ink" />
      <div className="divide-y divide-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-4 py-4 flex items-center gap-6">
            <div className="h-4 w-20 bg-ink rounded" />
            <div className="h-4 w-28 bg-ink rounded" />
            <div className="h-4 w-32 bg-ink rounded hidden md:block" />
            <div className="h-4 w-16 bg-ink rounded ml-auto" />
            <div className="h-5 w-20 bg-ink rounded-full" />
          </div>
        ))}
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
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ink">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Kode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Produk / Layanan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Pembayaran</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Tanggal</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-ink">
                      <td className="px-4 py-3 font-mono font-semibold text-primary">{order.order_code}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{order.customer_name}</p>
                        <p className="text-gray text-sm">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-light">
                        {(() => {
                          const firstItem = order.items?.[0];
                          const thumb = firstItem?.design?.image_url
                            ? getImageUrl(firstItem.design.image_url)
                            : firstItem?.product?.images?.[0]?.image_url
                            ? getImageUrl(firstItem.product.images[0].image_url)
                            : null;
                          const names = order.items?.map((i) => i.product?.name || i.service?.name || i.product_name).filter(Boolean).join(', ') || '-';
                          return (
                            <div className="flex items-center gap-2.5 max-w-[240px]">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-contain bg-ink border border-border flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-ink border border-border flex items-center justify-center text-gray flex-shrink-0">
                                  <Package size={14} />
                                </div>
                              )}
                              <span className="truncate">{names}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{formatRupiah(order.total_price)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        {order.payment_status ? (
                          <StatusBadge status={paymentStatusBadge[order.payment_status] || 'pending'} />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/pesanan/${order.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-gray text-sm">
                  Menampilkan {orders.length} dari {pagination.total} pesanan
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 bg-ink border border-border rounded-lg text-gray-light text-sm">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    onClick={() => fetchOrders(undefined, pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
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
