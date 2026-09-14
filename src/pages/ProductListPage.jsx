import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { useLanguageStore } from '../store/languageStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ScrollReveal from '../components/ui/ScrollReveal';
import { formatRupiah } from '../utils/formatRupiah';
import { getImageUrl } from '../utils/getImageUrl';

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

  return (
    <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden selection:bg-primary selection:text-white">
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
              <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-wide mb-3">{t('products.title', 'KATALOG PRODUK')}</h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mb-3" />
              <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto">{t('products.subtitle', 'Produk eksklusif Dreamcatcher — kaos polos premium, apparel, dan merchandise sablon')}</p>
            </ScrollReveal>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleFilter('category_id', '')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  !activeCategory
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
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
                    className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isActive
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
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
            <div className="text-center py-20 glass-card rounded-3xl border border-white/10">
              <p className="text-white/60 text-sm">{t('products.emptyTitle', 'Belum ada produk yang cocok dengan pencarian Anda')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product, index) => (
                  <ScrollReveal key={product.id} direction="up" delay={index * 60}>
                    <Link
                      to={`/produk/${product.id}`}
                      className="glass-card-hover rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-primary/40 transition-all duration-300 group no-underline flex flex-col h-full"
                    >
                      <div className="aspect-square bg-black/40 overflow-hidden relative">
                        <img
                          src={getImageUrl(product.images?.[0]?.image_url || '')}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-md ${
                            product.stock > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {product.stock > 0 ? (isEn ? `Stock ${product.stock}` : `Stok ${product.stock}`) : (isEn ? 'Out of Stock' : 'Habis')}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1">{td(product.category?.name || (isEn ? 'Product' : 'Produk'))}</p>
                        <h3 className="font-heading text-lg text-white tracking-wide mb-2 truncate group-hover:text-primary transition-colors">{td(product.name)}</h3>
                        <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/5">
                          <p className="text-gradient-primary font-bold text-base">{formatRupiah(product.base_price)}</p>
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
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
