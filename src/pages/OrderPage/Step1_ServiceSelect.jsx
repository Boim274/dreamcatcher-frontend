import { useEffect, useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/ui/Icon';

export default function Step1ServiceSelect() {
  const { setSelectedService, nextStep, selectedService } = useOrderStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services')
      .then(res => {
        const sablonKaos = (res.data.services || []).filter(s => 
          s.name.toLowerCase().includes('kaos') || s.name.toLowerCase().includes('sablon')
        );
        setServices(sablonKaos);
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (service) => {
    setSelectedService(service);
    setTimeout(() => nextStep(), 300);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Pilih Layanan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              onClick={() => handleSelect(service)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                  : 'border-gray-200 hover:border-[#FF6B35]/50 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-[#6B7280]'
                }`}>
                  <Icon name="box" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                  <p className="text-[#6B7280] text-sm mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#FF6B35] font-bold text-lg">
                      Rp {(service.price_per_unit || service.base_price)?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[#6B7280] text-sm">/pcs</span>
                  </div>
                  <p className="text-[#6B7280] text-xs mt-1">Min. order: {service.minimum_order} pcs</p>
                </div>
                 {isSelected && <Icon name="arrow-right" size={20} className="text-[#FF6B35]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}