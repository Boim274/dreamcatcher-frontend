import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Search, CheckCircle, Clock, Package, Phone, Hash, Lock,
  ClipboardList, CreditCard, Loader, PartyPopper, XCircle,
  ShoppingBag, Truck, MapPin, MessageCircle, AlertTriangle,
  SearchX, Loader2, ChevronDown, ChevronUp, Image as ImageIcon,
  Ban
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import { formatRupiah } from '../utils/formatRupiah';

const statusSteps = [
  { key: 'pending', label: 'Pesanan Diterima', description: 'Pesanan Anda sudah diterima dan menunggu konfirmasi dari admin.', icon: ClipboardList },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', description: 'Silakan lakukan pembayaran dalam 24 jam.', icon: CreditCard },
  { key: 'waiting_verification', label: 'Menunggu Verifikasi', description: 'Bukti pembayaran diterima. Menunggu verifikasi admin.', icon: Clock },
  { key: 'ready_to_process', label: 'Siap Diproses', description: 'Pembayaran dikonfirmasi. Pesanan segera dikerjakan.', icon: CheckCircle },
  { key: 'processing', label: 'Sedang Diproses', description: 'Tim sedang mengerjakan pesanan Anda. Estimasi 3-5 hari kerja.', icon: Loader },
  { key: 'ready_for_pickup', label: 'Dikirim / Siap Diambil', description: 'Pesanan sedang dikirim atau siap diambil di toko.', icon: Truck },
  { key: 'completed', label: 'Selesai', description: 'Pesanan telah selesai dan diterima dengan baik.', icon: PartyPopper },
];

const statusOrder = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process', 'processing', 'ready_for_pickup', 'completed'];

function getProgressPercent(status) {
  const idx = statusOrder.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / statusSteps.length) * 100);
}

function getStepTimestamp(order, stepKey) {
  if (!order || !order.status_history) return null;
  const entry = order.status_history.find(h => h.status === stepKey);
  return entry ? entry.created_at : null;
}

function VerticalTimeline({ status }) {
  const currentIndex = statusOrder.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 border-2 border-red-500/40 flex-shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-red-400 text-[15px] font-semibold">Dibatalkan</p>
          <p className="text-red-400/60 text-[12px]">Pesanan ini telah dibatalkan</p>
        </div>
      </div>
    );
  }

  if (status === 'cancel_requested') {
    return (
      <div className="flex items-center gap-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 flex-shrink-0 animate-pulse">
          <Ban className="w-5 h-5" />
        </div>
        <div>
          <p className="text-orange-400 text-[15px] font-semibold">Pembatalan Diminta</p>
          <p className="text-orange-400/60 text-[12px]">Permintaan pembatalan sedang menunggu konfirmasi dari admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {statusSteps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isFuture = stepIndex > currentIndex;
        const isLast = index === statusSteps.length - 1;

        return (
          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[19px] top-[40px] bottom-0 w-0.5 bg-border/40">
                {isCompleted && <div className="w-full h-full bg-primary" />}
                {isCurrent && <div className="w-full h-1/2 bg-gradient-to-b from-primary to-transparent" />}
              </div>
            )}

            {/* Icon circle */}
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 transition-all ${
              isCompleted
                ? 'bg-primary text-ink shadow-lg shadow-primary/20'
                : isCurrent
                ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse-glow'
                : 'bg-ink text-gray border border-border'
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <p className={`text-[15px] font-semibold ${
                isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-gray'
              }`}>
                {step.label}
              </p>
              <p className={`text-[12px] mt-1 leading-relaxed ${
                isCurrent ? 'text-gray-light' : isFuture ? 'text-gray/60' : 'text-gray'
              }`}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ status }) {
  const percent = getProgressPercent(status);
  const currentIndex = statusOrder.indexOf(status);
  const currentStep = statusSteps[currentIndex];

  if (status === 'cancelled' || status === 'cancel_requested') return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] text-gray">
          Step {currentIndex + 1} dari {statusSteps.length}
        </p>
        <p className="text-[13px] text-primary font-semibold">{percent}%</p>
      </div>
      <div className="track-progress-bar">
        <div className="track-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {currentStep && (
        <p className="text-[12px] text-gray mt-2">
          {currentStep.label}
        </p>
      )}
    </div>
  );
}

function OrderSummaryCard({ order }) {
  const designUrl = order.items?.[0]?.design?.url || order.design_url;
  const items = order.items || [];
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map(i => i.size).filter(Boolean))];
  const colors = [...new Set(items.map(i => i.selected_color).filter(Boolean))];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start gap-4">
        {designUrl ? (
          <img src={designUrl} alt="Desain" className="order-design-img-lg" />
        ) : (
          <div className="w-20 h-20 rounded-[14px] bg-ink border border-border flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-8 h-8 text-gray/40" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-[16px] text-primary font-bold tracking-wider">#{order.order_code}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-[12px] text-gray mb-2">
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>

          <div className="flex items-center gap-3 text-[12px] text-gray flex-wrap">
            <span className="flex items-center gap-1">
              <ShoppingBag size={12} />
              {items.length} item · {totalQty} pcs
            </span>
            {sizes.length > 0 && (
              <span className="flex items-center gap-1">
                <Hash size={12} />
                {sizes.join(', ')}
              </span>
            )}
            {colors.length > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                {colors.join(', ')}
              </span>
            )}
          </div>
        </div>

        <p className="font-bold text-fire text-lg whitespace-nowrap">{formatRupiah(order.total_price)}</p>
      </div>
    </div>
  );
}

function OrderDetailSection({ order }) {
  const items = order.items || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-fire text-[11px] tracking-[1px] uppercase mb-4 font-semibold">Detail Pesanan</h3>

      {/* Customer info */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-ink rounded-lg p-3">
          <p className="text-gray text-[11px] mb-0.5">Nama</p>
          <p className="text-white text-[13px] font-medium">{order.customer_name}</p>
        </div>
        <div className="bg-ink rounded-lg p-3">
          <p className="text-gray text-[11px] mb-0.5">Telepon</p>
          <p className="text-white text-[13px] font-medium">{order.phone}</p>
        </div>
        <div className="bg-ink rounded-lg p-3">
          <p className="text-gray text-[11px] mb-0.5">Pengiriman</p>
          <p className="text-white text-[13px] font-medium flex items-center gap-1.5">
            {order.delivery_method === 'pickup' ? (
              <><MapPin size={12} /> Ambil Sendiri</>
            ) : (
              <><Truck size={12} /> Dikirim</>
            )}
          </p>
        </div>
        {order.address && (
          <div className="bg-ink rounded-lg p-3 col-span-2">
            <p className="text-gray text-[11px] mb-0.5">Alamat</p>
            <p className="text-white text-[13px] font-medium">{order.address}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="bg-ink rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">
                  {item.product_name || item.service?.name || '-'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {item.size && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-fire/10 text-fire text-[11px] font-semibold rounded">
                      {item.size}
                    </span>
                  )}
                  {item.selected_color && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded">
                      {item.selected_color}
                    </span>
                  )}
                  {item.sablon_type && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-border/30 text-gray text-[11px] rounded">
                      {item.sablon_type}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 bg-ink text-gray text-[11px] rounded border border-border">
                    × {item.quantity}
                  </span>
                </div>
              </div>
              <p className="text-primary font-semibold text-[13px] whitespace-nowrap">{formatRupiah(item.subtotal)}</p>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-white font-semibold text-[14px]">Total</span>
          <span className="text-primary font-bold text-lg">{formatRupiah(order.total_price)}</span>
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ order, onCancelSuccess }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process'].includes(order.status);
  const paymentRejected = order.payment_status === 'rejected';
  const totalPaid = order.paid_amount
    ? parseFloat(order.paid_amount)
    : (order.payments || [])
        .filter(p => p.payment_status === 'verified' || p.payment_status === 'paid' || p.payment_status === 'dp')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = order.remaining_amount !== undefined
    ? parseFloat(order.remaining_amount)
    : Math.max(order.total_price - totalPaid, 0);
  const hasDP = (order.payments || []).some(p => p.payment_type === 'dp' && (p.payment_status === 'verified' || p.payment_status === 'dp'));
  const needsPelunasan = remaining > 0 && hasDP && ['ready_for_pickup', 'completed'].includes(order.status);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.requestCancel(order.id);
      setShowCancelDialog(false);
      if (onCancelSuccess) onCancelSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        {(order.status === 'waiting_payment' || paymentRejected) && (
          <Link
            to={`/pesan/pembayaran/${order.order_code}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <CreditCard className="w-4 h-4" /> {paymentRejected ? 'Upload Ulang' : 'Bayar Sekarang'}
          </Link>
        )}
        {paymentRejected && (
          <div className="w-full p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Pembayaran ditolak. Silakan upload ulang bukti pembayaran.
          </div>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-red-500/50 text-red-400 font-semibold rounded-xl hover:bg-red-500/10 transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <Ban className="w-4 h-4" /> Batalkan
          </button>
        )}
        <a
          href={`https://wa.me/6281234567890?text=Halo%20Dreamcatcher%2C%20saya%20ingin%20menanyakan%20pesanan%20%23${order.order_code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
        >
          <MessageCircle className="w-4 h-4" /> Hubungi Admin
        </a>
      </div>

      {needsPelunasan && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-amber-400 font-semibold text-sm">Sisa Pembayaran: {formatRupiah(remaining)}</p>
              <p className="text-gray-light text-xs mt-1">Silakan lunasi sisa pembayaran DP Anda.</p>
              <Link
                to={`/pesan/pembayaran/${order.order_code}?type=pelunasan`}
                className="inline-flex items-center gap-2 mt-3 bg-amber-400 text-ink font-semibold py-2 px-4 rounded-lg hover:bg-amber-300 transition-colors text-[12px] uppercase tracking-[1px]"
              >
                <CreditCard className="w-3.5 h-3.5" /> Lunasi Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Batalkan Pesanan"
        message="Apakah Anda yakin ingin membatalkan pesanan ini? Permintaan akan dikirim ke admin untuk dikonfirmasi."
        confirmLabel="Ya, Batalkan"
        variant="danger"
        loading={cancelling}
      />
    </>
  );
}

function TrackingView({ order, onRefresh }) {
  return (
    <div className="space-y-5">
      {/* Progress Bar */}
      <ScrollReveal>
        <ProgressBar status={order.status} />
      </ScrollReveal>

      {/* Order Summary */}
      <ScrollReveal delay={100}>
        <OrderSummaryCard order={order} />
      </ScrollReveal>

      {/* Vertical Timeline */}
      <ScrollReveal delay={200}>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-fire text-[11px] tracking-[1px] uppercase mb-5 font-semibold">Status Pesanan</h3>
          <VerticalTimeline status={order.status} />
        </div>
      </ScrollReveal>

      {/* Order Details */}
      <ScrollReveal delay={300}>
        <OrderDetailSection order={order} />
      </ScrollReveal>

      {/* Action Buttons */}
      <ScrollReveal delay={400}>
        <ActionButtons order={order} onCancelSuccess={onRefresh} />
      </ScrollReveal>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="space-y-5">
      {/* Progress skeleton */}
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="flex justify-between mb-2">
          <div className="h-3 w-24 bg-border/50 rounded" />
          <div className="h-3 w-8 bg-border/50 rounded" />
        </div>
        <div className="h-1.5 w-full bg-border/30 rounded-full" />
      </div>

      {/* Summary skeleton */}
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-[14px] bg-border/30" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-border/50 rounded" />
            <div className="h-3 w-48 bg-border/30 rounded" />
            <div className="h-3 w-36 bg-border/30 rounded" />
          </div>
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="h-3 w-32 bg-border/50 rounded mb-5" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 pb-5 last:pb-0">
            <div className="w-10 h-10 rounded-full bg-border/30" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-36 bg-border/50 rounded" />
              <div className="h-2.5 w-56 bg-border/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <ScrollReveal>
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-fire/10 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-fire" />
        </div>
        <h3 className="font-heading text-[28px] text-white tracking-[1px] mb-2">PESANAN TIDAK DITEMUKAN</h3>
        <p className="text-gray text-[13px] mb-6 max-w-sm mx-auto">
          Pastikan kode pesanan dan nomor telepon sudah benar. Atau hubungi admin untuk bantuan.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
          >
            Coba Lagi
          </button>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Dreamcatcher%2C%20saya%20butuh%20bantuan%20melacak%20pesanan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <MessageCircle className="w-4 h-4" /> Hubungi Admin
          </a>
        </div>
      </div>
    </ScrollReveal>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <ScrollReveal>
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <p className="text-danger mb-4 font-medium text-[14px]">{message}</p>
        <button
          onClick={onRetry}
          className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
        >
          Coba Lagi
        </button>
      </div>
    </ScrollReveal>
  );
}

function GuestTrackForm() {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderCode.trim() || !phone.trim()) {
      setError('Masukkan kode pesanan dan nomor HP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await orderService.track(orderCode.trim(), phone.trim());
      setOrder(response.order);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Pesanan tidak ditemukan. Periksa kode dan nomor HP.');
      setOrder(null);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshOrder = async () => {
    if (!order) return;
    try {
      const response = await orderService.track(orderCode.trim(), phone.trim());
      setOrder(response.order);
    } catch (err) {
      // silent
    }
  };

  const handleReset = () => {
    setOrder(null);
    setError(null);
    setHasSearched(false);
  };

  if (order) {
    return <TrackingView order={order} onRefresh={handleRefreshOrder} />;
  }

  return (
    <>
      {/* Search Form */}
      <ScrollReveal>
        <div className="bg-card border border-border rounded-xl p-8 relative overflow-hidden mb-8">
          <div className="graffiti-deco">LACAK</div>

          {/* Lock badge */}
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink border border-border flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-gray" />
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-heading text-[24px] text-white tracking-[1px] mb-1">LACAK PESANAN</h2>
            <p className="text-gray text-[13px]">Masukkan kode pesanan dan nomor HP Anda</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[1px] text-fire font-semibold mb-1.5 block">Kode Pesanan</label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="DC20241215XXXX"
                  className="w-full pl-10 pr-4 py-3.5 bg-ink border border-border rounded-xl text-[14px] text-white font-mono tracking-wider placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[1px] text-fire font-semibold mb-1.5 block">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-4 py-3.5 bg-ink border border-border rounded-xl text-[14px] text-white placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>
            </div>

            {error && !order && hasSearched && (
              <div className="p-3 bg-danger/10 rounded-xl text-danger text-[13px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px] disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mencari...</>
              ) : (
                <><Search className="w-4 h-4" /> Lacak Pesanan</>
              )}
            </button>
          </form>
        </div>
      </ScrollReveal>

      {/* Results */}
      {loading && <SkeletonView />}
      {!loading && error && hasSearched && !order && <EmptyState onReset={handleReset} />}
    </>
  );
}

function AuthenticatedTrack() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll();
      const allOrders = data.orders?.data || data.orders || [];
      const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      setOrders(activeOrders);
    } catch (err) {
      setError('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshOrder = async (orderCode) => {
    try {
      const data = await orderService.getAll();
      const allOrders = data.orders?.data || data.orders || [];
      setOrders(allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled'));
    } catch (err) {
      // silent
    }
  };

  if (loading) {
    return <SkeletonView />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOrders} />;
  }

  if (orders.length === 0) {
    return (
      <ScrollReveal>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading text-[28px] text-white tracking-[1px] mb-2">BELUM ADA PESANAN</h3>
          <p className="text-gray text-[13px] mb-6">Mulai pesan sekarang untuk melihat pesanan Anda di sini</p>
          <Link
            to="/pesan"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-8 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <ShoppingBag className="w-4 h-4" /> Buat Pesanan
          </Link>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, index) => (
        <ScrollReveal key={order.id} delay={index * 80}>
          <div className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-primary/30">
            {/* Clickable header */}
            <div
              className="p-5 cursor-pointer select-none"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[15px] text-primary font-bold tracking-wider">#{order.order_code}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-primary text-lg whitespace-nowrap">{formatRupiah(order.total_price)}</p>
                  {expandedId === order.id ? (
                    <ChevronUp className="w-5 h-5 text-gray" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray" />
                  )}
                </div>
              </div>

              {/* Mini timeline */}
              <div className="flex items-center gap-1">
                {order.status === 'cancel_requested' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-orange-400 text-[11px] font-medium">Menunggu Pembatalan</span>
                  </div>
                ) : order.status === 'cancelled' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="text-red-400 text-[11px] font-medium">Dibatalkan</span>
                  </div>
                ) : (
                  statusSteps.map((step, i) => {
                    const stepIdx = statusOrder.indexOf(step.key);
                    const curIdx = statusOrder.indexOf(order.status);
                    const done = stepIdx < curIdx;
                    const cur = stepIdx === curIdx;
                    return (
                      <div key={step.key} className="flex items-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            done ? 'bg-primary' : cur ? 'bg-primary animate-pulse' : 'bg-border/50'
                          }`}
                          title={step.label}
                        />
                        {i < statusSteps.length - 1 && (
                          <div className={`w-4 h-0.5 ${done ? 'bg-primary' : 'bg-border/30'}`} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expanded content */}
            {expandedId === order.id && (
              <div className="px-5 pb-5 animate-fade-in">
                <div className="border-t border-border pt-4">
                  <TrackingView order={order} onRefresh={() => handleRefreshOrder(order.order_code)} />
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

export default function TrackOrderPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 w-full px-[5%] py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 relative">
            <div className="graffiti-deco">LACAK</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; lacak pesanan</div>
              <h1 className="font-heading text-[36px] text-ink tracking-[1px] mb-2">LACAK PESANAN</h1>
              <div className="divider mx-auto"></div>
              <p className="text-gray text-[14px] max-w-md mx-auto">
                {isAuthenticated
                  ? 'Pantau status pesanan Anda secara real-time'
                  : 'Masukkan kode pesanan dan nomor HP untuk melacak status'}
              </p>
            </ScrollReveal>
          </div>

          {isAuthenticated ? <AuthenticatedTrack /> : <GuestTrackForm />}
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
