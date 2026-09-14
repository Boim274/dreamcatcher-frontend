import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Eye, ChevronLeft, ChevronRight, History, X, RotateCcw } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const HISTORY_PAYMENT_STATUSES = ['dp', 'paid', 'verified', 'rejected'];

const paymentStatusColor = (status) => {
  switch (status) {
    case 'paid': return { badge: 'completed', label: 'Lunas' };
    case 'dp': return { badge: 'paid', label: 'DP' };
    case 'verified': return { badge: 'completed', label: 'Terverifikasi' };
    case 'rejected': return { badge: 'cancelled', label: 'Ditolak' };
    default: return { badge: 'pending', label: status };
  }
};

const paymentTypeLabel = {
  full: 'Lunas',
  dp: 'DP',
  pelunasan: 'Pelunasan',
};

const emptyFilters = { status: '', search: '', date_from: '', date_to: '' };

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

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    const controller = new AbortController();
    fetchPayments(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.date_from, filters.date_to]);

  const fetchPayments = async (signal, page = 1, overrideFilters) => {
    setLoading(true);
    try {
      setError(false);
      const f = overrideFilters || filters;
      const params = {};
      if (f.status) {
        params.status = f.status;
      } else {
        params.status = HISTORY_PAYMENT_STATUSES;
      }
      if (f.search) params.search = f.search;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      params.page = page;

      const result = await adminService.getPayments(params, signal);
      setPayments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch payment history:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitSearch = () => fetchPayments(undefined, 1);

  const clearSearch = () => {
    const next = { ...filters, search: '' };
    setFilters(next);
    fetchPayments(undefined, 1, next);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    fetchPayments(undefined, 1, emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <ErrorBoundary>
      <div>
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="font-heading text-[28px] text-white tracking-[1px]">Histori Pembayaran</h1>
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
            <p className="text-gray text-sm">Gagal memuat histori pembayaran. Periksa koneksi Anda dan coba lagi.</p>
            <button
              onClick={() => fetchPayments()}
              className="text-primary text-sm font-medium hover:underline flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  placeholder="Cari kode/nama..."
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
              <option value="dp">DP</option>
              <option value="paid">Lunas</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>

            <label className="sr-only" htmlFor="payment-history-date-from">Dari tanggal</label>
            <input
              id="payment-history-date-from"
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="input-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />

            <label className="sr-only" htmlFor="payment-history-date-to">Sampai tanggal</label>
            <input
              id="payment-history-date-to"
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
        ) : payments.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-20 text-center">
            <History size={32} className="text-gray-medium mx-auto mb-3" />
            <p className="text-gray">Belum ada histori pembayaran</p>
            <p className="text-gray-medium text-sm mt-1">
              {hasActiveFilters ? 'Coba ubah atau reset filter pencarian Anda' : 'Pembayaran yang sudah diproses akan muncul di sini'}
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Bukti</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Kode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Jumlah</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Tipe</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Metode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => {
                    const statusInfo = paymentStatusColor(payment.payment_status);
                    return (
                      <tr key={payment.id} className="transition-colors hover:bg-ink">
                        <td className="px-4 py-3">
                          {payment.payment_proof ? (
                            <a
                              href={getImageUrl(payment.payment_proof)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-12 h-12 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                            >
                              <img
                                src={getImageUrl(payment.payment_proof)}
                                alt="Bukti"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-ink border border-border flex items-center justify-center text-gray text-xs">
                              -
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-primary">
                          {payment.order?.order_code || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{payment.order?.customer_name || '-'}</p>
                          <p className="text-gray text-sm">{payment.order?.phone || ''}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{formatRupiah(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-light">
                          {paymentTypeLabel[payment.payment_type] || payment.payment_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-light uppercase">
                          {payment.payment_method?.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={statusInfo.badge} />
                          <span className="text-xs text-gray ml-1">{statusInfo.label}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray">
                          {new Date(payment.created_at).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-gray text-sm">
                  Menampilkan {payments.length} dari {pagination.total} pembayaran
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPayments(undefined, pagination.current_page - 1)}
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
                    onClick={() => fetchPayments(undefined, pagination.current_page + 1)}
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
