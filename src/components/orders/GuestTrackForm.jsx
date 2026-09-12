import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Hash, Phone, Lock, SearchX, Loader2, AlertTriangle, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import { StatusBadge } from '../common/StatusBadge';
import ScrollReveal from '../ui/ScrollReveal';
import ProgressBar from './ProgressBar';
import VerticalTimeline from './VerticalTimeline';
import OrderDetailSection from './OrderDetailSection';
import ActionButtons from './ActionButtons';

export default function GuestTrackForm() {
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
                const imgSrc = (() => {
                  const d = items.find(i => i.design?.image_url);
                  if (d) return getImageUrl(d.design.image_url);
                  const p = items.find(i => i.product?.images?.length > 0);
                  if (p) return p.product.images[0].image_url;
                  return null;
                })();
                if (imgSrc) return <img src={imgSrc} alt="Item" className="w-full h-full object-contain" />;
                return <ImageIcon className="w-8 h-8 text-gray/40" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[16px] text-primary font-bold tracking-wider">#{order.order_code}</span>
                <StatusBadge status={order.status} />
              </div>
              {(() => {
                const itemNames = (order.items || []).map(i => i.product?.name || i.service?.name || i.product_name).filter(Boolean);
                if (itemNames.length === 0) return null;
                const title = itemNames.length === 1 ? itemNames[0] : `${itemNames[0]} (+${itemNames.length - 1} item lainnya)`;
                return <p className="text-white text-[14px] font-medium leading-snug mb-1">{title}</p>;
              })()}
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