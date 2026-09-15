import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { CheckCircle, Ruler } from 'lucide-react';

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
  standar_depan:  { x: 55, y: 30, w: 90, h: 60, label: 'Dada' },
  dada_tengah:    { x: 70, y: 35, w: 60, h: 50, label: 'Tengah' },
  dada_kiri:      { x: 40, y: 30, w: 50, h: 55, label: 'Kiri' },
  dada_kanan:     { x: 110, y: 30, w: 50, h: 55, label: 'Kanan' },
  standar_belakang: { x: 55, y: 30, w: 90, h: 60, label: 'Punggung' },
  punggung_atas:  { x: 55, y: 20, w: 90, h: 40, label: 'Atas' },
  lengan_kiri:    { x: 10, y: 30, w: 35, h: 35, label: 'Lengan' },
  lengan_kanan:   { x: 155, y: 30, w: 35, h: 35, label: 'Lengan' },
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
    <div className="mt-3 flex flex-col items-center">
      <svg viewBox="0 0 200 220" className="w-32 h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      {hl && position && (
        <p className="text-primary text-[10px] font-medium mt-1">
          {language === 'en' ? `Area ${areaIndex + 1}: ${posText}` : `Area ${areaIndex + 1}: ${posText}`}
        </p>
      )}
      {!position && (
        <p className="text-gray text-[10px] mt-1">
          {language === 'en' ? 'Select position to view reference' : 'Pilih posisi untuk melihat referensi'}
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

const DEFAULT_COLORS = ['Hitam', 'Putih', 'Abu-abu', 'Navy', 'Merah', 'Maroon', 'Biru Royal', 'Biru Muda', 'Hijau Army', 'Hijau Botol', 'Kuning', 'Orange', 'Cream', 'Coklat', 'Ungu', 'Pink'];
const DEFAULT_SABLON_TYPES = ['Plastisol', 'DTF'];
const DEFAULT_PURCHASE_METHODS = ['Satuan', 'Lusinan'];

export default function Step2ServiceConfig() {
  const { selectedService, config, setConfig, printAreas, setPrintAreaPosition, setPrintAreaSize, setPrintAreaCustomSize, addPrintArea, removePrintArea, nextStep, prevStep } = useOrderStore();
  const { t, td, language } = useLanguageStore();
  const toast = useToast();
  const [showErrors, setShowErrors] = useState(false);

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

  const errors = {
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

  const optionClass = (isActive) =>
    `p-3.5 rounded-2xl border text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      isActive
        ? 'border-primary/80 bg-primary/15 shadow-lg shadow-primary/20 ring-1 ring-primary/40'
        : isLight
        ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
    }`;

  const usedPositions = printAreas.map((a) => a.position).filter(Boolean);

  const ErrorHint = ({ show, children }) =>
    show ? <p className="text-pink-400 text-[11px] mt-2 flex items-center gap-1"><span>⚠️</span> {children}</p> : null;

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-slate-900/5 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className={`flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b ${
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
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{language === 'en' ? 'Selected Service:' : 'Layanan Dipilih:'}</span>
          <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{td(selectedService.name)}</p>
        </div>
      </div>

      {/* Kaos Config */}
      {isKaos && (
        <div className="space-y-6">
          {/* Sablon Type */}
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Sablon Type' : 'Jenis Sablon'} <span className="text-pink-400">*</span>
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en'
                ? 'Choose printing technique. Plastisol is durable & solid. DTG is great for complex details. DTF is flexible & sharp for all fabrics.'
                : 'Pilih teknik cetak. Plastisol tahan lama & solid. DTG ramah detail kompleks. DTF fleksibel & tajam untuk semua bahan.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.sablon_types || []).map((type) => {
                const isActive = config.sablonType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setConfig({ sablonType: type })}
                    aria-pressed={isActive}
                    className={optionClass(isActive)}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-white'}`}>{td(type)}</p>
                      {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    </div>
                    {isActive && selectedService.pricing_config?.[type.toLowerCase()] && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-gray-300 space-y-1">
                        {selectedService.pricing_config[type.toLowerCase()].satuan && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">{language === 'en' ? 'Single:' : 'Satuan:'}</span>
                            <span className="text-primary font-semibold">Rp {Number(selectedService.pricing_config[type.toLowerCase()].satuan).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {selectedService.pricing_config[type.toLowerCase()].lusin_1 && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">{language === 'en' ? '1 dozen:' : '1 lusin:'}</span>
                            <span className="text-primary font-semibold">Rp {Number(selectedService.pricing_config[type.toLowerCase()].lusin_1).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {selectedService.pricing_config[type.toLowerCase()].lusin_2_6 && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">{language === 'en' ? '2-6 dozen:' : '2-6 lusin:'}</span>
                            <span className="text-primary font-semibold">Rp {Number(selectedService.pricing_config[type.toLowerCase()].lusin_2_6).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <ErrorHint show={showErrors && errors.sablonType}>
              {language === 'en' ? 'Please select a sablon type' : 'Pilih salah satu jenis sablon'}
            </ErrorHint>
          </div>

          {/* Purchase Method */}
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Purchase Method' : 'Metode Pembelian'} <span className="text-pink-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(options.purchase_methods || []).map((method) => {
                const isActive = config.purchaseMethod === method;
                return (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setConfig({ purchaseMethod: method })}
                    aria-pressed={isActive}
                    className={optionClass(isActive)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-gray-400'}`}>
                        <Icon name={method === 'Satuan' ? 'hash' : 'layers'} size={20} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-white'}`}>{td(method)}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          {method === 'Satuan'
                            ? (language === 'en' ? 'Order from 1 pcs (flexible)' : 'Pesan mulai 1 pcs (bebas)')
                            : (language === 'en' ? 'From 12 pcs, multiples of 12 (wholesale price)' : 'Mulai 12 pcs, kelipatan 12 (harga grosir)')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <ErrorHint show={showErrors && errors.purchaseMethod}>
              {language === 'en' ? 'Please select a purchase method' : 'Pilih salah satu metode pembelian'}
            </ErrorHint>
          </div>

          {/* Warna Kaos */}
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'T-Shirt Color' : 'Warna Kaos'} <span className="text-pink-400">*</span>
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en'
                ? 'Shirt color affects print results. Dark shirts automatically get a white underbase for vivid prints.'
                : 'Warna kaos mempengaruhi hasil sablon. Warna gelap otomatis diberi underbase putih agar hasil cetak menyala.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(options.colors || []).map((color) => {
                const isActive = config.color === color;
                const hex = COLOR_HEX[color] || '#888888';
                const isLight = LIGHT_COLORS.includes(color);
                return (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setConfig({ color })}
                    aria-pressed={isActive}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive
                        ? 'border-primary bg-primary/20 shadow-md shadow-primary/20 ring-1 ring-primary/40'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 shadow-inner ${
                        isLight ? 'ring-1 ring-white/20' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                    <p className={`font-medium text-xs truncate ${isActive ? 'text-white font-semibold' : 'text-gray-300'}`}>{td(color)}</p>
                  </button>
                );
              })}
            </div>
            <ErrorHint show={showErrors && errors.color}>
              {language === 'en' ? 'Please select a t-shirt color' : 'Pilih salah satu warna kaos'}
            </ErrorHint>
          </div>

          {/* Jumlah Area Cetak */}
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Number of Print Areas' : 'Jumlah Area Cetak'}
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en'
                ? '1 Area = 1 print side (e.g. front chest). 2 Areas = 2 print sides (e.g. front chest + back).'
                : '1 Area = 1 sisi cetak (misal dada depan). 2 Area = 2 sisi cetak (misal dada depan + punggung belakang).'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (printAreas.length > 1) removePrintArea(1); }}
                aria-pressed={printAreas.length === 1}
                className={optionClass(printAreas.length === 1)}
              >
                <p className={`font-bold text-sm text-center ${printAreas.length === 1 ? 'text-primary' : 'text-white'}`}>
                  {language === 'en' ? '1 Print Area' : '1 Area Cetak'}
                </p>
                <p className="text-gray-400 text-[11px] text-center mt-1">
                  {language === 'en' ? 'Standard 1 position' : 'Standar 1 posisi'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => { if (printAreas.length < 2) addPrintArea(); }}
                disabled={maxAreas < 2}
                aria-pressed={printAreas.length === 2}
                title={maxAreas < 2 ? (language === 'en' ? 'This service only supports 1 print area' : 'Layanan ini hanya mendukung 1 area cetak') : undefined}
                className={`${optionClass(printAreas.length === 2)} ${maxAreas < 2 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <p className={`font-bold text-sm text-center ${printAreas.length === 2 ? 'text-primary' : 'text-white'}`}>
                  {language === 'en' ? '2 Print Areas' : '2 Area Cetak'}
                </p>
                <p className="text-primary text-[11px] text-center mt-1 font-semibold">+ Rp {areaSurcharge.toLocaleString('id-ID')}/pcs</p>
              </button>
            </div>
          </div>

          {/* Print Areas */}
          {printAreas.map((area, index) => {
            const isAreaComplete = area.position && area.printSize && !area.printSize.includes('custom');
            const isCustomComplete = area.position && area.printSize?.includes('custom') && area.customWidth && area.customHeight;
            const isComplete = isAreaComplete || isCustomComplete;
            const sizeLabel = (() => {
              if (!area.printSize) return null;
              if (area.printSize.startsWith('custom_')) {
                return area.customWidth && area.customHeight ? `${area.customWidth} × ${area.customHeight} cm` : null;
              }
              const found = (options.print_sizes || []).find((s) => s.value === area.printSize);
              return found ? found.label : area.printSize;
            })();
            const posLabel = (() => {
              if (!area.position) return null;
              const found = (options.print_positions || []).find((p) => p.value === area.position);
              return found ? found.label : area.position;
            })();

            return (
              <div
                key={index}
                className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                  isComplete
                    ? 'border-primary/40 bg-white/[0.04] shadow-lg shadow-primary/10'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                    )}
                    <p className={`text-[13px] font-bold tracking-wider uppercase ${isComplete ? 'text-white' : 'text-gray-300'}`}>
                      {language === 'en' ? `Print Area ${index + 1}` : `Area Cetak ${index + 1}`}
                    </p>
                    {printAreas.length === 2 && index === 1 && (
                      <span className="text-primary text-[11px] font-semibold ml-1">(+ Rp {areaSurcharge.toLocaleString('id-ID')})</span>
                    )}
                  </div>
                  {index === 1 && (
                    <button
                      type="button"
                      onClick={() => removePrintArea(1)}
                      aria-label={language === 'en' ? 'Remove print area 2' : 'Hapus area cetak 2'}
                      className="text-gray-400 hover:text-pink-400 transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>

                {/* Position */}
                <div className="mb-5">
                  <label className="text-white text-[11px] font-bold tracking-[1.5px] uppercase mb-2 block">
                    {language === 'en' ? 'Print Position' : 'Posisi Cetak'} <span className="text-pink-400">*</span>
                  </label>
                  <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
                    {language === 'en'
                      ? 'Determine artwork placement. Diagram below reflects placement on shirt.'
                      : 'Tentukan letak desain. Diagram di bawah mencerminkan visual posisi pada kaos.'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(options.print_positions || []).map((pos) => {
                      const isUsedByOther = usedPositions.includes(pos.value) && area.position !== pos.value;
                      const isActive = area.position === pos.value;
                      return (
                        <button
                          type="button"
                          key={pos.value}
                          onClick={() => !isUsedByOther && setPrintAreaPosition(index, pos.value)}
                          disabled={isUsedByOther}
                          aria-pressed={isActive}
                          title={isUsedByOther ? (language === 'en' ? 'This position is already used by another area' : 'Posisi ini sudah dipakai area lain') : undefined}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isActive
                              ? 'border-primary bg-primary/20 shadow-md shadow-primary/20 text-white font-semibold'
                              : isUsedByOther
                                ? 'border-white/5 bg-white/[0.01] opacity-30 cursor-not-allowed text-gray-500'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              name={AREA_POSITION_ICONS[pos.value] || 'circle'}
                              size={16}
                              className={isActive ? 'text-primary' : isUsedByOther ? 'text-gray-600' : 'text-gray-400'}
                            />
                            <p className="text-xs truncate">{td(pos.label)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Diagram */}
                  <div className="mt-4 flex justify-center p-3 rounded-xl bg-black/30 border border-white/5">
                    <PrintAreaDiagram position={area.position} areaIndex={index} language={language} td={td} />
                  </div>

                  <ErrorHint show={showErrors && errors.areas[index]?.position}>
                    {language === 'en' ? 'Select print position for this area' : 'Pilih posisi cetak untuk area ini'}
                  </ErrorHint>
                  <ErrorHint show={showErrors && errors.duplicatePosition && index === 1}>
                    {language === 'en' ? 'Position cannot be the same as Area 1' : 'Posisi tidak boleh sama dengan Area 1'}
                  </ErrorHint>
                </div>

                {/* Print Size */}
                <div>
                  <label className="text-white text-[11px] font-bold tracking-[1.5px] uppercase mb-2 block">
                    {language === 'en' ? 'Artwork Size' : 'Ukuran Gambar'} <span className="text-pink-400">*</span>
                  </label>
                  <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
                    {language === 'en'
                      ? 'Standard or custom print area size (max. 100 cm).'
                      : 'Ukuran area cetak standar atau custom (maks. 100 cm).'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(options.print_sizes || []).map((sz) => {
                      const isActive = area.printSize === sz.value;
                      return (
                        <button
                          type="button"
                          key={sz.value}
                          onClick={() => setPrintAreaSize(index, sz.value)}
                          aria-pressed={isActive}
                          className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isActive
                              ? 'border-primary bg-primary/20 text-white shadow-md shadow-primary/20'
                              : 'border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {td(sz.label)}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        if (!area.printSize?.includes('custom')) {
                          setPrintAreaCustomSize(index, '', '');
                        }
                      }}
                      aria-pressed={area.printSize?.includes('custom')}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1.5 ${
                        area.printSize?.includes('custom')
                          ? 'border-primary bg-primary/20 text-white shadow-md shadow-primary/20'
                          : 'border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/10'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Custom Size' : 'Custom Size'}
                    </button>
                  </div>

                  {/* Custom Size Input */}
                  {area.printSize?.includes('custom') && (
                    <div className="mt-4 bg-black/40 border border-white/10 rounded-2xl p-4">
                      <p className="text-gray-300 text-[11px] mb-3">
                        {language === 'en' ? 'Enter size in cm (max. 100 cm):' : 'Masukkan ukuran dalam satuan cm (maks. 100 cm):'}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-gray-300 text-[11px] font-medium mb-1.5 block" htmlFor={`custom-w-${index}`}>
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
                              className="input-premium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm py-2"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[11px]">cm</span>
                          </div>
                        </div>
                        <span className="text-gray-500 text-lg mt-5 font-bold">×</span>
                        <div className="flex-1">
                          <label className="text-gray-300 text-[11px] font-medium mb-1.5 block" htmlFor={`custom-h-${index}`}>
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
                              className="input-premium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm py-2"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[11px]">cm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selection Summary */}
                  {posLabel && sizeLabel && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="text-gray-400">
                        <span className="text-white font-medium">{td(posLabel)}</span>
                        {' · '}
                        <span className="text-white font-medium">{td(sizeLabel)}</span>
                      </span>
                    </div>
                  )}

                  <ErrorHint show={showErrors && errors.areas[index]?.size}>
                    {language === 'en' ? 'Select artwork size for this area' : 'Pilih ukuran gambar untuk area ini'}
                  </ErrorHint>
                  <ErrorHint show={showErrors && area.printSize?.includes('custom') && (!area.customWidth || !area.customHeight)}>
                    {language === 'en' ? 'Enter artwork width and height' : 'Masukkan lebar dan tinggi gambar'}
                  </ErrorHint>
                  <ErrorHint show={showErrors && area.printSize?.includes('custom') && ((area.customWidth && (parseInt(area.customWidth) < 1 || parseInt(area.customWidth) > 100)) || (area.customHeight && (parseInt(area.customHeight) < 1 || parseInt(area.customHeight) > 100)))}>
                    {language === 'en' ? 'Size must be between 1 - 100 cm' : 'Ukuran harus antara 1 - 100 cm'}
                  </ErrorHint>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banner Config */}
      {isBanner && (
        <div className="space-y-6">
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Banner Size' : 'Ukuran Banner'} <span className="text-pink-400">*</span>
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en' ? 'Choose banner size as needed. Size in meters.' : 'Pilih ukuran banner sesuai kebutuhan. Ukuran dalam meter.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.sizes || []).map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setConfig({ size })}
                  aria-pressed={config.size === size}
                  className={optionClass(config.size === size)}
                >
                  <p className={`font-semibold text-sm ${config.size === size ? 'text-primary' : 'text-white'}`}>{size}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.size}>
              {language === 'en' ? 'Select a banner size' : 'Pilih salah satu ukuran banner'}
            </ErrorHint>
          </div>

          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Material' : 'Bahan'} <span className="text-pink-400">*</span>
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en'
                ? 'Waterproof flexi & outdoor. Sharp vinyl for indoor. Transparent backlight for neon boxes.'
                : 'Flexi tahan air & outdoor. Vinyl tajam indoor. Backlight transparan khusus box neon.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.materials || []).map((mat) => (
                <button
                  type="button"
                  key={mat}
                  onClick={() => setConfig({ material: mat })}
                  aria-pressed={config.material === mat}
                  className={optionClass(config.material === mat)}
                >
                  <p className={`font-semibold text-sm ${config.material === mat ? 'text-primary' : 'text-white'}`}>{td(mat)}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.material}>
              {language === 'en' ? 'Select a banner material' : 'Pilih salah satu bahan banner'}
            </ErrorHint>
          </div>
        </div>
      )}

      {/* Stiker Config */}
      {isStiker && (
        <div className="space-y-6">
          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Sticker Material' : 'Bahan Stiker'} <span className="text-pink-400">*</span>
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en'
                ? 'Weatherproof & waterproof vinyl. Elegant metallic chrome. Clear transparent.'
                : 'Vinyl tahan cuaca & air. Chrome metalik elegan. Transparent transparan jernih.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.materials || []).map((mat) => (
                <button
                  type="button"
                  key={mat}
                  onClick={() => setConfig({ material: mat })}
                  aria-pressed={config.material === mat}
                  className={optionClass(config.material === mat)}
                >
                  <p className={`font-semibold text-sm ${config.material === mat ? 'text-primary' : 'text-white'}`}>{td(mat)}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.material}>
              {language === 'en' ? 'Select a sticker material' : 'Pilih salah satu bahan stiker'}
            </ErrorHint>
          </div>

          <div>
            <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
              {language === 'en' ? 'Sticker Size' : 'Ukuran Stiker'} <span className="text-pink-400">*</span>
            </label>
            <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
              {language === 'en' ? 'Sticker size in cm.' : 'Ukuran stiker dalam cm.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(options.sizes || []).map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setConfig({ size })}
                  aria-pressed={config.size === size}
                  className={optionClass(config.size === size)}
                >
                  <p className={`font-semibold text-sm ${config.size === size ? 'text-primary' : 'text-white'}`}>{size}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.size}>
              {language === 'en' ? 'Select a sticker size' : 'Pilih salah satu ukuran stiker'}
            </ErrorHint>
          </div>
        </div>
      )}

      {/* Bordir Config */}
      {isBordir && (
        <div>
          <label className="text-primary text-[12px] font-bold tracking-[1.5px] uppercase mb-2 block">
            {language === 'en' ? 'Embroidery Position' : 'Posisi Bordir'} <span className="text-pink-400">*</span>
          </label>
          <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
            {language === 'en' ? 'Select high-precision computer embroidery placement.' : 'Pilih posisi rajut bordir komputer presisi tinggi.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(options.positions || []).map((pos) => (
              <button
                type="button"
                key={pos}
                onClick={() => setConfig({ position: pos })}
                aria-pressed={config.position === pos}
                className={optionClass(config.position === pos)}
              >
                <p className={`font-semibold text-sm ${config.position === pos ? 'text-primary' : 'text-white'}`}>{td(pos)}</p>
              </button>
            ))}
          </div>
          <ErrorHint show={showErrors && errors.position}>
            {language === 'en' ? 'Select an embroidery position' : 'Pilih salah satu posisi bordir'}
          </ErrorHint>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-10 pt-6 border-t border-white/10">
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
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25"
        >
          {language === 'en' ? 'Continue to Size & Quantity' : 'Lanjut ke Ukuran & Jumlah'} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}