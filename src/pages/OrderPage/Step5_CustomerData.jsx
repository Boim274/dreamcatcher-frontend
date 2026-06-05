import { useState, useEffect, useRef } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import Icon from '../../components/ui/Icon';

export default function Step5CustomerData() {
  const { customerData, setCustomerData, nextStep, prevStep } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState(customerData);
  const [errors, setErrors] = useState({});
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !prefilledRef.current && !customerData.name) {
      prefilledRef.current = true;
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [isAuthenticated, user, customerData.name]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nama harus diisi';
    if (!form.phone.trim()) {
      newErrors.phone = 'Nomor HP harus diisi';
    } else {
      const cleaned = form.phone.replace(/[\s-]/g, '');
      if (!/^[0-9+]{10,15}$/.test(cleaned)) {
        newErrors.phone = 'Nomor HP tidak valid (10-15 digit)';
      }
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (form.deliveryMethod === 'delivery' && !form.address.trim()) {
      newErrors.address = 'Alamat harus diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const handleNext = () => {
    if (validate()) {
      setCustomerData(form);
      nextStep();
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 pl-11 border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-ink text-white transition-colors ${
      errors[field] ? 'border-danger' : 'border-border'
    }`;

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">Data Customer</h2>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2">
            Nama Lengkap
          </label>
          <div className="relative">
            <Icon name="user" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray pointer-events-none" />
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Masukkan nama lengkap"
              className={inputClass('name')} />
          </div>
          {errors.name && <p className="text-danger text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Email (opsional)</label>
            <div className="relative">
              <Icon name="mail" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray pointer-events-none" />
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="email@example.com"
                className={inputClass('email')} />
            </div>
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Nomor HP</label>
            <div className="relative">
              <Icon name="phone" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray pointer-events-none" />
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="081234567890"
                className={inputClass('phone')} />
            </div>
            {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Metode Pengiriman</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => handleChange('deliveryMethod', 'pickup')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                form.deliveryMethod === 'pickup'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}>
              <Icon name="map-pin" size={24} className={`mx-auto mb-2 transition-colors ${form.deliveryMethod === 'pickup' ? 'text-primary' : 'text-gray'}`} />
              <p className="font-medium text-white text-center">Ambil Sendiri</p>
              <p className="text-sm text-gray text-center">Di toko</p>
            </button>
            <button type="button" onClick={() => handleChange('deliveryMethod', 'delivery')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                form.deliveryMethod === 'delivery'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}>
              <Icon name="truck" size={24} className={`mx-auto mb-2 transition-colors ${form.deliveryMethod === 'delivery' ? 'text-primary' : 'text-gray'}`} />
              <p className="font-medium text-white text-center">Dikirim</p>
              <p className="text-sm text-gray text-center">+ Rp 15.000</p>
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          {form.deliveryMethod === 'delivery' ? (
            <div className="animate-slide-up">
              <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Alamat Pengiriman</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Masukkan alamat lengkap (Jalan, No. RT/RW, Kelurahan, Kota)"
                maxLength={500}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none bg-ink text-white transition-colors ${
                  errors.address ? 'border-danger' : 'border-border'
                }`} />
              <div className="flex justify-between mt-1">
                {errors.address ? (
                  <p className="text-danger text-sm">{errors.address}</p>
                ) : <span />}
                <p className="text-gray text-[11px]">{form.address.length}/500</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-ink border border-border rounded-xl animate-slide-up">
              <p className="text-gray text-sm mb-2">Lokasi Pengambilan:</p>
              <p className="font-medium text-white">Jl. Sudirman No. 123, Jakarta</p>
              <p className="text-gray text-sm mt-2 flex items-center gap-1">
                <Icon name="info" size={16} /> Bawa nomor pesanan saat pengambilan
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext} className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
