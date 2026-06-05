import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { orderService } from '../../services/orderService';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';
import { formatRupiah } from '../../utils/formatRupiah';

export default function Step6Checkout() {
  const navigate = useNavigate();
  const { selectedService, productDetail, design, customerData, paymentMethod, setPaymentMethod, setOrderResult, prevStep, resetAll } = useOrderStore();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const subtotal = productDetail.quantity * (selectedService?.price_per_unit || 0);
  const shipping = customerData.deliveryMethod === 'delivery' ? 15000 : 0;
  const total = subtotal + shipping;
  const dpAmount = Math.round(total * 0.5);

  const buildOrderItems = () => {
    const items = [];
    const hasSizes = productDetail.sizes?.length > 0;

    if (hasSizes) {
      productDetail.sizes.forEach((size) => {
        items.push({
          service_id: selectedService.id,
          product_name: `${selectedService.name} - Ukuran ${size.size}`,
          size: size.size,
          quantity: size.quantity,
          unit_price: selectedService.price_per_unit,
          design_type: design.type,
          design_id: design.id,
          design_notes: productDetail.notes,
        });
      });
    } else {
      const detailInfo = [];
      if (productDetail.dimension?.width) detailInfo.push(`Ukuran: ${productDetail.dimension.width}${productDetail.dimension.unit || 'cm'}`);
      if (productDetail.material) detailInfo.push(`Bahan: ${productDetail.material}`);
      if (productDetail.finishing) detailInfo.push(`Finishing: ${productDetail.finishing}`);

      const productName = detailInfo.length > 0
        ? `${selectedService.name} (${detailInfo.join(', ')})`
        : selectedService.name;

      items.push({
        service_id: selectedService.id,
        product_name: productName,
        size: null,
        quantity: productDetail.quantity || 1,
        unit_price: selectedService.price_per_unit,
        design_type: design.type,
        design_id: design.id,
        design_notes: productDetail.notes,
      });
    }
    return items;
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setError(null);
    try {
      const result = await orderService.create({
        customer_name: customerData.name,
        customer_email: customerData.email || null,
        phone: customerData.phone,
        address: customerData.address,
        delivery_method: customerData.deliveryMethod,
        notes: productDetail.notes || null,
        items: buildOrderItems(),
      });
      setOrderResult(result.order);
      toast.success('Pesanan berhasil dibuat!');
      resetAll();
      navigate(`/pesan/pembayaran/${result.order.order_code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan');
      toast.error('Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: 'transfer_bank', label: 'Transfer Bank', icon: 'credit-card' },
    { id: 'qris', label: 'QRIS', icon: 'grid' },
    { id: 'cash', label: 'Cash', icon: 'dollar-sign' },
  ];

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">Review & Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="package" size={18} className="text-primary" /> Detail Pesanan
          </h3>
          <div className="bg-ink border border-border rounded-xl p-4 mb-4">
            <div className="flex items-start gap-4">
              {design.imageUrl && (
                <img src={design.imageUrl} alt="Design" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-white">{selectedService?.name}</p>
                <p className="text-gray text-sm">
                  {productDetail.sizes?.length > 0
                    ? productDetail.sizes.map((s) => `${s.size}: ${s.quantity} pcs`).join(', ')
                    : `${productDetail.quantity || 1} pcs`}
                  {productDetail.dimension?.width && ` | ${productDetail.dimension.width}${productDetail.dimension.unit || 'cm'}`}
                  {productDetail.material && ` | ${productDetail.material}`}
                </p>
                {productDetail.notes && <p className="text-gray text-sm mt-1 line-clamp-2">Note: {productDetail.notes}</p>}
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="user" size={18} className="text-primary" /> Data Customer
          </h3>
          <div className="bg-ink border border-border rounded-xl p-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-white"><Icon name="user" size={16} className="text-gray" /> {customerData.name}</p>
            <p className="flex items-center gap-2 text-white"><Icon name="phone" size={16} className="text-gray" /> {customerData.phone}</p>
            {customerData.email && <p className="flex items-center gap-2 text-white"><Icon name="mail" size={16} className="text-gray" /> {customerData.email}</p>}
            <p className="flex items-center gap-2 text-white"><Icon name="map-pin" size={16} className="text-gray" /> {customerData.address || 'Ambil sendiri di toko'}</p>
            <p className="flex items-center gap-2 text-white"><Icon name={customerData.deliveryMethod === 'pickup' ? 'map-pin' : 'truck'} size={16} className="text-gray" /> {customerData.deliveryMethod === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="credit-card" size={18} className="text-primary" /> Metode Pembayaran
          </h3>
          <div className="space-y-3 mb-6">
            {paymentMethods.map((method) => (
              <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${
                  paymentMethod === method.id
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}>
                <Icon name={method.icon} size={20} className={paymentMethod === method.id ? 'text-primary' : 'text-gray'} />
                <span className="font-medium text-white">{method.label}</span>
                {paymentMethod === method.id && <Icon name="check-circle" size={20} className="text-primary ml-auto" />}
              </button>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Icon name="file-text" size={18} className="text-primary" /> Ringkasan
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white"><span className="text-gray">Subtotal</span><span>{productDetail.quantity} pcs</span></div>
              {shipping > 0 && <div className="flex justify-between text-white"><span className="text-gray">Ongkir</span><span>{formatRupiah(shipping)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border text-white"><span>Total</span><span className="text-primary">{formatRupiah(total)}</span></div>
            </div>
            <div className="mt-4 p-3 bg-warning/10 rounded-xl border border-warning/20">
              <p className="text-sm text-warning flex items-center gap-2"><Icon name="alert-circle" size={16} /> DP 50%: <strong>{formatRupiah(dpAmount)}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-2">
          <Icon name="alert-circle" size={20} className="text-danger flex-shrink-0" />
          <span className="text-danger flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-danger hover:text-white transition-colors">
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} disabled={submitting}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={() => setShowConfirm(true)} disabled={submitting}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
          <Icon name="check-circle" size={20} /> Konfirmasi Pesanan
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-ink border-2 border-primary w-full max-w-md p-6 rounded-2xl animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="alert-circle" size={32} className="text-primary" />
              </div>
              <h3 className="font-heading text-2xl text-white tracking-[1px] mb-2">Konfirmasi Pesanan</h3>
              <p className="text-gray text-sm">Pastikan semua data pesanan sudah benar sebelum mengirim.</p>
            </div>

            <div className="bg-card rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between text-white"><span className="text-gray">Layanan</span><span>{selectedService?.name}</span></div>
              <div className="flex justify-between text-white"><span className="text-gray">Quantity</span><span>{productDetail.quantity} pcs</span></div>
              <div className="flex justify-between text-white"><span className="text-gray">Total</span><span className="text-primary font-bold">{formatRupiah(total)}</span></div>
              <div className="flex justify-between text-white"><span className="text-gray">DP</span><span className="text-warning font-bold">{formatRupiah(dpAmount)}</span></div>
            </div>

            <p className="text-gray text-xs text-center mb-4">Anda akan diarahkan ke halaman pembayaran setelah pesanan dikonfirmasi.</p>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={submitting}
                className="flex-1 border-2 border-border text-gray font-semibold py-3 rounded-xl hover:bg-dark transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memproses...</>
                ) : (
                  <><Icon name="check-circle" size={18} /> Ya, Pesan Sekarang</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
