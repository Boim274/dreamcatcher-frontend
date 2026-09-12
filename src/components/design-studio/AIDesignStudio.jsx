import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { designService } from '../../services/designService';
import { aiChatService } from '../../services/aiChatService';
import { conversationService } from '../../services/conversationService';
import { useToast } from '../ui/Toast';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Loader2, RefreshCw, Sparkles, Wand2, History, X, Zap, Plus, Search, MoreHorizontal, Trash2, Pin, PinOff, Copy, Pencil, RotateCcw, ExternalLink, ImageOff, Inbox, ChevronDown, ChevronUp, Maximize2, Download } from 'lucide-react';
import { getImageUrl } from '../../utils/getImageUrl';
import { getUserSession } from '../../utils/userSession';
import AiChatPanel from './AiChatPanel';
import AIPromptComposer from './AIPromptComposer';
import { getDynamicChips, getRecommendations } from './promptSuggestions';

const GENERATE_DONE_MESSAGE =
  'Kereen Kak, desainmu udah jadi! 🎨 Hasilnya ada di bawah ya. ' +
  'Pilih yang paling pas, atau minta aku poles/ubah lagi lewat tombol Enhance atau Edit Dengan Prompt.';

// Extracts the {status:"ready", final_prompt, ...} JSON the consultant AI emits
// once the design brief is complete. Handles fenced code blocks and extra prose.
function parseReadyReply(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(candidate.slice(start, end + 1));
    if (obj && obj.status === 'ready' && obj.final_prompt) {
      return obj;
    }
  } catch { /* not a JSON block */ }
  return null;
}

// Scan the conversation's assistant messages (newest first) for the design-ready
// block so the "Desain Final" summary + Generate button can be restored after a
// reload. Returns null when no ready block exists yet.
function deriveReadyFromMessages(msgs) {
  const assistants = (msgs || []).filter((m) => m.role === 'assistant');
  for (let i = assistants.length - 1; i >= 0; i--) {
    const ready = parseReadyReply(assistants[i].text);
    if (ready) {
      return {
        ready,
        finalPrompt: ready.final_prompt || '',
        negativePrompt: ready.negative_prompt || '',
      };
    }
  }
  const last = assistants[assistants.length - 1];
  const fallback = last ? parseSummaryFallback(last.text) : null;
  return fallback;
}

// Safety net: the free chat model sometimes finishes with the "DESAIN FINAL"
// summary but omits the {status:"ready"} JSON contract. When that happens we
// synthesize the ready state from the summary so the Generate button still
// appears. Only triggers on a clearly finalized brief, never mid-consultation.
function parseSummaryFallback(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();
  if (!t.includes('DESAIN FINAL') || /```questions\b/i.test(t)) return null;
  if (!/^\s*[-*]?\s*(Objek|Style):/im.test(t)) return null;

  const pick = (label) => {
    const re = new RegExp(`^[-*]?\\s*${label}\\s*:\\s*(.+)$`, 'im');
    const m = t.match(re);
    return m ? m[1].trim() : '';
  };

  const designInfo = {
    object: pick('Objek'),
    style: pick('Style'),
    colors: pick('Warna'),
    composition: pick('Komposisi'),
    print_type: pick('Jenis Sablon'),
    size: pick('Ukuran'),
    position: pick('Posisi'),
  };

  if (!designInfo.object) return null;

  // Reuse the English FINAL_PROMPT the AI writes (if present), otherwise compose
  // a solid image prompt from the parsed brief.
  let finalPrompt = '';
  const fpMatch = t.match(/FINAL_PROMPT\s*:?\s*([\s\S]*?)(?:\n\n|\n===|---|```)?\s*$/i);
  if (fpMatch && fpMatch[1]) {
    finalPrompt = fpMatch[1]
      .replace(/^```(?:json|text)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  }
  if (!finalPrompt) {
    const parts = [
      designInfo.object,
      designInfo.style,
      designInfo.colors,
      designInfo.composition,
      designInfo.print_type,
    ].filter(Boolean);
    finalPrompt = [
      ...parts,
      't-shirt screen print design, bold, high contrast, clean, transparent background, DTF ready, high quality',
    ].join(', ');
  }

  return {
    ready: { status: 'ready', final_prompt: finalPrompt, negative_prompt: '', design_info: designInfo },
    finalPrompt,
    negativePrompt: '',
  };
}

// Downloads a cross-origin image (Cloudinary) by fetching it as a blob so the
// browser saves the actual file instead of navigating to it.
async function downloadImage(url, filename = 'desain.png') {
  if (!url) return;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Small helper for a togglable side panel header (used by History + Preview)
function PanelToggle({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray hover:text-white hover:bg-ink transition-colors"
      title={open ? 'Tutup panel' : 'Buka panel'}
    >
      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );
}

// "DESAIN FINAL" summary + confirm button shown after the AI marks the design ready.
// Collapsible so it doesn't push the results grid too far down once expanded once.
function DesignSummary({ summary, generating, onGenerate, quota }) {
  const [expanded, setExpanded] = useState(true);
  const info = summary.design_info || {};
  const exhausted = !!quota && !quota.generate?.unlimited && (quota.generate?.remaining ?? 1) <= 0;
  const rows = [
    ['Objek', info.object],
    ['Style', info.style],
    ['Warna', info.colors],
    ['Jenis Sablon', info.print_type],
    ['Ukuran', info.size],
    ['Posisi', info.position],
  ].filter(([, v]) => v);

  return (
    <div className="bg-ink border border-fire/40 rounded-xl p-3 mb-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">Desain Final Siap</p>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-fire" /> : <ChevronDown className="w-3.5 h-3.5 text-fire" />}
      </button>

      {expanded && (
        <>
          {rows.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 mb-2.5">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-1.5 text-[11px]">
                  <dt className="text-gray shrink-0">{k}:</dt>
                  <dd className="text-white truncate">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {summary.final_prompt && (
            <p className="text-gray text-[10px] italic leading-relaxed mb-2.5 line-clamp-2">{summary.final_prompt}</p>
          )}
        </>
      )}

      <button
        onClick={onGenerate}
        disabled={generating || exhausted}
        className="w-full flex items-center justify-center gap-2 bg-fire text-ink font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon name="zap" size={18} />}
        {generating ? 'Membuat desain...' : exhausted ? 'Kuota Generate Habis' : 'Generate Sekarang'}
      </button>
      {exhausted && (
        <p className="text-gray text-[10px] text-center mt-2">
          Kuota AI Generate Anda telah habis (maksimal {quota.generate.limit} gambar). Hubungi admin untuk menambah kuota.
        </p>
      )}
    </div>
  );
}

function timeAgo(value) {
  const d = value ? new Date(value) : new Date();
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function StepIndicator({ step }) {
  const steps = ['Diskusi Ide', 'Desain Final', 'Generate', 'Edit & Gunakan'];
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 flex-1">
          <div className={`flex items-center gap-1.5 shrink-0 ${i <= step ? 'text-fire' : 'text-gray'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
              i < step ? 'bg-fire text-ink' : i === step ? 'border-2 border-fire text-fire' : 'border border-border text-gray'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className="text-[10px] font-medium hidden sm:inline whitespace-nowrap">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 transition-colors ${i < step ? 'bg-fire' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function OnboardingHint({ onPickPrompt }) {
  const examples = [
    'Kaos komunitas motor, tema garang, warna hitam-merah',
    'Logo kedai kopi minimalis untuk sablon kaos',
    'Kaos event lari 5K, tipografi bold dan energik',
    'Kaos kelas dengan mascot lucu bertema sekolah',
  ];
  return (
    <div className="bg-ink border border-dashed border-border rounded-xl p-5 text-center">
      <Sparkles className="w-6 h-6 text-fire mx-auto mb-2" />
      <p className="text-white text-[13px] font-semibold mb-1">Ceritakan desain yang kamu mau</p>
      <p className="text-gray text-[11px] mb-3 max-w-xs mx-auto leading-relaxed">
        Tulis ide di kolom bawah — AI akan tanya detail (warna, gaya, ukuran) sampai konsepnya siap,
        baru gambarnya dibuat. Atau coba salah satu contoh ini:
      </p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onPickPrompt(ex)}
            className="px-2.5 py-1.5 rounded-full bg-dark border border-border text-[11px] text-gray hover:text-fire hover:border-fire/50 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AIDesignStudio({
  onDesignReady,
  onGenerateDesign,
  nextLabel,
  initialConversationId = null,
  onActiveConversationChange,
}) {
  const toast = useToast();
  const session = getUserSession();
  const isMobileDefault = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

  // --- Conversation management ---
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId);
  const activeIdRef = useRef(activeId);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('ai_history_open');
    if (saved !== null) return saved === '1';
    return !isMobileDefault();
  });
  const [previewOpen, setPreviewOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('ai_preview_open');
    if (saved !== null) return saved === '1';
    return !isMobileDefault();
  });
  const [menuFor, setMenuFor] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, title, permanent}
  const [restoreTarget, setRestoreTarget] = useState(null);

  // --- Generation state ---
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [readySummary, setReadySummary] = useState(null);
  const [lastFinalPrompt, setLastFinalPrompt] = useState('');
  const [lastNegativePrompt, setLastNegativePrompt] = useState('');

  // --- Enhance / Edit / version history ---
  const [working, setWorking] = useState(false);
  const [action, setAction] = useState(null); // 'edit' | 'versions' | 'compare' (versions/compare render as modals)
  const [editPrompt, setEditPrompt] = useState('');
  const [versions, setVersions] = useState([]);
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);
  const resultsRef = useRef(null);
  const [promptText, setPromptText] = useState('');

  // --- Chat state ---
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  // --- Deduplication locks (refs are synchronous, state is async) ---
  const isUploadingRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const isChatSendingRef = useRef(false);
  const generatedPromptsRef = useRef(new Set());

  // --- AI quota (generate & edit) ---
  const [quota, setQuota] = useState(null);
  const [lightbox, setLightbox] = useState(null); // {url, label}
  const refreshQuota = useCallback(() => {
    designService.getQuota().then((res) => setQuota(res.quota)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    designService
      .getQuota()
      .then((res) => {
        if (!cancelled) setQuota(res.quota);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const genExhausted = !!quota && !quota.generate?.unlimited && (quota.generate?.remaining ?? 1) <= 0;
  const editExhausted = !!quota && !quota.edit?.unlimited && (quota.edit?.remaining ?? 1) <= 0;
  const currentStep = results.length > 0 ? 3 : readySummary ? 2 : messages.length > 0 ? 1 : 0;

  const mapDesigns = (list, prompt) =>
    (list || []).map((d) => ({
      id: d.id,
      imageUrl: getImageUrl(d.image_url),
      isValid: d.is_valid ?? true,
      type: d.design_type,
      kind: d.kind,
      version: d.version ?? 1,
      prompt: d.prompt || prompt,
      raw: d,
    }));

  const setActive = useCallback((id) => {
    setActiveId(id);
    activeIdRef.current = id;
    onActiveConversationChange?.(id);
  }, [onActiveConversationChange]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await conversationService.list({ search, sort: 'newest', trashed: showTrash });
      setConversations(res.conversations || []);
    } catch {
      // silent — user may not be authed yet
    } finally {
      setListLoading(false);
    }
  }, [search, showTrash]);

  // Load a conversation's messages + designs when the user clicks it.
  const loadConversation = async (id) => {
    setContentLoading(true);
    try {
      const res = await conversationService.get(id);
      setMessages((res.messages || []).map((m) => ({ ...m, time: m.time || m.created_at || Date.now(), imageUrl: m.image_url || m.imageUrl })));
      const designs = mapDesigns(res.designs, '');
      setResults(designs);
      setSelectedResult(designs[0] || null);
      const derived = deriveReadyFromMessages(res.messages || []);
      if (derived) {
        setReadySummary(derived.ready);
        setLastFinalPrompt(derived.finalPrompt);
        setLastNegativePrompt(derived.negativePrompt);
      } else {
        setReadySummary(null);
      }
      setVersions([]);
      setAction(null);
    } catch {
      toast.error('Gagal memuat percakapan.');
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      conversationService
        .list({ search, sort: 'newest', trashed: showTrash })
        .then((res) => {
          if (!cancelled) setConversations(res.conversations || []);
        })
        .catch(() => {});
    }, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, showTrash]);

  // Restore a persisted conversation (from localStorage) if it still exists.
  useEffect(() => {
    if (!initialConversationId) return;
    let cancelled = false;
    conversationService
      .get(initialConversationId)
      .then((res) => {
        if (cancelled) return;
        setMessages((res.messages || []).map((m) => ({ ...m, time: m.time || m.created_at || Date.now(), imageUrl: m.image_url || m.imageUrl })));
        const designs = mapDesigns(res.designs, '');
        setResults(designs);
        setSelectedResult(designs[0] || null);
        const derived = deriveReadyFromMessages(res.messages || []);
        if (derived) {
          setReadySummary(derived.ready);
          setLastFinalPrompt(derived.finalPrompt);
          setLastNegativePrompt(derived.negativePrompt);
        }
      })
      .catch(() => setActive(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  const refreshList = () => {
    loadList();
  };

  const handleNewConversation = async () => {
    try {
      const res = await conversationService.create({ prompt: '' });
      setActive(res.conversation.id);
      setMessages([]);
      setResults([]);
      setSelectedResult(null);
      setReadySummary(null);
      setShowTrash(false);
      setSearch('');
      refreshList();
      toast.success('Percakapan baru dibuat.');
    } catch {
      toast.error('Gagal membuat percakapan baru.');
    }
  };

  const handleSelectConversation = (id) => {
    setMenuFor(null);
    if (id === activeIdRef.current) return;
    setActive(id);
    loadConversation(id);
  };

  const handleRenameSubmit = async () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) return;
    try {
      await conversationService.update(renameTarget.id, { title });
      refreshList();
      setRenameTarget(null);
      toast.success('Judul diperbarui.');
    } catch {
      toast.error('Gagal mengganti judul.');
    }
  };

  const handleTogglePin = async (conversation) => {
    setMenuFor(null);
    try {
      await conversationService.update(conversation.id, { pinned: !conversation.pinned });
      refreshList();
    } catch {
      toast.error('Gagal menyematkan percakapan.');
    }
  };

  const handleDuplicate = async (conversation) => {
    setMenuFor(null);
    try {
      const res = await conversationService.duplicate(conversation.id);
      refreshList();
      toast.success('Salinan percakapan dibuat.');
      if (!showTrash) {
        setActive(res.conversation.id);
        loadConversation(res.conversation.id);
      }
    } catch {
      toast.error('Gagal menggandakan percakapan.');
    }
  };

  const handleTrash = async (conversation) => {
    setMenuFor(null);
    try {
      await conversationService.remove(conversation.id);
      if (activeIdRef.current === conversation.id) {
        setActive(null);
        setMessages([]);
        setResults([]);
        setSelectedResult(null);
      }
      refreshList();
      toast.success('Percakapan dipindahkan ke sampah.');
    } catch {
      toast.error('Gagal menghapus percakapan.');
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await conversationService.restore(restoreTarget.id);
      setRestoreTarget(null);
      refreshList();
      toast.success('Percakapan dipulihkan.');
    } catch {
      toast.error('Gagal memulihkan percakapan.');
    }
  };

  const handleForceDestroy = async () => {
    if (!deleteTarget) return;
    try {
      await conversationService.forceDestroy(deleteTarget.id);
      setDeleteTarget(null);
      refreshList();
      toast.success('Percakapan dihapus permanen.');
    } catch {
      toast.error('Gagal menghapus permanen.');
    }
  };

  // --- Chat handlers ---
  const handleSendMessage = async (text) => {
    const message = (text || '').trim();
    if (!message || isChatSendingRef.current) return;
    isChatSendingRef.current = true;
    setMessages((prev) => [...prev, { role: 'user', text: message, time: Date.now() }]);
    setChatLoading(true);
    try {
      const res = await aiChatService.sendMessage(message, session, activeIdRef.current);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, time: Date.now() }]);
      if (res.conversation && !activeIdRef.current) {
        setActive(res.conversation.id);
        refreshList();
      }
      const ready = parseReadyReply(res.reply);
      if (ready) {
        setLastFinalPrompt(ready.final_prompt || '');
        setLastNegativePrompt(ready.negative_prompt || '');
        setReadySummary(ready);
      } else {
        const fallback = parseSummaryFallback(res.reply);
        if (fallback) {
          setLastFinalPrompt(fallback.finalPrompt);
          setLastNegativePrompt(fallback.negativePrompt);
          setReadySummary(fallback.ready);
        }
      }
    } catch {
      toast.error('Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      isChatSendingRef.current = false;
      setChatLoading(false);
    }
  };

  // Ensures a conversation exists before designs are created so every design
  // stays attached to a project.
  const ensureConversation = async (prompt) => {
    if (activeIdRef.current) return activeIdRef.current;
    const res = await conversationService.create({ prompt });
    setActive(res.conversation.id);
    refreshList();
    return res.conversation.id;
  };

  // Uploads the user's own design into the chat. The uploaded image becomes the
  // selected result (editable via Enhance / Edit dengan Prompt) and is shown as
  // an image bubble; the AI (vision) can see it and discuss it in the reply.
  const handleSendImage = async (file) => {
    if (!file || isUploadingRef.current) return;
    isUploadingRef.current = true;
    setChatLoading(true);
    try {
      const cid = await ensureConversation('Upload desain dari customer');
      const res = await designService.upload(file, session, null, cid, true);
      const design = res.design;
      if (!design) {
        toast.error('Gagal mengupload desain');
        return;
      }
      const mapped = mapDesigns([design], '');
      const imageUrl = mapped[0]?.imageUrl || design.image_url;
      setMessages((prev) => [...prev, { role: 'user', text: '', imageUrl, designId: design.id, time: Date.now() }]);
      setResults(mapped);
      setSelectedResult(mapped[0] || null);
      setAction(null);

      const ask = await aiChatService.sendMessage(
        'Saya upload desain saya. Mohon analisis singkat dan saran perbaikannya.',
        session,
        cid,
        design.id
      );
      setMessages((prev) => [...prev, { role: 'assistant', text: ask.reply, time: Date.now() }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupload desain. Pastikan format PNG/JPG maks 5MB.');
    } finally {
      isUploadingRef.current = false;
      setChatLoading(false);
    }
  };

  const runGeneration = async (finalPrompt, negativePrompt) => {
    if (isGeneratingRef.current) return;
    const promptKey = `${finalPrompt}::${negativePrompt || ''}`;
    if (generatedPromptsRef.current.has(promptKey)) {
      toast.warning('Prompt ini sudah di-generate sebelumnya.');
      return;
    }
    isGeneratingRef.current = true;
    generatedPromptsRef.current.add(promptKey);
    setGenerating(true);
    setSelectedResult(null);
    try {
      const cid = await ensureConversation(finalPrompt);
      const res = await designService.generate(finalPrompt, 1, session, negativePrompt || null, cid);
      const designs = mapDesigns(res.designs, finalPrompt);
      setResults((prev) => [...designs, ...prev]);
      setSelectedResult(designs[0] || null);
      setReadySummary(null);
      setMessages((prev) => [...prev, { role: 'assistant', text: GENERATE_DONE_MESSAGE, time: Date.now() }]);
      refreshQuota();
      toast.success('Desain berhasil di-generate!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate desain');
      generatedPromptsRef.current.delete(promptKey);
    } finally {
      isGeneratingRef.current = false;
      setGenerating(false);
    }
  };

  const handleGenerateFromSummary = () => {
    if (genExhausted) {
      toast.error('Kuota AI Generate Anda telah habis. Setiap akun hanya dapat membuat maksimal 3 gambar.');
      return;
    }
    if (!readySummary?.final_prompt || generating) return;
    runGeneration(readySummary.final_prompt, readySummary.negative_prompt);
  };

  const handleRegenerate = () => {
    if (genExhausted) {
      toast.error('Kuota AI Generate Anda telah habis. Setiap akun hanya dapat membuat maksimal 3 gambar.');
      return;
    }
    if (!lastFinalPrompt || generating) return;
    runGeneration(lastFinalPrompt, lastNegativePrompt);
  };

  const handleUseDesign = () => {
    if (selectedResult) {
      (onGenerateDesign || onDesignReady)?.(selectedResult);
    }
  };

  const runDesignAction = async (fn, prompt, successMsg, onDone) => {
    if (!selectedResult || working) return;
    setWorking(true);
    try {
      const res = await fn(selectedResult.id, prompt);
      const designs = mapDesigns(res.designs, prompt || selectedResult.prompt);
      if (designs.length > 0) {
        setResults((prev) => [...designs, ...prev]);
        setSelectedResult(designs[0]);
      }
      toast.success(successMsg);
      refreshQuota();
      onDone?.(designs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses desain');
    } finally {
      setWorking(false);
    }
  };

  const handleEnhance = () => {
    if (editExhausted) {
      toast.error('Kuota AI Edit Anda telah habis. Anda telah menggunakan seluruh kuota edit yang tersedia.');
      return;
    }
    if (!selectedResult) {
      toast.error('Pilih salah satu desain terlebih dahulu');
      return;
    }
    const original = selectedResult;
    runDesignAction(
      () => designService.enhance(selectedResult.id),
      null,
      'Desain berhasil ditingkatkan kualitasnya!',
      (designs) => {
        if (designs.length > 0) {
          setCompareFrom(original);
          setCompareTo(designs[0]);
          setAction('compare');
        }
      }
    );
  };

  const handleSubmitEdit = () => {
    const instruction = editPrompt.trim();
    if (editExhausted) {
      toast.error('Kuota AI Edit Anda telah habis. Anda telah menggunakan seluruh kuota edit yang tersedia.');
      return;
    }
    if (!selectedResult) {
      toast.error('Pilih salah satu desain terlebih dahulu');
      return;
    }
    if (!instruction) {
      toast.error('Tulis instruksi edit terlebih dahulu');
      return;
    }
    runDesignAction(
      (id) => designService.edit(id, instruction),
      instruction,
      'Versi baru desain berhasil dibuat!'
    );
    setEditPrompt('');
    setAction(null);
  };

  const handleShowVersions = async () => {
    if (!selectedResult) return;
    setAction('versions');
    try {
      const res = await designService.versions(selectedResult.id);
      setVersions(mapDesigns(res.versions, ''));
    } catch {
      toast.error('Gagal memuat riwayat versi');
      setAction(null);
    }
  };

  const handleSendPrompt = () => {
    const text = promptText.trim();
    if (!text || chatLoading) return;
    handleSendMessage(text);
    setPromptText('');
  };

  // Context-aware references derived from the live conversation. Built only from
  // what has been discussed (latest user ideas + last AI reply), so suggestions
  // are never static and update in real time as the chat grows.
  const conversationRefs = useMemo(() => {
    if (messages.length === 0) return [];
    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.text || '')
      .join(' ');
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant')?.text || '';
    const context = `${userText} ${lastAssistant}`.slice(-600).trim();
    if (context.length < 3) return [];
    const recs = getRecommendations(context).map((r) => ({
      kind: 'rec',
      label: r.text,
      phrase: r.phrase,
    }));
    const chips = getDynamicChips(context).map((c) => ({
      kind: 'chip',
      label: c.label,
      phrase: c.phrase,
    }));
    return [...recs, ...chips].slice(0, 8);
  }, [messages]);

  // Clicking a reference fills the prompt input so the user reviews it first.
  const handleApplyReference = (phrase) => {
    setPromptText((prev) => (prev.trim() ? `${prev} ${phrase}` : phrase));
  };

  const handleGenerateDirect = () => {
    const text = promptText.trim();
    if (genExhausted) {
      toast.error('Kuota AI Generate Anda telah habis. Setiap akun hanya dapat membuat maksimal 3 gambar.');
      return;
    }
    if (!text || generating) return;
    runGeneration(text);
    setPromptText('');
  };

  const openMockupEditor = () => {
    if (selectedResult) {
      (onGenerateDesign || onDesignReady)?.(selectedResult);
    } else {
      toast.error('Pilih salah satu desain terlebih dahulu');
    }
  };

  useEffect(() => {
    if (!lightbox && action !== 'versions' && action !== 'compare') return;
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return;
      if (lightbox) setLightbox(null);
      else setAction(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightbox, action]);

  const togglePreview = () => {
    setPreviewOpen((v) => {
      const next = !v;
      window.localStorage.setItem('ai_preview_open', next ? '1' : '0');
      return next;
    });
  };

  const toggleHistory = () => {
    setHistoryOpen((v) => {
      const next = !v;
      window.localStorage.setItem('ai_history_open', next ? '1' : '0');
      return next;
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: conversation history sidebar */}
        <aside className="lg:col-span-3 order-2 lg:order-1">
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-2.5 border-b border-border flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold tracking-[1px] uppercase text-fire">Percakapan</p>
              <div className="flex items-center gap-1.5">
                <PanelToggle open={historyOpen} onToggle={toggleHistory} />
                <button
                  onClick={handleNewConversation}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-fire text-ink font-bold text-[11px] hover:bg-yellow-400 transition-colors"
                  title="Buat percakapan baru"
                >
                  <Plus className="w-3.5 h-3.5" /> Baru
                </button>
              </div>
            </div>

            {historyOpen && (
            <>

            <div className="p-2 space-y-2 border-b border-border">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari percakapan..."
                  className="w-full bg-ink border border-border rounded-lg pl-8 pr-2 py-1.5 text-[12px] text-white placeholder:text-gray outline-none focus:border-fire"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowTrash(false)}
                  className={`flex-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                    !showTrash ? 'bg-fire/15 text-fire' : 'text-gray hover:text-white'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setShowTrash(true)}
                  className={`flex-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                    showTrash ? 'bg-fire/15 text-fire' : 'text-gray hover:text-white'
                  }`}
                >
                  Sampah
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-72 lg:max-h-[440px]">
              {menuFor && (
                <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
              )}
              {listLoading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Inbox className="w-6 h-6 text-gray mx-auto mb-2" />
                  <p className="text-gray text-[11px]">
                    {showTrash ? 'Sampah kosong.' : 'Belum ada percakapan. Mulai yang baru!'}
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group relative rounded-lg border transition-all cursor-pointer ${
                      activeId === c.id ? 'border-fire bg-fire/10' : 'border-transparent hover:border-border hover:bg-ink'
                    }`}
                    onClick={() => handleSelectConversation(c.id)}
                  >
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      {c.pinned && <Pin className="w-3 h-3 text-fire shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[12px] font-semibold truncate">{c.title}</p>
                        <p className="text-gray text-[10px] truncate">{c.last_message || (c.message_count ? 'Ada pesan' : 'Kosong')}</p>
                      </div>
                      <span className="text-gray text-[9px] shrink-0">{timeAgo(c.updated_at)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === c.id ? null : c.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray hover:text-white transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {menuFor === c.id && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-44 bg-card border border-border rounded-lg p-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {showTrash ? (
                          <>
                            <button
                              onClick={() => { setRestoreTarget(c); setMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-white hover:bg-ink transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-green-500" /> Pulihkan
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(c); setMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-red-500 hover:bg-ink transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setRenameTarget(c); setRenameValue(c.title); setMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-white hover:bg-ink transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Ganti Judul
                            </button>
                            <button
                              onClick={() => handleDuplicate(c)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-white hover:bg-ink transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" /> Duplikat
                            </button>
                            <button
                              onClick={() => handleTogglePin(c)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-white hover:bg-ink transition-colors"
                            >
                              {c.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />} {c.pinned ? 'Lepas Semat' : 'Semat'}
                            </button>
                            <div className="my-1 border-t border-border" />
                            <button
                              onClick={() => handleTrash(c)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-red-500 hover:bg-ink transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            </>
            )}
          </div>
        </aside>

        {/* Center: chat + composer + results */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-3">
          <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4">
            <h2 className="font-heading text-[17px] text-white tracking-[0.5px] mb-0.5">AI Design Generator</h2>
            <p className="text-gray text-[11px] mb-3">
              Tulis ide desainmu, pilih saran yang muncul, dan AI akan merangkai konsep + membuat gambarnya.
            </p>

            <StepIndicator step={currentStep} />

            <div className="space-y-3">
              {contentLoading ? (
                <div className="bg-ink border border-border rounded-xl p-10 text-center">
                  <Spinner size="md" />
                  <p className="text-gray mt-3 text-[12px]">Memuat percakapan...</p>
                </div>
              ) : (
                <>
                  {messages.length === 0 ? (
                    <OnboardingHint onPickPrompt={(text) => setPromptText(text)} />
                  ) : (
                    <AiChatPanel
                      messages={messages}
                      chatLoading={chatLoading}
                      onSend={handleSendMessage}
                      heightClass={results.length > 0 ? 'h-[42vh] lg:h-[50vh]' : 'h-[50vh] lg:h-[58vh]'}
                      showInput={false}
                      references={conversationRefs}
                      onApplyReference={handleApplyReference}
                      summaryNode={
                        readySummary ? (
                          <DesignSummary
                            summary={readySummary}
                            generating={generating}
                            onGenerate={handleGenerateFromSummary}
                            quota={quota}
                          />
                        ) : null
                      }
                    />
                  )}

                  <AIPromptComposer
                    value={promptText}
                    onChange={setPromptText}
                    onSend={handleSendPrompt}
                    loading={chatLoading}
                    disabled={generating}
                    onSendImage={handleSendImage}
                  />

                  {promptText.trim().length > 0 && !readySummary && (
                    <button
                      onClick={handleGenerateDirect}
                      disabled={generating || chatLoading || genExhausted}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-fire/50 text-fire text-[12px] font-medium hover:bg-fire/10 transition-colors disabled:opacity-50"
                      title="Lewati konsultan dan langsung buat desain dari prompt ini"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {generating ? 'Membuat desain...' : 'Generate Langsung dari Prompt Ini'}
                    </button>
                  )}

                  <div ref={resultsRef}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-fire text-[11px] font-medium tracking-[1px] uppercase">Hasil</label>
                      {quota && (
                        <div className="flex gap-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full border ${quota.generate.unlimited || quota.generate.remaining > 0 ? 'border-fire/40 text-fire' : 'border-gray text-gray'}`}>
                            {quota.generate.unlimited ? 'Gen: ∞' : `Gen: ${quota.generate.remaining}/${quota.generate.limit}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border ${quota.edit.unlimited || quota.edit.remaining > 0 ? 'border-fire/40 text-fire' : 'border-gray text-gray'}`}>
                            {quota.edit.unlimited ? 'Edit: ∞' : `Edit: ${quota.edit.remaining}/${quota.edit.limit}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {generating ? (
                      <div className="bg-ink border border-border rounded-xl p-10 text-center">
                        <Spinner size="lg" />
                        <p className="text-gray mt-4 text-[13px]">AI sedang membuat 3 varian desain...</p>
                        <p className="text-gray text-[11px] mt-1">Ini biasanya membutuhkan 10-30 detik</p>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {results.map((r, i) => (
                            <div
                              key={r.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedResult(r)}
                              onKeyDown={(e) => e.key === 'Enter' && setSelectedResult(r)}
                              className={`relative aspect-square bg-ink border-2 rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer ${
                                selectedResult?.id === r.id
                                  ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img src={r.imageUrl} alt={`Varian ${i + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                                Varian {i + 1}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setLightbox({ url: r.imageUrl, label: `Varian ${i + 1}` }); }}
                                className="absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                                title="Lihat penuh"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              {r.isValid !== null && (
                                <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  r.isValid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                                }`}>
                                  {r.isValid ? '✓' : '!'}
                                </div>
                              )}
                              {selectedResult?.id === r.id && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="bg-primary text-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Dipilih
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-ink border border-border rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">Edit dengan AI</p>
                            {selectedResult?.version > 1 && (
                              <span className="text-[10px] text-gray">Versi {selectedResult.version}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={handleEnhance}
                              disabled={working || editExhausted}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark border border-border text-[12px] text-white hover:border-fire/60 hover:text-fire transition-all disabled:opacity-50"
                              title="Tingkatkan kualitas & kesiapan cetak"
                            >
                              {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              {working ? 'Memproses...' : 'Enhance'}
                            </button>
                            <button
                              onClick={() => setAction((a) => (a === 'edit' ? null : 'edit'))}
                              disabled={working || editExhausted}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-all disabled:opacity-50 ${
                                action === 'edit' ? 'bg-fire/15 border-fire/60 text-fire' : 'bg-dark border-border text-white hover:border-fire/60 hover:text-fire'
                              }`}
                            >
                              <Wand2 className="w-3.5 h-3.5" /> Edit dengan Prompt
                            </button>
                            <button
                              onClick={handleShowVersions}
                              disabled={working}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark border border-border text-[12px] text-white hover:border-fire/60 hover:text-fire transition-all disabled:opacity-50"
                            >
                              <History className="w-3.5 h-3.5" /> Riwayat Versi
                            </button>
                          </div>

                          {action === 'edit' && (
                            <div className="mt-2.5 flex gap-2">
                              <input
                                autoFocus
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitEdit()}
                                placeholder="contoh: ubah warna latar jadi hitam, tambah outline"
                                className="flex-1 bg-dark border border-border rounded-lg px-3 py-2 text-white text-[13px] outline-none focus:border-fire"
                              />
                              <button
                                onClick={handleSubmitEdit}
                                disabled={working || editExhausted}
                                className="px-4 py-2 rounded-lg bg-fire text-ink font-bold text-[12px] hover:bg-yellow-400 transition-colors disabled:opacity-50"
                              >
                                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Versi'}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button onClick={handleRegenerate} disabled={generating || genExhausted}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray text-gray hover:text-white hover:border-primary transition-colors text-[12px] font-medium disabled:opacity-50">
                            {generating ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Generate...</>
                            ) : (
                              <><RefreshCw className="w-4 h-4" /> Generate Ulang</>
                            )}
                          </button>
                          <button onClick={handleUseDesign} disabled={!selectedResult}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-[12px] disabled:opacity-50">
                            <Icon name="arrow-right" size={18} /> {nextLabel || 'Lanjut ke Mockup'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-ink border border-border rounded-xl p-8 text-center">
                        <Icon name="zap" size={40} className="mx-auto text-gray mb-3" />
                        <p className="text-gray text-[12px]">Jelaskan ide desainmu di chat, lalu tekan "Generate Sekarang" saat konsep siap</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: static preview + open mockup editor (collapsible on mobile) */}
        <aside className="lg:col-span-3 order-3">
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-2.5 border-b border-border flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[1px] uppercase text-fire">Preview</p>
              <div className="lg:hidden">
                <PanelToggle open={previewOpen} onToggle={togglePreview} />
              </div>
            </div>
            <div className={`flex-1 p-3 ${previewOpen ? '' : 'hidden lg:block'}`}>
              {selectedResult ? (
                <div className="space-y-2.5">
                  <div className="relative aspect-square bg-ink border border-border rounded-xl overflow-hidden group">
                    <img
                      src={selectedResult.imageUrl}
                      alt="Preview desain"
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setLightbox({ url: selectedResult.imageUrl, label: 'Preview desain' })}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightbox({ url: selectedResult.imageUrl, label: 'Preview desain' }); }}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                      title="Lihat penuh"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray">Varian dipilih</span>
                    {selectedResult.version > 1 && <span className="text-gray">Versi {selectedResult.version}</span>}
                  </div>
                  <button
                    onClick={() => downloadImage(selectedResult.imageUrl, `desain-${selectedResult.version || 1}.png`)}
                    className="w-full flex items-center justify-center gap-2 bg-dark border border-border text-white font-semibold py-2 rounded-xl hover:border-fire/60 hover:text-fire transition-colors text-[12px]"
                  >
                    <Download className="w-4 h-4" /> Download Gambar
                  </button>
                  <button
                    onClick={openMockupEditor}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2 rounded-xl hover:bg-primary-dark transition-colors text-[12px]"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Mockup Editor
                  </button>
                  <p className="text-gray text-[10px] leading-relaxed text-center">
                    Preview adalah gambar statis. Buka Mockup Editor untuk lihat hasil di kaos.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <ImageOff className="w-7 h-7 text-gray/60 mb-2" />
                  <p className="text-gray text-[11px]">
                    Pilih atau buat desain di tengah untuk melihat preview di sini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Rename modal */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setRenameTarget(null)}>
          <div className="bg-card border border-border w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-white font-bold mb-3">Ganti Judul</h3>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              placeholder="Nama percakapan"
              className="w-full bg-ink border border-border rounded-lg px-3 py-2 text-white text-[13px] outline-none focus:border-fire mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRenameTarget(null)} className="btn-secondary">Batal</button>
              <button onClick={handleRenameSubmit} disabled={!renameValue.trim()} className="px-4 py-2 rounded-lg bg-primary text-ink font-medium disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Pulihkan Percakapan"
        message={`Kembalikan "${restoreTarget?.title}" ke daftar aktif?`}
        confirmLabel="Pulihkan"
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleForceDestroy}
        title="Hapus Permanen"
        message={`"${deleteTarget?.title}" dan semua pesan serta desain di dalamnya akan dihapus selamanya. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus Permanen"
        variant="danger"
      />

      {/* Version history — modal instead of inline block, keeps the page short */}
      {action === 'versions' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[65] p-4" onClick={() => setAction(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <p className="text-fire text-[12px] font-bold tracking-[1px] uppercase">Riwayat Versi</p>
              <button onClick={() => setAction(null)} className="text-gray hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {versions.length === 0 ? (
                <div className="flex justify-center py-10"><Spinner size="md" /></div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedResult(v);
                        setAction(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSelectedResult(v);
                          setAction(null);
                        }
                      }}
                      className={`relative aspect-square bg-dark border rounded-lg overflow-hidden transition-all group cursor-pointer ${
                        selectedResult?.id === v.id ? 'border-fire ring-1 ring-fire/40' : 'border-border hover:border-gray'
                      }`}
                      title={`Versi ${v.version} — ${v.kind || v.type || ''}`}
                    >
                      <img src={v.imageUrl} alt={`Versi ${v.version}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded">
                        v{v.version}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLightbox({ url: v.imageUrl, label: `Versi ${v.version}` }); }}
                        className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                        title="Lihat penuh"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      {v.kind === 'enhanced' && (
                        <span className="absolute top-1 right-1 text-[9px]"><Sparkles className="w-3 h-3 text-yellow-400" /></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare (before/after enhance) — modal instead of inline block */}
      {action === 'compare' && compareFrom && compareTo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[65] p-4" onClick={() => setAction(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="text-fire text-[12px] font-bold tracking-[1px] uppercase">Bandingkan</p>
              <button onClick={() => setAction(null)} className="text-gray hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray text-[10px] mb-1.5 text-center">Sebelum</p>
                  <div className="relative aspect-square bg-dark border border-border rounded-lg overflow-hidden group">
                    <img src={compareFrom.imageUrl} alt="Sebelum" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setLightbox({ url: compareFrom.imageUrl, label: 'Sebelum' })}
                      className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                      title="Lihat penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-fire text-[10px] mb-1.5 text-center">Setelah (Enhanced)</p>
                  <div className="relative aspect-square bg-dark border border-fire/40 rounded-lg overflow-hidden group">
                    <img src={compareTo.imageUrl} alt="Setelah" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setLightbox({ url: compareTo.imageUrl, label: 'Setelah (Enhanced)' })}
                      className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                      title="Lihat penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { handleUseDesign(); setAction(null); }}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-[12px]"
              >
                <Icon name="arrow-right" size={18} /> Gunakan Versi Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen image preview */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70] p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.label || 'Preview desain'}
              className="w-full max-h-[85vh] object-contain rounded-xl bg-black"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => downloadImage(lightbox.url, 'desain.png')}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {lightbox.label && (
              <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-[11px] bg-black/50 px-3 py-1 rounded-full">
                {lightbox.label}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}