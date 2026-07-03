import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatRupiah } from '../utils/formatRupiah';
import {
  CheckCircle, Clock, Package, CreditCard, Search, Filter, ShoppingBag,
  ClipboardList, Loader, PartyPopper, XCircle, Phone, Hash, Lock,
  Truck, MapPin, MessageCircle, AlertTriangle, SearchX, Loader2,
  ChevronDown, ChevronUp, Image as ImageIcon, Ban, Star, Upload, X
} from 'lucide-react';
import api from '../services/api';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${baseUrl}/${path}`;
};

const statusSteps = [
  { key: 'pending', label: 'Pesanan Diterima', description: 'Pesanan Anda sudah diterima dan menunggu konfirmasi dari admin.', icon: ClipboardList },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', description: 'Silakan lakukan pembayaran dalam 24 jam.', icon: CreditCard },
  { key: 'paid', label: 'Pembayaran Terverifikasi', description: 'Pembayaran telah dikonfirmasi. Pesanan segera diproses.', icon: CheckCircle },
  { key: 'processed', label: 'Sedang Diproses', description: 'Tim sedang mengerjakan pesanan Anda. Estimasi 3-5 hari kerja.', icon: Loader },
  { key: 'delivered', label: 'Dikirim / Siap Diambil', description: 'Pesanan sedang dikirim atau siap diambil di toko.', icon: Truck },
  { key: 'completed', label: 'Selesai', description: 'Pesanan telah selesai dan diterima dengan baik.', icon: PartyPopper },
];

const statusOrder = ['pending', 'waiting_payment', 'paid', 'processed', 'delivered', 'completed'];

function getProgressPercent(status) {
  const idx = statusOrder.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / statusSteps.length) * 100);
}

function VerticalTimeline({ status, deliveryMethod }) {
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
          <p className="text-orange-400/60 text-[12px]">Menunggu konfirmasi dari admin</p>
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
            {!isLast && (
              <div className="absolute left-[19px] top-[40px] bottom-0 w-0.5 bg-border/40">
                {isCompleted && <div className="w-full h-full bg-primary" />}
                {isCurrent && <div className="w-full h-1/2 bg-gradient-to-b from-primary to-transparent" />}
              </div>
            )}
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 transition-all ${
              isCompleted
                ? 'bg-primary text-ink shadow-lg shadow-primary/20'
                : isCurrent
                ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse-glow'
                : 'bg-ink text-gray border border-border'
            }`}>
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className={`text-[15px] font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-gray'}`}>
                {step.label}
              </p>
              <p className={`text-[12px] mt-1 leading-relaxed ${isCurrent ? 'text-gray-light' : isFuture ? 'text-gray-medium/80' : 'text-gray-light'}`}>
                {step.key === 'delivered' && deliveryMethod
                  ? deliveryMethod === 'pickup'
                    ? 'Pesanan siap diambil di toko. Silakan datang ke toko kami.'
                    : 'Pesanan sedang dikirim ke alamat Anda. Silakan pantau ekspedisi.'
                  : step.description
                }
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
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] text-gray-light">Step {currentIndex + 1} dari {statusSteps.length}</p>
        <p className="text-[13px] text-primary font-semibold">{percent}%</p>
      </div>
      <div className="track-progress-bar">
        <div className="track-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {currentStep && <p className="text-[12px] text-gray-light mt-2">{currentStep.label}</p>}
    </div>
  );
}

function OrderDetailSection({ order }) {
  const items = order.items || [];

  return (
    <div className="mt-4 space-y-4">
      <div>
        <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Detail Pemesan</h4>
        <div className="grid grid-cols-2 gap-2 text-[13px]">
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray text-[11px] mb-0.5">Nama</p>
            <p className="text-white font-medium">{order.customer_name}</p>
          </div>
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray text-[11px] mb-0.5">Telepon</p>
            <p className="text-white font-medium">{order.phone}</p>
          </div>
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray text-[11px] mb-0.5">Pengiriman</p>
            <p className="text-white font-medium flex items-center gap-1.5">
              {order.delivery_method === 'pickup' ? <><MapPin size={12} /> Ambil Sendiri</> : <><Truck size={12} /> Dikirim</>}
            </p>
          </div>
          {order.address && (
            <div className="bg-ink rounded-lg p-3 col-span-2">
              <p className="text-gray text-[11px] mb-0.5">Alamat</p>
              <p className="text-white font-medium">{order.address}</p>
            </div>
          )}
        </div>
      </div>

      {order.description && (
        <div>
          <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Deskripsi Pesanan</h4>
          <div className="bg-ink rounded-lg p-3">
            <p className="text-gray-light text-[13px] leading-relaxed whitespace-pre-wrap">{order.description}</p>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Item Pesanan</h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-ink rounded-lg p-3">
              <div className="flex items-start gap-3">
                {item.design?.image_url && (
                  <img
                    src={getImageUrl(item.design.image_url)}
                    alt="Desain"
                    className="w-14 h-14 object-contain bg-ink rounded-lg border border-border flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-medium mb-1">{item.product_name || item.service?.name || '-'}</p>
                  <p className="text-gray-light text-[11px] leading-relaxed">
                    {[
                      item.size && `Ukuran ${item.size}`,
                      item.selected_color && `Warna ${item.selected_color}`,
                      item.sablon_type && `Sablon ${item.sablon_type}`,
                      item.print_area && `Posisi ${item.print_area.replace(/_/g, ' ')}`,
                      item.print_size && item.print_size,
                      item.quantity && `${item.quantity} pcs`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <p className="text-primary font-semibold text-[13px] whitespace-nowrap">{formatRupiah(item.subtotal)}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-white font-semibold text-[13px]">Total</span>
            <span className="text-primary font-bold text-lg">{formatRupiah(order.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialForm({ order, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('order_id', order.id);
      data.append('rating', rating);
      data.append('review', review);
      if (imageFile) data.append('image', imageFile);

      await api.post('/testimonials', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengirim testimoni');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-heading text-xl font-bold text-white">Beri Testimoni</h3>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-xl">
            <X className="w-5 h-5 text-gray-light" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-light text-sm">
            Pesanan <span className="text-primary font-mono font-bold">#{order.order_code}</span>
          </p>

          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)}>
                  <Star
                    className={`w-8 h-8 transition-colors ${i <= rating ? 'text-amber-400' : 'text-gray-dark hover:text-gray-light'}`}
                    fill={i <= rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="input-dark min-h-[100px] resize-none"
              placeholder="Ceritakan pengalaman Anda..."
            />
          </div>

          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Foto (Opsional)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files[0];
              if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
            }} className="hidden" />
            <div className="flex gap-3 items-center">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-dark border border-border text-gray-light hover:text-white text-sm font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" /> Pilih Foto
              </button>
              {imagePreview && <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border" />}
            </div>
          </div>

          <p className="text-gray-dark text-xs">Testimoni akan ditinjau admin sebelum tampil di halaman utama.</p>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : 'Kirim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionButtons({ order, onCancelSuccess, onTestimonialSuccess }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = ['pending', 'waiting_payment'].includes(order.status);

  const totalPaid = order.payments
    ?.filter(p => p.payment_status === 'verified')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const hasDP = order.payments?.some(p => p.payment_type === 'dp' && p.payment_status === 'verified');
  const needsPelunasan = order.status === 'completed' && hasDP && remaining > 0;

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
      <div className="flex gap-3 mt-4">
        {order.status === 'waiting_payment' && (
          <Link
            to={`/pesan/pembayaran/${order.order_code}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <CreditCard className="w-4 h-4" /> Bayar Sekarang
          </Link>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-500/50 text-red-400 font-semibold rounded-xl hover:bg-red-500/10 transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <Ban className="w-4 h-4" /> Batalkan
          </button>
        )}
        <a
          href={`https://wa.me/6281234567890?text=Halo%20Dreamcatcher%2C%20saya%20ingin%20menanyakan%20pesanan%20%23${order.order_code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
        >
          <MessageCircle className="w-4 h-4" /> Hubungi Admin
        </a>
        {order.status === 'completed' && (
          <button
            onClick={() => setShowTestimonial(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-amber-400/50 text-amber-400 font-semibold rounded-xl hover:bg-amber-400/10 transition-colors text-[13px] uppercase tracking-[1px]"
          >
            <Star className="w-4 h-4" /> Beri Testimoni
          </button>
        )}
      </div>

      {needsPelunasan && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-amber-400 font-semibold text-sm">Sisa Pembayaran: {formatRupiah(remaining)}</p>
              <p className="text-gray-light text-xs mt-1">Pesanan sudah selesai. Silakan lunasi sisa pembayaran DP Anda.</p>
              <Link
                to={`/pesan/pembayaran/${order.order_code}`}
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

      {showTestimonial && (
        <TestimonialForm
          order={order}
          onClose={() => setShowTestimonial(false)}
          onSuccess={() => {
            setShowTestimonial(false);
            if (onTestimonialSuccess) onTestimonialSuccess();
          }}
        />
      )}
    </>
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
    } catch (err) { /* silent */ }
  };

  const handleReset = () => {
    setOrder(null);
    setError(null);
    setHasSearched(false);
  };

  if (order) {
    return (
      <div className="space-y-5">
        <ProgressBar status={order.status} />
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-[14px] bg-ink border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
              {(() => {
                const items = order.items || [];
                const firstDesign = items.find(i => i.design?.image_url)?.design?.image_url;
                if (firstDesign) {
                  return <img src={getImageUrl(firstDesign)} alt="Desain" className="w-full h-full object-contain" />;
                }
                return <ImageIcon className="w-8 h-8 text-gray/40" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[16px] text-primary font-bold tracking-wider">#{order.order_code}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-[12px] text-gray-light mb-2">
                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex items-center gap-3 text-[12px] text-gray-light flex-wrap">
                <span className="flex items-center gap-1"><ShoppingBag size={12} /> {(order.items || []).length} item</span>
              </div>
            </div>
            <p className="font-bold text-fire text-lg whitespace-nowrap">{formatRupiah(order.total_price)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-fire text-[11px] tracking-[1px] uppercase mb-5 font-semibold">Status Pesanan</h3>
          <VerticalTimeline status={order.status} />
        </div>
        <OrderDetailSection order={order} />
        <ActionButtons order={order} onCancelSuccess={handleRefreshOrder} />
      </div>
    );
  }

  return (
    <>
      <ScrollReveal>
        <div className="bg-card border border-border rounded-xl p-8 relative overflow-hidden mb-8">
          <div className="graffiti-deco">LACAK</div>
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink border border-border flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-gray" />
          </div>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-heading text-[24px] text-white tracking-[1px] mb-1">LACAK PESANAN</h2>
            <p className="text-gray-light text-[13px]">Masukkan kode pesanan dan nomor HP Anda</p>
          </div>
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[1px] text-fire font-semibold mb-1.5 block">Kode Pesanan</label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input type="text" value={orderCode} onChange={(e) => setOrderCode(e.target.value.toUpperCase())} placeholder="DC20241215XXXX"
                  className="w-full pl-10 pr-4 py-3.5 bg-ink border border-border rounded-xl text-[14px] text-white font-mono tracking-wider placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[1px] text-fire font-semibold mb-1.5 block">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890"
                  className="w-full pl-10 pr-4 py-3.5 bg-ink border border-border rounded-xl text-[14px] text-white placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors" />
              </div>
            </div>
            {error && !order && hasSearched && (
              <div className="p-3 bg-danger/10 rounded-xl text-danger text-[13px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px] disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mencari...</> : <><Search className="w-4 h-4" /> Lacak Pesanan</>}
            </button>
          </form>
        </div>
      </ScrollReveal>
      {loading && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="flex justify-between mb-2"><div className="h-3 w-24 bg-border/50 rounded" /><div className="h-3 w-8 bg-border/50 rounded" /></div>
            <div className="h-1.5 w-full bg-border/30 rounded-full" />
          </div>
          <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="flex gap-4"><div className="w-20 h-20 rounded-[14px] bg-border/30" /><div className="flex-1 space-y-2"><div className="h-4 w-32 bg-border/50 rounded" /><div className="h-3 w-48 bg-border/30 rounded" /></div></div>
          </div>
        </div>
      )}
      {!loading && error && hasSearched && !order && (
        <ScrollReveal>
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-fire/10 flex items-center justify-center mx-auto mb-6">
              <SearchX className="w-10 h-10 text-fire" />
            </div>
            <h3 className="font-heading text-[28px] text-white tracking-[1px] mb-2">PESANAN TIDAK DITEMUKAN</h3>
            <p className="text-gray text-[13px] mb-6 max-w-sm mx-auto">Pastikan kode pesanan dan nomor telepon sudah benar.</p>
            <button onClick={handleReset} className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">Coba Lagi</button>
          </div>
        </ScrollReveal>
      )}
    </>
  );
}

const filterTabs = [
  { key: 'all', label: 'Semua' },
  { key: 'waiting_payment', label: 'Menunggu Bayar' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Lunas' },
  { key: 'processed', label: 'Diproses' },
  { key: 'delivered', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancel_requested', label: 'Pembatalan' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

function OrderCard({ order, onRefresh }) {
  const [showDetail, setShowDetail] = useState(false);
  const items = order.items || [];
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map(i => i.size).filter(Boolean))];
  const colors = [...new Set(items.map(i => i.selected_color).filter(Boolean))];

  const totalPaid = order.payments
    ?.filter(p => p.payment_status === 'verified')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const isFullyPaid = remaining === 0;
  const isCompleted = order.status === 'completed';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <div className="p-5 cursor-pointer select-none" onClick={() => setShowDetail(!showDetail)}>
        <div className="flex items-start gap-3">
          {(() => {
            const firstDesign = items.find(i => i.design?.image_url)?.design?.image_url;
            if (!firstDesign) return null;
            return (
              <img
                src={getImageUrl(firstDesign)}
                alt="Desain"
                className="w-12 h-12 object-contain bg-ink rounded-lg border border-border flex-shrink-0 mt-0.5"
              />
            );
          })()}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[15px] text-primary font-bold tracking-wider">#{order.order_code}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-primary text-lg whitespace-nowrap">{formatRupiah(order.total_price)}</p>
                {showDetail ? <ChevronUp className="w-5 h-5 text-gray" /> : <ChevronDown className="w-5 h-5 text-gray" />}
              </div>
            </div>
            {order.description && (
              <p className="text-[12px] text-gray-light leading-relaxed mb-2 line-clamp-2">{order.description}</p>
            )}
            <div className="flex items-center gap-3 text-[12px] text-gray-light mb-3 flex-wrap">
              <span className="flex items-center gap-1"><Icon name="calendar" size={12} />{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><ShoppingBag size={12} />{itemCount} item · {totalQty} pcs</span>
              {sizes.length > 0 && <span className="flex items-center gap-1"><Icon name="tag" size={12} />{sizes.join(', ')}</span>}
              {colors.length > 0 && <span className="flex items-center gap-1"><Icon name="palette" size={12} />{colors.join(', ')}</span>}
            </div>
            <div className="flex items-center gap-1">
              {order.status === 'cancel_requested' ? (
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" /><span className="text-orange-400 text-[11px] font-medium">Menunggu Pembatalan</span></div>
              ) : order.status === 'cancelled' ? (
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-red-400 text-[11px] font-medium">Dibatalkan</span></div>
              ) : (
                statusSteps.map((step, i) => {
                  const stepIdx = statusOrder.indexOf(step.key);
                  const curIdx = statusOrder.indexOf(order.status);
                  const done = stepIdx < curIdx;
                  const cur = stepIdx === curIdx;
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-primary' : cur ? 'bg-primary animate-pulse' : 'bg-border/50'}`} title={step.label} />
                      {i < statusSteps.length - 1 && <div className={`w-4 h-0.5 ${done ? 'bg-primary' : 'bg-border/30'}`} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="px-5 pb-5 animate-fade-in border-t border-border pt-4">
          {isCompleted && isFullyPaid && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-6 mb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-heading text-[20px] text-white tracking-[1px] mb-2">PESANAN TELAH SELESAI</h3>
              <p className="text-success text-[13px] mb-1">Pesanan telah diambil dan diterima dengan baik.</p>
              <p className="text-success/80 text-[12px]">Pembayaran telah lunas. Terima kasih!</p>
            </div>
          )}
          {order.status === 'delivered' && (
            <div className="bg-info/10 border border-info/30 rounded-xl p-5 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-info" />
                </div>
                <div>
                  {order.delivery_method === 'pickup' ? (
                    <>
                      <p className="text-info font-semibold text-[14px]">Pesanan Siap Diambil</p>
                      <p className="text-gray-light text-[12px] mt-1">Silakan datang ke toko kami untuk mengambil pesanan. Bawa bukti kode pesanan.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-info font-semibold text-[14px]">Pesanan Sedang Dikirim</p>
                      <p className="text-gray-light text-[12px] mt-1">Pesanan Anda sedang dalam perjalanan. Silakan pantau status pengiriman.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <ProgressBar status={order.status} />
          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <h3 className="text-fire text-[11px] tracking-[1px] uppercase mb-5 font-semibold">Status Pesanan</h3>
            <VerticalTimeline status={order.status} deliveryMethod={order.delivery_method} />
          </div>
          <OrderDetailSection order={order} />
          <ActionButtons order={order} onCancelSuccess={onRefresh} onTestimonialSuccess={onRefresh} />
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll();
      setOrders(data.orders?.data || data.orders || []);
    } catch {
      setError('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeFilter !== 'all') result = result.filter(o => o.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => o.order_code?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q));
    }
    return result;
  }, [orders, activeFilter, searchQuery]);

  const filterCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const handleFilterChange = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'all') params.delete('filter'); else params.set('filter', key);
    setSearchParams(params);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <main className="flex-1 w-full px-[5%] py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10 relative">
              <div className="graffiti-deco">PESANAN</div>
              <ScrollReveal>
                <div className="section-tag">&mdash; pesanan saya</div>
                <h1 className="font-heading text-[36px] text-ink tracking-[1px] mb-2">PESANAN SAYA</h1>
                <div className="divider mx-auto"></div>
                <p className="text-gray text-[14px] max-w-md mx-auto">Masukkan kode pesanan dan nomor HP untuk melacak status</p>
              </ScrollReveal>
            </div>
            <GuestTrackForm />
          </div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 w-full px-[5%] py-12">
        <div className="text-center mb-10 relative">
          <div className="graffiti-deco">MY ORDERS</div>
          <ScrollReveal>
            <div className="section-tag">&mdash; pesanan saya</div>
            <h1 className="font-heading text-[36px] text-ink tracking-[1px] mb-2">PESANAN SAYA</h1>
            <div className="divider mx-auto"></div>
            <p className="text-gray text-[14px] max-w-md mx-auto">Kelola dan lacak semua pesanan Anda di satu tempat</p>
          </ScrollReveal>
        </div>

        {loading ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2"><div className="h-4 w-32 bg-border/50 rounded" /><div className="flex gap-2"><div className="h-3 w-20 bg-border/50 rounded" /><div className="h-3 w-16 bg-border/50 rounded" /></div></div>
                  <div className="h-5 w-24 bg-border/50 rounded" />
                </div>
                <div className="flex gap-1 mt-3">{[...Array(5)].map((_, j) => <div key={j} className="w-8 h-8 rounded-full bg-border/30" />)}</div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ScrollReveal>
            <div className="max-w-md mx-auto bg-card border border-border p-10 text-center rounded-xl">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="alert-triangle" size={32} className="text-danger" />
              </div>
              <p className="text-danger mb-4 font-medium">{error}</p>
              <button onClick={fetchOrders} className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">Coba Lagi</button>
            </div>
          </ScrollReveal>
        ) : orders.length === 0 ? (
          <ScrollReveal>
            <div className="max-w-md mx-auto bg-card border border-border p-12 text-center rounded-xl">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-heading text-[24px] text-white tracking-[1px] mb-2">Belum Ada Pesanan</h3>
              <p className="text-gray-light mb-6 text-[13px]">Mulai pesan sekarang untuk melihat pesanan Anda di sini</p>
              <Link to="/pesan" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-8 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
                <Icon name="plus" size={18} /> Buat Pesanan
              </Link>
            </div>
          </ScrollReveal>
        ) : (
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari kode pesanan atau nama..."
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-[13px] text-white placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors" />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-5 scrollbar-hide">
                {filterTabs.map((tab) => {
                  const count = filterCounts[tab.key] || 0;
                  if (tab.key !== 'all' && count === 0) return null;
                  return (
                    <button key={tab.key} onClick={() => handleFilterChange(tab.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all border ${activeFilter === tab.key ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card border-border text-gray hover:text-white hover:border-primary/30'}`}>
                      {tab.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${activeFilter === tab.key ? 'bg-white/20' : 'bg-border/50'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Filter className="w-10 h-10 text-gray mx-auto mb-3" />
                <p className="text-gray-light text-[13px]">Tidak ada pesanan ditemukan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <ScrollReveal key={order.id} direction="up" delay={index * 80}>
                    <OrderCard order={order} onRefresh={fetchOrders} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
