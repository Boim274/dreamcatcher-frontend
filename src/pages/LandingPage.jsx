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
  Check,
  Headphones,
  MapPin,
  Shirt,
  Clock,
  Award
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/ui/Icon';
import OptimizedImage from '../components/ui/OptimizedImage';
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
  'KONVEKSI & CUSTOM APPAREL', 'SABLON DTF HIGH DEFINITION', 'PLASTISOL PEKAT & AWET', 'BORDIR KOMPUTER', 'AI DESIGN ASSISTANT', '3D MOCKUP PREVIEW', 'STANDAR KUALITAS TERUJI'
];

const marqueeItemsEn = [
  'CUSTOM APPAREL & GARMENT', 'HIGH DEFINITION DTF', 'DURABLE PLASTISOL', 'COMPUTER EMBROIDERY', 'AI DESIGN ASSISTANT', '3D MOCKUP PREVIEW', 'TESTED QUALITY STANDARDS'
];

const FAQ_DATA = [
  {
    id: 1,
    categoryKey: 'Layanan Cikarang',
    icon: MapPin,
    question: {
      id: 'Apakah Dreamcatcher melayani jasa sablon di Cikarang?',
      en: 'Does Dreamcatcher provide screen printing services in Cikarang?'
    },
    answer: {
      id: 'Ya, Dreamcatcher melayani jasa sablon kaos dan konveksi untuk area Cikarang dan sekitarnya (Cikarang Selatan, Cikarang Utara, Cikarang Barat, Cikarang Timur, Cikarang Pusat, Lippo Cikarang, hingga kawasan industri Jababeka, EJIP, dan MM2100). Anda dapat berkonsultasi via WhatsApp atau memesan secara online langsung melalui website kami.',
      en: 'Yes, Dreamcatcher provides custom t-shirt printing and garment services throughout Cikarang and surrounding areas (South, North, West, East, Central Cikarang, Lippo Cikarang, to Jababeka, EJIP, and MM2100 industrial zones). You can consult with us via WhatsApp or order directly online through our website.'
    },
    highlights: {
      id: ['Area Seluruh Cikarang', 'Kawasan Industri & Distrik', 'Pemesanan Online & Konsultasi'],
      en: ['All Cikarang Areas', 'Industrial Zones & Districts', 'Online Ordering & Chat']
    },
  },
  {
    id: 2,
    categoryKey: 'Harga & Biaya',
    icon: CreditCard,
    question: {
      id: 'Berapa harga sablon kaos di Cikarang?',
      en: 'How much does custom t-shirt printing cost in Cikarang?'
    },
    answer: {
      id: 'Harga sablon kaos di Dreamcatcher sangat terjangkau dan transparan, mulai dari Rp 35.000 untuk jasa cetak sablon, atau mulai Rp 60.000 - Rp 75.000 untuk paket komplit kaos katun Combed 30s/24s plus sablon distro berkualitas. Untuk pesanan kuantitas banyak (lusinan hingga ratusan pcs), kami memberikan harga grosir bertingkat (tiered discount) yang jauh lebih hemat.',
      en: 'T-shirt printing prices at Dreamcatcher are very competitive and transparent, starting from IDR 35,000 for print-only, or IDR 60,000 - 75,000 for complete packages including premium Cotton Combed 30s/24s t-shirt and distro-grade prints. Bulk orders enjoy tiered wholesale discounts.'
    },
    highlights: {
      id: ['Mulai Rp 35.000', 'Paket Komplit Kaos + Sablon', 'Harga Grosir Bertingkat'],
      en: ['Starts at IDR 35k', 'Complete T-Shirt + Print Packages', 'Tiered Bulk Discounts']
    },
  },
  {
    id: 3,
    categoryKey: 'Pemesanan',
    icon: Package,
    question: {
      id: 'Apakah bisa pesan sablon kaos satuan di Cikarang?',
      en: 'Can I order a single piece (1 pcs) custom printed t-shirt in Cikarang?'
    },
    answer: {
      id: 'Tentu bisa! Kami melayani pemesanan sablon kaos satuan (tanpa minimum order) menggunakan teknologi modern DTF (Direct to Film) High Definition. Anda bebas mencetak foto, desain warna-warni, tulisan custom, atau logo komunitas meskipun hanya memesan 1 pcs.',
      en: 'Absolutely! We accept single-piece custom orders (no minimum quantity) using modern DTF (Direct to Film) High Definition technology. You can freely print full-color graphics, photos, or custom typography on a single shirt.'
    },
    highlights: {
      id: ['Bisa Satuan (1 Pcs)', 'Tanpa Minimum Order', 'Sablon DTF Full Color'],
      en: ['Single Piece (1 Pcs)', 'No Minimum Order', 'Full Color DTF Print']
    },
  },
  {
    id: 4,
    categoryKey: 'Teknik Sablon',
    icon: Layers,
    question: {
      id: 'Apakah tersedia sablon DTF di Cikarang?',
      en: 'Is DTF (Direct to Film) printing available in Cikarang?'
    },
    answer: {
      id: 'Ya, sablon DTF merupakan salah satu spesialisasi utama kami di Cikarang. Kami menggunakan mesin cetak DTF beresolusi tinggi dengan tinta pigmen original dan bubuk lem hotmelt elastis, menghasilkan cetakan gambar yang tajam, lentur tidak kaku, warna hidup, dan awet dicuci.',
      en: 'Yes, DTF printing is one of our primary specialties in Cikarang. We utilize high-resolution DTF printers with genuine pigment inks and premium elastic hotmelt adhesive powder for sharp, vivid, flexible, and wash-resistant prints.'
    },
    highlights: {
      id: ['Mesin DTF High-Res', 'Warna Tajam & Presisi', 'Lentur & Tahan Cuci'],
      en: ['High-Res DTF Printers', 'Vivid Sharp Colors', 'Flexible & Washable']
    },
  },
  {
    id: 5,
    categoryKey: 'Teknik Sablon',
    icon: Layers,
    question: {
      id: 'Apakah tersedia sablon Plastisol di Cikarang?',
      en: 'Is Plastisol screen printing available in Cikarang?'
    },
    answer: {
      id: 'Ya, kami menyediakan sablon Plastisol manual standar distro original. Sablon Plastisol terkenal dengan daya rekatnya yang sangat kuat pada kain katun, menghasilkan warna tebal bertekstur karet lembut, tidak mudah retak, dan merupakan standar favorit brand clothing distro.',
      en: 'Yes, we provide authentic distro-standard manual Plastisol screen printing. Plastisol is renowned for its durability on cotton fabric, producing vibrant, soft rubberized textures that resist cracking.'
    },
    highlights: {
      id: ['Standar Distro Original', 'Tinta Karet Tahan Retak', 'Warna Pekat & Solid'],
      en: ['Distro Brand Standard', 'Crack-Resistant Rubber Ink', 'Deep Solid Colors']
    },
  },
  {
    id: 6,
    categoryKey: 'Konveksi',
    icon: Shirt,
    question: {
      id: 'Apakah Dreamcatcher menerima pesanan konveksi kaos?',
      en: 'Does Dreamcatcher accept custom garment and apparel sewing orders?'
    },
    answer: {
      id: 'Ya, kami adalah workshop konveksi dan sablon terintegrasi. Kami melayani jahit dan produksi massal untuk kaos oblong (round neck), kaos V-neck, polo shirt (wangki), hoodie sweater, seragam kemeja kerja, hingga jersey olahraga dengan pola presisi dan jahitan rapi kuat.',
      en: 'Yes, we operate an integrated garment sewing and screen printing workshop. We produce custom crew-neck tees, polo shirts, hoodies, work shirts, and sportswear jerseys with precise tailoring and durable stitching.'
    },
    highlights: {
      id: ['Kaos, Polo, Hoodie, Jersey', 'Jahit Rapi Standar Ekspor', 'Kapasitas Ribuan Pcs'],
      en: ['Tees, Polos, Hoodies, Jerseys', 'Export-Grade Sewing', 'Bulk Capacity']
    },
  },
  {
    id: 7,
    categoryKey: 'Desain & Konsultasi',
    icon: Sparkles,
    question: {
      id: 'Apakah bisa membuat kaos custom sesuai desain sendiri?',
      en: 'Can I print custom t-shirts with my own design?'
    },
    answer: {
      id: 'Sangat bisa! Anda dapat mengunggah file artwork milik Anda (PNG transparan 300 DPI, Vector PDF, AI, CDR, atau PSD). Jika Anda belum memiliki file siap cetak, Anda bisa membuat desain otomatis dengan AI Design Studio kami atau berkonsultasi dengan tim kami untuk bantuan perapihan mockup.',
      en: 'Definitely! You can upload your own artwork files (transparent 300 DPI PNG, vector PDF, AI, CDR, or PSD). If you do not have print-ready artwork yet, use our AI Design Studio or get support from our design team.'
    },
    highlights: {
      id: ['Bebas Desain Sendiri', 'Terima Format Vektor & PNG', 'Bantuan AI Studio Gratis'],
      en: ['Custom Artwork Supported', 'Vector & PNG Accepted', 'Free AI Studio Tools']
    },
  },
  {
    id: 8,
    categoryKey: 'Konveksi',
    icon: Package,
    question: {
      id: 'Apakah bisa pesan kaos untuk komunitas, event, atau perusahaan?',
      en: 'Can I order shirts for communities, events, or corporate uniforms?'
    },
    answer: {
      id: 'Tentu saja! Kami sering memproduksi kaos untuk komunitas motor/hobi, seragam kepanitiaan event kampus/sekolah, gathering keluarga, hingga seragam operasional perusahaan manufaktur dan perkantoran di kawasan industri Cikarang dengan kapasitas ratusan hingga ribuan potong.',
      en: 'Certainly! We regularly produce apparel for community clubs, event organizing committees, family gatherings, and corporate uniforms for manufacturing plants and offices across Cikarang industrial estates.'
    },
    highlights: {
      id: ['Komunitas & Gathering', 'Seragam Event & Kantor', 'Pesanan Ratusan/Ribuan Pcs'],
      en: ['Community & Gatherings', 'Event & Corporate Staff', 'Hundreds/Thousands Capacity']
    },
  },
  {
    id: 9,
    categoryKey: 'Pemesanan',
    icon: Zap,
    question: {
      id: 'Apakah bisa melakukan pemesanan sablon secara online?',
      en: 'Can I place screen printing orders completely online?'
    },
    answer: {
      id: 'Bisa! Seluruh proses pemesanan dapat dilakukan 100% online melalui website Dreamcatcher: pilih produk & bahan kaos, tentukan posisi sablon, upload desain atau buat dengan AI, cek simulasi 3D mockup, dan bayar dengan DP 50% atau lunas via Transfer Bank / QRIS otomatis.',
      en: 'Yes! The entire process can be conducted 100% online through the Dreamcatcher platform: choose apparel & fabrics, select print positions, upload artwork or generate via AI, preview 3D mockup, and pay via Bank Transfer or QRIS.'
    },
    highlights: {
      id: ['Pemesanan 100% Online', 'Simulasi 3D Mockup', 'Opsi DP 50% & QRIS'],
      en: ['100% Online Ordering', 'Interactive 3D Mockup', '50% Deposit & QRIS']
    },
  },
  {
    id: 10,
    categoryKey: 'Pemesanan',
    icon: Package,
    question: {
      id: 'Berapa minimal pemesanan sablon kaos?',
      en: 'What is the minimum order quantity (MOQ) for screen printing?'
    },
    answer: {
      id: 'Untuk sablon DTF (Direct to Film), tidak ada batasan minimal order (bisa pesan mulai 1 pcs). Untuk sablon Plastisol manual atau bordir komputer yang memerlukan pembuatan film afdruk/matras khusus, minimal order mulai dari 6 sampai 12 pcs (1 lusin).',
      en: 'For DTF printing, there is no minimum order (you can order from 1 single piece). For manual Plastisol screen printing or computer embroidery requiring custom screens or molds, the minimum order is 6 to 12 pieces (1 dozen).'
    },
    highlights: {
      id: ['DTF: Mulai 1 Pcs', 'Plastisol: Mulai 6-12 Pcs', 'Bordir: Mulai 6 Pcs'],
      en: ['DTF: From 1 Pcs', 'Plastisol: From 6-12 Pcs', 'Embroidery: From 6 Pcs']
    },
  },
  {
    id: 11,
    categoryKey: 'Desain & Konsultasi',
    icon: MessageCircle,
    question: {
      id: 'Apakah bisa konsultasi desain sebelum memesan?',
      en: 'Can I consult about design and materials before ordering?'
    },
    answer: {
      id: 'Bisa dan gratis! Anda dapat berkonsultasi langsung melalui WhatsApp Customer Service kami mengenai kecocokan desain, ketajaman resolusi gambar, pemilihan jenis sablon yang pas, rekomendasi ketebalan kain (Combed 24s vs 30s), hingga penghitungan estimasi biaya sesuai budget.',
      en: 'Yes, completely free! You can consult directly via our WhatsApp Customer Service regarding artwork resolution, suitable printing methods, fabric weight recommendations (Combed 24s vs 30s), and budget calculations.'
    },
    highlights: {
      id: ['Konsultasi Desain Gratis', 'Rekomendasi Bahan Kaos', 'Bantuan CS Responsif'],
      en: ['Free Design Consultation', 'Fabric Recommendations', 'Responsive CS Help']
    },
  },
  {
    id: 12,
    categoryKey: 'Harga & Pengiriman',
    icon: Truck,
    question: {
      id: 'Apakah melayani pengiriman ke wilayah sekitar Cikarang?',
      en: 'Do you deliver to areas surrounding Cikarang?'
    },
    answer: {
      id: 'Ya! Kami melayani pengiriman ke seluruh kawasan Cikarang (Pusat, Selatan, Utara, Barat, Timur), Lippo Cikarang, Cibarusah, Tambun, Cibitung, Karawang, Bekasi, serta seluruh kota di Indonesia melalui ekspedisi kurir kilat/sameday, reguler (JNE, J&T, SiCepat), hingga kargo hemat (Indah Cargo, Dakota) untuk pesanan kuantitas besar.',
      en: 'Yes! We deliver across all Cikarang areas (Central, South, North, West, East), Lippo Cikarang, Cibarusah, Tambun, Cibitung, Karawang, Greater Jakarta, and nationwide via instant couriers, standard parcel (JNE, J&T, SiCepat), and bulk cargo shipping.'
    },
    highlights: {
      id: ['Kirim Area Cikarang & Bekasi', 'Kurir Cepat & Sameday', 'Kargo Murah Partai Besar'],
      en: ['Cikarang & Bekasi Coverage', 'Express & Same-day Delivery', 'Affordable Bulk Cargo']
    },
  },
  {
    id: 13,
    categoryKey: 'Pemesanan',
    icon: Clock,
    question: {
      id: 'Berapa lama proses produksi sablon dan konveksi?',
      en: 'How long does production turnaround take?'
    },
    answer: {
      id: 'Proses produksi standar untuk sablon kaos berkisar antara 2 hingga 5 hari kerja setelah pembayaran terkonfirmasi dan desain final disetujui (approval). Untuk pesanan konveksi partai besar ratusan hingga ribuan pcs, estimasi pengerjaan adalah 7-14 hari kerja tergantung antrean dan detail jahitan.',
      en: 'Standard production turnaround for printed t-shirts is 2 to 5 business days after payment confirmation and final artwork approval. Bulk orders of hundreds or thousands of pieces typically take 7 to 14 business days.'
    },
    highlights: {
      id: ['Standar: 2-5 Hari Kerja', 'Partai Besar: 7-14 Hari', 'Tepat Waktu Sesuai Deadline'],
      en: ['Standard: 2-5 Business Days', 'Bulk Orders: 7-14 Days', 'Strict Deadline Punctuality']
    },
  },
  {
    id: 14,
    categoryKey: 'Teknik Sablon',
    icon: Layers,
    question: {
      id: 'Apa perbedaan sablon DTF dan Plastisol?',
      en: 'What is the difference between DTF and Plastisol screen printing?'
    },
    answer: {
      id: 'Sablon DTF mencetak tinta digital berbasis film, sangat fleksibel untuk desain bergradasi rumit atau foto tanpa batasan warna dan bisa satuan tanpa biaya film. Sedangkan sablon Plastisol menggunakan tinta pasta karet manual yang dipress panas (curing), menghasilkan cetakan sablon standar distro yang legendaris, tebal, awet, dan sangat tahan cuci.',
      en: 'DTF prints digital ink onto film, ideal for complex color gradients or photographic graphics without color limits and with zero minimum order. Plastisol uses manual rubberized ink cured under heat, yielding the legendary streetwear distro texture that is exceptionally durable.'
    },
    highlights: {
      id: ['DTF: Full Color & Bisa Satuan', 'Plastisol: Standar Distro & Sangat Awet', 'Hasil Lembut & Tahan Cuci'],
      en: ['DTF: Full Color & Single Pcs', 'Plastisol: Streetwear Legend', 'Soft & Wash Resistant']
    },
  },
  {
    id: 15,
    categoryKey: 'Konveksi',
    icon: Award,
    question: {
      id: 'Apakah bisa membuat kaos custom untuk brand clothing?',
      en: 'Can you produce custom apparel for clothing brands / distros?'
    },
    answer: {
      id: 'Sangat bisa! Kami mendukung banyak brand clothing lokal dan distro dengan layanan konveksi private label: bahan kain Cotton Combed reaktif grade premium (24s, 30s, atau oversized heavyweight), sablon Plastisol / discharge presisi, sablon label leher (neck label), hangtag, hingga packaging plastik klip rapi siap display.',
      en: 'Definitely! We support numerous independent clothing labels with private-label apparel manufacturing: premium reactive Cotton Combed fabrics (24s, 30s, or heavyweight oversized), sharp Plastisol prints, custom neck labels, hangtags, and retail-ready packaging.'
    },
    highlights: {
      id: ['Private Label Distro', 'Custom Neck Label & Hangtag', 'Bahan Combed Reaktif & Oversize'],
      en: ['Private Label Manufacturing', 'Custom Neck Labels & Tags', 'Reactive & Oversized Cotton']
    },
  },
  {
    id: 16,
    categoryKey: 'Konveksi',
    icon: Shirt,
    question: {
      id: 'Apa saja produk apparel dan merchandise yang tersedia di Dreamcatcher?',
      en: 'What apparel and merchandise products are available at Dreamcatcher?'
    },
    answer: {
      id: 'Untuk produk katalog toko, kami menyediakan Kaos Polos Katun Combed 24s/30s Premium serta merchandise kustom seperti Totebag Canvas, Topi Baseball, dan Mug Custom. Untuk layanan konveksi pesanan kustom partai, kami juga melayani produksi seragam kerja, polo shirt, dan kaos komunitas sesuai kebutuhan spesifikasi Anda.',
      en: 'In our standard store catalog, we offer Premium 24s/30s Cotton Combed T-Shirts alongside custom merchandise like Canvas Totebags, Baseball Caps, and Custom Mugs. For bulk custom orders, our garment workshop also manufactures corporate uniforms, polos, and community apparel tailored to your specifications.'
    },
    highlights: {
      id: ['Kaos Polos Combed Premium', 'Totebag, Topi & Mug Custom', 'Konveksi Seragam & Komunitas'],
      en: ['Premium Combed T-Shirts', 'Custom Totebags, Caps & Mugs', 'Corporate & Community Garments']
    },
  },
  {
    id: 17,
    categoryKey: 'Desain & Konsultasi',
    icon: Sparkles,
    question: {
      id: 'Bagaimana AI Designer dan 3D Mockup membantu proses pemesanan?',
      en: 'How do the AI Designer and 3D Mockup tools assist the ordering process?'
    },
    answer: {
      id: 'AI Designer membantu Anda yang belum memiliki file desain jadi untuk mengeksplorasi ide dan membuat konsep visual beresolusi tinggi hanya dari ketikan teks. Anda kemudian dapat melihat letak, ukuran, dan visualisasi pakaian secara 3D interaktif sebelum pesanan diproduksi, sehingga hasil akhir lebih terukur dan sesuai ekspektasi.',
      en: 'The AI Designer helps customers without ready-made graphic files brainstorm and generate high-resolution visual concepts from simple text prompts. You can then preview placement, sizing, and interactive 3D simulations on the garment before production begins, ensuring accurate results.'
    },
    highlights: {
      id: ['Eksplorasi Ide dari Teks', 'Simulasi 3D Realistis', 'Hasil Terukur Sebelum Produksi'],
      en: ['Text-to-Design Concept', 'Realistic 3D Simulation', 'Predictable Output Pre-Production']
    },
  },
];

function FAQItem({ faq, index, isOpen, onToggle, language, isLight }) {
  const IconComp = faq.icon || HelpCircle;
  const isEn = language === 'en';
  const categoryLabel = isEn
    ? (faq.categoryKey === 'Layanan Cikarang' ? 'Cikarang Service'
      : faq.categoryKey === 'Pemesanan' ? 'Ordering'
      : faq.categoryKey === 'Teknik Sablon' ? 'Techniques'
      : faq.categoryKey === 'Konveksi' ? 'Garment & Bulk'
      : faq.categoryKey === 'Desain & Konsultasi' ? 'Design & AI'
      : faq.categoryKey === 'Harga & Biaya' ? 'Pricing'
      : faq.categoryKey === 'Harga & Pengiriman' ? 'Shipping'
      : faq.categoryKey)
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
            <h3 className={`font-heading text-sm sm:text-base font-bold tracking-[1.8px] [word-spacing:3px] leading-snug m-0 transition-colors ${
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
    { num: '01', icon: 'shirt', title: t('steps.step1Title', 'Pilih Apparel & Layanan'), desc: t('steps.step1Desc', 'Pilih produk apparel (seperti Kaos Premium) atau tentukan metode produksi sablon dan bordir.') },
    { num: '02', icon: 'edit-3', title: t('steps.step2Title', 'Siapkan Desain'), desc: t('steps.step2Desc', 'Gunakan artwork desain milik Anda sendiri atau buat konsep visual baru bersama asisten AI.') },
    { num: '03', icon: 'zap', title: t('steps.step3Title', 'Simulasi Mockup 3D'), desc: t('steps.step3Desc', 'Atur posisi cetak dan lihat preview realistis pakaian secara 3D atau AR sebelum masuk produksi.') },
    { num: '04', icon: 'layers', title: t('steps.step4Title', 'Tentukan Spesifikasi'), desc: t('steps.step4Desc', 'Pilih detail ukuran, warna kain, varian bahan, dan jumlah pesanan dengan kalkulasi biaya transparan.') },
    { num: '05', icon: 'check-circle', title: t('steps.step5Title', 'Pemesanan & Produksi'), desc: t('steps.step5Desc', 'Konfirmasi pesanan dengan opsi pembayaran fleksibel (DP 50% / Lunas), diproduksi rapi dan dikirim aman.') },
  ], [t]);

  const categories = useMemo(() => [
    { id: 'all', label: t('faq.tabs.all', 'Semua'), count: FAQ_DATA.length },
    { id: 'Layanan Cikarang', label: isEn ? 'Cikarang' : 'Layanan Cikarang', count: FAQ_DATA.filter(f => f.categoryKey === 'Layanan Cikarang').length },
    { id: 'Pemesanan', label: t('faq.tabs.order', 'Pemesanan'), count: FAQ_DATA.filter(f => f.categoryKey === 'Pemesanan').length },
    { id: 'Teknik Sablon', label: t('faq.tabs.technique', 'Teknik Sablon'), count: FAQ_DATA.filter(f => f.categoryKey === 'Teknik Sablon').length },
    { id: 'Konveksi', label: isEn ? 'Garment' : 'Konveksi Kaos', count: FAQ_DATA.filter(f => f.categoryKey === 'Konveksi').length },
    { id: 'Desain & Konsultasi', label: isEn ? 'Design' : 'Desain & AI', count: FAQ_DATA.filter(f => f.categoryKey === 'Desain & Konsultasi').length },
    { id: 'Harga & Biaya', label: isEn ? 'Pricing' : 'Harga', count: FAQ_DATA.filter(f => f.categoryKey === 'Harga & Biaya').length },
    { id: 'Harga & Pengiriman', label: isEn ? 'Shipping' : 'Pengiriman', count: FAQ_DATA.filter(f => f.categoryKey === 'Harga & Pengiriman').length },
  ], [t, isEn]);

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
                  <span>{t('hero.tag', 'Platform Konveksi & Custom Apparel Modern')}</span>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={250}>
                {isEn ? (
                  <h1 className="font-heading text-[clamp(38px,6.8vw,90px)] leading-[0.96] tracking-wide sm:tracking-wider text-white m-0">
                    CUSTOM APPAREL <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff60a8] to-primary">&amp; GARMENT</span><br />
                    BRING YOUR DESIGNS TO LIFE
                  </h1>
                ) : (
                  <h1 className="font-heading text-[clamp(38px,6.8vw,90px)] leading-[0.96] tracking-wide sm:tracking-wider text-white m-0">
                    KONVEKSI &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff60a8] to-primary">CUSTOM APPAREL</span><br />
                    UNTUK WUJUDKAN DESAINMU
                  </h1>
                )}
              </ScrollReveal>

              <ScrollReveal direction="blur" delay={400}>
                <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-xl">
                  {t('hero.subtitle', 'Pesan kaos dan produk apparel kustom dengan proses desain interaktif, visualisasi mockup 3D, serta pengerjaan produksi terstandarisasi dalam satu platform.')}
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={550}>
                <div className="flex items-center gap-4 flex-wrap pt-2">
                  <Link to="/pesan" className="btn-gradient-primary text-sm font-bold tracking-wider py-3.5 px-8 shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform">
                    <span>{isEn ? 'Start Custom Apparel' : 'Mulai Custom Apparel'}</span>
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
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
                      variant="medium"
                      width={800}
                      height={800}
                      loading="eager"
                      fetchPriority="high"
                      alt={isEn ? 'Cikarang Custom T-Shirt Screen Printing - Dreamcatcher Workshop' : 'Tempat Sablon Cikarang Dreamcatcher - Kaos Custom DTF dan Plastisol Berkualitas'}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
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
                {isEn ? 'Services & Production' : 'Layanan & Produksi'}
              </div>
              <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                {isEn ? 'CUSTOM APPAREL & PRODUCTION SERVICES' : 'LAYANAN KONVEKSI & PRODUKSI APPAREL CIKARANG'}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {isEn
                  ? 'Four precision apparel production and printing services in Cikarang area tailored for corporate uniforms, community merchandise, clothing brands, and custom orders.'
                  : 'Layanan konveksi apparel dan cetak sablon presisi di area Cikarang untuk kebutuhan seragam kerja, merchandise komunitas, brand apparel, hingga pesanan kustom satuan.'}
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
                {t('steps.badge', 'Praktis & Terstruktur')}
              </div>
              <h2 className="font-heading text-4xl sm:text-6xl text-white tracking-wide leading-tight">
                {t('steps.title', 'CARA PEMESANAN')}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {t('steps.subtitle', 'Alur praktis dari pemilihan apparel, eksplorasi konsep desain, simulasi mockup, hingga pakaian siap diproduksi.')}
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

      {/* ==================== LOCAL SEO: TEMPAT SABLON CIKARANG ==================== */}
      <section id="tempat-sablon-cikarang" className="px-[5%] py-24 relative bg-[#160e1d] border-t border-white/5 overflow-hidden">
        {/* Ambient glowing backdrop */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-primary/15 rounded-full blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-[130px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                <MapPin size={13} className="text-primary" />
                <span>{isEn ? 'Cikarang Custom Apparel & Screen Printing' : 'Konveksi & Sablon Cikarang'}</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl text-white tracking-wide leading-tight">
                {isEn ? (
                  <>CIKARANG GARMENT &amp; PRINTING FOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff60a8] to-primary">CUSTOM APPAREL</span></>
                ) : (
                  <>KONVEKSI &amp; SABLON CIKARANG UNTUK <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#ff60a8] to-primary">APPAREL CUSTOM BERKUALITAS</span></>
                )}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-[#ff60a8] rounded-full mx-auto my-4" />
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {isEn
                  ? 'Dreamcatcher is a modern custom apparel and garment printing platform serving Cikarang and Bekasi. We combine digital design exploration, 3D mockup previews, and standardized production for single orders, community merch, and corporate workwear.'
                  : 'Dreamcatcher hadir sebagai platform konveksi apparel dan cetak sablon di Cikarang. Kami menggabungkan kemudahan eksplorasi desain digital, visualisasi mockup 3D, dan pengerjaan produksi terstandarisasi untuk kebutuhan apparel satuan, komunitas, hingga seragam perusahaan.'}
              </p>
            </ScrollReveal>
          </div>

          {/* 4 Value Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <ScrollReveal direction="up" delay={100}>
              <div className="h-full p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Layers size={24} />
                  </div>
                  <h3 className="font-heading text-xl text-white tracking-wide mb-2 group-hover:text-primary transition-colors">
                    {isEn ? 'DTF & Distro Plastisol' : 'Sablon DTF & Plastisol Distro'}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed">
                    {isEn
                      ? 'From single-piece full color DTF printing to crack-resistant Plastisol rubber inks favored by leading Indonesian streetwear clothing brands.'
                      : 'Pilihan sablon DTF resolusi tinggi tanpa batasan warna (bisa satuan), hingga sablon Plastisol manual standar distro yang pekat, elastis, dan tahan cuci berkali-kali.'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-white/5">
                  <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                    <Check size={12} /> {isEn ? 'Satuan & Grosir Lusinan' : 'Satuan & Partai Besar'}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="h-full p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Shirt size={24} />
                  </div>
                  <h3 className="font-heading text-xl text-white tracking-wide mb-2 group-hover:text-primary transition-colors">
                    {isEn ? 'Corporate & Community Garments' : 'Konveksi Komunitas & Perusahaan'}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed">
                    {isEn
                      ? 'Specialized in producing company workwear, factory crew uniforms in Cikarang industrial estates, class t-shirts, and community gathering apparel.'
                      : 'Berpengalaman memproduksi kaos event komunitas, gathering keluarga, seragam panitia, hingga seragam kaos kerja pabrik & kantor di kawasan industri Cikarang.'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-white/5">
                  <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                    <Check size={12} /> {isEn ? 'Kapasitas Ribuan Pcs/Minggu' : 'Kapasitas Ribuan Pcs'}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="h-full p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Award size={24} />
                  </div>
                  <h3 className="font-heading text-xl text-white tracking-wide mb-2 group-hover:text-primary transition-colors">
                    {isEn ? 'Premium 100% Combed Cotton' : 'Bahan Katun Combed Premium'}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed">
                    {isEn
                      ? 'Crafted with 100% reactive Cotton Combed 24s/30s that feels soft, breathable, and sweat-absorbent, paired with export-grade chain stitching.'
                      : 'Menggunakan bahan 100% katun Combed 24s dan 30s reaktif yang sejuk, menyerap keringat, halus di kulit, serta dilengkapi jahitan rantai rapi standar ekspor.'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-white/5">
                  <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                    <Check size={12} /> {isEn ? 'Kain Nyaman & Tidak Gerah' : 'Adem & Bebas Susut'}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={400}>
              <div className="h-full p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Clock size={24} />
                  </div>
                  <h3 className="font-heading text-xl text-white tracking-wide mb-2 group-hover:text-primary transition-colors">
                    {isEn ? 'Fast Production & 100% Guarantee' : 'Produksi Cepat & Garansi 100%'}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed">
                    {isEn
                      ? 'Standard turnaround time of 2-5 business days. Every single piece is inspected with strict QC and protected by our 100% reprint/refund guarantee.'
                      : 'Estimasi pengerjaan cepat 2-5 hari kerja. Melalui 3 tahap Quality Control ketat dengan Garansi 100% ganti baru jika ada cacat cetak atau kain rusak.'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-white/5">
                  <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                    <Check size={12} /> {isEn ? 'Garansi Kualitas Bebas Cacat' : 'Garansi Cacat Produksi'}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Coverage Areas & Local Context Box */}
          <ScrollReveal direction="up" delay={200}>
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/30 via-black/40 to-primary/15 border border-white/10 backdrop-blur-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <MapPin size={16} />
                    <span>{isEn ? 'Coverage & Service Areas' : 'Wilayah Jangkauan Layanan Sablon Cikarang'}</span>
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl text-white tracking-wide">
                    {isEn
                      ? 'Serving Cikarang, Industrial Parks & Bekasi Regency'
                      : 'Melayani Pemesanan se-Cikarang, Kawasan Industri & Sekitarnya'}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    {isEn
                      ? 'Dreamcatcher provides pickup, delivery, and express courier shipments to businesses, communities, and individuals across all Cikarang districts:'
                      : 'Dreamcatcher siap melayani pengiriman pesanan kaos sablon dan konveksi langsung ke alamat Anda dengan opsi pengiriman instan, sameday, maupun kargo hemat untuk seluruh area:'}
                  </p>

                  {/* Area Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      'Cikarang Selatan',
                      'Cikarang Utara',
                      'Cikarang Barat',
                      'Cikarang Timur',
                      'Cikarang Pusat',
                      'Lippo Cikarang',
                      'Kawasan Industri Jababeka',
                      'Kawasan EJIP & MM2100',
                      'Delta Silicon & GIIC',
                      'Cibarusah & Sekitarnya'
                    ].map((loc, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 hover:border-primary/40 hover:text-white transition-colors"
                      >
                        📍 {loc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                  <Link
                    to="/pesan"
                    className="btn-gradient-primary py-3.5 px-6 text-xs font-bold tracking-wider text-center shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
                  >
                    <span>{isEn ? 'Order Custom T-Shirts' : 'Mulai Pesan Kaos Custom'}</span>
                    <ArrowRight className="w-4 h-4 ml-1 inline" />
                  </Link>
                  <Link
                    to="/pricelist"
                    className="btn-glass py-3.5 px-6 text-xs font-semibold tracking-wider text-center hover:border-primary/50 transition-all"
                  >
                    <span>{isEn ? 'View Pricing & Specs' : 'Cek Daftar Harga Sablon'}</span>
                  </Link>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3.5 px-6 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold tracking-wider text-center transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={15} />
                    <span>{isEn ? 'Consult on WhatsApp' : 'Konsultasi Desain & Bahan'}</span>
                  </a>
                </div>
              </div>

              {/* Natural SEO Internal Links Navigation Strip */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">{isEn ? 'Explore Dreamcatcher:' : 'Jelajahi Layanan Kami:'}</span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link to="/layanan" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                    {isEn ? 'All Screen Printing Services' : 'Lihat Layanan Sablon Kaos'}
                  </Link>
                  <span>•</span>
                  <Link to="/produk" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                    {isEn ? 'Custom T-Shirt Catalog' : 'Jelajahi Produk Kaos Custom'}
                  </Link>
                  <span>•</span>
                  <Link to="/design-studio" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                    {isEn ? 'AI Design Studio & 3D Mockup' : 'Studio Desain Kaos AI'}
                  </Link>
                  <span>•</span>
                  <Link to="/about" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                    {isEn ? 'About Our Cikarang Workshop' : 'Tentang Workshop Dreamcatcher'}
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
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
              <p className={`font-heading text-base font-bold tracking-[1.5px] mb-1 ${
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
            {t('cta.title', 'WUJUDKAN APPAREL CUSTOM SESUAI KONSEP DESAINMU')}
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {t('cta.subtitle', 'Nikmati kemudahan eksplorasi desain, visualisasi mockup presisi, dan hasil produksi konveksi terpercaya bersama Dreamcatcher.')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/pesan"
              className="btn-gradient-primary py-4 px-9 text-sm font-bold tracking-wider hover:scale-105 active:scale-95 transition-transform"
            >
              <span>{t('cta.orderBtn', 'Mulai Custom Apparel')}</span>
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

