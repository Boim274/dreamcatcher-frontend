import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

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
    if (!confirm('Verifikasi pembayaran ini?')) return;

    setActionLoading(id);
    try {
      await api.patch(`/admin/payments/${id}/verify`);
      await fetchPayments();
    } catch (error) {
      alert('Gagal memverifikasi pembayaran');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectPayment = async (id) => {
    if (!rejectNotes.trim()) {
      alert('Masukkan alasan penolakan');
      return;
    }

    setActionLoading(id);
    try {
      await api.patch(`/admin/payments/${id}/reject`, { notes: rejectNotes });
      setShowRejectModal(null);
      setRejectNotes('');
      await fetchPayments();
    } catch (error) {
      alert('Gagal menolak pembayaran');
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
      <h1 className="font-heading text-3xl font-bold mb-8">Kelola Pembayaran</h1>

      {pendingPayments.length > 0 && (
        <div className="card bg-warning/5 border border-warning/20 mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-warning" />
            <p className="font-semibold">
              {pendingPayments.length} pembayaran menunggu verifikasi
            </p>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-text-secondary">Belum ada data pembayaran</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {payment.payment_proof && (
                    <img
                      src={`http://localhost:8000/${payment.payment_proof}`}
                      alt="Bukti"
                      className="w-32 h-32 object-cover rounded-xl cursor-pointer hover:opacity-80"
                      onClick={() => window.open(`http://localhost:8000/${payment.payment_proof}`, '_blank')}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {payment.order?.customer_name || 'Customer'}
                    </p>
                    <p className="text-text-secondary text-sm">
                      Order: {payment.order?.order_code}
                    </p>
                    <p className="font-bold text-xl text-primary mt-2">
                      Rp {payment.amount.toLocaleString('id-ID')}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {payment.payment_method.replace('_', ' ').toUpperCase()} - 
                      {payment.payment_type === 'dp' ? ' DP' : payment.payment_type === 'full' ? ' Lunas' : ' Pelunasan'}
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
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
                    <p className="text-text-secondary text-sm mt-2">
                      Verifikasi oleh: {payment.verifier.name}
                    </p>
                  )}
                </div>
              </div>

              {payment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-text-secondary text-sm">Catatan:</p>
                  <p className="font-medium">{payment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-heading text-xl font-bold mb-4">Tolak Pembayaran</h3>
            <p className="text-text-secondary mb-4">
              Berikan alasan penolakan yang jelas agar customer dapat memperbaiki pembayarannya.
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Contoh: Nomor rekening salah, nominal tidak sesuai"
              className="input-field min-h-[100px] resize-none mb-4"
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
    </div>
  );
}