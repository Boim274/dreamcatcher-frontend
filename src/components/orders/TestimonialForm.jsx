import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Send,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import UserAvatar from '../common/UserAvatar';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';

const RATING_SENTIMENTS = {
  5: {
    emoji: '⭐',
    label_id: 'Luar Biasa! Kualitas Sempurna',
    label_en: 'Outstanding! Perfect Quality',
    badgeClassDark: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    badgeClassLight: 'bg-amber-50 text-amber-700 border-amber-300',
  },
  4: {
    emoji: '👍',
    label_id: 'Sangat Puas & Rekomended',
    label_en: 'Very Satisfied & Recommended',
    badgeClassDark: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
    badgeClassLight: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  3: {
    emoji: '👌',
    label_id: 'Cukup Baik, Sesuai Ekspektasi',
    label_en: 'Good Enough, Met Expectations',
    badgeClassDark: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
    badgeClassLight: 'bg-sky-50 text-sky-700 border-sky-300',
  },
  2: {
    emoji: '⚠️',
    label_id: 'Kurang Puas, Ada Kekurangan',
    label_en: 'Below Expectations',
    badgeClassDark: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
    badgeClassLight: 'bg-orange-50 text-orange-700 border-orange-300',
  },
  1: {
    emoji: '❌',
    label_id: 'Mengecewakan, Butuh Perbaikan',
    label_en: 'Needs Improvement',
    badgeClassDark: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
    badgeClassLight: 'bg-rose-50 text-rose-700 border-rose-300',
  },
};

const QUICK_TAGS = [
  { id: 'presisi', label_id: 'Sablon Presisi', label_en: 'Crisp Print', text_id: 'Hasil sablon sangat presisi dan rapi.', text_en: 'The print is very crisp and precise.' },
  { id: 'bahan', label_id: 'Bahan Adem & Lembut', label_en: 'Soft & Comfy Fabric', text_id: 'Bahan kaos nyaman dan adem.', text_en: 'The fabric is comfortable and soft.' },
  { id: 'warna', label_id: 'Warna Tajam', label_en: 'Accurate Colors', text_id: 'Warnanya tajam dan sesuai desain.', text_en: 'Colors match the design nicely.' },
  { id: 'cepat', label_id: 'Tepat Waktu', label_en: 'Delivered on Time', text_id: 'Pengerjaan cepat dan tepat waktu.', text_en: 'Finished right on schedule.' },
  { id: 'ramah', label_id: 'CS Ramah', label_en: 'Helpful CS', text_id: 'Pelayanan admin sangat ramah dan komunikatif.', text_en: 'Customer support was friendly and helpful.' },
  { id: 'packing', label_id: 'Packing Rapi', label_en: 'Neat Packaging', text_id: 'Pengemasan rapi dan aman.', text_en: 'Neatly and securely packaged.' },
];

export default function TestimonialForm({ order, existingTestimonial, onClose, onSuccess }) {
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const toast = useToast();

  const isEn = language === 'en';
  const isLight = theme === 'light';

  const [rating, setRating] = useState(existingTestimonial?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(existingTestimonial?.review || '');
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const isEdit = !!existingTestimonial;

  // Handle ESC key to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  // Quick tag toggle handler
  const handleTagClick = (tag) => {
    const tagText = isEn ? tag.text_en : tag.text_id;
    const isSelected = selectedTags.includes(tag.id);

    if (isSelected) {
      setSelectedTags(prev => prev.filter(id => id !== tag.id));
      setReview(prev => prev.replace(tagText, '').replace(/\s{2,}/g, ' ').trim());
    } else {
      setSelectedTags(prev => [...prev, tag.id]);
      setReview(prev => (prev.trim() ? `${prev.trim()} ${tagText}` : tagText));
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      toast.error(isEn ? 'Please select a star rating (1-5).' : 'Silakan pilih rating (1-5 bintang).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        order_id: order.id,
        rating,
        review: review.trim(),
        image_url: user?.avatar || order?.user?.avatar || existingTestimonial?.image_url || null,
        customer_name: user?.name || order?.customer_name || existingTestimonial?.customer_name,
      };

      if (isEdit && existingTestimonial?.id) {
        const res = await api.put(`/testimonials/${existingTestimonial.id}`, payload);
        toast.success(res.data?.message || (isEn ? 'Review updated successfully!' : 'Testimoni berhasil diperbarui!'));
      } else {
        const res = await api.post('/testimonials', payload);
        toast.success(res.data?.message || (isEn ? 'Thank you! Your review has been submitted.' : 'Terima kasih! Testimoni Anda berhasil dikirim.'));
      }

      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.message || (isEn ? 'Failed to save testimonial.' : 'Gagal menyimpan testimoni.');
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const activeRating = hoverRating || rating;
  const currentSentiment = RATING_SENTIMENTS[activeRating] || RATING_SENTIMENTS[5];
  const customerName = user?.name || order.customer_name || 'Pelanggan Dreamcatcher';
  const customerAvatar = user?.avatar || order?.user?.avatar || existingTestimonial?.image_url;

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto p-3 sm:p-6 flex items-center justify-center bg-black/75 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl border transition-all duration-200 animate-in zoom-in-95 shadow-2xl my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-hidden ${
          isLight
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-900/10'
            : 'bg-[#18121c] text-white border-white/10 shadow-black/80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Pinned) */}
        <div className={`p-5 sm:p-6 pb-4 border-b shrink-0 relative pr-12 ${
          isLight ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#18121c]'
        }`}>
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 right-5 w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800'
                : 'bg-white/5 hover:bg-white/15 border-white/10 text-zinc-400 hover:text-white'
            }`}
            aria-label={isEn ? 'Close' : 'Tutup'}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isEn ? 'Order Review' : 'Ulasan Pesanan'}
            </span>
          </div>

          <h2 className={`font-heading text-2xl sm:text-[26px] font-bold tracking-[1.5px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isEdit
              ? (isEn ? 'Edit Testimonial' : 'Edit Testimoni')
              : (isEn ? 'Give Testimonial' : 'Beri Testimoni')}
          </h2>

          <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            {isEn
              ? 'Tell us how satisfied you are with your custom apparel.'
              : 'Ceritakan kepuasan Anda mengenai hasil sablon dan pakaian pesanan ini.'}
          </p>

          {isEdit && existingTestimonial?.order_id && existingTestimonial.order_id !== order.id && (
            <div className={`mt-2.5 p-2 px-2.5 rounded-xl text-xs flex items-center gap-2 border ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}>
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>
                {isEn
                  ? 'Updating will refresh your testimonial with this latest order.'
                  : 'Ulasan ini akan memperbarui testimoni Anda dengan pesanan terbaru ini.'}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
          {/* User Profile & Order Context (Minimalist) */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                user={user}
                src={customerAvatar}
                name={customerName}
                size="md"
                border
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className={`font-bold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {customerName}
                </p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    #{order.order_code}
                  </span>
                  <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-zinc-600'}`} />
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    {isEn ? 'Profile Photo Synced' : 'Foto Profil Otomatis'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Star Rating Section */}
          <div
            className={`p-4 rounded-xl border text-center ${
              isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-white/[0.02] border-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= activeRating;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-lg transition-transform hover:scale-115 active:scale-95 cursor-pointer focus:outline-none"
                    aria-label={`${starIndex} Star`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : isLight
                            ? 'text-slate-300 hover:text-slate-400'
                            : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Sentiment label */}
            <div className="mt-2.5">
              <span
                className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold tracking-wide transition-all ${
                  isLight ? currentSentiment.badgeClassLight : currentSentiment.badgeClassDark
                }`}
              >
                {currentSentiment.emoji} {isEn ? currentSentiment.label_en : currentSentiment.label_id}
              </span>
            </div>
          </div>

          {/* Quick Impression Tags (Pilihan Kesan Ringkas) */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
              {isEn ? 'Quick Highlights (Optional)' : 'Pilihan Kesan Cepat (Opsional)'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary/15 text-primary border-primary font-semibold'
                        : isLight
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                          : 'bg-white/[0.03] text-zinc-400 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-primary shrink-0" />}
                    <span>{isEn ? tag.label_en : tag.label_id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                {isEn ? 'Review Details' : 'Tulis Ulasan'}
              </label>
              <span className={`text-[11px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                {review.length}/1000
              </span>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder={
                isEn
                  ? 'Share details about the fabric, screen print result, or delivery...'
                  : 'Ceritakan tentang kenyamanan bahan kaos, kerapian sablon, atau kepuasan Anda...'
              }
              className={`w-full rounded-xl p-3 text-sm transition-all outline-none resize-none leading-relaxed border ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10'
                  : 'bg-white/[0.04] border-white/10 text-white placeholder-zinc-500 focus:border-primary/70 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>

          {/* Minimalist Trust & Status Note */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
            <p className="leading-snug">
              {isEn
                ? 'Your testimonial is published immediately with your profile name & avatar.'
                : 'Testimoni Anda langsung aktif dan ditampilkan dengan nama & foto profil Anda.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              {isEn ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-[#ff58a0] hover:brightness-110 active:scale-[0.98] shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>
                    {isEdit
                      ? (isEn ? 'Update Review' : 'Perbarui Testimoni')
                      : (isEn ? 'Submit Review' : 'Kirim Testimoni')}
                  </span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </form>
        </div>
      </div>
    </div>
  );
}