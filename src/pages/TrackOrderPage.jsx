import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Search, CheckCircle, Clock, Package, Truck, Phone } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock },
  { key: 'paid', label: 'Pembayaran Terverifikasi', icon: CheckCircle },
  { key: 'processed', label: 'Diproses', icon: Package },
  { key: 'completed', label: 'Selesai', icon: CheckCircle },
];

const statusOrder = ['pending', 'waiting_payment', 'paid', 'processed', 'completed'];

export default function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
      console.error('Track failed:', err);
      setError(err.response?.data?.message || 'Pesanan tidak ditemukan. Periksa kode dan nomor HP.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    return statusOrder.indexOf(order.status);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Lacak Pesanan</h1>
            <p className="text-text-secondary">Masukkan kode pesanan dan nomor HP untuk melacak status pesanan Anda</p>
          </div>

          <form onSubmit={handleTrack} className="card mb-8">
            <div className="space-y-4">
              <div>
                <label className="font-medium mb-2 block">Kode Pesanan</label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="DC20241215XXXX"
                  className="input-field text-lg font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="font-medium mb-2 block">Nomor HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="input-field"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-danger/10 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Lacak Pesanan
                </>
              )}
            </button>
          </form>

          {order && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-text-secondary text-sm">Kode Pesanan</p>
                  <p className="font-heading font-bold text-2xl text-primary">{order.order_code}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mb-8">
                <h3 className="font-semibold mb-4">Timeline Pesanan</h3>
                <div className="space-y-4">
                  {statusSteps.map((step, index) => {
                    const currentIndex = getCurrentStep();
                    const stepIndex = statusOrder.indexOf(step.key);
                    const isCompleted = stepIndex < currentIndex;
                    const isCurrent = stepIndex === currentIndex;
                    const isPending = stepIndex > currentIndex;

                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-success text-white'
                              : isCurrent
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-text-secondary'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <step.icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isPending ? 'text-text-secondary' : ''}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-text-secondary text-sm">Sedang berlangsung</p>
                          )}
                        </div>
                        {isCurrent && (
                          <span className="badge badge-waiting">Sekarang</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Detail Pesanan</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Nama</span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">No. HP</span>
                    <span>{order.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Layanan</span>
                    <span>{order.items?.[0]?.service?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Pengiriman</span>
                    <span>{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</span>
                  </div>
                  {order.delivery_method === 'delivery' && order.address && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Alamat</span>
                      <span>{order.address}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-text-secondary text-sm">Catatan:</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <a
                  href="https://wa.me/6281234567890"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Hubungi Kami
                </a>
                <Link to="/pesan" className="btn-secondary flex-1 text-center">
                  Pesan Lagi
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}