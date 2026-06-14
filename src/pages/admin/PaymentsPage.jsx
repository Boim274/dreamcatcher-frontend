import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [confirmVerify, setConfirmVerify] = useState({ show: false, id: null });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      const data = response.data.payments;
      setPayments(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (id) => {
    setConfirmVerify({ show: true, id });
  };

  const handleConfirmVerify = async () => {
    const id = confirmVerify.id;
    setConfirmVerify({ show: false, id: null });
    setActionLoading(id);
    try {
      await api.patch(`/admin/payments/${id}/verify`);
      toast.success('Pembayaran berhasil diverifikasi');
      await fetchPayments();
    } catch (error) {
      toast.error('Gagal memverifikasi pembayaran');
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
      await fetchPayments();
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
          <p className="text-gray">Belum ada data pembayaran</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-card border border-border p-6">
              <div className="flex items-start justify-between">
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
                      {payment.payment_method.replace('_', ' ').toUpperCase()} - 
                      {payment.payment_type === 'dp' ? ' DP' : payment.payment_type === 'full' ? ' Lunas' : ' Pelunasan'}
                    </p>
                    <p className="text-gray text-sm mt-1">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${
                    payment.payment_status === 'verified' ? 'badge-completed' :
                    payment.payment_status === 'pending' ? 'badge-waiting' : 'badge-cancelled'
                  }`}>
                    {payment.payment_status === 'verified' ? 'Terverifikasi' :
                     payment.payment_status === 'pending' ? 'Menunggu' : 'Ditolak'}
                  </span>

                  {payment.payment_status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => verifyPayment(payment.id)}
                        disabled={actionLoading === payment.id}
                        className="btn-primary flex items-center gap-2"
                      >
                        {actionLoading === payment.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Verifikasi
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(payment.id)}
                        className="btn-secondary flex items-center gap-2 text-danger border-danger hover:bg-danger hover:text-white"
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak
                      </button>
                    </div>
                  )}

                  {payment.payment_status === 'verified' && payment.verifier && (
                    <p className="text-gray text-sm mt-2">
                      Verifikasi oleh: {payment.verifier.name}
                    </p>
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
                {actionLoading === showRejectModal ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Tolak Pembayaran'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmVerify.show}
        onClose={() => setConfirmVerify({ show: false, id: null })}
        onConfirm={handleConfirmVerify}
        title="Verifikasi Pembayaran"
        message="Apakah Anda yakin ingin memverifikasi pembayaran ini? Status pembayaran akan diubah menjadi terverifikasi."
        confirmLabel="Ya, Verifikasi"
      />
    </div>
  );
}