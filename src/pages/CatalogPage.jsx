import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Shirt, Printer, Sticker, Award, ArrowRight } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const serviceIcons = {
  'Sablon Kaos': Shirt,
  'Printing Banner': Printer,
  'Cetak Stiker': Sticker,
  'Bordir': Award,
};

export default function CatalogPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.services);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl font-bold mb-4">Layanan Kami</h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Pilihan lengkap untuk kebutuhan sablon dan printing Anda dengan kualitas premium dan harga terjangkau
            </p>
          </div>

          {loading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service) => {
                const Icon = serviceIcons[service.name] || Printer;
                return (
                  <div key={service.id} className="card">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-10 h-10 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-heading text-2xl font-bold mb-2">{service.name}</h2>
                        <p className="text-text-secondary mb-4">{service.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-text-secondary text-sm">Harga per pcs</p>
                            <p className="font-bold text-xl text-primary">
                              Rp {(service.price_per_unit || service.base_price).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-sm">Minimum Order</p>
                            <p className="font-bold text-xl">{service.minimum_order} pcs</p>
                          </div>
                        </div>

                        <Link
                          to={`/pesan?service=${service.id}`}
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          Pesan Sekarang
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 bg-primary/5 rounded-2xl p-8 text-center">
            <h3 className="font-heading text-2xl font-bold mb-4">Butuh bantuan dalam memilih layanan?</h3>
            <p className="text-text-secondary mb-6">Tim kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan Anda</p>
            <a href="https://wa.me/6281234567890" className="btn-primary inline-flex items-center gap-2">
              Konsultasi via WhatsApp
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}