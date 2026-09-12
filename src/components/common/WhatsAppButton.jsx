import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { WA_URL } from '../../constants/whatsapp';

export default function WhatsAppButton() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (location.pathname.startsWith('/admin')) return null;
  if (!visible) return null;

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white flex items-center justify-center rounded-full shadow-lg shadow-[#25D366]/30 hover:bg-[#22c35e] hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40 transition-all duration-200 cursor-pointer"
      aria-label="Chat via WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}