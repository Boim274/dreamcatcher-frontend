import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) => {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div 
        className={`
          relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl
          transform transition-all duration-300
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="font-heading text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        )}
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;