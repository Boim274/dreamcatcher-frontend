import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
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
      <textarea
        ref={ref}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg bg-white
          min-h-[100px] resize-none transition-all duration-200
          placeholder:text-text-secondary/50
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;