import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Icon from './Icon';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  const iconMap = {
    success: { name: 'check-circle', color: 'text-success' },
    error: { name: 'alert-circle', color: 'text-danger' },
    warning: { name: 'alert-triangle', color: 'text-warning' },
    info: { name: 'info', color: 'text-primary' },
  };

  const bgMap = {
    success: 'border-success/30',
    error: 'border-danger/30',
    warning: 'border-warning/30',
    info: 'border-primary/30',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const icon = iconMap[t.type] || iconMap.info;
          return (
            <div
              key={t.id}
              onClick={() => removeToast(t.id)}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-card border ${bgMap[t.type] || bgMap.info} shadow-lg cursor-pointer animate-slide-in-right min-w-[280px] max-w-[400px]`}
            >
              <Icon name={icon.name} size={20} className={icon.color} />
              <span className="text-white text-sm flex-1">{t.message}</span>
              <button onClick={(e) => { e.stopPropagation(); removeToast(t.id); }} className="text-gray hover:text-white transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
