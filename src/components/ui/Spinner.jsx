const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizes[size]} border-4 border-gray-200 border-t-[#982598] rounded-full animate-spin ${className}`} 
      />
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function LoadingScreen({ text = 'Memuat...' }) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-[#6B7280]">{text}</p>
    </div>
  );
}

export default Spinner;