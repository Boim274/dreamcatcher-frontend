import { useState } from 'react';
import Icon from '../../components/ui/Icon';

export default function PortfolioCarousel({ portfolios }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Belum ada portfolio</p>
      </div>
    );
  }

  const visibleCount = 4;
  const totalSlides = Math.ceil(portfolios.length / visibleCount);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getVisiblePortfolios = () => {
    const start = currentIndex * visibleCount;
    return portfolios.slice(start, start + visibleCount);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 transition-transform duration-300">
          {getVisiblePortfolios().map((portfolio, index) => (
            <div
              key={portfolio.id}
              className="relative group overflow-hidden rounded-xl aspect-square cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={portfolio.image_url}
                alt={portfolio.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 flex items-end p-4 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-white">
                  <p className="font-semibold">{portfolio.title}</p>
                  <p className="text-sm text-gray-300">{portfolio.service?.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:text-[#982598] hover:shadow-xl transition-all z-10"
          >
            <Icon name="chevron-left" size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:text-[#982598] hover:shadow-xl transition-all z-10"
          >
            <Icon name="chevron-right" size={24} />
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${currentIndex === index ? 'bg-[#982598] w-6' : 'bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}