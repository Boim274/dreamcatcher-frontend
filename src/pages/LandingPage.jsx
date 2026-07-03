import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/ui/Icon';
import ServiceIcon from '../components/ui/ServiceIcons';
import ScrollReveal from '../components/ui/ScrollReveal';
import PortfolioCarousel from '../components/common/PortfolioCarousel';
import TestimonialCarousel from '../components/common/TestimonialCarousel';
import api from '../services/api';
import { formatRupiah } from '../utils/formatRupiah';

const features = [
  { icon: 'zap', title: 'AI Design Generator', desc: 'Generate desain custom dengan teknologi AI' },
  { icon: 'eye', title: 'AI Mockup Preview', desc: 'Lihat preview hasil sablon sebelum produksi' },
  { icon: 'activity', title: 'Order Tracking', desc: 'Pantau status pesanan secara real-time' },
  { icon: 'credit-card', title: 'Pembayaran Online', desc: 'Berbagai metode: transfer, QRIS, cash' },
];

const steps = [
  { num: 1, icon: 'target', title: 'Pilih Layanan', desc: 'Tentukan jenis produk dan teknik sablon' },
  { num: 2, icon: 'edit-3', title: 'Upload Desain', desc: 'Upload desain sendiri atau generate AI' },
  { num: 3, icon: 'eye', title: 'Preview Mockup', desc: 'Lihat hasil sablon di mockup produk' },
  { num: 4, icon: 'shopping-cart', title: 'Checkout', desc: 'Lengkapi data dan pilih pembayaran' },
  { num: 5, icon: 'check-circle', title: 'Selesai', desc: 'Pesanan diproses dan dikirim' },
];

const marqueeItems = [
  'SABLON KAOS', 'PRINTING BANNER', 'CETAK STIKER', 'BORDIR', 'CUSTOM DESIGN', 'QUALITY GUARANTEED',
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-[#e0d8cc] overflow-hidden group hover:bg-ink hover:text-white transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-semibold text-ink group-hover:text-white text-[15px] transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-ink group-hover:text-primary transition-all duration-300 flex-shrink-0 ml-4 ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 text-gray-dark group-hover:text-[#aaa] text-[14px] leading-[1.8] animate-fade-in border-t border-[#e0d8cc] group-hover:border-border pt-4 transition-colors">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/services').catch(() => ({ data: { services: [] } })),
      api.get('/portfolios/featured').catch(() => ({ data: { portfolios: [] } })),
      api.get('/testimonials').catch(() => ({ data: { testimonials: [] } })),
    ]).then(([servicesRes, portfoliosRes, testimonialsRes]) => {
      setServices(servicesRes.data?.services || []);
      setPortfolios(portfoliosRes.data?.portfolios || []);
      setTestimonials(testimonialsRes.data?.testimonials || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* ==================== HERO ==================== */}
      <section className="min-h-screen bg-ink flex items-center relative overflow-hidden pt-16">
        <div className="graffiti-deco" style={{ top: '10%', left: '-2%', transform: 'rotate(-8deg)' }}>DREAMCATCHER</div>
        <div className="graffiti-deco" style={{ bottom: '5%', right: '-1%', transform: 'rotate(6deg)', color: '#ef69a9' }}>SABLON</div>
        <div className="graffiti-deco" style={{ top: '40%', right: '5%', fontSize: 'clamp(40px, 6vw, 90px)', transform: 'rotate(-15deg)', opacity: 0.08 }}>PRINT</div>

        <div className="relative z-[2] w-full max-w-7xl mx-auto px-[5%]">
          <div className="flex items-center justify-between gap-12">
            {/* KIRI: Teks */}
            <div className="max-w-[600px]">
              <ScrollReveal direction="up" delay={200}>
                <div className="inline-block bg-[#ef69a9] text-white text-[11px] font-bold tracking-[3px] uppercase py-[6px] px-[14px] mb-6" style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 0 100%)' }}>
                  Konveksi & Sablon Premium
                </div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={400}>
                <h1 className="font-heading text-[clamp(60px,10vw,140px)] leading-[0.92] text-white tracking-[1px] mb-0">
                  CETAK<span className="text-primary block">IMPIANMU</span>DISINI
                </h1>
              </ScrollReveal>
              <ScrollReveal direction="blur" delay={600}>
                <p className="text-[#aaa] text-[16px] leading-[1.7] my-6 max-w-[480px]">
                  Dari kaos custom, banner, stiker, hingga bordir — kami hadirkan kualitas terbaik untuk setiap kreasi Anda. Desainmu, karya kami.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={800}>
                <div className="flex gap-3 flex-wrap">
                  <Link to="/pesan" className="btn-acid">
                    Pesan Sekarang
                  </Link>
                  <a href="#portfolio" className="btn-outline">
                    Lihat Portfolio
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* KANAN: Gambar Mesin Print */}
            <ScrollReveal direction="right" delay={600}>
              <div className="hidden lg:block w-[380px] h-[380px] relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop"
                  alt="Kaos Custom Premium"
                  className="relative w-full h-full object-cover rounded-2xl border border-border group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-3 -right-3 bg-primary text-white text-[11px] font-bold tracking-[2px] uppercase py-2 px-4" style={{ clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0 100%)' }}>
                  Custom Design
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <div className="absolute bottom-10 right-[5%] flex gap-10 z-[2] max-md:hidden">
          <ScrollReveal direction="right" delay={1000}>
            <div className="text-right">
              <div className="font-heading text-[48px] text-primary leading-none">3K+</div>
              <div className="text-[#666] text-[11px] tracking-[2px] uppercase">Order Selesai</div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={1100}>
            <div className="text-right">
              <div className="font-heading text-[48px] text-primary leading-none">98%</div>
              <div className="text-[#666] text-[11px] tracking-[2px] uppercase">Kepuasan Client</div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={1200}>
            <div className="text-right">
              <div className="font-heading text-[48px] text-primary leading-none">5TH</div>
              <div className="text-[#666] text-[11px] tracking-[2px] uppercase">Tahun Berdiri</div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ==================== MARQUEE ==================== */}
      <div className="marquee-strip">
        <div className="marquee-inner">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i}>
              {item}
              {i < marqueeItems.length * 2 - 1 && <span className="sep"> &#10022; </span>}
            </span>
          ))}
        </div>
      </div>

      {/* ==================== SERVICES ==================== */}
      <section className="bg-ink px-[5%] py-20">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; apa yang kami tawarkan</div>
            <h2 className="section-title text-white">LAYANAN<br/>KAMI</h2>
            <div className="divider"></div>
            <p className="section-sub">Empat layanan unggulan kami dirancang untuk kebutuhan bisnis dan personal Anda.</p>
          </ScrollReveal>

          {loading ? (
            <div className="py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2px] mt-12">
              {services.map((service, index) => (
                <ScrollReveal key={service.id} direction="up" delay={index * 150}>
                  <div className="card-dark group">
                    <div className="font-heading text-[72px] absolute top-4 right-4 text-white opacity-[0.04] leading-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-12 h-12 bg-primary flex items-center justify-center mb-5" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                      <ServiceIcon name={service.name} size={24} className="text-white" />
                    </div>
                    <h3 className="font-heading text-[28px] text-white tracking-[1px] mb-2">{service.name}</h3>
                    <p className="text-[#777] text-[13px] leading-[1.7]">{service.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-primary font-bold text-lg">
                        {formatRupiah(service.price_per_unit || service.base_price)}
                      </span>
                      <span className="text-gray-dark text-[11px]">/pcs</span>
                    </div>
                    <span className="inline-block bg-[#ef69a9] text-white text-[10px] font-bold tracking-[2px] px-2 py-[3px] mt-4 uppercase">
                      {index === 0 ? 'Most Popular' : index === 1 ? 'Fast Delivery' : index === 2 ? 'Custom Shape' : 'Premium Quality'}
                    </span>
                    <Link to={`/pesan?service=${service.id}`} className="block w-full text-center border-2 border-primary text-primary font-semibold py-2 mt-4 hover:bg-primary hover:text-white transition-colors no-underline text-[13px] uppercase tracking-[1px]">
                      Pesan
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== HOW TO ORDER ==================== */}
      <section className="bg-[#f8f4ec] px-[5%] py-20 relative overflow-hidden">
        <div className="font-heading text-[200px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#e0d8cc] opacity-50 whitespace-nowrap pointer-events-none select-none">
          ORDER
        </div>
        <div className="relative z-[1] max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; mudah &amp; cepat</div>
            <h2 className="section-title">CARA<br/>PEMESANAN</h2>
            <div className="divider"></div>
            <p className="section-sub">5 langkah mudah untuk mendapatkan produk impian Anda.</p>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-0 mt-12">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} direction="up" delay={i * 120}>
                <div className="bg-white border border-[#e0d8cc] p-6 relative hover:bg-ink hover:text-white group transition-all">
                  <div className="font-heading text-[80px] text-primary leading-none opacity-15 mb-[-16px]">{step.num}</div>
                  <Icon name={step.icon} size={28} className="mb-4 text-ink group-hover:text-primary transition-colors" />
                  <div className="font-heading text-[22px] tracking-[1px] mb-2 group-hover:text-primary transition-colors">{step.title}</div>
                  <div className="text-[12px] text-gray leading-[1.6] group-hover:text-[#aaa] transition-colors">{step.desc}</div>
                  {i < steps.length - 1 && (
                    <div className="step-arrow max-md:hidden">&#8250;</div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PORTFOLIO ==================== */}
      <section id="portfolio" className="bg-ink px-[5%] py-20">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; karya terbaik kami</div>
            <h2 className="section-title text-white">PORTFOLIO</h2>
            <div className="divider"></div>
            <p className="section-sub">Sebagian hasil karya yang telah kami produksi untuk klien kami.</p>
          </ScrollReveal>

          {loading ? (
            <div className="py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="mt-12">
              <ScrollReveal direction="blur" delay={200}>
                <PortfolioCarousel portfolios={portfolios} />
              </ScrollReveal>
            </div>
          )}
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="bg-[#f8f4ec] px-[5%] py-20 relative overflow-hidden">
        <div className="font-heading text-[200px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#e0d8cc] opacity-50 whitespace-nowrap pointer-events-none select-none">
          TRUST
        </div>
        <div className="relative z-[1] max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; kata mereka</div>
            <h2 className="section-title">TESTIMONI</h2>
            <div className="divider"></div>
            <p className="section-sub">Apa kata pelanggan kami tentang kualitas dan pelayanan kami.</p>
          </ScrollReveal>

          {testimonials.length > 0 && (
            <div className="mt-12">
              <TestimonialCarousel testimonials={testimonials} />
            </div>
          )}
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="bg-ink px-[5%] py-20">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; kenapa kami?</div>
            <h2 className="section-title text-white">KENAPA<br/>DREAMCATCHER?</h2>
            <div className="divider"></div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2px] mt-12">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} direction="scale" delay={i * 150}>
                <div className="card-dark text-center">
                  <div className="w-12 h-12 bg-primary/20 flex items-center justify-center mx-auto mb-5" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                    <Icon name={f.icon} size={24} className="text-primary" />
                  </div>
                  <h3 className="font-heading text-[22px] text-white tracking-[1px] mb-2">{f.title}</h3>
                  <p className="text-[#777] text-[13px] leading-[1.7]">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="bg-[#f8f4ec] px-[5%] py-20 relative overflow-hidden">
        <div className="font-heading text-[200px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#e0d8cc] opacity-50 whitespace-nowrap pointer-events-none select-none">
          FAQ
        </div>
        <div className="relative z-[1] max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; FAQ</div>
            <h2 className="section-title">MOST FREQUENTLY ASKED<br/>QUESTIONS?</h2>
            <div className="divider"></div>
            <p className="section-sub">Pertanyaan yang sering ditanyakan oleh pelanggan kami.</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <ScrollReveal direction="up" delay={0}>
              <FAQItem
                question="Minimal order berapa ya?"
                answer="Halo Kak! Untuk minimal order sablon di tempat kami adalah 12 pcs ya. Proses pengerjaan biasanya memakan waktu sekitar 3-5 hari kerja, tergantung antrian dan tingkat kerumitan desain."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <FAQItem
                question="Teknik sablon apa saja yang tersedia?"
                answer="Kami menyediakan berbagai teknik sablon: DTG (Direct to Garment) untuk desain full color, Screen Printing untuk produksi massal, DTF (Direct to Film) untuk berbagai jenis kain, dan Bordir untuk hasil yang lebih premium dan tahan lama."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <FAQItem
                question="Bisa desain sendiri atau gimana?"
                answer="Bisa banget Kak! Ada 3 opsi: (1) Upload desain sendiri dalam format PNG/JPG, (2) Gunakan AI Design Generator kami untuk membuat desain dari ide, atau (3) Konsultasikan dengan tim desain kami untuk hasil yang lebih personal."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300}>
              <FAQItem
                question="Metode pembayaran apa saja yang diterima?"
                answer="Kami menerima berbagai metode pembayaran: Transfer Bank (BCA, Mandiri, BNI), QRIS (semua e-wallet), dan Cash untuk pengambilan langsung di toko. Pembayaran DP 50% sudah cukup untuk memulai produksi."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={400}>
              <FAQItem
                question="Bisa kirim ke luar kota?"
                answer="Ya, bisa banget! Kami melayani pengiriman ke seluruh Indonesia via ekspedisi (JNE, J&T, SiCepat, dll). Ongkos kirim ditanggung pembeli dan dihitung berdasarkan berat serta tujuan pengiriman."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={500}>
              <FAQItem
                question="Berapa lama proses pembuatan mockup?"
                answer="Dengan AI Mockup Preview kami, proses pembuatan mockup instan! Anda bisa langsung melihat hasil sablon di produk secara real-time sebelum melakukan pemesanan. Tidak perlu menunggu berhari-hari."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={600}>
              <FAQItem
                question="Apakah ada garansi?"
                answer="Ya, kami memberikan garansi kualitas sablon. Jika terdapat cacat produksi seperti warna luntur, sablon mengelupas, atau kesalahan dari pihak kami, kami siap mengganti produk baru secara gratis."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={700}>
              <FAQItem
                question="Bisa pesan satuan?"
                answer="Untuk sablon kaos dan bordir, minimal order adalah 12 pcs. Namun untuk produk lain seperti banner, stiker, dan cetak digital, bisa pesan satuan tanpa minimal order."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ==================== CONTACT ==================== */}
      <section id="kontak" className="bg-ink px-[5%] py-20 relative overflow-hidden">
        <div className="font-tag text-[100px] absolute bottom-[-20px] right-[5%] text-[#ef69a9] opacity-[0.08] rotate-[-5deg] whitespace-nowrap pointer-events-none select-none">
          HIT US UP
        </div>

        <div className="relative z-[1] max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="section-tag">&mdash; hubungi kami</div>
            <h2 className="section-title text-white">ADA PERTANYAAN?<br/>HUBUNGI KAMI</h2>
            <div className="divider"></div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-12">
            <ScrollReveal direction="left">
              <p className="section-sub mb-8">Kami siap membantu Anda menemukan solusi terbaik untuk setiap kebutuhan cetak dan konveksi.</p>
              <div className="contact-info">
                <strong>
                  <Icon name="map-pin" size={16} className="inline mr-2" />Alamat
                </strong>
                <p>Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi, Jawa Barat</p>

                <strong>
                  <Icon name="phone" size={16} className="inline mr-2" />WhatsApp
                </strong>
                <p>+62 878-7729-4587</p>

                <strong>
                  <Icon name="mail" size={16} className="inline mr-2" />Email
                </strong>
                <p>hello@dreamcatcherprint.co.id</p>

                <strong>
                  <Icon name="clock" size={16} className="inline mr-2" />Jam Operasional
                </strong>
                <p>Senin&ndash;Sabtu: 08.00&ndash;18.00 WIB</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Nama Lengkap" className="input-dark" required />
                  <input type="tel" placeholder="No. WhatsApp" className="input-dark" required />
                </div>
                <select className="input-dark cursor-pointer" required>
                  <option value="">— Pilih Layanan —</option>
                  <option>Sablon Kaos</option>
                  <option>Printing Banner</option>
                  <option>Cetak Stiker</option>
                  <option>Bordir</option>
                  <option>Lainnya</option>
                </select>
                <textarea placeholder="Ceritakan kebutuhan Anda..." className="input-dark min-h-[120px] resize-none" required></textarea>
                <button type="submit" className="btn-acid">
                  Kirim Pesan &#10022;
                </button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="bg-primary px-[5%] py-20 text-center">
        <ScrollReveal direction="blur">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-[clamp(36px,5vw,60px)] text-white mb-4">SIAP MENCOBA?</h2>
            <p className="text-white/80 text-[16px] mb-8">
              Pesan sekarang dan dapatkan hasil sablon berkualitas tinggi
            </p>
            <Link to="/pesan" className="inline-flex items-center gap-2 bg-white text-primary font-bold py-4 px-8 hover:bg-gray transition-colors no-underline uppercase tracking-[1px] text-[14px]" style={{ clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0 100%)' }}>
              <Icon name="arrow-right" size={20} /> Mulai Pesan
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
