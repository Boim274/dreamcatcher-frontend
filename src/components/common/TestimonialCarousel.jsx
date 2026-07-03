import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';

const GAP_PX = 16;

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
  return (
    <div className="bg-white border border-[#e0d8cc] p-6 h-full flex flex-col hover:shadow-lg transition-shadow">
      <div className="flex gap-0.5 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= item.rating ? 'text-amber-400' : 'text-gray-dark'}`}
            fill={s <= item.rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
      <p className="text-gray-dark text-[14px] leading-[1.8] flex-1 mb-4">
        &ldquo;{item.review}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-[#e0d8cc]">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-sm">{item.customer_name?.[0] ?? '?'}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-ink text-[13px]">{item.customer_name}</p>
        </div>
      </div>
    </div>
  );
}

function StaticGrid({ testimonials }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {testimonials.map((item, i) => (
        <ScrollReveal key={item.id} direction="up" delay={i * 150}>
          <TestimonialCard item={item} />
        </ScrollReveal>
      ))}
    </div>
  );
}

function CarouselView({ testimonials }) {
  const itemsPerView = useItemsPerView();
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = Math.max(0, testimonials.length - itemsPerView);
  const effectiveIndex = Math.min(currentIndex, maxIndex);
  const canPrev = effectiveIndex > 0;
  const canNext = effectiveIndex < maxIndex;

  const cardWidth = `calc((100% - ${(itemsPerView - 1) * GAP_PX}px) / ${itemsPerView})`;
  const translateX = `calc(-${effectiveIndex} * (${cardWidth} + ${GAP_PX}px))`;

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#e0d8cc] text-ink hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#e0d8cc]';

  return (
    <ScrollReveal direction="up">
      <div className="relative px-12">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, Math.min(prev, maxIndex) - 1))}
          disabled={!canPrev}
          className={`${arrowClass} left-0`}
          aria-label="Testimoni sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300 ease-out"
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

        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.min(maxIndex, Math.min(prev, maxIndex) + 1))}
          disabled={!canNext}
          className={`${arrowClass} right-0`}
          aria-label="Testimoni berikutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </ScrollReveal>
  );
}

export default function TestimonialCarousel({ testimonials }) {
  if (!testimonials || testimonials.length === 0) return null;

  if (testimonials.length <= 3) {
    return <StaticGrid testimonials={testimonials} />;
  }

  return <CarouselView testimonials={testimonials} />;
}
