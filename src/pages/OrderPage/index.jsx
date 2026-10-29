import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import StepIndicator from './StepIndicator';
import Step1ServiceSelect from './Step1_ServiceSelect';
import Step2ServiceConfig from './Step2_ServiceConfig';
import Step3Quantity from './Step3_Quantity';
import Step4Design from './Step4_Design';
import Step5PricePreview from './Step5_PricePreview';
import Step6Checkout from './Step6_Checkout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service');
  const modelParam = searchParams.get('model');
  const {
    currentStep,
    setStep,
    services,
    selectService,
    fetchServices,
    selectedService,
  } = useOrderStore();
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  // Check if we already have the target service selected at step 2
  const isAlreadyMatched = Boolean(
    serviceParam &&
    selectedService &&
    (String(selectedService.id) === String(serviceParam) || String(selectedService.slug) === String(serviceParam)) &&
    currentStep === 2
  );

  const [isResolvingService, setIsResolvingService] = useState(
    Boolean(serviceParam && !isAlreadyMatched)
  );
  const handledServiceRef = useRef(isAlreadyMatched ? `${serviceParam}_${modelParam || ''}` : null);

  useEffect(() => {
    if (!serviceParam) {
      setIsResolvingService(false);
      return;
    }

    const stateKey = `${serviceParam}_${modelParam || ''}`;
    if (handledServiceRef.current === stateKey) {
      setIsResolvingService(false);
      return;
    }

    let isMounted = true;

    const resolve = async () => {
      let list = services;
      if (!list || list.length === 0) {
        await fetchServices();
        list = useOrderStore.getState().services || [];
      }

      if (!isMounted) return;

      const matched = (list || []).find(
        (s) => String(s.id) === String(serviceParam) || String(s.slug) === String(serviceParam)
      );

      if (matched) {
        selectService(matched);
        if (modelParam) {
          const isLong = modelParam === 'long_sleeve' || modelParam === 'long-sleeve' || modelParam.includes('panjang');
          useOrderStore.getState().setConfig({
            shirtModel: isLong ? 'Kaos Lengan Panjang' : 'Kaos Lengan Pendek',
            shirtModelId: isLong ? 'long_sleeve' : 'short_sleeve',
            shirtModelImage: isLong ? '/products/kaos-lengan-panjang.jpg' : '/products/kaos-lengan-pendek.jpg',
            shirtModelSurcharge: isLong ? 5000 : 0,
          });
        }
        setStep(2);
        handledServiceRef.current = stateKey;
      }
      setIsResolvingService(false);
    };

    resolve();

    return () => {
      isMounted = false;
    };
  }, [serviceParam, modelParam, services, selectService, setStep, fetchServices]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ServiceSelect />;
      case 2: return selectedService ? <Step2ServiceConfig /> : <Step1ServiceSelect />;
      case 3: return <Step3Quantity />;
      case 4: return <Step4Design />;
      case 5: return <Step5PricePreview />;
      case 6: return <Step6Checkout />;
      default: return <Step1ServiceSelect />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 relative overflow-hidden ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
    }`}>
      {/* Background Ambient Glows */}
      <div className={`pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] blur-3xl rounded-full ${
        isLight
          ? 'bg-gradient-to-b from-primary/8 via-purple-600/5 to-transparent'
          : 'bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent'
      }`} />
      <div className={`pointer-events-none absolute top-1/3 -left-48 w-96 h-96 blur-3xl rounded-full ${
        isLight ? 'bg-primary/5' : 'bg-primary/10'
      }`} />
      <div className={`pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 blur-3xl rounded-full ${
        isLight ? 'bg-purple-600/5' : 'bg-purple-600/10'
      }`} />

      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-3.5 sm:px-6 py-5 sm:py-12 w-full relative z-10">
        <div className="text-center mb-6 sm:mb-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] sm:text-[11px] font-bold tracking-[2px] uppercase mb-2.5 sm:mb-3 ${
            isLight
              ? 'border-primary/25 bg-primary/10 text-primary'
              : 'border-primary/30 bg-primary/10 text-primary'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Custom Order System
          </div>
          <h1 className={`font-heading text-2xl sm:text-4xl lg:text-5xl tracking-wide ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {isEn ? 'ORDER' : 'PESAN'} <span className="text-gradient">{isEn ? 'SERVICE' : 'LAYANAN'}</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-md mx-auto leading-relaxed px-2 ${
            isLight ? 'text-slate-600' : 'text-gray-400'
          }`}>
            {isEn
              ? 'Follow 6 easy steps to customize your dream apparel and screen printing products'
              : 'Ikuti 6 langkah mudah untuk kustomisasi produk sablon & konveksi impian Anda'}
          </p>
        </div>

        <StepIndicator />

        {isResolvingService ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-zinc-400">
              {isEn ? 'Preparing service configuration...' : 'Memuat konfigurasi layanan...'}
            </p>
          </div>
        ) : (
          <div className="mt-5 sm:mt-8 animate-fade-in" key={currentStep}>
            {renderStep()}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
