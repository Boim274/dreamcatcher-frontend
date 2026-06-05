import { useRef, useEffect, useState } from 'react';

const directionMap = {
  up: 'scroll-reveal-up',
  down: 'scroll-reveal-down',
  left: 'scroll-reveal-left',
  right: 'scroll-reveal-right',
  scale: 'scroll-reveal-scale',
  blur: 'scroll-reveal-blur',
};

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 800,
  className = '',
  once = true,
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, once]);

  const dirClass = directionMap[direction] || directionMap.up;

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${dirClass} ${isVisible ? 'revealed' : ''} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
