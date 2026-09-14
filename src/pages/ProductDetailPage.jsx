import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Icon from '../components/ui/Icon';
import { useToast } from '../components/ui/Toast';
import { useLanguageStore } from '../store/languageStore';
import { useCartStore } from '../store/cartStore';
import { useAuthModalStore } from '../store/authModalStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah } from '../utils/formatRupiah';
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t, td, language } = useLanguageStore();
  const isEn = language === 'en';

  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { openLogin } = useAuthModalStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then((res) => {
        const p = res.data.product;
        setProduct(p);
        if (p.sizes?.length > 0) setSelectedSize(p.sizes[0].name);
        if (p.colors?.length > 0) setSelectedColor(p.colors[0].name);
      })
      .catch(() => {
        toast.error(isEn ? 'Product not found' : 'Produk tidak ditemukan');
        navigate('/produk');
      })
      .finally(() => setLoading(false));
  }, [id, isEn]);

  const handleAddToCart = () => {
    if (!isAuthenticated) { openLogin(); return; }
    addItem(product, selectedSize, selectedColor, quantity);
    toast.success(isEn ? 'Added to cart!' : 'Ditambahkan ke keranjang!');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { openLogin(); return; }
    addItem(product, selectedSize, selectedColor, quantity);
    navigate('/keranjang');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120c16] text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.images || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const selectedSizeStock = sizes.find((s) => s.name === selectedSize)?.stock || product.stock;
  const outOfStock = selectedSizeStock <= 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />
      <main className="flex-1 py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                {td(product.category?.name || (isEn ? 'Product Details' : 'Detail Produk'))}
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-wide mb-3">{td(product.name)}</h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto" />
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Image Gallery */}
            <ScrollReveal>
              <div>
                <div className="glass-card border border-white/10 rounded-3xl overflow-hidden mb-4 aspect-square flex items-center justify-center bg-black/40 p-4">
                  <img
                    src={images[activeImage]?.image_url || 'https://placehold.co/600x600/333/888?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-contain max-h-full"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-black/20 ${
                          activeImage === i ? 'border-primary shadow-lg shadow-primary/25 scale-105' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img src={img.image_url} alt="" className="w-full h-full object-contain rounded-xl" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Product Info */}
            <ScrollReveal>
              <div>
                {/* Price + Stock */}
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-3xl sm:text-4xl font-bold text-gradient-primary">{formatRupiah(product.base_price)}</p>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    product.stock > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {product.stock > 0 ? (isEn ? `In Stock (${product.stock})` : `Stok Tersedia (${product.stock})`) : (isEn ? 'Out of Stock' : 'Stok Habis')}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="glass-card border border-white/10 rounded-3xl p-5 mb-5">
                    <p className="text-primary text-xs uppercase tracking-wider mb-2 font-bold">{t('productDetail.descTab', 'Deskripsi')}</p>
                    <p className="text-white/70 text-xs sm:text-sm leading-relaxed">{td(product.description)}</p>
                  </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="glass-card border border-white/10 rounded-3xl p-5 mb-5">
                    <p className="text-primary text-xs uppercase tracking-wider mb-3 font-bold">{t('productDetail.selectSize', 'Pilih Ukuran')}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {sizes.map((size) => (
                        <button
                          key={size.name}
                          type="button"
                          onClick={() => setSelectedSize(size.name)}
                          className={`min-w-[50px] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
                            selectedSize === size.name
                              ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                              : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/30'
                          } ${size.stock <= 0 ? 'opacity-30 cursor-not-allowed line-through' : ''}`}
                          disabled={size.stock <= 0}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {colors.length > 0 && (
                  <div className="glass-card border border-white/10 rounded-3xl p-5 mb-5">
                    <p className="text-primary text-xs uppercase tracking-wider mb-3 font-bold">{t('productDetail.selectColor', 'Pilih Warna')}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
                            selectedColor === color.name
                              ? 'border-primary bg-primary/15 text-white shadow-lg shadow-primary/20'
                              : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/30'
                          }`}
                        >
                          {color.hex_code && (
                            <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color.hex_code }} />
                          )}
                          {td(color.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="glass-card border border-white/10 rounded-3xl p-5 mb-6">
                  <p className="text-primary text-xs uppercase tracking-wider mb-3 font-bold">{t('productDetail.quantity', 'Jumlah')}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white"
                      >
                        <Minus size={15} />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 text-center text-base font-bold text-primary bg-transparent outline-none"
                        min={1}
                        max={selectedSizeStock}
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(selectedSizeStock, q + 1))}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <span className="text-white/50 text-xs">
                      {isEn ? 'Stock for this option:' : 'Stok untuk pilihan ini:'} <strong className="text-white">{selectedSizeStock} pcs</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={outOfStock}
                    className="btn-gradient-primary flex-1 py-4 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold disabled:opacity-50"
                  >
                    {outOfStock ? (isEn ? 'Out of Stock' : 'Stok Habis') : (isEn ? 'Buy Now' : 'Beli Sekarang')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    className="btn-glass flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold disabled:opacity-50"
                  >
                    <ShoppingCart size={16} /> {outOfStock ? (isEn ? 'Out of Stock' : 'Stok Habis') : (isEn ? '+ Cart' : '+ Keranjang')}
                  </button>
                </div>

                {/* Info Produk */}
                <div className="glass-card border border-white/10 rounded-3xl p-5 mb-6">
                  <p className="text-primary text-xs uppercase tracking-wider mb-3 font-bold">{isEn ? 'Product Information' : 'Informasi Produk'}</p>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-white/50">{t('productDetail.categoryPrefix', 'Kategori')}</span>
                      <span className="text-white font-medium">{td(product.category?.name || '-')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-white/50">{isEn ? 'Total Stock' : 'Total Stok'}</span>
                      <span className="text-white font-medium">{product.stock > 0 ? `${product.stock} pcs` : (isEn ? 'Out of Stock' : 'Habis')}</span>
                    </div>
                    {product.sizes?.length > 0 && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-white/50">{isEn ? 'Available Sizes' : 'Ukuran Tersedia'}</span>
                        <span className="text-white font-medium">{product.sizes.map(s => s.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Link */}
                <Link
                  to="/produk"
                  className="inline-flex items-center gap-2 text-white/50 hover:text-primary transition-colors text-xs font-semibold"
                >
                  <ChevronLeft size={16} /> {t('productDetail.backToCatalog', 'Kembali ke Katalog Produk')}
                </Link>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
