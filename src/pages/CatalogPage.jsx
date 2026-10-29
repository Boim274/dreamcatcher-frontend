import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Icon from '../components/ui/Icon';
import ServiceIcon from '../components/ui/ServiceIcons';
import ScrollReveal from '../components/ui/ScrollReveal';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import { formatRupiah, getMinPrice } from '../utils/formatRupiah';
import { WA_URL } from '../constants/whatsapp';
import { getServiceImage } from './LandingPage';

export default function CatalogPage() {
  const { t, td, language } = useLanguageStore();
  const isEn = language === 'en';
  const navigate = useNavigate();
  const selectService = useOrderStore((s) => s.selectService);
  const setStep = useOrderStore((s) => s.setStep);

  const handleSelectService = (service) => {
    selectService(service);
    const sName = (service.name || '').toLowerCase();
    const isKaos = sName.includes('kaos');
    if (isKaos) {
      navigate('/layanan/kaos');
      return;
    }
    setStep(2);
    navigate(`/pesan?service=${service.id}`);
  };

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data.services || []);
      } catch {
        console.error('Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter(service => {
    const sName = (service.name || '').toLowerCase();
    const sDesc = (service.description || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = sName.includes(q) || sDesc.includes(q);
    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'kaos') return sName.includes('kaos');
    if (activeCategory === 'banner') return sName.includes('banner');
    if (activeCategory === 'stiker') return sName.includes('stiker');
    if (activeCategory === 'bordir') return sName.includes('bordir');
    if (activeCategory === 'tiered') return service.pricing_type === 'tiered';
    if (activeCategory === 'flat') return service.pricing_type === 'flat';
    return true;
  });

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

      <main className="flex-1 py-8 sm:py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-8 sm:mb-14 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-3 sm:mb-4 shadow-lg shadow-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {t('catalog.badge', 'Katalog Layanan & Konveksi Resmi')}
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl text-white tracking-wide">
                {t('catalog.title', 'LAYANAN')} <span className="text-gradient">{t('catalog.titleHighlight', 'KAMI')}</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto my-2.5 sm:my-3" />
              <p className="text-white/60 text-xs sm:text-sm mt-2 sm:mt-3 max-w-xl mx-auto leading-relaxed px-2">
                {t('catalog.subtitle', 'Pilihan lengkap untuk kebutuhan sablon, bordir komputer, DTF High Definition, dan konveksi garment premium dengan garansi presisi 100%')}
              </p>
            </ScrollReveal>

            {/* Mobile-Friendly Search & Navigation Filter Bar */}
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-2xl mx-auto mt-6 sm:mt-8 space-y-3">
                {/* Search Box */}
                <div className="relative">
                  <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('catalog.searchPlaceholder', 'Cari jenis sablon, kaos, banner, stiker, bordir...')}
                    className="input-premium w-full pl-10 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl sm:rounded-2xl"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
                      aria-label="Hapus pencarian"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>

                {/* Horizontal Scrollable Category / Filter Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 w-full px-0.5 scroll-smooth">
                  {[
                    { id: 'all', label: isEn ? 'All Services' : 'Semua Layanan', icon: 'layers' },
                    { id: 'kaos', label: 'Sablon Kaos', icon: 'shirt' },
                    { id: 'banner', label: 'Banner & Spanduk', icon: 'image' },
                    { id: 'stiker', label: 'Cetak Stiker', icon: 'tag' },
                    { id: 'bordir', label: 'Bordir Komputer', icon: 'scissors' },
                    { id: 'tiered', label: isEn ? 'Tiered Wholesale' : 'Harga Bertingkat', icon: 'bar-chart' },
                  ].map((tab) => {
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategory(tab.id)}
                        className={`whitespace-nowrap px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                          isActive
                            ? 'border-primary bg-gradient-to-r from-primary to-[#ff60a8] text-white shadow-lg shadow-primary/25 scale-[1.02]'
                            : isLight
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {tab.icon && <Icon name={tab.icon} size={13} className={isActive ? 'text-white' : 'text-primary'} />}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter status / active count */}
                {(searchQuery || activeCategory !== 'all') && (
                  <div className="flex items-center justify-between text-[11px] text-white/60 px-1 pt-0.5">
                    <span>
                      Menampilkan <strong className="text-white font-bold">{filteredServices.length}</strong> layanan
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory('all');
                        setSearchQuery('');
                      }}
                      className="text-primary hover:underline cursor-pointer shrink-0 font-medium ml-2"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-white/10">
              <p className="text-white/60 text-sm">{t('catalog.emptyTitle', 'Tidak ada layanan yang sesuai dengan pilihan Anda')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredServices.map((service, index) => {
                const sName = (service.name || '').toLowerCase();
                const rawUnit = sName.includes('banner') ? 'm²' : sName.includes('stiker') ? 'lbr' : 'pcs';
                const unit = isEn ? (rawUnit === 'm²' ? 'sqm' : rawUnit === 'lbr' ? 'sheet' : 'pcs') : rawUnit;

                return (
                  <ScrollReveal key={service.id} direction="up" delay={index * 80}>
                    <div 
                      onClick={() => handleSelectService(service)}
                      className={`glass-card-hover rounded-2xl sm:rounded-3xl overflow-hidden relative group border flex flex-col justify-between h-full cursor-pointer transition-all duration-300 active:scale-[0.99] ${
                        isLight ? 'bg-white border-slate-200/80 shadow-md hover:shadow-xl' : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      {/* Image Banner - Compact & Proportionate */}
                      <div className="relative w-full h-36 sm:h-44 md:h-48 overflow-hidden bg-black/40">
                        <img
                          src={getServiceImage(service)}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#150d1a] via-[#150d1a]/25 to-transparent pointer-events-none" />

                        {/* Floating Service Icon */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-md">
                          <ServiceIcon name={service.name} size={18} className="sm:scale-125" />
                        </div>

                        {/* Floating Pricing Badge on Image */}
                        <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-black/75 border border-white/15 backdrop-blur-md text-white/90 shadow">
                            {service.pricing_type === 'tiered' ? (isEn ? 'Wholesale Price' : 'Harga Bertingkat') : (isEn ? 'Fixed Price' : 'Harga Tetap')}
                          </span>
                        </div>

                        {/* Index Number */}
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-black/60 border border-white/15 backdrop-blur-md">
                          <span className="font-mono text-xs sm:text-sm font-bold text-white/70 group-hover:text-primary transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {/* Card Content - Mobile Friendly Spacing */}
                      <div className="p-4 sm:p-6 relative z-10 flex flex-col justify-between flex-1">
                        <div>
                          <h2 className="font-heading text-xl sm:text-2xl text-white tracking-wide group-hover:text-primary transition-colors mb-1.5 line-clamp-1">
                            {td(service.name)}
                          </h2>

                          {/* Concise description clamped so cards stay compact */}
                          <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                            {td(service.description)}
                          </p>
                        </div>

                        <div>
                          {/* Price & Minimum Order - Compact & Clean Grid */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3.5 sm:mb-4 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/40 border border-white/5">
                            <div className="min-w-0">
                              <p className="text-white/40 text-[10px] tracking-wider uppercase font-semibold truncate">{t('catalog.priceStarts', 'Harga Mulai')}</p>
                              <p className="font-bold text-base sm:text-lg lg:text-xl text-gradient-primary mt-0.5 truncate">
                                {service.pricing_type === 'tiered'
                                  ? formatRupiah(getMinPrice(service))
                                  : formatRupiah(service.price_per_unit || service.base_price)}
                              </p>
                            </div>
                            <div className="min-w-0 pl-2.5 sm:pl-3 border-l border-white/10">
                              <p className="text-white/40 text-[10px] tracking-wider uppercase font-semibold truncate">{isEn ? 'Minimum Order' : 'Minimal Order'}</p>
                              <p className="font-bold text-base sm:text-lg lg:text-xl text-white mt-0.5 truncate">{service.minimum_order} {unit}</p>
                            </div>
                          </div>

                          {/* Footer CTA */}
                          <div className="pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                            <span className="text-[11px] sm:text-xs text-white/50 flex items-center gap-1.5 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                              <span>{isEn ? 'Reprint Guarantee' : 'Garansi Cetak Ulang'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectService(service);
                              }}
                              className="btn-gradient-primary inline-flex items-center gap-1.5 py-2 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 cursor-pointer shrink-0 active:scale-95 transition-transform"
                            >
                              <span>{t('catalog.orderNow', 'Pesan Sekarang')}</span>
                              <Icon name="arrow-right" size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {/* WhatsApp Consultation Banner */}
          <ScrollReveal direction="blur">
            <div className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-primary/[0.06] to-white/[0.04] p-6 sm:p-10 text-center backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl text-white tracking-wide mb-2 sm:mb-3 relative z-10">
                {t('catalog.consultTitle', 'KONSULTASI DESAIN & KEBUTUHAN SABLON')}
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mb-5 sm:mb-6 max-w-lg mx-auto relative z-10 leading-relaxed px-2">
                {t('catalog.consultDesc', 'Bingung memilih jenis sablon atau jenis kain? Tim teknis kami siap memandu Anda memilih kombinasi paling awet dan hemat budget.')}
              </p>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={WA_URL}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-green-500/25 transition-all hover:scale-105 active:scale-95 relative z-10 w-full sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <Icon name="message-circle" size={16} />
                <span>{t('catalog.consultBtn', 'Konsultasi Langsung via WhatsApp')}</span>
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
