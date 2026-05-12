import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/ui/Icon';
import PortfolioCarousel from '../components/common/PortfolioCarousel';
import api from '../services/api';

const features = [
  { icon: 'zap', title: 'AI Design Generator', desc: 'Generate desain custom dengan teknologi AI' },
  { icon: 'eye', title: 'AI Mockup Preview', desc: 'Lihat preview hasil sablon sebelum produksi' },
  { icon: 'activity', title: 'Order Tracking', desc: 'Pantau status pesanan secara real-time' },
  { icon: 'credit-card', title: 'Pembayaran Online', desc: 'Berbagai metode: transfer, QRIS, cash' },
];

const steps = [
  { num: 1, title: 'Pilih Layanan', desc: 'Tentukan jenis sablon' },
  { num: 2, title: 'Upload/Generate', desc: 'Desain sendiri atau AI' },
  { num: 3, title: 'Preview Mockup', desc: 'Lihat hasil sablon' },
  { num: 4, title: 'Checkout', desc: 'Lengkapi data' },
  { num: 5, title: 'Selesai', desc: 'Pesanan diproses' },
];

export default function LandingPage() {
  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/services').catch(() => ({ data: { services: [] } })),
      api.get('/portfolios').catch(() => ({ data: { portfolios: [] } })),
    ]).then(([servicesRes, portfoliosRes]) => {
      setServices(servicesRes.data?.services || []);
      setPortfolios(portfoliosRes.data?.portfolios || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#4a1259] via-[#4a1259] to-purple-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#982598] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6">
            <Icon name="zap" size={20} className="text-[#FFD700]" />
            <span className="text-sm">Powered by AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Wujudkan Desainmu<br />
            <span className="text-[#982598]">Dengan AI</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Sablon kaos, banner, stiker, dan bordir berkualitas tinggi dengan teknologi AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pesan" className="inline-flex items-center justify-center gap-2 bg-[#982598] hover:bg-[#7a1f7a] text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              <Icon name="arrow-right" size={20} /> Pesan Sekarang
            </Link>
            <a href="#portfolio" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-[#4a1259] font-semibold py-3 px-8 rounded-lg transition-colors">
              <Icon name="image" size={20} /> Lihat Portfolio
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Layanan Kami</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Pilihan lengkap untuk kebutuhan sablon dan printing
            </p>
          </div>
          
          {loading ? (
            <div className="py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <Card key={service.id} hover className="text-center group">
                  <div className="w-14 h-14 bg-[#982598]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl group-hover:bg-[#982598] group-hover:text-white transition-all">
                    <Icon name="box" size={28} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                  <p className="text-[#6B7280] text-sm mb-4 line-clamp-3">{service.description}</p>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-[#982598] font-bold text-xl">
                      Rp {(service.price_per_unit || service.base_price)?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[#6B7280] text-sm">/pcs</span>
                  </div>
                  <Link to={`/pesan?service=${service.id}`} className="block w-full border-2 border-[#982598] text-[#982598] font-semibold py-2 rounded-lg hover:bg-[#982598] hover:text-white transition-colors">
                    Pesan
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cara Kerja</h2>
            <p className="text-[#6B7280]">Proses pemesanan yang simpel</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 bg-[#982598] text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-[#6B7280] text-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Portfolio</h2>
            <p className="text-[#6B7280]">Karya terbaik dari Dreamcatcher</p>
          </div>
          {loading ? (
            <div className="py-12"><Spinner size="lg" /></div>
          ) : (
            <PortfolioCarousel portfolios={portfolios} />
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#4a1259] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Kenapa Dreamcatcher?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="w-14 h-14 bg-[#982598]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name={f.icon} size={28} className="text-[#982598]" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Siap Mencoba?</h2>
          <p className="text-lg opacity-90 mb-8">
            Pesan sekarang dan dapatkan hasil sablon berkualitas tinggi
          </p>
          <Link to="/pesan" className="inline-flex items-center gap-2 bg-white text-primary font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors">
            <Icon name="arrow-right" size={20} /> Mulai Pesan
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}