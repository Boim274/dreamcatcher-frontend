import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Pilih...',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white
            appearance-none cursor-pointer transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;