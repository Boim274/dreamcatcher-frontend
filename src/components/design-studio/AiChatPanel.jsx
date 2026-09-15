import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, CheckCheck, Loader2, Check, Paperclip } from 'lucide-react';
import { parseQuestionBlocks, stripAssistantBlocks } from './parseQuestionBlocks';

function formatTime(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(value) {
  const d = value ? new Date(value) : new Date();
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Hari ini';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Groups consecutive messages by the same role and inserts day dividers,
// mirroring how WA/Telegram cluster bubbles instead of repeating avatars per line.
function groupMessages(messages) {
  const groups = [];
  let lastDay = null;

  messages.forEach((msg) => {
    const day = formatDayLabel(msg.time);
    if (day !== lastDay) {
      groups.push({ type: 'day', label: day, key: `day-${groups.length}` });
      lastDay = day;
    }
    const last = groups[groups.length - 1];
    if (last && last.type === 'bubble-group' && last.role === msg.role) {
      last.items.push(msg);
    } else {
      groups.push({ type: 'bubble-group', role: msg.role, items: [msg], key: `group-${groups.length}` });
    }
  });

  return groups;
}

function AvatarAI() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-primary to-pink-500 border border-white/20 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="flex items-end gap-2.5">
        <AvatarAI />
        <div className="ai-typing-bubble bg-[#181120] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#ff8ac8] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

// Renders the AI's structured question blocks as interactive chips/radio below
// the assistant bubble. Selections are collected and sent back as "Pilihan saya:".
function InteractiveOptions({ questions, onConfirm }) {
  const [selected, setSelected] = useState(() => {
    const init = {};
    questions.forEach((q) => {
      init[q.key] = q.type === 'radio' ? null : [];
    });
    return init;
  });

  const toggle = (q, option) => {
    setSelected((prev) => {
      if (q.type === 'radio') {
        return { ...prev, [q.key]: option };
      }
      const list = prev[q.key] || [];
      return {
        ...prev,
        [q.key]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option],
      };
    });
  };

  const hasSelection = questions.some((q) => {
    const v = selected[q.key];
    return q.type === 'radio' ? !!v : (v || []).length > 0;
  });

  const handleConfirm = () => {
    const lines = questions
      .map((q) => {
        const v = selected[q.key];
        const chosen = q.type === 'radio' ? (v ? [v] : []) : v || [];
        return chosen.length > 0 ? `- ${q.title}: ${chosen.join(', ')}` : null;
      })
      .filter(Boolean);
    if (lines.length > 0) {
      onConfirm(`Pilihan saya:\n${lines.join('\n')}`);
    }
  };

  return (
    <div className="ai-interactive-card bg-[#181120]/95 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3.5 mt-1.5 space-y-3.5 shadow-xl">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-bold tracking-wider uppercase text-primary">Pilih Opsi di Bawah</p>
      </div>
      {questions.map((q) => (
        <div key={q.key}>
          <p className="ai-interactive-title text-white text-[12px] font-semibold mb-2">{q.title}</p>
          <div className="flex flex-wrap gap-2">
            {q.options.map((option) => {
              const active = q.type === 'radio'
                ? selected[q.key] === option
                : (selected[q.key] || []).includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggle(q, option)}
                  className={`ai-interactive-opt flex items-center gap-1.5 text-[11px] px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'ai-interactive-opt-active border-primary bg-primary/20 text-white font-medium shadow-md shadow-primary/20 ring-1 ring-primary/40'
                      : 'ai-interactive-opt-idle border-white/10 bg-[#120a1c] text-gray-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-full border transition-all ${
                    active ? 'border-primary bg-primary text-white' : 'border-white/20 bg-white/5'
                  }`}>
                    {active && (q.type === 'radio' ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : <Check className="w-2.5 h-2.5" />)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        onClick={handleConfirm}
        disabled={!hasSelection}
        className="btn-gradient-primary flex items-center justify-center gap-2 w-full text-white font-bold py-2.5 rounded-xl text-[12px] shadow-lg shadow-primary/20 disabled:opacity-40 transition-all"
      >
        <Check className="w-4 h-4" /> Konfirmasi Pilihan
      </button>
    </div>
  );
}

function BubbleGroup({ role, items, onConfirm, isLatest }) {
  const isUser = role === 'user';
  const lastItem = items[items.length - 1];
  const showOptions = isLatest && !isUser && lastItem && parseQuestionBlocks(lastItem.text);
  const displayItems = items.map((msg) => ({
    ...msg,
    displayText: msg.role === 'assistant' ? stripAssistantBlocks(msg.text) : msg.text,
  }));

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3.5`}>
      <div className={`flex items-end gap-2.5 max-w-[90%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && <AvatarAI />}
        <div className="flex flex-col gap-1 w-full">
          {displayItems.map((msg, i) => {
            const isFirst = i === 0;
            const isLast = i === items.length - 1;
            const roundedCorner = isUser
              ? `${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLast ? 'rounded-br-sm' : 'rounded-br-md'}`
              : `${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLast ? 'rounded-bl-sm' : 'rounded-bl-md'}`;
            return (
              <div
                key={i}
                className={`rounded-2xl ${roundedCorner} shadow-md overflow-hidden ${
                  isUser
                    ? 'ai-bubble-user bg-gradient-to-r from-primary via-[#a855f7] to-[#ec4899] text-white shadow-primary/15'
                    : 'ai-bubble-assistant bg-[#181120]/95 border border-white/10 text-gray-100 shadow-xl'
                }`}
              >
                {msg.imageUrl && (
                  <div className={isUser ? 'p-2' : 'p-2.5 bg-[#120a1c]/80 border-b border-white/5 ai-bubble-img-wrapper'}>
                    <img
                      src={msg.imageUrl}
                      alt="Lampiran desain"
                      className="w-40 h-40 object-contain rounded-xl mb-1.5 mx-auto bg-black/40"
                    />
                    <p className="text-[10px] text-white/70 text-center font-medium">Desain Terlampir</p>
                  </div>
                )}
                <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ai-bubble-text">
                  <span>{msg.displayText}</span>
                </div>
                <div
                  className={`flex items-center justify-end gap-1 px-3 pb-2 select-none text-[10px] ${
                    isUser ? 'text-white/80' : 'text-gray/60 ai-bubble-time'
                  }`}
                >
                  <span>{formatTime(msg.time)}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                </div>
              </div>
            );
          })}
          {showOptions && <InteractiveOptions questions={showOptions} onConfirm={onConfirm} />}
        </div>
      </div>
    </div>
  );
}

export default function AiChatPanel({
  messages,
  chatLoading,
  onSend,
  onSendImage,
  heightClass = 'h-72',
  headerTitle = 'AI Designer Consultant',
  headerSubtitle = 'Konsultan desain cerdas — diskusikan konsep hingga siap render',
  disabled = false,
  showInput = true,
  references = null,
  onApplyReference = null,
  summaryNode = null,
}) {
  const [localInput, setLocalInput] = useState('');
  const chatEndRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastUploadRef = useRef(0);

  useEffect(() => {
    // Scroll only the message container smoothly
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [localInput]);

  const handleSend = (textOverride) => {
    const text = (textOverride !== undefined ? textOverride : localInput).trim();
    if (!text || chatLoading || disabled) return;
    setLocalInput('');
    onSend(text);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || chatLoading || disabled || !onSendImage) return;
    const now = Date.now();
    if (now - lastUploadRef.current < 1000) return;
    lastUploadRef.current = now;
    onSendImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages = groupMessages(messages);

  return (
    <div className="ai-chat-panel bg-[#120a1c]/95 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="ai-chat-header flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10 bg-[#181120]/90">
        <AvatarAI />
        <div>
          <p className="ai-chat-header-title text-white text-sm font-semibold leading-tight font-heading tracking-wide">{headerTitle}</p>
          <p className="ai-chat-header-sub text-gray/70 text-[11px] leading-tight mt-0.5">
            {chatLoading ? '⚡ Sedang merumuskan jawaban...' : headerSubtitle}
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className={`ai-chat-scroll ${heightClass} min-h-0 overscroll-contain overflow-y-auto p-4 space-y-2 bg-[#0e0717]/60`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="ai-chat-empty-title text-white font-medium text-sm mb-1">Mulai Diskusi Desain dengan AI</p>
            <p className="ai-chat-empty-desc text-gray/70 text-xs max-w-sm">
              Jelaskan ide desain apparel atau sablon kustommu di sini. AI Designer akan membantu menyusun konsep visual, komposisi warna, dan gaya grafis sebelum diaplikasikan ke mockup.
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map((g, gi) =>
              g.type === 'day' ? (
                <div key={g.key} className="flex justify-center my-3">
                  <span className="ai-day-badge bg-[#181120] border border-white/10 text-gray/80 text-[10px] px-3.5 py-1 rounded-full shadow-sm">
                    {g.label}
                  </span>
                </div>
              ) : (
                <BubbleGroup
                  key={g.key}
                  role={g.role}
                  items={g.items}
                  isLatest={gi === groupedMessages.length - 1}
                  onConfirm={handleSend}
                />
              )
            )}
            {summaryNode}
            {chatLoading && <TypingIndicator />}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Context References */}
      {references && references.length > 0 && (
        <div className="ai-references-panel px-4 py-3 border-t border-white/10 bg-[#181120]/80">
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-primary mb-2">
            <Sparkles className="w-3 h-3" /> Rekomendasi Konsep Terkait
          </p>
          <div className="flex flex-wrap gap-1.5">
            {references.map((ref, i) => (
              <button
                key={i}
                onClick={() => onApplyReference?.(ref.phrase)}
                title={ref.phrase}
                className={`ai-ref-chip text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  ref.kind === 'rec'
                    ? 'ai-ref-chip-highlight border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                    : 'ai-ref-chip-idle border-white/10 bg-[#120a1c] text-gray/90 hover:border-primary/50 hover:text-white'
                }`}
              >
                {ref.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Row */}
      {showInput && (
        <div className="ai-chat-footer flex items-center gap-2 px-3.5 py-3 border-t border-white/10 bg-[#181120]/95">
          {onSendImage && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={chatLoading || disabled}
                title="Upload desain sendiri untuk dianalisis AI"
                className="ai-chat-btn-clip w-10 h-10 flex items-center justify-center rounded-xl shrink-0 border border-white/10 bg-white/5 text-gray hover:text-white hover:border-primary/40 hover:bg-primary/10 transition-all disabled:opacity-40"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpg,image/jpeg"
                onChange={handleImageSelect}
                className="hidden"
              />
            </>
          )}
          <textarea
            ref={textareaRef}
            rows={1}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya ide atau diskusikan konsep sablon ke AI..."
            className="ai-chat-textarea flex-1 bg-[#120a1c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all resize-none max-h-28"
            disabled={chatLoading || disabled}
          />
          <button
            onClick={() => handleSend()}
            disabled={chatLoading || disabled || !localInput.trim()}
            className="btn-gradient-primary w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100 shrink-0"
            title="Kirim pesan"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
