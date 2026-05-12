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
  const { currentStep } = useOrderStore();

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          
          return (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  isCompleted ? 'bg-[#22C55E] text-white' : isCurrent ? 'bg-[#982598] text-white' : 'bg-gray-200 text-[#6B7280]'
                }`}>
                  {isCompleted ? (
                    <Icon name="check" size={20} />
                  ) : step.num}
                </div>
                <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-[#982598]' : 'text-[#6B7280]'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 w-8 sm:w-16 mx-2 rounded ${isCompleted ? 'bg-[#22C55E]' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}