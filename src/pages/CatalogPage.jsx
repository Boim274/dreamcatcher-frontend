import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function CatalogPage() {
  const { t, td, language } = useLanguageStore();
  const isEn = language === 'en';

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

      <main className="flex-1 py-12 sm:py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4 shadow-lg shadow-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {t('catalog.badge', 'Katalog Layanan & Konveksi Resmi')}
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide">
                {t('catalog.title', 'LAYANAN')} <span className="text-gradient">{t('catalog.titleHighlight', 'KAMI')}</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto my-3" />
              <p className="text-white/60 text-xs sm:text-sm mt-3 max-w-xl mx-auto leading-relaxed">
                {t('catalog.subtitle', 'Pilihan lengkap untuk kebutuhan sablon, bordir komputer, DTF High Definition, dan konveksi garment premium dengan garansi presisi 100%')}
              </p>
            </ScrollReveal>

            {/* Search & Filter Tabs */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 max-w-2xl mx-auto">
                <div className="relative w-full sm:w-72">
                  <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('catalog.searchPlaceholder', 'Cari jenis sablon / konveksi...')}
                    className="input-premium w-full pl-11 pr-4 py-2.5 text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { id: 'all', label: t('catalog.allTab', 'Semua Layanan') },
                    { id: 'tiered', label: t('catalog.tieredTab', 'Grosir Tiered') },
                    { id: 'flat', label: t('catalog.flatTab', 'Satuan & Merchandise') },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border ${
                        activeCategory === tab.id
                          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service, index) => {
                const sName = (service.name || '').toLowerCase();
                const rawUnit = sName.includes('banner') ? 'm²' : sName.includes('stiker') ? 'lbr' : 'pcs';
                const unit = isEn ? (rawUnit === 'm²' ? 'sqm' : rawUnit === 'lbr' ? 'sheet' : 'pcs') : rawUnit;

                return (
                  <ScrollReveal key={service.id} direction="up" delay={index * 100}>
                    <div className="glass-card-hover rounded-3xl p-6 sm:p-8 relative overflow-hidden group border border-white/10 bg-white/[0.02] flex flex-col justify-between h-full">
                      {/* Index Watermark */}
                      <div className="font-heading text-8xl absolute top-2 right-4 text-white/[0.03] select-none pointer-events-none group-hover:text-primary/[0.08] transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-start gap-5 sm:gap-6 mb-5">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-purple-500/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                            <ServiceIcon name={service.name} size={30} className="text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                                {service.pricing_type === 'tiered' ? (isEn ? 'Wholesale Price' : 'Harga Bertingkat') : (isEn ? 'Fixed Price' : 'Harga Tetap')}
                              </span>
                            </div>
                            <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wide group-hover:text-primary transition-colors">
                              {td(service.name)}
                            </h2>
                          </div>
                        </div>

                        <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
                          {td(service.description)}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-black/40 border border-white/5">
                          <div>
                            <p className="text-white/40 text-[10px] tracking-wider uppercase font-semibold">{t('catalog.priceStarts', 'Harga Mulai')}</p>
                            <p className="font-bold text-lg sm:text-xl text-gradient-primary mt-0.5">
                              {service.pricing_type === 'tiered'
                                ? formatRupiah(getMinPrice(service))
                                : formatRupiah(service.price_per_unit || service.base_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/40 text-[10px] tracking-wider uppercase font-semibold">{isEn ? 'Minimum Order' : 'Minimal Order'}</p>
                            <p className="font-bold text-lg sm:text-xl text-white mt-0.5">{service.minimum_order} {unit}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
                        <span className="text-xs text-white/50 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {isEn ? 'Reprint Guarantee' : 'Garansi Cetak Ulang'}
                        </span>
                        <Link
                          to={`/pesan?service=${service.id}`}
                          className="btn-gradient-primary inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25"
                        >
                          {t('catalog.orderNow', 'Pesan Sekarang')}
                          <Icon name="arrow-right" size={15} />
                        </Link>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {/* WhatsApp Consultation Banner */}
          <ScrollReveal direction="blur">
            <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-primary/[0.06] to-white/[0.04] p-8 sm:p-12 text-center backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <h3 className="font-heading text-2xl sm:text-3xl text-white tracking-wide mb-3 relative z-10">
                {t('catalog.consultTitle', 'KONSULTASI DESAIN & KEBUTUHAN SABLON')}
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mb-6 max-w-lg mx-auto relative z-10 leading-relaxed">
                {t('catalog.consultDesc', 'Bingung memilih jenis sablon atau jenis kain? Tim teknis kami siap memandu Anda memilih kombinasi paling awet dan hemat budget.')}
              </p>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={WA_URL}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-green-500/25 transition-all hover:scale-105 active:scale-95 relative z-10"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <Icon name="message-circle" size={18} />
                {t('catalog.consultBtn', 'Konsultasi Langsung via WhatsApp')}
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
