import { useEffect, useState, useMemo } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import { useToast } from '../../components/ui/Toast';
import ServiceIcon from '../../components/ui/ServiceIcons';
import { formatRupiah, getMinPrice } from '../../utils/formatRupiah';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

export default function Step1ServiceSelect() {
  const { services, selectedService, selectService, fetchServices, nextStep } = useOrderStore();
  const { td, language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(services.length === 0);

  useEffect(() => {
    let mounted = true;
    fetchServices().finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [fetchServices]);

  const activeServices = useMemo(() => {
    return services.filter((s) => s.is_active);
  }, [services]);

  const handleNext = () => {
    if (!selectedService) {
      toast.warning(isEn ? 'Please select a service first' : 'Silakan pilih salah satu layanan terlebih dahulu');
      return;
    }
    nextStep();
  };

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-xl ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-slate-900/5 text-slate-900'
          : 'bg-white/[0.03] border-white/10 shadow-2xl text-white'
      }`}
    >
      {/* Header Section */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}
      >
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 border ${
              isLight
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-primary/15 text-primary border-primary/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Step 1 of 6' : 'Langkah 1 dari 6'}</span>
          </div>
          <h2
            className={`font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide sm:tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {isEn ? 'SELECT PRODUCTION SERVICE' : 'PILIH LAYANAN PRODUKSI'}
          </h2>
          <p
            className={`text-xs sm:text-sm mt-1 leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-zinc-400'
            }`}
          >
            {isEn
              ? 'Choose the apparel type or printing technique you want to customize.'
              : 'Pilih jenis produk konveksi atau teknik sablon presisi yang ingin Anda pesan.'}
          </p>
        </div>

        {activeServices.length > 0 && (
          <div
            className={`self-start sm:self-auto px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            <span className="text-primary font-bold">{activeServices.length}</span>{' '}
            {isEn ? 'Services Available' : 'Layanan Tersedia'}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && services.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl border animate-pulse ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 mb-4" />
              <div
                className={`h-5 w-2/3 rounded-lg mb-2.5 ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}
              />
              <div
                className={`h-3 w-full rounded-lg mb-1.5 ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}
              />
              <div
                className={`h-3 w-4/5 rounded-lg mb-6 ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}
              />
              <div
                className={`flex justify-between pt-3 border-t ${
                  isLight ? 'border-slate-200' : 'border-white/5'
                }`}
              >
                <div
                  className={`h-4 w-24 rounded-lg ${
                    isLight ? 'bg-slate-200' : 'bg-white/10'
                  }`}
                />
                <div
                  className={`h-4 w-16 rounded-lg ${
                    isLight ? 'bg-slate-200' : 'bg-white/10'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : activeServices.length > 0 ? (
        /* Services Selection Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-8">
          {activeServices.map((service) => {
            const isActive = selectedService?.id === service.id;
            const minPrice =
              service.pricing_type === 'tiered'
                ? getMinPrice(service)
                : service.base_price;

            return (
              <div
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={() => selectService(service)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectService(service);
                  }
                }}
                className={`p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 relative overflow-hidden cursor-pointer group flex flex-col justify-between select-none ${
                  isLight
                    ? isActive
                      ? 'border-primary bg-primary/[0.04] shadow-md shadow-primary/10 ring-2 ring-primary/20'
                      : 'border-slate-200/90 bg-white hover:border-primary/40 hover:shadow-md'
                    : isActive
                    ? 'border-primary bg-primary/15 shadow-[0_0_30px_rgba(236,74,150,0.25)] ring-2 ring-primary/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/40'
                }`}
              >
                {/* Top Row: Icon and Radio Checkbox */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      isLight
                        ? isActive
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                          : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5'
                        : isActive
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/40'
                        : 'bg-white/5 border-white/10 text-zinc-300 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/10'
                    }`}
                  >
                    <ServiceIcon name={service.name} size={24} />
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : isLight
                        ? 'border-slate-300 bg-white group-hover:border-primary/50'
                        : 'border-white/20 bg-white/5 group-hover:border-primary/50'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Service Information */}
                <div className="mb-5">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <h3
                      className={`font-heading text-lg sm:text-xl font-bold tracking-normal sm:tracking-wide leading-snug transition-colors ${
                        isActive
                          ? 'text-primary'
                          : isLight
                          ? 'text-slate-900 group-hover:text-primary'
                          : 'text-white group-hover:text-primary'
                      }`}
                    >
                      {td(service.name)}
                    </h3>

                    {service.pricing_type === 'tiered' && (
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${
                          isLight
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isEn ? 'Tiered Price' : 'Grosir Bertingkat'}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs sm:text-[13px] leading-relaxed line-clamp-2 ${
                      isLight ? 'text-slate-600' : 'text-zinc-400'
                    }`}
                  >
                    {td(service.description)}
                  </p>
                </div>

                {/* Footer: Price & Min Order */}
                <div
                  className={`pt-4 border-t flex items-baseline justify-between gap-3 ${
                    isLight ? 'border-slate-100' : 'border-white/10'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] uppercase tracking-wider block font-semibold mb-1 ${
                        isLight ? 'text-slate-400' : 'text-zinc-500'
                      }`}
                    >
                      {isEn ? 'Starts from' : 'Harga Mulai'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-primary font-bold text-lg sm:text-xl font-mono">
                        {formatRupiah(minPrice)}
                      </span>
                      {service.pricing_type === 'flat' && (
                        <span
                          className={`text-xs font-medium ml-0.5 ${
                            isLight ? 'text-slate-500' : 'text-zinc-400'
                          }`}
                        >
                          / pcs
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium shrink-0 ${
                      isLight
                        ? 'bg-slate-100/80 border-slate-200/80 text-slate-700'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    Min. {service.minimum_order} pcs
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          className={`py-12 text-center rounded-2xl border mb-8 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : 'bg-white/[0.02] border-white/10 text-zinc-400'
          }`}
        >
          <p className="text-sm font-semibold">
            {isEn ? 'No active services available' : 'Belum ada layanan aktif yang tersedia'}
          </p>
        </div>
      )}

      {/* Bottom Bar: Selection Summary & Next Action */}
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 sm:pt-7 mt-2 border-t ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}
      >
        <div className="text-center sm:text-left">
          {selectedService ? (
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span
                className={`text-xs sm:text-sm ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}
              >
                {isEn ? 'Selected service:' : 'Layanan Terpilih:'}
              </span>
              <span
                className={`font-semibold text-xs sm:text-sm px-2.5 py-1 rounded-lg border ${
                  isLight
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-primary/15 text-primary border-primary/30'
                }`}
              >
                {td(selectedService.name)}
              </span>
            </div>
          ) : (
            <span
              className={`text-xs sm:text-sm italic ${
                isLight ? 'text-slate-400' : 'text-zinc-500'
              }`}
            >
              {isEn
                ? 'Select a production service above to continue'
                : 'Pilih salah satu layanan produksi di atas untuk melanjutkan'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedService}
          className={`w-full sm:w-auto py-3.5 px-8 text-xs sm:text-sm font-bold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-md ${
            selectedService
              ? 'btn-gradient-primary hover:scale-[1.02] active:scale-95 shadow-primary/30 text-white cursor-pointer'
              : isLight
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed shadow-none'
          }`}
        >
          <span>{isEn ? 'Continue to Configuration' : 'Lanjut ke Konfigurasi'}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
