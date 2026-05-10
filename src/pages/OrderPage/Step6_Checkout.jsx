import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { orderService } from '../../services/orderService';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';

export default function Step6Checkout() {
  const navigate = useNavigate();
  const { selectedService, productDetail, design, customerData, setOrderResult, prevStep } = useOrderStore();
  const [paymentMethod, setPaymentMethod] = useState('transfer_bank');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = productDetail.quantity * (selectedService?.price_per_unit || 0);
  const shipping = customerData.deliveryMethod === 'delivery' ? 15000 : 0;
  const total = subtotal + shipping;
  const dpAmount = Math.round(total * 0.5);

  const buildOrderItems = () => {
    const items = [];
    if (productDetail.sizes.length > 0) {
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
      items.push({
        service_id: selectedService.id,
        product_name: selectedService.name,
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
      navigate(`/pesan/pembayaran/${result.order.order_code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Review & Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-4">Detail Pesanan</h3>
          <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
            <div className="flex items-start gap-4">
              {design.imageUrl && <img src={design.imageUrl} alt="Design" className="w-20 h-20 object-cover rounded-lg" />}
              <div>
                <p className="font-medium">{selectedService?.name}</p>
                <p className="text-[#6B7280] text-sm">
                  {productDetail.sizes.length > 0 ? productDetail.sizes.map((s) => `${s.size}: ${s.quantity} pcs`).join(', ') : `${productDetail.quantity} pcs`}
                </p>
                {productDetail.notes && <p className="text-[#6B7280] text-sm mt-1">Note: {productDetail.notes}</p>}
              </div>
            </div>
          </div>

          <h3 className="font-semibold mb-4">Data Customer</h3>
          <div className="bg-[#F8F9FA] rounded-xl p-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><Icon name="user" size={16} className="text-[#6B7280]" /> {customerData.name}</p>
            <p className="flex items-center gap-2"><Icon name="phone" size={16} className="text-[#6B7280]" /> {customerData.phone}</p>
            <p className="flex items-center gap-2"><Icon name="map-pin" size={16} className="text-[#6B7280]" /> {customerData.address}</p>
            <p className="flex items-center gap-2"><Icon name={customerData.deliveryMethod === 'pickup' ? 'map-pin' : 'truck'} size={16} className="text-[#6B7280]" /> {customerData.deliveryMethod === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Metode Pembayaran</h3>
          <div className="space-y-3 mb-6">
            {[
              { id: 'transfer_bank', label: 'Transfer Bank', icon: 'credit-card' },
              { id: 'qris', label: 'QRIS', icon: 'grid' },
              { id: 'cash', label: 'Cash', icon: 'dollar-sign' }
            ].map((method) => (
              <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === method.id ? 'border-[#FF6B35] bg-[#FF6B35]/5' : 'border-gray-200 hover:border-[#FF6B35]/50'}`}>
                <Icon name={method.icon} size={20} className={paymentMethod === method.id ? 'text-[#FF6B35]' : 'text-[#6B7280]'} />
                <span className="font-medium">{method.label}</span>
                {paymentMethod === method.id && <Icon name="check-circle" size={20} className="text-[#FF6B35] ml-auto" />}
              </button>
            ))}
          </div>

          <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-xl p-4">
            <h4 className="font-semibold mb-3">Ringkasan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6B7280]">Subtotal</span><span>{productDetail.quantity} pcs</span></div>
              {shipping > 0 && <div className="flex justify-between"><span className="text-[#6B7280]">Ongkir</span><span>Rp {shipping.toLocaleString('id-ID')}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-[#FF6B35]">Rp {total.toLocaleString('id-ID')}</span></div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 flex items-center gap-2"><Icon name="alert-circle" size={16} /> DP 50%: <strong>Rp {dpAmount.toLocaleString('id-ID')}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-[#EF4444]"><Icon name="alert-circle" size={20} className="text-[#EF4444]" /> {error}</div>}

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-[#FF6B35] text-[#FF6B35] font-semibold py-3 px-6 rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-2 flex-1 justify-center bg-[#FF6B35] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#E55A26] transition-colors disabled:opacity-50">
          {submitting ? <><Spinner size="sm" /> Memproses...</> : <><Icon name="check-circle" size={20} /> Konfirmasi Pesanan</>}
        </button>
      </div>
    </div>
  );
}