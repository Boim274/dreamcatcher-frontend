import { memo, useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Image as ImageIcon, Truck, PartyPopper } from 'lucide-react';
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

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <div className="p-5 cursor-pointer select-none" onClick={() => setShowDetail(!showDetail)}>
        <div className="flex items-start gap-3">
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt="Item"
              className="w-12 h-12 object-contain bg-ink rounded-lg border border-border flex-shrink-0 mt-0.5"
            />
          )}
          <div className="flex-1 min-w-0">
            {heroText && (
              <p className="text-white text-[14px] font-medium leading-snug mb-2 line-clamp-2">{heroText}</p>
            )}
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-gray tracking-wider">#{order.order_code}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="font-bold text-primary text-lg whitespace-nowrap">{formatRupiah(order.total_price)}</p>
                {showDetail ? <ChevronUp className="w-5 h-5 text-gray" /> : <ChevronDown className="w-5 h-5 text-gray" />}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray mb-2 flex-wrap">
              <span className="flex items-center gap-1"><Icon name="calendar" size={11} />{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><ShoppingBag size={11} />{itemCount} item · {totalQty} pcs</span>
              {sizes.length > 0 && <span className="flex items-center gap-1"><Icon name="tag" size={11} />{sizes.join(', ')}</span>}
              {colors.length > 0 && <span className="flex items-center gap-1"><Icon name="palette" size={11} />{colors.join(', ')}</span>}
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
          {order.status === 'ready_for_pickup' && (
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
export default OrderCard;