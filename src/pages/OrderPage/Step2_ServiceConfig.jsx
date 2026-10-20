import { useState, useRef, useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { CheckCircle, Ruler, ChevronDown, Check, Sparkles, Layers, Hash, X, Shirt, Feather, ShieldCheck } from 'lucide-react';

const AREA_POSITION_ICONS = {
  standar_depan: 'layout',
  dada_tengah: 'square',
  dada_kiri: 'align-left',
  dada_kanan: 'align-right',
  standar_belakang: 'layers',
  punggung_atas: 'arrow-up',
  lengan_kiri: 'arrow-left',
  lengan_kanan: 'arrow-right',
};

const COLOR_HEX = {
  'Hitam': '#000000',
  'Putih': '#FFFFFF',
  'Abu-abu': '#D3D3D3',
  'Navy': '#172554',
  'Merah': '#DC2626',
  'Maroon': '#7F1D1D',
  'Biru Royal': '#3B82F6',
  'Biru Muda': '#60A5FA',
  'Hijau Army': '#16A34A',
  'Hijau Botol': '#22C55E',
  'Kuning': '#EAB308',
  'Orange': '#F97316',
  'Cream': '#FEF3C7',
  'Coklat': '#92400E',
  'Ungu': '#A78BFA',
  'Pink': '#EC4899',
};

const LIGHT_COLORS = ['Putih', 'Abu-abu', 'Kuning', 'Cream'];

const PRINT_POSITION_HIGHLIGHTS = {
  standar_depan:    { x: 55, y: 30, w: 90, h: 60, label: 'Dada' },
  dada_tengah:      { x: 70, y: 35, w: 60, h: 50, label: 'Tengah' },
  dada_kiri:        { x: 40, y: 30, w: 50, h: 55, label: 'Kiri' },
  dada_kanan:       { x: 110, y: 30, w: 50, h: 55, label: 'Kanan' },
  standar_belakang: { x: 55, y: 30, w: 90, h: 60, label: 'Punggung' },
  punggung_atas:    { x: 55, y: 20, w: 90, h: 40, label: 'Atas' },
  lengan_kiri:      { x: 10, y: 30, w: 35, h: 35, label: 'Lengan' },
  lengan_kanan:     { x: 155, y: 30, w: 35, h: 35, label: 'Lengan' },
};

function PrintAreaDiagram({ position, areaIndex, language, td }) {
  const isFront = position?.includes('depan') || position?.includes('dada') || position === 'standar_depan';
  const isBack = position?.includes('belakang') || position?.includes('punggung');
  const isSleeve = position?.includes('lengan');
  const showBack = isBack && !isFront;
  const hl = PRINT_POSITION_HIGHLIGHTS[position];

  const posText = (() => {
    if (isFront) return language === 'en' ? 'Front' : 'Depan';
    if (isBack) return language === 'en' ? 'Back' : 'Belakang';
    if (isSleeve) {
      const isLeft = position?.includes('kiri');
      return language === 'en' ? (isLeft ? 'Left Sleeve' : 'Right Sleeve') : (isLeft ? 'Lengan Kiri' : 'Lengan Kanan');
    }
    return hl?.label ? td(hl.label) : '';
  })();

  return (
    <div className="mt-2.5 flex flex-col items-center">
      <svg viewBox="0 0 200 220" className="w-28 h-32 sm:w-32 sm:h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* T-shirt outline */}
        <path
          d="M55 10 L30 30 L10 80 L40 90 L40 210 L160 210 L160 90 L190 80 L170 30 L145 10 Z"
          fill="#2a2a2a"
          stroke="#555"
          strokeWidth="1.5"
        />
        {/* Collar */}
        <path
          d="M55 10 Q100 25 145 10"
          fill="none"
          stroke="#555"
          strokeWidth="1.5"
        />
        {/* Sleeve lines */}
        <line x1="40" y1="90" x2="10" y2="80" stroke="#555" strokeWidth="1" />
        <line x1="160" y1="90" x2="190" y2="80" stroke="#555" strokeWidth="1" />

        {/* Back label */}
        {showBack && (
          <text x="100" y="15" textAnchor="middle" fill="#888" fontSize="8" fontWeight="600">
            {language === 'en' ? 'BACK' : 'BELAKANG'}
          </text>
        )}

        {/* Highlight area */}
        {hl && position && (
          <rect
            x={hl.x}
            y={hl.y}
            width={hl.w}
            height={hl.h}
            rx="4"
            fill="rgba(59, 130, 246, 0.35)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}
      </svg>
      {hl && position ? (
        <p className="text-primary text-[11px] font-medium mt-1">
          {language === 'en' ? `Area ${areaIndex + 1}: ${posText}` : `Area ${areaIndex + 1}: ${posText}`}
        </p>
      ) : (
        <p className="text-gray-400 text-[10px] mt-1">
          {language === 'en' ? 'Select position to view diagram' : 'Pilih posisi untuk melihat visual'}
        </p>
      )}
    </div>
  );
}

const DEFAULT_PRINT_POSITIONS = [
  { label: 'Standar Depan', value: 'standar_depan' },
  { label: 'Dada Tengah', value: 'dada_tengah' },
  { label: 'Dada Kiri', value: 'dada_kiri' },
  { label: 'Dada Kanan', value: 'dada_kanan' },
  { label: 'Standar Belakang', value: 'standar_belakang' },
  { label: 'Punggung Atas', value: 'punggung_atas' },
  { label: 'Lengan Kiri', value: 'lengan_kiri' },
  { label: 'Lengan Kanan', value: 'lengan_kanan' },
];

const DEFAULT_PRINT_SIZES = [
  { label: '9 × 9 cm', value: '9x9' },
  { label: '9 × 28 cm', value: '9x28' },
  { label: '20 × 13 cm (A5)', value: '20x13' },
  { label: '28 × 20 cm (A4)', value: '28x20' },
  { label: '28 × 40 cm (A3)', value: '28x40' },
];

const DEFAULT_COLORS = [
  'Hitam', 'Putih', 'Abu-abu', 'Navy', 'Merah', 'Maroon',
  'Biru Royal', 'Biru Muda', 'Hijau Army', 'Hijau Botol',
  'Kuning', 'Orange', 'Cream', 'Coklat', 'Ungu', 'Pink'
];
const DEFAULT_SABLON_TYPES = ['Plastisol', 'DTF'];
const DEFAULT_PURCHASE_METHODS = ['Satuan', 'Lusinan'];

/**
 * Reusable Sleek Custom Dropdown Component
 */
function CustomDropdown({
  id,
  isOpen,
  onToggle,
  label,
  required = false,
  description,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  error = false,
  errorMessage = '',
  isLight = false,
  disabled = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, onToggle]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative flex flex-col ${isOpen ? 'z-40' : 'z-10'}`}>
      {/* Label & Description */}
      {label && (
        <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-pink-400">*</span>}
          </span>
        </label>
      )}
      {description && (
        <p className="text-gray-400 text-[11px] leading-relaxed mb-2.5">
          {description}
        </p>
      )}

      {/* Dropdown Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onToggle(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[50px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 outline-none select-none ${
          disabled
            ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5'
            : isOpen
            ? 'border-primary ring-2 ring-primary/25 shadow-lg shadow-primary/10'
            : error
            ? 'border-pink-500/80 ring-1 ring-pink-500/30'
            : isLight
            ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800 shadow-sm'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] text-white'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedOption?.colorHex && (
            <div
              className={`w-5 h-5 rounded-full shrink-0 shadow-inner ${
                selectedOption.isLightColor ? 'ring-1 ring-black/15' : ''
              }`}
              style={{ backgroundColor: selectedOption.colorHex }}
            />
          )}

          {selectedOption?.icon && !selectedOption?.colorHex && (
            <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              {selectedOption.icon === 'ruler' ? (
                <Ruler className="w-3.5 h-3.5" />
              ) : (
                <Icon name={selectedOption.icon} size={15} />
              )}
            </div>
          )}

          <div className="truncate">
            {selectedOption ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
                <span className={`font-semibold text-xs sm:text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {selectedOption.label}
                </span>
                {selectedOption.subtitle && (
                  <span className="text-[11px] text-gray-400 truncate font-normal">
                    {selectedOption.subtitle}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-xs sm:text-sm font-normal">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedOption?.badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 hidden sm:inline-block">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : 'text-gray-400'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border shadow-2xl backdrop-blur-2xl p-1.5 max-h-64 overflow-y-auto overscroll-contain transition-all animate-fadeIn ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xl shadow-slate-900/10'
              : 'bg-[#18181b]/95 border-white/15 text-white shadow-2xl shadow-black/80'
          }`}
        >
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400">
              Tidak ada opsi tersedia
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              const isOptDisabled = opt.disabled;

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isOptDisabled}
                  onClick={() => {
                    if (!isOptDisabled) {
                      onChange(opt.value);
                      onToggle(false);
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 text-xs sm:text-sm transition-all duration-150 ${
                    isOptDisabled
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : isSelected
                      ? 'bg-primary/20 text-primary font-bold ring-1 ring-primary/40'
                      : isLight
                      ? 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'
                      : 'hover:bg-white/10 hover:text-white text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.colorHex && (
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 shadow-inner ${
                          opt.isLightColor ? 'ring-1 ring-black/15' : ''
                        }`}
                        style={{ backgroundColor: opt.colorHex }}
                      />
                    )}

                    {opt.icon && !opt.colorHex && (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
                      }`}>
                        {opt.icon === 'ruler' ? (
                          <Ruler className="w-3.5 h-3.5" />
                        ) : (
                          <Icon name={opt.icon} size={14} />
                        )}
                      </div>
                    )}

                    <div className="truncate">
                      <p className={`truncate font-medium ${isSelected ? 'text-primary' : ''}`}>
                        {opt.label}
                      </p>
                      {opt.subtitle && (
                        <p className="text-[11px] text-gray-400 truncate font-normal mt-0.5">
                          {opt.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opt.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <p className="text-pink-400 text-[11px] mt-1.5 flex items-center gap-1.5">
          <Icon name="alert-triangle" size={13} className="shrink-0 text-pink-400" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}

export default function Step2ServiceConfig() {
  const {
    selectedService,
    config,
    setConfig,
    printAreas,
    setPrintAreaPosition,
    setPrintAreaSize,
    setPrintAreaCustomSize,
    addPrintArea,
    removePrintArea,
    nextStep,
    prevStep,
  } = useOrderStore();

  const { t, td, language } = useLanguageStore();
  const toast = useToast();
  const [showErrors, setShowErrors] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  if (!selectedService) return null;

  const parseConfig = (cfg) => {
    if (!cfg) return {};
    if (typeof cfg === 'string') {
      try {
        const p = JSON.parse(cfg);
        return typeof p === 'string' ? JSON.parse(p) : p;
      } catch (e) {
        return {};
      }
    }
    return cfg;
  };

  const rawOptions = parseConfig(selectedService.options_config);
  const options = {
    ...rawOptions,
    purchase_methods: rawOptions.purchase_methods?.length ? rawOptions.purchase_methods : DEFAULT_PURCHASE_METHODS,
    colors: rawOptions.colors?.length ? rawOptions.colors : DEFAULT_COLORS,
    sablon_types: rawOptions.sablon_types?.length ? rawOptions.sablon_types : DEFAULT_SABLON_TYPES,
    print_positions: rawOptions.print_positions?.length ? rawOptions.print_positions : DEFAULT_PRINT_POSITIONS,
    print_sizes: rawOptions.print_sizes?.length ? rawOptions.print_sizes : DEFAULT_PRINT_SIZES,
    sizes: rawOptions.sizes?.length ? rawOptions.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
    materials: rawOptions.materials?.length ? rawOptions.materials : ['Flexi Chinch', 'Vinyl', 'Fabric'],
    positions: rawOptions.positions?.length ? rawOptions.positions : ['Dada Kiri', 'Dada Kanan', 'Punggung', 'Lengan Kiri', 'Lengan Kanan'],
  };

  const serviceName = (selectedService.name || '').toLowerCase();
  const isKaos = serviceName.includes('kaos');
  const isBanner = serviceName.includes('banner');
  const isStiker = serviceName.includes('stiker');
  const isBordir = serviceName.includes('bordir');
  const maxAreas = options.max_print_areas || 2;
  const areaSurcharge = options.area_surcharge || 15000;

  useEffect(() => {
    if (isKaos && !config.shirtModel) {
      setConfig({
        shirtModel: 'Kaos Lengan Pendek',
        shirtModelId: 'short_sleeve',
        shirtModelProductId: 1,
        shirtModelImage: '/products/kaos-lengan-pendek.jpg',
        shirtModelSurcharge: 0,
        material: config.material || 'Cotton Combed 30s',
      });
    }
  }, [isKaos, config.shirtModel, config.material, setConfig]);

  const errors = {
    shirtModel: isKaos && !config.shirtModel,
    sablonType: isKaos && !config.sablonType,
    purchaseMethod: isKaos && !config.purchaseMethod,
    color: isKaos && !config.color,
    areas: isKaos ? printAreas.map((a) => ({
      position: !a.position,
      size: !a.printSize || (a.printSize?.includes('custom') && (!a.customWidth || !a.customHeight || parseInt(a.customWidth) < 1 || parseInt(a.customWidth) > 100 || parseInt(a.customHeight) < 1 || parseInt(a.customHeight) > 100)),
    })) : [],
    duplicatePosition:
      isKaos && printAreas.length === 2 && !!printAreas[0].position && printAreas[0].position === printAreas[1].position,
    size: (isBanner || isStiker) && !config.size,
    material: (isBanner || isStiker) && !config.material,
    position: isBordir && !config.position,
  };

  const handleNext = () => {
    setShowErrors(true);
    if (isKaos) {
      if (errors.shirtModel) { toast.warning(language === 'en' ? 'Please select shirt model' : 'Pilih model kaos (Lengan Pendek / Lengan Panjang)'); return; }
      if (errors.sablonType) { toast.warning(language === 'en' ? 'Please select sablon type' : 'Pilih jenis sablon'); return; }
      if (errors.purchaseMethod) { toast.warning(language === 'en' ? 'Please select purchase method' : 'Pilih metode pembelian'); return; }
      if (errors.color) { toast.warning(language === 'en' ? 'Please select shirt color' : 'Pilih warna kaos'); return; }
      for (let i = 0; i < printAreas.length; i++) {
        if (errors.areas[i].position) { toast.warning(language === 'en' ? `Select print position for Area ${i + 1}` : `Pilih posisi cetak Area ${i + 1}`); return; }
        if (errors.areas[i].size) {
          const a = printAreas[i];
          if (a.printSize?.includes('custom')) {
            toast.warning(language === 'en' ? `Enter custom size for Area ${i + 1} (width & height 1-100 cm)` : `Masukkan ukuran custom Area ${i + 1} (lebar & tinggi 1-100 cm)`);
          } else {
            toast.warning(language === 'en' ? `Select artwork size for Area ${i + 1}` : `Pilih ukuran gambar Area ${i + 1}`);
          }
          return;
        }
      }
      if (errors.duplicatePosition) { toast.warning(language === 'en' ? 'Print positions for both areas cannot be the same' : 'Posisi cetak kedua area tidak boleh sama'); return; }
    } else if (isBanner) {
      if (errors.size) { toast.warning(language === 'en' ? 'Please select banner size' : 'Pilih ukuran banner'); return; }
      if (errors.material) { toast.warning(language === 'en' ? 'Please select banner material' : 'Pilih bahan banner'); return; }
    } else if (isStiker) {
      if (errors.material) { toast.warning(language === 'en' ? 'Please select sticker material' : 'Pilih bahan stiker'); return; }
      if (errors.size) { toast.warning(language === 'en' ? 'Please select sticker size' : 'Pilih ukuran stiker'); return; }
    } else if (isBordir) {
      if (errors.position) { toast.warning(language === 'en' ? 'Please select embroidery position' : 'Pilih posisi bordir'); return; }
    }
    nextStep();
  };

  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const usedPositions = printAreas.map((a) => a.position).filter(Boolean);

  /* Option Lists for Dropdowns */
  const sablonTypeOptions = (options.sablon_types || []).map((type) => ({
    value: type,
    label: td(type),
    subtitle: type === 'Plastisol'
      ? (language === 'en' ? 'Durable & solid finish' : 'Tahan lama & solid')
      : type === 'DTF'
      ? (language === 'en' ? 'Flexible & sharp detail' : 'Fleksibel & tajam semua bahan')
      : (language === 'en' ? 'Premium printing' : 'Kualitas premium'),
    icon: 'sparkles',
  }));

  const purchaseMethodOptions = (options.purchase_methods || []).map((method) => ({
    value: method,
    label: td(method),
    subtitle: method === 'Satuan'
      ? (language === 'en' ? 'Order from 1 pcs (flexible)' : 'Pesan mulai 1 pcs (bebas)')
      : (language === 'en' ? 'From 12 pcs, multiples of 12 (wholesale)' : 'Mulai 12 pcs, kelipatan 12 (harga grosir)'),
    icon: method === 'Satuan' ? 'hash' : 'layers',
  }));

  const colorOptions = (options.colors || []).map((color) => ({
    value: color,
    label: td(color),
    colorHex: COLOR_HEX[color] || '#888888',
    isLightColor: LIGHT_COLORS.includes(color),
  }));

  const kaosMaterialOptions = [
    {
      value: 'Cotton Combed 30s',
      label: 'Cotton Combed 30s',
      subtitle: language === 'en' ? 'Distro standard • Cool, soft & light' : 'Standar distro • Lembut, adem & menyerap keringat',
      badge: language === 'en' ? 'Popular' : 'Terpopuler',
      icon: 'feather',
    },
    {
      value: 'Cotton Combed 24s',
      label: 'Cotton Combed 24s',
      subtitle: language === 'en' ? 'Medium thickness • Sturdy & durable' : 'Sedang • Lebih tebal, kokoh & tidak menerawang',
      icon: 'layers',
    },
    {
      value: 'Cotton Combed 20s',
      label: 'Cotton Combed 20s',
      subtitle: language === 'en' ? 'Heavyweight • Thick & structured' : 'Tebal (Heavyweight) • Tampilan streetwear tegas',
      icon: 'shield',
    },
  ];

  const sizeCategoryOptions = [
    {
      value: 'all',
      label: language === 'en' ? 'Adult & Kids (Combined)' : 'Dewasa & Anak-anak (Lengkap)',
      subtitle: language === 'en' ? 'Can order both adult and kids sizes' : 'Bisa pesan ukuran dewasa dan anak sekaligus',
      icon: 'users',
    },
    {
      value: 'dewasa',
      label: language === 'en' ? 'Adult Only' : 'Ukuran Dewasa Saja',
      subtitle: language === 'en' ? 'Standard sizes S, M, L, XL, XXL, 3XL' : 'Ukuran S, M, L, XL, XXL, 3XL',
      icon: 'user',
    },
    {
      value: 'anak',
      label: language === 'en' ? 'Kids Only' : 'Ukuran Anak-anak Saja',
      subtitle: language === 'en' ? 'Kids sizes (Kids XS - Kids XL / 1 - 10 yrs)' : 'Ukuran Kids XS s/d Kids XL (1 - 10 tahun)',
      icon: 'user',
    },
  ];

  const areaCountOptions = [
    {
      value: '1',
      label: language === 'en' ? '1 Print Area' : '1 Area Cetak',
      subtitle: language === 'en' ? 'Standard 1 side (e.g. front chest)' : 'Standar 1 sisi cetak (misal dada depan)',
      icon: 'layout',
    },
    {
      value: '2',
      label: language === 'en' ? '2 Print Areas' : '2 Area Cetak',
      subtitle: language === 'en'
        ? `2 sides (+ Rp ${areaSurcharge.toLocaleString('id-ID')}/pcs)`
        : `2 sisi cetak (+ Rp ${areaSurcharge.toLocaleString('id-ID')}/pcs)`,
      badge: `+ Rp ${areaSurcharge.toLocaleString('id-ID')}`,
      disabled: maxAreas < 2,
      icon: 'layers',
    },
  ];

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-slate-900/5 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b relative z-10 ${
        isLight ? 'border-slate-100' : 'border-white/10'
      }`}>
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 2 of 6' : 'Langkah 2 dari 6'}
          </span>
          <h2 className={`font-heading text-2xl sm:text-3xl tracking-[1.5px] mt-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'en' ? 'SERVICE CONFIGURATION' : 'KONFIGURASI LAYANAN'}
          </h2>
        </div>
        <div className="text-right">
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            {language === 'en' ? 'Selected Service:' : 'Layanan Dipilih:'}
          </span>
          <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            {td(selectedService.name)}
          </p>
        </div>
      </div>

      {/* Kaos Configuration */}
      {isKaos && (
        <div className="space-y-6 relative z-10">
          {/* 0. Pilihan Model Kaos (Short Sleeve vs Long Sleeve) */}
          <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
              <div>
                <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-primary" />
                  <span>{language === 'en' ? 'T-Shirt Model' : 'Pilihan Model Kaos'} <span className="text-pink-400">*</span></span>
                </label>
                <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'Choose your desired shirt cut. Both models use 100% premium cotton combed.'
                    : 'Pilih model potongan kaos Anda. Keduanya menggunakan bahan 100% Cotton Combed standar distro.'}
                </p>
              </div>

              {config.shirtModel && (
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 border border-primary/20 text-primary shrink-0 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {config.shirtModel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Short Sleeve Option */}
              <button
                type="button"
                onClick={() => setConfig({
                  shirtModel: 'Kaos Lengan Pendek',
                  shirtModelId: 'short_sleeve',
                  shirtModelProductId: 1,
                  shirtModelImage: '/products/kaos-lengan-pendek.jpg',
                  shirtModelSurcharge: 0,
                })}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all outline-none cursor-pointer group ${
                  config.shirtModelId === 'short_sleeve' || config.shirtModel === 'Kaos Lengan Pendek' || !config.shirtModel
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/[0.08] text-white shadow-lg shadow-primary/10'
                    : isLight
                    ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 text-white'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                  <img
                    src="/products/kaos-lengan-pendek.jpg"
                    alt="Kaos Lengan Pendek"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {(config.shirtModelId === 'short_sleeve' || config.shirtModel === 'Kaos Lengan Pendek' || !config.shirtModel) && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold text-xs sm:text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {language === 'en' ? 'Short Sleeve' : 'Kaos Lengan Pendek'}
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                      Reguler
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {language === 'en' ? 'Classic distro cut, cool & comfortable' : 'Potongan standar distro, adem & fleksibel'}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-400 mt-1 inline-block">
                    {language === 'en' ? 'Standard Price' : 'Harga Standar'}
                  </span>
                </div>
              </button>

              {/* Long Sleeve Option */}
              <button
                type="button"
                onClick={() => setConfig({
                  shirtModel: 'Kaos Lengan Panjang',
                  shirtModelId: 'long_sleeve',
                  shirtModelProductId: 9,
                  shirtModelImage: '/products/kaos-lengan-panjang.jpg',
                  shirtModelSurcharge: 5000,
                })}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all outline-none cursor-pointer group ${
                  config.shirtModelId === 'long_sleeve' || config.shirtModel === 'Kaos Lengan Panjang'
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/[0.08] text-white shadow-lg shadow-primary/10'
                    : isLight
                    ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 text-white'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                  <img
                    src="/products/kaos-lengan-panjang.jpg"
                    alt="Kaos Lengan Panjang"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {(config.shirtModelId === 'long_sleeve' || config.shirtModel === 'Kaos Lengan Panjang') && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold text-xs sm:text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {language === 'en' ? 'Long Sleeve' : 'Kaos Lengan Panjang'}
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      Rib Manset
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {language === 'en' ? 'Elastic wrist cuffs, UV protection' : 'Rib manset elastis, nyaman & elegan'}
                  </p>
                  <span className="text-[10px] font-semibold text-primary mt-1 inline-block">
                    + Rp 5.000 / pcs
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Main Attributes Grid (Dropdowns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Jenis Sablon Dropdown */}
            <CustomDropdown
              id="dropdown-sablon-type"
              isOpen={openDropdownId === 'sablon-type'}
              onToggle={(open) => setOpenDropdownId(open ? 'sablon-type' : null)}
              label={language === 'en' ? 'Sablon Type' : 'Jenis Sablon'}
              required
              description={language === 'en'
                ? 'Plastisol is durable & solid. DTF is flexible & sharp for all fabrics.'
                : 'Pilih teknik cetak. Plastisol tahan lama & solid. DTF fleksibel & tajam untuk semua bahan.'}
              value={config.sablonType}
              onChange={(val) => setConfig({ sablonType: val })}
              options={sablonTypeOptions}
              placeholder={language === 'en' ? 'Select sablon type...' : 'Pilih jenis sablon...'}
              error={showErrors && errors.sablonType}
              errorMessage={language === 'en' ? 'Please select a sablon type' : 'Pilih salah satu jenis sablon'}
              isLight={isLight}
            />

            {/* 2. Metode Pembelian Dropdown */}
            <CustomDropdown
              id="dropdown-purchase-method"
              isOpen={openDropdownId === 'purchase-method'}
              onToggle={(open) => setOpenDropdownId(open ? 'purchase-method' : null)}
              label={language === 'en' ? 'Purchase Method' : 'Metode Pembelian'}
              required
              description={language === 'en'
                ? 'Choose single item or wholesale dozen order.'
                : 'Pilih pesan satuan mulai 1 pcs atau lusinan dengan harga grosir.'}
              value={config.purchaseMethod}
              onChange={(val) => setConfig({ purchaseMethod: val })}
              options={purchaseMethodOptions}
              placeholder={language === 'en' ? 'Select purchase method...' : 'Pilih metode pembelian...'}
              error={showErrors && errors.purchaseMethod}
              errorMessage={language === 'en' ? 'Please select a purchase method' : 'Pilih salah satu metode pembelian'}
              isLight={isLight}
            />

            {/* 3. Warna Kaos Dropdown */}
            <CustomDropdown
              id="dropdown-shirt-color"
              isOpen={openDropdownId === 'shirt-color'}
              onToggle={(open) => setOpenDropdownId(open ? 'shirt-color' : null)}
              label={language === 'en' ? 'T-Shirt Color' : 'Warna Kaos'}
              required
              description={language === 'en'
                ? 'Shirt color affects print results. Dark shirts get automatic white underbase.'
                : 'Warna kaos mempengaruhi hasil sablon. Warna gelap otomatis diberi underbase putih.'}
              value={config.color}
              onChange={(val) => setConfig({ color: val })}
              options={colorOptions}
              placeholder={language === 'en' ? 'Select t-shirt color...' : 'Pilih warna kaos...'}
              error={showErrors && errors.color}
              errorMessage={language === 'en' ? 'Please select a t-shirt color' : 'Pilih salah satu warna kaos'}
              isLight={isLight}
            />

            {/* 4. Bahan Kaos Dropdown */}
            <CustomDropdown
              id="dropdown-shirt-material"
              isOpen={openDropdownId === 'shirt-material'}
              onToggle={(open) => setOpenDropdownId(open ? 'shirt-material' : null)}
              label={language === 'en' ? 'Fabric Material' : 'Jenis Bahan Kaos'}
              description={language === 'en'
                ? '100% Pure cotton combed fabric thickness options.'
                : 'Pilihan ketebalan kain katun combed murni standar distro.'}
              value={config.material || 'Cotton Combed 30s'}
              onChange={(val) => setConfig({ material: val })}
              options={kaosMaterialOptions}
              placeholder={language === 'en' ? 'Select fabric material...' : 'Pilih bahan kaos...'}
              isLight={isLight}
            />

            {/* 4. Kategori Ukuran Dropdown */}
            <CustomDropdown
              id="dropdown-size-category"
              isOpen={openDropdownId === 'size-category'}
              onToggle={(open) => setOpenDropdownId(open ? 'size-category' : null)}
              label={language === 'en' ? 'Target Sizing Category' : 'Kategori Ukuran Kaos'}
              description={language === 'en'
                ? 'Choose adult sizes, kids sizes, or both in one order.'
                : 'Pilih ukuran dewasa, anak-anak, atau kombinasi keduanya dalam satu pesanan.'}
              value={config.sizeCategory || 'all'}
              onChange={(val) => setConfig({ sizeCategory: val })}
              options={sizeCategoryOptions}
              placeholder={language === 'en' ? 'Select sizing category...' : 'Pilih kategori ukuran...'}
              isLight={isLight}
            />

            {/* 5. Jumlah Area Cetak Dropdown */}
            <CustomDropdown
              id="dropdown-area-count"
              isOpen={openDropdownId === 'area-count'}
              onToggle={(open) => setOpenDropdownId(open ? 'area-count' : null)}
              label={language === 'en' ? 'Number of Print Areas' : 'Jumlah Area Cetak'}
              description={language === 'en'
                ? '1 Area = 1 print side. 2 Areas = 2 print sides (e.g. front + back).'
                : '1 Area = 1 sisi cetak. 2 Area = 2 sisi cetak (misal depan + punggung).'}
              value={printAreas.length.toString()}
              onChange={(val) => {
                if (val === '1' && printAreas.length > 1) {
                  removePrintArea(1);
                } else if (val === '2' && printAreas.length < 2) {
                  addPrintArea();
                }
              }}
              options={areaCountOptions}
              placeholder={language === 'en' ? 'Select print area count...' : 'Pilih jumlah area cetak...'}
              isLight={isLight}
            />
          </div>

          {/* Pricing Tier Preview Card for Selected Sablon Type */}
          {config.sablonType && selectedService.pricing_config?.[config.sablonType.toLowerCase()] && (
            <div className={`p-4 rounded-2xl border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/10 text-gray-300'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-2 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Estimated Pricing for' : 'Estimasi Harga'} {td(config.sablonType)}:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                {selectedService.pricing_config[config.sablonType.toLowerCase()].satuan && (
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'
                  }`}>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                      {language === 'en' ? 'Single (1 pcs)' : 'Satuan (1 pcs)'}
                    </span>
                    <span className="text-primary font-bold text-xs sm:text-sm mt-0.5 block">
                      Rp {Number(selectedService.pricing_config[config.sablonType.toLowerCase()].satuan).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {selectedService.pricing_config[config.sablonType.toLowerCase()].lusin_1 && (
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'
                  }`}>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                      {language === 'en' ? '1 Dozen (12 pcs)' : '1 Lusin (12 pcs)'}
                    </span>
                    <span className="text-primary font-bold text-xs sm:text-sm mt-0.5 block">
                      Rp {Number(selectedService.pricing_config[config.sablonType.toLowerCase()].lusin_1).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {selectedService.pricing_config[config.sablonType.toLowerCase()].lusin_2_6 && (
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'
                  }`}>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                      {language === 'en' ? '2-6 Dozen' : '2-6 Lusin'}
                    </span>
                    <span className="text-primary font-bold text-xs sm:text-sm mt-0.5 block">
                      Rp {Number(selectedService.pricing_config[config.sablonType.toLowerCase()].lusin_2_6).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Print Areas Configuration Cards */}
          <div className="space-y-5 pt-2">
            {printAreas.map((area, index) => {
              const isAreaComplete = area.position && area.printSize && !area.printSize.includes('custom');
              const isCustomComplete = area.position && area.printSize?.includes('custom') && area.customWidth && area.customHeight;
              const isComplete = isAreaComplete || isCustomComplete;

              const sizeLabel = (() => {
                if (!area.printSize) return null;
                if (area.printSize.startsWith('custom_')) {
                  return area.customWidth && area.customHeight ? `${area.customWidth} × ${area.customHeight} cm` : 'Custom';
                }
                const found = (options.print_sizes || []).find((s) => s.value === area.printSize);
                return found ? found.label : area.printSize;
              })();

              const posLabel = (() => {
                if (!area.position) return null;
                const found = (options.print_positions || []).find((p) => p.value === area.position);
                return found ? found.label : area.position;
              })();

              // Prepare position options for this area
              const positionOptions = (options.print_positions || []).map((pos) => {
                const isUsedByOther = usedPositions.includes(pos.value) && area.position !== pos.value;
                return {
                  value: pos.value,
                  label: td(pos.label),
                  icon: AREA_POSITION_ICONS[pos.value] || 'circle',
                  disabled: isUsedByOther,
                  subtitle: isUsedByOther
                    ? (language === 'en' ? 'Already used in other area' : 'Sudah digunakan di area lain')
                    : null,
                };
              });

              // Prepare size options for this area
              const sizeOptions = [
                ...(options.print_sizes || []).map((sz) => ({
                  value: sz.value,
                  label: td(sz.label),
                  subtitle: sz.value === '28x20' ? 'Ukuran standar A4' : sz.value === '28x40' ? 'Ukuran besar A3' : null,
                })),
                {
                  value: 'custom',
                  label: language === 'en' ? 'Custom Size' : 'Custom Size (Ukuran Khusus)',
                  subtitle: language === 'en' ? 'Enter custom size (1 - 100 cm)' : 'Masukkan lebar & tinggi bebas (1 - 100 cm)',
                  icon: 'ruler',
                },
              ];

              const currentSizeValue = area.printSize?.includes('custom') ? 'custom' : area.printSize;

              return (
                <div
                  key={index}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                    isComplete
                      ? isLight
                        ? 'border-primary/50 bg-primary/[0.02] shadow-md'
                        : 'border-primary/40 bg-white/[0.04] shadow-lg shadow-primary/10'
                      : isLight
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  {/* Area Card Header */}
                  <div className={`flex items-center justify-between mb-5 pb-3 border-b ${
                    isLight ? 'border-slate-200' : 'border-white/10'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${isLight ? 'border-slate-300' : 'border-white/30'}`} />
                      )}
                      <p className={`text-[13px] font-bold tracking-wider uppercase ${
                        isLight ? (isComplete ? 'text-slate-900' : 'text-slate-600') : (isComplete ? 'text-white' : 'text-gray-300')
                      }`}>
                        {language === 'en' ? `Print Area ${index + 1}` : `Area Cetak ${index + 1}`}
                      </p>
                      {printAreas.length === 2 && index === 1 && (
                        <span className="text-primary text-[11px] font-semibold ml-1">
                          (+ Rp {areaSurcharge.toLocaleString('id-ID')})
                        </span>
                      )}
                    </div>
                    {index === 1 && (
                      <button
                        type="button"
                        onClick={() => removePrintArea(1)}
                        aria-label={language === 'en' ? 'Remove print area 2' : 'Hapus area cetak 2'}
                        className={`text-gray-400 hover:text-pink-400 transition-colors p-1.5 rounded-lg flex items-center gap-1 text-xs ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'
                        }`}
                      >
                        <X size={15} />
                        <span className="hidden sm:inline">{language === 'en' ? 'Remove Area 2' : 'Hapus Area 2'}</span>
                      </button>
                    )}
                  </div>

                  {/* Dropdowns Grid for Position & Artwork Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Posisi Cetak Dropdown */}
                    <div>
                      <CustomDropdown
                        id={`dropdown-position-${index}`}
                        isOpen={openDropdownId === `position-${index}`}
                        onToggle={(open) => setOpenDropdownId(open ? `position-${index}` : null)}
                        label={language === 'en' ? 'Print Position' : 'Posisi Cetak'}
                        required
                        description={language === 'en'
                          ? 'Determine artwork placement on shirt.'
                          : 'Tentukan letak desain sablon pada kaos.'}
                        value={area.position}
                        onChange={(val) => setPrintAreaPosition(index, val)}
                        options={positionOptions}
                        placeholder={language === 'en' ? 'Select print position...' : 'Pilih posisi cetak...'}
                        error={showErrors && (errors.areas[index]?.position || (errors.duplicatePosition && index === 1))}
                        errorMessage={
                          errors.duplicatePosition && index === 1
                            ? (language === 'en' ? 'Position cannot be same as Area 1' : 'Posisi tidak boleh sama dengan Area 1')
                            : (language === 'en' ? 'Select print position for this area' : 'Pilih posisi cetak untuk area ini')
                        }
                        isLight={isLight}
                      />

                      {/* Shirt Placement Diagram */}
                      <div className={`mt-3 p-3 rounded-2xl border flex justify-center ${
                        isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'
                      }`}>
                        <PrintAreaDiagram position={area.position} areaIndex={index} language={language} td={td} />
                      </div>
                    </div>

                    {/* Ukuran Gambar Dropdown */}
                    <div>
                      <CustomDropdown
                        id={`dropdown-size-${index}`}
                        isOpen={openDropdownId === `size-${index}`}
                        onToggle={(open) => setOpenDropdownId(open ? `size-${index}` : null)}
                        label={language === 'en' ? 'Artwork Size' : 'Ukuran Gambar'}
                        required
                        description={language === 'en'
                          ? 'Choose standard size or custom size.'
                          : 'Pilih ukuran standar cetak atau masukkan ukuran custom.'}
                        value={currentSizeValue}
                        onChange={(val) => {
                          if (val === 'custom') {
                            setPrintAreaCustomSize(index, area.customWidth || '', area.customHeight || '');
                          } else {
                            setPrintAreaSize(index, val);
                          }
                        }}
                        options={sizeOptions}
                        placeholder={language === 'en' ? 'Select artwork size...' : 'Pilih ukuran gambar...'}
                        error={showErrors && errors.areas[index]?.size}
                        errorMessage={
                          area.printSize?.includes('custom')
                            ? (!area.customWidth || !area.customHeight)
                              ? (language === 'en' ? 'Enter custom width and height' : 'Masukkan lebar & tinggi custom')
                              : (language === 'en' ? 'Size must be between 1 - 100 cm' : 'Ukuran harus antara 1 - 100 cm')
                            : (language === 'en' ? 'Select artwork size for this area' : 'Pilih ukuran gambar untuk area ini')
                        }
                        isLight={isLight}
                      />

                      {/* Custom Size Numeric Input */}
                      {area.printSize?.includes('custom') && (
                        <div className={`mt-3 p-4 rounded-2xl border ${
                          isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-white/10'
                        }`}>
                          <p className="text-gray-400 text-[11px] mb-3">
                            {language === 'en' ? 'Enter size in cm (1 - 100 cm):' : 'Masukkan ukuran dalam cm (1 - 100 cm):'}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-gray-400 text-[11px] font-medium mb-1 block" htmlFor={`custom-w-${index}`}>
                                {language === 'en' ? 'Width (cm)' : 'Lebar (cm)'}
                              </label>
                              <div className="relative">
                                <input
                                  id={`custom-w-${index}`}
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={area.customWidth}
                                  onChange={(e) => setPrintAreaCustomSize(index, e.target.value, area.customHeight)}
                                  placeholder="0"
                                  className="input-premium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm py-2 w-full"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[11px]">cm</span>
                              </div>
                            </div>
                            <span className="text-gray-500 text-lg mt-5 font-bold">×</span>
                            <div className="flex-1">
                              <label className="text-gray-400 text-[11px] font-medium mb-1 block" htmlFor={`custom-h-${index}`}>
                                {language === 'en' ? 'Height (cm)' : 'Tinggi (cm)'}
                              </label>
                              <div className="relative">
                                <input
                                  id={`custom-h-${index}`}
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={area.customHeight}
                                  onChange={(e) => setPrintAreaCustomSize(index, area.customWidth, e.target.value)}
                                  placeholder="0"
                                  className="input-premium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm py-2 w-full"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[11px]">cm</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Area Summary Pill */}
                      {posLabel && sizeLabel && (
                        <div className={`mt-3 p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/10 text-gray-300'
                        }`}>
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-primary">{td(posLabel)}</span>
                            {' · '}
                            <span className="font-medium">{td(sizeLabel)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner Configuration */}
      {isBanner && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CustomDropdown
              id="dropdown-banner-size"
              isOpen={openDropdownId === 'banner-size'}
              onToggle={(open) => setOpenDropdownId(open ? 'banner-size' : null)}
              label={language === 'en' ? 'Banner Size' : 'Ukuran Banner'}
              required
              description={language === 'en'
                ? 'Choose banner size as needed (in meters).'
                : 'Pilih ukuran banner sesuai kebutuhan. Ukuran dalam meter.'}
              value={config.size}
              onChange={(val) => setConfig({ size: val })}
              options={(options.sizes || []).map((size) => ({
                value: size,
                label: `${size} meter`,
              }))}
              placeholder={language === 'en' ? 'Select banner size...' : 'Pilih ukuran banner...'}
              error={showErrors && errors.size}
              errorMessage={language === 'en' ? 'Select a banner size' : 'Pilih salah satu ukuran banner'}
              isLight={isLight}
            />

            <CustomDropdown
              id="dropdown-banner-material"
              isOpen={openDropdownId === 'banner-material'}
              onToggle={(open) => setOpenDropdownId(open ? 'banner-material' : null)}
              label={language === 'en' ? 'Banner Material' : 'Bahan Banner'}
              required
              description={language === 'en'
                ? 'Waterproof flexi for outdoor or sharp vinyl for indoor.'
                : 'Flexi tahan air & outdoor. Vinyl tajam indoor. Backlight transparan khusus box neon.'}
              value={config.material}
              onChange={(val) => setConfig({ material: val })}
              options={(options.materials || []).map((mat) => ({
                value: mat,
                label: td(mat),
                subtitle: mat === 'Flexi Chinch'
                  ? (language === 'en' ? 'Waterproof & durable outdoor' : 'Tahan air & cuaca outdoor')
                  : mat === 'Vinyl'
                  ? (language === 'en' ? 'Sharp finish indoor' : 'Resolusi tajam indoor')
                  : null,
              }))}
              placeholder={language === 'en' ? 'Select banner material...' : 'Pilih bahan banner...'}
              error={showErrors && errors.material}
              errorMessage={language === 'en' ? 'Select a banner material' : 'Pilih salah satu bahan banner'}
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {/* Stiker Configuration */}
      {isStiker && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CustomDropdown
              id="dropdown-stiker-material"
              isOpen={openDropdownId === 'stiker-material'}
              onToggle={(open) => setOpenDropdownId(open ? 'stiker-material' : null)}
              label={language === 'en' ? 'Sticker Material' : 'Bahan Stiker'}
              required
              description={language === 'en'
                ? 'Weatherproof vinyl, metallic chrome, or clear transparent.'
                : 'Vinyl tahan cuaca & air. Chrome metalik elegan. Transparent transparan jernih.'}
              value={config.material}
              onChange={(val) => setConfig({ material: val })}
              options={(options.materials || []).map((mat) => ({
                value: mat,
                label: td(mat),
                subtitle: mat === 'Vinyl'
                  ? (language === 'en' ? 'Waterproof & weatherproof' : 'Tahan air & tahan lama')
                  : mat === 'Chrome'
                  ? (language === 'en' ? 'Metallic chrome shine' : 'Kilau metalik chrome')
                  : mat === 'Transparent'
                  ? (language === 'en' ? 'Clear transparent finish' : 'Transparan jernih tembus pandang')
                  : null,
              }))}
              placeholder={language === 'en' ? 'Select sticker material...' : 'Pilih bahan stiker...'}
              error={showErrors && errors.material}
              errorMessage={language === 'en' ? 'Select a sticker material' : 'Pilih salah satu bahan stiker'}
              isLight={isLight}
            />

            <CustomDropdown
              id="dropdown-stiker-size"
              isOpen={openDropdownId === 'stiker-size'}
              onToggle={(open) => setOpenDropdownId(open ? 'stiker-size' : null)}
              label={language === 'en' ? 'Sticker Size' : 'Ukuran Stiker'}
              required
              description={language === 'en'
                ? 'Sticker dimensions in cm.'
                : 'Ukuran dimensi stiker dalam satuan cm.'}
              value={config.size}
              onChange={(val) => setConfig({ size: val })}
              options={(options.sizes || []).map((size) => ({
                value: size,
                label: `${size} cm`,
              }))}
              placeholder={language === 'en' ? 'Select sticker size...' : 'Pilih ukuran stiker...'}
              error={showErrors && errors.size}
              errorMessage={language === 'en' ? 'Select a sticker size' : 'Pilih salah satu ukuran stiker'}
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {/* Bordir Configuration */}
      {isBordir && (
        <div className="space-y-6 relative z-10">
          <div className="max-w-md">
            <CustomDropdown
              id="dropdown-bordir-position"
              isOpen={openDropdownId === 'bordir-position'}
              onToggle={(open) => setOpenDropdownId(open ? 'bordir-position' : null)}
              label={language === 'en' ? 'Embroidery Position' : 'Posisi Bordir'}
              required
              description={language === 'en'
                ? 'Select high-precision computer embroidery placement.'
                : 'Pilih posisi rajut bordir komputer presisi tinggi.'}
              value={config.position}
              onChange={(val) => setConfig({ position: val })}
              options={(options.positions || []).map((pos) => ({
                value: pos,
                label: td(pos),
                icon: 'circle',
              }))}
              placeholder={language === 'en' ? 'Select embroidery position...' : 'Pilih posisi bordir...'}
              error={showErrors && errors.position}
              errorMessage={language === 'en' ? 'Select an embroidery position' : 'Pilih salah satu posisi bordir'}
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className={`flex gap-4 mt-10 pt-6 border-t relative z-10 ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <button
          type="button"
          onClick={prevStep}
          className="btn-glass flex items-center gap-2 py-3 px-6 rounded-2xl text-xs uppercase tracking-wider font-semibold text-gray-300 hover:text-white"
        >
          <Icon name="arrow-left" size={18} /> {language === 'en' ? 'Back' : 'Kembali'}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 cursor-pointer"
        >
          {language === 'en' ? 'Continue to Size & Quantity' : 'Lanjut ke Ukuran & Jumlah'} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}