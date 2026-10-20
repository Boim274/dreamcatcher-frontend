import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { StatusBadge } from '../components/common/StatusBadge';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import TestimonialForm from '../components/orders/TestimonialForm';
import { formatRupiah } from '../utils/formatRupiah';
import { getImageUrl } from '../utils/getImageUrl';
import { waLink } from '../constants/whatsapp';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import OptimizedImage from '../components/ui/OptimizedImage';
import {
  History, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package,
  Search, Filter, ShoppingBag, PartyPopper, XCircle, MessageCircle, Star, Plus,
} from 'lucide-react';

const HISTORY_STATUSES = ['completed', 'cancelled'];

const getFilterTabs = (language) => [
  { value: '', label: language === 'en' ? 'All' : 'Semua' },
  { value: 'completed', label: language === 'en' ? 'Completed' : 'Selesai' },
  { value: 'cancelled', label: language === 'en' ? 'Cancelled' : 'Dibatalkan' },
];

function HistoryCard({ order, onRefresh }) {
  const { td, language } = useLanguageStore();
  const [showDetail, setShowDetail] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const items = order.items || [];
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map((i) => i.size).filter(Boolean))];
  const colors = [...new Set(items.map((i) => i.selected_color).filter(Boolean))];
  const isCompleted = order.status === 'completed';
  const testimonial = order.testimonial || order.user_testimonial;

  const heroText = (() => {
    const itemNames = items
      .map((i) => td(i.product?.name || i.service?.name || i.product_name))
      .filter(Boolean);
    if (itemNames.length > 0) {
      if (itemNames.length === 1) return itemNames[0];
      return `${itemNames[0]} (+${itemNames.length - 1} ${language === 'en' ? 'other items' : 'item lainnya'})`;
    }
    if (order.description) return order.description;
    return `${language === 'en' ? 'Order' : 'Pesanan'} #${order.order_code}`;
  })();

  const thumbUrl = (() => {
    const d = items.find((i) => i.design?.thumbnail_url || i.design?.image_url);
    if (d) return d.design.thumbnail_url || d.design.image_url;
    const p = items.find((i) => i.product?.images?.length > 0);
    if (p) return p.product.images[0].thumbnail_url || p.product.images[0].image_url;
    return null;
  })();

  const created = new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
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

  const renderItemDetails = (item) => [
    item.shirt_model && `${language === 'en' ? 'Model: ' : 'Model: '}${item.shirt_model}`,
    item.size && `${language === 'en' ? 'Size: ' : 'Ukuran: '}${item.size}`,
    item.selected_color && `${language === 'en' ? 'Color: ' : 'Warna: '}${td(item.selected_color)}`,
    item.sablon_type && `${language === 'en' ? 'Print: ' : 'Sablon: '}${td(item.sablon_type)}`,
    item.print_area && `${language === 'en' ? 'Position: ' : 'Posisi: '}${td(item.print_area.replace(/_/g, ' '))}`,
    item.print_size && `${language === 'en' ? 'Dimensions: ' : 'Dimensi: '}${item.print_size}`,
  ].filter(Boolean);

  return (
    <div className="bg-[#181120]/90 backdrop-blur-md border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-primary/10 group">
      {/* Card Header & Summary (Clickable to expand) */}
      <div
        className="p-5 sm:p-6 cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
        onClick={() => setShowDetail(!showDetail)}
      >
        {/* Top bar: Order Code, Date, Status */}
        <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-white/5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyCode}
              title={language === 'en' ? 'Click to copy order code' : 'Klik untuk menyalin kode pesanan'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-white/80 hover:text-white transition-all text-xs font-mono"
            >
              <span className="text-primary font-bold">#</span>
              <span>{order.order_code}</span>
              {copiedCode ? (
                <span className="text-[10px] text-emerald-400 font-sans font-semibold ml-0.5">
                  {language === 'en' ? 'Copied!' : 'Tersalin!'}
                </span>
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
                <div className="relative group/thumb w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-black/40 border border-white/10 p-1 group-hover/thumb:border-primary/60 transition-all duration-300">
                  <OptimizedImage
                    src={thumbUrl}
                    variant="thumbnail"
                    alt={heroText}
                    containerClassName="w-full h-full rounded-lg"
                    className="w-full h-full object-contain"
                  />
                  {itemCount > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-ink text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-md z-10">
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
              <h3 className="text-white font-semibold text-sm sm:text-base leading-snug mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                {heroText}
              </h3>

              {/* Chips / Pills */}
              <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80">
                  <ShoppingBag size={11} className="text-primary" />
                  {itemCount} {language === 'en' ? (itemCount > 1 ? 'items' : 'item') : 'item'} ({totalQty} pcs)
                </span>

                {sizes.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80">
                    <Icon name="tag" size={11} className="text-purple-400" />
                    {sizes.join(', ')}
                  </span>
                )}

                {colors.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80">
                    <Icon name="palette" size={11} className="text-pink-400" />
                    {colors.map((c) => td(c)).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price & Expand Indicator */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
            <div className="text-left sm:text-right">
              <span className="block text-[11px] text-white/40 font-medium uppercase tracking-wider">
                {language === 'en' ? 'Total Cost' : 'Total Biaya'}
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-[#ff8ac8] to-purple-300 bg-clip-text text-transparent">
                {formatRupiah(order.total_price)}
              </span>
            </div>

            <button
              type="button"
              className={`p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-primary/40 transition-all ${
                showDetail ? 'bg-primary/10 border-primary/40 text-primary' : ''
              }`}
              aria-label={showDetail ? (language === 'en' ? 'Close details' : 'Tutup rincian') : (language === 'en' ? 'Open details' : 'Buka rincian')}
            >
              {showDetail ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Detail Section */}
      {showDetail && (
        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-white/10 animate-fade-in bg-white/[0.01]">
          {/* Status Celebration / Notice Banner */}
          {isCompleted ? (
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 mb-5 mt-3 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
                  <PartyPopper className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading text-emerald-300 text-sm sm:text-base tracking-wide font-bold">
                    {language === 'en' ? 'ORDER COMPLETED' : 'PESANAN TELAH SELESAI'}
                  </h4>
                  <p className="text-emerald-400/90 text-xs mt-0.5">
                    {language === 'en'
                      ? 'Order has been produced and successfully delivered. Thank you for choosing Dreamcatcher!'
                      : 'Pesanan telah diproduksi dan diterima dengan baik. Terima kasih telah mempercayai Dreamcatcher!'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 mb-5 mt-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-rose-400 font-semibold text-sm">
                    {language === 'en' ? 'Order Cancelled' : 'Pesanan Dibatalkan'}
                  </h4>
                  <p className="text-white/60 text-xs mt-0.5">
                    {language === 'en'
                      ? 'This order has been cancelled. Please contact our support team if you need assistance.'
                      : 'Pesanan ini telah dibatalkan. Hubungi admin kami jika Anda membutuhkan bantuan.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer & Delivery Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5">
              <p className="text-white/40 text-[11px] mb-1">{language === 'en' ? 'Customer' : 'Pemesan'}</p>
              <p className="text-white font-medium truncate">{order.customer_name || '-'}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5">
              <p className="text-white/40 text-[11px] mb-1">{language === 'en' ? 'WhatsApp No.' : 'No. WhatsApp'}</p>
              <p className="text-white font-medium truncate">{order.phone || '-'}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5">
              <p className="text-white/40 text-[11px] mb-1">{language === 'en' ? 'Delivery' : 'Pengiriman'}</p>
              <p className="text-white font-medium flex items-center gap-1.5 truncate">
                {order.delivery_method === 'pickup' ? (
                  <><span className="w-2 h-2 rounded-full bg-cyan-400" /> {language === 'en' ? 'Self Pickup' : 'Ambil Sendiri'}</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-purple-400" /> {language === 'en' ? 'Courier Delivery' : 'Dikirim Kurir'}</>
                )}
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5">
              <p className="text-white/40 text-[11px] mb-1">{language === 'en' ? 'Payment' : 'Pembayaran'}</p>
              {order.payment_status ? (
                <StatusBadge status={order.payment_status} />
              ) : (
                <span className="text-white/60 font-medium">{language === 'en' ? 'Paid' : 'Lunas'}</span>
              )}
            </div>
          </div>

          {/* Order Items Detailed List */}
          {items.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-white/50 tracking-[1.5px] uppercase font-bold">
                  {language === 'en' ? `Item Details (${items.length})` : `Rincian Item (${items.length})`}
                </span>
                <span className="text-[11px] text-white/40 font-mono">Total {totalQty} pcs</span>
              </div>
              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const itemName = td(item.product_name || (item.service?.name ? (item.shirt_model ? `${item.service.name} (${item.shirt_model})` : item.service.name) : null) || item.product?.name || (language === 'en' ? 'Screen Printing Item' : 'Item Sablon'));
                  const isSablon = Boolean(item.service_id || item.sablon_type || item.design_type || item.design_id);
                  const fallbackOrderImg = items.find((i) => i.design?.image_url)?.design?.image_url;
                  const itemImg = item.design?.image_url
                    ? getImageUrl(item.design.image_url)
                    : (item.product?.images?.[0]?.image_url
                      ? getImageUrl(item.product.images[0].image_url)
                      : (isSablon && fallbackOrderImg ? getImageUrl(fallbackOrderImg) : null));
                  const itemPrice = item.unit_price || item.price || 0;
                  const itemSubtotal = item.subtotal || (item.quantity * itemPrice);
                  const details = renderItemDetails(item);

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl p-3.5 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {itemImg ? (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(itemImg)}
                            className="relative group/itemimg flex-shrink-0 cursor-zoom-in w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-black/50 border border-white/10 p-1 group-hover/itemimg:border-primary transition-all"
                            title={language === 'en' ? 'Click to enlarge' : 'Klik untuk memperbesar gambar'}
                          >
                            <OptimizedImage
                              src={item.design?.thumbnail_url || item.product?.images?.[0]?.thumbnail_url || itemImg}
                              variant="thumbnail"
                              alt={itemName}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/itemimg:opacity-100 rounded-lg flex items-center justify-center text-white transition-opacity z-10">
                              <Icon name="zoom-in" size={13} />
                            </div>
                          </button>
                        ) : (
                          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 text-white/30">
                            <Package className="w-5 h-5" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs sm:text-sm font-semibold truncate mb-1">{itemName}</p>
                          
                          {/* Specs Badges */}
                          {details.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-white/60 flex-wrap mb-1">
                              {details.map((det, dIdx) => (
                                <span key={dIdx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white/70 text-[10px]">
                                  {det}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.design?.prompt && (
                            <p className="text-white/50 text-[11px] italic line-clamp-1 bg-black/30 px-2 py-0.5 rounded border border-white/5 mt-1">
                              &ldquo;{item.design.prompt}&rdquo;
                            </p>
                          )}

                          <p className="text-white/40 text-[11px] font-mono mt-1">
                            {item.quantity} pcs &times; {formatRupiah(itemPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5 flex sm:block items-center justify-between">
                        <span className="sm:hidden text-white/40 text-[11px]">Subtotal:</span>
                        <p className="text-primary font-bold text-sm font-mono">{formatRupiah(itemSubtotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/10">
            {isCompleted && (
              <>
                {!testimonial ? (
                  <button
                    onClick={() => setShowTestimonial(true)}
                    className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/20"
                  >
                    <Star size={15} className="fill-current" /> {language === 'en' ? 'Leave Review' : 'Beri Testimoni'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTestimonial(true)}
                    className="flex-1 flex items-center justify-center gap-2 border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-semibold py-3 rounded-xl hover:bg-emerald-500/20 transition-all text-xs uppercase tracking-wider"
                  >
                    <Star size={15} className="fill-current text-emerald-400" /> {language === 'en' ? 'View Your Review' : 'Lihat Testimoni Anda'}
                  </button>
                )}
              </>
            )}

            <Link
              to="/pesan"
              className="flex-1 flex items-center justify-center gap-2 border border-white/15 bg-white/5 text-white/90 hover:text-white hover:bg-white/10 font-semibold py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              <ShoppingBag size={15} className="text-primary" /> {language === 'en' ? 'Order Again' : 'Pesan Lagi'}
            </Link>

            <a
              href={waLink(`Halo Admin Dreamcatcher, saya ingin menanyakan terkait pesanan #${order.order_code}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-primary/50 text-primary bg-primary/10 hover:bg-primary hover:text-white font-semibold py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              <MessageCircle size={15} /> {language === 'en' ? 'Contact CS' : 'Hubungi CS'}
            </a>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {showTestimonial && (
        <TestimonialForm
          order={order}
          existingTestimonial={testimonial}
          onClose={() => setShowTestimonial(false)}
          onSuccess={() => {
            setShowTestimonial(false);
            onRefresh?.();
          }}
        />
      )}

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            aria-label={language === 'en' ? 'Close' : 'Tutup'}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2.5 backdrop-blur-sm"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt={language === 'en' ? 'Design Preview' : 'Preview Desain'}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20 bg-[#120c16]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-ink rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-border/50 rounded" />
              <div className="flex gap-2"><div className="h-3 w-20 bg-border/50 rounded" /><div className="h-3 w-16 bg-border/50 rounded" /></div>
              <div className="flex gap-2"><div className="h-3 w-24 bg-border/30 rounded" /><div className="h-3 w-16 bg-border/30 rounded" /></div>
            </div>
            <div className="h-5 w-24 bg-border/50 rounded flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerOrderHistoryPage() {
  const { language } = useLanguageStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async (signal, pageNum = 1) => {
    setLoading(true);
    try {
      setError(false);
      const params = { page: pageNum };
      if (filter) {
        params.status = filter;
      } else {
        params.status = HISTORY_STATUSES;
      }
      const result = await orderService.getAll(params);
      setOrders(result.orders?.data || []);
      setPagination({
        current_page: result.orders?.current_page || 1,
        last_page: result.orders?.last_page || 1,
        total: result.orders?.total || 0,
      });
      setPage(pageNum);
    } catch (err) {
      if (err?.name !== 'CanceledError') {
        console.error('Failed to fetch order history:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(controller.signal, 1);
    return () => controller.abort();
  }, [fetchOrders]);

  const filterCounts = useMemo(() => {
    return {
      '': orders.length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  const filterTabs = useMemo(() => getFilterTabs(language), [language]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      if ((o.order_code || '').toLowerCase().includes(q)) return true;
      if ((o.customer_name || '').toLowerCase().includes(q)) return true;
      const orderItems = o.items || [];
      return orderItems.some((item) => {
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
  }, [orders, searchQuery]);

  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
      }`}>
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
        <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

        <Navbar />
        <main className="flex-1 w-full px-[5%] py-12 relative z-10">
          <div className="text-center mb-10 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                <History size={13} />
                <span>{language === 'en' ? 'Completed & Cancelled History' : 'Riwayat Selesai & Dibatalkan'}</span>
              </div>
              <h1 className={`font-heading text-3xl sm:text-4xl tracking-wide mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {language === 'en' ? 'ORDER HISTORY' : 'HISTORI PESANAN'}
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mb-3" />
              <p className={`text-xs sm:text-sm max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                {language === 'en'
                  ? 'Track the history of all your completed or cancelled orders'
                  : 'Pantau riwayat seluruh pesanan Anda yang telah selesai dikerjakan atau dibatalkan'}
              </p>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="max-w-3xl mx-auto">
              <Skeleton />
            </div>
          ) : error ? (
            <ScrollReveal>
              <div className="max-w-md mx-auto glass-card border border-rose-500/20 p-10 text-center rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="alert-triangle" size={32} className="text-rose-400" />
                </div>
                <p className="text-rose-300 mb-6 font-medium text-sm">
                  {language === 'en' ? 'Failed to load order history.' : 'Gagal memuat histori pesanan.'}
                </p>
                <button
                  onClick={() => fetchOrders(undefined, page)}
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
                <h3 className="font-heading text-2xl text-white tracking-wide mb-2">
                  {language === 'en' ? 'No Order History Yet' : 'Belum Ada Histori'}
                </h3>
                <p className="text-white/60 mb-6 text-xs sm:text-sm">
                  {language === 'en'
                    ? 'Completed or cancelled orders will be recorded here automatically'
                    : 'Pesanan yang selesai atau dibatalkan akan otomatis tercatat di sini'}
                </p>
                <Link
                  to="/pesan"
                  className="btn-gradient-primary inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider font-bold"
                >
                  <Plus size={16} /> {language === 'en' ? 'Create New Order' : 'Buat Pesanan Baru'}
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
                    placeholder={language === 'en' ? 'Search products, services, order codes...' : 'Cari produk, layanan, kode pesanan...'}
                    className="input-premium w-full pl-12 pr-4 py-3.5 text-xs sm:text-sm"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                  {filterTabs.map((tab) => {
                    const count = filterCounts[tab.value] || 0;
                    if (tab.value !== '' && count === 0) return null;
                    const isActive = filter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
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
                  <p className="text-white/60 text-xs sm:text-sm">
                    {language === 'en' ? 'No orders match the search filter' : 'Tidak ada pesanan yang sesuai dengan filter pencarian'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order, index) => (
                    <ScrollReveal key={order.id} direction="up" delay={index * 80}>
                      <HistoryCard order={order} onRefresh={() => fetchOrders(undefined, page)} />
                    </ScrollReveal>
                  ))}
                </div>
              )}

              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => fetchOrders(undefined, page - 1)}
                    disabled={page === 1}
                    className="btn-glass p-2.5 rounded-xl disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <span className="text-white/70 text-xs font-medium">{page} / {pagination.last_page}</span>
                  <button
                    onClick={() => fetchOrders(undefined, page + 1)}
                    disabled={page === pagination.last_page}
                    className="btn-glass p-2.5 rounded-xl disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
              {pagination && (
                <p className="text-center text-white/40 text-xs mt-3">
                  {language === 'en' ? 'Total' : 'Total'} {pagination.total} {language === 'en' ? 'orders' : 'pesanan'}
                </p>
              )}
            </div>
          )}
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
}
