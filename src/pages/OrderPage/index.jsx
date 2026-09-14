import { useEffect } from 'react';
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

export default function OrderPage() {
  const { currentStep } = useOrderStore();
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ServiceSelect />;
      case 2: return <Step2ServiceConfig />;
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

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold tracking-[2px] uppercase mb-3 ${
            isLight
              ? 'border-primary/25 bg-primary/10 text-primary'
              : 'border-primary/30 bg-primary/10 text-primary'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Custom Order System
          </div>
          <h1 className={`font-heading text-3xl sm:text-4xl lg:text-5xl tracking-wide ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {isEn ? 'ORDER' : 'PESAN'} <span className="text-gradient">{isEn ? 'SERVICE' : 'LAYANAN'}</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-gray-400'
          }`}>
            {isEn
              ? 'Follow 6 easy steps to customize your dream apparel and screen printing products'
              : 'Ikuti 6 langkah mudah untuk kustomisasi produk sablon & konveksi impian Anda'}
          </p>
        </div>

        <StepIndicator />

        <div className="mt-8 animate-fade-in" key={currentStep}>
          {renderStep()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
