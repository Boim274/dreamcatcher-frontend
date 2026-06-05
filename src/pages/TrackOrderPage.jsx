import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { Search, CheckCircle, Clock, Package, Phone, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { formatRupiah } from '../utils/formatRupiah';

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
                  ? 'bg-green-600 text-white'
                  : isCurrent
                  ? 'bg-primary text-white'
                  : 'bg-border text-gray'
              }`}
              title={step.label}
            >
              {isCompleted ? <CheckCircle className="w-3 h-3" /> : <step.icon className="w-3 h-3" />}
            </div>
            {index < statusSteps.length - 1 && (
              <div className={`w-4 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GuestTrackForm() {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err.response?.data?.message || 'Pesanan tidak ditemukan. Periksa kode dan nomor HP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px] mb-2">Lacak Pesanan</h1>
        <p className="text-gray">Masukkan kode pesanan dan nomor HP untuk melacak status pesanan Anda</p>
      </div>

      <form onSubmit={handleTrack} className="bg-card border border-border p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Kode Pesanan</label>
            <input
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
              placeholder="DC20241215XXXX"
              className="input-dark text-lg font-mono tracking-wider"
            />
          </div>
          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nomor HP</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="input-dark"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-danger/10 rounded-lg text-danger text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><LoadingSpinner size="sm" /> Mencari...</>
          ) : (
            <><Search className="w-5 h-5" /> Lacak Pesanan</>
          )}
        </button>
      </form>

      {order && (
        <OrderCard order={order} expanded />
      )}
    </>
  );
}

function OrderCard({ order, expanded = false }) {
  const [showDetail, setShowDetail] = useState(expanded);

  return (
    <div className="bg-card border border-border p-6 animate-fade-in mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => !expanded && setShowDetail(!showDetail)}
      >
        <div>
          <p className="font-heading font-bold text-lg text-primary">{order.order_code}</p>
          <p className="text-gray text-xs mt-1">
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {!expanded && <ChevronRight className={`w-5 h-5 text-gray transition-transform ${showDetail ? 'rotate-90' : ''}`} />}
        </div>
      </div>

      {!expanded && (
        <div className="mt-3">
          <Timeline status={order.status} />
        </div>
      )}

      {showDetail && (
        <div className="mt-6 animate-fade-in">
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-chrome">Timeline</h3>
            <Timeline status={order.status} />
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-chrome">Detail Pesanan</h3>
            <div className="space-y-2 text-sm">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray">{item.service?.name || '-'} x{item.quantity}</span>
                  <span className="text-white">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span className="text-white">Total</span>
                <span className="text-primary">{formatRupiah(order.total_price)}</span>
              </div>
            </div>
          </div>

          {order.status === 'waiting_payment' && (
            <Link
              to={`/pesan/pembayaran/${order.order_code}`}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              Bayar Sekarang
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function AuthenticatedTrack() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAll();
      const allOrders = data.orders?.data || data.orders || [];
      const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      setOrders(activeOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-heading text-[28px] text-white tracking-[1px] mb-2">Lacak Pesanan</h1>
        <p className="text-gray">Pantau status pesanan Anda secara real-time</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border">
          <Package className="w-12 h-12 text-gray mx-auto mb-4" />
          <p className="text-gray mb-4">Belum ada pesanan</p>
          <Link to="/pesan" className="btn-primary inline-flex items-center gap-2">
            Buat Pesanan
          </Link>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </>
  );
}

export default function TrackOrderPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {isAuthenticated ? <AuthenticatedTrack /> : <GuestTrackForm />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
