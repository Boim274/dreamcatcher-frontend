import { memo } from 'react';
import { Ban, CheckCircle, XCircle } from 'lucide-react';
import { statusSteps, statusOrder } from '../../utils/orderStatus';

const VerticalTimeline = memo(function VerticalTimeline({ status, deliveryMethod }) {
  const currentIndex = statusOrder.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 border-2 border-red-500/40 flex-shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-red-400 text-[15px] font-semibold">Dibatalkan</p>
          <p className="text-red-400/60 text-[12px]">Pesanan ini telah dibatalkan</p>
        </div>
      </div>
    );
  }

  if (status === 'cancel_requested') {
    return (
      <div className="flex items-center gap-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 flex-shrink-0 animate-pulse">
          <Ban className="w-5 h-5" />
        </div>
        <div>
          <p className="text-orange-400 text-[15px] font-semibold">Pembatalan Diminta</p>
          <p className="text-orange-400/60 text-[12px]">Menunggu konfirmasi dari admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {statusSteps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isFuture = stepIndex > currentIndex;
        const isLast = index === statusSteps.length - 1;

        return (
          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div className="absolute left-[19px] top-[40px] bottom-0 w-0.5 bg-border/40">
                {isCompleted && <div className="w-full h-full bg-primary" />}
                {isCurrent && <div className="w-full h-1/2 bg-gradient-to-b from-primary to-transparent" />}
              </div>
            )}
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 transition-all ${
              isCompleted
                ? 'bg-primary text-ink shadow-lg shadow-primary/20'
                : isCurrent
                ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse-glow'
                : 'bg-ink text-gray border border-border'
            }`}>
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className={`text-[15px] font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-gray'}`}>
                {step.label}
              </p>
              <p className={`text-[12px] mt-1 leading-relaxed ${isCurrent ? 'text-gray-light' : isFuture ? 'text-gray-medium/80' : 'text-gray-light'}`}>
                {step.key === 'ready_for_pickup' && deliveryMethod
                  ? deliveryMethod === 'pickup'
                    ? 'Pesanan siap diambil di toko. Silakan datang ke toko kami.'
                    : 'Pesanan sedang dikirim ke alamat Anda. Silakan pantau ekspedisi.'
                  : step.description
                }
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default VerticalTimeline;