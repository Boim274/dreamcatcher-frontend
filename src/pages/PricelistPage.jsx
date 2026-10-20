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
import { formatRupiah, getMinPrice } from '../utils/formatRupiah';
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

  const renderOptions = (service) => {
    const options = service.options_config || {};
    const hasSizePricing = options.size_pricing && Object.keys(options.size_pricing).length > 0;
    const entries = Object.entries(options).filter(([k]) => {
      if (['size_pricing', 'sablon_types', 'max_print_areas', 'area_surcharge'].includes(k)) return false;
      if (k === 'sizes' && hasSizePricing) return false;
      return true;
    });
    if (entries.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-primary text-xs tracking-wider uppercase mb-2.5 font-bold">{language === 'en' ? 'Available Options' : 'Opsi Tersedia'}</p>
        <div className="space-y-2.5">
          {entries.slice(0, 3).map(([key, items]) => {
            const label = optionLabels[key] || key.replace(/_/g, ' ');
            return (
              <div key={key}>
                <p className="text-white/40 text-[10px] tracking-wider uppercase mb-1 font-semibold">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {key === 'colors' && Array.isArray(items) ? (
                    items.slice(0, 6).map((color) => (
                      <span key={color} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white/80">
                        <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: colorMap[color] || '#888' }} />
                        {td(color)}
                      </span>
                    ))
                  ) : Array.isArray(items) ? (
                    items.slice(0, 6).map((item, idx) => {
                      const isObj = typeof item === 'object' && item !== null;
                      const v = isObj ? item.label : item;
                      return (
                        <span key={idx} className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-xl">{td(v)}</span>
                      );
                    })
                  ) : typeof items === 'object' ? (
                    Object.entries(items).slice(0, 6).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-xl">
                        {td(k)} <span className="text-white/40 text-[10px]">+{formatRupiah(v)}</span>
                      </span>
                    ))
                  ) : null}
                </div>
              </div>
            );
          })}
          {entries.some(([, items]) => Array.isArray(items) && items.length > 6) && (
            <p className="text-white/40 text-[11px]">{language === 'en' ? '+ more options' : '+ opsi lainnya'}</p>
          )}
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
          <p className="text-primary text-xs tracking-wider uppercase mb-2.5 font-bold">{language === 'en' ? 'Service Price' : 'Harga Layanan'}</p>
          <div className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3 border border-white/5">
            <span className="text-white/60 text-xs">{language === 'en' ? `Flat price per ${unit}` : `Harga tetap per ${unit}`}</span>
            <span className="text-gradient-primary font-bold text-base">{formatRupiah(service.base_price || service.price_per_unit)}</span>
          </div>
        </div>
      );
    }

    const config = service.pricing_config || {};
    const entries = Object.entries(config);
    if (entries.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-primary text-xs tracking-wider uppercase mb-2.5 font-bold">{language === 'en' ? 'Price per Print Type' : 'Harga per Jenis Sablon'}</p>
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([type, prices]) => {
            const tiers = [];
            if (prices.lusin_2_6) tiers.push({ label: language === 'en' ? '2-6 doz' : '2-6 lsn', price: prices.lusin_2_6 });
            if (prices.lusin_1) tiers.push({ label: language === 'en' ? '1 doz' : '1 lsn', price: prices.lusin_1 });
            if (prices.satuan) tiers.push({ label: language === 'en' ? 'single' : 'satuan', price: prices.satuan });
            if (tiers.length === 0) return null;
            return (
              <div key={type} className="bg-black/40 border border-white/5 rounded-2xl p-3 space-y-1.5">
                <p className="text-white font-bold text-xs uppercase tracking-wide">{td(type)}</p>
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/50 text-[11px]">{t.label}</span>
                    <span className="text-primary font-bold">{formatRupiah(t.price)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSizeChips = (service) => {
    const sizePricing = service.options_config?.size_pricing;
    if (!sizePricing || Object.keys(sizePricing).length === 0) return null;

    const minPrice = getMinPrice(service);
    const basePrice = minPrice || parseFloat(service.base_price) || 0;
    const sizes = service.options_config?.sizes || Object.keys(sizePricing);

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-primary text-xs tracking-wider uppercase mb-2.5 font-bold">{language === 'en' ? 'Price per Size' : 'Harga per Ukuran'}</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const surcharge = parseInt(sizePricing[size]) || 0;
            const total = basePrice + surcharge;
            return (
              <div key={size} className="bg-black/40 border border-white/5 rounded-2xl px-3 py-1.5 flex items-center gap-2">
                <span className="bg-primary/20 text-primary font-bold text-xs px-2 py-0.5 rounded-lg border border-primary/30">{td(size)}</span>
                <span className="text-white font-semibold text-xs">{formatRupiah(total)}</span>
              </div>
            );
          })}
        </div>
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
                                  <>
                                    <p className="font-bold text-base sm:text-lg text-gradient-primary leading-tight">{language === 'en' ? 'From ' : 'Mulai '}{startingPrice}</p>
                                    <p className="text-white/40 text-[10px]">/ {unit} ({language === 'en' ? 'wholesale' : 'grosir'})</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-bold text-base sm:text-lg text-gradient-primary leading-tight">{startingPrice}</p>
                                    <p className="text-white/40 text-[10px]">/ {unit}</p>
                                  </>
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
                                {service.pricing_type === 'tiered' ? (language === 'en' ? 'Tiered Wholesale' : 'Grosir Tiered') : 'Flat Price'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content area */}
                        <div className="mt-2">
                          {renderPricingChips(service)}
                          {renderSizeChips(service)}
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
