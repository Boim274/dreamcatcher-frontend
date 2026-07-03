import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
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
      toast.warning('Lengkapi data pembeli');
      return;
    }
    if (customerData.delivery_method === 'delivery' && !customerData.address) {
      toast.warning('Isi alamat pengiriman');
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
      toast.success('Pesanan berhasil dibuat!');
      navigate(`/pesan/pembayaran/${res.data.order.order_code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
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
            <span className="text-white">{item.product.name} x{item.quantity}</span>
            <span className="text-primary">{formatRupiah(parseFloat(item.product.base_price) * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3 space-y-1 text-[13px]">
        <div className="flex justify-between"><span className="text-gray">Subtotal</span><span className="text-white">{formatRupiah(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-gray">Ongkir</span><span className="text-white">{shipping > 0 ? formatRupiah(shipping) : 'Gratis'}</span></div>
        <div className="flex justify-between border-t border-border pt-2"><span className="text-white font-bold">Total</span><span className="text-primary font-bold">{formatRupiah(total)}</span></div>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 relative">
              <div className="graffiti-deco">KOSONG</div>
              <ScrollReveal>
                <div className="section-tag">&mdash; keranjang belanja</div>
                <h1 className="section-title">KERANJANG<br/>KOSONG</h1>
                <div className="divider mx-auto"></div>
                <p className="section-sub mx-auto">Belum ada produk di keranjang</p>
              </ScrollReveal>
            </div>
            <div className="text-center">
              <Link to="/produk" className="btn-acid px-6 py-3 text-[14px] inline-flex items-center gap-2">
                <ShoppingBag size={18} /> Lihat Produk
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="graffiti-deco">BELANJA</div>
            <ScrollReveal>
              <div className="section-tag">&mdash; keranjang belanja</div>
              <h1 className="section-title">KERANJANG</h1>
              <div className="divider mx-auto"></div>
              <p className="section-sub mx-auto">{items.length} item dalam keranjang</p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Items Column */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal>
                {items.map((item, index) => {
                  const itemSubtotal = parseFloat(item.product.base_price) * item.quantity;
                  return (
                    <div key={index} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                      <Link to={`/produk/${item.product.id}`} className="w-20 h-20 bg-ink rounded-lg overflow-hidden flex-shrink-0 block">
                        <img
                          src={item.product.images?.[0]?.image_url || 'https://placehold.co/200x200/333/888?text=No+Image'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to={`/produk/${item.product.id}`} className="text-white font-semibold hover:text-primary transition-colors text-[14px] no-underline leading-snug block truncate">
                              {item.product.name}
                            </Link>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {item.size && <span className="text-gray text-[11px]">Ukuran: <span className="text-white">{item.size}</span></span>}
                              {item.color && <span className="text-gray text-[11px]">Warna: <span className="text-white">{item.color}</span></span>}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 rounded-lg hover:bg-fire/10 text-gray hover:text-fire transition-colors flex-shrink-0"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center border border-border rounded hover:border-primary transition-colors"
                            >
                              <Minus size={11} className="text-white" />
                            </button>
                            <span className="w-8 text-center text-white text-[14px] font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center border border-border rounded hover:border-primary transition-colors"
                            >
                              <Plus size={11} className="text-white" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-gray text-[11px]">{formatRupiah(item.product.base_price)} /pcs</p>
                            <p className="text-primary font-bold text-[14px]">{formatRupiah(itemSubtotal)}</p>
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
                  className="inline-flex items-center gap-2 text-gray hover:text-primary transition-colors text-[13px] mt-6"
                >
                  <ChevronLeft size={16} /> Lanjut Belanja
                </Link>
              </ScrollReveal>
            </div>

            {/* Checkout Panel */}
            <div className="space-y-4">
              <ScrollReveal>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-heading text-[20px] text-white tracking-[1px] mb-4">Ringkasan</h3>

                  <div className="space-y-4">

                    {/* Data Pembeli */}
                    <div>
                      <p className="text-fire text-[10px] uppercase tracking-[1px] mb-2.5 font-medium flex items-center gap-1.5">
                        <User size={12} /> Data Pembeli
                      </p>
                      <div className="space-y-2">
                        <div className="bg-ink border border-border rounded-lg px-3 py-2.5 flex items-center gap-3">
                          <User size={14} className="text-gray flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray text-[10px] uppercase tracking-[0.5px]">Nama</p>
                            <p className="text-white text-[13px] font-medium truncate">{customerData.customer_name}</p>
                          </div>
                        </div>
                        <div className="bg-ink border border-border rounded-lg px-3 py-2.5 flex items-center gap-3">
                          <Mail size={14} className="text-gray flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray text-[10px] uppercase tracking-[0.5px]">Email</p>
                            <p className="text-white text-[13px] font-medium truncate">{customerData.customer_email}</p>
                          </div>
                        </div>
                        <div className="bg-ink border border-border rounded-lg px-3 py-2.5 flex items-center gap-3">
                          <Phone size={14} className="text-gray flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray text-[10px] uppercase tracking-[0.5px]">No. HP</p>
                            <p className="text-white text-[13px] font-medium truncate">{customerData.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pengiriman */}
                    <div>
                      <p className="text-fire text-[10px] uppercase tracking-[1px] mb-2.5 font-medium flex items-center gap-1.5">
                        <Truck size={12} /> Pengiriman
                      </p>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setCustomerData((d) => ({ ...d, delivery_method: 'pickup' }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 text-[11px] font-semibold uppercase tracking-[1px] transition-colors ${
                            customerData.delivery_method === 'pickup'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-gray hover:text-white'
                          }`}
                        >
                          <MapPin size={13} /> Ambil
                        </button>
                        <button
                          onClick={() => setCustomerData((d) => ({ ...d, delivery_method: 'delivery' }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 text-[11px] font-semibold uppercase tracking-[1px] transition-colors ${
                            customerData.delivery_method === 'delivery'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-gray hover:text-white'
                          }`}
                        >
                          <Truck size={13} /> Kirim
                        </button>
                      </div>
                      {customerData.delivery_method === 'delivery' && (
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-3 text-gray pointer-events-none" />
                          <textarea
                            placeholder="Alamat Lengkap *"
                            value={customerData.address}
                            onChange={(e) => setCustomerData((d) => ({ ...d, address: e.target.value }))}
                            className="w-full bg-ink border border-border rounded-lg pl-9 pr-3 py-2.5 text-white text-[13px] focus:border-primary outline-none resize-none placeholder:text-gray-dark"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>

                    {/* Catatan */}
                    <div>
                      <p className="text-fire text-[10px] uppercase tracking-[1px] mb-2.5 font-medium flex items-center gap-1.5">
                        <FileText size={12} /> Catatan
                      </p>
                      <textarea
                        placeholder="Catatan tambahan (opsional)"
                        value={customerData.notes}
                        onChange={(e) => setCustomerData((d) => ({ ...d, notes: e.target.value }))}
                        className="w-full bg-ink border border-border rounded-lg px-3 py-2.5 text-white text-[13px] focus:border-primary outline-none resize-none placeholder:text-gray-dark"
                        rows={2}
                      />
                    </div>

                    {/* Totals */}
                    <div className="border-t border-border pt-4 space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-gray">Subtotal</span>
                        <span className="text-white font-semibold">{formatRupiah(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray">Ongkos Kirim</span>
                        <span className="text-white font-semibold">{shipping > 0 ? formatRupiah(shipping) : 'Gratis'}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="text-white font-bold">Total</span>
                        <span className="text-primary font-bold text-[16px]">{formatRupiah(total)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={submitting}
                      className="w-full bg-primary text-ink font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px] disabled:opacity-50"
                    >
                      {submitting ? 'Memproses...' : 'Buat Pesanan'}
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
        title="Konfirmasi Pesanan"
        message={confirmMessage}
        confirmLabel={submitting ? 'Memproses...' : 'Konfirmasi'}
        cancelLabel="Batal"
        loading={submitting}
      />

      <Footer />
      <ScrollToTop />
    </div>
  );
}
