const icons = {
  'Sablon Kaos': ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h12l2 4-3 2v10H7V9L4 7l2-4z" />
      <path d="M9 3c0 0 0.5 2 3 2s3-2 3-2" />
      <path d="M10 9h4v3h-4z" />
      <line x1="12" y1="12" x2="12" y2="15" />
    </svg>
  ),

  'Printing Banner': ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="16" height="14" rx="1" />
      <path d="M8 4v-1" />
      <path d="M16 4v-1" />
      <path d="M12 4V2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <path d="M12 18v3" />
      <circle cx="12" cy="22" r="0.5" fill="currentColor" />
    </svg>
  ),

  'Cetak Stiker': ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M14.5 9.5c-1-1-2.5-1-3.5 0s-1 2.5 0 3.5l3.5 3.5 3.5-3.5c1-1 1-2.5 0-3.5s-2.5-1-3.5 0z" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),

  'Bordir': ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l-1 6 3-2-2 8 3-2-1 6" />
      <path d="M5 20l2-4" />
      <path d="M19 20l-2-4" />
      <path d="M7 16c0 0 2 2 5 2s5-2 5-2" />
      <circle cx="12" cy="4" r="1.5" />
      <path d="M4 8c2 0 3-1 4-2s2-3 4-3 3 2 4 3 2 2 4 2" />
    </svg>
  ),
};

export default function ServiceIcon({ name, size = 24, className = '' }) {
  const IconComponent = icons[name];
  if (!IconComponent) return <span className={className}>📦</span>;
  return <IconComponent size={size} className={className} />;
}
