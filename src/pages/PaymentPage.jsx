import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { orderService } from '../services/orderService';
import {
  CreditCard, Upload, CheckCircle, AlertCircle, Phone, MapPin,
  Wallet, ArrowRight, Copy, Clock, Banknote, QrCode, Building2,
  CircleDollarSign, FileText, BadgeCheck, XCircle
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { formatRupiah } from '../utils/formatRupiah';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

const PAYMENT_TYPES = [
  { id: 'dp', label: 'Bayar DP (50%)', desc: 'Bayar uang muka, pelunasan setelah produksi', icon: Wallet },
  { id: 'pelunasan', label: 'Bayar Cicilan', desc: 'Bayar sebagian, sisa dibayar nanti', icon: CircleDollarSign },
  { id: 'full', label: 'Bayar Full / Lunas', desc: 'Bayar penuh sekarang, langsung diproses', icon: Banknote },
];

const BANK_ACCOUNTS = [
  { bank: 'BCA', name: 'Dreamcatcher.id', number: '1234567890' },
  { bank: 'Mandiri', name: 'Dreamcatcher.id', number: '9876543210' },
];

const PAYMENT_STATUS_MAP = {
  pending: { label: 'Menunggu Verifikasi', color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-200', icon: Clock },
  verified: { label: 'Terverifikasi', color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200', icon: BadgeCheck },
  rejected: { label: 'Ditolak', color: 'text-red-500', bg: 'bg-red-50 border border-red-200', icon: XCircle },
};

export default function PaymentPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('dp');
  const [customAmount, setCustomAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderCode]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getByCode(orderCode);
      setOrder(response.order);
      if (response.order?.id) {
        fetchPayments(response.order.id);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (orderId) => {
    try {
      const response = await api.get(`/payments/${orderId}`);
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const getPayAmount = () => {
    if (!order) return 0;
    const total = order.total_price;
    if (selectedType === 'dp') return Math.round(total * 0.5);
    if (selectedType === 'full') return total;
    const custom = parseInt(customAmount, 10);
    if (isNaN(custom) || custom <= 0) return 0;
    return Math.min(custom, total);
  };

  const getRemainingAmount = () => {
    if (!order) return 0;
    const totalPaid = payments
      .filter(p => p.payment_status === 'verified')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return Math.max(order.total_price - totalPaid, 0);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File terlalu besar. Maks 5MB');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !order) return;
    const amount = getPayAmount();
    if (amount <= 0) {
      setUploadError('Jumlah pembayaran tidak valid');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('order_id', order.id);
      formData.append('payment_method', 'transfer_bank');
      formData.append('amount', amount);
      formData.append('payment_type', selectedType);
      formData.append('payment_proof', selectedFile);

      await api.post('/payments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchOrder();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.response?.data?.message || 'Gagal upload bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-fire mx-auto mb-4" />
            <h2 className="font-heading text-[28px] text-ink tracking-[1px] mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-gray mb-4">Kode pesanan tidak valid atau sudah expired</p>
            <Link to="/pesan" className="inline-flex items-center gap-2 bg-primary text-ink font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
              Buat Pesanan Baru
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalPaid = payments
    .filter(p => p.payment_status === 'verified')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = Math.max(order.total_price - totalPaid, 0);
  const payAmount = getPayAmount();

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-[28px] text-ink tracking-[1px] mb-2">PEMBAYARAN</h1>
            <p className="text-gray-600 text-sm">Kode Pesanan: <span className="font-bold text-fire">{order.order_code}</span></p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
            <h3 className="font-heading text-[20px] text-ink tracking-[1px] mb-4 flex items-center gap-2">
              <FileText size={18} className="text-primary" /> DETAIL PESANAN
            </h3>
            <div className="space-y-3 text-sm">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{item.product_name} {item.size ? `(${item.size})` : ''}</span>
                  <span className="text-ink font-medium">{item.quantity} x {formatRupiah(item.unit_price)}</span>
                </div>
              ))}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Ongkir</span>
                  <span className="text-ink">{formatRupiah(order.shipping_cost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-3 border-t border-gray-200">
                <span className="text-ink">Total</span>
                <span className="text-primary text-lg">{formatRupiah(order.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
            <h3 className="font-heading text-[20px] text-ink tracking-[1px] mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-primary" /> PROGRES PEMBAYARAN
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tagihan</span>
                <span className="text-ink font-semibold">{formatRupiah(order.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sudah Dibayar</span>
                <span className="text-emerald-600 font-semibold">{formatRupiah(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-ink font-bold">Sisa Pembayaran</span>
                <span className="text-fire font-bold text-lg">{formatRupiah(remaining)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalPaid / order.total_price) * 100, 100)}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs text-right">
                {Math.round((totalPaid / order.total_price) * 100)}% terbayar
              </p>
            </div>
          </div>

          {/* Payment Type Selection */}
          {remaining > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
              <h3 className="font-heading text-[20px] text-ink tracking-[1px] mb-4 flex items-center gap-2">
                <CircleDollarSign size={18} className="text-primary" /> PILIH TIPE PEMBAYARAN
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PAYMENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon size={24} className={isActive ? 'text-primary' : 'text-gray-400'} />
                      <p className={`mt-2 font-semibold text-sm ${isActive ? 'text-primary' : 'text-ink'}`}>
                        {type.label}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{type.desc}</p>
                    </button>
                  );
                })}
              </div>

              {selectedType === 'pelunasan' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2 font-medium">Jumlah Cicilan (Rp)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Masukkan jumlah..."
                    min="1000"
                    max={remaining}
                    className="w-full bg-white border border-gray-300 text-ink rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400"
                  />
                  <p className="text-gray-500 text-xs mt-2">
                    Maksimal: {formatRupiah(remaining)}
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-ink font-semibold">Jumlah Dibayar:</span>
                  <span className="text-primary font-bold text-xl">{formatRupiah(payAmount)}</span>
                </div>
                {selectedType !== 'full' && remaining > payAmount && (
                  <p className="text-gray-500 text-xs mt-1">
                    Sisa setelah pembayaran ini: {formatRupiah(remaining - payAmount)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bank Transfer Info */}
          {remaining > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
              <h3 className="font-heading text-[20px] text-ink tracking-[1px] mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-primary" /> TRANSFER BANK
              </h3>
              <div className="space-y-3">
                {BANK_ACCOUNTS.map((acc) => (
                  <div key={acc.number} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <p className="text-ink font-semibold text-sm">Bank {acc.bank}</p>
                      <p className="text-primary font-bold text-lg font-mono">{acc.number}</p>
                      <p className="text-gray-500 text-xs">a.n. {acc.name}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(acc.number)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        copiedAccount === acc.number
                          ? 'bg-emerald-500 text-white'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {copiedAccount === acc.number ? (
                        <><CheckCircle size={14} /> Tersalin</>
                      ) : (
                        <><Copy size={14} /> Salin</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-3 text-center">
                Transfer sebesar <strong className="text-primary">{formatRupiah(payAmount)}</strong> ke salah satu rekening di atas
              </p>
            </div>
          )}

          {/* Upload Proof */}
          {remaining > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
              <h3 className="font-heading text-[20px] text-ink tracking-[1px] mb-4 flex items-center gap-2">
                <Upload size={18} className="text-primary" /> UPLOAD BUKTI BAYAR
              </h3>

              {uploadSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-emerald-700">Bukti Pembayaran Terkirim!</p>
                  <p className="text-gray-600 text-sm mt-1">Mohon tunggu verifikasi dari admin dalam 1x24 jam.</p>
                  <button
                    onClick={() => { setUploadSuccess(false); setSelectedFile(null); setPreviewUrl(null); }}
                    className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                  >
                    Upload Lagi
                  </button>
                </div>
              ) : (
                <>
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain rounded-xl bg-gray-100 border border-gray-200" />
                      <button
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-3 right-3 bg-white/90 text-ink p-1.5 rounded-full hover:bg-fire hover:text-white transition-colors shadow-md border border-gray-200"
                      >
                        <XCircle size={20} />
                      </button>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                          className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold"
                        >
                          Ganti File
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={uploading || payAmount <= 0}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary text-ink font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
                        >
                          {uploading ? (
                            <><div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Mengirim...</>
                          ) : (
                            <><Upload size={16} /> Kirim Bukti Bayar</>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center block cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-ink font-semibold text-sm mb-1">Klik untuk pilih foto</p>
                      <p className="text-gray-500 text-xs">Format: JPG, PNG (maks. 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}

                  {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {uploadError}
                    </div>
                  )}

                  {payments.some(p => p.payment_status === 'pending') && !uploadSuccess && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-700">Bukti pembayaran sudah dikirim. Menunggu verifikasi admin.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
              <h3 className="font-heading text-[20px] text-ink tracking-[1px] mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> RIWAYAT PEMBAYARAN
              </h3>
              <div className="space-y-3">
                {payments.map((payment) => {
                  const statusInfo = PAYMENT_STATUS_MAP[payment.payment_status] || PAYMENT_STATUS_MAP.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={payment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-ink font-semibold text-sm">
                          {formatRupiah(payment.amount)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold tracking-wide uppercase rounded ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="uppercase font-semibold text-gray-600">{payment.payment_type}</span>
                        <span>{payment.payment_method === 'transfer_bank' ? 'Transfer Bank' : payment.payment_method === 'qris' ? 'QRIS' : 'Cash'}</span>
                        <span>{new Date(payment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {payment.payment_proof && (
                        <a href={getImageUrl(payment.payment_proof)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-xs mt-2 hover:underline">
                          Lihat Bukti Bayar
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All paid confirmation */}
          {remaining <= 0 && (
            <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mb-6">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-semibold text-emerald-700 text-lg">Pembayaran Lunas!</p>
                <p className="text-gray-600 text-sm mt-1">Pesanan Anda akan segera diproses.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link
              to={`/pesanan-saya?filter=all`}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-ink transition-colors text-[13px] uppercase tracking-[1px]"
            >
              <ArrowRight size={16} /> Lacak Pesanan
            </Link>
            <Link
              to="/pesan"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-ink font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]"
            >
              Buat Pesanan Baru
            </Link>
          </div>

          {/* Help */}
          <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl">
            <h4 className="font-heading text-[16px] text-ink tracking-[1px] mb-3">BUTUH BANTUAN?</h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
              <a href="tel:+6281234567890" className="flex items-center gap-2 text-primary hover:underline">
                <Phone size={14} />
                Telp: 0812 3456 7890
              </a>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <MapPin size={14} className="flex-shrink-0" />
                Perum. Mutiara Bekasi Jaya Blok A2 No.6, RT 001/RW 008, Kec. Cibarusah, Kab. Bekasi
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
