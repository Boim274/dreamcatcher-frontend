import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';

const steps = [
  { num: 1, label: 'Layanan' },
  { num: 2, label: 'Detail' },
  { num: 3, label: 'Desain' },
  { num: 4, label: 'Preview' },
  { num: 5, label: 'Data' },
  { num: 6, label: 'Checkout' },
];

export default function StepIndicator() {
  const { currentStep, setStep, selectedService } = useOrderStore();

  const handleStepClick = (stepNum) => {
    if (stepNum < currentStep && selectedService) {
      setStep(stepNum);
    }
  };

  return (
    <div className="bg-card border border-border p-3 sm:p-4" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={6}>
      {/* Desktop: full stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const isClickable = isCompleted && selectedService;

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
                <div className={`w-10 h-10 flex items-center justify-center font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-fire text-white animate-pulse-glow'
                    : isCurrent
                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                    : 'bg-border text-gray'
                }`}>
                  {isCompleted ? (
                    <Icon name="check" size={20} />
                  ) : (
                    <span className="font-heading text-lg">{step.num}</span>
                  )}
                </div>
                <span className={`text-[11px] mt-2 font-medium tracking-[1px] uppercase transition-colors duration-300 ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-fire' : 'text-gray'
                }`}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-all duration-500 ${
                  isCompleted ? 'bg-fire' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact step indicator */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading text-lg text-white tracking-[1px]">
            Langkah {currentStep} / {steps.length}
          </span>
          <span className="text-primary text-sm font-medium">
            {steps[currentStep - 1]?.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-fire rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between mt-3">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const isClickable = isCompleted && selectedService;

            return (
              <button
                key={step.num}
                onClick={() => handleStepClick(step.num)}
                disabled={!isClickable}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-fire'
                    : isCurrent
                    ? 'bg-primary scale-125'
                    : 'bg-border'
                } ${isClickable ? 'cursor-pointer hover:scale-150' : 'cursor-default'}`}
                aria-label={`Langkah ${step.num}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
