import { useState, useEffect } from 'react';
import Icon from '../ui/Icon';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-dark hover:scale-110 transition-all duration-200 cursor-pointer"
      style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}
      aria-label="Scroll to top"
    >
      <Icon name="arrow-left" size={20} className="rotate-90" />
    </button>
  );
}
