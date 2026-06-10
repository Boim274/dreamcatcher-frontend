import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';

const steps = [
  { num: 1, label: 'Layanan' },
  { num: 2, label: 'Konfigurasi' },
  { num: 3, label: 'Jumlah' },
  { num: 4, label: 'Desain' },
  { num: 5, label: 'Harga' },
  { num: 6, label: 'Checkout' },
];

export default function StepIndicator() {
  const { currentStep, setStep, selectedService } = useOrderStore();

  const canGoBack = (stepNum) => stepNum < currentStep && selectedService;

  const handleStepClick = (stepNum) => {
    if (canGoBack(stepNum)) setStep(stepNum);
  };

  return (
    <div className="bg-card border border-border p-3 sm:p-4 rounded-xl" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={6}>
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const isClickable = canGoBack(step.num);

          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => handleStepClick(step.num)}
                disabled={!isClickable}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold transition-all duration-300 rounded-lg ${
                  isCompleted
                    ? 'bg-fire text-white'
                    : isCurrent
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-border text-gray'
                }`}>
                  {isCompleted ? <Icon name="check" size={18} /> : <span className="font-heading text-sm sm:text-lg">{step.num}</span>}
                </div>
                <span className={`text-[10px] sm:text-[11px] mt-1.5 font-medium tracking-[1px] uppercase transition-colors duration-300 ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-fire' : 'text-gray'
                }`}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-1 sm:mx-2 transition-all duration-500 rounded-full ${
                  isCompleted ? 'bg-fire' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading text-lg text-white tracking-[1px]">
            Langkah {currentStep} / {steps.length}
          </span>
          <span className="text-fire text-sm font-medium">
            {steps[currentStep - 1]?.label}
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-fire rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const isClickable = canGoBack(step.num);
            return (
              <button key={step.num} onClick={() => handleStepClick(step.num)} disabled={!isClickable}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-fire' : isCurrent ? 'bg-primary scale-125' : 'bg-border'
                } ${isClickable ? 'cursor-pointer hover:scale-150' : 'cursor-default'}`}
                aria-label={`Langkah ${step.num}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
