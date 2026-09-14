import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { useLanguageStore } from '../store/languageStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah } from '../utils/formatRupiah';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Trash2, Minus, Plus, ShoppingBag, ChevronLeft,
  User, Mail, Phone, MapPin, Truck, FileText
} from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t, td, language } = useLanguageStore();
  const isEn = language === 'en';

  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [customerData, setCustomerData] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    delivery_method: 'pickup',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const subtotal = getSubtotal();
  const shipping = customerData.delivery_method === 'delivery' ? 15000 : 0;
  const total = subtotal + shipping;

  const handleSubmit = async () => {
    if (!customerData.customer_name || !customerData.customer_email || !customerData.phone) {
      toast.warning(isEn ? 'Please complete buyer details' : 'Lengkapi data pembeli');
      return;
    }
    if (customerData.delivery_method === 'delivery' && !customerData.address) {
      toast.warning(isEn ? 'Please fill in shipping address' : 'Isi alamat pengiriman');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...customerData,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          size: i.size || null,
          color: i.color || null,
        })),
      };
      const res = await api.post('/product-orders', payload);
      clearCart();
      toast.success(isEn ? 'Order created successfully!' : 'Pesanan berhasil dibuat!');
      navigate(`/pesan/pembayaran/${res.data.order.order_code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || (isEn ? 'Failed to create order' : 'Gagal membuat pesanan'));
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const confirmMessage = (
    <div className="text-left space-y-3">
      <div className="space-y-1 text-[13px]">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-white">{td(item.product.name)} x{item.quantity}</span>
            <span className="text-primary">{formatRupiah(parseFloat(item.product.base_price) * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3 space-y-1 text-[13px]">
        <div className="flex justify-between"><span className="text-gray">{t('cart.subtotal', 'Subtotal')}</span><span className="text-white">{formatRupiah(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-gray">{t('cart.shippingFee', 'Ongkir')}</span><span className="text-white">{shipping > 0 ? formatRupiah(shipping) : (isEn ? 'Free' : 'Gratis')}</span></div>
        <div className="flex justify-between border-t border-border pt-2"><span className="text-white font-bold">{t('cart.total', 'Total')}</span><span className="text-primary font-bold">{formatRupiah(total)}</span></div>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
        <Navbar />
        <main className="flex-1 py-16 sm:py-24 relative z-10">
          <div className="max-w-xl mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <ShoppingBag size={36} className="text-primary" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-wide mb-2">
              {isEn ? 'CART' : 'KERANJANG'} <span className="text-gradient">{isEn ? 'EMPTY' : 'KOSONG'}</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              {isEn
                ? 'Your cart is currently empty. Explore our custom screen printing and merchandise catalog now!'
                : 'Anda belum menambahkan produk ke keranjang. Jelajahi katalog layanan sablon dan produk kustom kami sekarang!'}
            </p>
            <Link
              to="/pesan"
              className="btn-gradient-primary inline-flex items-center gap-2.5 py-3.5 px-8 rounded-full text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25"
            >
              {isEn ? 'Start Order Now' : 'Mulai Pesan Sekarang'} <ChevronLeft size={16} className="rotate-180" />
            </Link>
          </div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-12 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-10 sm:mb-12 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold tracking-[2px] uppercase mb-4 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {isEn ? 'Your Shopping Cart' : 'Keranjang Belanja Anda'}
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl text-white tracking-wide">
                {isEn ? 'PRODUCT' : 'KERANJANG'} <span className="text-gradient">{isEn ? 'CART' : 'PRODUK'}</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                {items.length} {isEn ? 'item types ready to process' : 'jenis item siap diproses'}
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Items Column */}
            <div className="lg:col-span-2 space-y-4">
              <ScrollReveal>
                {items.map((item, index) => {
                  const itemSubtotal = parseFloat(item.product.base_price) * item.quantity;
                  return (
                    <div key={index} className="glass-card rounded-2xl p-4 sm:p-5 flex gap-4 items-center">
                      <Link to={`/produk/${item.product.id}`} className="w-20 h-20 bg-black/40 border border-white/10 rounded-xl overflow-hidden shrink-0 block">
                        <img
                          src={item.product.images?.[0]?.image_url || 'https://placehold.co/200x200/333/888?text=No+Image'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to={`/produk/${item.product.id}`} className="text-white font-bold hover:text-primary transition-colors text-sm sm:text-base truncate block">
                              {td(item.product.name)}
                            </Link>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {item.size && <span className="text-gray-400 text-xs">{isEn ? 'Size' : 'Ukuran'}: <strong className="text-white">{item.size}</strong></span>}
                              {item.color && <span className="text-gray-400 text-xs">{isEn ? 'Color' : 'Warna'}: <strong className="text-white">{td(item.color)}</strong></span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1.5 rounded-xl hover:bg-pink-500/20 text-gray-400 hover:text-pink-400 transition-colors shrink-0"
                            title={isEn ? 'Remove' : 'Hapus'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center border border-white/10 rounded-lg hover:border-primary transition-colors text-white"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-white text-sm font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center border border-white/10 rounded-lg hover:border-primary transition-colors text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-[11px]">{formatRupiah(item.product.base_price)} /pcs</p>
                            <p className="text-primary font-bold text-sm sm:text-base">{formatRupiah(itemSubtotal)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ScrollReveal>

              <ScrollReveal>
                <Link
                  to="/produk"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-semibold mt-4"
                >
                  <ChevronLeft size={16} /> {isEn ? 'Continue Shopping Other Products' : 'Lanjut Belanja Produk Lain'}
                </Link>
              </ScrollReveal>
            </div>

            {/* Checkout Panel */}
            <div className="space-y-4">
              <ScrollReveal>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl">
                  <h3 className="font-heading text-xl text-white tracking-wide mb-5 pb-3 border-b border-white/10">
                    {t('cart.summary', 'Ringkasan Checkout')}
                  </h3>

                  <div className="space-y-4">

                    {/* Data Pembeli */}
                    <div>
                      <p className="text-primary text-[10px] uppercase tracking-[1.5px] mb-2.5 font-bold flex items-center gap-1.5">
                        <User size={12} /> {t('cart.buyerInfo', 'Data Pembeli')}
                      </p>
                      <div className="space-y-2">
                        <div className="bg-black/30 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-[9px] uppercase tracking-wider">{t('cart.name', 'Nama')}</p>
                            <p className="text-white text-xs font-semibold truncate">{customerData.customer_name || '-'}</p>
                          </div>
                        </div>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                            <Mail size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-[9px] uppercase tracking-wider">{t('cart.email', 'Email')}</p>
                            <p className="text-white text-xs font-semibold truncate">{customerData.customer_email || '-'}</p>
                          </div>
                        </div>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                            <Phone size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-[9px] uppercase tracking-wider">{t('cart.phone', 'No. WhatsApp')}</p>
                            <p className="text-white text-xs font-semibold truncate">{customerData.phone || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pengiriman */}
                    <div>
                      <p className="text-primary text-[10px] uppercase tracking-[1.5px] mb-2.5 font-bold flex items-center gap-1.5">
                        <Truck size={12} /> {t('cart.deliveryMethod', 'Metode Pengiriman')}
                      </p>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setCustomerData((d) => ({ ...d, delivery_method: 'pickup' }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            customerData.delivery_method === 'pickup'
                              ? 'border-primary bg-primary/20 text-white shadow-md shadow-primary/20'
                              : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
                          }`}
                        >
                          <MapPin size={13} className="shrink-0" /> {t('cart.pickup', 'Ambil Sendiri')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerData((d) => ({ ...d, delivery_method: 'delivery' }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            customerData.delivery_method === 'delivery'
                              ? 'border-primary bg-primary/20 text-white shadow-md shadow-primary/20'
                              : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
                          }`}
                        >
                          <Truck size={13} className="shrink-0" /> {t('cart.delivery', 'Dikirim (+15k)')}
                        </button>
                      </div>
                      {customerData.delivery_method === 'delivery' && (
                        <div className="relative mt-2">
                          <MapPin size={15} className="absolute left-3.5 top-3.5 text-primary pointer-events-none shrink-0" />
                          <textarea
                            placeholder={isEn ? 'Complete Shipping Address *' : 'Alamat Lengkap Pengiriman *'}
                            value={customerData.address}
                            onChange={(e) => setCustomerData((d) => ({ ...d, address: e.target.value }))}
                            className="input-premium pl-11 resize-none text-xs"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>

                    {/* Catatan */}
                    <div>
                      <p className="text-primary text-[10px] uppercase tracking-[1.5px] mb-2 font-bold flex items-center gap-1.5">
                        <FileText size={12} /> {t('cart.notes', 'Catatan Pesanan')}
                      </p>
                      <textarea
                        placeholder={isEn ? 'Additional notes (optional)' : 'Catatan tambahan (opsional)'}
                        value={customerData.notes}
                        onChange={(e) => setCustomerData((d) => ({ ...d, notes: e.target.value }))}
                        className="input-premium resize-none text-xs"
                        rows={2}
                      />
                    </div>

                    {/* Totals */}
                    <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-300">
                        <span>{t('cart.subtotal', 'Subtotal')} ({items.reduce((s, i) => s + i.quantity, 0)} pcs)</span>
                        <span className="font-semibold text-white">{formatRupiah(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>{t('cart.shippingFee', 'Ongkos Kirim')}</span>
                        <span className="font-semibold text-white">{shipping > 0 ? formatRupiah(shipping) : (isEn ? 'Free' : 'Gratis')}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-dashed border-white/15 pt-3">
                        <span className="text-white font-bold text-sm">{t('cart.total', 'Total')}</span>
                        <span className="text-primary font-heading text-xl tracking-wide">{formatRupiah(total)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowConfirm(true)}
                      disabled={submitting}
                      className="w-full btn-gradient-primary py-3.5 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                      {submitting ? (isEn ? 'Processing...' : 'Memproses...') : t('cart.proceedPayment', 'Lanjut ke Pembayaran')}
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title={isEn ? 'Confirm Order' : 'Konfirmasi Pesanan'}
        message={confirmMessage}
        confirmLabel={submitting ? (isEn ? 'Processing...' : 'Memproses...') : (isEn ? 'Confirm' : 'Konfirmasi')}
        cancelLabel={isEn ? 'Cancel' : 'Batal'}
        loading={submitting}
      />

      <Footer />
      <ScrollToTop />
    </div>
  );
}
