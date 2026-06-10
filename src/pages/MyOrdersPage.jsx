import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import { formatRupiah } from '../utils/formatRupiah';
import {
  CheckCircle, Clock, Package, CreditCard, Search, Filter, ShoppingBag
} from 'lucide-react';

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'waiting_payment', label: 'Bayar', icon: CreditCard },
  { key: 'paid', label: 'Terverifikasi', icon: CheckCircle },
  { key: 'processed', label: 'Diproses', icon: Package },
  { key: 'completed', label: 'Selesai', icon: CheckCircle },
];

const statusOrder = ['pending', 'waiting_payment', 'paid', 'processed', 'completed'];

function Timeline({ status }) {
  const currentIndex = statusOrder.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/30">
          <span className="text-[11px] font-bold">✕</span>
        </div>
        <span className="text-red-400 text-[13px] font-medium">Dibatalkan</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {statusSteps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isFuture = stepIndex > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
                  isCompleted
                    ? 'bg-[#c8f000] border-[#c8f000] text-ink'
                    : isCurrent
                    ? 'bg-primary/20 border-primary text-primary animate-pulse'
                    : 'bg-transparent border-border/50 text-gray'
                }`}
                title={step.label}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap hidden sm:block ${
                isCompleted ? 'text-[#c8f000] font-semibold' : isCurrent ? 'text-primary font-semibold' : 'text-gray'
              }`}>
                {step.label}
              </span>
            </div>
            {index < statusSteps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full ${
                isCompleted ? 'bg-[#c8f000]' : isCurrent ? 'bg-primary/30' : 'bg-border/30'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const [showDetail, setShowDetail] = useState(false);
  const items = order.items || [];
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const sizes = [...new Set(items.map(i => i.size).filter(Boolean))];
  const colors = [...new Set(items.map(i => i.selected_color).filter(Boolean))];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      {/* Header */}
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setShowDetail(!showDetail)}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[15px] text-primary font-bold tracking-wider">#{order.order_code}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="font-bold text-primary text-lg whitespace-nowrap">{formatRupiah(order.total_price)}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[12px] text-gray mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Icon name="calendar" size={12} />
            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <ShoppingBag size={12} />
            {itemCount} item · {totalQty} pcs
          </span>
          {sizes.length > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="tag" size={12} />
              {sizes.join(', ')}
            </span>
          )}
          {colors.length > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="palette" size={12} />
              {colors.join(', ')}
            </span>
          )}
        </div>

        {/* Timeline */}
        <Timeline status={order.status} />
      </div>

      {/* Detail expand */}
      {showDetail && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="border-t border-border pt-4 mb-4">
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
                <p className="text-white font-medium">{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</p>
              </div>
              {order.address && (
                <div className="bg-ink rounded-lg p-3 col-span-2">
                  <p className="text-gray text-[11px] mb-0.5">Alamat</p>
                  <p className="text-white font-medium">{order.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 mb-4">
            <h4 className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Item Pesanan</h4>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-ink rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium truncate">{item.product_name || item.service?.name || '-'}</p>
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
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-white font-semibold text-[13px]">Total</span>
                <span className="text-primary font-bold text-lg">{formatRupiah(order.total_price)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {order.status === 'waiting_payment' && (
              <Link
                to={`/pesan/pembayaran/${order.order_code}`}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
              >
                <CreditCard className="w-4 h-4" /> Bayar Sekarang
              </Link>
            )}
            <Link
              to={`/pesan/lacak?code=${order.order_code}`}
              className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]"
            >
              <Icon name="eye" size={16} /> Lacak
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-border/50 rounded"></div>
          <div className="flex gap-2">
            <div className="h-3 w-20 bg-border/50 rounded"></div>
            <div className="h-3 w-16 bg-border/50 rounded"></div>
          </div>
        </div>
        <div className="h-5 w-24 bg-border/50 rounded"></div>
      </div>
      <div className="flex gap-1 mt-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-border/30"></div>
            <div className="h-2 w-8 bg-border/30 rounded mt-1 hidden sm:block"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const filterTabs = [
  { key: 'all', label: 'Semua' },
  { key: 'waiting_payment', label: 'Menunggu Bayar' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Lunas' },
  { key: 'processed', label: 'Diproses' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeFilter !== 'all') {
      result = result.filter(o => o.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_code?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeFilter, searchQuery]);

  const filterCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const handleFilterChange = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', key);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 w-full px-[5%] py-12">
        {/* Header */}
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
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ScrollReveal>
            <div className="max-w-md mx-auto bg-card border border-border p-10 text-center rounded-xl">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="alert-triangle" size={32} className="text-danger" />
              </div>
              <p className="text-danger mb-4 font-medium">{error}</p>
              <button onClick={fetchOrders} className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
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
              <h3 className="font-heading text-[24px] text-white tracking-[1px] mb-2">Belum Ada Pesanan</h3>
              <p className="text-gray mb-6 text-[13px]">Mulai pesan sekarang untuk melihat pesanan Anda di sini</p>
              <Link to="/pesan" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-8 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
                <Icon name="plus" size={18} /> Buat Pesanan
              </Link>
            </div>
          </ScrollReveal>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Search */}
            <ScrollReveal>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode pesanan atau nama..."
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-[13px] text-white placeholder-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>
            </ScrollReveal>

            {/* Filters */}
            <ScrollReveal>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-5 scrollbar-hide">
                {filterTabs.map((tab) => {
                  const count = filterCounts[tab.key] || 0;
                  if (tab.key !== 'all' && count === 0) return null;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleFilterChange(tab.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all border ${
                        activeFilter === tab.key
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-card border-border text-gray hover:text-white hover:border-primary/30'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        activeFilter === tab.key ? 'bg-white/20' : 'bg-border/50'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Orders */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Filter className="w-10 h-10 text-gray mx-auto mb-3" />
                <p className="text-gray text-[13px]">Tidak ada pesanan ditemukan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <ScrollReveal key={order.id} direction="up" delay={index * 80}>
                    <OrderCard order={order} />
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
