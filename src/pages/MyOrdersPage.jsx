import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import ScrollReveal from '../components/ui/ScrollReveal';
import { formatRupiah } from '../utils/formatRupiah';
import {
  CheckCircle, Clock, Package, ChevronRight, CreditCard, Eye, Search, Filter
} from 'lucide-react';

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock },
  { key: 'paid', label: 'Pembayaran Terverifikasi', icon: CheckCircle },
  { key: 'processed', label: 'Diproses', icon: Package },
  { key: 'completed', label: 'Selesai', icon: CheckCircle },
];

const statusOrder = ['pending', 'waiting_payment', 'paid', 'processed', 'completed'];

function Timeline({ status }) {
  const currentIndex = statusOrder.indexOf(status);
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-1">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-red-500/20 text-red-400 border border-red-500/30">
          <span className="text-[10px] font-bold">✕</span>
        </div>
        <span className="text-red-400 text-xs ml-1">Dibatalkan</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isCompleted
                  ? 'bg-[#ea6fab]/20 text-[#ea6fab] border border-[#ea6fab]/30'
                  : isCurrent
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-border/30 text-gray border border-border/50'
              }`}
              title={step.label}
            >
              {isCompleted ? <CheckCircle className="w-3 h-3" /> : <step.icon className="w-3 h-3" />}
            </div>
            {index < statusSteps.length - 1 && (
              <div className={`w-4 h-0.5 ${isCompleted ? 'bg-[#ea6fab]/40' : 'bg-border/50'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in transition-all duration-200 hover:border-primary/30">
      <div
        className="flex items-center justify-between p-5 cursor-pointer select-none"
        onClick={() => setShowDetail(!showDetail)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-primary font-semibold tracking-wider">#{order.order_code}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-gray text-xs">
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          {!showDetail && (
            <div className="mt-2">
              <Timeline status={order.status} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 ml-4">
          <p className="font-bold text-primary whitespace-nowrap">{formatRupiah(order.total_price)}</p>
          <ChevronRight className={`w-5 h-5 text-gray transition-transform duration-200 ${showDetail ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {showDetail && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="border-t border-border pt-4 mb-4">
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-gray">Timeline</h4>
            <Timeline status={order.status} />
          </div>

          <div className="border-t border-border pt-4 mb-4">
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-gray">Detail Pesanan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray">Nama</span>
                <span className="text-white">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">Telepon</span>
                <span className="text-white">{order.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">Pengiriman</span>
                <span className="text-white">{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 mb-4">
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-gray">Item</h4>
            <div className="space-y-2 text-sm">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray">{item.product_name || item.service?.name || '-'} × {item.quantity}</span>
                  <span className="text-white">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span className="text-white">Total</span>
                <span className="text-primary">{formatRupiah(order.total_price)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {order.status === 'waiting_payment' && (
              <Link
                to={`/pesan/pembayaran/${order.order_code}`}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <CreditCard className="w-4 h-4" /> Bayar Sekarang
              </Link>
            )}
            <Link
              to={`/pesan/lacak?code=${order.order_code}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-gray hover:text-white hover:border-primary/30 transition-colors"
            >
              <Eye className="w-4 h-4" /> Lacak
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
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-28 bg-border/50 rounded"></div>
            <div className="h-5 w-20 bg-border/50 rounded-full"></div>
          </div>
          <div className="h-3 w-36 bg-border/50 rounded mt-2"></div>
          <div className="flex gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-border/30"></div>
            ))}
          </div>
        </div>
        <div className="h-5 w-24 bg-border/50 rounded"></div>
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

      <main className="flex-1 w-full px-[5%] py-8">
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="font-heading text-[28px] text-white tracking-[1px] mb-2">Pesanan Saya</h1>
            <p className="text-gray">Kelola dan lacak semua pesanan Anda</p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ScrollReveal>
            <div className="bg-card border border-border p-8 text-center rounded-xl">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-danger text-2xl">⚠</span>
              </div>
              <p className="text-danger mb-4">{error}</p>
              <button onClick={fetchOrders} className="btn-primary px-6 py-2 text-sm">
                Coba Lagi
              </button>
            </div>
          </ScrollReveal>
        ) : orders.length === 0 ? (
          <ScrollReveal>
            <div className="bg-card border border-border p-12 text-center rounded-xl">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-heading text-[22px] text-white tracking-[1px] mb-2">Belum Ada Pesanan</h3>
              <p className="text-gray mb-6 text-sm">Mulai pesan sekarang untuk melihat pesanan Anda di sini</p>
              <Link to="/pesan" className="btn-primary inline-flex items-center gap-2 text-sm">
                Buat Pesanan
              </Link>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode pesanan atau nama..."
                className="input-dark pl-10 text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
              {filterTabs.map((tab) => {
                const count = filterCounts[tab.key] || 0;
                if (tab.key !== 'all' && count === 0) return null;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeFilter === tab.key
                        ? 'bg-primary text-white'
                        : 'bg-card border border-border text-gray hover:text-white hover:border-primary/30'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeFilter === tab.key ? 'bg-white/20' : 'bg-border/50'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Filter className="w-10 h-10 text-gray mx-auto mb-3" />
                <p className="text-gray text-sm">Tidak ada pesanan ditemukan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </ScrollReveal>
        )}
      </main>

      <Footer />
    </div>
  );
}
