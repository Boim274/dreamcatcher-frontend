import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Package, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../utils/formatRupiah';

function HistoryCard({ order }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="bg-card border border-border p-6 mb-4 animate-fade-in">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetail(!showDetail)}
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
          <ChevronRight className={`w-5 h-5 text-gray transition-transform ${showDetail ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {showDetail && (
        <div className="mt-6 animate-fade-in border-t border-border pt-4">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-chrome">Detail Pesanan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray">Nama</span>
              <span className="text-white">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray">No. HP</span>
              <span className="text-white">{order.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray">Pengiriman</span>
              <span className="text-white">{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</span>
            </div>
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
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAll();
      const allOrders = data.orders?.data || data.orders || [];
      const historyOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'cancelled');
      setOrders(historyOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="font-heading text-[28px] text-white tracking-[1px] mb-2">Riwayat Pemesanan</h1>
            <p className="text-gray">Daftar pesanan yang sudah selesai atau dibatalkan</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border">
              <Package className="w-12 h-12 text-gray mx-auto mb-4" />
              <p className="text-gray mb-4">Belum ada riwayat pemesanan</p>
              <Link to="/pesan" className="btn-primary inline-flex items-center gap-2">
                Buat Pesanan
              </Link>
            </div>
          ) : (
            <div>
              {orders.map((order) => (
                <HistoryCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
