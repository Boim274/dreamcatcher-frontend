import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, HelpCircle, CheckCircle2, ShieldAlert, X, AlertOctagon } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export default function ConfirmDialog({
  isOpen,
  show,
  onClose,
  onCancel,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'default', // 'danger' | 'warning' | 'primary' | 'success'
  loading = false,
}) {
  const open = isOpen ?? show ?? false;
  const handleClose = onClose ?? onCancel ?? (() => {});
  const cText = confirmLabel || confirmText || 'Ya, Lanjutkan';
  const cCancelText = cancelLabel || cancelText || 'Batal';
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, handleClose]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const iconConfig = isDanger
    ? { 
        icon: Trash2, 
        bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-950/40', 
        btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30',
        glow: 'bg-rose-500/15',
        sheen: 'via-rose-500'
      }
    : isWarning
    ? { 
        icon: AlertTriangle, 
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-950/40', 
        btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30',
        glow: 'bg-amber-500/15',
        sheen: 'via-amber-500'
      }
    : isSuccess
    ? { 
        icon: CheckCircle2, 
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/40', 
        btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30',
        glow: 'bg-emerald-500/15',
        sheen: 'via-emerald-500'
      }
    : { 
        icon: HelpCircle, 
        bg: 'bg-primary/15 border-primary/30 text-primary shadow-lg shadow-primary/20', 
        btn: 'bg-gradient-to-r from-primary to-[#ff60a8] hover:brightness-110 text-white shadow-lg shadow-primary/30',
        glow: 'bg-primary/15',
        sheen: 'via-primary'
      };

  const IconComp = iconConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[90] p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#140b19] border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Ambient Top Glow Accent */}
        <div className={`pointer-events-none absolute -top-20 -right-20 w-48 h-48 ${iconConfig.glow} blur-3xl rounded-full`} />
        <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${iconConfig.sheen} to-transparent opacity-80`} />

        {/* Close Icon */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${iconConfig.bg}`}>
            <IconComp size={22} />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[1.5px] mb-1.5 leading-snug">
              {title}
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed font-normal">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/10 relative z-10">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
          >
            {cCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none ${iconConfig.btn}`}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{cText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
