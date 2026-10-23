import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { formatRupiah } from '../../utils/formatRupiah';
import Icon from '../../components/ui/Icon';
import CustomerProfileModal from '../../components/common/CustomerProfileModal';
import PhoneCountryInput from '../../components/common/PhoneCountryInput';
import OrderReceipt from '../../components/common/OrderReceipt';
import { getCleanConfigItems, formatConfigSummary } from '../../utils/orderReceiptHelper';
import { Printer, Eye, Receipt, Layers } from 'lucide-react';

export default function Step6Checkout() {
  const navigate = useNavigate();
  const { t, td, language } = useLanguageStore();
  const orderStore = useOrderStore();
  const { selectedService, config, sizeQuantities, design, printAreas, customerData, setCustomerData, getSizePrice, getSubtotal, getShippingCost, getTotalPrice, getDpAmount, getAreaSurcharge, prevStep, resetAll } = orderStore;
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [form, setForm] = useState({
    name: customerData.name || (isAuthenticated ? user?.name : '') || '',
    phone: customerData.phone || (isAuthenticated ? user?.phone : '') || '',
    email: customerData.email || (isAuthenticated ? user?.email : '') || '',
    address: customerData.address || (isAuthenticated ? user?.address : '') || '',
    deliveryMethod: customerData.deliveryMethod || 'pickup',
    description: customerData.description || '',
  });
  const [errors, setErrors] = useState({});

  // Sync profile data from user if form fields are still empty
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        address: prev.address || user.address || '',
      }));
    }
  }, [user]);

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotalPrice();
  const dp = getDpAmount();
  const breakdown = orderStore.getPriceBreakdown ? orderStore.getPriceBreakdown() : useOrderStore.getState().getPriceBreakdown();
  const areaSurcharge = getAreaSurcharge();

  const validate = () => {
    const errs = {};
    const name = (form.name || '').trim();
    const phone = (form.phone || '').trim();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    if (!name) {
      errs.name = language === 'en' ? 'Full name is required' : 'Nama lengkap harus diisi';
    }
    if (!phone || phone === '+62') {
      errs.phone = language === 'en' ? 'Phone number is required' : 'Nomor HP harus diisi';
    } else if (!/^\+?[0-9]{8,20}$/.test(cleanPhone)) {
      errs.phone = language === 'en' ? 'Invalid phone number (must be 8-20 digits)' : 'Nomor HP tidak valid (harus 8-20 digit angka)';
    }

    if (form.deliveryMethod === 'delivery' && !form.address.trim()) {
      errs.address = language === 'en' ? 'Shipping address is required for Delivery option' : 'Alamat pengiriman harus diisi jika memilih opsi Dikirim';
    }

    setErrors(errs);

    const firstError = Object.values(errs)[0];
    if (firstError) {
      toast.warning(firstError);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    if (!validate()) return;

    setSubmitting(true);
    setCustomerData({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      deliveryMethod: form.deliveryMethod,
      description: form.description.trim(),
    });

    try {
      const configSummary = formatConfigSummary(config, language, td);

      const items = [];
      const itemProductName = config.shirtModel
        ? `${selectedService.name} (${config.shirtModel})`
        : selectedService.name;

      if (breakdown.length > 0) {
        breakdown.forEach(({ size, qty, unitPrice }) => {
          printAreas.forEach((area, areaIndex) => {
            const areaPrice = areaIndex > 0 ? areaSurcharge : unitPrice;
            const targetDesignId = area.design?.id || printAreas[0]?.design?.id || design?.id || null;
            const targetDesignType = (area.design?.type === 'chat_upload' ? 'uploaded' : area.design?.type)
              || (printAreas[0]?.design?.type === 'chat_upload' ? 'uploaded' : printAreas[0]?.design?.type)
              || design?.type
              || 'uploaded';

            const variantParts = [];
            if (config.shirtModel) variantParts.push(`Model: ${config.shirtModel}`);
            if (size) variantParts.push(`Size: ${size}`);
            if (config.material) variantParts.push(`Bahan: ${config.material}`);

            items.push({
              service_id: selectedService.id,
              product_id: config.shirtModelProductId || null,
              product_name: itemProductName,
              shirt_model: config.shirtModel || null,
              variant_label: variantParts.join(', ') || null,
              size: size,
              quantity: qty,
              unit_price: areaPrice,
              selected_color: config.color || config.material || null,
              sablon_type: config.sablonType || null,
              print_area: area.position || null,
              print_size: area.printSize || null,
              design_type: targetDesignType,
              design_id: targetDesignId,
              design_notes: null,
            });
          });
        });
      } else {
        // Fallback for services without size breakdown (e.g. Bordir or flat services)
        const totalQty = useOrderStore.getState().getTotalQuantity() || useOrderStore.getState().quantity || 1;
        const unitPrice = useOrderStore.getState().getUnitPrice() || parseFloat(selectedService.base_price) || 0;
        const targetDesignId = printAreas[0]?.design?.id || design?.id || null;
        const targetDesignType = (printAreas[0]?.design?.type === 'chat_upload' ? 'uploaded' : printAreas[0]?.design?.type) || design?.type || 'uploaded';

        const variantParts = [];
        if (config.shirtModel) variantParts.push(`Model: ${config.shirtModel}`);
        if (config.size) variantParts.push(`Size: ${config.size}`);
        if (config.material) variantParts.push(`Bahan: ${config.material}`);

        items.push({
          service_id: selectedService.id,
          product_id: config.shirtModelProductId || null,
          product_name: itemProductName,
          shirt_model: config.shirtModel || null,
          variant_label: variantParts.join(', ') || null,
          size: config.size || null,
          quantity: totalQty,
          unit_price: unitPrice,
          selected_color: config.color || config.material || null,
          sablon_type: config.sablonType || null,
          print_area: printAreas[0]?.position || config.position || null,
          print_size: printAreas[0]?.printSize || null,
          design_type: targetDesignType,
          design_id: targetDesignId,
          design_notes: null,
        });
      }

      // Validasi penjaga: pastikan pesanan sablon kaos memiliki design_id yang valid
      const isKaos = selectedService?.name?.toLowerCase().includes('kaos') || Boolean(config.sablonType);
      if (isKaos && items.some((it) => !it.design_id)) {
        const missingAreaIdx = printAreas.findIndex((a) => !a.design?.id);
        const areaNum = missingAreaIdx >= 0 ? missingAreaIdx + 1 : 1;
        toast.error(
          language === 'en'
            ? `Print design is incomplete for Area ${areaNum}. Please return to Step 4 to select/upload a design.`
            : `Desain sablon belum lengkap untuk Area ${areaNum}. Silakan kembali ke Langkah 4 untuk memilih/mengupload desain.`
        );
        setSubmitting(false);
        return;
      }

      const result = await orderService.create({
        customer_name: form.name.trim(),
        customer_email: form.email.trim() || null,
        phone: form.phone.trim(),
        address: form.address.trim() || (form.deliveryMethod === 'pickup' ? (language === 'en' ? 'Store Pickup' : 'Ambil di toko') : ''),
        delivery_method: form.deliveryMethod,
        description: form.description.trim() || null,
        notes: configSummary || null,
        items,
      });

      // Update user profile in background if phone/address was newly filled
      if (user && (form.phone !== user.phone || form.name !== user.name || (form.address && form.address !== user.address))) {
        authService.updateProfile({
          name: form.name.trim() || user.name,
          phone: form.phone.trim() || user.phone,
          address: form.address.trim() || user.address || '',
        }).catch(() => {});
      }

      const orderCode = result.order?.order_code || result.order_code;
      toast.success(language === 'en' ? 'Order placed successfully!' : 'Pesanan berhasil dibuat!');
      resetAll();
      navigate(`/pesan/pembayaran/${orderCode}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const msgs = Object.entries(errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('\n');
        toast.error(msgs || (language === 'en' ? 'Validation failed' : 'Validasi gagal'));
      } else {
        toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to create order. Please try again.' : 'Gagal membuat pesanan. Silakan coba lagi.'));
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
    `input-premium ${errors[field] ? 'border-pink-500 focus:border-pink-500' : ''}`;

  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  const cleanSpecs = getCleanConfigItems(config, language, td);
  const totalQty = orderStore.getTotalQuantity ? orderStore.getTotalQuantity() : Object.values(sizeQuantities || {}).reduce((a, b) => a + b, 0);

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-slate-900/5 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Step Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b ${
        isLight ? 'border-slate-100' : 'border-white/10'
      }`}>
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 6 of 6' : 'Langkah 6 dari 6'}
          </span>
          <h2 className={`font-heading text-2xl sm:text-3xl tracking-[1.5px] mt-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'en' ? 'CUSTOMER DETAILS & CHECKOUT' : 'DATA PEMESAN & CHECKOUT'}
          </h2>
        </div>
        <div className="text-right">
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{language === 'en' ? '50% Down Payment:' : 'Total DP 50%:'}</span>
          <p className="text-sm font-bold text-primary font-mono">{formatRupiah(dp)}</p>
        </div>
      </div>

      {/* Shopping Receipt Summary Card */}
      <div className={`rounded-2xl border mb-6 overflow-hidden transition-all ${
        isLight
          ? 'border-slate-200 bg-[#fffdfa] shadow-lg text-slate-800'
          : 'border-white/10 bg-[#16101e] shadow-xl text-zinc-100'
      }`}>
        {/* Receipt Header Banner */}
        <div className="p-4 sm:p-5 border-b border-dashed border-current/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary">
                {language === 'en' ? 'Shopping Receipt Summary' : 'Struk Ringkasan Belanja'}
              </p>
              <h4 className="font-heading text-lg sm:text-xl tracking-wide uppercase leading-tight">
                {td(selectedService?.name)} {config.shirtModel ? `• ${config.shirtModel}` : ''}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye size={13} />
            <span>{language === 'en' ? 'View Full Receipt' : 'Lihat Struk Lengkap'}</span>
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Specifications Chips */}
          {cleanSpecs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-current/10">
              {cleanSpecs.map((spec, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-current/5 border border-current/10 opacity-80"
                >
                  <strong className="opacity-60">{spec.label}:</strong> {spec.value}
                </span>
              ))}
            </div>
          )}

          {/* Print Areas */}
          {printAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold opacity-60 uppercase">{language === 'en' ? 'Print Area:' : 'Area Sablon:'}</span>
              {printAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold"
                >
                  <span>Area {idx + 1}: {td(area.position)} ({area.printSize})</span>
                </span>
              ))}
            </div>
          )}

          {/* Per-size Breakdown Rows */}
          <div className="border-t border-dashed border-current/20 pt-2 font-mono text-xs">
            <div className="grid grid-cols-12 opacity-60 text-[10px] font-bold uppercase pb-1 border-b border-current/10">
              <span className="col-span-3">{language === 'en' ? 'Size' : 'Ukuran'}</span>
              <span className="col-span-3 text-center">Qty</span>
              <span className="col-span-3 text-right">{language === 'en' ? 'Price' : 'Harga'}</span>
              <span className="col-span-3 text-right">Subtotal</span>
            </div>
            <div className="divide-y divide-current/5 py-1">
              {breakdown.map(({ size, qty, unitPrice, subtotal: sizeSubtotal }) => (
                <div key={size} className="grid grid-cols-12 py-1 items-center">
                  <span className="col-span-3 font-bold">{size}</span>
                  <span className="col-span-3 text-center opacity-80">{qty} pcs</span>
                  <span className="col-span-3 text-right opacity-80 text-[11px]">{formatRupiah(unitPrice)}</span>
                  <span className="col-span-3 text-right font-semibold">{formatRupiah(sizeSubtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & DP */}
          <div className="pt-2 border-t-2 border-dashed border-current/20 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between opacity-80">
              <span>{language === 'en' ? `Subtotal (${totalQty} pcs):` : `Subtotal Produk (${totalQty} pcs):`}</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {areaSurcharge > 0 && (
              <div className="flex justify-between text-primary font-semibold">
                <span>{language === 'en' ? 'Area 2 Surcharge:' : 'Surcharge Area Sablon 2:'}</span>
                <span>+{formatRupiah(areaSurcharge * totalQty)}</span>
              </div>
            )}
            <div className="flex justify-between opacity-80">
              <span>{language === 'en' ? 'Shipping:' : 'Pengiriman:'}</span>
              <span className="font-semibold">
                {form.deliveryMethod === 'pickup'
                  ? (language === 'en' ? 'Store Pickup (Rp 0)' : 'Ambil di Toko (Rp 0)')
                  : (shipping > 0 ? formatRupiah(shipping) : (language === 'en' ? 'Calculated on invoice' : 'Kurir ke alamat'))}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t-2 border-current/25 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                  {language === 'en' ? 'Total Bill' : 'Total Tagihan'}
                </span>
                <span className="font-heading text-2xl tracking-wide text-primary">
                  {formatRupiah(total)}
                </span>
              </div>
              <div className="text-right p-2.5 rounded-xl bg-primary/10 border border-primary/25">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  {language === 'en' ? '50% Down Payment (DP):' : 'DP Minimum (50%):'}
                </span>
                <span className="font-mono font-bold text-sm text-primary">
                  {formatRupiah(dp)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Profile Info & Contact */}
      <div className="space-y-5 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase">
            {language === 'en' ? 'Customer Contact Details' : 'Data Kontak Pemesan'}
          </label>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline bg-primary/10 border border-primary/20 px-3 py-1 rounded-full transition-colors hover:bg-primary/20"
          >
            <Icon name="pencil" size={12} /> {language === 'en' ? 'Account Settings' : 'Pengaturan Akun'}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div>
            <label className="text-gray-300 text-xs font-semibold mb-1.5 block">
              {language === 'en' ? 'Full Name' : 'Nama Lengkap'} <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={language === 'en' ? 'Enter your full name' : 'Masukkan nama lengkap Anda'}
              className={inputClass('name')}
            />
            {errors.name && (
              <p className="text-pink-400 text-xs mt-1 font-medium flex items-center gap-1.5">
                <Icon name="alert-triangle" size={13} className="shrink-0 text-pink-400 inline-flex" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-xs font-semibold mb-1.5 block">
                {language === 'en' ? 'WhatsApp Number' : 'Nomor WhatsApp'} <span className="text-pink-400">*</span>
              </label>
              <PhoneCountryInput
                value={form.phone}
                onChange={(val) => handleChange('phone', val)}
                placeholder="81234567890"
                id="checkout-phone"
                required
                className={errors.phone ? 'ring-1 ring-pink-500 rounded-2xl' : ''}
              />
              {errors.phone && (
                <p className="text-pink-400 text-xs mt-1 font-medium flex items-center gap-1.5">
                  <Icon name="alert-triangle" size={13} className="shrink-0 text-pink-400 inline-flex" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
            <div>
              <label className="text-gray-300 text-xs font-semibold mb-1.5 block">
                {language === 'en' ? 'Email (Optional)' : 'Email (Opsional)'}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@domain.com"
                className={inputClass('email')}
              />
            </div>
          </div>
        </div>

        {/* Metode Pengiriman */}
        <div>
          <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-3 block">
            {language === 'en' ? 'Delivery Method' : 'Metode Pengiriman'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleChange('deliveryMethod', 'pickup')}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                form.deliveryMethod === 'pickup'
                  ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20 ring-1 ring-primary/40'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  form.deliveryMethod === 'pickup' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white/5 text-gray-400'
                }`}>
                  <Icon name="map-pin" size={22} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{language === 'en' ? 'Self Pickup' : 'Ambil Sendiri (Pickup)'}</p>
                  <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                    {language === 'en' ? 'Pick up directly at Sablon AI workshop' : 'Ambil langsung di workshop Sablon AI'}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleChange('deliveryMethod', 'delivery');
                if (!form.address && user?.address) {
                  setForm(prev => ({ ...prev, deliveryMethod: 'delivery', address: user.address }));
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                form.deliveryMethod === 'delivery'
                  ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20 ring-1 ring-primary/40'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  form.deliveryMethod === 'delivery' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white/5 text-gray-400'
                }`}>
                  <Icon name="truck" size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-white text-sm">{language === 'en' ? 'Courier Delivery' : 'Dikirim Kurir'}</p>
                    <span className="text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full border border-primary/20">+ Rp 15.000</span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                    {language === 'en' ? 'Delivered via J&T, SiCepat, or Grab/Gojek' : 'Dikirim via J&T, SiCepat, atau Grab/Gojek'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {form.deliveryMethod === 'delivery' && (
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Shipping Address' : 'Alamat Pengiriman'} <span className="text-pink-400">*</span>
            </label>
            <textarea
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={language === 'en' ? 'Street, House No., Sub-district, District, City & Postal Code' : 'Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota & Kode Pos'}
              rows={3}
              className={`input-premium min-h-[90px] resize-none ${errors.address ? 'border-pink-500' : ''}`}
            />
            {errors.address && (
              <p className="text-pink-400 text-xs mt-1 font-medium flex items-center gap-1.5">
                <Icon name="alert-triangle" size={13} className="shrink-0 text-pink-400 inline-flex" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Deskripsi Pesanan */}
      <div className="mb-8">
        <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
          {language === 'en' ? 'Additional Notes (Optional)' : 'Catatan Tambahan (Opsional)'}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={language === 'en' ? 'Example: Custom neck label, neat chain stitching, please pack individually in clear plastic.' : 'Contoh: Label kerah custom, jahitan rantai rapi, tolong dipacking satuan dengan plastik bening.'}
          rows={3}
          className="input-premium min-h-[80px] resize-none"
        />
        <p className="text-gray-400 text-[11px] mt-1.5">
          {language === 'en' ? 'These notes will be forwarded directly to the production team.' : 'Catatan ini akan diteruskan langsung ke tim produksi.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={prevStep}
          disabled={submitting}
          className="btn-glass flex items-center gap-2 py-3 px-6 rounded-2xl text-xs uppercase tracking-wider font-semibold text-gray-300 hover:text-white disabled:opacity-50"
        >
          <Icon name="arrow-left" size={18} /> {language === 'en' ? 'Back' : 'Kembali'}
        </button>
        <button
          type="button"
          onClick={() => { if (validate()) setShowConfirm(true); }}
          disabled={submitting}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          <Icon name="send" size={18} /> {language === 'en' ? 'Submit & Proceed to Payment' : 'Submit & Lanjut Pembayaran'}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#170e1c] border border-white/15 w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-lg shadow-primary/20">
                <Icon name="send" size={28} />
              </div>
              <h3 className="font-heading text-2xl text-white tracking-wide mb-2">
                {language === 'en' ? 'Confirm Order?' : 'Konfirmasi Pesanan?'}
              </h3>
              <p className="text-gray-300 text-xs">
                {language === 'en' ? 'Minimum DP:' : 'DP Minimum:'} <strong className="text-primary">{formatRupiah(dp)}</strong> | {language === 'en' ? 'Total:' : 'Total:'} {formatRupiah(total)}
              </p>

              {/* Confirm summary details */}
              <div className="mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/10 text-left space-y-1.5">
                <p className="text-white text-xs font-bold">{form.name}</p>
                <p className="text-gray-400 text-[11px]">{form.phone}{form.email ? ` · ${form.email}` : ''}</p>
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/5">
                  {breakdown.map(({ size, qty }) => (
                    <span key={size} className="text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
                      {size}: {qty} pcs
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="btn-glass flex-1 py-3 rounded-2xl text-xs font-semibold text-gray-300 hover:text-white"
              >
                {language === 'en' ? 'Review Again' : 'Periksa Lagi'}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {language === 'en' ? 'Submitting...' : 'Mengirim...'}</>
                ) : (
                  <><Icon name="send" size={16} /> {language === 'en' ? 'Yes, Place Order' : 'Ya, Buat Pesanan'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <CustomerProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Full Shopping Receipt Modal */}
      {showReceiptModal && (
        <OrderReceipt
          mode="modal"
          isEstimate={true}
          orderDraft={orderStore}
          language={language}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}
