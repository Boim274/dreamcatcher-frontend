import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
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
import {
  History, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package,
  Search, Filter, ShoppingBag, PartyPopper, XCircle, MessageCircle, Star, Plus,
} from 'lucide-react';

const HISTORY_STATUSES = ['completed', 'cancelled'];

const FILTER_TABS = [
  { value: '', label: 'Semua' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function HistoryCard({ order, onRefresh }) {
  const [showDetail, setShowDetail] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const items = order.items || [];
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map((i) => i.size).filter(Boolean))];
  const colors = [...new Set(items.map((i) => i.selected_color).filter(Boolean))];
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
    const d = items.find((i) => i.design?.image_url);
    if (d) return getImageUrl(d.design.image_url);
    const p = items.find((i) => i.product?.images?.length > 0);
    if (p) return getImageUrl(p.product.images[0].image_url);
    return null;
  })();

  const created = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <div className="p-5 cursor-pointer select-none" onClick={() => setShowDetail(!showDetail)}>
        <div className="flex items-start gap-3">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt="Item"
              className="w-12 h-12 object-contain bg-ink rounded-lg border border-border flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-ink border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
              <Package className="w-5 h-5 text-gray" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-[14px] font-medium leading-snug mb-2 line-clamp-2">{heroText}</p>
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
              <span className="flex items-center gap-1"><Icon name="calendar" size={11} />{created}</span>
              <span className="flex items-center gap-1"><ShoppingBag size={11} />{itemCount} item · {totalQty} pcs</span>
              {sizes.length > 0 && <span className="flex items-center gap-1"><Icon name="tag" size={11} />{sizes.join(', ')}</span>}
              {colors.length > 0 && <span className="flex items-center gap-1"><Icon name="palette" size={11} />{colors.join(', ')}</span>}
            </div>
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#c8f000]" />
                  <span className="text-[#c8f000] text-[11px] font-medium">Pesanan telah selesai</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-red-400 text-[11px] font-medium">Pesanan dibatalkan</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="px-5 pb-5 animate-fade-in border-t border-border pt-4">
          {isCompleted && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-6 mb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-heading text-[20px] text-white tracking-[1px] mb-2">PESANAN TELAH SELESAI</h3>
              <p className="text-success text-[13px] mb-1">Pesanan telah diambil dan diterima dengan baik.</p>
              <p className="text-success/80 text-[12px]">Terima kasih atas kepercayaan Anda!</p>
            </div>
          )}
          {!isCompleted && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-5 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-danger font-semibold text-[14px]">Pesanan Dibatalkan</p>
                  <p className="text-gray-light text-[12px] mt-1">Pesanan ini tidak dapat dilanjutkan. Hubungi admin jika membutuhkan bantuan.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
            <div>
              <p className="text-gray">Customer</p>
              <p className="text-white font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-gray">Telepon</p>
              <p className="text-white font-medium">{order.phone}</p>
            </div>
            <div>
              <p className="text-gray">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-gray">Pembayaran</p>
              {order.payment_status ? (
                <StatusBadge status={order.payment_status} />
              ) : (
                <span className="text-gray">-</span>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="mb-4">
              <p className="text-gray text-[11px] tracking-[1px] uppercase mb-2">Item Pesanan</p>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const itemName = item.product?.name || item.service?.name || item.product_name || 'Item';
                  const itemImg = item.design?.image_url
                    ? getImageUrl(item.design.image_url)
                    : (item.product?.images?.[0]?.image_url ? getImageUrl(item.product.images[0].image_url) : null);
                  const itemPrice = item.unit_price || item.price || 0;
                  const itemSubtotal = item.subtotal || (item.quantity * itemPrice);

                  return (
                    <div key={idx} className="flex items-center gap-3 bg-ink rounded-lg p-2.5">
                      {itemImg ? (
                        <img src={itemImg} alt={itemName} className="w-10 h-10 object-contain bg-card border border-border rounded flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-border/40 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[13px] font-medium truncate">{itemName}</p>
                        <div className="flex items-center gap-2 text-gray text-[11px] flex-wrap">
                          {item.variant_label && <span>{item.variant_label}</span>}
                          {item.size && <span>Size: {item.size}</span>}
                          {item.selected_color && <span>Warna: {item.selected_color}</span>}
                          {item.sablon_type && <span>Sablon: {item.sablon_type}</span>}
                        </div>
                        <p className="text-gray text-[11px] mt-0.5">
                          {item.quantity} x {formatRupiah(itemPrice)}
                        </p>
                      </div>
                      <p className="text-primary font-semibold text-[12px] whitespace-nowrap flex-shrink-0">
                        {formatRupiah(itemSubtotal)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="flex flex-col sm:flex-row gap-3">
              {!order.testimonial ? (
                <button
                  onClick={() => setShowTestimonial(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-ink font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
                >
                  <Star size={16} /> Beri Testimoni
                </button>
              ) : (
                <button
                  onClick={() => setShowTestimonial(true)}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-success/50 text-success font-semibold py-3 rounded-xl hover:bg-success/10 transition-colors text-[13px] uppercase tracking-[1px]"
                >
                  <Star size={16} /> Lihat Testimoni
                </button>
              )}
              <a
                href={waLink(`Halo admin, saya ingin bertanya tentang pesanan ${order.order_code}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
              >
                <MessageCircle size={16} /> Hubungi Admin
              </a>
            </div>
          )}

          {!isCompleted && (
            <a
              href={waLink(`Halo admin, saya ingin bertanya tentang pesanan ${order.order_code}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
            >
              <MessageCircle size={16} /> Hubungi Admin
            </a>
          )}
        </div>
      )}

      {showTestimonial && (
        <TestimonialForm
          order={order}
          existingTestimonial={order.testimonial}
          onClose={() => setShowTestimonial(false)}
          onSuccess={() => {
            setShowTestimonial(false);
            onRefresh?.();
          }}
        />
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal, 1);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchOrders = async (signal, pageNum = 1) => {
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
  };

  const filterCounts = useMemo(() => {
    return {
      '': orders.length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <main className="flex-1 w-full px-[5%] py-12">
          <div className="text-center mb-10 relative">
            <div className="graffiti-deco">ORDER HISTORY</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; histori pesanan</div>
              <h1 className="font-heading text-[36px] text-ink tracking-[1px] mb-2">HISTORI PESANAN</h1>
              <div className="divider mx-auto"></div>
              <p className="text-gray text-[14px] max-w-md mx-auto">Pantau pesanan yang telah selesai atau dibatalkan</p>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="max-w-3xl mx-auto">
              <Skeleton />
            </div>
          ) : error ? (
            <ScrollReveal>
              <div className="max-w-md mx-auto bg-card border border-border p-10 text-center rounded-xl">
                <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="alert-triangle" size={32} className="text-danger" />
                </div>
                <p className="text-danger mb-4 font-medium">Gagal memuat histori pesanan.</p>
                <button
                  onClick={() => fetchOrders(undefined, page)}
                  className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
                >
                  Coba Lagi
                </button>
              </div>
            </ScrollReveal>
          ) : orders.length === 0 ? (
            <ScrollReveal>
              <div className="max-w-md mx-auto bg-card border border-border p-12 text-center rounded-xl">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-heading text-[24px] text-white tracking-[1px] mb-2">Belum Ada Histori</h3>
                <p className="text-gray-light mb-6 text-[13px]">Pesanan selesai atau dibatalkan akan muncul di sini</p>
                <Link
                  to="/pesan"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-8 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
                >
                  <Plus size={18} /> Buat Pesanan
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            <div className="max-w-3xl mx-auto">
              <ScrollReveal>
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari produk, layanan, kode pesanan..."
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-[13px] text-white placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div className="flex gap-2 overflow-x-auto pb-4 mb-5 scrollbar-hide">
                  {FILTER_TABS.map((tab) => {
                    const count = filterCounts[tab.value] || 0;
                    if (tab.value !== '' && count === 0) return null;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all border ${filter === tab.value ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card border-border text-gray hover:text-white hover:border-primary/30'}`}
                      >
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${filter === tab.value ? 'bg-white/20' : 'bg-border/50'}`}>{count}</span>
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
                    className="p-2 rounded-lg hover:bg-card disabled:opacity-50 text-gray transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray text-[13px]">{page} / {pagination.last_page}</span>
                  <button
                    onClick={() => fetchOrders(undefined, page + 1)}
                    disabled={page === pagination.last_page}
                    className="p-2 rounded-lg hover:bg-card disabled:opacity-50 text-gray transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              {pagination && (
                <p className="text-center text-gray-medium text-[12px] mt-3">
                  Total {pagination.total} pesanan
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
