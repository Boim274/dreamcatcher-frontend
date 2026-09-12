import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
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

function PrintAreaDiagram({ position, areaIndex }) {
  const isFront = position?.includes('depan') || position?.includes('dada') || position === 'standar_depan';
  const isBack = position?.includes('belakang') || position?.includes('punggung');
  const isSleeve = position?.includes('lengan');
  const showBack = isBack && !isFront;
  const hl = PRINT_POSITION_HIGHLIGHTS[position];

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
            BELAKANG
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
          Area {areaIndex + 1}: {isFront ? 'Depan' : isBack ? 'Belakang' : isSleeve ? (position?.includes('kiri') ? 'Lengan Kiri' : 'Lengan Kanan') : hl.label}
        </p>
      )}
      {!position && (
        <p className="text-gray text-[10px] mt-1">Pilih posisi untuk melihat referensi</p>
      )}
    </div>
  );
}

export default function Step2ServiceConfig() {
  const { selectedService, config, setConfig, printAreas, setPrintAreaPosition, setPrintAreaSize, setPrintAreaCustomSize, addPrintArea, removePrintArea, nextStep, prevStep } = useOrderStore();
  const toast = useToast();
  const [showErrors, setShowErrors] = useState(false);

  if (!selectedService) return null;

  const options = selectedService.options_config || {};
  const serviceName = selectedService.name.toLowerCase();
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
      if (errors.sablonType) { toast.warning('Pilih jenis sablon'); return; }
      if (errors.purchaseMethod) { toast.warning('Pilih metode pembelian'); return; }
      if (errors.color) { toast.warning('Pilih warna kaos'); return; }
      for (let i = 0; i < printAreas.length; i++) {
        if (errors.areas[i].position) { toast.warning(`Pilih posisi cetak Area ${i + 1}`); return; }
        if (errors.areas[i].size) {
          const a = printAreas[i];
          if (a.printSize?.includes('custom')) {
            toast.warning(`Masukkan ukuran custom Area ${i + 1} (lebar & tinggi 1-100 cm)`);
          } else {
            toast.warning(`Pilih ukuran gambar Area ${i + 1}`);
          }
          return;
        }
      }
      if (errors.duplicatePosition) { toast.warning('Posisi cetak kedua area tidak boleh sama'); return; }
    } else if (isBanner) {
      if (errors.size) { toast.warning('Pilih ukuran banner'); return; }
      if (errors.material) { toast.warning('Pilih bahan banner'); return; }
    } else if (isStiker) {
      if (errors.material) { toast.warning('Pilih bahan stiker'); return; }
      if (errors.size) { toast.warning('Pilih ukuran stiker'); return; }
    } else if (isBordir) {
      if (errors.position) { toast.warning('Pilih posisi bordir'); return; }
    }
    nextStep();
  };

  const optionClass = (isActive) =>
    `p-3 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      isActive
        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
        : 'border-border hover:border-primary/50'
    }`;

  const usedPositions = printAreas.map((a) => a.position).filter(Boolean);

  const ErrorHint = ({ show, children }) =>
    show ? <p className="text-fire text-[11px] mt-2">{children}</p> : null;

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-2">KONFIGURASI</h2>
      <p className="text-gray text-sm mb-6">{selectedService.name}</p>

      {/* Kaos Config */}
      {isKaos && (
        <div className="space-y-6">
          {/* Sablon Type */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Jenis Sablon <span aria-hidden="true">*</span>
            </label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Pilih teknik cetak. Plastisol tahan lama &amp; cocok untuk warna solid. DTG langsung ke kain, cocok untuk gambar rumit. DTF fleksibel untuk semua jenis kain.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(options.sablon_types || []).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setConfig({ sablonType: type })}
                  aria-pressed={config.sablonType === type}
                  className={optionClass(config.sablonType === type)}
                >
                  <p className={`font-medium text-sm ${config.sablonType === type ? 'text-primary' : 'text-white'}`}>{type}</p>
                  {config.sablonType === type && selectedService.pricing_config?.[type.toLowerCase()] && (
                    <div className="mt-2 text-[11px] text-gray space-y-0.5">
                      {selectedService.pricing_config[type.toLowerCase()].satuan && (
                        <p>Satuan: <span className="text-primary">Rp {Number(selectedService.pricing_config[type.toLowerCase()].satuan).toLocaleString('id-ID')}</span></p>
                      )}
                      {selectedService.pricing_config[type.toLowerCase()].lusin_1 && (
                        <p>1 lusin: <span className="text-primary">Rp {Number(selectedService.pricing_config[type.toLowerCase()].lusin_1).toLocaleString('id-ID')}</span></p>
                      )}
                      {selectedService.pricing_config[type.toLowerCase()].lusin_2_6 && (
                        <p>2-6 lusin: <span className="text-primary">Rp {Number(selectedService.pricing_config[type.toLowerCase()].lusin_2_6).toLocaleString('id-ID')}</span></p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.sablonType}>Pilih salah satu jenis sablon</ErrorHint>
          </div>

          {/* Purchase Method */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Metode Pembelian <span aria-hidden="true">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(options.purchase_methods || []).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setConfig({ purchaseMethod: method })}
                  aria-pressed={config.purchaseMethod === method}
                  className={optionClass(config.purchaseMethod === method)}
                >
                  <div className="flex items-center gap-2">
                    <Icon name={method === 'Satuan' ? 'hash' : 'layers'} size={18}
                      className={config.purchaseMethod === method ? 'text-primary' : 'text-gray'} />
                    <div>
                      <p className={`font-medium text-sm ${config.purchaseMethod === method ? 'text-primary' : 'text-white'}`}>{method}</p>
                      <p className="text-gray text-[11px]">
                        {method === 'Satuan' ? 'Minimal 1 pcs' : 'Minimal 12 pcs, kelipatan 12'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.purchaseMethod}>Pilih salah satu metode pembelian</ErrorHint>
          </div>

          {/* Warna Kaos */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Warna Kaos <span aria-hidden="true">*</span>
            </label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Warna kaos mempengaruhi hasil sablon. Warna gelap membutuhkan layer putih (tinta dasar) agar warna desain tetap cerah.
            </p>
            <div className="grid grid-cols-4 gap-2">
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
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive
                        ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 ${
                        isLight ? 'ring-1 ring-border' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                    <p className={`font-medium text-[11px] truncate ${isActive ? 'text-primary' : 'text-gray-light'}`}>{color}</p>
                  </button>
                );
              })}
            </div>
            <ErrorHint show={showErrors && errors.color}>Pilih salah satu warna kaos</ErrorHint>
          </div>

          {/* Jumlah Area Cetak */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Jumlah Area Cetak</label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Area cetak adalah bagian kaos tempat desain dicetak. 1 Area = satu gambar, 2 Area = dua gambar (misal depan + belakang). Area kedua dikenakan biaya tambahan.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (printAreas.length > 1) removePrintArea(1); }}
                aria-pressed={printAreas.length === 1}
                className={optionClass(printAreas.length === 1)}
              >
                <p className={`font-medium text-sm text-center ${printAreas.length === 1 ? 'text-primary' : 'text-white'}`}>1 Area Cetak</p>
              </button>
              <button
                type="button"
                onClick={() => { if (printAreas.length < 2) addPrintArea(); }}
                disabled={maxAreas < 2}
                aria-pressed={printAreas.length === 2}
                title={maxAreas < 2 ? 'Layanan ini hanya mendukung 1 area cetak' : undefined}
                className={`${optionClass(printAreas.length === 2)} ${maxAreas < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <p className={`font-medium text-sm text-center ${printAreas.length === 2 ? 'text-primary' : 'text-white'}`}>2 Area Cetak</p>
                {printAreas.length === 2 && (
                  <p className="text-primary text-[11px] text-center mt-1">+ Rp {areaSurcharge.toLocaleString('id-ID')}</p>
                )}
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
                className={`bg-card border rounded-xl p-5 transition-all duration-300 ${
                  isComplete
                    ? 'border-primary/40 shadow-lg shadow-primary/5'
                    : 'border-border'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray/40" />
                    )}
                    <p className={`text-[13px] font-semibold tracking-wide uppercase ${isComplete ? 'text-white' : 'text-gray'}`}>
                      Area Cetak {index + 1}
                    </p>
                    {printAreas.length === 2 && index === 1 && (
                      <span className="text-primary text-[11px] ml-1">(+ Rp {areaSurcharge.toLocaleString('id-ID')})</span>
                    )}
                  </div>
                  {index === 1 && (
                    <button
                      type="button"
                      onClick={() => removePrintArea(1)}
                      aria-label="Hapus area cetak 2"
                      className="text-gray hover:text-fire transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>

                {/* Position */}
                <div className="mb-5">
                  <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2.5 block">
                    Posisi Cetak <span className="text-primary">*</span>
                  </label>
                  <p className="text-gray text-[11px] leading-relaxed mb-3">
                    Tentukan posisi desain pada kaos. Gunakan diagram sebagai referensi visual.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
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
                          title={isUsedByOther ? 'Posisi ini sudah dipakai area lain' : undefined}
                          className={`p-3 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isActive
                              ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10'
                              : isUsedByOther
                                ? 'border-border/50 bg-card/50 opacity-40 cursor-not-allowed'
                                : 'border-border bg-card hover:border-primary/40 hover:bg-card/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              name={AREA_POSITION_ICONS[pos.value] || 'circle'}
                              size={16}
                              className={isActive ? 'text-primary' : isUsedByOther ? 'text-gray/40' : 'text-gray'}
                            />
                            <p className={`font-medium text-xs ${
                              isActive ? 'text-primary' : isUsedByOther ? 'text-gray/40' : 'text-gray-light'
                            }`}>
                              {pos.label}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Diagram */}
                  <div className="mt-4 flex justify-center">
                    <PrintAreaDiagram position={area.position} areaIndex={index} />
                  </div>

                  <ErrorHint show={showErrors && errors.areas[index]?.position}>
                    Pilih posisi cetak untuk area ini
                  </ErrorHint>
                  <ErrorHint show={showErrors && errors.duplicatePosition && index === 1}>
                    Posisi tidak boleh sama dengan Area 1
                  </ErrorHint>
                </div>

                {/* Print Size */}
                <div>
                  <label className="text-white text-[11px] font-medium tracking-[1px] uppercase mb-2.5 block">
                    Ukuran Gambar <span className="text-primary">*</span>
                  </label>
                  <p className="text-gray text-[11px] leading-relaxed mb-3">
                    Ukuran area cetak dalam cm. Pilih &quot;Custom&quot; untuk ukuran sendiri (maks. 100 cm).
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
                          className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isActive
                              ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10'
                              : 'border-border bg-card text-gray-light hover:border-primary/40 hover:text-white'
                          }`}
                        >
                          {sz.label}
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
                      className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1.5 ${
                        area.printSize?.includes('custom')
                          ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10'
                          : 'border-dashed border-primary/30 text-primary/70 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      Custom
                    </button>
                  </div>

                  {/* Custom Size Input */}
                  {area.printSize?.includes('custom') && (
                    <div className="mt-4 bg-ink/80 border border-border rounded-xl p-4">
                      <p className="text-gray text-[11px] mb-3">Masukkan ukuran dalam satuan cm (maks. 100 cm)</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-white text-[11px] font-medium mb-1.5 block" htmlFor={`custom-w-${index}`}>
                            Lebar
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
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray text-[11px]">cm</span>
                          </div>
                        </div>
                        <span className="text-gray text-lg mt-5">×</span>
                        <div className="flex-1">
                          <label className="text-white text-[11px] font-medium mb-1.5 block" htmlFor={`custom-h-${index}`}>
                            Tinggi
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
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray text-[11px]">cm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selection Summary */}
                  {posLabel && sizeLabel && (
                    <div className="mt-3 flex items-center gap-2 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-gray">
                        <span className="text-white font-medium">{posLabel}</span>
                        {' · '}
                        <span className="text-white font-medium">{sizeLabel}</span>
                      </span>
                    </div>
                  )}

                  <ErrorHint show={showErrors && errors.areas[index]?.size}>
                    Pilih ukuran gambar untuk area ini
                  </ErrorHint>
                  <ErrorHint show={showErrors && area.printSize?.includes('custom') && (!area.customWidth || !area.customHeight)}>
                    Masukkan lebar dan tinggi gambar
                  </ErrorHint>
                  <ErrorHint show={showErrors && area.printSize?.includes('custom') && ((area.customWidth && (parseInt(area.customWidth) < 1 || parseInt(area.customWidth) > 100)) || (area.customHeight && (parseInt(area.customHeight) < 1 || parseInt(area.customHeight) > 100)))}>
                    Ukuran harus antara 1 - 100 cm
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
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Ukuran Banner <span aria-hidden="true">*</span>
            </label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Pilih ukuran banner sesuai kebutuhan. Ukuran dalam meter.
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
                  <p className={`font-medium text-sm ${config.size === size ? 'text-primary' : 'text-white'}`}>{size}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.size}>Pilih salah satu ukuran banner</ErrorHint>
          </div>

          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Bahan <span aria-hidden="true">*</span>
            </label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Flexi tahan air &amp; cocok untuk outdoor. Vinyl cocok untuk indoor. Backlight transparan untuk panel lampu.
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
                  <p className={`font-medium text-sm ${config.material === mat ? 'text-primary' : 'text-white'}`}>{mat}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.material}>Pilih salah satu bahan banner</ErrorHint>
          </div>
        </div>
      )}

      {/* Stiker Config */}
      {isStiker && (
        <div className="space-y-6">
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Bahan Stiker <span aria-hidden="true">*</span>
            </label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Vinyl tahan air &amp; UV. Chrome mengkilap. Transparent transparan.
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
                  <p className={`font-medium text-sm ${config.material === mat ? 'text-primary' : 'text-white'}`}>{mat}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.material}>Pilih salah satu bahan stiker</ErrorHint>
          </div>

          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
              Ukuran Stiker <span aria-hidden="true">*</span>
            </label>
            <p className="text-gray text-[11px] leading-relaxed mb-3">
              Ukuran stiker dalam cm.
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
                  <p className={`font-medium text-sm ${config.size === size ? 'text-primary' : 'text-white'}`}>{size}</p>
                </button>
              ))}
            </div>
            <ErrorHint show={showErrors && errors.size}>Pilih salah satu ukuran stiker</ErrorHint>
          </div>
        </div>
      )}

      {/* Bordir Config */}
      {isBordir && (
        <div>
          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">
            Posisi Bordir <span aria-hidden="true">*</span>
          </label>
          <p className="text-gray text-[11px] leading-relaxed mb-3">
            Pilih posisi bordir pada produk. Bordir dijahit langsung ke kain, cocok untuk logo &amp; desain sederhana.
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
                <p className={`font-medium text-sm ${config.position === pos ? 'text-primary' : 'text-white'}`}>{pos}</p>
              </button>
            ))}
          </div>
          <ErrorHint show={showErrors && errors.position}>Pilih salah satu posisi bordir</ErrorHint>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}