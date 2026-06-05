import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import Icon from '../ui/Icon';

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/layanan', label: 'Layanan' },
  { to: '/kontak', label: 'Kontak' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openLogin, openRegister } = useAuthModalStore();
  const dropdownRef = useRef(null);
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      prevLocationRef.current = location.pathname;
      setIsOpen(false);
      setShowDropdown(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const handleNavClick = (e, link) => {
    if (link.to === '/kontak') {
      e.preventDefault();
      const el = document.getElementById('kontak');
      if (el && location.pathname === '/') {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/#kontak';
      }
    }
  };

  return (
    <nav className="bg-ink border-b-[3px] border-primary px-[5%] sticky top-0 z-50">
      <div className="flex items-center justify-between h-16">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 no-underline">
          <img src="/logo.png" alt="Dreamcatcher" className="h-10" />
          <span className="font-heading text-[24px] text-primary tracking-[2px]">
            Dream<span className="text-[#ea6fab]">catcher</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-6 list-none">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`text-[13px] font-medium tracking-[1px] uppercase no-underline transition-colors ${
                    location.pathname === link.to
                      ? 'text-primary'
                      : 'text-chrome hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#ea6fab] hover:bg-[#4bc278] text-white font-semibold py-2 px-4 text-[13px] tracking-[1px] uppercase no-underline transition-colors"
            style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 0 100%)' }}
          >
            WhatsApp
          </a>

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 text-chrome hover:text-primary transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-[13px] font-medium max-w-[100px] truncate">{user?.name || 'User'}</span>
                <Icon name="chevron-down" size={14} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-ink border border-border py-2 z-50">
                  <Link
                    to="/pesanan-saya"
                    className="flex items-center gap-2 px-4 py-2 text-chrome hover:bg-card hover:text-primary transition-colors text-[13px]"
                  >
                    <Icon name="package" size={16} /> Pesanan Saya
                  </Link>
                  <Link
                    to="/lacak-pesanan"
                    className="flex items-center gap-2 px-4 py-2 text-chrome hover:bg-card hover:text-primary transition-colors text-[13px]"
                  >
                    <Icon name="search" size={16} /> Lacak Pesanan
                  </Link>
                  <Link
                    to="/pesan"
                    className="flex items-center gap-2 px-4 py-2 text-chrome hover:bg-card hover:text-primary transition-colors text-[13px]"
                  >
                    <Icon name="edit-3" size={16} /> Buat Pesanan
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-[#ea6fab] hover:bg-[#1a0000] transition-colors w-full text-left text-[13px]"
                  >
                    <Icon name="log-out" size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openLogin}
                className="border-[1.5px] border-primary text-primary hover:bg-primary hover:text-white py-[6px] px-[14px] text-[12px] font-medium tracking-[1px] uppercase no-underline transition-colors cursor-pointer bg-transparent"
                style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 0 100%)' }}
              >
                Login
              </button>
              <button
                onClick={openRegister}
                className="bg-primary hover:bg-primary-dark text-white py-[6px] px-[14px] text-[12px] font-semibold tracking-[1px] uppercase no-underline transition-colors cursor-pointer border-none"
                style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 0 100%)' }}
              >
                Daftar
              </button>
            </div>
          )}
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-chrome">
          <Icon name={isOpen ? "x" : "menu"} size={24} />
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden py-4 border-t border-border">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => { handleNavClick(e, link); setIsOpen(false); }}
                className={`font-medium py-2 text-[14px] tracking-[1px] uppercase no-underline ${
                  location.pathname === link.to ? 'text-primary' : 'text-chrome'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  to="/pesanan-saya"
                  onClick={() => setIsOpen(false)}
                  className="font-medium py-2 text-chrome text-[14px] tracking-[1px] uppercase no-underline"
                >
                  Pesanan Saya
                </Link>
                <Link
                  to="/lacak-pesanan"
                  onClick={() => setIsOpen(false)}
                  className="font-medium py-2 text-chrome text-[14px] tracking-[1px] uppercase no-underline"
                >
                  Lacak Pesanan
                </Link>
                <Link
                  to="/pesan"
                  onClick={() => setIsOpen(false)}
                  className="font-medium py-2 text-chrome text-[14px] tracking-[1px] uppercase no-underline"
                >
                  Buat Pesanan
                </Link>
                <div className="border-t border-border pt-3 mt-1">
                  <p className="text-[13px] text-gray mb-2">Masuk sebagai: {user?.name}</p>
                  <button onClick={handleLogout} className="text-[#ea6fab] font-medium py-2 text-[14px]">
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { openLogin(); setIsOpen(false); }}
                  className="flex-1 text-center font-medium py-3 border border-primary text-primary hover:bg-primary hover:text-white transition-colors no-underline text-[14px] uppercase tracking-[1px] cursor-pointer bg-transparent"
                >
                  Masuk
                </button>
                <button
                  onClick={() => { openRegister(); setIsOpen(false); }}
                  className="flex-1 text-center font-medium py-3 bg-primary text-white hover:bg-primary-dark transition-colors no-underline text-[14px] uppercase tracking-[1px] cursor-pointer border-none"
                >
                  Daftar
                </button>
              </div>
            )}

            <a href="https://wa.me/6281234567890" className="bg-[#ea6fab] text-white font-semibold py-3 text-center mt-2 no-underline uppercase tracking-[1px] text-[14px]">
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
