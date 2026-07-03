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
import { useCartStore } from '../store/cartStore';
import { useAuthModalStore } from '../store/authModalStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah } from '../utils/formatRupiah';
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();

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
        toast.error('Produk tidak ditemukan');
        navigate('/produk');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) { openModal(); return; }
    addItem(product, selectedSize, selectedColor, quantity);
    toast.success('Ditambahkan ke keranjang!');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { openModal(); return; }
    addItem(product, selectedSize, selectedColor, quantity);
    navigate('/keranjang');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
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
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="graffiti-deco">DETAIL</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; {product.category?.name || 'produk'}</div>
              <h1 className="section-title">{product.name}</h1>
              <div className="divider mx-auto"></div>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Image Gallery */}
            <ScrollReveal>
              <div>
                <div className="bg-ink border border-border rounded-xl overflow-hidden mb-4 aspect-square">
                  <img
                    src={images[activeImage]?.image_url || 'https://placehold.co/600x600/333/888?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                          activeImage === i ? 'border-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
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
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-primary font-bold text-[28px]">{formatRupiah(product.base_price)}</p>
                  <span className={`px-3 py-1 text-[11px] font-semibold rounded-lg ${
                    product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-fire/20 text-fire'
                  }`}>
                    {product.stock > 0 ? `Stok: ${product.stock}` : 'Stok Habis'}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="bg-card border border-border rounded-lg p-4 mb-6">
                    <p className="text-fire text-[11px] uppercase tracking-[1px] mb-2 font-medium">Deskripsi</p>
                    <p className="text-gray-light text-[13px] leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="bg-card border border-border/50 rounded-lg p-4 mb-4">
                    <p className="text-fire text-[11px] uppercase tracking-[1px] mb-3 font-medium">Ukuran</p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size.name)}
                          className={`min-w-[48px] px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            selectedSize === size.name
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-white hover:border-primary/50'
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
                  <div className="bg-card border border-border/50 rounded-lg p-4 mb-4">
                    <p className="text-fire text-[11px] uppercase tracking-[1px] mb-3 font-medium">Warna</p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedColor === color.name
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-white hover:border-primary/50'
                          }`}
                        >
                          {color.hex_code && (
                            <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: color.hex_code }} />
                          )}
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="bg-card border border-border/50 rounded-lg p-4 mb-6">
                  <p className="text-fire text-[11px] uppercase tracking-[1px] mb-3 font-medium">Jumlah</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Minus size={16} className="text-white" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center text-lg font-bold text-primary bg-transparent border-b-2 border-border focus:border-primary outline-none"
                      min={1}
                      max={selectedSizeStock}
                    />
                    <button
                      onClick={() => setQuantity((q) => Math.min(selectedSizeStock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                    <span className="text-gray text-[12px]">
                      Stok: <strong className="text-white">{selectedSizeStock}</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={outOfStock}
                    className="flex-1 bg-primary text-ink font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[14px] uppercase tracking-[1px] disabled:opacity-50"
                  >
                    {outOfStock ? 'Stok Habis' : 'Beli Sekarang'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    className="flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-ink transition-colors text-[14px] uppercase tracking-[1px] disabled:opacity-50"
                  >
                    <ShoppingCart size={18} /> + Keranjang
                  </button>
                </div>

                {/* Info Produk */}
                <div className="bg-card border border-border rounded-lg p-4 mt-6">
                  <p className="text-fire text-[11px] uppercase tracking-[1px] mb-3 font-medium">Informasi Produk</p>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-gray">Kategori</span>
                      <span className="text-white">{product.category?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">Stok</span>
                      <span className="text-white">{product.stock > 0 ? `${product.stock} pcs` : 'Habis'}</span>
                    </div>
                    {product.sizes?.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray">Ukuran</span>
                        <span className="text-white">{product.sizes.map(s => s.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Link */}
                <Link
                  to="/produk"
                  className="inline-flex items-center gap-2 text-gray hover:text-primary transition-colors text-[13px] mt-6"
                >
                  <ChevronLeft size={16} /> Kembali ke Produk
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
