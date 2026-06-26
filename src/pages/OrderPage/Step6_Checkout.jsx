import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { formatRupiah } from '../../utils/formatRupiah';
import Icon from '../../components/ui/Icon';

export default function Step6Checkout() {
  const navigate = useNavigate();
  const { selectedService, config, sizeQuantities, design, printAreas, customerData, setCustomerData, getSizePrice, getSubtotal, getShippingCost, getTotalPrice, getDpAmount, getAreaSurcharge, prevStep, resetAll } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: customerData.name || (isAuthenticated ? user?.name : '') || '',
    email: customerData.email || (isAuthenticated ? user?.email : '') || '',
    phone: customerData.phone || (isAuthenticated ? user?.phone : '') || '',
    address: customerData.address || '',
    deliveryMethod: customerData.deliveryMethod || 'pickup',
    description: customerData.description || '',
  });
  const [errors, setErrors] = useState({});

  const total = getTotalPrice();
  const dp = getDpAmount();
  const breakdown = useOrderStore.getState().getPriceBreakdown();
  const areaSurcharge = getAreaSurcharge();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nama harus diisi';
    if (!form.phone.trim()) errs.phone = 'Nomor HP harus diisi';
    else if (!/^[0-9+]{10,15}$/.test(form.phone.replace(/[\s-]/g, ''))) errs.phone = 'Nomor HP tidak valid';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email tidak valid';
    if (form.deliveryMethod === 'delivery' && !form.address.trim()) errs.address = 'Alamat harus diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    if (!validate()) return;

    setSubmitting(true);
    setCustomerData(form);

    try {
      const configSummary = Object.entries(config)
        .filter(([key, val]) => val && key !== 'size')
        .map(([, val]) => val)
        .join(' / ');

      const items = [];
      breakdown.forEach(({ size, qty, unitPrice }) => {
        printAreas.forEach((area, areaIndex) => {
          const areaPrice = areaIndex > 0 ? unitPrice + areaSurcharge : unitPrice;
          items.push({
            service_id: selectedService.id,
            product_name: selectedService.name,
            size: size,
            quantity: qty,
            unit_price: areaPrice,
            selected_color: config.color || config.material || null,
            sablon_type: config.sablonType || null,
            print_area: area.position || null,
            print_size: area.printSize || null,
            design_type: area.design?.type || null,
            design_id: area.design?.id || null,
            design_notes: null,
          });
        });
      });

      const result = await orderService.create({
        customer_name: form.name,
        customer_email: form.email || null,
        phone: form.phone,
        address: form.address,
        delivery_method: form.deliveryMethod,
        description: form.description || null,
        notes: configSummary || null,
        items,
      });

      const orderCode = result.order?.order_code || result.order_code;
      toast.success('Pesanan berhasil dibuat!');
      resetAll();
      navigate(`/pesan/pembayaran/${orderCode}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const msgs = Object.entries(errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('\n');
        toast.error(msgs || 'Validasi gagal');
      } else {
        toast.error(err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-ink text-white transition-colors ${errors[field] ? 'border-danger' : 'border-border'}`;

  const configSummary = Object.entries(config)
    .filter(([key, val]) => val && key !== 'size')
    .map(([, val]) => val)
    .join(' / ');

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">DATA PEMESAN & SUBMIT</h2>

      {/* Mini Summary */}
      <div className="bg-ink border border-border rounded-xl p-4 mb-6">
        <p className="text-fire text-[11px] tracking-[1px] uppercase mb-2 font-medium">Ringkasan</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray">{selectedService?.name}</span>
          {configSummary && <span className="text-gray text-right">{configSummary}</span>}
        </div>
        {/* Print Areas */}
        {printAreas.length > 0 && (
          <div className="mb-2">
            {printAreas.map((area, idx) => (
              <div key={idx} className="text-xs text-gray flex items-center gap-2">
                <span className="text-primary font-semibold">Area {idx + 1}:</span>
                <span>{area.position} ({area.printSize})</span>
              </div>
            ))}
          </div>
        )}
        {/* Per-size breakdown */}
        <div className="space-y-1 mb-2">
          {breakdown.map(({ size, qty, unitPrice, subtotal }) => (
            <div key={size} className="flex justify-between text-sm">
              <span className="text-gray">{size}: {qty} x {formatRupiah(unitPrice)}</span>
              <span className="text-primary">{formatRupiah(subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
          <span className="text-white">Total</span>
          <span className="text-primary">{formatRupiah(total)}</span>
        </div>
      </div>

      {/* Customer Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nama Lengkap</label>
          <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Masukkan nama lengkap" className={inputClass('name')} />
          {errors.name && <p className="text-danger text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Email (opsional)</label>
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@example.com" className={inputClass('email')} />
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nomor HP</label>
            <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="081234567890" className={inputClass('phone')} />
            {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Metode Pengiriman</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => handleChange('deliveryMethod', 'pickup')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.deliveryMethod === 'pickup' ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border hover:border-primary/50'}`}>
              <Icon name="map-pin" size={24} className={`mx-auto mb-2 ${form.deliveryMethod === 'pickup' ? 'text-primary' : 'text-gray'}`} />
              <p className="font-medium text-white text-center text-sm">Ambil Sendiri</p>
            </button>
            <button type="button" onClick={() => {
              handleChange('deliveryMethod', 'delivery');
              if (!form.address && user?.address) {
                setForm(prev => ({ ...prev, deliveryMethod: 'delivery', address: user.address }));
              }
            }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.deliveryMethod === 'delivery' ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border hover:border-primary/50'}`}>
              <Icon name="truck" size={24} className={`mx-auto mb-2 ${form.deliveryMethod === 'delivery' ? 'text-primary' : 'text-gray'}`} />
              <p className="font-medium text-white text-center text-sm">Dikirim</p>
              <p className="text-gray text-xs text-center">+ Rp 15.000</p>
            </button>
          </div>
        </div>

        {form.deliveryMethod === 'delivery' && (
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Alamat Pengiriman</label>
            <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Jalan, No. RT/RW, Kelurahan, Kecamatan, Kota"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none bg-ink text-white transition-colors ${errors.address ? 'border-danger' : 'border-border'}`} />
            {errors.address && <p className="text-danger text-sm mt-1">{errors.address}</p>}
          </div>
        )}
      </div>

      {/* Deskripsi Pesanan */}
      <div className="mb-6">
        <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Deskripsi Pesanan (opsional)</label>
        <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Contoh: Kaos komunitas warna hitam, sablon plastisol, logo di dada kiri, tulisan di belakang"
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none bg-ink text-white transition-colors" />
        <p className="text-gray text-[11px] mt-1">Deskripsi ini akan ditampilkan saat Anda melacak pesanan.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={prevStep} disabled={submitting}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors disabled:opacity-50 text-[13px] uppercase tracking-[1px]">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={() => { if (validate()) setShowConfirm(true); }} disabled={submitting}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-[13px] uppercase tracking-[1px]">
          <Icon name="send" size={20} /> Submit Pesanan
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary w-full max-w-md p-6 rounded-2xl animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="send" size={32} className="text-primary" />
              </div>
              <h3 className="font-heading text-2xl text-white tracking-[1px] mb-2">Submit Pesanan?</h3>
              <p className="text-gray text-sm">DP: {formatRupiah(dp)} | Total: {formatRupiah(total)}</p>
              {/* Per-size summary in confirm */}
              <div className="mt-3 space-y-1">
                {breakdown.map(({ size, qty }) => (
                  <span key={size} className="inline-block text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded mr-1">
                    {size}: {qty}pcs
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={submitting}
                className="flex-1 border-2 border-border text-gray font-semibold py-3 rounded-xl hover:bg-dark transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-ink font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Mengirim...</>
                ) : (
                  <><Icon name="send" size={18} /> Ya, Submit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
