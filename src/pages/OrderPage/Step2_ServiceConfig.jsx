import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';

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

export default function Step2ServiceConfig() {
  const { selectedService, config, setConfig, printAreas, setPrintAreaPosition, setPrintAreaSize, addPrintArea, removePrintArea, nextStep, prevStep } = useOrderStore();
  const toast = useToast();

  if (!selectedService) return null;

  const options = selectedService.options_config || {};
  const serviceName = selectedService.name.toLowerCase();
  const isKaos = serviceName.includes('kaos');
  const maxAreas = options.max_print_areas || 2;
  const areaSurcharge = options.area_surcharge || 15000;

  const handleNext = () => {
    if (isKaos) {
      if (!config.sablonType) { toast.warning('Pilih jenis sablon'); return; }
      if (!config.purchaseMethod) { toast.warning('Pilih metode pembelian'); return; }
      if (!config.color) { toast.warning('Pilih warna kaos'); return; }
      for (let i = 0; i < printAreas.length; i++) {
        if (!printAreas[i].position) { toast.warning(`Pilih posisi cetak Area ${i + 1}`); return; }
        if (!printAreas[i].printSize) { toast.warning(`Pilih ukuran gambar Area ${i + 1}`); return; }
      }
      if (printAreas.length === 2 && printAreas[0].position === printAreas[1].position) {
        toast.warning('Posisi cetak kedua area tidak boleh sama');
        return;
      }
    } else if (serviceName.includes('banner')) {
      if (!config.size) { toast.warning('Pilih ukuran banner'); return; }
      if (!config.material) { toast.warning('Pilih bahan banner'); return; }
    } else if (serviceName.includes('stiker')) {
      if (!config.material) { toast.warning('Pilih bahan stiker'); return; }
      if (!config.size) { toast.warning('Pilih ukuran stiker'); return; }
    } else if (serviceName.includes('bordir')) {
      if (!config.position) { toast.warning('Pilih posisi bordir'); return; }
    }
    nextStep();
  };

  const selectClass = (isActive) =>
    `p-3 rounded-xl border-2 text-left transition-all duration-200 ${
      isActive
        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
        : 'border-border hover:border-primary/50'
    }`;

  const positionClass = (isActive) =>
    `p-3 rounded-xl border-2 text-left transition-all duration-200 ${
      isActive
        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
        : 'border-border hover:border-primary/50'
    }`;

  const usedPositions = printAreas.map((a) => a.position).filter(Boolean);

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-2">KONFIGURASI</h2>
      <p className="text-gray text-sm mb-6">{selectedService.name}</p>

      {/* Kaos Config */}
      {isKaos && (
        <div className="space-y-6">
          {/* Sablon Type */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Jenis Sablon</label>
            <div className="grid grid-cols-2 gap-3">
              {(options.sablon_types || []).map((type) => (
                <button key={type} onClick={() => setConfig({ sablonType: type })}
                  className={selectClass(config.sablonType === type)}>
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
          </div>

          {/* Purchase Method */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Metode Pembelian</label>
            <div className="grid grid-cols-2 gap-3">
              {(options.purchase_methods || []).map((method) => (
                <button key={method} onClick={() => setConfig({ purchaseMethod: method })}
                  className={selectClass(config.purchaseMethod === method)}>
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
          </div>

          {/* Warna Kaos */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Warna Kaos</label>
            <div className="grid grid-cols-4 gap-3">
              {(options.colors || []).map((color) => (
                <button key={color} onClick={() => setConfig({ color })}
                  className={selectClass(config.color === color)}>
                  <p className={`font-medium text-sm text-center ${config.color === color ? 'text-primary' : 'text-white'}`}>{color}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah Area Cetak */}
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Jumlah Area Cetak</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => {
                if (printAreas.length > 1) removePrintArea(1);
              }}
                className={selectClass(printAreas.length === 1)}>
                <p className={`font-medium text-sm text-center ${printAreas.length === 1 ? 'text-primary' : 'text-white'}`}>1 Area Cetak</p>
              </button>
              <button onClick={() => {
                if (printAreas.length < 2) addPrintArea();
              }}
                disabled={maxAreas < 2}
                className={`${selectClass(printAreas.length === 2)} ${maxAreas < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <p className={`font-medium text-sm text-center ${printAreas.length === 2 ? 'text-primary' : 'text-white'}`}>2 Area Cetak</p>
                {printAreas.length === 2 && (
                  <p className="text-primary text-[11px] text-center mt-1">+ Rp {areaSurcharge.toLocaleString('id-ID')}</p>
                )}
              </button>
            </div>
          </div>

          {/* Print Areas */}
          {printAreas.map((area, index) => (
            <div key={index} className="bg-ink border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-fire text-[12px] font-medium tracking-[1px] uppercase">
                  Area Cetak {index + 1}
                  {printAreas.length === 2 && index === 1 && (
                    <span className="text-primary ml-2">(+ Rp {areaSurcharge.toLocaleString('id-ID')})</span>
                  )}
                </p>
                {index === 1 && (
                  <button onClick={() => removePrintArea(1)}
                    className="text-gray hover:text-fire transition-colors">
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>

              {/* Position */}
              <div className="mb-4">
                <label className="text-gray text-[11px] tracking-[1px] uppercase mb-2 block">Posisi Cetak</label>
                <div className="grid grid-cols-2 gap-2">
                  {(options.print_positions || []).map((pos) => {
                    const isUsedByOther = usedPositions.includes(pos.value) && area.position !== pos.value;
                    return (
                      <button key={pos.value}
                        onClick={() => !isUsedByOther && setPrintAreaPosition(index, pos.value)}
                        disabled={isUsedByOther}
                        className={`${positionClass(area.position === pos.value)} ${isUsedByOther ? 'opacity-30 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Icon name={AREA_POSITION_ICONS[pos.value] || 'circle'} size={16}
                            className={area.position === pos.value ? 'text-primary' : isUsedByOther ? 'text-gray/50' : 'text-gray'} />
                          <p className={`font-medium text-xs ${area.position === pos.value ? 'text-primary' : isUsedByOther ? 'text-gray/50' : 'text-white'}`}>
                            {pos.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Print Size */}
              <div>
                <label className="text-gray text-[11px] tracking-[1px] uppercase mb-2 block">Ukuran Gambar</label>
                <div className="flex flex-wrap gap-2">
                  {(options.print_sizes || []).map((sz) => (
                    <button key={sz.value} onClick={() => setPrintAreaSize(index, sz.value)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        area.printSize === sz.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-white hover:border-primary/50'
                      }`}>
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner Config */}
      {serviceName.includes('banner') && (
        <div className="space-y-6">
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Ukuran Banner</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.sizes || []).map((size) => (
                <button key={size} onClick={() => setConfig({ size })}
                  className={selectClass(config.size === size)}>
                  <p className={`font-medium text-sm ${config.size === size ? 'text-primary' : 'text-white'}`}>{size}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Bahan</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.materials || []).map((mat) => (
                <button key={mat} onClick={() => setConfig({ material: mat })}
                  className={selectClass(config.material === mat)}>
                  <p className={`font-medium text-sm ${config.material === mat ? 'text-primary' : 'text-white'}`}>{mat}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stiker Config */}
      {serviceName.includes('stiker') && (
        <div className="space-y-6">
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Bahan Stiker</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(options.materials || []).map((mat) => (
                <button key={mat} onClick={() => setConfig({ material: mat })}
                  className={selectClass(config.material === mat)}>
                  <p className={`font-medium text-sm ${config.material === mat ? 'text-primary' : 'text-white'}`}>{mat}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Ukuran Stiker</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(options.sizes || []).map((size) => (
                <button key={size} onClick={() => setConfig({ size })}
                  className={selectClass(config.size === size)}>
                  <p className={`font-medium text-sm ${config.size === size ? 'text-primary' : 'text-white'}`}>{size}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bordir Config */}
      {serviceName.includes('bordir') && (
        <div>
          <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Posisi Bordir</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(options.positions || []).map((pos) => (
              <button key={pos} onClick={() => setConfig({ position: pos })}
                className={selectClass(config.position === pos)}>
                <p className={`font-medium text-sm ${config.position === pos ? 'text-primary' : 'text-white'}`}>{pos}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button onClick={prevStep}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
