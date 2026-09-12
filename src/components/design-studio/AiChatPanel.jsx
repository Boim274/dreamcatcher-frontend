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
    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-primary" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-1">
      <div className="flex items-end gap-2">
        <AvatarAI />
        <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray animate-bounce" />
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
    <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 mt-1 space-y-3">
      <p className="text-[10px] font-bold tracking-[1px] uppercase text-primary">Pilih opsi di bawah</p>
      {questions.map((q) => (
        <div key={q.key}>
          <p className="text-gray-800 text-[12px] font-semibold mb-1.5">{q.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((option) => {
              const active = q.type === 'radio'
                ? selected[q.key] === option
                : (selected[q.key] || []).includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggle(q, option)}
                  className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  <span className={`w-3 h-3 flex items-center justify-center rounded-full border ${
                    active ? 'border-primary bg-primary text-white' : 'border-gray-400'
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
        className="flex items-center justify-center gap-1.5 w-full bg-primary text-white font-bold py-2 rounded-lg text-[12px] hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" /> Konfirmasi Pilihan
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && <AvatarAI />}
        <div className="flex flex-col gap-[3px]">
          {displayItems.map((msg, i) => {
            const isFirst = i === 0;
            const isLast = i === items.length - 1;
            const roundedCorner = isUser
              ? `${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLast ? 'rounded-br-md' : 'rounded-br-md'}`
              : `${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLast ? 'rounded-bl-md' : 'rounded-bl-md'}`;
            return (
              <div
                key={i}
                className={`rounded-2xl ${roundedCorner} ${
                  isUser ? 'bg-primary text-white' : 'bg-gray-100 border border-gray-200 text-gray-800'
                }`}
              >
                {msg.imageUrl && (
                  <div className={isUser ? '' : 'p-2.5'}>
                    <img
                      src={msg.imageUrl}
                      alt="Lampiran desain"
                      className="w-36 h-36 object-contain rounded-xl mb-1.5"
                    />
                    <p className="text-[10px] opacity-80 text-center">Desain saya</p>
                  </div>
                )}
                <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  <span>{msg.displayText}</span>
                </div>
                <span
                  className={`flex items-center gap-1 float-right ml-3 mt-1 select-none text-[10px] py-2 pr-3 ${
                    isUser ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {formatTime(msg.time)}
                  {isUser && <CheckCheck className="w-3 h-3" />}
                </span>
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
  headerTitle = 'AI Designer',
  headerSubtitle = 'Konsultan desain — siapkan konsep, lalu buat gambarnya',
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
    // Scroll only the message container instead of the whole page, so a long AI
    // reply doesn't "push" the layout down.
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <AvatarAI />
        <div>
          <p className="text-gray-900 text-sm font-semibold leading-tight">{headerTitle}</p>
          <p className="text-gray-500 text-[11px] leading-tight">
            {chatLoading ? 'Sedang mengetik...' : headerSubtitle}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className={`${heightClass} min-h-0 overscroll-contain overflow-y-auto px-4 py-4`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Sparkles className="w-8 h-8 text-primary/50 mb-2" />
            <p className="text-gray-500 text-xs">
              Jelaskan ide desain kaosmu di sini. AI Designer akan menggali detail konsep, lalu membuat gambar untukmu.
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map((g, gi) =>
              g.type === 'day' ? (
                <div key={g.key} className="flex justify-center my-3">
                  <span className="bg-gray-100 border border-gray-200 text-gray-500 text-[10px] px-3 py-1 rounded-full">
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

      {references && references.length > 0 && (
        <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50">
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[1px] uppercase text-primary mb-1.5">
            <Sparkles className="w-3 h-3" /> Referensi sesuai konteks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {references.map((ref, i) => (
              <button
                key={i}
                onClick={() => onApplyReference?.(ref.phrase)}
                title={ref.phrase}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  ref.kind === 'rec'
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary'
                }`}
              >
                {ref.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInput && (
<div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-gray-50">
          {onSendImage && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={chatLoading || disabled}
                title="Upload desain sendiri untuk diedit AI"
                className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors disabled:opacity-50"
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
            placeholder="Tanya AI tentang desain..."
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors resize-none max-h-24"
            disabled={chatLoading || disabled}
          />
          <button
            onClick={() => handleSend()}
            disabled={chatLoading || disabled || !localInput.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
