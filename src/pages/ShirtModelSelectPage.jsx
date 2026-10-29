import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Icon from '../components/ui/Icon';
import ScrollReveal from '../components/ui/ScrollReveal';
import { formatRupiah } from '../utils/formatRupiah';
import { WA_URL } from '../constants/whatsapp';
import { ArrowLeft, ArrowRight, Check, Sparkles, Shirt, ShieldCheck, Zap } from 'lucide-react';

const FALLBACK_MODELS = [
  {
    id: 'short_sleeve',
    slug: 'short-sleeve',
    name: 'Kaos Lengan Pendek',
    name_en: 'Short Sleeve T-Shirt',
    badge: 'Short Sleeve • Paling Populer',
    badge_en: 'Short Sleeve • Most Popular',
    description: 'Model kaos klasik lengan pendek standar distro. Terbuat dari katun combed 30s/24s premium yang adem, halus, nyaman, dan sangat ideal untuk segala teknik sablon presisi.',
    description_en: 'Classic short sleeve t-shirt distro standard. Made from premium combed 30s/24s cotton, breathable, ultra-comfortable, and perfect for all high-definition printing.',
    image: '/products/kaos-lengan-pendek.jpg',
    base_price: 60000,
    surcharge: 0,
    features: [
      'Bahan 100% Cotton Combed 24s/30s adem & lembut',
      'Jahitan rantai standar distro & rib leher elastis',
      'Hasil cetak DTF HD & Plastisol tajam anti-pecah',
      'Pilihan terbaik untuk kaos harian, event & komunitas',
    ],
    features_en: [
      '100% Cotton Combed 24s/30s soft & breathable',
      'Distro standard chain stitching & durable collar rib',
      'High Definition DTF & Plastisol sharp print',
      'Best choice for daily wear, events & merchandise',
    ],
    colors: ['#000000', '#ffffff', '#172554', '#7F1D1D', '#16A34A'],
    is_active: true,
  },
  {
    id: 'long_sleeve',
    slug: 'long-sleeve',
    name: 'Kaos Lengan Panjang',
    name_en: 'Long Sleeve T-Shirt',
    badge: 'Long Sleeve • Komunitas & Seragam',
    badge_en: 'Long Sleeve • Community & Uniform',
    description: 'Kaos lengan panjang yang nyaman digunakan untuk berbagai aktivitas, baik sehari-hari, bekerja, maupun kegiatan komunitas. Dibuat dengan bahan berkualitas yang lembut dan nyaman di kulit, serta jahitan rapi untuk memberikan hasil yang maksimal.',
    description_en: 'Comfortable long sleeve t-shirt for daily activities, work, and community events. Crafted from soft, skin-friendly premium fabric with neat stitching for maximum quality.',
    image: '/products/kaos-lengan-panjang.jpg',
    base_price: 67000,
    surcharge: 7000,
    features: [
      'Bahan 100% Cotton Combed 24s/30s kualitas grade A',
      'Jahitan rapi standar distro & nyaman digunakan',
      'Hijab-friendly & perlindungan ekstra outdoor',
      'Sangat cocok untuk seragam kerja, komunitas & distro',
    ],
    features_en: [
      '100% Cotton Combed 24s/30s grade A quality',
      'Distro standard neat stitching & comfortable fit',
      'Hijab-friendly & extra outdoor UV protection',
      'Ideal for work uniforms, touring & brand clothing',
    ],
    colors: ['#000000', '#ffffff', '#172554', '#7F1D1D', '#16A34A'],
    is_active: true,
  },
];

export default function ShirtModelSelectPage() {
  const { t, language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const { selectService, setStep, setConfig } = useOrderStore();

  const [loading, setLoading] = useState(true);
  const [kaosService, setKaosService] = useState(null);
  const [shirtModels, setShirtModels] = useState(FALLBACK_MODELS);
  const [selectedModelId, setSelectedModelId] = useState('short_sleeve');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // 1. Fetch Kaos service
        const servRes = await api.get('/services');
        const services = servRes.data?.services || [];
        const foundService = services.find((s) => (s.name || '').toLowerCase().includes('kaos')) || services[0];
        if (isMounted && foundService) {
          setKaosService(foundService);
        }

        // 2. Fetch products under category "kaos"
        const prodRes = await api.get('/products?category_id=1');
        const dbProducts = prodRes.data?.products?.data || prodRes.data?.products || [];

        if (isMounted && dbProducts.length > 0) {
          const merged = FALLBACK_MODELS.map((fallback) => {
            const matchedDb = dbProducts.find((p) => {
              const nameLower = (p.name || '').toLowerCase();
              if (fallback.id === 'short_sleeve') {
                return nameLower.includes('pendek') || nameLower.includes('short');
              } else {
                return nameLower.includes('panjang') || nameLower.includes('long');
              }
            });

            if (!matchedDb) return fallback;

            const primaryImg = matchedDb.images?.[0]?.image_url || fallback.image;
            return {
              ...fallback,
              product_id: matchedDb.id,
              name: matchedDb.name || fallback.name,
              description: matchedDb.description || fallback.description,
              base_price: parseFloat(matchedDb.base_price) || fallback.base_price,
              image: primaryImg,
              is_active: matchedDb.is_active !== undefined ? matchedDb.is_active : true,
            };
          });

          setShirtModels(merged);
        }
      } catch (err) {
        console.error('Failed to load shirt models from API, using defaults:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChooseModel = (model) => {
    setSelectedModelId(model.id);

    // Make sure service is selected
    if (kaosService) {
      selectService(kaosService);
    }

    // Set configuration in order store
    setConfig({
      shirtModel: model.name,
      shirtModelId: model.id,
      shirtModelProductId: model.product_id || null,
      shirtModelImage: model.image,
      shirtModelSurcharge: model.surcharge || 0,
      shirtModelBasePrice: model.base_price,
      // Default material if not set
      material: 'Cotton Combed 30s',
    });

    setStep(2);
    navigate(`/pesan?service=${kaosService?.id || 1}&model=${model.id}`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[520px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-10 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Navigation & Breadcrumbs */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/layanan"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary shadow-sm'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>{isEn ? 'Back to Services' : 'Kembali ke Layanan'}</span>
            </Link>

            <span className="text-[11px] font-semibold text-zinc-400">
              {isEn ? 'Service Category: Apparel T-Shirt' : 'Kategori Layanan: Sablon Kaos'}
            </span>
          </div>

          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4 shadow-lg shadow-primary/10">
                <Shirt className="w-3.5 h-3.5" />
                <span>{isEn ? 'Step 1: Choose Shirt Model' : 'Langkah 1: Pilih Model Kaos'}</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-wide">
                {isEn ? 'CHOOSE YOUR' : 'PILIH MODEL'} <span className="text-gradient">{isEn ? 'SHIRT MODEL' : 'KAOS'}</span>
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto my-3" />
              <p className="text-white/70 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {isEn
                  ? 'Select your preferred shirt cut before customizing colors, sizes, and print designs. Both models feature 100% premium cotton combed.'
                  : 'Tentukan model potongan kaos sesuai kebutuhan Anda sebelum mengatur ukuran, warna, dan desain sablon. Keduanya dibuat dari bahan 100% Cotton Combed standar distro.'}
              </p>
            </ScrollReveal>
          </div>

          {/* Product Cards: Side by side on desktop, stacked on mobile */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
              {shirtModels.map((model, index) => {
                const isSelected = selectedModelId === model.id;

                return (
                  <ScrollReveal key={model.id} direction="up" delay={index * 120}>
                    <div
                      onClick={() => setSelectedModelId(model.id)}
                      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-gradient-to-b from-primary/[0.08] via-white/[0.02] to-transparent'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Top Badge & Active Indicator */}
                      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md bg-black/60 border-white/20 text-white shadow-md">
                          {isEn ? model.badge_en : model.badge}
                        </span>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                              : 'bg-black/60 border border-white/20 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>

                      {/* Image Showcase (Compact Height) */}
                      <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-[#18111d] flex items-center justify-center">
                        <img
                          src={model.image}
                          alt={model.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#150d1a] via-[#150d1a]/25 to-transparent pointer-events-none" />

                        {/* Model Tag Overlay */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-white/90 font-mono font-medium text-[10px]">
                            {model.id === 'short_sleeve' ? 'Short Sleeve • Reguler' : 'Long Sleeve • Reguler'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md backdrop-blur-md">
                            100% Cotton
                          </span>
                        </div>
                      </div>

                      {/* Content Section (Compact Padding & Typography) */}
                      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-baseline justify-between gap-2 mb-1.5">
                            <h2
                              className={`font-heading text-lg sm:text-xl tracking-wide group-hover:text-primary transition-colors ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              {isEn ? model.name_en : model.name}
                            </h2>
                          </div>

                          <p
                            className={`text-[11px] sm:text-xs leading-relaxed mb-3.5 ${
                              isLight ? 'text-slate-600' : 'text-zinc-300/80'
                            }`}
                          >
                            {isEn ? model.description_en : model.description}
                          </p>

                          {/* Key Specs */}
                          <div
                            className={`rounded-xl p-3 mb-3.5 border space-y-1.5 ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'
                            }`}
                          >
                            <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-primary mb-1.5">
                              {isEn ? 'Key Specifications' : 'Spesifikasi Unggulan'}
                            </p>
                            {(isEn ? model.features_en : model.features).map((feat, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <span className={isLight ? 'text-slate-700' : 'text-zinc-300'}>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price & CTA Action */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block">
                              {isEn ? 'Starting Price' : 'Harga Mulai'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-lg sm:text-xl font-bold font-mono text-gradient-primary">
                                {formatRupiah(model.base_price)}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">/ pcs</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChooseModel(model);
                            }}
                            className="btn-gradient-primary py-2.5 px-4 sm:px-5 rounded-xl text-xs uppercase tracking-wider font-bold shadow-md shadow-primary/25 cursor-pointer flex items-center justify-center gap-1.5 group-hover:scale-105 active:scale-95 transition-all"
                          >
                            <span>{isEn ? 'Select Model' : 'Pilih Model'}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {/* Service Guarantee Badges */}
          <ScrollReveal direction="blur" delay={200}>
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isEn ? '100% Cotton Combed' : '100% Cotton Combed Asli'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isEn ? 'Soft, cool & comfortable for tropical climate' : 'Kain lembut, adem menyerap keringat dan tidak kaku'}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-2.5">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isEn ? 'DTF & Plastisol HD' : 'Sablon Beresolusi Tinggi'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isEn ? 'Sharp colors, flexible and durable wash after wash' : 'Warna tajam, lentur, tidak retak & tahan cuci'}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isEn ? 'No Minimum Order' : 'Bisa Satuan & Lusinan'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isEn ? 'Flexible pricing from 1 pcs up to bulk orders' : 'Pesan 1 pcs tetap dilayani, harga grosir bertingkat'}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* WhatsApp Direct Help Banner */}
          <ScrollReveal direction="blur" delay={300}>
            <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.03] via-primary/[0.05] to-white/[0.03] p-6 sm:p-8 text-center backdrop-blur-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h3 className="font-heading text-xl sm:text-2xl text-white tracking-wide mb-1">
                  {isEn ? 'Need Assistance Choosing A Model?' : 'Butuh Bantuan Memilih Model Kaos?'}
                </h3>
                <p className="text-white/60 text-xs sm:text-sm max-w-lg leading-relaxed">
                  {isEn
                    ? 'Our customer service team is ready to recommend the best cut and fabric thickness for your event or clothing line.'
                    : 'Tim kami siap merekomendasikan model kaos dan ketebalan kain yang paling pas untuk event, komunitas, atau brand distro Anda.'}
                </p>
              </div>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={WA_URL}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-green-500/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <Icon name="message-circle" size={16} />
                <span>{isEn ? 'Chat via WhatsApp' : 'Konsultasi via WhatsApp'}</span>
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
