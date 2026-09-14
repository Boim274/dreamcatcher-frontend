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

  const [selectedProof, setSelectedProof] = useState(null);

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">Kelola Pembayaran</h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
              Verifikasi bukti transfer bank atau pembayaran DP dan pelunasan dari customer.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-[#140b19]/80 border-white/10 text-zinc-400 hover:text-white hover:border-primary/40'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-[#140b19] border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-zinc-300 text-sm">Gagal memuat data pembayaran. Periksa koneksi Anda dan coba lagi.</p>
            <button
              onClick={() => fetchPayments(null, pagination?.current_page || 1)}
              className="text-primary text-sm font-semibold hover:underline flex-shrink-0 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="bg-[#140b19] border border-white/15 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="sm:col-span-2 lg:col-span-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilter('search', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari kode pesanan / nama customer..."
                  className="w-full pl-11 pr-9 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilter('search', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary"
                title="Dari tanggal"
              />
            </div>

            <div className="lg:col-span-3">
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilter('date_to', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0e0712] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-primary"
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
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="font-semibold text-white text-sm">
                  {pendingPayments.length} pembayaran memerlukan tindakan verifikasi
                </p>
              </div>
            )}

            {payments.length === 0 ? (
              <div className="bg-[#140b19] border border-white/15 rounded-2xl py-20 text-center">
                <CreditCard size={36} className="text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">Belum ada data pembayaran</p>
                {hasActiveFilters && (
                  <>
                    <p className="text-zinc-600 text-xs mt-1">Coba ubah atau reset filter pencarian Anda</p>
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-primary text-xs font-semibold hover:underline cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={`space-y-4 transition-opacity ${refreshing ? 'opacity-50 pointer-events-none' : ''}`}>
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-[#140b19] border border-white/15 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-white/25 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex gap-4">
                        {payment.payment_proof && (
                          <button
                            type="button"
                            onClick={() => setSelectedProof({
                              url: getImageUrl(payment.payment_proof),
                              orderCode: payment.order?.order_code,
                              customerName: payment.order?.customer_name,
                              amount: payment.amount,
                              date: payment.created_at,
                            })}
                            className="relative group flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl overflow-hidden border border-white/15 hover:border-primary/50 transition-all cursor-pointer"
                          >
                            <img
                              src={getImageUrl(payment.payment_proof)}
                              alt="Bukti pembayaran"
                              className="w-28 h-28 sm:w-32 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold">
                              Lihat Bukti
                            </div>
                          </button>
                        )}
                        <div className="space-y-1">
                          <p className="font-semibold text-lg text-white font-heading">
                            {payment.order?.customer_name || 'Customer'}
                          </p>
                          <p className="text-zinc-400 text-xs">Order: <span className="font-mono text-zinc-300 font-bold">{payment.order?.order_code}</span></p>
                          <p className="font-bold text-xl text-primary font-mono pt-1">{formatRupiah(payment.amount)}</p>
                          <p className="text-zinc-400 text-xs">
                            {payment.payment_method.replace('_', ' ').toUpperCase()} —{' '}
                            <span className="font-semibold text-zinc-300">{paymentTypeLabel[payment.payment_type] || payment.payment_type}</span>
                          </p>
                          <p className="text-zinc-500 text-[11px]">{formatDate(payment.created_at)}</p>
                          {payment.order?.remaining_amount > 0 && (
                            <p className="text-amber-400 text-xs font-semibold mt-1">
                              Sisa tagihan: {formatRupiah(payment.order.remaining_amount)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <StatusBadge status={paymentStatusColor(payment.payment_status).badge} />
                        <span className="text-[11px] text-zinc-400">
                          {paymentStatusColor(payment.payment_status).label}
                        </span>

                        {payment.payment_status === 'pending' && (
                          <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-4">
                            {payment.payment_type === 'pelunasan' ? (
                              <button
                                onClick={() => handleVerify(payment.id, 'pelunasan', 'Verifikasi Pelunasan')}
                                disabled={actionLoading === payment.id}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
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
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-[#ff60a8] text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
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
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
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
                              className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" /> Tolak
                            </button>
                          </div>
                        )}

                        {payment.payment_status === 'paid' && payment.verifier && (
                          <p className="text-zinc-500 text-xs mt-2">Verifikasi oleh: <span className="text-zinc-300 font-semibold">{payment.verifier.name}</span></p>
                        )}
                        {payment.payment_status === 'dp' && payment.verifier && (
                          <p className="text-zinc-500 text-xs mt-2">Verifikasi DP oleh: <span className="text-zinc-300 font-semibold">{payment.verifier.name}</span></p>
                        )}
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mt-4 p-3.5 bg-black/40 border border-white/10 rounded-xl">
                        <p className="text-zinc-400 text-xs">Catatan:</p>
                        <p className="font-medium text-white text-xs mt-0.5">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pagination && payments.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-zinc-400 text-xs">
                  Menampilkan {payments.length} dari {pagination.total} pembayaran
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPayments(null, pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 text-zinc-300 disabled:text-zinc-600 transition-colors cursor-pointer"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3.5 py-1.5 bg-[#140b19] border border-white/10 rounded-xl text-zinc-300 text-xs font-mono">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    onClick={() => fetchPayments(null, pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 text-zinc-300 disabled:text-zinc-600 transition-colors cursor-pointer"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL: BUKTI PEMBAYARAN LIGHTBOX */}
        {selectedProof && (
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedProof(null)}
          >
            <div
              className="relative bg-[#140b19] border border-white/15 w-full max-w-xl rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden my-8 transform transition-all animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
              
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-white">Bukti Transfer</h3>
                    <p className="text-zinc-400 text-xs">{selectedProof.orderCode} • {selectedProof.customerName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-black/60 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center max-h-[60vh] p-2">
                  <img
                    src={selectedProof.url}
                    alt="Bukti Transfer"
                    className="max-h-[55vh] w-auto object-contain rounded-xl"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span>Nominal: <strong className="text-primary font-mono text-sm">{formatRupiah(selectedProof.amount)}</strong></span>
                  <a
                    href={selectedProof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors font-semibold"
                  >
                    Buka Ukuran Asli
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TOLAK PEMBAYARAN */}
        {showRejectModal && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => {
              if (actionLoading !== showRejectModal) {
                setShowRejectModal(null);
                setRejectNotes('');
              }
            }}
          >
            <div
              className="relative bg-[#140b19] border border-white/15 w-full max-w-md rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden p-6 my-8 transform transition-all animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />
              <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-rose-500/15 blur-3xl rounded-full" />

              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectNotes('');
                }}
                aria-label="Tutup"
                className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/30 shrink-0">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white tracking-wide">Tolak Pembayaran</h3>
                  <p className="text-zinc-400 text-xs">Berikan alasan penolakan bukti transfer</p>
                </div>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed mb-4">
                Berikan catatan penolakan yang jelas agar customer memahami kendala dan dapat mengirimkan ulang bukti transfer yang valid.
              </p>

              <textarea
                id="reject-notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Contoh: Nominal transfer tidak sesuai, atau bukti mutasi blur / tidak terbaca..."
                className="w-full min-h-[100px] resize-none mb-5 px-4 py-3 rounded-xl bg-[#0e0712] border border-white/15 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
                autoFocus
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectNotes('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => rejectPayment(showRejectModal)}
                  disabled={actionLoading === showRejectModal}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer border-none disabled:opacity-50"
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