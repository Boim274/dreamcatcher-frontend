import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import Icon from '../components/ui/Icon';

const stats = [
  { value: '5+', label: 'Tahun Pengalaman' },
  { value: '1000+', label: 'Pesanan Selesai' },
  { value: '4', label: 'Layanan Utama' },
  { value: '24/7', label: 'Online Support' },
];

const services = [
  { icon: 'shirt', name: 'Sablon Kaos', desc: 'Plastisol, DTF, Polyflex, Sublim' },
  { icon: 'printer', name: 'Printing Banner', desc: 'Indoor & Outdoor' },
  { icon: 'image', name: 'Cetak Stiker', desc: 'Vinyl, Orajel, Chromewire' },
  { icon: 'layers', name: 'Bordir', desc: 'Polyester, Rayon, Katun' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-tag">&mdash; tentang kami</div>
            <h1 className="section-title">TENTANG<br/>KAMI</h1>
            <div className="divider mx-auto"></div>
          </div>

          {/* Story */}
          <div className="bg-card border border-border rounded-xl p-8 mb-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-[28px] text-fire tracking-[1px] mb-4">Dreamcatcher.id</h2>
              <p className="text-gray text-[15px] leading-[1.8] mb-4">
                Dreamcatcher.id adalah usaha sablon yang berlokasi di Bekasi, Jawa Barat. Dengan pengalaman lebih dari 5 tahun dalam industri konveksi dan sablon, kami hadir untuk memberikan solusi terbaik dalam kebutuhan pakaian custom Anda.
              </p>
              <p className="text-gray text-[15px] leading-[1.8]">
                Kami melayani sablon kaos, hoodie, polo, jaket, printing banner, cetak stiker, dan bordir. Dengan didukung peralatan modern dan tim yang berpengalaman, kami menjamin kualitas terbaik untuk setiap pesanan Anda.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {stats.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 text-center">
                <p className="text-fire font-heading text-[32px] mb-1">{item.value}</p>
                <p className="text-gray text-[13px]">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Services */}
          <div className="mb-12">
            <h2 className="font-heading text-[24px] text-fire tracking-[1px] mb-6 text-center">Layanan Kami</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 text-center hover:border-fire/50 transition-colors">
                  <Icon name={item.icon} size={36} className="mx-auto text-fire mb-3" />
                  <p className="text-white font-medium mb-1">{item.name}</p>
                  <p className="text-gray text-[13px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-[20px] text-fire tracking-[1px] mb-4">Informasi Toko</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Icon name="map-pin" size={20} className="text-fire mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Alamat</p>
                    <p className="text-gray text-[13px]">Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi, Jawa Barat</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="phone" size={20} className="text-fire mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Telepon / WhatsApp</p>
                    <p className="text-gray text-[13px]">+62 878-7729-4587</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="mail" size={20} className="text-fire mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-gray text-[13px]">hello@dreamcatcherprint.co.id</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="clock" size={20} className="text-fire mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Jam Operasional</p>
                    <p className="text-gray text-[13px]">Senin - Sabtu: 08.00 - 18.00 WIB</p>
                    <p className="text-gray text-[13px]">Minggu: Tutup</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
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
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
