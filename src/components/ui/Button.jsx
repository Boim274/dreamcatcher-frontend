import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[#FF6B35] text-white hover:bg-[#E55A26] active:scale-[0.98]',
  secondary: 'border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white',
  ghost: 'text-[#6B7280] hover:text-[#FF6B35] hover:bg-gray-100',
  danger: 'bg-[#EF4444] text-white hover:bg-red-600',
  success: 'bg-[#22C55E] text-white hover:bg-green-600',
};

const sizes = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-6 text-base',
  lg: 'py-4 px-8 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-lg
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}