import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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

import { useLanguageStore } from '../store/languageStore';
import { getImageUrl } from '../utils/getImageUrl';

export default function PaymentPage() {
  const { orderCode } = useParams();
  const [searchParams] = useSearchParams();
  const { t, td, language } = useLanguageStore();
  const isEn = language === 'en';

  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('dp');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(null);

  const PAYMENT_TYPES = [
    { id: 'dp', label: isEn ? 'Pay DP (50%)' : 'Bayar DP (50%)', desc: isEn ? 'Pay 50% deposit, settle remaining when production finishes' : 'Bayar uang muka 50%, sisa dibayar setelah produksi selesai', icon: Wallet },
    { id: 'full', label: isEn ? 'Pay Full' : 'Bayar Full / Lunas', desc: isEn ? 'Pay in full now, immediate processing' : 'Bayar penuh sekarang, langsung diproses', icon: Banknote },
  ];

  const BANK_ACCOUNTS = [
    { bank: 'BCA', name: 'Dreamcatcher.id', number: '1234567890' },
    { bank: 'Mandiri', name: 'Dreamcatcher.id', number: '9876543210' },
  ];

  const PAYMENT_STATUS_MAP = {
    pending: { label: isEn ? 'Waiting for Verification' : 'Menunggu Verifikasi', color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/30', icon: Clock },
    verified: { label: isEn ? 'Verified' : 'Terverifikasi', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/30', icon: BadgeCheck },
    paid: { label: isEn ? 'Paid' : 'Lunas', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/30', icon: BadgeCheck },
    dp: { label: 'DP', color: 'text-sky-400', bg: 'bg-sky-500/10 border border-sky-500/30', icon: BadgeCheck },
    rejected: { label: isEn ? 'Rejected' : 'Ditolak', color: 'text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/30', icon: XCircle },
  };

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

  const typeParam = searchParams.get('type');
  const isPelunasanMode = typeParam === 'pelunasan' || order?.payment_status === 'dp';
  const availableTypes = PAYMENT_TYPES;

  useEffect(() => {
    if (order && isPelunasanMode) {
      setSelectedType('pelunasan');
    }
  }, [order, isPelunasanMode]);

  const totalPaid = order?.paid_amount
    ? parseFloat(order.paid_amount)
    : payments
        .filter(p => p.payment_status === 'verified' || p.payment_status === 'paid' || p.payment_status === 'dp')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = order?.remaining_amount !== undefined
    ? parseFloat(order.remaining_amount)
    : Math.max((order?.total_price || 0) - totalPaid, 0);

  const getPayAmount = () => {
    if (!order) return 0;
    const total = order.total_price;
    if (isPelunasanMode) return remaining;
    if (selectedType === 'dp') return Math.round(total * 0.5);
    return total;
  };

  const payAmount = getPayAmount();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(isEn ? 'File too large. Maximum 5MB' : 'File terlalu besar. Maksimal 5MB');
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
      setUploadError(isEn ? 'Invalid payment amount' : 'Jumlah pembayaran tidak valid');
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
      setUploadError(error.response?.data?.message || (isEn ? 'Failed to upload payment proof' : 'Gagal upload bukti pembayaran'));
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
      <div className="min-h-screen flex flex-col bg-[#120c16] text-white">
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
      <div className="min-h-screen flex flex-col bg-[#120c16] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-white/10 text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" />
            <h2 className="font-heading text-2xl text-white tracking-wide mb-2">{isEn ? 'Order Not Found' : 'Pesanan Tidak Ditemukan'}</h2>
            <p className="text-white/60 text-sm mb-6">{isEn ? 'Invalid or expired order code' : 'Kode pesanan tidak valid atau sudah expired'}</p>
            <Link to="/pesan" className="btn-gradient-primary inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold">
              {isEn ? 'Create New Order' : 'Buat Pesanan Baru'}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/20 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-10 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-purple-500/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-[2px] text-primary font-bold mb-1">{isEn ? 'Payment Confirmation' : 'Konfirmasi Pembayaran'}</p>
            <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-wide mb-3">{isEn ? 'PAYMENT' : 'PEMBAYARAN'}</h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/80 mb-3">
              <span>{isEn ? 'Order Code:' : 'Kode Pesanan:'}</span>
              <span className="font-mono font-bold text-primary">{order.order_code}</span>
            </div>
            <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto">
              {isEn
                ? 'Complete your order payment by transferring to our official Dreamcatcher bank accounts below.'
                : 'Selesaikan pembayaran pesanan Anda dengan transfer ke rekening resmi Dreamcatcher di bawah.'}
            </p>
            <div className="mt-3">
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Payment Flow Steps */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
            <h3 className="font-heading text-lg text-white tracking-wider mb-5 flex items-center gap-2 border-b border-white/10 pb-4">
              <ArrowRight size={18} className="text-primary" /> {isEn ? 'PAYMENT FLOW' : 'ALUR PEMBAYARAN'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Wallet, title: isEn ? 'Select Type' : 'Pilih Tipe', desc: isEn ? '50% DP or Full' : 'DP 50% atau Lunas' },
                { icon: Building2, title: isEn ? 'Bank Transfer' : 'Transfer Bank', desc: isEn ? 'Exact matching amount' : 'Sesuai nominal tertera' },
                { icon: Upload, title: isEn ? 'Upload Proof' : 'Upload Bukti', desc: isEn ? 'Receipt photo/screenshot' : 'Foto / screenshot transfer' },
                { icon: BadgeCheck, title: isEn ? 'Verification' : 'Verifikasi', desc: isEn ? 'Max. 1x24 business hours' : 'Maks. 1x24 jam kerja' },
              ].map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex flex-col items-start gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary">
                        {i + 1}
                      </div>
                      <StepIcon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-xs">{step.title}</p>
                      <p className="text-white/50 text-[11px] mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
            <h3 className="font-heading text-lg text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
              <FileText size={18} className="text-primary" /> {isEn ? 'ORDER DETAILS' : 'DETAIL PESANAN'}
            </h3>
            <div className="space-y-3 text-sm">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-white/80">
                  <div className="pr-4">
                    <p className="font-medium text-white">{td(item.product_name || item.service?.name || (isEn ? 'Order Item' : 'Item Pesanan'))} {item.size ? `(${item.size})` : ''}</p>
                    {item.selected_color && <p className="text-xs text-white/50">{isEn ? 'Color:' : 'Warna:'} {td(item.selected_color)}</p>}
                  </div>
                  <span className="text-white font-semibold whitespace-nowrap">
                    {item.quantity} x {formatRupiah(item.unit_price)}
                  </span>
                </div>
              ))}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-white/70 py-1">
                  <span>{isEn ? 'Shipping Fee' : 'Ongkos Kirim'}</span>
                  <span className="text-white">{formatRupiah(order.shipping_cost)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold pt-4 border-t border-white/10">
                <span className="text-white/90">{isEn ? 'Total Billing' : 'Total Tagihan'}</span>
                <span className="text-2xl text-gradient-primary font-bold">{formatRupiah(order.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
            <h3 className="font-heading text-lg text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
              <Wallet size={18} className="text-primary" /> {isEn ? 'PAYMENT PROGRESS' : 'PROGRES PEMBAYARAN'}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">{isEn ? 'Total Billing' : 'Total Tagihan'}</span>
                <span className="text-white font-semibold">{formatRupiah(order.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">{isEn ? 'Already Paid' : 'Sudah Dibayar'}</span>
                <span className="text-emerald-400 font-semibold">{formatRupiah(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-white font-bold">{isEn ? 'Remaining Balance' : 'Sisa Pembayaran'}</span>
                <span className="text-rose-400 font-bold text-lg">{formatRupiah(remaining)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/[0.06] border border-white/10 rounded-full h-3 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary via-fuchsia-500 to-primary-light h-full rounded-full transition-all duration-500 shadow-sm shadow-primary/50"
                  style={{ width: `${Math.min((totalPaid / (order.total_price || 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-white/50 text-xs text-right">
                {Math.round((totalPaid / (order.total_price || 1)) * 100)}% {isEn ? 'paid' : 'terbayar'}
              </p>
            </div>
          </div>

          {/* Rejected payment alert */}
          {payments.some(p => p.payment_status === 'rejected') && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-5 mb-6 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-300 text-sm">{isEn ? 'Payment Rejected' : 'Pembayaran Ditolak'}</p>
                  <p className="text-rose-300/80 text-xs mt-1 leading-relaxed">
                    {payments.filter(p => p.payment_status === 'rejected').slice(-1)[0]?.notes || (isEn ? 'Previous payment proof was invalid. Please re-upload a clear transfer receipt.' : 'Bukti pembayaran sebelumnya tidak valid. Silakan upload ulang bukti transfer yang jelas.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Type Selection */}
          {remaining > 0 && (
            <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
              <h3 className="font-heading text-lg text-white tracking-wider mb-2 flex items-center gap-2 border-b border-white/10 pb-4">
                <CircleDollarSign size={18} className="text-primary" /> {isPelunasanMode ? (isEn ? 'DP SETTLEMENT' : 'PELUNASAN DP') : (isEn ? 'SELECT PAYMENT TYPE' : 'PILIH TIPE PEMBAYARAN')}
              </h3>
              {!isPelunasanMode && (
                <p className="text-white/60 text-xs mb-5">
                  {isEn ? 'Choose payment scheme. Exact transfer amount is calculated automatically.' : 'Pilih skema pembayaran. Nominal transfer otomatis dihitung oleh sistem.'}
                </p>
              )}

              {isPelunasanMode ? (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
                  <p className="text-white/70 text-sm mb-2">{isEn ? 'You are settling the remaining DP balance of:' : 'Anda akan melunasi sisa pembayaran DP sebesar:'}</p>
                  <p className="text-3xl font-bold text-gradient-primary">{formatRupiah(remaining)}</p>
                  <p className="text-white/50 text-xs mt-2">{isEn ? 'Amount is determined according to your order balance' : 'Jumlah sudah ditentukan sesuai sisa tagihan pesanan Anda'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableTypes.map((type) => {
                    const Icon = type.icon;
                    const isActive = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isActive
                            ? 'border-primary bg-primary/15 shadow-[0_0_25px_rgba(236,74,150,0.2)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-white' : 'bg-white/5 text-white/60'}`}>
                            <Icon size={20} />
                          </div>
                          {isActive && (
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <CheckCircle size={14} />
                            </span>
                          )}
                        </div>
                        <p className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-white'}`}>
                          {type.label}
                        </p>
                        <p className="text-white/60 text-xs mt-1 leading-relaxed">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 p-5 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent border border-primary/30 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-white/80 font-medium text-sm">{isEn ? 'Amount to be paid:' : 'Nominal yang harus dibayar:'}</span>
                  <span className="text-3xl font-bold text-gradient-primary leading-none">{formatRupiah(payAmount)}</span>
                </div>
                {!isPelunasanMode && selectedType !== 'full' && remaining > payAmount && (
                  <p className="text-white/50 text-xs mt-3 pt-2 border-t border-white/10">
                    {isEn ? 'Remaining after this payment:' : 'Sisa setelah pembayaran ini:'} <span className="font-semibold text-white">{formatRupiah(remaining - payAmount)}</span> {isEn ? '(paid before delivery/pickup).' : '(dibayar sebelum pengiriman/pengambilan).'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bank Transfer Info */}
          {remaining > 0 && (
            <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
              <h3 className="font-heading text-lg text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                <Building2 size={18} className="text-primary" /> {isEn ? 'PAYMENT ACCOUNTS' : 'REKENING PEMBAYARAN'}
              </h3>
              <div className="space-y-3">
                {BANK_ACCOUNTS.map((acc) => (
                  <div key={acc.number} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white/[0.02] rounded-2xl border border-white/10 hover:border-primary/30 transition-all gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-primary/20 text-primary text-xs font-bold uppercase">{acc.bank}</span>
                        <span className="text-white/50 text-xs">a.n. {acc.name}</span>
                      </div>
                      <p className="text-2xl font-bold font-mono tracking-wider text-white mt-1.5">{acc.number}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.number)}
                      className={`btn-glass inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        copiedAccount === acc.number
                          ? '!bg-emerald-500 !text-white !border-emerald-500'
                          : ''
                      }`}
                    >
                      {copiedAccount === acc.number ? (
                        <><CheckCircle size={14} /> {isEn ? 'Copied' : 'Tersalin'}</>
                      ) : (
                        <><Copy size={14} /> {isEn ? 'Copy Number' : 'Salin Nomor'}</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-amber-300 text-xs flex items-center gap-2 leading-relaxed">
                  <AlertCircle size={16} className="flex-shrink-0 text-amber-400" />
                  <span>
                    {isEn ? (
                      <>Transfer exactly <strong className="text-white font-bold">{formatRupiah(payAmount)}</strong> to the account above, then upload transfer proof below.</>
                    ) : (
                      <>Transfer tepat sejumlah <strong className="text-white font-bold">{formatRupiah(payAmount)}</strong> ke rekening di atas, lalu unggah bukti transfer di bawah.</>
                    )}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Upload Proof */}
          {remaining > 0 && (
            <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
              <h3 className="font-heading text-lg text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                <Upload size={18} className="text-primary" /> {isEn ? 'UPLOAD TRANSFER PROOF' : 'UPLOAD BUKTI TRANSFER'}
              </h3>

              {uploadSuccess ? (
                <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center backdrop-blur-xl">
                  <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                  <p className="font-bold text-emerald-300 text-lg">{isEn ? 'Payment Proof Submitted!' : 'Bukti Pembayaran Terkirim!'}</p>
                  <p className="text-white/70 text-sm mt-1 max-w-md mx-auto">
                    {isEn
                      ? <>Your order status is now <strong>Awaiting Verification</strong>. Our finance team will verify it within 1x24 business hours.</>
                      : <>Status pesanan Anda kini <strong>Menunggu Verifikasi</strong>. Tim finance kami akan memverifikasi dalam 1x24 jam kerja.</>}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setUploadSuccess(false); setSelectedFile(null); setPreviewUrl(null); }}
                    className="btn-glass mt-5 px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold"
                  >
                    {isEn ? 'Upload Another File' : 'Upload File Lain'}
                  </button>
                </div>
              ) : (
                <>
                  {previewUrl ? (
                    <div className="relative">
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/10 flex items-center justify-center">
                        <img src={previewUrl} alt="Preview" className="max-h-72 object-contain rounded-xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-3 right-3 bg-black/70 hover:bg-rose-600 text-white p-2 rounded-full transition-colors border border-white/20"
                        title={isEn ? 'Remove image' : 'Hapus gambar'}
                      >
                        <XCircle size={20} />
                      </button>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                          className="btn-glass flex-1 py-3.5 rounded-2xl text-xs uppercase tracking-wider font-bold"
                        >
                          {isEn ? 'Change File' : 'Ganti File'}
                        </button>
                        <button
                          type="button"
                          onClick={handleUpload}
                          disabled={uploading || payAmount <= 0}
                          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs uppercase tracking-wider font-bold disabled:opacity-50"
                        >
                          {uploading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {isEn ? 'Sending...' : 'Mengirim...'}</>
                          ) : (
                            <><Upload size={16} /> {isEn ? 'Send Transfer Proof' : 'Kirim Bukti Transfer'}</>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-white/15 hover:border-primary/60 bg-white/[0.02] hover:bg-primary/5 rounded-3xl p-8 sm:p-12 text-center block cursor-pointer transition-all group">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-primary/20 border border-white/10 group-hover:border-primary/40 flex items-center justify-center mx-auto mb-4 transition-all">
                        <Upload className="w-7 h-7 text-white/60 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                        {isEn ? 'Click or drag transfer receipt photo here' : 'Klik atau seret foto bukti transfer ke sini'}
                      </p>
                      <p className="text-white/40 text-xs">{isEn ? 'Supports JPG, PNG, or WEBP (max. 5MB)' : 'Mendukung format JPG, PNG, atau WEBP (maks. 5MB)'}</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}

                  {uploadError && (
                    <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {payments.some(p => p.payment_status === 'pending') && !uploadSuccess && (
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-xs">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-200 leading-relaxed">
                        {isEn ? (
                          <>Payment proof successfully uploaded. Current status: <strong>Awaiting Admin Verification</strong>.</>
                        ) : (
                          <>Bukti pembayaran sudah berhasil dikirim. Status saat ini: <strong>Menunggu Verifikasi Admin</strong>.</>
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="glass-card rounded-3xl p-6 sm:p-7 mb-6 border border-white/10">
              <h3 className="font-heading text-lg text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                <Clock size={18} className="text-primary" /> {isEn ? 'PAYMENT HISTORY' : 'RIWAYAT PEMBAYARAN'}
              </h3>
              <div className="space-y-3">
                {payments.map((payment) => {
                  const statusInfo = PAYMENT_STATUS_MAP[payment.payment_status] || PAYMENT_STATUS_MAP.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={payment.id} className="p-4 sm:p-5 bg-white/[0.02] rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-base">
                          {formatRupiah(payment.amount)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon size={13} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                        <span className="uppercase font-semibold text-primary">{payment.payment_type}</span>
                        <span>•</span>
                        <span>{payment.payment_method === 'transfer_bank' ? (isEn ? 'Bank Transfer' : 'Transfer Bank') : payment.payment_method === 'qris' ? 'QRIS' : (isEn ? 'Cash' : 'Tunai')}</span>
                        <span>•</span>
                        <span>{new Date(payment.created_at).toLocaleDateString(isEn ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {payment.payment_proof && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                          <a href={getImageUrl(payment.payment_proof)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline">
                            <FileText size={14} /> {isEn ? 'View Transfer Proof' : 'Lihat Bukti Transfer'}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All paid confirmation */}
          {remaining <= 0 && (
            <div className="glass-card rounded-3xl p-8 mb-6 border border-emerald-500/30 bg-emerald-500/10 text-center">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
              <p className="font-bold text-emerald-300 text-xl">{isEn ? 'Payment Fully Settled!' : 'Pembayaran Telah Lunas!'}</p>
              <p className="text-white/70 text-sm mt-1 max-w-md mx-auto">
                {isEn
                  ? 'Thank you for your payment. Your order is now being processed by our workshop team.'
                  : 'Terima kasih atas pembayaran Anda. Pesanan Anda kini sedang diproses oleh tim workshop kami.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Link
              to={`/pesanan-saya?filter=all`}
              className="btn-glass flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold"
            >
              <ArrowRight size={16} /> {isEn ? 'Track Order Status' : 'Lacak Status Pesanan'}
            </Link>
            <Link
              to="/pesan"
              className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold"
            >
              {isEn ? 'Create New Order' : 'Buat Pesanan Baru'}
            </Link>
          </div>

          {/* Help */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10">
            <h4 className="font-heading text-sm text-white tracking-wider mb-3">{isEn ? 'NEED HELP?' : 'BUTUH BANTUAN?'}</h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-white/60">
              <a href="tel:+6281234567890" className="flex items-center gap-2 text-primary hover:underline font-medium">
                <Phone size={14} />
                CS Hotline: 0812-3456-7890
              </a>
              <span className="text-white/20 hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="flex-shrink-0 text-primary" />
                <span>Workshop: Perum. Mutiara Bekasi Jaya Blok A2 No.6, Cibarusah, Bekasi</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
