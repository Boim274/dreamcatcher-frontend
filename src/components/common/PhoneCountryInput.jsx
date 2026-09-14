import React, { useState, useEffect, useRef, useMemo } from 'react';

// Daftar kode negara lengkap & terstruktur
export const COUNTRY_LIST = [
  { code: 'ID', name: 'Indonesia', dial_code: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dial_code: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapura', dial_code: '+65', flag: '🇸🇬' },
  { code: 'BN', name: 'Brunei Darussalam', dial_code: '+673', flag: '🇧🇳' },
  { code: 'TH', name: 'Thailand', dial_code: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Filipina', dial_code: '+63', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', dial_code: '+84', flag: '🇻🇳' },
  { code: 'KH', name: 'Kamboja', dial_code: '+855', flag: '🇰🇭' },
  { code: 'MM', name: 'Myanmar', dial_code: '+95', flag: '🇲🇲' },
  { code: 'TL', name: 'Timor Leste', dial_code: '+670', flag: '🇹🇱' },
  { code: 'US', name: 'Amerika Serikat', dial_code: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'Inggris (UK)', dial_code: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Jepang', dial_code: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Korea Selatan', dial_code: '+82', flag: '🇰🇷' },
  { code: 'SA', name: 'Arab Saudi', dial_code: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Uni Emirat Arab', dial_code: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', dial_code: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dial_code: '+965', flag: '🇰🇼' },
  { code: 'TR', name: 'Turki', dial_code: '+90', flag: '🇹🇷' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', dial_code: '+852', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', dial_code: '+886', flag: '🇹🇼' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dial_code: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial_code: '+880', flag: '🇧🇩' },
  { code: 'DE', name: 'Jerman', dial_code: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'Prancis', dial_code: '+33', flag: '🇫🇷' },
  { code: 'NL', name: 'Belanda', dial_code: '+31', flag: '🇳🇱' },
  { code: 'IT', name: 'Italia', dial_code: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spanyol', dial_code: '+34', flag: '🇪🇸' },
  { code: 'CH', name: 'Swiss', dial_code: '+41', flag: '🇨🇭' },
  { code: 'CA', name: 'Kanada', dial_code: '+1', flag: '🇨🇦' },
  { code: 'NZ', name: 'Selandia Baru', dial_code: '+64', flag: '🇳🇿' },
  { code: 'RU', name: 'Rusia', dial_code: '+7', flag: '🇷🇺' },
  { code: 'BR', name: 'Brasil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Meksiko', dial_code: '+52', flag: '🇲🇽' },
  { code: 'ZA', name: 'Afrika Selatan', dial_code: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Mesir', dial_code: '+20', flag: '🇪🇬' },
];

/**
 * Komponen Input Nomor Telepon dengan Pemilih Kode Negara (+62 Indonesia & Negara Asing)
 */
export default function PhoneCountryInput({
  value = '',
  onChange,
  placeholder = '81234567890',
  id = 'phone-input',
  name = 'phone',
  disabled = false,
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_LIST[0]); // Default Indonesia (+62)
  const [phoneNumber, setPhoneNumber] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Parsing value awal atau ketika prop `value` berubah
  useEffect(() => {
    if (!value) {
      setPhoneNumber('');
      return;
    }

    const strVal = String(value).trim();

    if (strVal.startsWith('+')) {
      // Urutkan dial_code terpanjang lebih dulu agar +673 tidak tertukar dengan +67
      const sortedByCodeLen = [...COUNTRY_LIST].sort((a, b) => b.dial_code.length - a.dial_code.length);
      const match = sortedByCodeLen.find(c => strVal.startsWith(c.dial_code));

      if (match) {
        setSelectedCountry(match);
        let digits = strVal.slice(match.dial_code.length).replace(/\D/g, '');
        if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
        setPhoneNumber(digits);
        return;
      }
    }

    // Jika berawalan angka biasa (misal 08123... atau 8123...)
    let digits = strVal.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    setPhoneNumber(digits);
  }, [value]);

  // Handle klik di luar untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus search saat dropdown dibuka
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter daftar negara berdasarkan search
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_LIST;
    const q = search.toLowerCase().trim();
    return COUNTRY_LIST.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.dial_code.includes(q) ||
           c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Handle perubahan input angka telepon
  const handleNumberChange = (e) => {
    let inputDigits = e.target.value.replace(/\D/g, '');
    
    // Otomatis hapus awalan angka 0 jika pengguna mengetik 0812...
    if (inputDigits.startsWith('0')) {
      inputDigits = inputDigits.replace(/^0+/, '');
    }

    setPhoneNumber(inputDigits);

    // Kirim nomor lengkap ke parent form (+6281234567890)
    const fullNumber = inputDigits ? `${selectedCountry.dial_code}${inputDigits}` : '';
    if (onChange) {
      onChange(fullNumber);
    }
  };

  // Handle pemilihan negara
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');

    const fullNumber = phoneNumber ? `${country.dial_code}${phoneNumber}` : '';
    if (onChange) {
      onChange(fullNumber);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-stretch rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] focus-within:border-primary/60 focus-within:bg-white/[0.08] focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 overflow-hidden shadow-inner">
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white border-r border-white/10 transition-colors focus:outline-none select-none shrink-0"
          title={`${selectedCountry.name} (${selectedCountry.dial_code})`}
          aria-expanded={isOpen}
        >
          <span className="text-xl leading-none">{selectedCountry.flag}</span>
          <span className="text-xs sm:text-sm font-semibold text-primary font-mono">
            {selectedCountry.dial_code}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Text Input Angka Telepon */}
        <input
          type="tel"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none font-mono tracking-wide"
        />
      </div>

      {/* Popover / Dropdown Menu Pilihan Negara */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 max-w-[90vw] bg-[#1a1320] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-white/10 bg-white/5">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari negara atau kode (+62, +1)..."
                className="w-full bg-black/40 text-xs text-white placeholder-zinc-400 px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List Negara */}
          <div className="max-h-56 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code && c.dial_code === selectedCountry.dial_code;
                return (
                  <button
                    key={`${c.code}-${c.dial_code}`}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/20 text-white font-semibold'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-mono text-xs text-primary font-medium shrink-0 ml-2">
                      {c.dial_code}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-zinc-400">
                Negara tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
