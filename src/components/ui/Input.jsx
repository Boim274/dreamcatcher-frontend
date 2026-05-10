import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
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
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 border border-gray-300 rounded-lg bg-white
            transition-all duration-200 placeholder:text-text-secondary/50
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;