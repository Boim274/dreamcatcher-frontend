import { useEffect, useState, useCallback } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';
import Icon from '../../components/ui/Icon';
import { formatRupiah } from '../../utils/formatRupiah';
import { getServiceIcon } from '../../utils/serviceIcon';

function SkeletonCard() {
  return (
    <div className="p-5 border-2 border-border bg-ink">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 skeleton rounded" />
        <div className="flex-1 space-y-3">
          <div className="h-5 skeleton rounded w-2/3" />
          <div className="h-3 skeleton rounded w-full" />
          <div className="h-4 skeleton rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function Step1ServiceSelect() {
  const { setSelectedService, nextStep, selectedService, resetForm } = useOrderStore();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectingId, setSelectingId] = useState(null);

  const fetchServices = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get('/services')
      .then(res => setServices(res.data.services || []))
      .catch(() => {
        setError(true);
        toast.error('Gagal memuat layanan');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSelect = (service) => {
    if (selectedService?.id !== service.id) {
      resetForm();
    }
    setSelectingId(service.id);
    setSelectedService(service);
    setTimeout(() => nextStep(), 400);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border p-6">
        <div className="h-7 skeleton rounded w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || services.length === 0) {
    return (
      <div className="bg-card border border-border p-6 py-16 text-center">
        <Icon name="alert-circle" size={48} className="text-gray mb-4 mx-auto" />
        <p className="text-gray mb-4">
          {error ? 'Gagal memuat layanan. Periksa koneksi internet anda.' : 'Tidak ada layanan tersedia.'}
        </p>
        <button
          onClick={fetchServices}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2 px-6 rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Icon name="refresh-cw" size={16} /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">PILIH LAYANAN</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service, index) => {
          const isSelected = selectedService?.id === service.id;
          const isSelecting = selectingId === service.id;

          return (
            <button
              key={service.id}
              onClick={() => handleSelect(service)}
              style={{ animationDelay: `${index * 80}ms` }}
              className={`p-5 border-2 text-left transition-all duration-300 animate-fade-in ${
                isSelecting
                  ? 'border-primary bg-primary/15 scale-[1.02] shadow-lg shadow-primary/10'
                  : isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-ink hover:bg-dark'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                  isSelected || isSelecting ? 'bg-primary text-white' : 'bg-border text-gray'
                }`} style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                  <Icon name={getServiceIcon(service.name)} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-[22px] text-white tracking-[1px] mb-1">{service.name}</h3>
                  <p className="text-gray text-[13px] mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-primary font-bold text-lg">
                      {formatRupiah(service.price_per_unit || service.base_price)}
                    </span>
                    <span className="text-gray text-[11px]">/pcs</span>
                  </div>
                  <p className="text-gray text-[11px] mt-1">Min. order: {service.minimum_order} pcs</p>
                </div>
                {isSelecting ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : isSelected ? (
                  <Icon name="check-circle" size={22} className="text-primary" />
                ) : (
                  <Icon name="arrow-right" size={20} className="text-gray" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
