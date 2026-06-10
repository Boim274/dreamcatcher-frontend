import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ArrowLeft, CheckCircle, XCircle, Clock, Package, Truck } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

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
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState({ show: false, status: null, label: '' });

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
    const label = statusOptions.find((o) => o.value === newStatus)?.label || newStatus;
    setConfirmStatus({ show: true, status: newStatus, label });
  };

  const handleConfirmStatus = async () => {
    const newStatus = confirmStatus.status;
    setConfirmStatus({ show: false, status: null, label: '' });
    setUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      toast.success(`Status pesanan diubah menjadi "${confirmStatus.label}"`);
      await fetchOrder();
    } catch (error) {
      toast.error('Gagal update status');
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
          <h1 className="font-heading text-[28px] text-white tracking-[1px]">Detail Pesanan</h1>
          <p className="text-gray">Kode: <span className="font-mono font-bold text-primary">{order.order_code}</span></p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <h2 className="font-semibold mb-4 text-white">Informasi Customer</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray text-sm">Nama</p>
              <p className="font-medium text-white">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-gray text-sm">Email</p>
              <p className="text-white">{order.customer_email || '-'}</p>
            </div>
            <div>
              <p className="text-gray text-sm">No. HP</p>
              <p className="text-white">{order.phone}</p>
            </div>
            <div>
              <p className="text-gray text-sm">Alamat</p>
              <p className="text-white">{order.address}</p>
            </div>
            <div>
              <p className="text-gray text-sm">Pengiriman</p>
              <p className="text-white">{order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-gray text-sm">Catatan</p>
                <p className="font-medium text-white">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="font-semibold mb-4 text-white">Update Status</h2>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateStatus(option.value)}
                disabled={updating || order.status === option.value}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  order.status === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-gray-dark disabled:opacity-50'
                }`}
              >
                <option.icon className={`w-5 h-5 ${
                  order.status === option.value ? 'text-primary' : 'text-gray'
                }`} />
                <span className="font-medium text-white">{option.label}</span>
                {order.status === option.value && (
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 mt-6">
        <h2 className="font-semibold mb-4 text-white">Item Pesanan</h2>
        <table className="w-full">
          <thead className="bg-ink">
            <tr>
              <th className="px-4 py-3 text-left text-gray">Layanan</th>
              <th className="px-4 py-3 text-left text-gray">Produk</th>
              <th className="px-4 py-3 text-left text-gray">Ukuran</th>
              <th className="px-4 py-3 text-right text-gray">Qty</th>
              <th className="px-4 py-3 text-right text-gray">Harga</th>
              <th className="px-4 py-3 text-right text-gray">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-[#ccc]">{item.service?.name || '-'}</td>
                <td className="px-4 py-3 text-white">{item.product_name}</td>
                <td className="px-4 py-3 text-[#ccc]">{item.size || '-'}</td>
                <td className="px-4 py-3 text-right text-[#ccc]">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-[#ccc]">{formatRupiah(item.unit_price)}</td>
                <td className="px-4 py-3 text-right font-bold text-white">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-ink">
            <tr>
              <td colSpan="5" className="px-4 py-3 text-right text-gray">Subtotal</td>
              <td className="px-4 py-3 text-right text-white">{formatRupiah(order.subtotal)}</td>
            </tr>
            {order.shipping_cost > 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-3 text-right text-gray">Ongkos Kirim</td>
                <td className="px-4 py-3 text-right text-white">{formatRupiah(order.shipping_cost)}</td>
              </tr>
            )}
            <tr className="font-bold">
              <td colSpan="5" className="px-4 py-3 text-right text-gray">Total</td>
              <td className="px-4 py-3 text-right text-primary text-lg">{formatRupiah(order.total_price)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.payments?.length > 0 && (
        <div className="bg-card border border-border p-6 mt-6">
          <h2 className="font-semibold mb-4 text-white">Riwayat Pembayaran</h2>
          <div className="space-y-4">
            {order.payments.map((payment) => (
              <div key={payment.id} className="p-4 bg-ink border border-border rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{payment.payment_method.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-gray text-sm">
                      {payment.payment_type === 'dp' ? 'DP' : payment.payment_type === 'full' ? 'Lunas' : 'Pelunasan'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-white">{formatRupiah(payment.amount)}</p>
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
                    src={getImageUrl(payment.payment_proof)}
                    alt="Bukti pembayaran"
                    className="mt-3 max-h-48 rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => window.open(getImageUrl(payment.payment_proof), '_blank')}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.items?.some((i) => i.design) && (
        <div className="bg-card border border-border p-6 mt-6">
          <h2 className="font-semibold mb-4 text-white">Desain</h2>
          {order.items.filter((i) => i.design).map((item) => (
            <div key={item.id} className="flex gap-4">
              <img
                src={getImageUrl(item.design.image_url)}
                alt="Design"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div>
                <p className="font-medium text-white">{item.design.design_type === 'ai_generated' ? 'AI Generated' : 'Uploaded'}</p>
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

      <ConfirmDialog
        isOpen={confirmStatus.show}
        onClose={() => setConfirmStatus({ show: false, status: null, label: '' })}
        onConfirm={handleConfirmStatus}
        title="Update Status Pesanan"
        message={`Apakah Anda yakin ingin mengubah status pesanan menjadi "${confirmStatus.label}"?`}
        confirmLabel="Ya, Ubah Status"
      />
    </div>
  );
}