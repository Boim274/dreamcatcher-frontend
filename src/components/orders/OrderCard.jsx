import { memo, useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Image as ImageIcon, Truck, PartyPopper, Package } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import { statusSteps, statusOrder } from '../../utils/orderStatus';
import { StatusBadge } from '../common/StatusBadge';
import Icon from '../ui/Icon';
import ProgressBar from './ProgressBar';
import VerticalTimeline from './VerticalTimeline';
import OrderDetailSection from './OrderDetailSection';
import ActionButtons from './ActionButtons';

const OrderCard = memo(function OrderCard({ order, onRefresh }) {
  const [showDetail, setShowDetail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const items = order.items || [];
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map(i => i.size).filter(Boolean))];
  const colors = [...new Set(items.map(i => i.selected_color).filter(Boolean))];

  const totalPaid = order.payments
    ?.filter(p => p.payment_status === 'verified' || p.payment_status === 'paid' || p.payment_status === 'dp')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const isFullyPaid = remaining === 0;
  const isCompleted = order.status === 'completed';

  const heroText = (() => {
    const itemNames = items
      .map((i) => i.product?.name || i.service?.name || i.product_name)
      .filter(Boolean);
    if (itemNames.length > 0) {
      if (itemNames.length === 1) return itemNames[0];
      return `${itemNames[0]} (+${itemNames.length - 1} item lainnya)`;
    }
    if (order.description) return order.description;
    return `Pesanan #${order.order_code}`;
  })();

  const thumbUrl = (() => {
    const d = items.find(i => i.design?.image_url);
    if (d) return getImageUrl(d.design.image_url);
    const p = items.find(i => i.product?.images?.length > 0);
    if (p) return getImageUrl(p.product.images[0].image_url);
    return null;
  })();

  const created = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.order_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-[#181120]/90 backdrop-blur-md border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-primary/10 group">
      <div
        className="p-5 sm:p-6 cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
        onClick={() => setShowDetail(!showDetail)}
      >
        {/* Top bar: Order Code, Date, Status */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3.5 border-b border-white/5 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Klik untuk menyalin kode pesanan"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-white/80 hover:text-white transition-all text-xs font-mono"
            >
              <span className="text-primary font-bold">#</span>
              <span>{order.order_code}</span>
              {copiedCode ? (
                <span className="text-[10px] text-emerald-400 font-sans font-semibold ml-0.5">Tersalin!</span>
              ) : (
                <Icon name="copy" size={11} className="text-white/40 group-hover:text-primary transition-colors" />
              )}
            </button>
            <span className="text-white/40 text-xs flex items-center gap-1.5">
              <Icon name="calendar" size={12} className="text-white/40" />
              {created}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Main Info Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              {thumbUrl ? (
                <div className="relative group/thumb">
                  <img
                    src={thumbUrl}
                    alt={heroText}
                    className="w-16 h-16 sm:w-18 sm:h-18 object-contain bg-black/40 rounded-xl border border-white/10 p-1 group-hover/thumb:border-primary/60 transition-all duration-300"
                  />
                  {itemCount > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-ink text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-md">
                      +{itemCount - 1}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
                  <Package className="w-7 h-7 text-white/40" />
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base leading-snug mb-2.5 line-clamp-1 group-hover:text-primary transition-colors">
                {heroText}
              </h3>

              {/* Chips / Pills */}
              <div className="flex items-center gap-2.5 text-xs text-white/60 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80">
                  <ShoppingBag size={12} className="text-primary shrink-0" />
                  {itemCount} item ({totalQty} pcs)
                </span>

                {sizes.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80">
                    <Icon name="tag" size={11} className="text-purple-400 shrink-0" />
                    {sizes.join(', ')}
                  </span>
                )}

                {colors.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80">
                    <Icon name="palette" size={11} className="text-pink-400 shrink-0" />
                    {colors.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price & Expand Indicator */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
            <div className="text-left sm:text-right">
              <span className="block text-[10px] sm:text-[11px] text-white/40 font-medium uppercase tracking-wider mb-1">Total Biaya</span>
              <span className="font-mono text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-[#ff8ac8] to-purple-300 bg-clip-text text-transparent">
                {formatRupiah(order.total_price)}
              </span>
            </div>

            <button
              type="button"
              className={`p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-primary/40 transition-all ${
                showDetail ? 'bg-primary/10 border-primary/40 text-primary' : ''
              }`}
              aria-label={showDetail ? 'Tutup rincian' : 'Buka rincian'}
            >
              {showDetail ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Step dots for active progress */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {order.status === 'cancel_requested' ? (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-400 text-xs font-medium">Menunggu Persetujuan Pembatalan</span>
            </div>
          ) : order.status === 'cancelled' ? (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="text-rose-400 text-xs font-medium">Pesanan Dibatalkan</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              {statusSteps.map((step, i) => {
                const stepIdx = statusOrder.indexOf(step.key);
                const curIdx = statusOrder.indexOf(order.status);
                const done = stepIdx < curIdx;
                const cur = stepIdx === curIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                        done
                          ? 'bg-primary shadow-[0_0_8px_rgba(255,104,180,0.6)]'
                          : cur
                          ? 'bg-primary animate-pulse ring-2 ring-primary/40'
                          : 'bg-white/10'
                      }`}
                      title={step.label}
                    />
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1.5 rounded transition-all ${
                          done ? 'bg-primary' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetail && (
        <div className="px-5 sm:px-6 pb-6 pt-3 animate-fade-in border-t border-white/10 bg-white/[0.01]">
          {isCompleted && isFullyPaid && (
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 mb-5 mt-3 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
                  <PartyPopper className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-emerald-300 text-sm sm:text-base tracking-wide font-bold">
                    PESANAN TELAH SELESAI
                  </h4>
                  <p className="text-emerald-400/90 text-xs sm:text-[13px] mt-1.5 leading-relaxed">
                    Pesanan telah diambil dan diterima dengan baik. Pembayaran telah lunas. Terima kasih!
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'ready_for_pickup' && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 mb-5 mt-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {order.delivery_method === 'pickup' ? (
                    <>
                      <h4 className="text-cyan-300 font-semibold text-sm sm:text-base">Pesanan Siap Diambil</h4>
                      <p className="text-white/80 text-xs sm:text-[13px] mt-1.5 leading-relaxed">Silakan datang ke workshop kami untuk mengambil pesanan Anda dengan menunjukkan kode pesanan.</p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-cyan-300 font-semibold text-sm sm:text-base">Pesanan Sedang Dikirim</h4>
                      <p className="text-white/80 text-xs sm:text-[13px] mt-1.5 leading-relaxed">Pesanan Anda sedang dalam proses pengiriman oleh kurir kami.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <ProgressBar status={order.status} />

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-4">
            <h4 className="text-primary text-[11px] tracking-wider uppercase mb-4 font-bold flex items-center gap-2">
              <Icon name="activity" size={13} /> Status & Timeline Pengerjaan
            </h4>
            <VerticalTimeline status={order.status} deliveryMethod={order.delivery_method} />
          </div>

          <OrderDetailSection order={order} />
          <ActionButtons order={order} onCancelSuccess={onRefresh} onTestimonialSuccess={onRefresh} />
        </div>
      )}
    </div>
  );
});

export default OrderCard;