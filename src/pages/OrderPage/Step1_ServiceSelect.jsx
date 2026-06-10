import { useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';

export default function Step1ServiceSelect() {
  const { services, selectedService, selectService, fetchServices, nextStep } = useOrderStore();
  const toast = useToast();

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleNext = () => {
    if (!selectedService) { toast.warning('Pilih layanan'); return; }
    nextStep();
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">PILIH LAYANAN</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {services.filter(s => s.is_active).map((service) => {
          const isActive = selectedService?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => selectService(service)}
              className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-white'}`}>
                  {service.name}
                </p>
                {service.pricing_type === 'tiered' && (
                  <span className="px-2 py-0.5 bg-fire/20 text-fire text-[10px] font-semibold rounded uppercase tracking-wider">
                    Tiered
                  </span>
                )}
              </div>
              <p className="text-gray text-[13px] mb-3 line-clamp-2">{service.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-primary font-bold text-lg">
                  Rp {Number(service.base_price).toLocaleString('id-ID')}
                  {service.pricing_type === 'flat' && <span className="text-gray text-xs font-normal">/pcs</span>}
                </p>
                <p className="text-gray text-[11px]">Min. {service.minimum_order} pcs</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button onClick={handleNext}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
