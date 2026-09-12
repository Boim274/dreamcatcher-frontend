import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { CheckCircle, XCircle, AlertCircle, CreditCard, ChevronLeft, ChevronRight, Search, Percent, RotateCcw, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const paymentTypeLabel = {
  full: 'Lunas',
  dp: 'DP',
  pelunasan: 'Pelunasan',
};

const ACTIVE_PAYMENT_STATUSES = ['pending', 'waiting_verification'];

const emptyFilters = { search: '', status: '', date_from: '', date_to: '' };

function ListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="w-32 h-32 bg-ink rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 bg-ink rounded" />
            <div className="h-4 w-28 bg-ink rounded" />
            <div className="h-6 w-32 bg-ink rounded" />
            <div className="h-4 w-48 bg-ink rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ show: false, id: null, type: '', label: '' });
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    const controller = new AbortController();
    fetchPayments(controller.signal, 1);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key !== 'search') fetchPayments(null, 1, next);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') fetchPayments(null, 1, filters);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    fetchPayments(null, 1, emptyFilters);
  };

  const fetchPayments = async (signal, page = 1, overrideFilters) => {
    if (!loading) setRefreshing(true);
    try {
      setError(false);
      const f = overrideFilters || filters;
      const params = { page };
      if (f.search) params.search = f.search;
      if (f.status) {
        params.status = f.status;
      } else {
        params.status = ACTIVE_PAYMENT_STATUSES;
      }
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      const result = await adminService.getPayments(params, signal);
      setPayments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch payments:', err);
        setError(true);
        setPayments([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerify = (id, type, label) => {
    setConfirmAction({ show: true, id, type, label });
  };

  const handleConfirmAction = async () => {
    const { id, type } = confirmAction;
    setActionLoading(id);
    try {
      await adminService.verifyPayment(id, type);
      toast.success('Pembayaran berhasil diverifikasi');
      setConfirmAction({ show: false, id: null, type: '', label: '' });
      fetchPayments(null, pagination?.current_page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectPayment = async (id) => {
    if (!rejectNotes.trim()) {
      toast.warning('Masukkan alasan penolakan');
      return;
    }

    setActionLoading(id);
    try {
      await adminService.rejectPayment(id, rejectNotes);
      setShowRejectModal(null);
      setRejectNotes('');
      toast.success('Pembayaran ditolak');
      fetchPayments(null, pagination?.current_page || 1);
    } catch (error) {
      toast.error('Gagal menolak pembayaran');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return { badge: 'completed', label: 'Lunas' };
      case 'dp': return { badge: 'paid', label: 'DP' };
      case 'waiting_verification': return { badge: 'waiting_payment', label: 'Menunggu Verifikasi' };
      case 'verified': return { badge: 'completed', label: 'Terverifikasi' };
      case 'pending': return { badge: 'waiting_payment', label: 'Menunggu' };
      case 'rejected': return { badge: 'cancelled', label: 'Ditolak' };
      default: return { badge: 'pending', label: status };
    }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const pendingPayments = payments.filter((p) => p.payment_status === 'pending');

  const PAYMENT_TABS = [
    { value: '', label: 'Semua Menunggu' },
    { value: 'waiting_verification', label: 'Perlu Verifikasi' },
    { value: 'pending', label: 'Pending' },
    { value: 'dp', label: 'DP' },
    { value: 'paid', label: 'Lunas' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Kelola Pembayaran</h1>
            <p className="text-gray text-xs sm:text-sm mt-0.5">
              Verifikasi bukti transfer bank atau pembayaran DP dan pelunasan dari customer.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray hover:text-white bg-card border border-border hover:border-primary/40 rounded-xl transition-all self-start sm:self-auto"
            >
              <RotateCcw size={13} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Quick Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {PAYMENT_TABS.map((tab) => {
            const isActive = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleFilter('status', tab.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-card border border-border text-gray hover:text-white hover:border-primary/40'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-card border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-gray text-sm">Gagal memuat data pembayaran. Periksa koneksi Anda dan coba lagi.</p>
            <button
              onClick={() => fetchPayments(null, pagination?.current_page || 1)}
              className="text-primary text-sm font-semibold hover:underline flex-shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="sm:col-span-2 lg:col-span-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilter('search', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari kode pesanan / nama customer..."
                  className="input-dark pl-10 pr-9 text-xs sm:text-sm"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilter('search', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilter('date_from', e.target.value)}
                className="input-dark text-xs"
                title="Dari tanggal"
              />
            </div>

            <div className="lg:col-span-3">
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilter('date_to', e.target.value)}
                className="input-dark text-xs"
                title="Sampai tanggal"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : (
          <>
            {pendingPayments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 mb-8">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-warning" />
                  <p className="font-semibold text-white">
                    {pendingPayments.length} pembayaran menunggu verifikasi
                  </p>
                </div>
              </div>
            )}

            {payments.length === 0 ? (
              <div className="bg-card border border-border rounded-xl py-20 text-center">
                <CreditCard size={32} className="text-gray-medium mx-auto mb-3" />
                <p className="text-gray">Belum ada data pembayaran</p>
                {hasActiveFilters && (
                  <>
                    <p className="text-gray-medium text-sm mt-1">Coba ubah atau reset filter pencarian Anda</p>
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-primary text-sm font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      Reset Filter
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={`space-y-4 transition-opacity ${refreshing ? 'opacity-50 pointer-events-none' : ''}`}>
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex gap-4">
                        {payment.payment_proof && (
                          <button
                            onClick={() => window.open(getImageUrl(payment.payment_proof), '_blank', 'noopener,noreferrer')}
                            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                          >
                            <img
                              src={getImageUrl(payment.payment_proof)}
                              alt="Bukti pembayaran"
                              className="w-32 h-32 object-cover rounded-xl cursor-zoom-in transition-opacity hover:opacity-80"
                            />
                          </button>
                        )}
                        <div>
                          <p className="font-semibold text-lg text-white">
                            {payment.order?.customer_name || 'Customer'}
                          </p>
                          <p className="text-gray text-sm">Order: {payment.order?.order_code}</p>
                          <p className="font-bold text-xl text-primary mt-2">{formatRupiah(payment.amount)}</p>
                          <p className="text-gray text-sm">
                            {payment.payment_method.replace('_', ' ').toUpperCase()} —{' '}
                            {paymentTypeLabel[payment.payment_type] || payment.payment_type}
                          </p>
                          <p className="text-gray text-sm mt-1">{formatDate(payment.created_at)}</p>
                          {payment.order?.remaining_amount > 0 && (
                            <p className="text-warning text-sm mt-1">
                              Sisa tagihan: {formatRupiah(payment.order.remaining_amount)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <StatusBadge status={paymentStatusColor(payment.payment_status).badge} />
                        <span className="text-[11px] text-gray-medium -mt-1">
                          {paymentStatusColor(payment.payment_status).label}
                        </span>

                        {payment.payment_status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            {payment.payment_type === 'pelunasan' ? (
                              <button
                                onClick={() => handleVerify(payment.id, 'pelunasan', 'Verifikasi Pelunasan')}
                                disabled={actionLoading === payment.id}
                                className="btn-primary flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {actionLoading === payment.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" /> Verifikasi Pelunasan
                                  </>
                                )}
                              </button>
                            ) : payment.payment_type === 'dp' ? (
                              <button
                                onClick={() => handleVerify(payment.id, 'dp', 'Verifikasi DP')}
                                disabled={actionLoading === payment.id}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {actionLoading === payment.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <Percent className="w-4 h-4" /> Verifikasi DP
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerify(payment.id, 'full', 'Verifikasi (Lunas)')}
                                disabled={actionLoading === payment.id}
                                className="btn-primary flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {actionLoading === payment.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" /> Verifikasi (Lunas)
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setShowRejectModal(payment.id)}
                              disabled={actionLoading === payment.id}
                              className="btn-secondary flex items-center gap-2 text-danger border-danger hover:bg-danger hover:text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                            >
                              <XCircle className="w-4 h-4" /> Tolak
                            </button>
                          </div>
                        )}

                        {payment.payment_status === 'paid' && payment.verifier && (
                          <p className="text-gray text-sm mt-2">Verifikasi oleh: {payment.verifier.name}</p>
                        )}
                        {payment.payment_status === 'dp' && payment.verifier && (
                          <p className="text-gray text-sm mt-2">Verifikasi DP oleh: {payment.verifier.name}</p>
                        )}
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mt-4 p-3 bg-ink border border-border rounded-lg">
                        <p className="text-gray text-sm">Catatan:</p>
                        <p className="font-medium text-white">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pagination && payments.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-gray text-sm">
                  Menampilkan {payments.length} dari {pagination.total} pembayaran
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPayments(null, pagination.current_page - 1)}
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
                    onClick={() => fetchPayments(null, pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showRejectModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (actionLoading !== showRejectModal) {
                setShowRejectModal(null);
                setRejectNotes('');
              }
            }}
          >
            <div
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectNotes('');
                }}
                aria-label="Tutup"
                className="absolute top-4 right-4 text-gray hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-heading text-xl font-bold mb-4 text-white">Tolak Pembayaran</h3>
              <p className="text-gray mb-4">
                Berikan alasan penolakan yang jelas agar customer dapat memperbaiki pembayarannya.
              </p>
              <label className="sr-only" htmlFor="reject-notes">Alasan penolakan</label>
              <textarea
                id="reject-notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Contoh: Nomor rekening salah, nominal tidak sesuai"
                className="input-dark min-h-[100px] resize-none mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectNotes('');
                  }}
                  className="btn-secondary flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Batal
                </button>
                <button
                  onClick={() => rejectPayment(showRejectModal)}
                  disabled={actionLoading === showRejectModal}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {actionLoading === showRejectModal ? <LoadingSpinner size="sm" /> : 'Tolak Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmAction.show}
          onClose={() => setConfirmAction({ show: false, id: null, type: '', label: '' })}
          onConfirm={handleConfirmAction}
          title={confirmAction.label || 'Verifikasi Pembayaran'}
          message={`Apakah Anda yakin ingin ${confirmAction.label?.toLowerCase() || 'memverifikasi'} pembayaran ini?`}
          confirmLabel="Ya, Verifikasi"
          loading={actionLoading === confirmAction.id}
        />
      </div>
    </ErrorBoundary>
  );
}