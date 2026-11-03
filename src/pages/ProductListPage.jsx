import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../constants/whatsapp';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ScrollReveal from '../components/ui/ScrollReveal';
import { formatRupiah } from '../utils/formatRupiah';
import { getImageUrl } from '../utils/getImageUrl';
import OptimizedImage from '../components/ui/OptimizedImage';

export default function ProductListPage() {
  const { t, td, language } = useLanguageStore();
  const isEn = language === 'en';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const activeCategory = searchParams.get('category_id') || '';
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => { setSearchInput(search); }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) handleFilter('search', searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page };
    if (activeCategory) params.category_id = activeCategory;
    if (search) params.search = search;
    api.get('/products', { params })
      .then((res) => {
        const data = res.data.products;
        setProducts(data.data || []);
        setPagination({
          current: data.current_page,
          total: data.last_page,
          hasMore: data.current_page < data.last_page,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, activeCategory, search]);

  const handleFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
    }`}>
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />
      <main className="flex-1 py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                {t('products.badge', 'Katalog Resmi')}
              </div>
              <h1 className={`font-heading text-3xl sm:text-4xl tracking-wide mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('products.title', 'KATALOG PRODUK')}</h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mb-3" />
              <p className={`text-xs sm:text-sm max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{t('products.subtitle', 'Produk eksklusif Dreamcatcher — kaos polos premium, apparel, dan merchandise sablon')}</p>
            </ScrollReveal>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
            <div className="relative sm:max-w-xs flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('products.searchPlaceholder', 'Cari produk...')}
                className="input-premium w-full pl-11 pr-4 py-3 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap shrink-0">
              <button
                onClick={() => handleFilter('category_id', '')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  !activeCategory
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                    : isLight
                    ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                {t('products.allCategories', 'Semua')}
              </button>
              {categories.map((cat) => {
                const isActive = activeCategory === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleFilter('category_id', cat.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                        : isLight
                        ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {td(cat.name)}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className={`text-center py-20 rounded-3xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-card border-white/10'
            }`}>
              <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{t('products.emptyTitle', 'Belum ada produk yang cocok dengan pencarian Anda')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {products.map((product, index) => (
                  <ScrollReveal key={product.id} direction="up" delay={index * 60}>
                    <Link
                      to={`/produk/${product.id}`}
                      className={`rounded-3xl overflow-hidden border transition-all duration-300 group no-underline flex flex-col h-full ${
                        isLight
                          ? 'bg-white border-slate-200/90 shadow-sm hover:border-primary/50 hover:shadow-md'
                          : 'glass-card-hover border-white/10 bg-white/[0.02] hover:border-primary/40'
                      }`}
                    >
                      <div className="aspect-square bg-black/40 overflow-hidden relative">
                        <OptimizedImage
                          src={product.images?.[0]?.image_url}
                          thumbnailSrc={product.images?.[0]?.thumbnail_url}
                          mediumSrc={product.images?.[0]?.medium_url}
                          variant="medium"
                          alt={product.name}
                          aspectRatio="aspect-square"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-md backdrop-blur-md ${
                            product.stock > 0
                              ? 'bg-black/80 text-emerald-400 border border-emerald-500/40 shadow-black/40'
                              : 'bg-black/80 text-rose-400 border border-rose-500/40 shadow-black/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
                            {product.stock > 0 ? (isEn ? `Stock ${product.stock}` : `Stok ${product.stock}`) : (isEn ? 'Out of Stock' : 'Habis')}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 sm:p-5 flex flex-col flex-1">
                        <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${
                          isLight ? 'text-slate-500' : 'text-white/40'
                        }`}>{td(product.category?.name || (isEn ? 'Product' : 'Produk'))}</p>
                        <h3 className={`font-heading text-base sm:text-lg tracking-wide mb-2 truncate group-hover:text-primary transition-colors ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>{td(product.name)}</h3>
                        <div className={`mt-auto pt-2 flex items-center justify-between border-t ${
                          isLight ? 'border-slate-100' : 'border-white/5'
                        }`}>
                          <p className="text-gradient-primary font-bold text-sm sm:text-base">{formatRupiah(product.base_price)}</p>
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>

              {pagination && pagination.total > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-glass px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider font-semibold disabled:opacity-30 transition-colors"
                  >
                    {t('products.prevPage', 'Sebelumnya')}
                  </button>
                  <span className="text-white/60 text-xs font-medium">
                    {pagination.current} / {pagination.total}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasMore}
                    className="btn-glass px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider font-semibold disabled:opacity-30 transition-colors"
                  >
                    {t('products.nextPage', 'Selanjutnya')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* WhatsApp Consultation Banner */}
          <div className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-emerald-500/[0.05] to-white/[0.04] p-6 sm:p-10 text-center backdrop-blur-xl relative overflow-hidden">
            <h3 className="font-heading text-xl sm:text-2xl text-white tracking-wide mb-2">
              {isEn ? 'NEED HELP CHOOSING APPAREL PRODUCTS?' : 'BINGUNG PILIH PRODUK & BAHAN KAOS?'}
            </h3>
            <p className="text-white/60 text-xs sm:text-sm mb-5 max-w-lg mx-auto leading-relaxed">
              {isEn
                ? 'Contact our team on WhatsApp for recommendations on fabric materials, sizes, stock availability, or wholesale discounts.'
                : 'Konsultasikan kebutuhan bahan, varian warna, panduan ukuran, atau potongan harga partai besar bersama CS kami.'}
            </p>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={getWhatsAppUrl('catalog')}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-green-500/25 transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
            >
              <MessageCircle size={16} />
              <span>{isEn ? 'Consult on WhatsApp' : 'Konsultasi Produk via WhatsApp'}</span>
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
