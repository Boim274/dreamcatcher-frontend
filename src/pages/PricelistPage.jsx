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
import { formatRupiah, getMinPrice } from '../utils/formatRupiah';

const colorMap = {
  Putih: '#FFFFFF', Hitam: '#000000', 'Abu Muda': '#D3D3D3', 'Abu Tua': '#555555',
  Merah: '#DC2626', 'Biru Dongker': '#1E3A5F', 'Biru Muda': '#3B82F6',
  Hijau: '#16A34A', Kuning: '#EAB308', Orange: '#F97316', Navy: '#172554',
  Maroon: '#7F1D1D', 'Biru Toska': '#0D9488', Lavender: '#A78BFA',
  Pink: '#EC4899', Cream: '#FEF3C7',
};

const optionLabels = {
  colors: 'Warna',
  purchase_methods: 'Pembelian',
  materials: 'Bahan',
  positions: 'Posisi',
  print_positions: 'Posisi Cetak',
  print_sizes: 'Ukuran Cetak',
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
    const hasSizePricing = options.size_pricing && Object.keys(options.size_pricing).length > 0;
    const entries = Object.entries(options).filter(([k]) => {
      if (['size_pricing', 'sablon_types', 'max_print_areas', 'area_surcharge'].includes(k)) return false;
      if (k === 'sizes' && hasSizePricing) return false;
      return true;
    });
    if (entries.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-fire text-[10px] tracking-[1px] uppercase mb-2 font-medium">Opsi Tersedia</p>
        <div className="space-y-2">
          {entries.slice(0, 3).map(([key, items]) => {
            const label = optionLabels[key] || key.replace(/_/g, ' ');
            return (
              <div key={key}>
                <p className="text-gray text-[9px] tracking-[0.5px] uppercase mb-1">{label}</p>
                <div className="flex flex-wrap gap-1">
                  {key === 'colors' && Array.isArray(items) ? (
                    items.slice(0, 6).map((color) => (
                      <span key={color} className="inline-flex items-center gap-1 px-2 py-0.5 bg-ink border border-border/50 rounded text-[11px] text-white">
                        <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: colorMap[color] || '#888' }} />
                        {color}
                      </span>
                    ))
                  ) : Array.isArray(items) ? (
                    items.slice(0, 6).map((item, idx) => {
                      const isObj = typeof item === 'object' && item !== null;
                      const v = isObj ? item.label : item;
                      return (
                        <span key={idx} className="px-2 py-0.5 bg-fire/10 text-fire text-[11px] font-medium rounded">{v}</span>
                      );
                    })
                  ) : typeof items === 'object' ? (
                    Object.entries(items).slice(0, 6).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-medium rounded">
                        {k} <span className="text-gray text-[10px]">+{formatRupiah(v)}</span>
                      </span>
                    ))
                  ) : null}
                </div>
              </div>
            );
          })}
          {entries.some(([, items]) => Array.isArray(items) && items.length > 6) && (
            <p className="text-gray text-[10px]">+ lainnya</p>
          )}
        </div>
      </div>
    );
  };

  const renderPricingChips = (service) => {
    if (service.pricing_type === 'flat') {
      return (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-fire text-[10px] tracking-[1px] uppercase mb-2 font-medium">Harga</p>
          <div className="flex items-center justify-between bg-ink rounded-lg px-3 py-2 border border-border/50">
            <span className="text-gray text-[12px]">Harga tetap per pcs</span>
            <span className="text-primary font-bold text-[15px]">{formatRupiah(service.base_price)}</span>
          </div>
        </div>
      );
    }

    const config = service.pricing_config || {};
    const entries = Object.entries(config);
    if (entries.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-fire text-[10px] tracking-[1px] uppercase mb-2 font-medium">Harga per Jenis Sablon</p>
        <div className="grid grid-cols-2 gap-1.5">
          {entries.map(([type, prices]) => {
            const tiers = [];
            if (prices.lusin_2_6) tiers.push({ label: '2-6 lsn', price: prices.lusin_2_6 });
            if (prices.lusin_1) tiers.push({ label: '1 lsn', price: prices.lusin_1 });
            if (prices.satuan) tiers.push({ label: 'satuan', price: prices.satuan });
            if (tiers.length === 0) return null;
            return (
              <div key={type} className="bg-ink border border-border/50 rounded-lg p-2.5 space-y-1">
                <p className="text-fire text-[10px] font-bold uppercase tracking-[0.5px]">{type}</p>
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray text-[10px]">{t.label}</span>
                    <span className="text-primary font-bold text-[12px]">{formatRupiah(t.price)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSizeChips = (service) => {
    const sizePricing = service.options_config?.size_pricing;
    if (!sizePricing || Object.keys(sizePricing).length === 0) return null;

    const minPrice = getMinPrice(service);
    const basePrice = minPrice || parseFloat(service.base_price) || 0;
    const sizes = service.options_config?.sizes || Object.keys(sizePricing);

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-fire text-[10px] tracking-[1px] uppercase mb-2 font-medium">Harga per Ukuran</p>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => {
            const surcharge = parseInt(sizePricing[size]) || 0;
            const total = basePrice + surcharge;
            return (
              <div key={size} className="bg-ink border border-border/50 rounded-lg px-2.5 py-1.5 flex items-center gap-2 min-w-[80px]">
                <span className="bg-fire text-ink font-bold text-[10px] px-1.5 py-0.5 rounded">{size}</span>
                <span className="text-primary font-semibold text-[12px]">{formatRupiah(total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="graffiti-deco">PRICE LIST</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; daftar harga</div>
              <h1 className="section-title">PRICE<br/>LIST</h1>
              <div className="divider mx-auto"></div>
              <p className="section-sub mx-auto">Harga berlaku untuk semua layanan sablon kami</p>
            </ScrollReveal>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="py-20"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {services.filter(s => s.is_active).map((service, index) => {
                    const minPrice = getMinPrice(service);
                    return (
                <ScrollReveal key={service.id} direction="up" delay={index * 100}>
                  <div className="bg-card border border-border rounded-xl p-5 relative hover:border-primary/30 transition-colors group h-full flex flex-col">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary flex items-center justify-center flex-shrink-0" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                        <ServiceIcon name={service.name} size={22} className="text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="font-heading text-[20px] text-white tracking-[0.5px] leading-tight">{service.name}</h2>
                          <div className="text-right flex-shrink-0">
                            {service.pricing_type === 'tiered' && minPrice ? (
                              <>
                                <p className="font-bold text-lg text-primary leading-tight">Mulai {formatRupiah(minPrice)}</p>
                                <p className="text-gray text-[10px]">/pcs (tergantung qty)</p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-lg text-primary leading-tight">{formatRupiah(service.base_price)}</p>
                                <p className="text-gray text-[10px]">/pcs</p>
                              </>
                            )}
                          </div>
                        </div>

                        {service.description && (
                          <p className="text-[#777] text-[12px] leading-[1.5] mt-1 line-clamp-2">{service.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray text-[11px]">Min. <strong className="text-white">{service.minimum_order} pcs</strong></span>
                          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded uppercase ${
                            service.pricing_type === 'tiered' ? 'bg-fire/20 text-fire' : 'bg-primary/20 text-primary'
                          }`}>
                            {service.pricing_type === 'tiered' ? 'Tiered' : 'Flat'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1">
                      {renderPricingChips(service)}
                      {renderSizeChips(service)}
                      {renderOptions(service)}
                    </div>

                    {/* CTA */}
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <Link
                        to={`/pesan?service=${service.id}`}
                        className="inline-flex items-center gap-1.5 border-2 border-primary text-primary font-semibold py-1.5 px-4 hover:bg-primary hover:text-white transition-colors no-underline text-[11px] uppercase tracking-[1px] rounded-lg"
                      >
                        Pesan <Icon name="arrow-right" size={12} />
                      </Link>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
              </div>
          )}

          {/* Catatan */}
          <ScrollReveal direction="blur">
            <div className="mt-12 bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-[22px] text-white tracking-[1px] mb-4">Catatan</h3>
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: 'truck', text: 'Ongkos kirim Rp 15.000 untuk area Bekasi' },
                  { icon: 'credit-card', text: 'DP 50% diperlukan untuk memulai produksi' },
                  { icon: 'clock', text: 'Waktu produksi 3-7 hari kerja' },
                  { icon: 'alert-triangle', text: 'Harga dapat berubah sewaktu-waktu' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} size={18} className="text-fire" />
                    </div>
                    <p className="text-gray text-[14px] leading-[1.6]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal direction="blur">
            <div className="mt-12 bg-ink p-8 text-center rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h3 className="font-heading text-[24px] sm:text-[28px] text-white tracking-[1px] mb-3">BUTUH KONSULTASI HARGA?</h3>
                <p className="text-gray text-[14px]">Hubungi kami untuk harga custom, partai besar, dan pertanyaan lainnya</p>
              </div>
              <a
                target="_blank"
                href="https://wa.me/6287877294587"
                className="btn-acid px-6 py-3 text-[14px] sm:text-[16px]"
              >
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
