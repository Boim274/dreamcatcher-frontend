import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { CreditCard, Upload, CheckCircle, AlertCircle, Phone, MapPin } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function PaymentPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderCode]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getByCode(orderCode);
      setOrder(response.order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File terlalu besar. Maks 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('order_id', order.id);
      formData.append('payment_method', 'transfer_bank');
      formData.append('amount', Math.round(order.total_price * 0.5));
      formData.append('payment_type', 'dp');
      formData.append('payment_proof', file);

      await api.post('/payments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadSuccess(true);
      fetchOrder();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.response?.data?.message || 'Gagal upload bukti pembayaran');
    } finally {
      setUploading(false);
    }
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
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-text-secondary mb-4">Kode pesanan tidak valid atau sudah expired</p>
            <Link to="/pesan" className="btn-primary">Buat Pesanan Baru</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const dpAmount = Math.round(order.total_price * 0.5);

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold mb-2">Pembayaran</h1>
            <p className="text-text-secondary">Kode Pesanan: <span className="font-bold text-primary">{order.order_code}</span></p>
          </div>

          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Detail Pesanan</h3>
            <div className="space-y-3 text-sm">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.product_name}</span>
                  <span>{item.quantity} x Rp {(item.unit_price).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-3 border-t">
                <span>Total</span>
                <span className="text-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Instruksi Pembayaran DP 50%</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-lg text-center font-bold text-primary mb-2">
                Rp {dpAmount.toLocaleString('id-ID')}
              </p>
              <p className="text-center text-text-secondary text-sm">Jumlah yang harus dibayar</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Transfer ke Rekening</p>
                  <p className="text-text-secondary text-sm">Bank BCA - 1234567890 a.n. Dreamcatcher.id</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Upload Bukti Bayar</p>
                  <p className="text-text-secondary text-sm">Foto/screenshot bukti transfer di bawah ini</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Tunggu Verifikasi</p>
                  <p className="text-text-secondary text-sm">Admin akan memverifikasi dalam 1x24 jam</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Upload Bukti Pembayaran</h3>

            {order.payments?.some(p => p.payment_status === 'verified') ? (
              <div className="p-6 bg-success/10 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="font-semibold text-success">Pembayaran Terverifikasi</p>
                <p className="text-text-secondary text-sm mt-1">Terima kasih! Pesanan Anda sedang diproses.</p>
              </div>
            ) : uploadSuccess ? (
              <div className="p-6 bg-warning/10 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-warning mx-auto mb-3" />
                <p className="font-semibold text-warning">Menunggu Verifikasi</p>
                <p className="text-text-secondary text-sm mt-1">Bukti pembayaran berhasil diupload. Mohon tunggu konfirmasi dari admin.</p>
              </div>
            ) : (
              <>
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center block cursor-pointer hover:border-primary transition-colors">
                  {uploading ? (
                    <div>
                      <LoadingSpinner size="lg" />
                      <p className="mt-4 text-text-secondary">Mengupload...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                      <p className="text-text-secondary mb-2">Klik atau drag file di sini</p>
                      <p className="text-text-secondary text-sm">Format: JPG, PNG (maks. 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </label>

                {uploadError && (
                  <div className="mt-4 p-3 bg-danger/10 rounded-lg flex items-center gap-2 text-danger text-sm">
                    <AlertCircle className="w-5 h-5" />
                    {uploadError}
                  </div>
                )}

                {order.payments?.some(p => p.payment_status === 'pending') && (
                  <div className="mt-4 p-3 bg-warning/10 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Anda sudah mengupload bukti pembayaran. Menunggu verifikasi admin.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to={`/lacak-pesanan?code=${order.order_code}`} className="btn-secondary">
              Lacak Pesanan Saya
            </Link>
          </div>

          <div className="mt-8 p-4 bg-secondary/5 rounded-xl">
            <h4 className="font-semibold mb-3">Butuh Bantuan?</h4>
            <div className="flex items-center gap-4 text-sm">
              <a href="https://wa.me/6281234567890" className="flex items-center gap-2 text-primary hover:underline">
                <Phone className="w-4 h-4" />
                WhatsApp: 0812 3456 7890
              </a>
              <span className="text-text-secondary">|</span>
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="w-4 h-4" />
                Jl. Sudirman No. 123, Jakarta
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}