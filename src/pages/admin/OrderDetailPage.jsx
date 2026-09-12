import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ArrowLeft, CheckCircle, XCircle, Ban, CreditCard, Wallet, Copy, Check, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

import { getImageUrl } from '../../utils/getImageUrl';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const statusConfig = {
  pending: { label: 'Pending', color: 'gray' },
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'yellow' },
  waiting_verification: { label: 'Menunggu Verifikasi', color: 'yellow' },
  ready_to_process: { label: 'Siap Diproses', color: 'blue' },
  processing: { label: 'Diproses', color: 'purple' },
  ready_for_pickup: { label: 'Siap Diambil / Dikirim', color: 'purple' },
  completed: { label: 'Selesai', color: 'green' },
  cancelled: { label: 'Batal', color: 'red' },
  cancel_requested: { label: 'Menunggu Pembatalan', color: 'orange' },
};

const validTransitions = {
  pending: ['waiting_payment'],
  waiting_payment: ['waiting_verification'],
  waiting_verification: ['processing', 'ready_for_pickup'],
  processing: ['ready_for_pickup'],
  ready_for_pickup: ['completed'],
  cancel_requested: ['cancelled', 'waiting_payment'],
};

const transitionLabels = {
  'waiting_verification->processing': 'Verifikasi & Proses',
  'waiting_verification->ready_for_pickup': 'Verifikasi & Langsung Siap',
  'processing->ready_for_pickup': 'Selesai Produksi',
  'ready_for_pickup->completed': 'Konfirmasi Selesai',
};

const paymentStatusLabel = {
  pending: 'Belum Dibayar',
  waiting_verification: 'Menunggu Verifikasi',
  dp: 'DP',
  paid: 'Lunas',
  rejected: 'Ditolak',
};

const paymentRowStatusBadge = {
  verified: 'completed',
  pending: 'waiting_payment',
  paid: 'completed',
  dp: 'paid',
  rejected: 'cancelled',
};

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-48 bg-ink rounded mb-6" />
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-ink rounded" />
          <div className="h-4 w-32 bg-ink rounded" />
        </div>
        <div className="h-6 w-24 bg-ink rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="h-5 w-40 bg-ink rounded" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-4 w-full bg-ink rounded" />
            ))}
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-6 mt-6 h-32" />
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState({ show: false, status: null, label: '' });
  const [confirmCancelAction, setConfirmCancelAction] = useState({ show: false, action: null });

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrder = async (signal) => {
    setLoading(true);
    try {
      setError(false);
      const data = await adminService.getOrder(id, signal);
      setOrder(data);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch order:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    const label = statusConfig[newStatus]?.label || newStatus;
    setConfirmStatus({ show: true, status: newStatus, label });
  };

  const handleConfirmStatus = async () => {
    const newStatus = confirmStatus.status;
    const label = confirmStatus.label;
    setUpdating(true);
    try {
      await adminService.updateOrderStatus(id, newStatus);
      toast.success(`Status pesanan diubah menjadi "${label}"`);
      setConfirmStatus({ show: false, status: null, label: '' });
      await fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveCancel = async () => {
    setUpdating(true);
    try {
      await adminService.updateOrderStatus(id, 'cancelled', 'Pembatalan disetujui oleh admin');
      toast.success('Pembatalan pesanan disetujui');
      setConfirmCancelAction({ show: false, action: null });
      await fetchOrder();
    } catch (error) {
      toast.error('Gagal memproses pembatalan');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectCancel = async () => {
    setUpdating(true);
    try {
      await adminService.updateOrderStatus(id, 'waiting_payment', 'Pembatalan ditolak oleh admin');
      toast.success('Pembatalan pesanan ditolak, kembali ke status menunggu pembayaran');
      setConfirmCancelAction({ show: false, action: null });
      await fetchOrder();
    } catch (error) {
      toast.error('Gagal memproses penolakan');
    } finally {
      setUpdating(false);
    }
  };

  const copyOrderCode = async () => {
    try {
      await navigator.clipboard.writeText(order.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — fail silently, code is still visible to select manually
    }
  };

  const BackLink = () => (
    <Link
      to="/admin/pesanan"
      className="inline-flex items-center gap-2 text-gray-light hover:text-primary transition-colors mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
    >
      <ArrowLeft className="w-5 h-5" />
      Kembali ke Daftar Pesanan
    </Link>
  );

  if (loading) {
    return (
      <ErrorBoundary>
        <div>
          <DetailSkeleton />
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div>
          <BackLink />
          <div className="bg-card border border-fire/40 rounded-xl py-16 text-center">
            <p className="text-white font-medium">Gagal memuat pesanan</p>
            <p className="text-gray text-sm mt-1">Periksa koneksi Anda dan coba lagi</p>
            <button
              onClick={() => fetchOrder()}
              className="btn-primary mt-4 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!order) {
    return (
      <ErrorBoundary>
        <div>
          <BackLink />
          <div className="bg-card border border-border rounded-xl py-16 text-center">
            <p className="text-gray">Pesanan tidak ditemukan</p>
            <Link to="/admin/pesanan" className="btn-primary mt-4 inline-block">
              Kembali
            </Link>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const availableTransitions = validTransitions[order.status] || [];

  return (
    <ErrorBoundary>
      <div>
        <BackLink />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-[28px] text-white tracking-[1px]">Detail Pesanan</h1>
            <div className="flex items-center gap-2 text-gray">
              <span>
                Kode: <span className="font-mono font-bold text-primary">{order.order_code}</span>
              </span>
              <button
                onClick={copyOrderCode}
                aria-label="Salin kode pesanan"
                title="Salin kode pesanan"
                className="text-gray hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-white">Informasi Customer</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray text-sm">Nama</p>
                <p className="font-medium text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-gray text-sm">Email</p>
                <p className="text-white">{order.customer_email || '-'}</p>
              </div>
              <div>
                <p className="text-gray text-sm">No. HP</p>
                <p className="text-white">{order.phone}</p>
              </div>
              <div>
                <p className="text-gray text-sm">Alamat</p>
                <p className="text-white">{order.address}</p>
              </div>
              <div>
                <p className="text-gray text-sm">Pengiriman</p>
                <p className="text-white">{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-gray text-sm">Catatan</p>
                  <p className="font-medium text-white whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
              {order.description && (
                <div>
                  <p className="text-gray text-sm">Deskripsi Pesanan</p>
                  <p className="font-medium text-white whitespace-pre-wrap">{order.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-white">Informasi Pembayaran</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-ink border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="text-gray text-sm">Status Pembayaran</span>
                </div>
                <span className="font-semibold text-white">
                  {paymentStatusLabel[order.payment_status] || order.payment_status}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-ink border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="text-gray text-sm">Total Tagihan</span>
                </div>
                <span className="font-bold text-lg text-white">{formatRupiah(order.total_price)}</span>
              </div>
              {order.paid_amount > 0 && (
                <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
                  <span className="text-gray text-sm">Sudah Dibayar</span>
                  <span className="font-bold text-lg text-success">{formatRupiah(order.paid_amount)}</span>
                </div>
              )}
              {order.remaining_amount > 0 && (
                <div className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <span className="text-gray text-sm">Sisa Tagihan</span>
                  <span className="font-bold text-lg text-warning">{formatRupiah(order.remaining_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <h2 className="font-semibold mb-4 text-white">Update Status</h2>

          {order.status === 'cancel_requested' && (
            <div className="mb-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Ban className="w-5 h-5 text-warning" />
                <p className="text-warning font-semibold text-sm">Permintaan Pembatalan</p>
              </div>
              <p className="text-warning/70 text-xs mb-4">
                Customer meminta pembatalan pesanan ini. Pilih tindakan:
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancelAction({ show: true, action: 'approve' })}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-danger hover:bg-danger/80 text-white font-semibold rounded-lg transition-colors text-[13px] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  <XCircle className="w-4 h-4" /> Setujui Pembatalan
                </button>
                <button
                  onClick={() => setConfirmCancelAction({ show: true, action: 'reject' })}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-[13px] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <CheckCircle className="w-4 h-4" /> Tolak Pembatalan
                </button>
              </div>
            </div>
          )}

          {availableTransitions.length === 0 ? (
            <p className="text-gray text-center py-8">
              Tidak ada perubahan status yang tersedia untuk status ini.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {availableTransitions.map((status) => {
                const labelKey = `${order.status}->${status}`;
                const label = transitionLabels[labelKey] || statusConfig[status]?.label || status;
                return (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating}
                    className="btn-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 p-3 bg-ink border border-border rounded-lg">
            <p className="text-gray text-sm">
              Status saat ini:{' '}
              <span className="font-semibold text-white">{statusConfig[order.status]?.label || order.status}</span>
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <h2 className="font-semibold mb-4 text-white">Item Pesanan</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-ink">
                <tr>
                  <th className="px-4 py-3 text-left text-gray">Tipe / Layanan</th>
                  <th className="px-4 py-3 text-left text-gray">Item</th>
                  <th className="px-4 py-3 text-left text-gray">Varian</th>
                  <th className="px-4 py-3 text-right text-gray">Qty</th>
                  <th className="px-4 py-3 text-right text-gray">Harga</th>
                  <th className="px-4 py-3 text-right text-gray">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items?.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-ink/60">
                    <td className="px-4 py-3 text-gray-light">
                      {item.service?.name || (item.product_id ? 'Produk Jadi' : '-')}
                    </td>
                    <td className="px-4 py-3 text-white">
                      <div className="flex items-center gap-2">
                        {item.product?.images?.[0]?.image_url && (
                          <img
                            src={getImageUrl(item.product.images[0].image_url)}
                            alt=""
                            className="w-8 h-8 rounded object-cover flex-shrink-0 bg-ink border border-border"
                          />
                        )}
                        <span className="font-medium">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-light">{item.variant_label || item.size || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-light">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-light">{formatRupiah(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{formatRupiah(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-ink">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right text-gray">Subtotal</td>
                  <td className="px-4 py-3 text-right text-white">{formatRupiah(order.subtotal)}</td>
                </tr>
                {order.shipping_cost > 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-right text-gray">Ongkos Kirim</td>
                    <td className="px-4 py-3 text-right text-white">{formatRupiah(order.shipping_cost)}</td>
                  </tr>
                )}
                <tr className="font-bold">
                  <td colSpan="5" className="px-4 py-3 text-right text-gray">Total</td>
                  <td className="px-4 py-3 text-right text-primary text-lg">{formatRupiah(order.total_price)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {order.payments?.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mt-6">
            <h2 className="font-semibold mb-4 text-white">Riwayat Pembayaran</h2>
            <div className="space-y-4">
              {order.payments.map((payment) => (
                <div key={payment.id} className="p-4 bg-ink border border-border rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {payment.payment_method.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-gray text-sm">
                        {payment.payment_type === 'dp' ? 'DP' : payment.payment_type === 'full' ? 'Lunas' : 'Pelunasan'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-white">{formatRupiah(payment.amount)}</p>
                      <StatusBadge status={paymentRowStatusBadge[payment.payment_status] || 'cancelled'} />
                    </div>
                  </div>
                  {payment.payment_proof && (
                    <button
                      onClick={() => setLightboxImage(getImageUrl(payment.payment_proof))}
                      className="mt-3 block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                    >
                      <img
                        src={getImageUrl(payment.payment_proof)}
                        alt="Bukti pembayaran"
                        className="max-h-48 rounded-lg cursor-zoom-in transition-opacity hover:opacity-80"
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {order.items?.some((i) => i.design) && (
          <div className="bg-card border border-border rounded-xl p-6 mt-6">
            <h2 className="font-semibold mb-4 text-white">Desain</h2>
            <div className="space-y-4">
              {order.items.filter((i) => i.design).map((item) => (
                <div key={item.id} className="flex gap-4">
                  <button
                    onClick={() => setLightboxImage(getImageUrl(item.design.image_url))}
                    className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  >
                    <img
                      src={getImageUrl(item.design.image_url)}
                      alt="Design"
                      className="w-32 h-32 object-cover rounded-lg cursor-zoom-in transition-opacity hover:opacity-80"
                    />
                  </button>
                  <div>
                    <p className="font-medium text-white">
                      {item.design.design_type === 'ai_generated' ? 'AI Generated' : 'Uploaded'}
                    </p>
                    <p className={`text-sm ${item.design.is_valid ? 'text-success' : 'text-warning'}`}>
                      {item.design.is_valid ? 'Valid - Siap Produksi' : 'Perlu Revisi'}
                    </p>
                    {item.design.validation_message && (
                      <p className="text-gray-light text-sm mt-1 whitespace-pre-line">
                        {item.design.validation_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lightboxImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              aria-label="Tutup"
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmStatus.show}
          onClose={() => setConfirmStatus({ show: false, status: null, label: '' })}
          onConfirm={handleConfirmStatus}
          title="Update Status Pesanan"
          message={`Apakah Anda yakin ingin mengubah status pesanan menjadi "${confirmStatus.label}"?`}
          confirmLabel="Ya, Ubah Status"
          loading={updating}
        />

        <ConfirmDialog
          isOpen={confirmCancelAction.show}
          onClose={() => setConfirmCancelAction({ show: false, action: null })}
          onConfirm={confirmCancelAction.action === 'approve' ? handleApproveCancel : handleRejectCancel}
          title={confirmCancelAction.action === 'approve' ? 'Setujui Pembatalan' : 'Tolak Pembatalan'}
          message={
            confirmCancelAction.action === 'approve'
              ? 'Apakah Anda yakin ingin menyetujui pembatalan pesanan ini? Status akan berubah menjadi "Dibatalkan".'
              : 'Apakah Anda yakin ingin menolak pembatalan pesanan ini? Status akan kembali ke "Menunggu Pembayaran".'
          }
          confirmLabel={confirmCancelAction.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
          variant={confirmCancelAction.action === 'approve' ? 'danger' : 'default'}
          loading={updating}
        />
      </div>
    </ErrorBoundary>
  );
}