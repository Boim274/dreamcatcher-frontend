import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ScrollReveal from '../components/ui/ScrollReveal';
import { formatRupiah } from '../utils/formatRupiah';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const activeCategory = searchParams.get('category_id') || '';
  const search = searchParams.get('search') || '';

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
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="graffiti-deco">PRODUK</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; katalog produk</div>
              <h1 className="section-title">PRODUK</h1>
              <div className="divider mx-auto"></div>
              <p className="section-sub mx-auto">Produk eksklusif Dreamcatcher — kaos, merch, dan aksesoris</p>
            </ScrollReveal>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => handleFilter('category_id', '')}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-[1px] transition-colors ${
                !activeCategory ? 'bg-primary text-ink' : 'bg-card border border-border text-gray hover:text-white'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleFilter('category_id', cat.id)}
                className={`px-4 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-[1px] transition-colors ${
                  activeCategory === String(cat.id) ? 'bg-primary text-ink' : 'bg-card border border-border text-gray hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20"><LoadingSpinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray text-[16px]">Belum ada produk tersedia</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <ScrollReveal key={product.id} direction="up" delay={index * 60}>
                    <Link to={`/produk/${product.id}`} className="block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group no-underline">
                      <div className="aspect-square bg-ink overflow-hidden">
                        <img
                          src={product.images?.[0]?.image_url || 'https://placehold.co/400x400/333/888?text=No+Image'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-gray text-[10px] uppercase tracking-[1px] mb-1">{product.category?.name || 'Produk'}</p>
                        <h3 className="font-heading text-[18px] text-white tracking-[0.5px] mb-2 truncate">{product.name}</h3>
                        <p className="text-primary font-bold text-[16px]">{formatRupiah(product.base_price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-fire/20 text-fire'
                          }`}>
                            {product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>

              {pagination && pagination.total > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 border border-border rounded-lg text-gray hover:text-white disabled:opacity-30 transition-colors text-[12px] uppercase tracking-[1px]"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-gray text-[13px]">
                    {pagination.current} / {pagination.total}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasMore}
                    className="px-4 py-2 border border-border rounded-lg text-gray hover:text-white disabled:opacity-30 transition-colors text-[12px] uppercase tracking-[1px]"
                  >
                    Selanjutnya
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
