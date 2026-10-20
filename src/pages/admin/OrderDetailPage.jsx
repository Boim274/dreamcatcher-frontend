import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Ban,
  CreditCard,
  Wallet,
  Copy,
  Check,
  X,
  Sparkles,
  ZoomIn,
  ExternalLink,
  Image as ImageIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  FileText,
  Clock,
  Layers,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import OptimizedImage from '../../components/ui/OptimizedImage';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const statusConfig = {
  pending: { label: 'Pesanan Diterima', color: 'gray' },
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'yellow' },
  waiting_verification: { label: 'Menunggu Verifikasi', color: 'yellow' },
  ready_to_process: { label: 'Siap Diproses', color: 'blue' },
  processing: { label: 'Sedang Diproses', color: 'purple' },
  ready_for_pickup: { label: 'Siap Diambil / Dikirim', color: 'purple' },
  completed: { label: 'Selesai', color: 'green' },
  cancelled: { label: 'Dibatalkan', color: 'red' },
  cancel_requested: { label: 'Menunggu Pembatalan', color: 'orange' },
};

const validTransitions = {
  pending: ['waiting_payment'],
  waiting_payment: ['waiting_verification'],
  waiting_verification: ['processing', 'ready_for_pickup'],
  ready_to_process: ['processing', 'ready_for_pickup'],
  processing: ['ready_for_pickup'],
  ready_for_pickup: ['completed'],
  cancel_requested: ['cancelled', 'waiting_payment'],
};

const transitionLabels = {
  'waiting_verification->processing': 'Verifikasi & Mulai Produksi',
  'waiting_verification->ready_for_pickup': 'Verifikasi & Siap Diambil/Kirim',
  'ready_to_process->processing': 'Mulai Pengerjaan Sablon',
  'ready_to_process->ready_for_pickup': 'Langsung Siap Diambil/Kirim',
  'processing->ready_for_pickup': 'Selesaikan Produksi (Siap Ambil/Kirim)',
  'ready_for_pickup->completed': 'Konfirmasi Pesanan Selesai',
};

const paymentStatusLabel = {
  pending: 'Belum Dibayar',
  waiting_verification: 'Menunggu Verifikasi',
  dp: 'DP 50%',
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
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-48 bg-white/5 rounded-xl" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-white/5 rounded-xl" />
          <div className="h-4 w-36 bg-white/5 rounded-xl" />
        </div>
        <div className="h-8 w-28 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[#180f1e]/90 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="h-6 w-44 bg-white/5 rounded-xl" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-14 w-full bg-white/5 rounded-2xl" />
            ))}
          </div>
        ))}
      </div>
      <div className="bg-[#180f1e]/90 border border-white/10 rounded-3xl p-6 h-40" />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin/pesanan"
      className="inline-flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors mb-6 text-xs font-bold uppercase tracking-wider no-underline"
    >
      <ArrowLeft size={16} />
      <span>Kembali ke Kelola Pesanan</span>
    </Link>
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
        toast.error('Gagal memuat detail pesanan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (newStatus) => {
    const labelKey = `${order?.status}->${newStatus}`;
    const label = transitionLabels[labelKey] || statusConfig[newStatus]?.label || newStatus;
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
      toast.error(error.response?.data?.message || 'Gagal memperbarui status');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveCancel = async () => {
    setUpdating(true);
    try {
      await adminService.updateOrderStatus(id, 'cancelled', 'Pembatalan disetujui oleh admin studio');
      toast.success('Permintaan pembatalan pesanan disetujui.');
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
      await adminService.updateOrderStatus(id, 'waiting_payment', 'Pembatalan ditolak oleh admin studio');
      toast.success('Permintaan pembatalan ditolak, pesanan kembali ke status menunggu pembayaran.');
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
      toast.success('Kode pesanan berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <DetailSkeleton />
      </ErrorBoundary>
    );
  }

  if (error || !order) {
    return (
      <ErrorBoundary>
        <div>
          <BackLink />
          <div className="bg-[#180f1e]/90 border border-white/10 rounded-3xl py-16 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
              <AlertTriangle size={28} />
            </div>
            <p className="text-white font-bold text-base">Pesanan Tidak Ditemukan</p>
            <p className="text-zinc-400 text-xs mt-1">Periksa koneksi Anda atau pastikan ID pesanan valid.</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => fetchOrder()}
                className="btn-gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Coba Lagi
              </button>
              <Link
                to="/admin/pesanan"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider no-underline"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const availableTransitions = validTransitions[order.status] || [];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <BackLink />

        {/* Top Header Banner */}
        <div className="bg-[#180f1e]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
              <Clock size={13} className="text-primary" />
              <span>Dibuat: {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-[1px]">
                Detail Pesanan
              </h1>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                <span className="font-mono font-bold text-primary text-sm sm:text-base">
                  #{order.order_code}
                </span>
                <button
                  type="button"
                  onClick={copyOrderCode}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Salin Kode Pesanan"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              onClick={() => fetchOrder()}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={updating ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 2-Column Info: Customer & Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Informasi Customer & Pengiriman */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <User size={18} className="text-primary" />
              <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                Informasi Pemesan & Pengiriman
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <User size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Nama Pemesan</p>
                  <p className="font-bold text-white text-sm truncate mt-0.5">{order.customer_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <Phone size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">No. WhatsApp</p>
                  <p className="font-bold text-white text-sm truncate mt-0.5">{order.phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/5 sm:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Email Customer</p>
                  <p className="font-bold text-white text-sm truncate mt-0.5">{order.customer_email || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/5 sm:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <Truck size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Metode Pengiriman</p>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {order.delivery_method === 'pickup' ? '🏬 Ambil Sendiri di Toko' : '🚚 Pengiriman Kurir ke Alamat'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/5 sm:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Alamat Pengiriman</p>
                  <p className="text-zinc-200 text-xs leading-relaxed mt-0.5 whitespace-pre-wrap">{order.address || '-'}</p>
                </div>
              </div>

              {(order.notes || order.description) && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/5 sm:col-span-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Catatan Tambahan</p>
                    <p className="text-zinc-200 text-xs leading-relaxed mt-0.5 whitespace-pre-wrap">
                      {order.notes || order.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Informasi Pembayaran & Tagihan */}
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <CreditCard size={18} className="text-primary" />
                <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                  Informasi Pembayaran
                </h2>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-zinc-400 text-xs font-semibold">Status Pembayaran</span>
                  </div>
                  <span className="font-bold text-xs uppercase px-2.5 py-1 rounded-xl bg-white/5 text-white border border-white/10">
                    {paymentStatusLabel[order.payment_status] || order.payment_status}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span className="text-zinc-400 text-xs font-semibold">Total Nilai Tagihan</span>
                  </div>
                  <span className="font-bold text-xl text-white font-mono">{formatRupiah(order.total_price)}</span>
                </div>

                {order.paid_amount > 0 && (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <span className="text-emerald-300 text-xs font-semibold">Sudah Terbayar / Terverifikasi</span>
                    <span className="font-bold text-lg text-emerald-400 font-mono">{formatRupiah(order.paid_amount)}</span>
                  </div>
                )}

                {order.remaining_amount > 0 && (
                  <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <span className="text-amber-300 text-xs font-semibold">Sisa Tagihan (Pelunasan)</span>
                    <span className="font-bold text-lg text-amber-400 font-mono">{formatRupiah(order.remaining_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Link to payment verification if pending */}
            <div className="pt-3 border-t border-white/10">
              <Link
                to="/admin/pembayaran"
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all no-underline group"
              >
                <span>Buka Menu Verifikasi Pembayaran</span>
                <ExternalLink size={14} className="group-hover:translate-x-0.5 text-primary transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Update Status & Workflow Section */}
        <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Layers size={18} className="text-primary" />
            <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
              Manajemen Alur Status Pesanan
            </h2>
          </div>

          {/* Cancellation Request Alert Box */}
          {order.status === 'cancel_requested' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-amber-400 animate-pulse" />
                <p className="text-amber-300 font-bold text-sm">Permintaan Pembatalan dari Pelanggan</p>
              </div>
              <p className="text-amber-200/80 text-xs leading-relaxed">
                Pelanggan mengajukan permohonan pembatalan pesanan ini. Silakan konfirmasi tindakan berikut:
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => setConfirmCancelAction({ show: true, action: 'approve' })}
                  disabled={updating}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer border-none"
                >
                  <XCircle size={15} />
                  <span>Setujui Pembatalan (Cancel)</span>
                </button>
                <button
                  onClick={() => setConfirmCancelAction({ show: true, action: 'reject' })}
                  disabled={updating}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 active:scale-95 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-primary/30 cursor-pointer border-none"
                >
                  <CheckCircle2 size={15} />
                  <span>Tolak Pembatalan & Lanjutkan</span>
                </button>
              </div>
            </div>
          )}

          {/* Step Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {availableTransitions.map((status) => {
              const labelKey = `${order.status}->${status}`;
              const label = transitionLabels[labelKey] || statusConfig[status]?.label || status;

              return (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={updating}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/30 transition-all cursor-pointer border-none disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{label}</span>
                </button>
              );
            })}

            {availableTransitions.length === 0 && order.status !== 'cancel_requested' && (
              <p className="text-zinc-500 text-xs py-2">
                Pesanan telah mencapai status akhir ({statusConfig[order.status]?.label || order.status}).
              </p>
            )}
          </div>
        </div>

        {/* Order Items Table & Design Previews */}
        <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" />
              <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                Rincian Item & Desain Sablon
              </h2>
            </div>
            <span className="text-zinc-400 text-xs font-mono">
              {order.items?.length || 0} Jenis Item
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/50 border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                <tr>
                  <th className="px-4 py-3.5">Layanan / Kategori</th>
                  <th className="px-4 py-3.5">Pratinjau Desain & Nama Item</th>
                  <th className="px-4 py-3.5">Spesifikasi Sablon</th>
                  <th className="px-4 py-3.5 text-right">Qty</th>
                  <th className="px-4 py-3.5 text-right">Harga Satuan</th>
                  <th className="px-4 py-3.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {order.items?.map((item) => {
                  const isSablon = Boolean(item.service_id || item.sablon_type || item.design_type || item.design_id);
                  const fallbackOrderImg = order.items?.find((i) => i.design?.image_url)?.design?.image_url;
                  const fallbackOrderThumb = order.items?.find((i) => i.design?.thumbnail_url)?.design?.thumbnail_url;
                  const rawOriginal = item.design?.image_url || item.product?.images?.[0]?.image_url || (isSablon ? fallbackOrderImg : null);
                  const fullImg = rawOriginal ? getImageUrl(rawOriginal) : null;
                  const thumbImg = item.design?.thumbnail_url || item.product?.images?.[0]?.thumbnail_url || (isSablon ? fallbackOrderThumb : null) || fullImg;
                  const isAiDesign = item.design_type === 'ai_generated' || item.design?.design_type === 'ai_generated';

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-white text-xs">
                            {item.service?.name || (item.product_id ? 'Produk Pakaian' : 'Layanan Sablon')}
                          </span>
                          {isSablon && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg w-fit font-semibold">
                              {isAiDesign ? <Sparkles size={11} className="text-amber-400" /> : <ImageIcon size={11} className="text-blue-400" />}
                              <span>{isAiDesign ? 'Desain AI' : 'Desain Upload'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-3">
                          {fullImg ? (
                            <div className="relative group/img shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-black/40 border border-white/10 hover:border-primary transition-all shadow-md">
                              <OptimizedImage
                                src={fullImg}
                                thumbnailSrc={thumbImg}
                                variant="thumbnail"
                                alt={item.product_name || 'Desain'}
                                containerClassName="w-full h-full cursor-pointer"
                                className="w-full h-full object-contain"
                                onClick={() => setLightboxImage(fullImg)}
                                title="Klik untuk memperbesar"
                              />
                              <button
                                type="button"
                                onClick={() => setLightboxImage(fullImg)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 rounded-2xl flex items-center justify-center text-white transition-opacity cursor-pointer z-10"
                                title="Perbesar gambar"
                              >
                                <ZoomIn size={16} />
                              </button>
                            </div>
                          ) : isSablon ? (
                            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center shrink-0 text-zinc-500">
                              <ImageIcon size={20} className="text-zinc-600 mb-0.5" />
                              <span className="text-[9px]">No File</span>
                            </div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm">{item.product_name}</p>
                            {item.design?.prompt && (
                              <p className="text-zinc-400 text-xs italic bg-black/40 p-2 rounded-xl border border-white/5 mt-1.5 leading-relaxed">
                                &ldquo;{item.design.prompt}&rdquo;
                              </p>
                            )}
                            {fullImg && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage(fullImg)}
                                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  <ZoomIn size={12} /> Zoom
                                </button>
                                <span className="text-zinc-600">·</span>
                                <a
                                  href={fullImg}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold no-underline"
                                >
                                  <ExternalLink size={12} /> Buka HD
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {item.shirt_model && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                              Model: <strong className="text-white">{item.shirt_model}</strong>
                            </span>
                          )}
                          {(item.variant_label || item.size) && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-200">
                              {item.variant_label && !item.variant_label.startsWith('Size:') ? item.variant_label : `Ukuran: ${item.size || item.variant_label}`}
                            </span>
                          )}
                          {item.sablon_type && (
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold">
                              {item.sablon_type}
                            </span>
                          )}
                          {item.selected_color && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-200">
                              Warna: <strong className="text-white">{item.selected_color}</strong>
                            </span>
                          )}
                          {item.print_area && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                              Area: {item.print_area}
                            </span>
                          )}
                          {item.print_size && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                              Dimensi: {item.print_size}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-white align-top text-xs">
                        {item.quantity} pcs
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-zinc-300 align-top text-xs">
                        {formatRupiah(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-white align-top text-xs">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-black/50 border-t border-white/10 font-bold text-xs text-white">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right text-zinc-400">Subtotal Item</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{formatRupiah(order.subtotal)}</td>
                </tr>
                {order.shipping_cost > 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-right text-zinc-400">Biaya Pengiriman</td>
                    <td className="px-4 py-3 text-right font-mono text-white">{formatRupiah(order.shipping_cost)}</td>
                  </tr>
                )}
                <tr className="border-t border-white/10">
                  <td colSpan="5" className="px-4 py-4 text-right text-base uppercase font-heading text-primary">
                    GRAND TOTAL TAGIHAN
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-primary text-lg font-heading">
                    {formatRupiah(order.total_price)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment History & Proof Card */}
        {order.payments?.length > 0 && (
          <div className="bg-[#180f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <CreditCard size={18} className="text-primary" />
              <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">
                Riwayat & Bukti Pembayaran
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.payments.map((payment) => (
                <div key={payment.id} className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">
                        {payment.payment_method?.replace('_', ' ')?.toUpperCase() || 'TRANSFER BANK'}
                      </p>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Tipe: <strong className="text-primary uppercase">{payment.payment_type === 'dp' ? 'DP (Uang Muka)' : payment.payment_type === 'full' ? 'Lunas Penuh' : 'Pelunasan'}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-base text-white">{formatRupiah(payment.amount)}</p>
                      <StatusBadge status={paymentRowStatusBadge[payment.payment_status] || 'cancelled'} />
                    </div>
                  </div>

                  {payment.payment_proof && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-1.5">Bukti Transfer</p>
                      <button
                        type="button"
                        onClick={() => setLightboxImage(getImageUrl(payment.payment_proof))}
                        className="block w-full max-h-40 rounded-xl overflow-hidden border border-white/10 hover:border-primary transition-all cursor-pointer"
                      >
                        <OptimizedImage
                          src={payment.payment_proof}
                          thumbnailSrc={payment.thumbnail_url}
                          variant="medium"
                          alt="Bukti pembayaran"
                          containerClassName="w-full h-40"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox Zoom Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setLightboxImage(null)}
          >
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Buka Penuh</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Tutup"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="relative max-h-[85vh] max-w-full rounded-2xl border border-white/20 bg-[#140b19]/80 p-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Preview HD"
                className="max-h-[80vh] max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Ubah Status */}
        <ConfirmDialog
          isOpen={confirmStatus.show}
          onClose={() => setConfirmStatus({ show: false, status: null, label: '' })}
          onConfirm={handleConfirmStatus}
          title="Ubah Status Pesanan?"
          message={`Apakah Anda yakin ingin memindahkan pesanan #${order.order_code} ke tahap "${confirmStatus.label}"?`}
          confirmLabel="Ya, Perbarui Status"
          loading={updating}
        />

        {/* Modal Konfirmasi Pembatalan */}
        <ConfirmDialog
          isOpen={confirmCancelAction.show}
          onClose={() => setConfirmCancelAction({ show: false, action: null })}
          onConfirm={confirmCancelAction.action === 'approve' ? handleApproveCancel : handleRejectCancel}
          title={confirmCancelAction.action === 'approve' ? 'Setujui Pembatalan Pesanan?' : 'Tolak Permintaan Pembatalan?'}
          message={
            confirmCancelAction.action === 'approve'
              ? `Pesanan #${order.order_code} akan dibatalkan secara resmi dan produksi dihentikan.`
              : `Permintaan pembatalan akan ditolak dan pesanan #${order.order_code} dikembalikan ke status Menunggu Pembayaran.`
          }
          confirmLabel={confirmCancelAction.action === 'approve' ? 'Ya, Setujui Pembatalan' : 'Ya, Tolak Pembatalan'}
          variant={confirmCancelAction.action === 'approve' ? 'danger' : 'primary'}
          loading={updating}
        />
      </div>
    </ErrorBoundary>
  );
}