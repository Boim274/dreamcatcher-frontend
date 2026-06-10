import { useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="section-tag">&mdash; buat pesanan</div>
          <h1 className="section-title">PESAN<br/>LAYANAN</h1>
          <div className="divider mx-auto"></div>
          <p className="text-gray text-[14px]">Lengkapi langkah di bawah untuk membuat pesanan</p>
        </div>

        <StepIndicator />

        <div className="mt-8 animate-fade-in" key={currentStep}>
          {renderStep()}
        </div>
      </div>
      <Footer />
    </div>
  );
}
