import { useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import StepIndicator from './StepIndicator';
import Step1ServiceSelect from './Step1_ServiceSelect';
import Step2ProductDetail from './Step2_ProductDetail';
import Step3DesignUpload from './Step3_DesignUpload';
import Step4AIMockup from './Step4_AIMockup';
import Step5CustomerData from './Step5_CustomerData';
import Step6Checkout from './Step6_Checkout';

export default function OrderPage() {
  const { currentStep } = useOrderStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ServiceSelect />;
      case 2: return <Step2ProductDetail />;
      case 3: return <Step3DesignUpload />;
      case 4: return <Step4AIMockup />;
      case 5: return <Step5CustomerData />;
      case 6: return <Step6Checkout />;
      default: return <Step1ServiceSelect />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
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
