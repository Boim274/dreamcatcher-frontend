import { useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, Sparkles } from 'lucide-react';

export default function AIPromptComposer({ value, onChange, onSend, loading, disabled, onSendImage }) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastUploadRef = useRef(0);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const handleSend = () => {
    if (loading || disabled) return;
    onSend();
  };

  const canSend = value.trim().length > 0 && !loading && !disabled;

  return (
    <div className="ai-prompt-composer bg-[#181120]/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Prompt textarea */}
      <div className="flex items-center gap-2.5 p-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSend();
              }
            }}
            placeholder="Ketik ide atau instruksi sablonmu di sini... (contoh: ilustrasi astronot gaya cyberpunk neon)"
            className="ai-prompt-textarea w-full bg-[#120a1c] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] sm:text-[14px] placeholder:text-gray/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all resize-none min-h-[46px] max-h-[120px]"
            disabled={loading || disabled}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] p-0 flex items-center justify-center rounded-xl transition-all shrink-0 border ${
            canSend
              ? 'bg-gradient-to-r from-primary to-[#ff58a0] text-white border-primary shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-primary/20 text-white border-primary/30 cursor-not-allowed'
          }`}
          title="Kirim ke AI"
          aria-label="Kirim ke AI"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin shrink-0" />
          ) : (
            <Send className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
          )}
        </button>
        {onSendImage && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || disabled}
              title="Upload referensi gambar sendiri"
              className="ai-prompt-btn-clip w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl shrink-0 border border-white/10 bg-white/5 text-gray hover:text-white hover:border-primary/40 hover:bg-primary/10 transition-all disabled:opacity-40 p-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file && !loading && !disabled && onSendImage) {
                  const now = Date.now();
                  if (now - lastUploadRef.current < 1000) return;
                  lastUploadRef.current = now;
                  onSendImage(file);
                }
                e.target.value = '';
              }}
              className="hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}