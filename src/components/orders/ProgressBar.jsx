import { memo } from 'react';
import { statusSteps, statusOrder, getProgressPercent } from '../../utils/orderStatus';

const ProgressBar = memo(function ProgressBar({ status }) {
  const percent = getProgressPercent(status);
  const currentIndex = statusOrder.indexOf(status);
  const currentStep = statusSteps[currentIndex];

  if (status === 'cancelled' || status === 'cancel_requested') return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] text-gray-light">Step {currentIndex + 1} dari {statusSteps.length}</p>
        <p className="text-[13px] text-primary font-semibold">{percent}%</p>
      </div>
      <div className="track-progress-bar">
        <div className="track-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {currentStep && <p className="text-[12px] text-gray-light mt-2">{currentStep.label}</p>}
    </div>
  );
}
export default ProgressBar;