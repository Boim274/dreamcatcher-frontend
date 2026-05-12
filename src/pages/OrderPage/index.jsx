import { useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import StepIndicator from './StepIndicator';
import Step1ServiceSelect from './Step1_ServiceSelect';
import Step2ProductDetail from './Step2_ProductDetail';
import Step3DesignUpload from './Step3_DesignUpload';
import Step4AIMockup from './Step4_AIMockup';
import Step5CustomerData from './Step5_CustomerData';
import Step6Checkout from './Step6_Checkout';

export default function OrderPage() {
  const { currentStep, selectedService, resetForm } = useOrderStore();

  useEffect(() => {
    resetForm();
  }, []);

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
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Pesan Layanan</h1>
          <p className="text-[#6B7280]">Lengkapi langkah di bawah untuk membuat pesanan</p>
        </div>

        <StepIndicator />

        <div className="mt-8 animate-fade-in">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}