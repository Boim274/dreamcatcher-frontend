import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { formatRupiah } from '../../utils/formatRupiah';
import { Link } from 'react-router-dom';

const LUSIN_PRESETS = [
  { lusin: 1, pcs: 12 },
  { lusin: 2, pcs: 24 },
  { lusin: 3, pcs: 36 },
  { lusin: 4, pcs: 48 },
  { lusin: 5, pcs: 60 },
  { lusin: 6, pcs: 72 },
];

export default function Step3Quantity() {
  const { selectedService, config, sizeQuantities, setSizeQuantity, getTotalQuantity, getBasePrice, getSizePrice, getPriceBreakdown, nextStep, prevStep } = useOrderStore();
  const { t, td, language } = useLanguageStore();
  const toast = useToast();

  if (!selectedService) return null;

  const isLusinan = config.purchaseMethod === 'Lusinan';
  const minOrder = isLusinan ? 12 : (selectedService.minimum_order || 1);
  const parseConfig = (cfg) => {
    if (!cfg) return {};
    if (typeof cfg === 'string') {
      try {
        const p = JSON.parse(cfg);
        return typeof p === 'string' ? JSON.parse(p) : p;
      } catch (e) {
        return {};
      }
    }
    return cfg;
  };

  const options = parseConfig(selectedService.options_config);
  const sizes = options.sizes?.length ? options.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
  const sizePricing = options.size_pricing || {};
  const totalQty = getTotalQuantity();
  const basePrice = getBasePrice();
  const breakdown = getPriceBreakdown();
  const lusinanError = useOrderStore.getState().getLusinanValidation();

  const handleLusinanPreset = (pcs) => {
    const perSize = Math.floor(pcs / sizes.length);
    const remainder = pcs % sizes.length;
    const newSQ = {};
    sizes.forEach((size, i) => {
      newSQ[size] = perSize + (i < remainder ? 1 : 0);
    });
    sizes.forEach((size) => setSizeQuantity(size, newSQ[size] || 0));
  };

  const handleNext = () => {
    if (totalQty < minOrder) {
      toast.warning(isLusinan
        ? (language === 'en' ? 'Minimum wholesale order is 12 pcs' : 'Minimal pemesanan lusinan adalah 12 pcs')
        : (language === 'en' ? `Minimum order is ${minOrder} pcs (current total: ${totalQty} pcs)` : `Minimum order ${minOrder} pcs (total saat ini: ${totalQty} pcs)`)
      );
      return;
    }
    if (isLusinan && lusinanError) {
      toast.warning(language === 'en' && lusinanError.includes('kelipatan 12') ? 'Total order must be a multiple of 12 pcs (1 dozen = 12 pcs)' : lusinanError);
      return;
    }
    nextStep();
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 3 of 6' : 'Langkah 3 dari 6'}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-[0.5px] mt-2">
            {language === 'en' ? 'SIZE & QUANTITY' : 'UKURAN & JUMLAH'}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">{language === 'en' ? 'Service:' : 'Layanan:'}</span>
          <p className="text-sm font-semibold text-white">{td(selectedService.name)}</p>
        </div>
      </div>

      {/* Config Summary Pills */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-6">
        <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-2.5 font-bold">
          {language === 'en' ? 'Configuration Summary' : 'Ringkasan Konfigurasi'}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(useOrderStore.getState().config).map(([key, val]) => (
            val && (
              <span key={key} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-200 text-xs font-medium rounded-xl">
                <span className="text-gray-400 mr-1 capitalize">{td(key)}:</span> {td(String(val))}
              </span>
            )
          ))}
        </div>
      </div>

      {/* Lusinan Preset Selector */}
      {isLusinan && (
        <div className="mb-6">
          <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-3 block">
            {language === 'en' ? 'Dozen Quantity Preset' : 'Preset Jumlah Lusin'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            {LUSIN_PRESETS.map(({ lusin, pcs }) => (
              <button
                key={lusin}
                type="button"
                onClick={() => handleLusinanPreset(pcs)}
                className={`p-3 rounded-2xl border text-center transition-all duration-200 ${
                  totalQty === pcs
                    ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20 ring-1 ring-primary/40'
                    : 'border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <p className={`font-bold text-sm ${totalQty === pcs ? 'text-primary' : 'text-white'}`}>
                  {language === 'en' ? `${lusin} Dozen` : `${lusin} Lusin`}
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5">{pcs} pcs</p>
              </button>
            ))}
          </div>
          {lusinanError && totalQty > 0 && (
            <p className="text-pink-400 text-xs mt-2.5 flex items-center gap-1.5 font-medium">
              <Icon name="alert-triangle" size={14} />
              {language === 'en' && lusinanError.includes('kelipatan 12') ? 'Total order must be a multiple of 12 pcs (1 dozen = 12 pcs)' : lusinanError}
            </p>
          )}
        </div>
      )}

      {/* Size Guide Link */}
      <div className="flex items-center justify-between mb-4">
        <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase">
          {isLusinan
            ? (language === 'en' ? 'Distribution per Size' : 'Distribusi per Ukuran')
            : (language === 'en' ? 'Select Size & Quantity' : 'Pilih Ukuran & Jumlah')}
        </label>
        <Link
          to="/size-chart"
          target="_blank"
          className="text-primary text-xs font-semibold hover:underline flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full transition-colors hover:bg-primary/20"
        >
          <Icon name="info" size={13} /> {language === 'en' ? 'Size Guide' : 'Panduan Ukuran'}
        </Link>
      </div>

      {/* Size Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden mb-6 bg-white/[0.01]">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 sm:px-6 py-3.5 border-b border-white/10 bg-white/[0.04]">
          <span className="text-gray-300 text-xs font-bold tracking-wider uppercase w-16">
            {language === 'en' ? 'Size' : 'Ukuran'}
          </span>
          <span className="text-gray-300 text-xs font-bold tracking-wider uppercase">
            {language === 'en' ? 'Price / Pcs' : 'Harga / Pcs'}
          </span>
          <span className="text-gray-300 text-xs font-bold tracking-wider uppercase w-32 text-center">
            {language === 'en' ? 'Quantity' : 'Jumlah'}
          </span>
          <span className="text-gray-300 text-xs font-bold tracking-wider uppercase w-28 text-right">
            {language === 'en' ? 'Subtotal' : 'Subtotal'}
          </span>
        </div>

        {/* Size Rows */}
        {sizes.map((size) => {
          const qty = sizeQuantities[size] || 0;
          const surcharge = parseInt(sizePricing[size]) || 0;
          const unitPrice = getSizePrice(size);
          const subtotal = unitPrice * qty;

          return (
            <div
              key={size}
              className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 sm:px-6 py-3.5 border-b border-white/5 last:border-b-0 transition-colors ${
                qty > 0 ? 'bg-primary/[0.04]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="w-16">
                <span className={`inline-flex items-center justify-center font-bold text-sm px-2.5 py-1 rounded-xl ${
                  qty > 0 ? 'bg-primary text-white shadow-sm' : 'bg-white/5 text-gray-200 border border-white/10'
                }`}>
                  {size}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-white font-medium">{formatRupiah(unitPrice)}</span>
                {surcharge > 0 && (
                  <span className="text-primary text-[11px] ml-1 font-medium">(+{formatRupiah(surcharge)})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 w-32 justify-center">
                <button
                  type="button"
                  onClick={() => setSizeQuantity(size, qty - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-xl hover:border-primary hover:bg-primary/20 transition-colors text-white"
                  aria-label={language === 'en' ? `Decrease ${size}` : `Kurang ${size}`}
                >
                  <Icon name="minus" size={14} />
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setSizeQuantity(size, parseInt(e.target.value) || 0)}
                  className="w-14 text-center text-sm font-bold text-white bg-white/5 border border-white/10 rounded-xl py-1 focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
                <button
                  type="button"
                  onClick={() => setSizeQuantity(size, qty + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-xl hover:border-primary hover:bg-primary/20 transition-colors text-white"
                  aria-label={language === 'en' ? `Increase ${size}` : `Tambah ${size}`}
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <span className={`text-sm font-semibold w-28 text-right ${qty > 0 ? 'text-primary' : 'text-gray-500'}`}>
                {qty > 0 ? formatRupiah(subtotal) : '-'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total Card */}
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 mb-6 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-white font-bold text-base">{language === 'en' ? 'Total Order:' : 'Total Pesanan:'}</span>
            <span className="text-gray-300 text-sm ml-2.5 font-medium bg-white/10 px-2.5 py-0.5 rounded-full">
              {totalQty} pcs
            </span>
          </div>
          <span className="text-white font-heading text-2xl tracking-wide">
            {formatRupiah(breakdown.reduce((sum, i) => sum + i.subtotal, 0))}
          </span>
        </div>
        {totalQty > 0 && totalQty < minOrder && (
          <p className="text-pink-400 text-xs mt-2.5 flex items-center gap-1 font-semibold">
            ⚠️ {isLusinan
              ? (language === 'en' ? 'Minimum wholesale order is 12 pcs' : 'Minimal pemesanan lusinan adalah 12 pcs')
              : (language === 'en' ? `Minimum order is ${minOrder} pcs (${minOrder - totalQty} pcs remaining)` : `Minimum order ${minOrder} pcs (kurang ${minOrder - totalQty} pcs lagi)`)}
          </p>
        )}
        {isLusinan && totalQty > 0 && !lusinanError && totalQty >= 12 && (
          <p className="text-green-400 text-xs mt-2.5 flex items-center gap-1 font-semibold">
            {language === 'en'
              ? `✓ Fulfilled: ${totalQty / 12} dozen (${totalQty} pcs)`
              : `✓ Terpenuhi: ${totalQty / 12} lusin (${totalQty} pcs)`}
          </p>
        )}
      </div>

      {/* Pricing Information Accordion / Card */}
      {selectedService.pricing_type === 'tiered' && selectedService.pricing_config && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-primary text-xs font-bold uppercase tracking-[1.5px]">
              {language === 'en' ? 'Tiered Pricing' : 'Tingkatan Harga (Tiered Pricing)'}
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              {language === 'en'
                ? <>Prices are calculated <strong className="text-white">per pcs</strong> automatically. The higher the quantity, the more affordable the unit price.</>
                : <>Harga dihitung <strong className="text-white">per pcs</strong> secara otomatis. Semakin banyak jumlah pesanan, semakin murah harga per pcs yang didapat.</>}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(selectedService.pricing_config).map(([type, prices]) => (
              <div
                key={type}
                className="border border-white/10 rounded-xl p-3.5 bg-black/30"
              >
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/5">
                  <h4 className="text-white font-bold capitalize text-xs tracking-wide">
                    {td(type)}
                  </h4>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">
                    {language === 'en' ? 'Price / Pcs' : 'Harga / Pcs'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {prices.satuan && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'en' ? 'Single (1–11):' : 'Satuan (1–11):'}</span>
                      <span className="text-primary font-semibold">
                        {formatRupiah(prices.satuan)}
                      </span>
                    </div>
                  )}

                  {prices.lusin_1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'en' ? '1 Dozen (12–23):' : '1 Lusin (12–23):'}</span>
                      <span className="text-primary font-semibold">
                        {formatRupiah(prices.lusin_1)}
                      </span>
                    </div>
                  )}

                  {prices.lusin_2_6 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'en' ? '2–6 Dozen (24–72):' : '2–6 Lusin (24–72):'}</span>
                      <span className="text-primary font-semibold">
                        {formatRupiah(prices.lusin_2_6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-gray-300 leading-relaxed">
              💡 <span className="text-white font-semibold">{language === 'en' ? 'Note:' : 'Catatan:'}</span>{' '}
              {language === 'en'
                ? 'System automatically applies tier discounts based on total quantity entered.'
                : 'Sistem secara otomatis menerapkan diskon tier sesuai akumulasi jumlah pcs yang Anda masukkan.'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={prevStep}
          className="btn-glass flex items-center gap-2 py-3 px-6 rounded-2xl text-xs uppercase tracking-wider font-semibold text-gray-300 hover:text-white"
        >
          <Icon name="arrow-left" size={18} /> {language === 'en' ? 'Back' : 'Kembali'}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25"
        >
          {language === 'en' ? 'Continue to Upload Design' : 'Lanjut ke Upload Desain'} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
