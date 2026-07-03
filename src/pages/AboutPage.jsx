import { useState } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import { X } from 'lucide-react';

const stats = [
  { value: '5+', label: 'Tahun Pengalaman', icon: 'award' },
  { value: '1000+', label: 'Pesanan Selesai', icon: 'package' },
  { value: '4', label: 'Layanan Utama', icon: 'layers' },
  { value: '24/7', label: 'Online Support', icon: 'headphones' },
];

const services = [
  { icon: 'shirt', name: 'Sablon Kaos', desc: 'Plastisol, DTF, Polyflex, Sublim' },
  { icon: 'printer', name: 'Printing Banner', desc: 'Indoor & Outdoor' },
  { icon: 'image', name: 'Cetak Stiker', desc: 'Vinyl, Orajel, Chromewire' },
  { icon: 'layers', name: 'Bordir', desc: 'Polyester, Rayon, Katun' },
];

const workshopImages = [
  {
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    label: 'Mesin Sablon Manual',
    span: 'lg:col-span-2',
  },
  {
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    label: 'Workshop Produksi',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    label: 'Proses Cetak Presisi',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1558346648-9757f2e9e5e0?w=800&q=80',
    label: 'Bahan Baku Berkualitas',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1621609764095-bf94c1a4b272?w=800&q=80',
    label: 'Riset & Pengembangan',
    span: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    label: 'Tim Profesional',
    span: '',
  },
];

export default function AboutPage() {
  const [lightbox, setLightbox] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="graffiti-deco">ABOUT</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; tentang kami</div>
              <h1 className="section-title">TENTANG<br/>KAMI</h1>
              <div className="divider mx-auto"></div>
            </ScrollReveal>
          </div>

          {/* Story */}
          <ScrollReveal direction="up" delay={200}>
            <div className="bg-card border border-border rounded-xl p-8 mb-12 relative overflow-hidden">
              <div className="absolute top-4 right-4 font-heading text-[80px] text-white/[0.03] leading-none select-none">DC</div>
              <div className="max-w-3xl mx-auto text-center relative z-10">
                <h2 className="font-heading text-[28px] text-fire tracking-[1px] mb-4">Dreamcatcher.id</h2>
                <p className="text-gray-light text-[15px] leading-[1.8] mb-4">
                  Dreamcatcher.id adalah usaha sablon yang berlokasi di Bekasi, Jawa Barat. Dengan pengalaman lebih dari 5 tahun dalam industri konveksi dan sablon, kami hadir untuk memberikan solusi terbaik dalam kebutuhan pakaian custom Anda.
                </p>
                <p className="text-gray-light text-[15px] leading-[1.8]">
                  Kami melayani sablon kaos, hoodie, polo, jaket, printing banner, cetak stiker, dan bordir. Dengan didukung peralatan modern dan tim yang berpengalaman, kami menjamin kualitas terbaik untuk setiap pesanan Anda.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {stats.map((item, i) => (
              <ScrollReveal key={i} direction="scale" delay={300 + i * 100}>
                <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary/30 transition-colors group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon name={item.icon} size={24} className="text-primary" />
                  </div>
                  <p className="text-primary font-heading text-[32px] mb-1">{item.value}</p>
                  <p className="text-gray text-[13px]">{item.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Workshop Gallery */}
          <ScrollReveal direction="up" delay={400}>
            <div className="mb-12">
              <div className="text-center mb-8">
                <div className="section-tag">&mdash; workshop</div>
                <h2 className="font-heading text-[28px] text-fire tracking-[1px] mb-3">LIHAT WORKSHOP KAMI</h2>
                <div className="divider mx-auto"></div>
                <p className="text-gray text-[14px] mt-4 max-w-xl mx-auto">Mengintip langsung proses produksi dan suasana workshop Dreamcatcher.id — dari persiapan bahan hingga hasil jadi.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workshopImages.map((img, i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-xl bg-card border border-border cursor-pointer ${img.span}`}
                    onClick={() => setLightbox(img)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.label}
                        loading="lazy"
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white font-semibold text-[14px] tracking-wide">{img.label}</p>
                        <p className="text-white/60 text-[11px] mt-0.5">Klik untuk lihat</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Services */}
          <div className="mb-12">
            <ScrollReveal direction="up" delay={400}>
              <h2 className="font-heading text-[24px] text-fire tracking-[1px] mb-6 text-center">Layanan Kami</h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={500 + i * 100}>
                  <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-fire/30 transition-all duration-300 group hover:-translate-y-1">
                    <div className="w-14 h-14 bg-fire/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Icon name={item.icon} size={28} className="text-fire" />
                    </div>
                    <p className="text-white font-medium mb-1">{item.name}</p>
                    <p className="text-gray text-[13px]">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Contact & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <ScrollReveal direction="left" delay={300}>
              <div className="bg-card border border-border rounded-xl p-6 h-full">
                <h3 className="font-heading text-[20px] text-fire tracking-[1px] mb-4">Informasi Toko</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-fire/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="map-pin" size={18} className="text-fire" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Alamat</p>
                      <p className="text-gray text-[13px] leading-relaxed">Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi, Jawa Barat</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-fire/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="phone" size={18} className="text-fire" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Telepon / WhatsApp</p>
                      <p className="text-gray text-[13px]">+62 878-7729-4587</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-fire/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="mail" size={18} className="text-fire" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p className="text-gray text-[13px]">hello@dreamcatcherprint.co.id</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-fire/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="clock" size={18} className="text-fire" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Jam Operasional</p>
                      <p className="text-gray text-[13px]">Senin - Sabtu: 08.00 - 18.00 WIB</p>
                      <p className="text-gray text-[13px]">Minggu: Tutup</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={400}>
              <div className="bg-card border border-border rounded-xl overflow-hidden h-full">
                <iframe
                  target="_blank"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d239.41367644970836!2d107.09572027469255!3d-6.4139102999999915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6997d7e8ed2be3%3A0x9afd9299a9367be3!2sKaos%20polos%20%26%20Sablon%20Cikarang!5e1!3m2!1sid!2sid!4v1781077507327!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '350px' }}
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
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.label}
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-[14px] font-medium bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm">
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
