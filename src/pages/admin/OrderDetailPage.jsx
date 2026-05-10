import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ArrowLeft, CheckCircle, XCircle, Clock, Package, Truck } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'gray' },
  { value: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock, color: 'yellow' },
  { value: 'paid', label: 'Lunas', icon: CheckCircle, color: 'blue' },
  { value: 'processed', label: 'Diproses', icon: Package, color: 'purple' },
  { value: 'completed', label: 'Selesai', icon: CheckCircle, color: 'green' },
  { value: 'cancelled', label: 'Batal', icon: XCircle, color: 'red' },
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!confirm('Update status pesanan ini?')) return;

    setUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      await fetchOrder();
    } catch (error) {
      alert('Gagal update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Pesanan tidak ditemukan</p>
        <Link to="/admin/pesanan" className="btn-primary mt-4">Kembali</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/pesanan" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6">
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Daftar Pesanan
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Detail Pesanan</h1>
          <p className="text-text-secondary">Kode: <span className="font-mono font-bold text-primary">{order.order_code}</span></p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Informasi Customer</h2>
          <div className="space-y-3">
            <div>
              <p className="text-text-secondary text-sm">Nama</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Email</p>
              <p>{order.customer_email || '-'}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">No. HP</p>
              <p>{order.phone}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Alamat</p>
              <p>{order.address}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Pengiriman</p>
              <p>{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-text-secondary text-sm">Catatan</p>
                <p className="font-medium">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Update Status</h2>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateStatus(option.value)}
                disabled={updating || order.status === option.value}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  order.status === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 disabled:opacity-50'
                }`}
              >
                <option.icon className={`w-5 h-5 ${
                  order.status === option.value ? 'text-primary' : 'text-text-secondary'
                }`} />
                <span className="font-medium">{option.label}</span>
                {order.status === option.value && (
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold mb-4">Item Pesanan</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Layanan</th>
              <th className="px-4 py-3 text-left">Produk</th>
              <th className="px-4 py-3 text-left">Ukuran</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.service?.name || '-'}</td>
                <td className="px-4 py-3">{item.product_name}</td>
                <td className="px-4 py-3">{item.size || '-'}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">Rp {item.unit_price.toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-right font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="5" className="px-4 py-3 text-right">Subtotal</td>
              <td className="px-4 py-3 text-right">Rp {order.subtotal.toLocaleString('id-ID')}</td>
            </tr>
            {order.shipping_cost > 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-3 text-right">Ongkos Kirim</td>
                <td className="px-4 py-3 text-right">Rp {order.shipping_cost.toLocaleString('id-ID')}</td>
              </tr>
            )}
            <tr className="font-bold">
              <td colSpan="5" className="px-4 py-3 text-right">Total</td>
              <td className="px-4 py-3 text-right text-primary text-lg">Rp {order.total_price.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.payments?.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-semibold mb-4">Riwayat Pembayaran</h2>
          <div className="space-y-4">
            {order.payments.map((payment) => (
              <div key={payment.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{payment.payment_method.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-text-secondary text-sm">
                      {payment.payment_type === 'dp' ? 'DP' : payment.payment_type === 'full' ? 'Lunas' : 'Pelunasan'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">Rp {payment.amount.toLocaleString('id-ID')}</p>
                    <span className={`badge ${
                      payment.payment_status === 'verified' ? 'badge-completed' :
                      payment.payment_status === 'pending' ? 'badge-waiting' : 'badge-cancelled'
                    }`}>
                      {payment.payment_status}
                    </span>
                  </div>
                </div>
                {payment.payment_proof && (
                  <img
                    src={`http://localhost:8000/${payment.payment_proof}`}
                    alt="Bukti pembayaran"
                    className="mt-3 max-h-48 rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => window.open(`http://localhost:8000/${payment.payment_proof}`, '_blank')}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.items?.some((i) => i.design) && (
        <div className="card mt-6">
          <h2 className="font-semibold mb-4">Desain</h2>
          {order.items.filter((i) => i.design).map((item) => (
            <div key={item.id} className="flex gap-4">
              <img
                src={item.design.image_url}
                alt="Design"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div>
                <p className="font-medium">{item.design.design_type === 'ai_generated' ? 'AI Generated' : 'Uploaded'}</p>
                <p className={`text-sm ${item.design.is_valid ? 'text-success' : 'text-warning'}`}>
                  {item.design.is_valid ? 'Valid - Siap Produksi' : 'Perlu Revisi'}
                </p>
                {item.design.validation_message && (
                  <p className="text-text-secondary text-sm mt-1 whitespace-pre-line">
                    {item.design.validation_message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}