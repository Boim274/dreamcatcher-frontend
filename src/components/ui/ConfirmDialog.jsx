import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  show,
  onClose,
  onCancel,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'default',
  loading = false,
}) {
  const open = isOpen ?? show ?? false;
  const handleClose = onClose ?? onCancel ?? (() => {});
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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div
        className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 scale-100 transition-all"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDanger
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-bold text-white tracking-[0.5px] mb-1.5">
              {title}
            </h3>
            <p className="text-gray text-xs sm:text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/60">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-ink text-gray-light hover:text-white transition-colors text-xs font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'btn-primary shadow-primary/20'
            }`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
