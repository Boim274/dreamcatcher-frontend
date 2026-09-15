import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';
import OptimizedImage from '../ui/OptimizedImage';

const GAP_PX = 20;

const DEFAULT_TESTIMONIALS = [
  {
    id: 'default-1',
    customer_name: 'Budi Santoso',
    rating: 5,
    review: 'Hasil sablon DTF sangat presisi, warna cerah dan tajam! Bahan kaosnya juga super adem untuk dipakai seharian. Recommended parah buat kaos distro!',
    created_at: '2025-01-15',
  },
  {
    id: 'default-2',
    customer_name: 'Rina Wati',
    rating: 5,
    review: 'Pengerjaan sablon seragam kantor kami selesai lebih cepat dari estimasi. Kualitas sablonnya rapi, halus, dan tidak kaku sama sekali.',
    created_at: '2025-01-20',
  },
  {
    id: 'default-3',
    customer_name: 'Ahmad Fauzi',
    rating: 5,
    review: 'Fitur AI Studio sangat membantu buat eksplorasi konsep desain sebelum masuk produksi. Admin ramah dan konsultasi bahan dilayani dengan sangat baik!',
    created_at: '2025-02-02',
  },
  {
    id: 'default-4',
    customer_name: 'Dewi Lestari',
    rating: 5,
    review: 'Pesan 50 pcs untuk merchandise komunitas kampus, semua jahitan dan hasil sablon konsisten presisi. Pasti bakal repeat order lagi!',
    created_at: '2025-02-10',
  },
];

function useItemsPerView() {
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  useEffect(() => {
    const update = () => setItemsPerView(getItemsPerView());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return itemsPerView;
}

function TestimonialCard({ item }) {
  const avatarLetter = (item.customer_name || 'U')[0]?.toUpperCase();
  const ratingVal = Number(item.rating) || 5;

  return (
    <div className="relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-3xl bg-[#1a1122]/90 backdrop-blur-xl border border-white/10 hover:border-primary/50 transition-all duration-300 group shadow-xl hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 overflow-hidden">
      {/* Ambient background glow on hover */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-primary/15 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-500" />

      {/* Decorative large quote watermark */}
      <Quote className="absolute top-5 right-5 w-10 h-10 text-white/[0.04] group-hover:text-primary/15 transition-all duration-300 pointer-events-none transform -rotate-12 group-hover:scale-110" />

      {/* Card Header: Rating + Verified Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-full">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= ratingVal
                    ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]'
                    : 'text-zinc-600'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-amber-300 ml-0.5">{ratingVal.toFixed(1)}</span>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
          <CheckCircle2 size={11} className="text-emerald-400" />
          <span>Terverifikasi</span>
        </div>
      </div>

      {/* Review Content */}
      <div className="relative z-10 flex-1 my-2">
        <p className="text-zinc-200 text-[13.5px] sm:text-[14.5px] leading-[1.75] font-normal italic">
          &ldquo;{item.review}&rdquo;
        </p>
      </div>

      {/* Card Footer: Customer Profile Info */}
      <div className="relative z-10 flex items-center justify-between gap-3 pt-4 mt-4 border-t border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with gradient border */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-[#ff60a8] to-purple-600 p-[1.5px] shadow-md shadow-primary/20 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#120c16] flex items-center justify-center">
              {item.image_url ? (
                <OptimizedImage
                  src={item.image_url}
                  variant="thumbnail"
                  alt={item.customer_name}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-heading font-bold text-sm text-white">
                  {avatarLetter}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="font-heading font-bold text-[14px] text-white tracking-wide truncate group-hover:text-primary transition-colors">
              {item.customer_name}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
              <Sparkles size={10} className="text-primary shrink-0" />
              <span>Pelanggan Sablon</span>
            </div>
          </div>
        </div>

        {/* Small satisfaction tag */}
        <div className="shrink-0">
          <span className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-primary/80 group-hover:text-primary group-hover:bg-primary/10 transition-colors" title="Ulasan Bintang 5">
            <ShieldCheck size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

function StaticGrid({ testimonials }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {testimonials.map((item, i) => (
        <ScrollReveal key={item.id || i} direction="up" delay={i * 120}>
          <TestimonialCard item={item} />
        </ScrollReveal>
      ))}
    </div>
  );
}

function CarouselView({ testimonials }) {
  const itemsPerView = useItemsPerView();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const maxIndex = Math.max(0, testimonials.length - itemsPerView);
  const effectiveIndex = Math.min(currentIndex, maxIndex);
  const canPrev = effectiveIndex > 0;
  const canNext = effectiveIndex < maxIndex;

  useEffect(() => {
    if (testimonials.length <= itemsPerView || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next > maxIndex ? 0 : next;
      });
    }, 4500);
    return () => clearInterval(intervalRef.current);
  }, [testimonials.length, itemsPerView, maxIndex, isPaused]);

  const cardWidth = `calc((100% - ${(itemsPerView - 1) * GAP_PX}px) / ${itemsPerView})`;
  const translateX = `calc(-${effectiveIndex} * (${cardWidth} + ${GAP_PX}px))`;

  // Total pages for dots
  const totalPages = maxIndex + 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Track Container */}
      <div className="overflow-hidden px-1 py-2">
        <div
          className="flex gap-5 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${translateX})` }}
        >
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0"
              style={{ width: cardWidth }}
            >
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls Bar: Pagination Dots + Navigation Arrows */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10 px-2">
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const isActive = idx === effectiveIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-7 h-2 bg-gradient-to-r from-primary to-[#ff60a8] shadow-md shadow-primary/40'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Lihat slide ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Previous / Next Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={!canPrev}
            className="w-10 h-10 rounded-2xl bg-[#1a1122] border border-white/15 text-zinc-300 hover:text-white hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-primary/30 backdrop-blur-xl transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#1a1122] disabled:hover:border-white/15 disabled:hover:text-zinc-300 cursor-pointer"
            aria-label="Testimoni sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))}
            disabled={!canNext}
            className="w-10 h-10 rounded-2xl bg-[#1a1122] border border-white/15 text-zinc-300 hover:text-white hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-primary/30 backdrop-blur-xl transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#1a1122] disabled:hover:border-white/15 disabled:hover:text-zinc-300 cursor-pointer"
            aria-label="Testimoni berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialCarousel({ testimonials = [] }) {
  const items = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  if (items.length <= 3) {
    return <StaticGrid testimonials={items} />;
  }

  return <CarouselView testimonials={items} />;
}
