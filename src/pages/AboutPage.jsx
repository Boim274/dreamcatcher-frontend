import { useState } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import { WA_URL } from '../constants/whatsapp';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import { X, ShieldCheck, Zap, Sparkles, Award, MapPin, Phone, Mail, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import OptimizedImage from '../components/ui/OptimizedImage';

const getStats = (lang) => [
  { value: '5+', label: lang === 'en' ? 'Years Experience' : 'Tahun Pengalaman', icon: 'award' },
  { value: '10,000+', label: lang === 'en' ? 'Apparel & Prints Produced' : 'Pcs Apparel & Sablon Diproduksi', icon: 'package' },
  { value: '99.4%', label: lang === 'en' ? 'Customer Satisfaction' : 'Kepuasan Pelanggan', icon: 'heart' },
  { value: '24/7', label: lang === 'en' ? 'Online Consultation' : 'Konsultasi Online', icon: 'headphones' },
];

const getPillars = (lang) => [
  {
    icon: Zap,
    title: lang === 'en' ? 'Digital Design & Mockup' : 'Teknologi Desain & AI Mockup',
    desc: lang === 'en'
      ? 'Brainstorm apparel concepts with AI Design Studio and inspect realistic 3D and AR mockups before proceeding to production.'
      : 'Eksplorasi konsep apparel dan sablon menggunakan AI Design Studio, 3D interactive mockup, dan Augmented Reality (AR) sebelum masuk tahap produksi.'
  },
  {
    icon: Award,
    title: lang === 'en' ? 'Quality Fabrics & Tested Inks' : 'Bahan Pilihan & Tinta Teruji',
    desc: lang === 'en'
      ? 'Using certified 100% reactive Cotton Combed fabrics and crack-resistant DTF & Plastisol inks that withstand repeated washing.'
      : 'Menggunakan bahan 100% katun Combed 24s/30s pilihan serta tinta sablon DTF dan Plastisol teruji yang awet dan tahan cuci berkali-kali.'
  },
  {
    icon: ShieldCheck,
    title: lang === 'en' ? 'Production Quality Guarantee' : 'Garansi Cacat Produksi',
    desc: lang === 'en'
      ? 'Every production batch undergoes strict quality control. Any defective manufacturing or print errors from our side are covered with a replacement.'
      : 'Setiap pesanan melewati tahap Quality Control terstandarisasi. Jika terdapat cacat produksi atau kesalahan cetak dari pihak kami, kami siap memberikan garansi ganti baru.'
  },
  {
    icon: Sparkles,
    title: lang === 'en' ? 'Rapid Production Capacity' : 'Kapasitas Produksi Cepat',
    desc: lang === 'en'
      ? 'Powered by modern semi-automatic machinery with thousands of pcs per week capacity and strict deadline adherence.'
      : 'Didukung peralatan modern semi-otomatis berkapasitas ribuan pcs per minggu dengan ketepatan deadline yang terjamin.'
  }
];

const getWorkshopImages = (lang) => [
  {
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    label: lang === 'en' ? 'Precision Screen Printing Press' : 'Meja Sablon Presisi',
    span: 'lg:col-span-2',
  },
  {
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    label: lang === 'en' ? 'Workshop & Production Area' : 'Workshop & Area Produksi',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    label: lang === 'en' ? 'Heat Press & Ink Curing' : 'Proses Press & Curing Tinta',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1558346648-9757f2e9e5e0?w=800&q=80',
    label: lang === 'en' ? 'Fabric Warehouse & Thread Stock' : 'Gudang Kain & Stok Benang',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1621609764095-bf94c1a4b272?w=800&q=80',
    label: lang === 'en' ? 'Quality Control & Steam Ironing' : 'Quality Control & Steam Ironing',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    label: lang === 'en' ? 'Experienced Master Printers Team' : 'Tim Master Sablon Berpengalaman',
    span: '',
  },
];

export default function AboutPage() {
  const [lightbox, setLightbox] = useState(null);
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  const stats = getStats(language);
  const pillars = getPillars(language);
  const workshopImages = getWorkshopImages(language);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
    }`}>
      {/* Background Ambient Glows - Explicit Absolute */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-12 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold tracking-[2px] uppercase mb-4 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {isEn ? 'Dedication, Precision & Aesthetics' : 'Dedikasi, Presisi & Estetika'}
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide">
                {isEn ? (
                  <>ABOUT <span className="text-gradient">US</span></>
                ) : (
                  <>TENTANG <span className="text-gradient">KAMI</span></>
                )}
              </h1>
              <div className="divider mx-auto my-4" />
              <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                {isEn
                  ? 'Connecting garment manufacturing craftsmanship with digital design innovation for dependable custom apparel'
                  : 'Memadukan keahlian produksi konveksi dan sablon dengan inovasi desain digital untuk apparel kustom berkualitas'}
              </p>
            </ScrollReveal>
          </div>

          {/* Story & Vision */}
          <ScrollReveal direction="up" delay={150}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 mb-12 relative overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="absolute top-4 right-6 font-heading text-[120px] text-white/[0.02] leading-none select-none pointer-events-none">
                AI
              </div>
              <div className="max-w-3xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  {isEn ? 'Our Story & Commitment' : 'Cerita & Komitmen Kami'}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-white tracking-wide mb-5">
                  DREAMCATCHER <span className="text-gradient">KONVEKSI &amp; APPAREL AI</span>
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">
                  {isEn
                    ? 'Founded in Cikarang & Cibarusah, Bekasi Regency, we were born from a passion to deliver integrated custom apparel and garment manufacturing with modern convenience. We realized that the biggest challenge custom apparel clients face is visualizing design concepts and ensuring production specifications meet expectations.'
                    : 'Berdiri di Cikarang & Cibarusah, Kabupaten Bekasi, kami lahir dari hasrat menghadirkan platform konveksi dan apparel custom yang terintegrasi secara modern. Kami menyadari bahwa tantangan terbesar pemesanan pakaian kustom adalah memvisualisasikan konsep desain dan memastikan spesifikasi produksi sesuai ekspektasi.'}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {isEn ? (
                    <>
                      That is why we built a platform integrating an <strong>AI Designer</strong>, interactive <strong>3D Mockup Editor</strong>, and dependable garment and printing production. You can explore creative concepts, preview realistic visualizations on apparel, and order seamlessly in one transparent workflow.
                    </>
                  ) : (
                    <>
                      Oleh karena itu, kami menghadirkan platform yang mengintegrasikan <strong>AI Designer</strong>, <strong>3D Mockup Editor</strong> interaktif, dan pilihan teknik produksi sablon serta konveksi yang terpercaya. Anda dapat mengeksplorasi ide, melihat visualisasinya pada apparel, lalu memesan dengan proses yang praktis dan transparan.
                    </>
                  )}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
            {stats.map((item, i) => (
              <ScrollReveal key={i} direction="scale" delay={200 + i * 80}>
                <div className="glass-card-hover rounded-2xl p-5 sm:p-6 text-center group border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-primary/20">
                    <Icon name={item.icon} size={22} />
                  </div>
                  <p className="font-heading text-2xl sm:text-3xl text-white mb-1 group-hover:text-primary transition-colors">{item.value}</p>
                  <p className="text-gray-400 text-xs font-medium">{item.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Value Pillars */}
          <div className="mb-14">
            <ScrollReveal direction="up" delay={250}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] font-bold tracking-[2px] uppercase mb-2">
                  {isEn ? 'Why Choose Us' : 'Kenapa Memilih Kami'}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wide">
                  {isEn ? (
                    <>SUPERIOR QUALITY <span className="text-gradient">STANDARDS</span></>
                  ) : (
                    <>STANDAR KUALITAS <span className="text-gradient">UNGGULAN</span></>
                  )}
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pillars.map((pillar, i) => {
                const IconComponent = pillar.icon;
                return (
                  <ScrollReveal key={i} direction="up" delay={280 + i * 70}>
                    <div className="glass-card-hover rounded-2xl p-6 border border-white/10 bg-white/[0.02] backdrop-blur-xl h-full flex flex-col group">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-primary/20">
                        <IconComponent size={22} />
                      </div>
                      <h3 className="text-white font-bold text-base mb-2 group-hover:text-primary transition-colors">{pillar.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mt-auto">{pillar.desc}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>

          {/* Workshop Gallery */}
          <ScrollReveal direction="up" delay={300}>
            <div className="mb-14">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] font-bold tracking-[2px] uppercase mb-2">
                  {isEn ? 'Production Workshop' : 'Dapur Produksi'}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wide mb-2">
                  {isEn ? (
                    <>OUR <span className="text-gradient">PRODUCTION</span> WORKSHOP</>
                  ) : (
                    <>DAPUR <span className="text-gradient">PRODUKSI</span> KAMI</>
                  )}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                  {isEn
                    ? 'Take a look inside our clean workshop environment and the precision printing equipment we utilize'
                    : 'Lihat sekilas kebersihan lingkungan workshop dan ketelitian mesin sablon yang kami gunakan'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workshopImages.map((img, i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/10 cursor-pointer ${img.span}`}
                    onClick={() => setLightbox(img)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <OptimizedImage
                        src={img.url}
                        variant="medium"
                        alt={img.label}
                        aspectRatio="aspect-[4/3]"
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                      <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white font-bold text-sm tracking-wide">{img.label}</p>
                        <p className="text-primary text-[11px] mt-0.5 font-medium flex items-center gap-1">
                          {isEn ? 'Click to enlarge' : 'Klik untuk memperbesar'} <ExternalLink size={12} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Contact, Information & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <ScrollReveal direction="left" delay={250}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 h-full backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl text-white tracking-wide mb-6 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    {isEn ? 'Workshop Contact Information' : 'Informasi Kontak Workshop'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{isEn ? 'Workshop Address' : 'Alamat Workshop'}</p>
                        <p className="text-gray-400 text-xs leading-relaxed mt-0.5">Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi, Jawa Barat</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{isEn ? 'Support Phone / WhatsApp' : 'Telepon / WhatsApp Layanan'}</p>
                        <p className="text-gray-400 text-xs mt-0.5">+62 878-7729-4587</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{isEn ? 'Correspondence Email' : 'Email Korespondensi'}</p>
                        <a href="mailto:ihsanptr123@gmail.com" className="text-gray-400 hover:text-primary transition-colors text-xs mt-0.5 block">ihsanptr123@gmail.com</a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{isEn ? 'Workshop Business Hours' : 'Jam Kerja Workshop'}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {isEn ? 'Monday - Saturday: 08:00 - 18:00 WIB (24/7 Online Ordering)' : 'Senin - Sabtu: 08.00 - 18.00 WIB (Pemesanan Online 24 Jam)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  >
                    <Icon name="message-circle" size={16} /> {isEn ? 'Contact our WhatsApp' : 'Hubungi WhatsApp Kami'}
                  </a>
                  <a
                    href="https://maps.google.com/?q=Kaos+polos+%26+Sablon+Cikarang"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs text-center transition-colors border border-white/10 flex items-center justify-center gap-1.5"
                  >
                    {isEn ? 'Open in Google Maps' : 'Buka Rute Maps'} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={300}>
              <div className="rounded-3xl border border-white/10 overflow-hidden h-full min-h-[380px] shadow-2xl">
                <iframe
                  target="_blank"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d239.41367644970836!2d107.09572027469255!3d-6.4139102999999915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6997d7e8ed2be3%3A0x9afd9299a9367be3!2sKaos%20polos%20%26%20Sablon%20Cikarang!5e1!3m2!1sid!2sid!4v1781077507327!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '380px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Dreamcatcher"
                />
              </div>
            </ScrollReveal>
          </div>

        </div>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-md"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.label}
              className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-xs font-semibold bg-black/60 border border-white/15 px-6 py-2 rounded-full backdrop-blur-md">
              {lightbox.label}
            </p>
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

