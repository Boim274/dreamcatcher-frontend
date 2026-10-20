import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 1,
    image: '/hero/hero-1.jpg',
    tag: 'Sablon DTF High-Res',
    tagEn: 'High-Res DTF Print',
    alt: 'Hasil Sablon Kaos Distro Dreamcatcher Cikarang 1',
  },
  {
    id: 2,
    image: '/hero/hero-2.jpg',
    tag: 'Plastisol Distro Premium',
    tagEn: 'Distro Plastisol Print',
    alt: 'Hasil Sablon Kaos Distro Dreamcatcher Cikarang 2',
  },
  {
    id: 3,
    image: '/hero/hero-3.jpg',
    tag: 'Custom Streetwear Apparel',
    tagEn: 'Custom Streetwear Apparel',
    alt: 'Hasil Sablon Kaos Distro Dreamcatcher Cikarang 3',
  },
  {
    id: 4,
    image: '/hero/hero-4.jpg',
    tag: 'Sablon Komunitas & Brand',
    tagEn: 'Community & Brand Apparel',
    alt: 'Hasil Sablon Kaos Distro Dreamcatcher Cikarang 4',
  },
  {
    id: 5,
    image: '/hero/hero-5.jpg',
    tag: 'Full Color & Presisi Tinggi',
    tagEn: 'Full Color High Precision',
    alt: 'Hasil Sablon Kaos Distro Dreamcatcher Cikarang 5',
  },
];

export default function HeroCarousel({ isEn = false, autoPlayInterval = 3600 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // Autoplay timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoPlayInterval]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <div
      className="relative mx-auto max-w-[420px] aspect-[3/4] rounded-3xl p-3 bg-gradient-to-tr from-white/10 via-white/5 to-primary/20 border border-white/15 shadow-2xl backdrop-blur-xl group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container Frame */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#120a17] flex items-center justify-center shadow-inner">
        {/* Track Slider */}
        <div
          className="flex w-full h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className="w-full h-full shrink-0 relative flex items-center justify-center overflow-hidden bg-black/40"
            >
              {/* Subtle ambient blurred background so no empty edges */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-20 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${slide.image})` }}
              />

              {/* Main Full Image: object-contain with NO zoom and NO crop */}
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-full object-contain relative z-10 pointer-events-none select-none transition-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Left Arrow Button */}
        <button
          type="button"
          aria-label="Previous Slide"
          onClick={prevSlide}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-primary border border-white/20 hover:border-primary text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95 cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          aria-label="Next Slide"
          onClick={nextSlide}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-primary border border-white/20 hover:border-primary text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95 cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md flex items-center gap-1.5 shadow-md">
          {HERO_SLIDES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              aria-label={`Slide ${dotIdx + 1}`}
              onClick={() => goToSlide(dotIdx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === dotIdx
                  ? 'w-6 bg-gradient-to-r from-primary to-pink-500 shadow-[0_0_8px_rgba(240,68,148,0.7)]'
                  : 'w-2 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* FLOATING BADGE 2 (Bottom-Left) */}
      <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-2xl bg-[#1c1322]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-2.5 z-40 pointer-events-none">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white leading-tight">{isEn ? 'Print Guarantee' : 'Garansi Sablon'}</p>
          <p className="text-[9px] text-zinc-400">{isEn ? 'Durable & Non-fading' : 'Tidak Luntur & Kuat'}</p>
        </div>
      </div>
    </div>
  );
}
