import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Sparkles,
  Zap,
  Eye,
  Camera,
  ArrowRight,
  ShieldCheck,
  Layers,
  Package,
  CreditCard,
  Truck,
  HelpCircle,
  MessageCircle,
  Search,
  X,
  FileText,
  BadgePercent,
  Check,
  Headphones
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/ui/Icon';
import ServiceIcon from '../components/ui/ServiceIcons';
import ScrollReveal from '../components/ui/ScrollReveal';
import PortfolioCarousel from '../components/common/PortfolioCarousel';
import TestimonialCarousel from '../components/common/TestimonialCarousel';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import api from '../services/api';
import { formatRupiah, getMinPrice } from '../utils/formatRupiah';
import { WA_URL } from '../constants/whatsapp';

const marqueeItemsId = [
  'SABLON KAOS PREMIUM', 'DTF HIGH DEFINITION', 'PLASTISOL DISTRO', 'BORDIR KOMPUTER', 'AI DESIGN GENERATOR', '3D MOCKUP PREVIEW', 'GARANSI KUALITAS 100%'
];

const marqueeItemsEn = [
  'PREMIUM APPAREL PRINTING', 'DTF HIGH DEFINITION', 'DISTRO PLASTISOL', 'COMPUTER EMBROIDERY', 'AI DESIGN GENERATOR', '3D MOCKUP PREVIEW', '100% QUALITY GUARANTEE'
];

const FAQ_DATA = [
  {
    id: 1,
    categoryKey: 'Pemesanan',
    icon: Package,
    question: {
      id: 'Berapa minimal pemesanan (MOQ) dan berapa lama proses pengerjaannya?',
      en: 'What is the minimum order quantity (MOQ) and production turnaround time?'
    },
    answer: {
      id: 'Kami melayani pemesanan mulai dari 1 pcs (satuan) untuk sablon custom DTF! Untuk pesanan grosir (kaos kelas, komunitas, event kantor), Anda bisa memesan sesuai kebutuhan dengan harga bertingkat yang jauh lebih hemat. Waktu pengerjaan standar berkisar 2-5 hari kerja setelah pembayaran & approval desain.',
      en: 'We accept orders starting from 1 pcs (single item) for custom DTF printing! For bulk orders (school classes, communities, corporate events), tiered pricing offers substantial savings. Standard turnaround is 2-5 business days after payment and design approval.'
    },
    highlights: {
      id: ['Bisa Satuan (1 Pcs)', 'Pengerjaan 2-5 Hari Kerja', 'Kapasitas Ribuan Pcs/Minggu'],
      en: ['Single Piece (1 Pcs) Accepted', '2-5 Business Days Production', 'Thousands of Pcs/Week Capacity']
    },
  },
  {
    id: 2,
    categoryKey: 'Teknik Sablon',
    icon: Layers,
    question: {
      id: 'Apa perbedaan sablon DTF, Plastisol, Polyflex, dan Bordir Komputer?',
      en: 'What is the difference between DTF, Plastisol, Polyflex, and Computer Embroidery?'
    },
    answer: {
      id: 'DTF (Direct to Film) sangat cocok untuk desain full color / foto gradasi tanpa batasan warna. Plastisol adalah standar distro dengan tinta karet awet tahan cuci. Polyflex ideal untuk sablon nomor/nama jersey bola. Sedangkan Bordir Komputer menghasilkan jahitan timbul yang elegan & formal.',
      en: 'DTF (Direct to Film) is ideal for full-color designs and photographic gradients without color limits. Plastisol is the streetwear industry standard with durable, wash-resistant rubberized ink. Polyflex is great for jersey names/numbers. Computer Embroidery creates elegant and professional raised stitchwork.'
    },
    highlights: {
      id: ['DTF: Full Color & Foto', 'Plastisol: Standar Distro Awet', 'Bordir: Elegan & Rapi'],
      en: ['DTF: Full Color & Photos', 'Plastisol: Durable Distro Standard', 'Embroidery: Elegant & Neat']
    },
  },
  {
    id: 3,
    categoryKey: 'Desain & AI',
    icon: Sparkles,
    question: {
      id: 'Bagaimana jika saya belum punya desain atau hanya punya ide tulisan?',
      en: 'What if I do not have a design or only have a concept idea?'
    },
    answer: {
      id: 'Gunakan fitur AI Design Studio kami secara gratis! Cukup ketik deskripsi konsep ide Anda (misal: "Cyberpunk dragon with neon katana"), AI akan membuatkan gambar resolusi tinggi siap cetak, menampilkan simulasi 3D Mockup, dan bisa dicoba langsung via kamera AR Try-On.',
      en: 'Use our AI Design Studio for free! Simply type your concept prompt (e.g., "Cyberpunk dragon with neon katana"), and AI will generate print-ready high-res artwork, 3D Mockup preview, and allow you to try it on using AR Try-On.'
    },
    highlights: {
      id: ['AI Text-to-Image Gratis', 'Simulasi 3D Real-Time', 'Bantuan Tim Desainer'],
      en: ['Free AI Text-to-Image', 'Real-Time 3D Simulation', 'Designer Support']
    },
  },
  {
    id: 4,
    categoryKey: 'Desain & AI',
    icon: FileText,
    question: {
      id: 'Format file apa saja yang diterima jika saya sudah punya desain sendiri?',
      en: 'What file formats are accepted if I already have my own design?'
    },
    answer: {
      id: 'Kami menerima file PNG transparan (resolusi minimal 300 DPI), Adobe Illustrator (.AI), CorelDraw (.CDR), Photoshop (.PSD), atau PDF Vektor. Tim kontrol mutu kami akan mengecek ketajaman artwork sebelum masuk mesin sablon untuk menjamin hasil tidak blur.',
      en: 'We accept transparent PNG (minimum 300 DPI), Adobe Illustrator (.AI), CorelDraw (.CDR), Photoshop (.PSD), or Vector PDF. Our pre-flight QC team checks artwork sharpness before printing to ensure crisp results.'
    },
    highlights: {
      id: ['PNG Transparan 300 DPI', 'AI, CDR, PSD, PDF Vektor', 'Free Pre-Flight Check'],
      en: ['Transparent PNG 300 DPI', 'AI, CDR, PSD, Vector PDF', 'Free Pre-Flight Check']
    },
  },
  {
    id: 5,
    categoryKey: 'Pembayaran',
    icon: CreditCard,
    question: {
      id: 'Bagaimana sistem pembayaran? Apakah bisa membayar DP terlebih dahulu?',
      en: 'What payment methods are supported? Can I pay a deposit first?'
    },
    answer: {
      id: 'Bisa! Kami menyediakan opsi Down Payment (DP) 50% untuk mulai produksi, dan pelunasan 50% saat pesanan selesai sebelum dikirim. Kami menerima Transfer Bank (BCA, Mandiri, BNI, BRI) dan QRIS otomatis (GoPay, OVO, ShopeePay, DANA).',
      en: 'Yes! We provide a 50% Down Payment (DP) option to initiate production, with the remaining 50% settled once order is completed before shipping. We accept Bank Transfers (BCA, Mandiri, BNI, BRI) and instant QRIS (GoPay, OVO, ShopeePay, DANA).'
    },
    highlights: {
      id: ['Opsi DP 50%', 'QRIS & Transfer Bank', 'Verifikasi Otomatis'],
      en: ['50% Down Payment Option', 'QRIS & Bank Transfer', 'Automatic Verification']
    },
  },
  {
    id: 6,
    categoryKey: 'Pengiriman',
    icon: Truck,
    question: {
      id: 'Apakah melayani pengiriman ke seluruh Indonesia dan bisa cek resi?',
      en: 'Do you ship across Indonesia and provide tracking numbers?'
    },
    answer: {
      id: 'Ya, kami mengirim ke seluruh kota & pelosok Indonesia via JNE, J&T, SiCepat, serta Kargo (Indah Cargo, Baraka, Dakota) untuk pesanan kuantitas besar agar ongkir hemat. Setiap pesanan dilengkapi nomor resi yang dapat dilacak langsung di menu Lacak Pesanan.',
      en: 'Yes, we deliver to all cities and regions across Indonesia via JNE, J&T, SiCepat, and low-cost Cargo (Indah Cargo, Baraka, Dakota) for bulk orders. Every order includes a tracking number you can monitor live in our Order Tracking menu.'
    },
    highlights: {
      id: ['Kirim Se-Indonesia', 'Ekspedisi & Kargo Murah', 'Live Tracking Resi'],
      en: ['Nationwide Delivery', 'Affordable Cargo Shipping', 'Live Tracking Number']
    },
  },
  {
    id: 7,
    categoryKey: 'Garansi & QC',
    icon: ShieldCheck,
    question: {
      id: 'Apakah ada garansi jika hasil sablon cacat atau tidak sesuai?',
      en: 'Is there a warranty if the print result is defective or mismatched?'
    },
    answer: {
      id: 'Tentu! Kami memberikan Garansi Kualitas 100%. Jika ada cacat produksi dari pihak kami (sablon rontok, kain robek, salah ukuran cetak), kami siap mencetak ulang atau mengganti 100% tanpa pungutan biaya tambahan.',
      en: 'Absolutely! We provide a 100% Quality Guarantee. If there is a manufacturing defect on our end (peeling print, torn fabric, incorrect print size), we will reprint or replace 100% at no extra charge.'
    },
    highlights: {
      id: ['Garansi Kualitas 100%', 'Ganti Baru Jika Cacat', 'QC Standar Ekspor'],
      en: ['100% Quality Guarantee', 'Free Replacement If Defective', 'Export Quality Standard']
    },
  },
  {
    id: 8,
    categoryKey: 'Diskon & Promo',
    icon: BadgePercent,
    question: {
      id: 'Apakah ada diskon untuk pesanan jumlah banyak atau reseller / dropship?',
      en: 'Are there discounts for bulk orders, resellers, or dropshippers?'
    },
    answer: {
      id: 'Pasti ada! Semakin banyak jumlah kaos yang Anda pesan, semakin murah harga per pcs-nya (Tiered Discount). Kami juga membuka peluang kemitraan reseller/brand clothing dengan pengiriman label polos (white-label dropship).',
      en: 'Certainly! The more apparel you order, the lower the price per piece (Tiered Discount). We also welcome reseller and clothing brand partnerships with unbranded white-label shipping.'
    },
    highlights: {
      id: ['Diskon Grosir Bertingkat', 'Program Reseller & B2B', 'White-Label Shipping'],
      en: ['Tiered Wholesale Discount', 'Reseller & B2B Program', 'White-Label Shipping']
    },
  },
];

function FAQItem({ faq, index, isOpen, onToggle, language, isLight }) {
  const IconComp = faq.icon || HelpCircle;
  const isEn = language === 'en';
  const categoryLabel = isEn
    ? (faq.categoryKey === 'Pemesanan' ? 'Ordering' : faq.categoryKey === 'Teknik Sablon' ? 'Techniques' : faq.categoryKey === 'Desain & AI' ? 'Design & AI' : faq.categoryKey === 'Pembayaran' ? 'Payment' : faq.categoryKey === 'Pengiriman' ? 'Shipping' : faq.categoryKey === 'Garansi & QC' ? 'Warranty' : 'Discounts')
    : faq.categoryKey;
  const question = isEn ? faq.question.en : faq.question.id;
  const answer = isEn ? faq.answer.en : faq.answer.id;
  const highlights = isEn ? faq.highlights.en : faq.highlights.id;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden relative ${
        isLight
          ? isOpen
            ? 'bg-white border-primary/40 shadow-sm ring-1 ring-primary/20'
            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          : isOpen
            ? 'bg-[#1a1122] border-primary/40 shadow-md shadow-black/40'
            : 'bg-[#150d1a]/80 hover:bg-[#180f1e] border-white/10 hover:border-white/20'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start sm:items-center justify-between p-4 sm:p-5 text-left cursor-pointer select-none gap-3.5 group"
        aria-expanded={isOpen}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              isLight
                ? isOpen
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-slate-100 text-slate-500 border-slate-200/80 group-hover:text-primary'
                : isOpen
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-white/5 text-zinc-400 border-white/10 group-hover:text-primary'
            }`}
          >
            <IconComp size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isLight
                  ? 'text-primary bg-primary/10 border-primary/20'
                  : 'text-primary bg-primary/15 border-primary/25'
              }`}>
                {categoryLabel}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>•</span>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                FAQ #{String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className={`font-heading text-sm sm:text-base font-bold tracking-normal leading-snug m-0 transition-colors ${
              isLight ? 'text-slate-900 group-hover:text-primary' : 'text-white group-hover:text-primary'
            }`}>
              {question}
            </h3>
          </div>
        </div>

        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5 sm:mt-0 ${
            isOpen
              ? 'rotate-180 bg-primary/10 text-primary'
              : isLight
              ? 'text-slate-400 group-hover:text-primary group-hover:bg-slate-100'
              : 'text-zinc-400 group-hover:text-primary group-hover:bg-white/5'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className={`px-4 pb-5 sm:px-5 sm:pb-5 ml-0 sm:ml-12 border-t pt-4 animate-in fade-in duration-150 ${
          isLight ? 'border-slate-100' : 'border-white/5'
        }`}>
          <p className={`text-xs sm:text-sm leading-relaxed mb-3.5 ${
            isLight ? 'text-slate-600' : 'text-zinc-300'
          }`}>
            {answer}
          </p>

          {highlights && (
            <div className={`flex flex-wrap items-center gap-2 pt-2.5 border-t ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              {highlights.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-white/5 border-white/10 text-zinc-300'
                  }`}
                >
                  <Check size={11} className="text-primary shrink-0" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { t, td, language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFAQ, setOpenFAQ] = useState(1);
  const [faqCategory, setFaqCategory] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');

  const steps = useMemo(() => [
    { num: '01', icon: 'layers', title: t('steps.step1Title', 'Pilih Layanan'), desc: t('steps.step1Desc', 'Tentukan produk (Kaos, Hoodie, Jersey) dan teknik sablon (DTF, Plastisol, Bordir).') },
    { num: '02', icon: 'edit-3', title: t('steps.step2Title', 'Atur Konfigurasi'), desc: t('steps.step2Desc', 'Pilih jenis bahan katun, warna kain, dan tentukan ukuran posisi sablon.') },
    { num: '03', icon: 'zap', title: t('steps.step3Title', 'Desain / AI Generator'), desc: t('steps.step3Desc', 'Unggah desain artwork milik Anda sendiri atau ciptakan langsung bersama asisten AI.') },
    { num: '04', icon: 'shopping-cart', title: t('steps.step4Title', 'Checkout & DP'), desc: t('steps.step4Desc', 'Pilih opsi pembayaran fleksibel: DP 50% atau lunas melalui transfer / QRIS.') },
    { num: '05', icon: 'check-circle', title: t('steps.step5Title', 'Produksi & Kirim'), desc: t('steps.step5Desc', 'Pesanan diproduksi dengan standar kontrol mutu ketat dan dikirim cepat ke alamat Anda.') },
  ], [t]);

  const categories = useMemo(() => [
    { id: 'all', label: t('faq.tabs.all', 'Semua'), count: FAQ_DATA.length },
    { id: 'Pemesanan', label: t('faq.tabs.order', 'Pemesanan'), count: FAQ_DATA.filter(f => f.categoryKey === 'Pemesanan').length },
    { id: 'Teknik Sablon', label: t('faq.tabs.technique', 'Teknik Sablon'), count: FAQ_DATA.filter(f => f.categoryKey === 'Teknik Sablon').length },
    { id: 'Desain & AI', label: t('faq.tabs.designAi', 'Desain & AI'), count: FAQ_DATA.filter(f => f.categoryKey === 'Desain & AI').length },
    { id: 'Pembayaran', label: t('faq.tabs.payment', 'Pembayaran'), count: FAQ_DATA.filter(f => f.categoryKey === 'Pembayaran').length },
    { id: 'Pengiriman', label: t('faq.tabs.shipping', 'Pengiriman'), count: FAQ_DATA.filter(f => f.categoryKey === 'Pengiriman').length },
    { id: 'Garansi & QC', label: t('faq.tabs.warranty', 'Garansi & QC'), count: FAQ_DATA.filter(f => f.categoryKey === 'Garansi & QC').length },
    { id: 'Diskon & Promo', label: t('faq.tabs.discount', 'Diskon & Promo'), count: FAQ_DATA.filter(f => f.categoryKey === 'Diskon & Promo').length },
  ], [t]);

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchCat = faqCategory === 'all' || faq.categoryKey === faqCategory;
      const q = (isEn ? faq.question.en : faq.question.id).toLowerCase();
      const a = (isEn ? faq.answer.en : faq.answer.id).toLowerCase();
      const hl = (isEn ? faq.highlights.en : faq.highlights.id).join(' ').toLowerCase();
      const s = faqSearch.toLowerCase().trim();

      const matchSearch = !s || q.includes(s) || a.includes(s) || hl.includes(s);
      return matchCat && matchSearch;
    });
  }, [faqCategory, faqSearch, isEn]);

  useEffect(() => {
    Promise.all([
      api.get('/services').catch(() => ({ data: { services: [] } })),
      api.get('/portfolios/featured').catch(() => ({ data: { portfolios: [] } })),
      api.get('/testimonials').catch(() => ({ data: { testimonials: [] } })),
    ])
      .then(([svcRes, portRes, testimonialRes]) => {
        setServices(svcRes.data.services || []);
        setPortfolios(portRes.data.portfolios || []);
        setTestimonials(testimonialRes.data.testimonials || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentMarquee = isEn ? marqueeItemsEn : marqueeItemsId;

  return (
    <div className="min-h-screen flex flex-col bg-[#120b16] text-white selection:bg-primary selection:text-white">
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-10 pb-20 px-[5%]">
        {/* Ambient Decorative Neon Glows */}
        <div className="pointer-events-none absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-primary/10 rounded-full blur-[90px]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* KIRI: TEKS & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <ScrollReveal direction="up" delay={100}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-[2px] uppercase shadow-sm">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span>{t('hero.tag', 'Konveksi & Sablon AI Generative')}</span>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={250}>
                {isEn ? (
                  <h1 className="font-heading text-[clamp(44px,7.5vw,96px)] leading-[0.94] tracking-wide sm:tracking-wider text-white m-0">
                    PRINT YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff60a8] to-primary">DREAMS</span><br />
                    RIGHT HERE
                  </h1>
                ) : (
                  <h1 className="font-heading text-[clamp(48px,8vw,100px)] leading-[0.94] tracking-wide sm:tracking-wider text-white m-0">
                    CETAK <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff60a8] to-primary">IMPIANMU</span><br />
                    DI SINI
                  </h1>
                )}
              </ScrollReveal>

              <ScrollReveal direction="blur" delay={400}>
                <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('hero.subtitle', 'Wujudkan kaos custom, hoodie, seragam, dan merchandise berkualitas standar distro. Buat desain dengan asisten AI, lihat 3D mockup, dan pesan dalam hitungan menit.')}
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={550}>
                <div className="flex items-center gap-4 flex-wrap pt-2">
                  <Link to="/pesan" className="btn-gradient-primary text-sm font-bold tracking-wider py-3.5 px-8 shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform">
                    <span>{isEn ? 'Start Order Now' : 'Mulai Pesan Sekarang'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/design-studio" className="btn-glass text-sm font-semibold tracking-wider py-3.5 px-6 hover:border-primary/50 transition-all">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>{t('nav.studio', 'AI Design Studio')}</span>
                  </Link>
                </div>
              </ScrollReveal>

              {/* STATS BADGES */}
              <ScrollReveal direction="up" delay={700}>
                <div className="pt-6 grid grid-cols-3 gap-3 max-w-md">
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center backdrop-blur-md">
                    <p className="font-heading text-2xl sm:text-3xl text-primary leading-none">3.000+</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1">{isEn ? 'Orders Completed' : 'Pesanan Selesai'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center backdrop-blur-md">
                    <p className="font-heading text-2xl sm:text-3xl text-primary leading-none">99%</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1">{isEn ? 'Satisfied & Repeat' : 'Puas & Repeat'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center backdrop-blur-md">
                    <p className="font-heading text-2xl sm:text-3xl text-primary leading-none">{isEn ? '5 YRS' : '5 TH'}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1">{isEn ? 'Experience' : 'Pengalaman'}</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* KANAN: SHOWCASE PRODUK / MOCKUP */}
            <div className="lg:col-span-5 relative">
              <ScrollReveal direction="right" delay={400}>
                <div className="relative mx-auto max-w-[420px] aspect-square rounded-3xl p-3 bg-gradient-to-tr from-white/10 via-white/5 to-primary/20 border border-white/15 shadow-2xl backdrop-blur-xl group">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40">
                    <img
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop"
                      alt={isEn ? 'Dreamcatcher Custom T-Shirt' : 'Kaos Sablon Kustom Dreamcatcher'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>

                  {/* FLOATING BADGE 1 */}
                  <div className="absolute -top-4 -right-4 px-4 py-2.5 rounded-2xl bg-[#1c1322]/90 border border-primary/40 shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-bounce-subtle">
                    <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{isEn ? 'AI Generated' : 'AI Generated'}</p>
                      <p className="text-[9px] text-zinc-400">{isEn ? 'Ready to DTF Print' : 'Siap Cetak DTF'}</p>
                    </div>
                  </div>

                  {/* FLOATING BADGE 2 */}
                  <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-2xl bg-[#1c1322]/90 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{isEn ? 'Print Guarantee' : 'Garansi Sablon'}</p>
                      <p className="text-[9px] text-zinc-400">{isEn ? 'Durable & Non-fading' : 'Tidak Luntur & Kuat'}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== MARQUEE STRIP ==================== */}
      <div className="relative py-4 bg-gradient-to-r from-primary via-[#ff58a0] to-primary overflow-hidden shadow-lg">
        <div className="flex w-[200%] animate-[marquee_25s_linear_infinite] whitespace-nowrap">
          {[...currentMarquee, ...currentMarquee].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 mx-6 text-white font-heading text-xl sm:text-2xl tracking-[2px]">
              <span>{item}</span>
              <span className="text-white/60 text-sm">&#10022;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ==================== LAYANAN KAMI ==================== */}
      <section className="px-[5%] py-24 relative bg-[#150d1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                {isEn ? 'Best Choices' : 'Pilihan Terbaik'}
              </div>
              <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                {isEn ? 'FEATURED SERVICES' : 'LAYANAN UNGGULAN'}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {isEn
                  ? 'Four high-precision garment & printing services tailored to your brand, community, or personal apparel needs.'
                  : 'Empat layanan konveksi & cetak presisi tinggi yang disesuaikan dengan kebutuhan brand, komunitas, maupun pesanan personal Anda.'}
              </p>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => {
                const sName = (service.name || '').toLowerCase();
                const rawUnit = sName.includes('banner') ? 'm²' : sName.includes('stiker') ? 'lbr' : 'pcs';
                const unit = isEn ? (rawUnit === 'm²' ? 'sqm' : rawUnit === 'lbr' ? 'sheet' : 'pcs') : rawUnit;
                const minOrder = service.minimum_order || 1;
                const startingPrice = service.pricing_type === 'tiered'
                  ? formatRupiah(getMinPrice(service))
                  : formatRupiah(service.base_price || service.price_per_unit);

                return (
                  <ScrollReveal key={service.id} direction="up" delay={index * 100}>
                    <div className="group relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(236,74,150,0.15)]">
                      <div>
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-13 h-13 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <ServiceIcon name={service.name} size={26} />
                          </div>
                          <span className="font-mono text-2xl font-bold text-white/10 group-hover:text-primary/30 transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-primary">
                            {service.pricing_type === 'tiered' ? (isEn ? 'Wholesale Price' : 'Harga Grosir') : (isEn ? 'Fixed Price' : 'Harga Tetap')}
                          </span>
                        </div>

                        <h3 className="font-heading text-2xl text-white tracking-wide mb-2.5 group-hover:text-primary transition-colors">
                          {td(service.name)}
                        </h3>
                        <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed line-clamp-3 mb-5">
                          {td(service.description)}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{isEn ? 'Starts From' : 'Harga Mulai'}</span>
                          <span className="text-[11px] font-medium text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                            Min. {minOrder} {unit}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-primary font-bold text-2xl font-mono">
                            {startingPrice}
                          </span>
                          <span className="text-zinc-400 text-xs font-medium">/ {unit}</span>
                        </div>

                        <Link
                          to={`/pesan?service=${service.id}`}
                          className="block w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-primary border border-white/15 hover:border-primary transition-all duration-200 no-underline shadow-md hover:shadow-primary/25"
                        >
                          {isEn ? 'Order Now' : 'Pesan Sekarang'}
                        </Link>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==================== CARA PEMESANAN ==================== */}
      <section className="px-[5%] py-24 relative bg-[#120b16] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                {t('steps.badge', 'Praktis & Cepat')}
              </div>
              <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                {t('steps.title', 'CARA PEMESANAN')}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {t('steps.subtitle', '5 langkah mudah dari ide desain hingga produk sablon jadi tiba di depan pintu rumah Anda.')}
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} direction="up" delay={i * 100}>
                <div className="relative h-full p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    {/* STEP NUMBER & ICON */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-heading text-4xl text-primary/30 group-hover:text-primary transition-colors">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Icon name={step.icon} size={20} />
                      </div>
                    </div>

                    <h3 className="font-heading text-xl text-white tracking-wide mb-2 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-widest">
                    <span>{isEn ? 'Step' : 'Tahap'} {i + 1}</span>
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SPOTLIGHT: AI DESIGN STUDIO ==================== */}
      <section className="px-[5%] py-20 relative bg-gradient-to-b from-[#150d1a] to-[#120b16]">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-purple-900/30 via-[#2a142b]/60 to-primary/20 border border-primary/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 bg-primary/25 rounded-full blur-[100px]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {t('aiSpotlight.badge', 'Fitur Unggulan Eksklusif')}
                </div>
                <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                  {t('aiSpotlight.title', 'DESAIN SABLON OTOMATIS DENGAN AI')}
                </h2>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {t('aiSpotlight.desc', 'Belum punya file desain? Tidak masalah! Chat dengan AI Designer kami, masukkan konsep ide kaos Anda, dan AI akan membuatkan artwork siap sablon resolusi tinggi, lengkap dengan simulasi 3D Mockup dan AR Try-On di tubuh Anda.')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-xs text-white font-medium">{t('aiSpotlight.feat1', 'Generate Artwork Seketika')}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-xs text-white font-medium">{t('aiSpotlight.feat2', '3D Real-Time Mockup')}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
                    <Camera className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-xs text-white font-medium">{t('aiSpotlight.feat3', 'AR Virtual Camera')}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <Link
                  to="/design-studio"
                  className="btn-gradient-primary py-4 px-8 text-sm font-bold tracking-wider hover:scale-105 transition-transform"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{t('aiSpotlight.cta', 'Buka AI Studio Gratis')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PORTFOLIO SHOWCASE ==================== */}
      <section id="portfolio" className="px-[5%] py-24 relative bg-[#120b16]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                {t('portfolio.badge', 'Karya Terbaik')}
              </div>
              <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                {t('portfolio.title', 'HASIL PORTFOLIO')}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {t('portfolio.subtitle', 'Bukti kualitas nyata sablon DTF, plastisol, dan bordir yang telah dipercaya oleh berbagai komunitas dan brand.')}
              </p>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
          ) : (
            <div className="rounded-3xl p-4 sm:p-6 bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-md">
              <PortfolioCarousel portfolios={portfolios} />
            </div>
          )}
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="px-[5%] py-24 relative bg-[#150d1a] overflow-hidden">
        {/* Ambient background glows */}
        <div className="ambient-glow bg-primary/10 w-96 h-96 -top-24 -left-24 pointer-events-none" />
        <div className="ambient-glow bg-purple-600/10 w-96 h-96 -bottom-24 -right-24 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t('testimonials.badge', 'Kepuasan Pelanggan')}
              </div>
              <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                {t('testimonials.title', 'KATA MEREKA')}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {t('testimonials.subtitle', 'Ulasan jujur dari pelanggan setia Dreamcatcher tentang kualitas sablon presisi, bahan premium, dan ketepatan waktu kami.')}
              </p>

              {/* Social Proof Metric Pill */}
              <div className="inline-flex items-center gap-3 mt-5 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <div className="flex text-amber-400 text-xs">
                  {'★★★★★'}
                </div>
                <span className="text-white text-xs font-bold font-heading">4.9 / 5.0</span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-zinc-300 text-xs font-medium">{t('testimonials.verifiedReviews', '500+ Ulasan Terverifikasi')}</span>
              </div>
            </ScrollReveal>
          </div>

          <div className="rounded-3xl p-3 sm:p-6 bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-2xl">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </div>
      </section>

      {/* ==================== FAQ ACCORDION ==================== */}
      <section id="faq" className={`px-[5%] py-20 relative transition-colors duration-300 ${
        isLight ? 'bg-slate-50 border-t border-slate-200/70 text-slate-900' : 'bg-[#120b16] border-t border-white/5 text-white'
      }`}>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-9">
            <ScrollReveal>
              <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2.5 border ${
                isLight ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary/15 text-primary border-primary/25'
              }`}>
                <HelpCircle size={13} className="text-primary" />
                <span>{t('faq.badge', 'Pusat Bantuan & Pertanyaan')}</span>
              </div>
              <h2 className={`font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wide sm:tracking-wider mb-3 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span>
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed max-w-lg mx-auto ${
                isLight ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                {t('faq.subtitle', 'Jawaban lengkap, jelas, dan transparan seputar proses sablon, batas minimal order, generator AI, garansi retur, hingga pengiriman.')}
              </p>
            </ScrollReveal>

            {/* Quick Search Input */}
            <ScrollReveal direction="up" delay={100}>
              <div className="mt-6 max-w-md mx-auto relative">
                <div className="relative flex items-center">
                  <Search className={`absolute left-3.5 w-4 h-4 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder={t('faq.searchPlaceholder', 'Cari pertanyaan sablon, DP, minimal order, AI...')}
                    className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-primary transition-all ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-sm focus:ring-2 focus:ring-primary/10'
                        : 'bg-white/[0.04] border-white/10 text-white placeholder-zinc-500 focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {faqSearch && (
                    <button
                      type="button"
                      onClick={() => setFaqSearch('')}
                      className={`absolute right-2.5 p-1 rounded-lg transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isEn ? 'Clear search' : 'Hapus pencarian'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Category Filter Chips */}
            <ScrollReveal direction="up" delay={150}>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
                {categories.map((tab) => {
                  const isActive = faqCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFaqCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isActive
                          ? isLight
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                          : isLight
                            ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            : 'bg-white/[0.03] text-zinc-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : isLight
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-white/10 text-zinc-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>

          {/* FAQ Accordion Grid or Empty State */}
          {filteredFAQs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-5xl mx-auto items-start">
              {filteredFAQs.map((faq, index) => (
                <ScrollReveal key={faq.id} direction="up" delay={index * 30}>
                  <FAQItem
                    faq={faq}
                    index={index}
                    isOpen={openFAQ === faq.id}
                    onToggle={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                    language={language}
                    isLight={isLight}
                  />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className={`max-w-md mx-auto text-center py-10 px-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.02] border-white/10'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2.5 ${
                isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-zinc-400'
              }`}>
                <Search size={20} />
              </div>
              <p className={`font-heading text-base font-bold mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {t('faq.emptyTitle', 'Pertanyaan Tidak Ditemukan')}
              </p>
              <p className={`text-xs mb-3.5 ${
                isLight ? 'text-slate-500' : 'text-zinc-400'
              }`}>
                {t('faq.emptyDesc', 'Tidak ada FAQ yang cocok dengan kata kunci')} &quot;{faqSearch}&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFaqSearch('');
                  setFaqCategory('all');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:brightness-110 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {t('faq.resetBtn', 'Reset Filter Pencarian')}
              </button>
            </div>
          )}

          {/* Need More Help Consultation Prompt */}
          <ScrollReveal direction="up" delay={200}>
            <div className={`mt-12 max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-white/[0.025] border-white/10'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                }`}>
                  <Headphones size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-0.5">
                    <p className={`text-xs sm:text-sm font-bold leading-tight m-0 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {t('faq.helpTitle', 'Butuh Bantuan atau Custom Order Khusus?')}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('faq.helpLive', 'Live CS')}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 m-0 ${
                    isLight ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    {t('faq.helpDesc', 'Konsultasikan detail bahan, sampel ukuran, atau penawaran harga khusus bersama CS kami 24/7.')}
                  </p>
                </div>
              </div>

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all no-underline shrink-0 active:scale-95"
              >
                <MessageCircle size={15} />
                <span>{t('faq.chatBtn', 'Chat Customer Support')}</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ==================== FINAL BOTTOM CTA ==================== */}
      <section className="px-[5%] py-20 relative bg-gradient-to-b from-[#150d1a] to-[#0c070f] text-center">
        <div className="max-w-4xl mx-auto relative rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-primary/20 via-purple-900/20 to-primary/20 border border-primary/40 shadow-2xl backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-primary/5 rounded-3xl" />
          <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide mb-4">
            {t('cta.title', 'SIAP MEMBUAT KAOS IMPIAN ANDA?')}
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {t('cta.subtitle', 'Dapatkan hasil cetak presisi, bahan katun adem, dan pelayanan cepat bersama Dreamcatcher Studio.')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/pesan"
              className="btn-gradient-primary py-4 px-9 text-sm font-bold tracking-wider hover:scale-105 active:scale-95 transition-transform"
            >
              <span>{t('cta.orderBtn', 'Mulai Buat Pesanan')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/6287877294587"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass py-4 px-7 text-sm font-semibold tracking-wider hover:border-primary/50 transition-all"
            >
              {t('cta.waBtn', 'Konsultasi WhatsApp')}
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

