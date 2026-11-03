import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Eye, ChevronLeft, ChevronRight, History, X, RotateCcw, Calendar, CreditCard, Copy, Check, MessageCircle, FileText } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import OptimizedImage from '../../components/ui/OptimizedImage';

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
    <div className="space-y-4">
      {/* Mobile Card Skeleton */}
      <div className="lg:hidden space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="h-4 w-28 bg-ink rounded" />
              <div className="h-5 w-20 bg-ink rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-ink rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-ink rounded" />
                <div className="h-3 w-24 bg-ink rounded" />
              </div>
            </div>
            <div className="h-10 bg-ink/70 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden animate-pulse">
        <div className="h-11 bg-ink" />
        <div className="divide-y divide-border">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-6">
              <div className="h-10 w-10 bg-ink rounded-lg shrink-0" />
              <div className="h-4 w-24 bg-ink rounded shrink-0" />
              <div className="h-4 w-32 bg-ink rounded" />
              <div className="h-4 w-24 bg-ink rounded ml-auto" />
              <div className="h-5 w-20 bg-ink rounded-full shrink-0" />
            </div>
          ))}
        </div>
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
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

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
          <div className="space-y-4">
            {/* Mobile Card View (< lg screens) */}
            <div className="lg:hidden space-y-3">
              {payments.map((payment) => {
                const statusInfo = paymentStatusColor(payment.payment_status);
                const orderCode = payment.order?.order_code || '-';
                const customerName = payment.order?.customer_name || '-';
                const phone = payment.order?.phone || '';
                const cleanPhone = phone.replace(/\D/g, '');
                const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
                const proofUrl = payment.payment_proof ? getImageUrl(payment.payment_proof) : null;

                return (
                  <div
                    key={payment.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all space-y-3.5"
                  >
                    {/* Top Row: Order Code, Copy, Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-sm font-bold text-primary truncate">
                          {orderCode}
                        </span>
                        {orderCode !== '-' && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(orderCode, e)}
                            className="p-1 rounded text-gray hover:text-white hover:bg-ink transition-colors shrink-0"
                            title="Salin Kode Pesanan"
                            aria-label="Salin Kode"
                          >
                            {copiedCode === orderCode ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={statusInfo.badge} />
                      </div>
                    </div>

                    {/* Customer & WA */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-[15px] truncate">{customerName}</p>
                        <p className="text-xs text-gray truncate">{phone || '-'}</p>
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

                    {/* Payment Amount & Proof Preview */}
                    <div className="bg-ink/60 border border-border/50 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-14 h-14 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors shrink-0 relative group"
                            title="Lihat Bukti Transfer"
                          >
                            <OptimizedImage
                              src={payment.payment_proof}
                              thumbnailSrc={payment.thumbnail_url}
                              variant="thumbnail"
                              alt="Bukti transfer"
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={14} className="text-white" />
                            </div>
                          </a>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-ink border border-border flex items-center justify-center text-gray text-xs shrink-0">
                            No Proof
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-gray-light">
                            {paymentTypeLabel[payment.payment_type] || payment.payment_type}
                          </span>
                          <p className="text-xs text-gray uppercase flex items-center gap-1">
                            <CreditCard size={12} className="text-primary shrink-0" />
                            <span className="truncate">{payment.payment_method?.replace('_', ' ') || '-'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-gray">Jumlah Bayar</p>
                        <p className="text-base font-bold text-white font-mono">{formatRupiah(payment.amount)}</p>
                      </div>
                    </div>

                    {/* Footer: Date & Proof Link */}
                    <div className="flex items-center justify-between text-xs text-gray pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-medium" />
                        <span>{new Date(payment.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      {proofUrl && (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <Eye size={12} />
                          <span>Buka Bukti</span>
                        </a>
                      )}
                    </div>
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
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Bukti</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Kode</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Customer</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Jumlah</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Tipe</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Metode</th>
                      <th className="px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-gray">Status</th>
                      <th className="px-3.5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray sticky right-0 bg-ink/90 backdrop-blur-sm z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => {
                      const statusInfo = paymentStatusColor(payment.payment_status);
                      return (
                        <tr key={payment.id} className="transition-colors hover:bg-ink/60 group">
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {payment.payment_proof ? (
                              <a
                                href={getImageUrl(payment.payment_proof)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-10 h-10 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                                title="Buka bukti penuh"
                              >
                                <OptimizedImage
                                  src={payment.payment_proof}
                                  thumbnailSrc={payment.thumbnail_url}
                                  variant="thumbnail"
                                  alt="Bukti transfer"
                                  containerClassName="w-full h-full"
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-ink border border-border flex items-center justify-center text-gray text-xs">
                                -
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-3 font-mono font-semibold text-primary whitespace-nowrap text-sm">
                            {payment.order?.order_code || '-'}
                          </td>
                          <td className="px-3.5 py-3">
                            <p className="font-medium text-white text-sm">{payment.order?.customer_name || '-'}</p>
                            <p className="text-gray text-xs">{payment.order?.phone || ''}</p>
                          </td>
                          <td className="px-3.5 py-3 font-bold text-white whitespace-nowrap text-sm font-mono">
                            {formatRupiah(payment.amount)}
                          </td>
                          <td className="px-3.5 py-3 text-sm text-gray-light whitespace-nowrap">
                            {paymentTypeLabel[payment.payment_type] || payment.payment_type}
                          </td>
                          <td className="px-3.5 py-3 text-sm text-gray-light uppercase whitespace-nowrap">
                            {payment.payment_method?.replace('_', ' ') || '-'}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={statusInfo.badge} />
                              <span className="text-xs text-gray">{statusInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right text-xs text-gray whitespace-nowrap sticky right-0 bg-card group-hover:bg-ink/90 transition-colors z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.25)]">
                            {new Date(payment.created_at).toLocaleDateString('id-ID')}
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
                  Menampilkan <span className="font-semibold text-white">{payments.length}</span> dari{' '}
                  <span className="font-semibold text-white">{pagination.total}</span> pembayaran
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchPayments(undefined, pagination.current_page - 1)}
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
                    onClick={() => fetchPayments(undefined, pagination.current_page + 1)}
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
