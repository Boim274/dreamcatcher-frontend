import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import { Check } from 'lucide-react';

export default function StepIndicator() {
  const { currentStep, setStep, selectedService } = useOrderStore();
  const { t, language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  const steps = [
    { num: 1, label: t('order.step1', 'Layanan') },
    { num: 2, label: t('order.step2', 'Konfigurasi') },
    { num: 3, label: t('order.step3', 'Jumlah') },
    { num: 4, label: t('order.step4', 'Desain') },
    { num: 5, label: t('order.step5', 'Harga') },
    { num: 6, label: t('order.step6', 'Checkout') },
  ];

  const canGoBack = (stepNum) => stepNum < currentStep && selectedService;

  const handleStepClick = (stepNum) => {
    if (canGoBack(stepNum)) setStep(stepNum);
  };

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-6 backdrop-blur-xl transition-all duration-200 ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-md shadow-slate-900/5'
          : 'bg-white/[0.03] border-white/10 shadow-2xl'
      }`}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={6}
    >
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-start justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const isClickable = canGoBack(step.num);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.num} className="relative flex-1 flex flex-col items-center group">
              {/* Connecting Line between this circle and the next circle */}
              {!isLast && (
                <div
                  className={`absolute top-5 sm:top-5.5 left-1/2 w-full h-[3px] -translate-y-1/2 z-0 overflow-hidden ${
                    isLight ? 'bg-slate-200' : 'bg-white/10'
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      isCompleted
                        ? 'w-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                        : 'w-0'
                    }`}
                  />
                </div>
              )}

              {/* Step Circle Button */}
              <button
                type="button"
                onClick={() => handleStepClick(step.num)}
                disabled={!isClickable}
                className={`relative z-10 flex flex-col items-center transition-all duration-300 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center font-bold transition-all duration-300 rounded-2xl ring-4 ${
                    isLight ? 'ring-white' : 'ring-[#191120]'
                  } ${
                    isCompleted
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/25'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-primary to-[#ff60a8] text-white shadow-md shadow-primary/30 scale-110'
                      : isLight
                      ? 'bg-slate-100 border border-slate-200 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700'
                      : 'bg-[#1b1422] border border-white/15 text-zinc-500 group-hover:border-white/30 group-hover:text-zinc-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  ) : (
                    <span className="font-heading text-sm sm:text-base">{step.num}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] mt-3 font-bold tracking-normal sm:tracking-wider uppercase transition-colors duration-200 text-center ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'
                      : isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <span className={`font-heading text-xl tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isEn ? `STEP ${currentStep} OF ${steps.length}` : `LANGKAH ${currentStep} DARI ${steps.length}`}
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isLight ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary/15 text-primary border-primary/30'
          }`}>
            {steps[currentStep - 1]?.label}
          </span>
        </div>

        <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
          <div
            className="h-full bg-gradient-to-r from-primary to-[#ff60a8] rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const isClickable = canGoBack(step.num);
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => handleStepClick(step.num)}
                disabled={!isClickable}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                    : isCurrent
                    ? 'bg-primary scale-125 shadow-sm shadow-primary/50'
                    : isLight ? 'bg-slate-300' : 'bg-white/15'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                aria-label={isEn ? `Step ${step.num}: ${step.label}` : `Langkah ${step.num}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
