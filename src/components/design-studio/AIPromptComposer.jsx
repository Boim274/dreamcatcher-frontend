import { useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip } from 'lucide-react';

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
    <div className="bg-ink border border-border rounded-xl overflow-hidden">
      {/* Prompt textarea */}
      <div className="flex items-center gap-2 px-3 py-2.5">
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
          placeholder="Jelaskan ide desain kaosmu di sini... contoh: kaos streetwear dengan naga hitam"
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-2.5 text-white text-[14px] placeholder:text-gray focus:outline-none focus:border-fire transition-colors resize-none min-h-[44px] max-h-[120px]"
          disabled={loading || disabled}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-fire text-ink hover:bg-yellow-400 transition-colors disabled:opacity-40 shrink-0"
          title="Kirim ke AI"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
        {onSendImage && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || disabled}
              title="Upload desain sendiri untuk dianalisis & diedit AI"
              className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 text-gray hover:text-fire hover:bg-dark transition-colors disabled:opacity-40"
            >
              <Paperclip className="w-4 h-4" />
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