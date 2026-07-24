import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { CheckCircle, XCircle, AlertCircle, CreditCard, ChevronLeft, ChevronRight, Search, Percent } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

const paymentTypeLabel = {
  full: 'Lunas',
  dp: 'DP',
  pelunasan: 'Pelunasan',
};

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ show: false, id: null, type: '', label: '' });
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', date_from: '', date_to: '' });

  useEffect(() => {
    fetchPayments(1);
  }, [filters.status]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') fetchPayments(1, { ...filters, [key]: value });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') fetchPayments(1, filters);
  };

  const fetchPayments = async (page = 1, overrideFilters) => {
    try {
      const f = overrideFilters || filters;
      const params = { page };
      if (f.search) params.search = f.search;
      if (f.status) params.status = f.status;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      const response = await api.get('/admin/payments', { params });
      const data = response.data.payments;
      setPayments(data.data || data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id, type, label) => {
    setConfirmAction({ show: true, id, type, label });
  };

  const handleConfirmAction = async () => {
    const { id, type } = confirmAction;
    setConfirmAction({ show: false, id: null, type: '', label: '' });
    setActionLoading(id);
    try {
      const endpoint = type === 'full' ? 'verify' : type === 'dp' ? 'verify-dp' : 'verify-pelunasan';
      await api.patch(`/admin/payments/${id}/${endpoint}`);
      toast.success('Pembayaran berhasil diverifikasi');
      fetchPayments(pagination?.current_page || 1);
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
      await api.patch(`/admin/payments/${id}/reject`, { notes: rejectNotes });
      setShowRejectModal(null);
      setRejectNotes('');
      toast.success('Pembayaran ditolak');
      fetchPayments(pagination?.current_page || 1);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingPayments = payments.filter((p) => p.payment_status === 'pending');

  return (
    <div>
      <h1 className="font-heading text-[28px] text-white tracking-[1px] mb-8">Kelola Pembayaran</h1>

      <div className="bg-card border border-border p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="input-icon-wrapper">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari kode order / nama..."
                className="input-dark"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="input-dark"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="waiting_verification">Menunggu Verifikasi</option>
            <option value="dp">DP</option>
            <option value="paid">Lunas</option>
            <option value="verified">Terverifikasi</option>
            <option value="rejected">Ditolak</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilter('date_from', e.target.value)}
            className="input-dark"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilter('date_to', e.target.value)}
            className="input-dark"
          />
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="bg-card border border-border p-4 mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-warning" />
            <p className="font-semibold text-white">
              {pendingPayments.length} pembayaran menunggu verifikasi
            </p>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-card border border-border py-20 text-center">
          <CreditCard size={32} className="text-gray-medium mx-auto mb-3" />
          <p className="text-gray">Belum ada data pembayaran</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-card border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex gap-4">
                  {payment.payment_proof && (
                    <img
                      src={getImageUrl(payment.payment_proof)}
                      alt="Bukti"
                      className="w-32 h-32 object-cover rounded-xl cursor-pointer hover:opacity-80"
                      onClick={() => window.open(getImageUrl(payment.payment_proof), '_blank')}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-lg text-white">
                      {payment.order?.customer_name || 'Customer'}
                    </p>
                    <p className="text-gray text-sm">
                      Order: {payment.order?.order_code}
                    </p>
                    <p className="font-bold text-xl text-primary mt-2">
                      {formatRupiah(payment.amount)}
                    </p>
                    <p className="text-gray text-sm">
                      {payment.payment_method.replace('_', ' ').toUpperCase()} — {paymentTypeLabel[payment.payment_type] || payment.payment_type}
                    </p>
                    <p className="text-gray text-sm mt-1">
                      {formatDate(payment.created_at)}
                    </p>
                    {payment.order?.remaining_amount > 0 && (
                      <p className="text-warning text-sm mt-1">
                        Sisa tagihan: {formatRupiah(payment.order.remaining_amount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <StatusBadge status={paymentStatusColor(payment.payment_status).badge} />
                  <span className="text-[11px] text-gray-medium -mt-1">{paymentStatusColor(payment.payment_status).label}</span>

                  {payment.payment_status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      {payment.payment_type === 'pelunasan' ? (
                        <button
                          onClick={() => handleVerify(payment.id, 'pelunasan', 'Verifikasi Pelunasan')}
                          disabled={actionLoading === payment.id}
                          className="btn-primary flex items-center gap-2"
                        >
                          {actionLoading === payment.id ? <LoadingSpinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Verifikasi Pelunasan</>}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleVerify(payment.id, 'full', 'Verifikasi (Lunas)')}
                            disabled={actionLoading === payment.id}
                            className="btn-primary flex items-center gap-2"
                          >
                            {actionLoading === payment.id ? <LoadingSpinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Verifikasi (Lunas)</>}
                          </button>
                          <button
                            onClick={() => handleVerify(payment.id, 'dp', 'Verifikasi DP')}
                            disabled={actionLoading === payment.id}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-semibold"
                          >
                            <Percent className="w-4 h-4" /> Verifikasi DP
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowRejectModal(payment.id)}
                        className="btn-secondary flex items-center gap-2 text-danger border-danger hover:bg-danger hover:text-white"
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
              onClick={() => fetchPayments(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 bg-ink border border-border rounded-lg text-gray-light text-sm">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              onClick={() => fetchPayments(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="p-2 rounded-lg hover:bg-border disabled:opacity-50 text-gray-light disabled:text-gray-medium"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 w-full max-w-md">
            <h3 className="font-heading text-xl font-bold mb-4 text-white">Tolak Pembayaran</h3>
            <p className="text-gray mb-4">
              Berikan alasan penolakan yang jelas agar customer dapat memperbaiki pembayarannya.
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Contoh: Nomor rekening salah, nominal tidak sesuai"
              className="input-dark min-h-[100px] resize-none mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => { setShowRejectModal(null); setRejectNotes(''); }}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={() => rejectPayment(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
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
      />
    </div>
  );
}
