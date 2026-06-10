import { useOrderStore } from '../../store/orderStore';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';

export default function Step2ServiceConfig() {
  const { selectedService, config, setConfig, nextStep, prevStep } = useOrderStore();
  const toast = useToast();

  if (!selectedService) return null;

  const options = selectedService.options_config || {};
  const serviceName = selectedService.name.toLowerCase();

  const handleNext = () => {
    if (serviceName.includes('kaos')) {
      if (!config.sablonType) { toast.warning('Pilih jenis sablon'); return; }
      if (!config.color) { toast.warning('Pilih warna kaos'); return; }
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

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-2">KONFIGURASI</h2>
      <p className="text-gray text-sm mb-6">{selectedService.name}</p>

      {/* Kaos Config */}
      {serviceName.includes('kaos') && (
        <div className="space-y-6">
          <div>
            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-3 block">Jenis Sablon</label>
            <div className="grid grid-cols-2 gap-3">
              {(options.sablon_types || []).map((type) => (
                <button key={type} onClick={() => setConfig({ sablonType: type })}
                  className={selectClass(config.sablonType === type)}>
                  <p className={`font-medium text-sm ${config.sablonType === type ? 'text-primary' : 'text-white'}`}>{type}</p>
                  {config.sablonType === type && selectedService.pricing_config?.[type.toLowerCase()] && (
                    <div className="mt-2 text-[11px] text-gray space-y-0.5">
                      {selectedService.pricing_config[type.toLowerCase()].lusin_1 && (
                        <p>1 lusin: <span className="text-primary">Rp {Number(selectedService.pricing_config[type.toLowerCase()].lusin_1).toLocaleString('id-ID')}</span></p>
                      )}
                      {selectedService.pricing_config[type.toLowerCase()].lusin_2_6 && (
                        <p>2-6 lusin: <span className="text-primary">Rp {Number(selectedService.pricing_config[type.toLowerCase()].lusin_2_6).toLocaleString('id-ID')}</span></p>
                      )}
                      {selectedService.pricing_config[type.toLowerCase()].satuan && (
                        <p>Satuan: <span className="text-primary">Rp {Number(selectedService.pricing_config[type.toLowerCase()].satuan).toLocaleString('id-ID')}</span></p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

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
