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
import { formatRupiah, getMinPrice } from '../utils/formatRupiah';

export default function CatalogPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data.services);
      } catch {
        console.error('Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 relative">
            <div className="graffiti-deco">LAYANAN</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; layanan kami</div>
              <h1 className="section-title">LAYANAN<br/>KAMI</h1>
              <div className="divider mx-auto"></div>
              <p className="section-sub mx-auto">
                Pilihan lengkap untuk kebutuhan sablon dan printing Anda dengan kualitas premium
              </p>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="py-20"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, index) => (
                <ScrollReveal key={service.id} direction="up" delay={index * 150}>
                  <div className="card-dark group">
                    <div className="font-heading text-[72px] absolute top-4 right-4 text-white opacity-[0.04] leading-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                        <ServiceIcon name={service.name} size={32} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-heading text-[32px] text-white tracking-[1px] mb-2">{service.name}</h2>
                        <p className="text-[#777] text-[13px] leading-[1.7] mb-4">{service.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray text-[11px] tracking-[1px] uppercase">Harga per pcs</p>
                            <p className="font-bold text-xl text-primary">
                              {service.pricing_type === 'tiered'
                                ? 'Mulai ' + formatRupiah(getMinPrice(service))
                                : formatRupiah(service.price_per_unit || service.base_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray text-[11px] tracking-[1px] uppercase">Minimum Order</p>
                            <p className="font-bold text-xl text-white">{service.minimum_order} pcs</p>
                          </div>
                        </div>

                        <Link
                          to={`/pesan?service=${service.id}`}
                          className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2 px-6 hover:bg-primary hover:text-white transition-colors no-underline text-[13px] uppercase tracking-[1px]"
                        >
                          Pesan Sekarang
                          <Icon name="arrow-right" size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}

          <ScrollReveal direction="blur">
            <div className="mt-16 bg-ink p-8 text-center">
              <h3 className="font-heading text-[28px] text-white tracking-[1px] mb-4">BUTUH BANTUAN MEMILIH LAYANAN?</h3>
              <p className="text-gray text-[14px] mb-6">Tim kami siap membantu Anda menemukan solusi terbaik</p>
              <a target='_blank' href="https://wa.me/6287877294587" className="btn-acid">
                Konsultasi via WhatsApp
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
