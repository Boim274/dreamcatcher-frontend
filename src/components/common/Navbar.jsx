import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';

const navLinks = [
  { to: '/', label: 'Beranda', icon: 'home' },
  { to: '/layanan', label: 'Layanan', icon: 'grid' },
  { to: '/pesan', label: 'Pesan', icon: 'edit-3' },
  { to: '/lacak-pesanan', label: 'Lacak', icon: 'search' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#982598] rounded-lg flex items-center justify-center">
              <Icon name="scissors" size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-[#1A1A2E]">Dreamcatcher<span className="text-[#982598]">.id</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-medium transition-colors ${
                  location.pathname === link.to ? 'text-[#982598]' : 'text-[#6B7280] hover:text-[#982598]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#982598] hover:bg-[#7a1f7a] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Icon name="phone" size={16} /> WhatsApp
            </a>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-[#6B7280]">
            <Icon name={isOpen ? "x" : "menu"} size={24} />
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`font-medium py-2 ${location.pathname === link.to ? 'text-[#982598]' : 'text-[#6B7280]'}`}
                >
                  {link.label}
                </Link>
              ))}
              <a href="https://wa.me/6281234567890" className="bg-[#982598] text-white font-semibold py-3 rounded-lg text-center mt-2">
                <Icon name="phone" size={16} /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}