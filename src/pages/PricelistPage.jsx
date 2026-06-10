import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ScrollReveal from '../components/ui/ScrollReveal';
import ServiceIcon from '../components/ui/ServiceIcons';
import Icon from '../components/ui/Icon';
import { formatRupiah } from '../utils/formatRupiah';

const colorMap = {
  Hitam: '#0A0A0A', Putih: '#FFFFFF', 'Abu-abu': '#888888', Navy: '#1a1a5c',
  Maroon: '#7a0000', Mocca: '#c9a96e', Lime: '#a8e600', Pink: '#ec4a96',
};

export default function PricelistPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data.services || []);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const renderOptions = (service) => {
    const options = service.options_config || {};
    const entries = Object.entries(options).filter(([k]) => k !== 'size_pricing');
    if (entries.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Opsi Tersedia</p>
        <div className="space-y-3">
          {entries.map(([key, items]) => (
            <div key={key}>
              <p className="text-gray text-[11px] tracking-[1px] uppercase mb-1.5">{key.replace(/_/g, ' ')}</p>
              <div className="flex flex-wrap gap-1.5">
                {key === 'colors' && Array.isArray(items) ? (
                  items.map((color) => (
                    <span key={color} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ink border border-border rounded-lg text-[12px] text-white">
                      <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: colorMap[color] || '#888' }} />
                      {color}
                    </span>
                  ))
                ) : Array.isArray(items) ? (
                  items.map((item) => (
                    <span key={item} className="px-2.5 py-1 bg-fire/10 text-fire text-[12px] font-semibold rounded-lg">{item}</span>
                  ))
                ) : typeof items === 'object' ? (
                  Object.entries(items).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[12px] font-semibold rounded-lg">
                      {k} <span className="text-gray text-[11px]">+{formatRupiah(v)}</span>
                    </span>
                  ))
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSizePricing = (service) => {
    const sizePricing = service.options_config?.size_pricing;
    if (!sizePricing || Object.keys(sizePricing).length === 0) return null;

    const basePrice = parseFloat(service.base_price) || 0;
    const sizes = service.options_config?.sizes || Object.keys(sizePricing);

    return (
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Harga per Ukuran</p>
        <div className="bg-ink rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Size</th>
                <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Harga/pcs</th>
                <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Surcharge</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => {
                const surcharge = parseInt(sizePricing[size]) || 0;
                const total = basePrice + surcharge;
                return (
                  <tr key={size} className="border-b border-border last:border-0 hover:bg-card transition-colors">
                    <td className="p-3 text-center">
                      <span className="bg-fire text-ink font-bold px-2.5 py-0.5 rounded text-[13px]">{size}</span>
                    </td>
                    <td className="p-3 text-center text-primary font-semibold">{formatRupiah(total)}</td>
                    <td className="p-3 text-center">
                      {surcharge > 0 ? (
                        <span className="text-amber text-[12px]">+{formatRupiah(surcharge)}</span>
                      ) : (
                        <span className="text-gray text-[12px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-16 relative">
            <div className="graffiti-deco">PRICE LIST</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; daftar harga</div>
              <h1 className="section-title">PRICE<br/>LIST</h1>
              <div className="divider mx-auto"></div>
              <p className="section-sub mx-auto">Harga berlaku untuk semua layanan sablon kami</p>
            </ScrollReveal>
          </div>

          {/* Services */}
          {loading ? (
            <div className="py-20"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="space-y-6">
              {services.filter(s => s.is_active).map((service, index) => (
                <ScrollReveal key={service.id} direction="up" delay={index * 120}>
                  <div className="card-dark group">
                    {/* Faded number */}
                    <div className="font-heading text-[80px] absolute top-2 right-4 text-white opacity-[0.04] leading-none select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="flex items-start gap-5">
                      {/* Icon */}
                      <div className="w-14 h-14 bg-primary flex items-center justify-center flex-shrink-0" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                        <ServiceIcon name={service.name} size={28} className="text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + Price */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h2 className="font-heading text-[28px] text-white tracking-[1px] leading-tight">{service.name}</h2>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-xl text-primary leading-tight">{formatRupiah(service.base_price)}</p>
                            {service.pricing_type === 'flat' && <p className="text-gray text-[11px]">/pcs</p>}
                          </div>
                        </div>

                        {/* Description */}
                        {service.description && (
                          <p className="text-[#777] text-[13px] leading-[1.6] mb-3">{service.description}</p>
                        )}

                        {/* Meta tags */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray text-[12px]">Min. <strong className="text-white">{service.minimum_order} pcs</strong></span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                            service.pricing_type === 'tiered' ? 'bg-fire/20 text-fire' : 'bg-primary/20 text-primary'
                          }`}>
                            {service.pricing_type === 'tiered' ? 'Tiered' : 'Flat'}
                          </span>
                        </div>

                        {/* Tiered Pricing Table */}
                        {service.pricing_type === 'tiered' && service.pricing_config && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Detail Harga</p>
                            <div className="bg-ink rounded-xl overflow-hidden">
                              <table className="w-full text-[13px]">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Jenis Sablon</th>
                                    <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Tier</th>
                                    <th className="text-center p-3 text-fire font-medium text-[11px] tracking-[1px] uppercase">Harga/pcs</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(service.pricing_config).flatMap(([type, prices]) => {
                                    const rows = [];
                                    if (prices.lusin_1) rows.push({ type, tier: '1 lusin (12 pcs)', price: prices.lusin_1 });
                                    if (prices.lusin_2_6) rows.push({ type, tier: '2-6 lusin (24-72 pcs)', price: prices.lusin_2_6 });
                                    if (prices.satuan) rows.push({ type, tier: 'Satuan (< 12 pcs)', price: prices.satuan });
                                    return rows;
                                  }).map(({ type, tier, price }, i) => (
                                    <tr key={i} className="border-b border-border last:border-0 hover:bg-card transition-colors">
                                      <td className="p-3 text-center text-white capitalize font-medium">{type}</td>
                                      <td className="p-3 text-center text-gray">{tier}</td>
                                      <td className="p-3 text-center text-primary font-semibold">{formatRupiah(price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Flat Pricing */}
                        {service.pricing_type === 'flat' && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="bg-ink rounded-xl p-4 flex items-center justify-between">
                              <span className="text-gray text-[13px]">Harga tetap per pcs</span>
                              <span className="text-primary font-bold text-lg">{formatRupiah(service.base_price)}</span>
                            </div>
                          </div>
                        )}

                        {/* Size Pricing (Kaos) */}
                        {renderSizePricing(service)}

                        {/* Options */}
                        {renderOptions(service)}

                        {/* CTA */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <Link
                            to={`/pesan?service=${service.id}`}
                            className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2 px-5 hover:bg-primary hover:text-white transition-colors no-underline text-[12px] uppercase tracking-[1px]"
                          >
                            Pesan Sekarang <Icon name="arrow-right" size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Catatan */}
          <ScrollReveal direction="blur">
            <div className="mt-12 bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-[22px] text-white tracking-[1px] mb-4">Catatan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: 'truck', text: 'Ongkos kirim Rp 15.000 untuk area Bekasi' },
                  { icon: 'credit-card', text: 'DP 50% diperlukan untuk memulai produksi' },
                  { icon: 'clock', text: 'Waktu produksi 3-7 hari kerja' },
                  { icon: 'alert-triangle', text: 'Harga dapat berubah sewaktu-waktu' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name={item.icon} size={16} className="text-fire" />
                    </div>
                    <p className="text-gray text-[13px] leading-[1.6]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal direction="blur">
            <div className="mt-12 bg-ink p-8 text-center">
              <h3 className="font-heading text-[28px] text-white tracking-[1px] mb-3">BUTUH KONSULTASI HARGA?</h3>
              <p className="text-gray text-[14px] mb-6">Hubungi kami untuk harga custom, partai besar, dan pertanyaan lainnya</p>
              <a target='_blank' href="https://wa.me/6287877294587" className="btn-acid">
                Chat via WhatsApp
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
