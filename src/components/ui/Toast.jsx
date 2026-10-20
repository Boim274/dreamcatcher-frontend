import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const ToastContext = createContext(null);

let toastId = 0;

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.35)]',
    cardBorder: 'border-emerald-500/30 hover:border-emerald-500/50',
    barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    glowColor: 'from-emerald-500/15 to-transparent',
    title: 'BERHASIL',
    titleColor: 'text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.35)]',
    cardBorder: 'border-rose-500/30 hover:border-rose-500/50',
    barColor: 'bg-gradient-to-r from-rose-500 to-red-400',
    glowColor: 'from-rose-500/15 to-transparent',
    title: 'GAGAL',
    titleColor: 'text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    cardBorder: 'border-amber-500/30 hover:border-amber-500/50',
    barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    glowColor: 'from-amber-500/15 to-transparent',
    title: 'PERHATIAN',
    titleColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_15px_rgba(236,74,150,0.35)]',
    cardBorder: 'border-primary/30 hover:border-primary/50',
    barColor: 'bg-gradient-to-r from-primary to-[#ff60a8]',
    glowColor: 'from-primary/15 to-transparent',
    title: 'INFORMASI',
    titleColor: 'text-primary',
  },
};

function ToastItem({ toast, onRemove }) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  const { id, message, type, duration = 3500, shakeCount = 0, keyReset } = toast;
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const IconComponent = config.icon;

  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger brief highlight pulse on duplicate attempt
  useEffect(() => {
    if (shakeCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [shakeCount]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onRemove(id);
    }, 200);
  }, [id, onRemove]);

  useEffect(() => {
    if (duration <= 0) return;

    let start = Date.now();
    const intervalTime = 20;

    const interval = setInterval(() => {
      if (isPaused) return;

      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        handleClose();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [duration, isPaused, keyReset, handleClose]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={handleClose}
      className={`pointer-events-auto group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl backdrop-blur-2xl border ${config.cardBorder} cursor-pointer overflow-hidden transition-all duration-300 min-w-[300px] sm:min-w-[340px] max-w-[420px] ${
        isLight ? 'bg-white/95 shadow-xl shadow-slate-900/10' : 'bg-[#180e20]/95 shadow-2xl shadow-black/80'
      } ${
        isClosing
          ? 'opacity-0 translate-x-12 scale-95 duration-200 ease-in'
          : isPulsing
          ? 'scale-[1.03] ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.35)] duration-150'
          : 'animate-in slide-in-from-top-3 sm:slide-in-from-right-4 fade-in duration-250 ease-out'
      }`}
      style={{
        boxShadow: isLight
          ? '0 10px 30px -5px rgba(0,0,0,0.1), 0 0 1px 1px rgba(0,0,0,0.05)'
          : '0 20px 40px -15px rgba(0,0,0,0.7), 0 0 1px 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient background glow */}
      <div className={`absolute -top-10 -left-10 w-28 h-28 bg-gradient-to-br ${config.glowColor} blur-2xl pointer-events-none rounded-full`} />

      {/* Badge Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.badgeBg} transition-transform duration-300 group-hover:scale-105`}>
        <IconComponent size={20} className="stroke-[2.2]" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pr-1 pt-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-extrabold tracking-wider uppercase font-heading ${config.titleColor}`}>
            {config.title}
          </span>
          <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>sekarang</span>
        </div>
        <p className={`text-xs sm:text-[13px] font-medium leading-snug break-words ${isLight ? 'text-slate-800' : 'text-zinc-100'}`}>
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={`p-1 rounded-lg transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer ${
          isLight
            ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            : 'text-zinc-400 hover:text-white hover:bg-white/10'
        }`}
        aria-label="Tutup notifikasi"
      >
        <X size={15} />
      </button>

      {/* Bottom Progress Countdown Bar */}
      {duration > 0 && (
        <div className={`absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
          <div
            className={`h-full ${config.barColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

const MAX_TOASTS = 3;
const COOLDOWN_MS = 1500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentToastsRef = useRef(new Map());

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    if (!message) return null;
    const msgStr = typeof message === 'string' ? message.trim() : String(message);
    const key = `${type}:${msgStr}`;
    const now = Date.now();

    let wasUpdated = false;

    setToasts((prev) => {
      // 1. Anti-spam: If an identical toast is already active on screen, refresh its timer and pulse it instead of creating a duplicate card
      const existingIndex = prev.findIndex((t) => t.type === type && t.message === msgStr);
      if (existingIndex !== -1) {
        wasUpdated = true;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          shakeCount: (updated[existingIndex].shakeCount || 0) + 1,
          keyReset: now,
        };
        return updated;
      }

      // 2. Cooldown check: If this exact toast was shown very recently, drop the spam call
      const lastTime = recentToastsRef.current.get(key) || 0;
      if (now - lastTime < COOLDOWN_MS) {
        return prev;
      }

      recentToastsRef.current.set(key, now);

      // Memory cleanup for old cooldown keys
      if (recentToastsRef.current.size > 25) {
        for (const [k, time] of recentToastsRef.current.entries()) {
          if (now - time > 10000) recentToastsRef.current.delete(k);
        }
      }

      const id = ++toastId;
      const nextList = [...prev, { id, message: msgStr, type, duration, shakeCount: 0, keyReset: now }];
      
      // 3. Keep at most MAX_TOASTS active simultaneously
      if (nextList.length > MAX_TOASTS) {
        return nextList.slice(nextList.length - MAX_TOASTS);
      }
      return nextList;
    });

    return wasUpdated ? null : toastId;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback((id) => {
    removeToast(id);
  }, [removeToast]);

  const clear = useCallback(() => {
    setToasts([]);
    recentToastsRef.current.clear();
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    dismiss,
    clear,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-5 right-4 left-4 sm:left-auto z-[9999] flex flex-col items-center sm:items-end gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
