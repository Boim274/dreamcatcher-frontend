import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ScrollReveal from '../components/ui/ScrollReveal';
import ServiceIcon from '../components/ui/ServiceIcons';
import Icon from '../components/ui/Icon';
import { formatRupiah, getMinPrice, getSatuanPrice } from '../utils/formatRupiah';
import { WA_URL } from '../constants/whatsapp';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import { useOrderStore } from '../store/orderStore';

const colorMap = {
  Putih: '#FFFFFF', Hitam: '#000000', 'Abu Muda': '#D3D3D3', 'Abu Tua': '#555555',
  Merah: '#DC2626', 'Biru Dongker': '#1E3A5F', 'Biru Muda': '#3B82F6',
  Hijau: '#16A34A', Kuning: '#EAB308', Orange: '#F97316', Navy: '#172554',
  Maroon: '#7F1D1D', 'Biru Toska': '#0D9488', Lavender: '#A78BFA',
  Pink: '#EC4899', Cream: '#FEF3C7',
};

const getOptionLabels = (language = 'id') => ({
  colors: language === 'en' ? 'Color' : 'Warna',
  purchase_methods: language === 'en' ? 'Purchase Method' : 'Pembelian',
  materials: language === 'en' ? 'Material' : 'Bahan',
  positions: language === 'en' ? 'Position' : 'Posisi',
  print_positions: language === 'en' ? 'Print Position' : 'Posisi Cetak',
  print_sizes: language === 'en' ? 'Print Size' : 'Ukuran Cetak',
});

export default function PricelistPage() {
  const { language, td } = useLanguageStore();
  const optionLabels = getOptionLabels(language);
  const selectService = useOrderStore((s) => s.selectService);
  const setStep = useOrderStore((s) => s.setStep);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data.services || []);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services
    .filter(s => s.is_active)
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;
      if (activeTab === 'all') return true;
      if (activeTab === 'tiered') return s.pricing_type === 'tiered';
      if (activeTab === 'flat') return s.pricing_type === 'flat';
      return true;
    });

  const renderShirtModels = (service) => {
    const models = service.options_config?.shirt_models;
    if (!models || !Array.isArray(models) || models.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-primary text-xs tracking-wider uppercase mb-2 font-bold flex items-center gap-1.5">
          <Icon name="layers" size={13} className="text-primary" />
          <span>{language === 'en' ? 'Apparel Model Options' : 'Pilihan Model Pakaian'}</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map((m) => {
            const surcharge = Number(m.surcharge || 0);
            return (
              <div
                key={m.id}
                className="bg-black/30 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate">
                    {language === 'en' && m.name_en ? m.name_en : m.name}
                  </p>
                  <p className="text-[10px] text-white/50 truncate">
                    {m.id === 'long_sleeve' ? (language === 'en' ? 'Elastic ribbed cuff' : 'Rib manset elastis') : (language === 'en' ? 'Distro standard combed' : 'Katun combed distro')}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 border ${
                  surcharge > 0
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {surcharge > 0 ? `+${formatRupiah(surcharge)}` : (language === 'en' ? 'Standard' : 'Standar')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPrintAreaOptions = (service) => {
    const maxAreas = service.options_config?.max_print_areas;
    const areaSurcharge = service.options_config?.area_surcharge;
    const printSizes = service.options_config?.print_sizes;

    if (!maxAreas && !areaSurcharge && (!printSizes || printSizes.length === 0)) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-primary text-xs tracking-wider uppercase mb-2 font-bold flex items-center gap-1.5">
          <Icon name="maximize-2" size={13} className="text-primary" />
          <span>{language === 'en' ? 'Print Area & Dimensions' : 'Area & Dimensi Cetak'}</span>
        </p>
        <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-white/60">
              {language === 'en' ? 'Print Area Limits' : 'Kapasitas Area Sablon'}:
            </span>
            <span className="text-white font-semibold flex items-center gap-1.5">
              <span className="text-primary font-bold">Maks. {maxAreas || 2} Area</span>
              {areaSurcharge ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                  (Area ke-2: +{formatRupiah(areaSurcharge)})
                </span>
              ) : null}
            </span>
          </div>

          {printSizes && printSizes.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">
                {language === 'en' ? 'Available Print Sizes' : 'Pilihan Ukuran Cetak'}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {printSizes.map((pz, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-[11px] font-mono"
                  >
                    {typeof pz === 'object' ? pz.label : pz}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOptions = (service) => {
    const options = service.options_config || {};
    const excludedKeys = [
      'size_pricing',
      'sablon_types',
      'max_print_areas',
      'area_surcharge',
      'shirt_models',
      'print_sizes',
      'print_positions',
      'sizes',
      'purchase_methods',
    ];

    // Sablon Kaos does not use general 'positions' (it uses print_positions)
    const isSablon = (service.name || '').toLowerCase().includes('sablon');
    if (isSablon) {
      excludedKeys.push('positions');
    }

    const entries = Object.entries(options).filter(([k]) => !excludedKeys.includes(k));
    if (entries.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-primary text-xs tracking-wider uppercase mb-2.5 font-bold flex items-center gap-1.5">
          <Icon name="check-circle" size={13} className="text-primary" />
          <span>{language === 'en' ? 'Specs & Variations' : 'Spesifikasi & Pilihan Opsi'}</span>
        </p>
        <div className="space-y-3">
          {entries.map(([key, items]) => {
            const label = optionLabels[key] || key.replace(/_/g, ' ');
            return (
              <div key={key}>
                <p className="text-white/40 text-[10px] tracking-wider uppercase mb-1.5 font-semibold">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {key === 'colors' && Array.isArray(items) ? (
                    items.slice(0, 8).map((color) => (
                      <span key={color} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 border border-white/10 rounded-xl text-xs text-white/90">
                        <span className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm shrink-0" style={{ backgroundColor: colorMap[color] || '#888' }} />
                        <span>{td(color)}</span>
                      </span>
                    ))
                  ) : key === 'materials' && Array.isArray(items) ? (
                    items.map((mat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-medium rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{td(mat)}</span>
                      </span>
                    ))
                  ) : Array.isArray(items) ? (
                    items.map((item, idx) => {
                      const isObj = typeof item === 'object' && item !== null;
                      const v = isObj ? item.label : item;
                      return (
                        <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/80 text-xs font-medium rounded-xl">{td(v)}</span>
                      );
                    })
                  ) : typeof items === 'object' ? (
                    Object.entries(items).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-xl">
                        {td(k)} <span className="text-white/40 text-[10px]">+{formatRupiah(v)}</span>
                      </span>
                    ))
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPricingChips = (service) => {
    const sName = (service.name || '').toLowerCase();
    const rawUnit = sName.includes('banner') ? 'm²' : sName.includes('stiker') ? 'lbr' : 'pcs';
    const unit = language === 'en' ? (rawUnit === 'm²' ? 'sqm' : rawUnit === 'lbr' ? 'sheet' : 'pcs') : rawUnit;

    if (service.pricing_type === 'flat') {
      return (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-primary text-xs tracking-wider uppercase font-bold flex items-center gap-1.5">
              <Icon name="tag" size={13} className="text-primary" />
              <span>{language === 'en' ? 'Pricing Structure' : 'Struktur Harga Layanan'}</span>
            </p>
            <span className="text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {language === 'en' ? 'Fixed Flat Rate' : 'Harga Tetap Transparan'}
            </span>
          </div>

          <div className="bg-black/40 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">
                {language === 'en' ? `Tariff per ${unit}` : `Tarif per ${unit}`}
              </p>
              <p className="text-white/50 text-[11px] mt-0.5">
                {service.minimum_order > 1
                  ? (language === 'en' ? `Minimum order ${service.minimum_order} ${unit}` : `Minimal pemesanan ${service.minimum_order} ${unit}`)
                  : (language === 'en' ? 'No minimum order required' : 'Bisa pesan satuan / tanpa minimal order')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-gradient-primary font-bold text-xl block leading-tight">
                {formatRupiah(service.base_price || service.price_per_unit)}
              </span>
              <span className="text-white/40 text-[10px]">/ {unit}</span>
            </div>
          </div>
        </div>
      );
    }

    const config = service.pricing_config || {};
    const entries = Object.entries(config);
    if (entries.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-primary text-xs tracking-wider uppercase font-bold flex items-center gap-1.5">
            <Icon name="tag" size={13} className="text-primary" />
            <span>{language === 'en' ? 'Price per Print Technique' : 'Harga Paket per Jenis Sablon'}</span>
          </p>
          <span className="text-white/40 text-[10px] font-mono">
            {language === 'en' ? 'Kaos + Sablon included' : 'Sudah termasuk kaos & sablon'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map(([type, prices]) => {
            const isPlastisol = type.toLowerCase() === 'plastisol';
            const isDTF = type.toLowerCase() === 'dtf';

            return (
              <div
                key={type}
                className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-white font-bold text-xs uppercase tracking-wider font-heading">
                      {td(type)}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isPlastisol
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  }`}>
                    {isPlastisol ? 'Distro Standard' : 'Full Color HD'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {prices.lusin_2_6 && (
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-1">
                        <span className="text-white/90 font-medium text-[11px]">
                          {language === 'en' ? 'Wholesale (2-6 doz / 24+ pcs)' : 'Grosir (2–6 lsn / 24+ pcs)'}
                        </span>
                        <span className="text-[9px] bg-primary text-white font-bold px-1.5 rounded">
                          {language === 'en' ? 'Best' : 'Hemat'}
                        </span>
                      </div>
                      <span className="text-white font-bold font-mono">
                        {formatRupiah(prices.lusin_2_6)}
                      </span>
                    </div>
                  )}

                  {prices.lusin_1 && (
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-white/70 text-[11px]">
                        {language === 'en' ? '1 Dozen (12-23 pcs)' : '1 Lusin (12–23 pcs)'}
                      </span>
                      <span className="text-white font-bold font-mono">
                        {formatRupiah(prices.lusin_1)}
                      </span>
                    </div>
                  )}

                  {prices.satuan && (
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-white/70 text-[11px]">
                        {language === 'en' ? 'Retail / Single (1-11 pcs)' : 'Satuan (1–11 pcs)'}
                      </span>
                      <span className="text-white font-bold font-mono">
                        {formatRupiah(prices.satuan)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSizeChips = (service) => {
    const sizePricing = service.options_config?.size_pricing;
    const sizes = service.options_config?.sizes || (sizePricing ? Object.keys(sizePricing) : []);
    if (!sizes || sizes.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-primary text-xs tracking-wider uppercase font-bold flex items-center gap-1.5">
            <Icon name="scissors" size={13} className="text-primary" />
            <span>{language === 'en' ? 'Size Availability & Surcharge' : 'Ukuran Kaos & Penyesuaian Harga'}</span>
          </p>
          <span className="text-[10px] text-white/40">
            {language === 'en' ? 'S - XL Standard' : 'S s/d XL Standar'}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {sizes.map((size) => {
            const surcharge = sizePricing && sizePricing[size] !== undefined ? parseInt(sizePricing[size]) : 0;
            const isStandard = surcharge === 0;

            return (
              <div
                key={size}
                className={`rounded-2xl p-2.5 text-center border transition-all ${
                  isStandard
                    ? 'bg-black/30 border-white/10'
                    : 'bg-amber-500/10 border-amber-500/30 shadow-sm shadow-amber-500/10'
                }`}
              >
                <span className="font-heading font-bold text-sm block text-white">
                  {size}
                </span>
                <span className={`text-[10px] font-bold block mt-0.5 ${
                  isStandard ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isStandard
                    ? (language === 'en' ? 'Standard' : 'Standar')
                    : `+${formatRupiah(surcharge)}`}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-white/40 text-[10px] mt-1.5">
          {language === 'en'
            ? '*Sizes S to XL are standard price. XXL & XXXL require extra fabric surcharge.'
            : '*Ukuran S hingga XL harga standar. Ukuran XXL & XXXL dikenakan penyesuaian bahan.'}
        </p>
      </div>
    );
  };

  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
    }`}>
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-12 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4 shadow-lg shadow-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {language === 'en' ? 'Official & Transparent Pricelist' : 'Pricelist Resmi & Transparan'}
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide">
                {language === 'en' ? 'PRICE ' : 'DAFTAR '}<span className="text-gradient">{language === 'en' ? 'LIST' : 'HARGA'}</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto my-3" />
              <p className="text-white/60 text-xs sm:text-sm mt-3 max-w-lg mx-auto leading-relaxed">
                {language === 'en'
                  ? 'Production price estimates for custom t-shirts, polos, hoodies, totebags, and high quality merchandise'
                  : 'Estimasi harga produksi sablon kaos, polo, hoodie, totebag, dan merchandise berkualitas tinggi'}
              </p>
            </ScrollReveal>

            {/* Filter & Search */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 max-w-xl mx-auto">
                <div className="relative w-full sm:w-64">
                  <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'en' ? 'Search printing services...' : 'Cari layanan sablon...'}
                    className="input-premium w-full pl-11 pr-4 py-2.5 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: language === 'en' ? 'All' : 'Semua' },
                    { id: 'tiered', label: language === 'en' ? 'Tiered Wholesale' : 'Tiered Grosir' },
                    { id: 'flat', label: 'Flat Price' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all border ${
                        activeTab === tab.id
                          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                          : isLight
                          ? 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-white/10">
              <p className="text-white/60 text-sm">{language === 'en' ? 'No services match your search' : 'Tidak ada layanan yang sesuai dengan pencarian Anda'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service, index) => {
                const sName = (service.name || '').toLowerCase();
                const rawUnit = sName.includes('banner') ? 'm²' : sName.includes('stiker') ? 'lbr' : 'pcs';
                const unit = language === 'en' ? (rawUnit === 'm²' ? 'sqm' : rawUnit === 'lbr' ? 'sheet' : 'pcs') : rawUnit;
                const minOrder = service.minimum_order || 1;
                const minPrice = getMinPrice(service);
                const startingPrice = service.pricing_type === 'tiered'
                  ? formatRupiah(minPrice)
                  : formatRupiah(service.base_price || service.price_per_unit);

                return (
                  <ScrollReveal key={service.id} direction="up" delay={index * 80}>
                    <div className="glass-card-hover rounded-3xl p-6 sm:p-7 relative transition-all duration-300 group h-full flex flex-col justify-between border border-white/10 bg-white/[0.02]">
                      <div>
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-purple-500/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                            <ServiceIcon name={service.name} size={26} className="text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <h2 className="font-heading text-xl sm:text-2xl text-white tracking-wide leading-tight group-hover:text-primary transition-colors">
                                {td(service.name)}
                              </h2>
                              <div className="text-right shrink-0">
                                {service.pricing_type === 'tiered' && minPrice ? (
                                  <div>
                                    <p className="font-bold text-base sm:text-lg text-gradient-primary leading-tight">
                                      {language === 'en' ? 'From ' : 'Mulai '}{startingPrice}
                                    </p>
                                    <p className="text-white/40 text-[10px]">
                                      / {unit} ({language === 'en' ? 'wholesale 2-6 doz' : 'grosir 2–6 lsn'})
                                    </p>
                                    {getSatuanPrice(service) > minPrice && (
                                      <p className="text-white/60 text-[9px] font-mono mt-0.5">
                                        {language === 'en' ? 'Retail: ' : 'Satuan: '}{formatRupiah(getSatuanPrice(service))}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <p className="font-bold text-base sm:text-lg text-gradient-primary leading-tight">{startingPrice}</p>
                                    <p className="text-white/40 text-[10px]">/ {unit}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {service.description && (
                              <p className="text-white/60 text-xs leading-relaxed mt-1.5 line-clamp-2">{td(service.description)}</p>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-white/50 text-xs">{language === 'en' ? 'Min. ' : 'Min. '}<strong className="text-white font-semibold">{minOrder} {unit}</strong></span>
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                service.pricing_type === 'tiered' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-white/70 border border-white/15'
                              }`}>
                                {service.pricing_type === 'tiered' ? (language === 'en' ? 'Tiered Wholesale' : 'Grosir Bertingkat') : 'Flat Price'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content area */}
                        <div className="mt-2 space-y-1">
                          {renderPricingChips(service)}
                          {renderShirtModels(service)}
                          {renderSizeChips(service)}
                          {renderPrintAreaOptions(service)}
                          {renderOptions(service)}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/50 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {language === 'en' ? '100% Print Guarantee' : 'Garansi Cetak 100%'}
                        </span>
                        <Link
                          to={`/pesan?service=${service.id}`}
                          onClick={() => {
                            selectService(service);
                            setStep(2);
                          }}
                          className="btn-gradient-primary inline-flex items-center gap-1.5 py-2 px-5 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-md shadow-primary/20"
                        >
                          {language === 'en' ? 'Order Now' : 'Pesan Sekarang'} <Icon name="arrow-right" size={13} />
                        </Link>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {/* Catatan */}
          <ScrollReveal direction="blur">
            <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
              <h3 className="font-heading text-xl sm:text-2xl text-white tracking-wide mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {language === 'en' ? 'Terms & Additional Information' : 'Ketentuan & Informasi Tambahan'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: 'truck', text: language === 'en' ? 'Flat shipping IDR 15,000 for Greater Jakarta area' : 'Ongkos kirim flat Rp 15.000 untuk area Jabodetabek' },
                  { icon: 'credit-card', text: language === 'en' ? '50% DP to start production, final settlement upon completion' : 'DP 50% untuk mulai produksi, pelunasan saat selesai' },
                  { icon: 'clock', text: language === 'en' ? 'Estimated production time 3-7 business days (rush available)' : 'Estimasi waktu produksi 3-7 hari kerja (bisa kilat)' },
                  { icon: 'alert-triangle', text: language === 'en' ? 'Transparent pricing, consultation available via WhatsApp' : 'Harga transparan dan dapat dikonsultasikan via WA' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-black/30 border border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Icon name={item.icon} size={18} />
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal direction="blur">
            <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-primary/[0.05] to-white/[0.04] p-8 sm:p-10 text-center sm:text-left rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-heading text-2xl sm:text-3xl text-white tracking-wide mb-2">
                  {language === 'en' ? 'NEED SPECIAL BULK PRICING?' : 'BUTUH HARGA KHUSUS PARTAI BESAR?'}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md">
                  {language === 'en'
                    ? 'Get special discounts for vendors, communities, or corporate organizations with custom quantity negotiations'
                    : 'Dapatkan diskon khusus vendor, komunitas, atau instansi dengan negosiasi kuantiti spesial'}
                </p>
              </div>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={WA_URL}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-green-500/25 transition-all hover:scale-105 active:scale-95 shrink-0 relative z-10"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <Icon name="message-circle" size={18} />
                {language === 'en' ? 'Contact Admin WhatsApp' : 'Hubungi Admin WhatsApp'}
              </a>
            </div>
          </ScrollReveal>

        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
