import { useState, useRef } from 'react';
import { Star, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner as Spinner } from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/getImageUrl';

export default function TestimonialForm({ order, existingTestimonial, onClose, onSuccess }) {
  const [rating, setRating] = useState(existingTestimonial?.rating || 5);
  const [review, setReview] = useState(existingTestimonial?.review || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingTestimonial ? getImageUrl(existingTestimonial.image_url) : '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const isEdit = !!existingTestimonial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('rating', rating);
      data.append('review', review);
      if (imageFile) data.append('image', imageFile);

      if (isEdit) {
        data.append('_method', 'PUT');
        await api.post(`/testimonials/${existingTestimonial.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        data.append('order_id', order.id);
        await api.post('/testimonials', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan testimoni');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-heading text-xl font-bold text-white">{isEdit ? 'Edit Testimoni' : 'Beri Testimoni'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-xl">
            <X className="w-5 h-5 text-gray-light" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-light text-sm">
            Pesanan <span className="text-primary font-mono font-bold">#{order.order_code}</span>
          </p>

          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)}>
                  <Star
                    className={`w-8 h-8 transition-colors ${i <= rating ? 'text-amber-400' : 'text-gray-dark hover:text-gray-light'}`}
                    fill={i <= rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="input-dark min-h-[100px] resize-none"
              placeholder="Ceritakan pengalaman Anda..."
            />
          </div>

          <div>
            <label className="text-chrome text-[12px] font-medium tracking-[1px] uppercase mb-2 block">Foto (Opsional)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files[0];
              if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
            }} className="hidden" />
            <div className="flex gap-3 items-center">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-dark border border-border text-gray-light hover:text-white text-sm font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" /> {imagePreview ? 'Ganti Foto' : 'Pilih Foto'}
              </button>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-dark text-xs">Testimoni akan ditinjau admin sebelum tampil di halaman utama.</p>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size="sm" /> : (isEdit ? 'Simpan Perubahan' : 'Kirim')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}