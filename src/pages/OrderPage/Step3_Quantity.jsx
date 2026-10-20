import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
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

export const ADULT_SIZES = [
  { size: 'S', label: 'S', name: 'Small', desc: 'LD: 94 cm · P: 68 cm', surcharge: 0 },
  { size: 'M', label: 'M', name: 'Medium', desc: 'LD: 98 cm · P: 70 cm', surcharge: 0 },
  { size: 'L', label: 'L', name: 'Large', desc: 'LD: 104 cm · P: 72 cm', surcharge: 0 },
  { size: 'XL', label: 'XL', name: 'Extra Large', desc: 'LD: 110 cm · P: 74 cm', surcharge: 5000 },
  { size: 'XXL', label: 'XXL', name: 'Double XL', desc: 'LD: 116 cm · P: 76 cm', surcharge: 10000 },
  { size: '3XL', label: '3XL', name: 'Triple XL', desc: 'LD: 122 cm · P: 78 cm', surcharge: 15000 },
];

export const KIDS_SIZES = [
  { size: 'Kids XS', label: 'Kids XS', name: '1 - 2 Tahun', desc: 'LD: 62 cm · P: 40 cm', surcharge: 0 },
  { size: 'Kids S', label: 'Kids S', name: '3 - 4 Tahun', desc: 'LD: 68 cm · P: 44 cm', surcharge: 0 },
  { size: 'Kids M', label: 'Kids M', name: '5 - 6 Tahun', desc: 'LD: 74 cm · P: 48 cm', surcharge: 0 },
  { size: 'Kids L', label: 'Kids L', name: '7 - 8 Tahun', desc: 'LD: 80 cm · P: 53 cm', surcharge: 0 },
  { size: 'Kids XL', label: 'Kids XL', name: '9 - 10 Tahun', desc: 'LD: 86 cm · P: 57 cm', surcharge: 0 },
];

export default function Step3Quantity() {
  const {
    selectedService,
    config,
    sizeQuantities,
    setSizeQuantity,
    getTotalQuantity,
    getBasePrice,
    getSizePrice,
    getPriceBreakdown,
    nextStep,
    prevStep,
  } = useOrderStore();

  const { t, td, language } = useLanguageStore();
  const toast = useToast();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  if (!selectedService) return null;

  const serviceName = (selectedService.name || '').toLowerCase();
  const isKaos = serviceName.includes('kaos') || Boolean(config.sablonType);

  // Tab State: 'adult' | 'kids' | 'all'
  const initialTab = config.sizeCategory === 'anak'
    ? 'kids'
    : config.sizeCategory === 'dewasa'
    ? 'adult'
    : 'adult';
  const [activeTab, setActiveTab] = useState(initialTab);

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
  const rawSizes = options.sizes?.length ? options.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
  const sizePricing = options.size_pricing || {};
  const totalQty = getTotalQuantity();
  const basePrice = getBasePrice();
  const breakdown = getPriceBreakdown();
  const lusinanError = useOrderStore.getState().getLusinanValidation();

  // Quantities per group
  const adultSizeKeys = ADULT_SIZES.map((s) => s.size);
  const kidsSizeKeys = KIDS_SIZES.map((s) => s.size);
  const adultQty = adultSizeKeys.reduce((sum, s) => sum + (sizeQuantities[s] || 0), 0);
  const kidsQty = kidsSizeKeys.reduce((sum, s) => sum + (sizeQuantities[s] || 0), 0);

  const handleLusinanPreset = (pcs) => {
    let targetSizes = [];
    if (isKaos) {
      if (activeTab === 'kids') {
        targetSizes = KIDS_SIZES.slice(1, 5).map((s) => s.size); // Kids S, M, L, XL
      } else {
        targetSizes = ADULT_SIZES.slice(0, 4).map((s) => s.size); // S, M, L, XL
      }
    } else {
      targetSizes = rawSizes;
    }

    const perSize = Math.floor(pcs / targetSizes.length);
    const remainder = pcs % targetSizes.length;

    targetSizes.forEach((size, i) => {
      const targetQty = perSize + (i < remainder ? 1 : 0);
      setSizeQuantity(size, targetQty);
    });
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

  const renderSizeRow = (item) => {
    const size = item.size;
    const qty = sizeQuantities[size] || 0;
    const surcharge = parseInt(sizePricing[size]) || item.surcharge || 0;
    const unitPrice = getSizePrice(size) || (basePrice + surcharge);
    const subtotal = unitPrice * qty;

    return (
      <div
        key={size}
        className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 sm:px-6 py-3.5 border-b border-white/5 last:border-b-0 transition-colors ${
          qty > 0
            ? isLight
              ? 'bg-primary/5'
              : 'bg-primary/[0.04]'
            : isLight
            ? 'hover:bg-slate-50'
            : 'hover:bg-white/[0.02]'
        }`}
      >
        {/* Size Badge */}
        <div className="w-24 sm:w-36 flex items-center gap-2">
          <span className={`inline-flex items-center justify-center font-bold text-xs sm:text-sm px-2.5 py-1 rounded-xl shrink-0 ${
            qty > 0
              ? 'bg-primary text-white shadow-sm'
              : isLight
              ? 'bg-slate-100 text-slate-800 border border-slate-200'
              : 'bg-white/5 text-gray-200 border border-white/10'
          }`}>
            {size}
          </span>
          {item.name && (
            <span className={`text-[11px] font-medium hidden sm:inline truncate ${
              isLight ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {item.name}
            </span>
          )}
        </div>

        {/* Price & Dimensions */}
        <div className="text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatRupiah(unitPrice)}
            </span>
            {surcharge > 0 && (
              <span className="text-primary text-[10px] sm:text-[11px] font-semibold">
                (+{formatRupiah(surcharge)})
              </span>
            )}
          </div>
          {item.desc && (
            <p className={`text-[10px] mt-0.5 truncate ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>
              {item.desc}
            </p>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1.5 w-28 sm:w-32 justify-center">
          <button
            type="button"
            onClick={() => setSizeQuantity(size, Math.max(0, qty - 1))}
            className={`w-8 h-8 flex items-center justify-center border rounded-xl transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-200 hover:border-primary hover:bg-primary/10 text-slate-700'
                : 'border-white/10 hover:border-primary hover:bg-primary/20 text-white'
            }`}
            aria-label={language === 'en' ? `Decrease ${size}` : `Kurang ${size}`}
          >
            <Icon name="minus" size={14} />
          </button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setSizeQuantity(size, Math.max(0, parseInt(e.target.value) || 0))}
            className={`w-12 sm:w-14 text-center text-xs sm:text-sm font-bold rounded-xl py-1 focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isLight
                ? 'bg-white border border-slate-200 text-slate-800'
                : 'bg-white/5 border border-white/10 text-white'
            }`}
            min={0}
          />
          <button
            type="button"
            onClick={() => setSizeQuantity(size, qty + 1)}
            className={`w-8 h-8 flex items-center justify-center border rounded-xl transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-200 hover:border-primary hover:bg-primary/10 text-slate-700'
                : 'border-white/10 hover:border-primary hover:bg-primary/20 text-white'
            }`}
            aria-label={language === 'en' ? `Increase ${size}` : `Tambah ${size}`}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>

        {/* Subtotal */}
        <span className={`text-xs sm:text-sm font-semibold w-24 sm:w-28 text-right ${
          qty > 0 ? 'text-primary' : 'text-gray-500'
        }`}>
          {qty > 0 ? formatRupiah(subtotal) : '-'}
        </span>
      </div>
    );
  };

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-slate-900/5 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b ${
        isLight ? 'border-slate-100' : 'border-white/10'
      }`}>
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 3 of 6' : 'Langkah 3 dari 6'}
          </span>
          <h2 className={`font-heading text-2xl sm:text-3xl tracking-[1.5px] mt-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'en' ? 'SIZE & QUANTITY' : 'UKURAN & JUMLAH'}
          </h2>
        </div>
        <div className="text-right">
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            {language === 'en' ? 'Service:' : 'Layanan:'}
          </span>
          <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            {td(selectedService.name)}
          </p>
        </div>
      </div>

      {/* Config Summary Pills */}
      <div className={`rounded-2xl border p-4 mb-6 ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
      }`}>
        <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-2.5 font-bold">
          {language === 'en' ? 'Configuration Summary' : 'Ringkasan Konfigurasi'}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(config).map(([key, val]) => {
            if (!val || key === 'size') return null;
            let displayVal = String(val);
            if (key === 'sizeCategory') {
              displayVal = val === 'anak' ? 'Anak-anak' : val === 'dewasa' ? 'Dewasa' : 'Dewasa & Anak';
            }
            return (
              <span
                key={key}
                className={`px-3 py-1 border text-xs font-medium rounded-xl ${
                  isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-gray-200'
                }`}
              >
                <span className="text-gray-400 mr-1 capitalize">{td(key)}:</span> {td(displayVal)}
              </span>
            );
          })}
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
                className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  totalQty === pcs
                    ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20 ring-1 ring-primary/40'
                    : isLight
                    ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    : 'border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <p className={`font-bold text-sm ${totalQty === pcs ? 'text-primary' : isLight ? 'text-slate-900' : 'text-white'}`}>
                  {language === 'en' ? `${lusin} Dozen` : `${lusin} Lusin`}
                </p>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{pcs} pcs</p>
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

      {/* Category Tabs Switcher (Dewasa & Anak-anak) for Kaos */}
      {isKaos && (
        <div className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {/* Tabs */}
            <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('adult')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'adult'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon name="user" size={14} className="shrink-0" />
                <span>{language === 'en' ? 'Adult Sizes' : 'Ukuran Dewasa'}</span>
                {adultQty > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'adult' ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                  }`}>
                    {adultQty}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('kids')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'kids'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon name="smile" size={14} className="shrink-0" />
                <span>{language === 'en' ? 'Kids Sizes' : 'Ukuran Anak-anak'}</span>
                {kidsQty > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'kids' ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                  }`}>
                    {kidsQty}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon name="users" size={14} className="shrink-0" />
                <span>{language === 'en' ? 'All' : 'Semua'}</span>
                {totalQty > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                  }`}>
                    {totalQty}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Live Counters */}
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-colors ${
                adultQty > 0
                  ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                  : isLight
                  ? 'border-slate-200 bg-white text-slate-500'
                  : 'border-white/5 bg-white/[0.02] text-gray-400'
              }`}>
                <Icon name="user" size={13} className="shrink-0 text-primary" /> Dewasa: <strong>{adultQty}</strong> pcs
              </span>
              <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-colors ${
                kidsQty > 0
                  ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                  : isLight
                  ? 'border-slate-200 bg-white text-slate-500'
                  : 'border-white/5 bg-white/[0.02] text-gray-400'
              }`}>
                <Icon name="smile" size={13} className="shrink-0 text-primary" /> Anak: <strong>{kidsQty}</strong> pcs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Link & Section Title */}
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
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.01]'
      }`}>
        {/* Table Header */}
        <div className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 sm:px-6 py-3.5 border-b ${
          isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/[0.04] text-gray-300'
        }`}>
          <span className="text-xs font-bold tracking-wider uppercase w-24 sm:w-36">
            {language === 'en' ? 'Size' : 'Ukuran'}
          </span>
          <span className="text-xs font-bold tracking-wider uppercase">
            {language === 'en' ? 'Price / Pcs' : 'Harga / Pcs'}
          </span>
          <span className="text-xs font-bold tracking-wider uppercase w-28 sm:w-32 text-center">
            {language === 'en' ? 'Quantity' : 'Jumlah'}
          </span>
          <span className="text-xs font-bold tracking-wider uppercase w-24 sm:w-28 text-right">
            {language === 'en' ? 'Subtotal' : 'Subtotal'}
          </span>
        </div>

        {/* Kaos: Adult Tab */}
        {isKaos && activeTab === 'adult' && (
          <div>{ADULT_SIZES.map(renderSizeRow)}</div>
        )}

        {/* Kaos: Kids Tab */}
        {isKaos && activeTab === 'kids' && (
          <div>{KIDS_SIZES.map(renderSizeRow)}</div>
        )}

        {/* Kaos: All Sizes Tab */}
        {isKaos && activeTab === 'all' && (
          <div>
            <div className={`px-4 sm:px-6 py-2 border-b text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'bg-slate-100/70 text-slate-800 border-slate-200' : 'bg-white/[0.03] text-primary border-white/10'
            }`}>
              <Icon name="user" size={13} className="shrink-0 text-primary" />
              <span>{language === 'en' ? 'Adult Sizes' : 'Ukuran Dewasa'}</span>
            </div>
            {ADULT_SIZES.map(renderSizeRow)}

            <div className={`px-4 sm:px-6 py-2 border-b border-t text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'bg-slate-100/70 text-slate-800 border-slate-200' : 'bg-white/[0.03] text-primary border-white/10'
            }`}>
              <Icon name="smile" size={13} className="shrink-0 text-primary" />
              <span>{language === 'en' ? 'Kids Sizes' : 'Ukuran Anak-anak'}</span>
            </div>
            {KIDS_SIZES.map(renderSizeRow)}
          </div>
        )}

        {/* Non-Kaos Services (Banner, Stiker, etc.) */}
        {!isKaos && (
          <div>
            {rawSizes.map((sz) =>
              renderSizeRow({
                size: sz,
                label: sz,
                name: null,
                desc: null,
                surcharge: parseInt(sizePricing[sz]) || 0,
              })
            )}
          </div>
        )}
      </div>

      {/* Total Card */}
      <div className={`rounded-2xl border p-5 mb-6 backdrop-blur-md ${
        isLight ? 'border-primary/40 bg-primary/5' : 'border-primary/30 bg-primary/10'
      }`}>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {language === 'en' ? 'Total Order:' : 'Total Pesanan:'}
              </span>
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                isLight ? 'bg-primary/20 text-primary' : 'bg-white/15 text-white'
              }`}>
                {totalQty} pcs
              </span>
            </div>
            {isKaos && (adultQty > 0 || kidsQty > 0) && (
              <p className={`text-xs mt-1 font-medium flex items-center gap-2 flex-wrap ${isLight ? 'text-slate-500' : 'text-gray-300'}`}>
                <span className="flex items-center gap-1">
                  <Icon name="user" size={12} className="shrink-0 text-primary" /> Dewasa: <strong>{adultQty}</strong> pcs
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Icon name="smile" size={12} className="shrink-0 text-primary" /> Anak: <strong>{kidsQty}</strong> pcs
                </span>
              </p>
            )}
          </div>
          <span className={`font-heading text-2xl tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatRupiah(breakdown.reduce((sum, i) => sum + i.subtotal, 0))}
          </span>
        </div>

        {totalQty > 0 && totalQty < minOrder && (
          <p className="text-pink-400 text-xs mt-2.5 flex items-center gap-1.5 font-semibold">
            <Icon name="alert-triangle" size={14} className="shrink-0 text-pink-400" />
            <span>
              {isLusinan
                ? (language === 'en' ? 'Minimum wholesale order is 12 pcs' : 'Minimal pemesanan lusinan adalah 12 pcs')
                : (language === 'en' ? `Minimum order is ${minOrder} pcs (${minOrder - totalQty} pcs remaining)` : `Minimum order ${minOrder} pcs (kurang ${minOrder - totalQty} pcs lagi)`)}
            </span>
          </p>
        )}
        {isLusinan && totalQty > 0 && !lusinanError && totalQty >= 12 && (
          <p className="text-green-400 text-xs mt-2.5 flex items-center gap-1.5 font-semibold">
            <Icon name="check-circle" size={14} className="shrink-0 text-green-400" />
            <span>
              {language === 'en'
                ? `Fulfilled: ${totalQty / 12} dozen (${totalQty} pcs)`
                : `Terpenuhi: ${totalQty / 12} lusin (${totalQty} pcs)`}
            </span>
          </p>
        )}
      </div>

      {/* Pricing Information Tier Card */}
      {selectedService.pricing_type === 'tiered' && selectedService.pricing_config && (
        <div className={`rounded-2xl border p-5 sm:p-6 mb-6 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
        }`}>
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
                className={`border rounded-xl p-3.5 ${
                  isLight ? 'bg-white border-slate-200' : 'border-white/10 bg-black/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/5">
                  <h4 className={`font-bold capitalize text-xs tracking-wide ${isLight ? 'text-slate-800' : 'text-white'}`}>
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

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2">
            <Icon name="info" size={14} className="shrink-0 text-primary mt-0.5" />
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="text-white font-semibold">{language === 'en' ? 'Note:' : 'Catatan:'}</span>{' '}
              {language === 'en'
                ? 'System automatically applies tier discounts based on total quantity entered.'
                : 'Sistem secara otomatis menerapkan diskon tier sesuai akumulasi jumlah pcs yang Anda masukkan.'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className={`flex gap-4 mt-8 pt-6 border-t ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <button
          type="button"
          onClick={prevStep}
          className="btn-glass flex items-center gap-2 py-3 px-6 rounded-2xl text-xs uppercase tracking-wider font-semibold text-gray-300 hover:text-white cursor-pointer"
        >
          <Icon name="arrow-left" size={18} /> {language === 'en' ? 'Back' : 'Kembali'}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 cursor-pointer"
        >
          {language === 'en' ? 'Continue to Upload Design' : 'Lanjut ke Upload Desain'} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
