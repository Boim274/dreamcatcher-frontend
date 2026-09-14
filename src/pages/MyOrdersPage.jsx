import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { StatusBadge } from '../components/common/StatusBadge';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TestimonialForm from '../components/orders/TestimonialForm';
import { formatRupiah } from '../utils/formatRupiah';
import { waLink } from '../constants/whatsapp';
import {
  CheckCircle, Clock, Package, CreditCard, Search, Filter, ShoppingBag,
  PartyPopper, XCircle, Phone, Hash, Lock,
  Truck, MapPin, MessageCircle, AlertTriangle, SearchX, Loader2,
  ChevronDown, ChevronUp, Image as ImageIcon, Ban, Star, Upload, X, Copy, Check,
  ZoomIn, ExternalLink, Sparkles, Palette
} from 'lucide-react';
import { getImageUrl } from '../utils/getImageUrl';
import { getStatusSteps, getFilterTabs, statusOrder, getProgressPercent } from '../utils/orderStatus';

function VerticalTimeline({ status, deliveryMethod }) {
  const { language } = useLanguageStore();
  const statusSteps = getStatusSteps(language);
  const currentIndex = statusOrder.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 py-4 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/25">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0 shadow-lg shadow-rose-950/40">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-rose-400 text-sm font-bold tracking-wide font-heading">
            {language === 'en' ? 'ORDER CANCELLED' : 'PESANAN DIBATALKAN'}
          </p>
          <p className="text-rose-300/80 text-xs mt-0.5">
            {language === 'en' ? 'This order has been cancelled.' : 'Pesanan ini telah dibatalkan.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'cancel_requested') {
    return (
      <div className="flex items-center gap-4 py-4 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 animate-pulse shadow-lg shadow-amber-950/40">
          <Ban className="w-5 h-5" />
        </div>
        <div>
          <p className="text-amber-400 text-sm font-bold tracking-wide font-heading">
            {language === 'en' ? 'AWAITING CANCELLATION CONFIRMATION' : 'MENUNGGU KONFIRMASI PEMBATALAN'}
          </p>
          <p className="text-amber-300/80 text-xs mt-0.5">
            {language === 'en' ? 'Cancellation request is being reviewed by studio admin.' : 'Permintaan pembatalan sedang ditinjau oleh admin studio.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-1">
      {statusSteps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isFuture = stepIndex > currentIndex;
        const isLast = index === statusSteps.length - 1;

        return (
          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0 group">
            {!isLast && (
              <div className="absolute left-[19px] top-[38px] bottom-0 w-[2px] bg-white/10">
                {isCompleted && <div className="w-full h-full bg-gradient-to-b from-primary to-[#ff60a8]" />}
                {isCurrent && <div className="w-full h-1/2 bg-gradient-to-b from-primary to-transparent animate-pulse" />}
              </div>
            )}
            <div
              className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center z-10 transition-all duration-300 ${
                isCompleted
                  ? 'bg-gradient-to-tr from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30'
                  : isCurrent
                  ? 'bg-primary/20 text-primary border-2 border-primary shadow-[0_0_15px_rgba(236,74,150,0.5)] ring-4 ring-primary/10'
                  : 'bg-white/5 text-zinc-500 border border-white/10'
              }`}
            >
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-heading font-bold tracking-wide ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse uppercase tracking-wider">
                    {language === 'en' ? 'Active Step' : 'Tahap Aktif'}
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  isCurrent ? 'text-zinc-200' : isFuture ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {step.key === 'ready_for_pickup' && deliveryMethod
                  ? deliveryMethod === 'pickup'
                    ? (language === 'en' ? 'Order is ready for pickup at Dreamcatcher studio. Please arrive with your order code.' : 'Pesanan siap diambil di studio Dreamcatcher. Silakan datang dengan menunjukkan kode pesanan.')
                    : (language === 'en' ? 'Order is being delivered to your address. Please track the shipment.' : 'Pesanan sedang dikirim ke alamat Anda. Silakan pantau pengiriman.')
                  : step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ status }) {
  const { language } = useLanguageStore();
  const statusSteps = getStatusSteps(language);
  const percent = getProgressPercent(status);
  const currentIndex = statusOrder.indexOf(status);
  const currentStep = statusSteps[currentIndex];

  if (status === 'cancelled' || status === 'cancel_requested') return null;

  return (
    <div className="mb-5 p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-xs font-semibold text-zinc-300">
            {language === 'en' ? 'Step' : 'Tahap'} <span className="text-white font-bold">{currentIndex + 1}</span> {language === 'en' ? 'of' : 'dari'} {statusSteps.length}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-gradient-primary">
          {percent}% {language === 'en' ? 'Completed' : 'Selesai'}
        </span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-[#ff60a8] to-emerald-400 transition-all duration-700 shadow-[0_0_12px_rgba(236,74,150,0.6)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      {currentStep && (
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[11px]">
          <span className="text-zinc-400">{language === 'en' ? 'Current Status:' : 'Status Saat Ini:'}</span>
          <span className="text-primary font-bold font-heading">{currentStep.label}</span>
        </div>
      )}
    </div>
  );
}

function CopyId({ id }) {
  const { language } = useLanguageStore();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(String(id));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-zinc-400 hover:text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
      title={language === 'en' ? 'Copy Product ID' : 'Salin ID Produk'}
    >
      {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
      <span className="text-[10px]">{copied ? (language === 'en' ? 'Copied' : 'Tersalin') : (language === 'en' ? 'Copy' : 'Salin')}</span>
    </button>
  );
}

function OrderDetailSection({ order }) {
  const { td, language } = useLanguageStore();
  const [lightboxImage, setLightboxImage] = useState(null);
  const items = order.items || [];

  const renderItemDetails = (item) =>
    [
      item.size && `${language === 'en' ? 'Size' : 'Ukuran'} ${item.size}`,
      item.selected_color && `${language === 'en' ? 'Color' : 'Warna'} ${td(item.selected_color)}`,
      item.sablon_type && `${language === 'en' ? 'Print' : 'Sablon'} ${td(item.sablon_type)}`,
      item.print_area && `${language === 'en' ? 'Position' : 'Posisi'} ${td(item.print_area.replace(/_/g, ' '))}`,
      item.print_size && `${language === 'en' ? 'Dimensions' : 'Dimensi'} ${item.print_size}`,
      item.quantity && `${item.quantity} pcs`,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="mt-5 space-y-5">
      {/* 1. Detail Pemesan & Pengiriman */}
      <div>
        <h4 className="font-heading text-xs text-primary font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
          <Icon name="user" size={14} /> {language === 'en' ? 'Customer & Delivery Details' : 'Detail Pemesan & Pengiriman'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
              {language === 'en' ? 'Customer Name' : 'Nama Pemesan'}
            </p>
            <p className="text-white font-semibold text-[13px]">{order.customer_name}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
              {language === 'en' ? 'WhatsApp / Phone Number' : 'Nomor WhatsApp / HP'}
            </p>
            <p className="text-white font-semibold text-[13px] font-mono">{order.phone}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
              {language === 'en' ? 'Delivery Method' : 'Metode Pengiriman'}
            </p>
            <p className="text-white font-semibold text-[13px] flex items-center gap-1.5">
              {order.delivery_method === 'pickup' ? (
                <>
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span>{language === 'en' ? 'Self Pickup at Studio' : 'Ambil Sendiri di Studio'}</span>
                </>
              ) : (
                <>
                  <Truck size={14} className="text-primary shrink-0" />
                  <span>{language === 'en' ? 'Shipped via Courier' : 'Dikirim via Ekspedisi'}</span>
                </>
              )}
            </p>
          </div>
          {order.address && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 sm:p-4 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                {language === 'en' ? 'Shipping Destination Address' : 'Alamat Tujuan Pengiriman'}
              </p>
              <p className="text-zinc-200 text-xs sm:text-[13px] leading-relaxed">{order.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Deskripsi / Catatan Khusus */}
      {order.description && (
        <div>
          <h4 className="font-heading text-xs text-primary font-bold tracking-wider uppercase mb-2 flex items-center gap-2">
            <Icon name="file-text" size={14} /> {language === 'en' ? 'Additional Notes' : 'Catatan Tambahan'}
          </h4>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5">
            <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{order.description}</p>
          </div>
        </div>
      )}

      {/* 3. Item Pesanan */}
      <div>
        <h4 className="font-heading text-xs text-primary font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
          <ShoppingBag size={14} /> {language === 'en' ? 'Clothing & Print Item Breakdown' : 'Rincian Item Pakaian & Sablon'}
        </h4>
        <div className="space-y-3">
          {items.map((item, idx) => {
            const itemImg = item.design?.image_url
              ? getImageUrl(item.design.image_url)
              : item.product?.images?.[0]?.image_url
              ? getImageUrl(item.product.images[0].image_url)
              : null;
            const isSablon = Boolean(item.service_id || item.sablon_type || item.design_type || item.design_id);
            const isAi = item.design_type === 'ai_generated' || item.design?.design_type === 'ai_generated';

            return (
              <div
                key={idx}
                className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl p-4 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  {item.product ? (
                    <>
                      {item.product.images?.[0]?.image_url && (
                        <div className="relative group/img shrink-0">
                          <img
                            src={getImageUrl(item.product.images[0].image_url)}
                            alt={item.product.name}
                            className="w-16 h-16 object-contain bg-[#120a16] rounded-xl border border-white/10 cursor-pointer hover:border-primary transition-all shadow-sm"
                            onClick={() => setLightboxImage(getImageUrl(item.product.images[0].image_url))}
                          />
                          <button
                            type="button"
                            onClick={() => setLightboxImage(getImageUrl(item.product.images[0].image_url))}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title={language === 'en' ? 'Enlarge Image' : 'Perbesar Gambar'}
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[13.5px] font-semibold leading-snug mb-1">
                          {td(item.product.name || item.product_name)}
                        </p>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-zinc-500 text-[10px] font-mono">ID: #{item.product.id}</span>
                          <CopyId id={item.product.id} />
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed">{renderItemDetails(item)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {itemImg ? (
                        <div className="relative group/img shrink-0">
                          <img
                            src={itemImg}
                            alt={language === 'en' ? 'Print Design' : 'Desain Sablon'}
                            className="w-16 h-16 object-contain bg-[#120a16] rounded-xl border border-white/10 cursor-pointer hover:border-primary transition-all shadow-sm"
                            onClick={() => setLightboxImage(itemImg)}
                            title={language === 'en' ? 'Click to enlarge design image' : 'Klik untuk memperbesar gambar desain'}
                          />
                          <button
                            type="button"
                            onClick={() => setLightboxImage(itemImg)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title={language === 'en' ? 'Enlarge' : 'Perbesar'}
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isSablon ? (
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0 text-zinc-400">
                          <Palette className="w-5 h-5 text-primary mb-0.5" />
                          <span className="text-[9px] uppercase font-bold text-zinc-500">{language === 'en' ? 'Print' : 'Sablon'}</span>
                        </div>
                      ) : null}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-white text-[13.5px] font-semibold">
                            {td(item.service?.name || item.product_name || (language === 'en' ? 'Printing Service' : 'Layanan Sablon'))}
                          </p>
                          {isSablon && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isAi
                                  ? 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/20'
                                  : 'text-primary bg-primary/10 border border-primary/20'
                              }`}
                            >
                              {isAi ? <Sparkles size={10} /> : <Upload size={10} />}
                              {isAi ? (language === 'en' ? 'AI Design' : 'Desain AI') : (language === 'en' ? 'Uploaded Design' : 'Desain Upload')}
                            </span>
                          )}
                        </div>

                        {item.design?.prompt && (
                          <p className="text-zinc-300 text-[11px] italic line-clamp-2 bg-black/40 p-2 rounded-xl border border-white/10 mb-1.5">
                            &ldquo;{item.design.prompt}&rdquo;
                          </p>
                        )}

                        <p className="text-zinc-400 text-xs leading-relaxed mb-1.5">
                          {renderItemDetails(item)}
                        </p>

                        {itemImg && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setLightboxImage(itemImg)}
                              className="text-[11px] text-primary hover:text-primary-light flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" /> {language === 'en' ? 'Enlarge Design' : 'Perbesar Desain'}
                            </button>
                            <span className="text-white/20">·</span>
                            <a
                              href={itemImg}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 no-underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> {language === 'en' ? 'New Tab' : 'Tab Baru'}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <p className="text-primary font-bold text-sm whitespace-nowrap shrink-0">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Ringkasan Total */}
          <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-3 px-1">
            <span className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">
              {language === 'en' ? 'Total Order Bill' : 'Total Tagihan Pesanan'}
            </span>
            <span className="text-gradient-primary font-heading font-bold text-xl sm:text-2xl">
              {formatRupiah(order.total_price)}
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            aria-label={language === 'en' ? 'Close' : 'Tutup'}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt={language === 'en' ? 'Design Preview' : 'Preview Desain'}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20 bg-[#120a16]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function ActionButtons({ order, onCancelSuccess, onTestimonialSuccess }) {
  const { language } = useLanguageStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process'].includes(order.status);
  const testimonial = order.testimonial || order.user_testimonial;

  const totalPaid = order.payments
    ?.filter(p => p.payment_status === 'verified' || p.payment_status === 'paid' || p.payment_status === 'dp')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const hasDP = order.payments?.some(p => p.payment_type === 'dp' && (p.payment_status === 'verified' || p.payment_status === 'dp'));
  const needsPelunasan = remaining > 0 && hasDP && ['ready_for_pickup', 'completed'].includes(order.status);
  const paymentRejected = order.payment_status === 'rejected';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.requestCancel(order.id);
      setShowCancelDialog(false);
      if (onCancelSuccess) onCancelSuccess();
    } catch (err) {
      alert(err.response?.data?.message || (language === 'en' ? 'Failed to cancel order' : 'Gagal membatalkan pesanan'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 sm:gap-3.5 mt-5 flex-wrap sm:flex-nowrap items-stretch">
        {(order.status === 'waiting_payment' || paymentRejected) && (
          <Link
            to={`/pesan/pembayaran/${order.order_code}`}
            className="btn-gradient-primary flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl text-xs sm:text-[13px] uppercase tracking-wider font-bold shadow-md shadow-primary/20"
          >
            <CreditCard className="w-4 h-4 shrink-0" /> {paymentRejected ? (language === 'en' ? 'Re-upload' : 'Upload Ulang') : (language === 'en' ? 'Pay Now' : 'Bayar Sekarang')}
          </Link>
        )}
        {paymentRejected && (
          <div className="w-full p-3.5 sm:p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs sm:text-[13px] leading-relaxed my-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{language === 'en' ? 'Payment rejected. Please re-upload payment receipt.' : 'Pembayaran ditolak. Silakan upload ulang bukti pembayaran.'}</span>
          </div>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="btn-glass flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs sm:text-[13px] uppercase tracking-wider font-semibold"
          >
            <Ban className="w-4 h-4 shrink-0" /> {language === 'en' ? 'Cancel' : 'Batalkan'}
          </button>
        )}
        <a
          href={waLink(language === 'en' ? `Hello Dreamcatcher, I would like to inquire about order #${order.order_code}` : `Halo Dreamcatcher, saya ingin menanyakan pesanan #${order.order_code}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glass flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-xs sm:text-[13px] uppercase tracking-wider font-semibold"
        >
          <MessageCircle className="w-4 h-4 shrink-0" /> {language === 'en' ? 'Contact Admin' : 'Hubungi Admin'}
        </a>
        {order.status === 'completed' && (
          <button
            onClick={() => setShowTestimonial(true)}
            className={`btn-glass flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-xs sm:text-[13px] uppercase tracking-wider font-semibold ${testimonial ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' : 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10'}`}
          >
            {testimonial ? <CheckCircle className="w-4 h-4 shrink-0" /> : <Star className="w-4 h-4 shrink-0" />}
            {testimonial ? (language === 'en' ? 'View / Edit Testimonial' : 'Lihat / Ubah Testimoni') : (language === 'en' ? 'Give Testimonial' : 'Beri Testimoni')}
          </button>
        )}
      </div>

      {needsPelunasan && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 mt-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 font-bold text-sm sm:text-base mb-1.5">
                {language === 'en' ? 'Remaining Balance: ' : 'Sisa Pembayaran: '}
                <span className="font-mono">{formatRupiah(remaining)}</span>
              </p>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-3.5">
                {language === 'en' ? 'Order is ready. Please pay your remaining DP balance.' : 'Pesanan telah siap. Silakan lunasi sisa pembayaran DP Anda.'}
              </p>
              <Link
                to={`/pesan/pembayaran/${order.order_code}?type=pelunasan`}
                className="btn-gradient-primary inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider font-bold shadow-md"
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" /> {language === 'en' ? 'Pay Balance Now' : 'Lunasi Sekarang'}
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title={language === 'en' ? 'Cancel Order' : 'Batalkan Pesanan'}
        message={language === 'en' ? 'Are you sure you want to cancel this order? A request will be sent to admin for confirmation.' : 'Apakah Anda yakin ingin membatalkan pesanan ini? Permintaan akan dikirim ke admin untuk dikonfirmasi.'}
        confirmLabel={language === 'en' ? 'Yes, Cancel' : 'Ya, Batalkan'}
        variant="danger"
        loading={cancelling}
      />

      {showTestimonial && (
        <TestimonialForm
          order={order}
          existingTestimonial={testimonial}
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
  const { language, td } = useLanguageStore();
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
      setError(language === 'en' ? 'Enter order code and phone number' : 'Masukkan kode pesanan dan nomor HP');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.track(orderCode.trim(), phone.trim());
      setOrder(response.order);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'en' ? 'Order not found. Check order code and phone number.' : 'Pesanan tidak ditemukan. Periksa kode dan nomor HP.'));
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
    } catch { /* silent */ }
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
        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {(() => {
                const items = order.items || [];
                const imgSrc = (() => {
                  const d = items.find(i => i.design?.image_url);
                  if (d) return getImageUrl(d.design.image_url);
                  const p = items.find(i => i.product?.images?.length > 0);
                  if (p) return p.product.images[0].image_url;
                  return null;
                })();
                if (imgSrc) return <img src={imgSrc} alt="Item" className="w-full h-full object-contain" />;
                return <ImageIcon className="w-8 h-8 text-white/40" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-base text-primary font-bold tracking-wider">#{order.order_code}</span>
                <StatusBadge status={order.status} />
              </div>
              {(() => {
                const itemNames = (order.items || []).map(i => i.product?.name || i.service?.name || i.product_name).filter(Boolean);
                if (itemNames.length === 0) return null;
                const title = itemNames.length === 1 ? td(itemNames[0]) : `${td(itemNames[0])} (+${itemNames.length - 1} ${language === 'en' ? 'other items' : 'item lainnya'})`;
                return <p className="text-white text-sm font-medium leading-snug mb-1">{title}</p>;
              })()}
              <p className="text-xs text-white/50 mb-2">
                {new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                <span className="flex items-center gap-1"><ShoppingBag size={12} className="text-primary" /> {(order.items || []).length} {language === 'en' ? ((order.items || []).length > 1 ? 'items' : 'item') : 'item'}</span>
              </div>
            </div>
            <p className="font-bold text-gradient-primary text-xl whitespace-nowrap">{formatRupiah(order.total_price)}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <h3 className="text-primary text-xs tracking-wider uppercase mb-5 font-bold">{language === 'en' ? 'Order Status' : 'Status Pesanan'}</h3>
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
        <div className="glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden mb-8 border border-white/10">
          <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
          <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white/50" />
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wide mb-2">{language === 'en' ? 'TRACK ORDER' : 'LACAK PESANAN'}</h2>
            <p className="text-white/60 text-xs sm:text-sm">{language === 'en' ? 'Enter your order code and phone number to track progress' : 'Masukkan kode pesanan dan nomor HP Anda untuk melacak progres'}</p>
          </div>
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-2 block">{language === 'en' ? 'Order Code' : 'Kode Pesanan'}</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="DC20241215XXXX"
                  className="input-premium w-full pl-12 pr-4 py-3.5 font-mono tracking-wider"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-2 block">{language === 'en' ? 'Phone Number' : 'Nomor Telepon'}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="input-premium w-full pl-12 pr-4 py-3.5"
                />
              </div>
            </div>
            {error && !order && hasSearched && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" /> {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient-primary w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-xs uppercase tracking-wider font-bold disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {language === 'en' ? 'Searching...' : 'Mencari...'}</> : <><Search className="w-4 h-4" /> {language === 'en' ? 'Track Order' : 'Lacak Pesanan'}</>}
            </button>
          </form>
        </div>
      </ScrollReveal>
      {loading && (
        <div className="space-y-5">
          <div className="glass-card rounded-3xl p-6 border border-white/10 animate-pulse">
            <div className="flex justify-between mb-3"><div className="h-4 w-28 bg-white/10 rounded-lg" /><div className="h-4 w-12 bg-white/10 rounded-lg" /></div>
            <div className="h-2 w-full bg-white/5 rounded-full" />
          </div>
          <div className="glass-card rounded-3xl p-6 border border-white/10 animate-pulse">
            <div className="flex gap-4"><div className="w-20 h-20 rounded-2xl bg-white/10" /><div className="flex-1 space-y-2"><div className="h-4 w-32 bg-white/10 rounded" /><div className="h-3 w-48 bg-white/5 rounded" /></div></div>
          </div>
        </div>
      )}
      {!loading && error && hasSearched && !order && (
        <ScrollReveal>
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
              <SearchX className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="font-heading text-2xl text-white tracking-wide mb-2">{language === 'en' ? 'ORDER NOT FOUND' : 'PESANAN TIDAK DITEMUKAN'}</h3>
            <p className="text-white/60 text-xs sm:text-sm mb-6 max-w-sm mx-auto">{language === 'en' ? 'Make sure the order code and phone number entered are correct.' : 'Pastikan kode pesanan dan nomor telepon yang dimasukkan sudah benar.'}</p>
            <button
              onClick={handleReset}
              className="btn-gradient-primary py-3 px-8 rounded-2xl text-xs uppercase tracking-wider font-bold"
            >
              {language === 'en' ? 'Try Again' : 'Coba Lagi'}
            </button>
          </div>
        </ScrollReveal>
      )}
    </>
  );
}

const ACTIVE_STATUSES = ['pending', 'waiting_payment', 'waiting_verification', 'ready_to_process', 'processing', 'ready_for_pickup', 'cancel_requested'];



function OrderCard({ order, onRefresh }) {
  const { language, td } = useLanguageStore();
  const statusSteps = getStatusSteps(language);
  const [showDetail, setShowDetail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const items = order.items || [];
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map((i) => i.size).filter(Boolean))];
  const colors = [...new Set(items.map((i) => i.selected_color).filter(Boolean))];

  const totalPaid =
    order.payments
      ?.filter((p) => p.payment_status === 'verified' || p.payment_status === 'paid' || p.payment_status === 'dp')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const isFullyPaid = remaining === 0;
  const isCompleted = order.status === 'completed';

  const heroText = (() => {
    const itemNames = items
      .map((i) => i.product?.name || i.service?.name || i.product_name)
      .filter(Boolean);
    if (itemNames.length > 0) {
      if (itemNames.length === 1) return td(itemNames[0]);
      return `${td(itemNames[0])} (+${itemNames.length - 1} ${language === 'en' ? 'other items' : 'item lainnya'})`;
    }
    if (order.description) return td(order.description);
    return `${language === 'en' ? 'Order' : 'Pesanan'} #${order.order_code}`;
  })();

  const thumbUrl = (() => {
    const d = items.find((i) => i.design?.image_url);
    if (d) return getImageUrl(d.design.image_url);
    const p = items.find((i) => i.product?.images?.length > 0);
    if (p) return getImageUrl(p.product.images[0].image_url);
    return null;
  })();

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.order_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <div className="rounded-3xl bg-[#180f1e]/90 backdrop-blur-2xl border border-white/10 hover:border-primary/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative group mb-5">
      {/* Glow ambient accent */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />

      {/* Main Card Header Bar (Clickable) */}
      <div
        className="p-5 sm:p-6 cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
        onClick={() => setShowDetail(!showDetail)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Thumbnail */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#120a16] border border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/40 transition-colors shadow-sm">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-white/5 flex items-center justify-center text-zinc-500">
                  <Package size={22} />
                </div>
              )}
            </div>

            {/* Order Summary Details */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Code & Status */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-primary font-mono text-[11px] font-bold tracking-wider hover:bg-primary/10 transition-colors cursor-pointer"
                  title={language === 'en' ? 'Click to copy order code' : 'Klik untuk menyalin kode pesanan'}
                >
                  <Hash size={11} className="text-primary" />
                  <span>#{order.order_code}</span>
                  {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-zinc-500" />}
                </button>

                <StatusBadge status={order.status} />

                {order.payment_status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : order.payment_status === 'dp'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}
                  >
                    {order.payment_status === 'paid'
                      ? (language === 'en' ? 'Paid' : 'Lunas')
                      : order.payment_status === 'dp'
                      ? (language === 'en' ? 'DP Paid' : 'DP Terbayar')
                      : (language === 'en' ? 'Unpaid' : 'Belum Bayar')}
                  </span>
                )}
              </div>

              {/* Row 2: Hero Title */}
              <h3 className="font-heading text-white text-[15px] sm:text-[16px] font-bold leading-snug truncate group-hover:text-primary transition-colors">
                {heroText}
              </h3>

              {/* Row 3: Meta Info Tags */}
              <div className="flex items-center gap-3 text-[11.5px] text-zinc-400 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Icon name="calendar" size={12} className="text-primary/80" />
                  {new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1">
                  <ShoppingBag size={12} className="text-primary/80" />
                  {itemCount} {language === 'en' ? (itemCount > 1 ? 'items' : 'item') : 'item'} ({totalQty} pcs)
                </span>
                {sizes.length > 0 && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-zinc-300 font-medium">{language === 'en' ? 'Size: ' : 'Ukuran: '}{sizes.map(s => td(s)).join(', ')}</span>
                  </>
                )}
                {colors.length > 0 && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-zinc-300 font-medium">{language === 'en' ? 'Color: ' : 'Warna: '}{colors.map(c => td(c)).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Area: Price & Toggle Chevron */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider sm:text-right font-semibold">{language === 'en' ? 'Total Order' : 'Total Pesanan'}</p>
              <p className="text-gradient-primary font-heading font-bold text-lg sm:text-2xl whitespace-nowrap">
                {formatRupiah(order.total_price)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <span>{showDetail ? (language === 'en' ? 'Close Details' : 'Tutup Detail') : (language === 'en' ? 'View Details' : 'Lihat Detail')}</span>
              {showDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </div>

        {/* Mini Stepper (Overview on closed state) */}
        {!showDetail && order.status !== 'cancelled' && order.status !== 'cancel_requested' && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {statusSteps.map((step, i) => {
                const stepIdx = statusOrder.indexOf(step.key);
                const curIdx = statusOrder.indexOf(order.status);
                const done = stepIdx < curIdx;
                const cur = stepIdx === curIdx;
                return (
                  <div key={step.key} className="flex items-center gap-1 shrink-0">
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        done
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : cur
                          ? 'bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-sm shadow-primary/40 animate-pulse'
                          : 'bg-white/[0.03] text-zinc-600 border border-white/5'
                      }`}
                    >
                      {done ? <Check size={10} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      <span>{step.label}</span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <span className={`w-2.5 h-0.5 ${done ? 'bg-primary' : 'bg-white/10'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Detail Accordion Content */}
      {showDetail && (
        <div className="px-5 sm:px-6 pb-6 pt-5 border-t border-white/10 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Status Celebration Banner if Completed */}
          {isCompleted && isFullyPaid && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 text-center relative overflow-hidden shadow-xl shadow-emerald-950/30">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <PartyPopper className="w-7 h-7 animate-bounce" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-wide mb-1">
                {language === 'en' ? 'ORDER COMPLETED' : 'PESANAN TELAH SELESAI'}
              </h3>
              <p className="text-emerald-300 text-xs sm:text-sm mb-1 font-medium">
                {language === 'en' ? 'Order has finished production and has been received.' : 'Pesanan telah selesai diproduksi dan diterima dengan baik.'}
              </p>
              <p className="text-zinc-400 text-xs">
                {language === 'en' ? 'Payment is fully settled. Thank you for trusting Dreamcatcher with your custom printing!' : 'Pembayaran telah lunas. Terima kasih telah mempercayakan sablon Anda kepada Dreamcatcher!'}
              </p>
            </div>
          )}

          {/* Status Ready for Pickup / Shipped Banner */}
          {order.status === 'ready_for_pickup' && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-3xl p-5 shadow-xl shadow-cyan-950/30">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-md">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-cyan-300 font-heading font-bold text-sm sm:text-base">
                    {order.delivery_method === 'pickup' ? (language === 'en' ? 'Order Ready for Pickup at Studio' : 'Pesanan Siap Diambil di Studio') : (language === 'en' ? 'Order is Being Delivered' : 'Pesanan Sedang Dikirim')}
                  </h4>
                  <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                    {order.delivery_method === 'pickup'
                      ? (language === 'en' ? 'Please visit Dreamcatcher studio to pick up your order by showing this order code.' : 'Silakan kunjungi studio Dreamcatcher untuk mengambil pesanan dengan menunjukkan kode pesanan ini.')
                      : (language === 'en' ? 'Your order is currently in transit to the destination address.' : 'Pesanan Anda saat ini sedang dalam perjalanan pengiriman ke alamat tujuan.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar Component */}
          <ProgressBar status={order.status} />

          {/* Timeline Section */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
            <h3 className="font-heading text-xs text-primary tracking-wider uppercase mb-5 font-bold flex items-center gap-2">
              <Clock size={14} /> {language === 'en' ? 'Production Workflow & Order Status' : 'Alur Pengerjaan & Status Pesanan'}
            </h3>
            <VerticalTimeline status={order.status} deliveryMethod={order.delivery_method} />
          </div>

          {/* Order Details & Items */}
          <OrderDetailSection order={order} />

          {/* Action Buttons Bar */}
          <ActionButtons order={order} onCancelSuccess={onRefresh} onTestimonialSuccess={onRefresh} />
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const { language } = useLanguageStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = useMemo(() => {
    return getFilterTabs(language).filter(tab => tab.key === 'all' || ACTIVE_STATUSES.includes(tab.key));
  }, [language]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll({ status: ACTIVE_STATUSES });
      setOrders(data.orders?.data || data.orders || []);
    } catch {
      setError(language === 'en' ? 'Failed to load orders' : 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, language]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeFilter !== 'all') result = result.filter(o => o.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => {
        if (o.order_code?.toLowerCase().includes(q)) return true;
        if (o.customer_name?.toLowerCase().includes(q)) return true;
        const orderItems = o.items || [];
        return orderItems.some(item => {
          const prodName = (item.product?.name || '').toLowerCase();
          const svcName = (item.service?.name || '').toLowerCase();
          const pName = (item.product_name || '').toLowerCase();
          const variant = (item.variant_label || '').toLowerCase();
          const size = (item.size || '').toLowerCase();
          const color = (item.selected_color || '').toLowerCase();
          const sablon = (item.sablon_type || '').toLowerCase();
          return (
            prodName.includes(q) ||
            svcName.includes(q) ||
            pName.includes(q) ||
            variant.includes(q) ||
            size.includes(q) ||
            color.includes(q) ||
            sablon.includes(q)
          );
        });
      });
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
      <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden selection:bg-primary selection:text-white">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
        <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />

        <Navbar />
        <main className="flex-1 w-full px-[5%] py-12 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10 relative">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                  <Package size={13} />
                  <span>{language === 'en' ? 'Order Tracking' : 'Pelacakan Pesanan'}</span>
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-wide mb-3">{language === 'en' ? 'MY ORDERS' : 'PESANAN SAYA'}</h1>
                <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mb-3" />
                <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto">{language === 'en' ? 'Enter your order code and phone number to track your order status in real-time' : 'Masukkan kode pesanan dan nomor HP untuk melacak status pesanan Anda secara real-time'}</p>
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
    <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />
      <main className="flex-1 w-full px-[5%] py-12 relative z-10">
        <div className="text-center mb-10 relative">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              <Package size={13} />
              <span>{language === 'en' ? 'Member Dashboard' : 'Dashboard Member'}</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-wide mb-3">{language === 'en' ? 'MY ORDERS' : 'PESANAN SAYA'}</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mb-3" />
            <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto">{language === 'en' ? 'Manage and track progress of all your orders in one place' : 'Kelola dan pantau progres seluruh pesanan Anda di satu tempat'}</p>
          </ScrollReveal>
        </div>

        {loading ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/10 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-white/10 rounded-lg" />
                    <div className="flex gap-2">
                      <div className="h-3 w-20 bg-white/5 rounded" />
                      <div className="h-3 w-16 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-white/10 rounded-full" />
                </div>
                <div className="flex gap-2 mt-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-10 h-10 rounded-xl bg-white/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ScrollReveal>
            <div className="max-w-md mx-auto glass-card border border-rose-500/20 p-10 text-center rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="alert-triangle" size={32} className="text-rose-400" />
              </div>
              <p className="text-rose-300 mb-6 font-medium text-sm">{error}</p>
              <button
                onClick={fetchOrders}
                className="btn-gradient-primary py-3 px-7 rounded-2xl text-xs uppercase tracking-wider font-bold"
              >
                {language === 'en' ? 'Try Again' : 'Coba Lagi'}
              </button>
            </div>
          </ScrollReveal>
        ) : orders.length === 0 ? (
          <ScrollReveal>
            <div className="max-w-md mx-auto glass-card border border-white/10 p-12 text-center rounded-3xl">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-heading text-2xl text-white tracking-wide mb-2">{language === 'en' ? 'No Orders Yet' : 'Belum Ada Pesanan'}</h3>
              <p className="text-white/60 mb-6 text-xs sm:text-sm">{language === 'en' ? 'Start ordering high quality custom printing right now' : 'Mulai order custom sablon berkualitas sekarang juga'}</p>
              <Link
                to="/pesan"
                className="btn-gradient-primary inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider font-bold"
              >
                <Icon name="plus" size={16} /> {language === 'en' ? 'Create New Order' : 'Buat Pesanan Baru'}
              </Link>
            </div>
          </ScrollReveal>
        ) : (
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'en' ? 'Search products, services, order code...' : 'Cari produk, layanan, kode pesanan...'}
                  className="input-premium w-full pl-12 pr-4 py-3.5 text-xs sm:text-sm"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                {filterTabs.map((tab) => {
                  const count = filterCounts[tab.key] || 0;
                  if (tab.key !== 'all' && count === 0) return null;
                  const isActive = activeFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleFilterChange(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        isActive
                          ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-primary text-white' : 'bg-white/10 text-white/50'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 glass-card border border-white/10 rounded-3xl">
                <Filter className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-white/60 text-xs sm:text-sm">{language === 'en' ? 'No orders match your search filter' : 'Tidak ada pesanan yang sesuai dengan filter pencarian'}</p>
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
