import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';

export default function Step5CustomerData() {
  const { customerData, setCustomerData, nextStep, prevStep } = useOrderStore();
  const [form, setForm] = useState(customerData);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nama harus diisi';
    if (!form.phone.trim()) newErrors.phone = 'Nomor HP harus diisi';
    else if (!/^[0-9+\s-]{10,16}$/.test(form.phone.replace(/\s/g, '').replace(/^0/, '08'))) newErrors.phone = 'Nomor HP tidak valid';
    if (form.deliveryMethod === 'delivery' && !form.address.trim()) newErrors.address = 'Alamat harus diisi';
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

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Data Customer</h2>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 font-medium mb-2">
            <Icon name="user" size={20} className="text-[#6B7280]" /> Nama Lengkap
          </label>
          <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Masukkan nama"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#982598] focus:ring-2 focus:ring-[#982598]/20 ${errors.name ? 'border-[#EF4444]' : 'border-gray-300'}`} />
          {errors.name && <p className="text-[#EF4444] text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-medium mb-2 block">Email (opsional)</label>
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#982598] focus:ring-2 focus:ring-[#982598]/20" />
          </div>
          <div>
            <label className="font-medium mb-2 block">Nomor HP</label>
            <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="081234567890"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#982598] focus:ring-2 focus:ring-[#982598]/20 ${errors.phone ? 'border-[#EF4444]' : 'border-gray-300'}`} />
            {errors.phone && <p className="text-[#EF4444] text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="font-medium mb-3 block">Metode Pengiriman</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => handleChange('deliveryMethod', 'pickup')}
              className={`p-4 rounded-xl border-2 transition-all ${form.deliveryMethod === 'pickup' ? 'border-[#982598] bg-[#982598]/5' : 'border-gray-200 hover:border-[#982598]/50'}`}>
              <Icon name="map-pin" size={24} className={`mx-auto mb-2 ${form.deliveryMethod === 'pickup' ? 'text-[#982598]' : 'text-[#6B7280]'}`} />
              <p className="font-medium">Ambil Sendiri</p>
              <p className="text-sm text-[#6B7280]">Di toko</p>
            </button>
            <button type="button" onClick={() => handleChange('deliveryMethod', 'delivery')}
              className={`p-4 rounded-xl border-2 transition-all ${form.deliveryMethod === 'delivery' ? 'border-[#982598] bg-[#982598]/5' : 'border-gray-200 hover:border-[#982598]/50'}`}>
              <Icon name="truck" size={24} className={`mx-auto mb-2 ${form.deliveryMethod === 'delivery' ? 'text-[#982598]' : 'text-[#6B7280]'}`} />
              <p className="font-medium">Dikirim</p>
              <p className="text-sm text-[#6B7280]">+ Rp 15.000</p>
            </button>
          </div>
        </div>

        <div>
          {form.deliveryMethod === 'delivery' && (
            <>
              <label className="font-medium mb-2 block">Alamat Pengiriman</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Masukkan alamat lengkap"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#982598] focus:ring-2 focus:ring-[#982598]/20 min-h-[100px] resize-none ${errors.address ? 'border-[#EF4444]' : 'border-gray-300'}`} />
              {errors.address && <p className="text-[#EF4444] text-sm mt-1">{errors.address}</p>}
            </>
          )}
          {form.deliveryMethod === 'pickup' && (
            <div className="p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-[#6B7280] text-sm mb-2">Lokasi Pengambilan:</p>
              <p className="font-medium">Jl. Sudirman No. 123, Jakarta</p>
              <p className="text-[#6B7280] text-sm mt-2 flex items-center gap-1">
                <Icon name="info" size={16} /> Bawa nomor pesanan saat pengambilan
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button onClick={prevStep} className="flex items-center gap-2 border-2 border-[#982598] text-[#982598] font-semibold py-3 px-6 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext} className="flex items-center gap-2 flex-1 justify-center bg-[#982598] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#7a1f7a] transition-colors">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}