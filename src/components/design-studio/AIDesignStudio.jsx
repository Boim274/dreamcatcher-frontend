import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { designService } from '../../services/designService';
import { aiChatService } from '../../services/aiChatService';
import { conversationService } from '../../services/conversationService';
import { useToast } from '../ui/Toast';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Loader2, RefreshCw, Sparkles, Wand2, History, X, Zap, Plus, Search, MoreHorizontal, Trash2, Pin, PinOff, Copy, Pencil, RotateCcw, ExternalLink, ImageOff, Inbox, ChevronDown, ChevronUp, Maximize2, Download, CheckSquare, Square, Check, Layers } from 'lucide-react';
import { getImageUrl } from '../../utils/getImageUrl';
import { getUserSession } from '../../utils/userSession';
import AiChatPanel from './AiChatPanel';
import AIPromptComposer from './AIPromptComposer';
import OptimizedImage from '../ui/OptimizedImage';
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
  if (!/^\s*[-*]?\s*(Objek|Objek Grafis|Style|Gaya Seni):/im.test(t)) return null;

  const pick = (label) => {
    const re = new RegExp(`^[-*]?\\s*${label}\\s*:\\s*(.+)$`, 'im');
    const m = t.match(re);
    return m ? m[1].trim() : '';
  };

  const designInfo = {
    object: pick('Objek Grafis') || pick('Objek'),
    style: pick('Gaya Seni') || pick('Style'),
    format: pick('Format Desain') || pick('Format'),
    colors: pick('Palet Warna') || pick('Warna'),
    elements: pick('Elemen Visual') || pick('Komposisi'),
    typography: pick('Tipografi / Teks') || pick('Tipografi') || pick('Teks'),
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
      designInfo.format,
      designInfo.colors,
      designInfo.elements,
      designInfo.typography,
    ].filter(Boolean);
    finalPrompt = [
      ...parts,
      'standalone isolated t-shirt graphic artwork, vector illustration logo decal, clean crisp contour edges, solid isolated plain background, DTF screenprinting ready, 2D flat artwork, no human, no person, no model, no clothes, no mannequin, no t-shirt mockup, no photo of person',
    ].join(', ');
  }

  const defaultNegative = 'person, human, model, man, woman, face, body, wearing t-shirt, t-shirt mockup, realistic photo of person, mannequin, clothes, outfit, photography, photo of shirt, wrinkled shirt, 3d shirt mockup, messy background, low quality, blurry, watermark, cropped';

  return {
    ready: { status: 'ready', final_prompt: finalPrompt, negative_prompt: defaultNegative, design_info: designInfo },
    finalPrompt,
    negativePrompt: defaultNegative,
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
    <div className="ai-design-summary bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent border border-primary/40 rounded-2xl p-4 mb-3 shadow-lg">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-primary text-xs font-bold tracking-[1px] uppercase">Konsep Desain Final Siap</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
      </button>

      {expanded && (
        <>
          {rows.length > 0 && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 mb-3 text-xs">
              {rows.map(([k, v]) => (
                <div key={k} className="ai-summary-card bg-white/5 border border-white/5 rounded-xl p-2.5">
                  <dt className="ai-summary-dt text-white/40 text-[10px] uppercase font-semibold">{k}</dt>
                  <dd className="ai-summary-dd text-white font-medium truncate mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {summary.final_prompt && (
            <p className="ai-summary-prompt text-white/60 text-[11px] italic bg-black/40 border border-white/5 rounded-xl p-2.5 mb-3 line-clamp-2 leading-relaxed">
              &ldquo;{summary.final_prompt}&rdquo;
            </p>
          )}
        </>
      )}

      <button
        onClick={onGenerate}
        disabled={generating || exhausted}
        className="btn-gradient-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon name="zap" size={16} />}
        {generating ? 'Sedang Merender Desain...' : exhausted ? 'Kuota Generate Habis' : 'Generate Gambar Sekarang'}
      </button>
      {exhausted && (
        <p className="text-rose-400 text-[11px] text-center mt-2 font-medium">
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
  const steps = ['Diskusi Ide', 'Konsep Final', 'Generate AI', 'Mockup 3D'];
  return (
    <div className="ai-step-indicator flex items-center gap-1.5 mb-4 bg-white/[0.02] border border-white/5 rounded-2xl p-2 sm:p-2.5">
      {steps.map((label, i) => {
        const isDone = i < step;
        const isCurrent = i === step;
        return (
          <div key={label} className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 shrink-0 ${isDone || isCurrent ? 'text-primary' : 'text-white/40 ai-step-idle'}`}>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                isDone
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : isCurrent
                  ? 'border-2 border-primary text-primary bg-primary/10 animate-pulse ring-2 ring-primary/20'
                  : 'ai-step-circle-idle border border-white/10 text-white/30 bg-white/5'
              }`}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`ai-step-label text-[10px] sm:text-[11px] font-semibold truncate hidden xs:inline ${isCurrent ? 'text-white font-bold' : ''}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`ai-step-line h-0.5 flex-1 transition-all rounded ${isDone ? 'bg-primary' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const CONCEPT_IDEAS = [
  {
    category: 'Streetwear',
    icon: '⚡',
    label: 'Cyberpunk Dragon Neon',
    prompt: 'Streetwear aesthetic ilustrasi naga cyberpunk dengan katana neon glowing, garis kontur tegas, warna cyan magenta hitam, siap sablon DTF',
  },
  {
    category: 'Streetwear',
    icon: '🔥',
    label: 'Graffiti Mecha Robot',
    prompt: 'Ilustrasi robot mecha futuristik gaya graffiti streetwear urban, tipografi bold, palet warna vibrant cerah',
  },
  {
    category: 'Komunitas',
    icon: '🏍️',
    label: 'Vintage Biker Skull',
    prompt: 'Kaos komunitas motor custom, tema skull tengkorak vintage biker oldschool dengan sayap elang, warna hitam dan emas gold',
  },
  {
    category: 'Komunitas',
    icon: '🐺',
    label: 'Esports Wolf Mascot',
    prompt: 'Logo emblem maskot kepala serigala garang untuk jersey esports, vektor tajam modern, palet warna navy dan neon cyan',
  },
  {
    category: 'Cafe & Brand',
    icon: '☕',
    label: 'Minimalist Coffee Badge',
    prompt: 'Logo circular badge coffee shop estetik minimalis line-art, tipografi klasik vintage, warna earth-tone cokelat hangat',
  },
  {
    category: 'Cafe & Brand',
    icon: '🏃',
    label: 'Marathon 10K Event',
    prompt: 'Desain kaos event marathon fun run 10K, tipografi dinamis modern, siluet pelari dengan gradasi warna energik',
  },
  {
    category: 'Japanese',
    icon: '🌊',
    label: 'Ukiyo-e Wave & Koi',
    prompt: 'Artwork ombak besar jepang ukiyo-e dengan ikan koi melompat, ornamen bunga sakura, full color tajam standar sablon distro',
  },
  {
    category: 'Japanese',
    icon: '👹',
    label: 'Samurai Oni Mask',
    prompt: 'Topeng oni samurai tradisional jepang, efek kobaran api menyala di latar belakang, gaya neo-traditional tattoo',
  },
];

function OnboardingHint({ onPickPrompt }) {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'Semua Konsep' },
    { id: 'Streetwear', label: '⚡ Streetwear' },
    { id: 'Komunitas', label: '🏍️ Komunitas' },
    { id: 'Cafe & Brand', label: '☕ Cafe & Brand' },
    { id: 'Japanese', label: '🐉 Japanese' },
  ];

  const filteredIdeas = activeTab === 'all'
    ? CONCEPT_IDEAS
    : CONCEPT_IDEAS.filter((c) => c.category === activeTab);

  return (
    <div className="ai-onboarding-container bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-4 sm:p-6 text-center shadow-lg">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h3 className="ai-onboarding-title text-white text-sm sm:text-base font-semibold mb-1">
        Rekomendasi Konsep Desain AI
      </h3>
      <p className="ai-onboarding-desc text-white/60 text-xs sm:text-sm mb-4 max-w-md mx-auto leading-relaxed">
        Pilih salah satu rekomendasi konsep populer di bawah atau tulis idemu sendiri untuk mulai berdiskusi dengan AI Designer.
      </p>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`ai-concept-tab px-3 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'ai-concept-tab-active bg-primary text-white border-primary shadow-sm shadow-primary/25 scale-105'
                : 'ai-concept-tab-idle bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Concept Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {filteredIdeas.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onPickPrompt(item.prompt)}
            className="ai-concept-card p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-primary/50 transition-all flex items-start gap-2.5 group cursor-pointer"
            title="Klik untuk gunakan konsep ini"
          >
            <span className="text-base shrink-0 group-hover:scale-110 transition-transform mt-0.5">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="ai-concept-badge text-[9px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                  {item.category}
                </span>
                <p className="ai-concept-name text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                  {item.label}
                </p>
              </div>
              <p className="ai-concept-preview text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </div>
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
  const [selectedTrashIds, setSelectedTrashIds] = useState(new Set());
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [batchRestoreConfirm, setBatchRestoreConfirm] = useState(false);

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

  const toggleSelectTrash = (id) => {
    setSelectedTrashIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllTrash = () => {
    if (selectedTrashIds.size === conversations.length && conversations.length > 0) {
      setSelectedTrashIds(new Set());
    } else {
      setSelectedTrashIds(new Set(conversations.map((c) => c.id)));
    }
  };

  const handleBatchRestore = async () => {
    if (selectedTrashIds.size === 0) return;
    const count = selectedTrashIds.size;
    try {
      await Promise.all(Array.from(selectedTrashIds).map((id) => conversationService.restore(id)));
      setSelectedTrashIds(new Set());
      setBatchRestoreConfirm(false);
      refreshList();
      toast.success(`${count} percakapan berhasil dipulihkan.`);
    } catch {
      toast.error('Gagal memulihkan sebagian percakapan.');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTrashIds.size === 0) return;
    const count = selectedTrashIds.size;
    try {
      await Promise.all(Array.from(selectedTrashIds).map((id) => conversationService.forceDestroy(id)));
      setSelectedTrashIds(new Set());
      setBatchDeleteConfirm(false);
      refreshList();
      toast.success(`${count} percakapan berhasil dihapus permanen.`);
    } catch {
      toast.error('Gagal menghapus sebagian percakapan.');
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: conversation history sidebar */}
        <aside className="lg:col-span-3 order-2 lg:order-1">
          <div className="bg-[#181120]/90 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl transition-all">
            <div className="p-3 border-b border-white/5 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon name="message-square" size={14} className="text-primary shrink-0" />
                <p className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-white truncate">Percakapan</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleNewConversation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[11px] bg-gradient-to-r from-primary via-[#ff58a0] to-primary text-white shadow-sm shadow-primary/20 shrink-0 hover:scale-105 active:scale-95 transition-all border-0"
                  title="Buat percakapan baru"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Baru</span>
                </button>
                <PanelToggle open={historyOpen} onToggle={toggleHistory} />
              </div>
            </div>

            {historyOpen && (
            <>
            <div className="p-3 space-y-2 border-b border-white/5 bg-white/[0.01]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari percakapan..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => { setShowTrash(false); setSelectedTrashIds(new Set()); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !showTrash ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => { setShowTrash(true); setSelectedTrashIds(new Set()); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    showTrash ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Sampah
                </button>
              </div>

              {/* Multi-select action bar in Trash */}
              {showTrash && conversations.length > 0 && (
                <div className="flex items-center justify-between px-2.5 py-2 bg-[#120a1c] border border-white/10 rounded-xl text-[11px] animate-fade-in">
                  <button
                    onClick={toggleSelectAllTrash}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
                    title={selectedTrashIds.size === conversations.length ? 'Batal pilih semua' : 'Pilih semua percakapan'}
                  >
                    {selectedTrashIds.size > 0 && selectedTrashIds.size === conversations.length ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray/50 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium">
                      {selectedTrashIds.size > 0 ? `${selectedTrashIds.size} dipilih` : 'Pilih Semua'}
                    </span>
                  </button>

                  {selectedTrashIds.size > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setBatchRestoreConfirm(true)}
                        className="py-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all"
                        title="Pulihkan percakapan yang dipilih"
                      >
                        <RotateCcw className="w-3 h-3" /> Pulihkan
                      </button>
                      <button
                        onClick={() => setBatchDeleteConfirm(true)}
                        className="py-1 px-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all"
                        title="Hapus permanen percakapan yang dipilih"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-72 lg:max-h-[440px] scrollbar-thin">
              {menuFor && (
                <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
              )}
              {listLoading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Inbox className="w-7 h-7 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-xs">
                    {showTrash ? 'Sampah kosong.' : 'Belum ada percakapan. Mulai ide baru!'}
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group relative rounded-xl border transition-all cursor-pointer ${
                      activeId === c.id
                        ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/10'
                        : selectedTrashIds.has(c.id)
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                    onClick={() => {
                      if (showTrash) {
                        toggleSelectTrash(c.id);
                      } else {
                        handleSelectConversation(c.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 px-2.5 py-2.5">
                      {showTrash ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectTrash(c.id);
                          }}
                          className="p-0.5 text-gray hover:text-white shrink-0"
                        >
                          {selectedTrashIds.has(c.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-gray/50" />
                          )}
                        </button>
                      ) : (
                        c.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{c.title}</p>
                        <p className="text-white/40 text-[10px] truncate mt-0.5">{c.last_message || (c.message_count ? 'Ada percakapan' : 'Kosong')}</p>
                      </div>
                      <span className="text-white/30 text-[9px] shrink-0 font-mono">{timeAgo(c.updated_at)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === c.id ? null : c.id); }}
                        className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity p-1 shrink-0"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {menuFor === c.id && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-48 bg-[#1f1628] border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                        {showTrash ? (
                          <>
                            <button
                              onClick={() => { setRestoreTarget(c); setMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(c); setMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setRenameTarget(c); setRenameValue(c.title); setMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-primary" /> Ganti Judul
                            </button>
                            <button
                              onClick={() => handleDuplicate(c)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-purple-400" /> Duplikat
                            </button>
                            <button
                              onClick={() => handleTogglePin(c)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
                            >
                              {c.pinned ? <PinOff className="w-3.5 h-3.5 text-amber-400" /> : <Pin className="w-3.5 h-3.5 text-amber-400" />} {c.pinned ? 'Lepas Semat' : 'Sematkan'}
                            </button>
                            <div className="my-1 border-t border-white/10" />
                            <button
                              onClick={() => handleTrash(c)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Pindahkan ke Sampah
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
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
          <div className="bg-[#181120]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading text-lg sm:text-xl text-white tracking-wide">AI Design Generator</h2>
              {quota && (
                <div className="flex gap-1.5 text-[10px]">
                  <span className={`px-2.5 py-0.5 rounded-full border font-mono font-semibold ${quota.generate.unlimited || quota.generate.remaining > 0 ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/10 text-white/40'}`}>
                    {quota.generate.unlimited ? 'Gen: ∞' : `Gen: ${quota.generate.remaining}/${quota.generate.limit}`}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full border font-mono font-semibold ${quota.edit.unlimited || quota.edit.remaining > 0 ? 'border-purple-400/40 text-purple-400 bg-purple-400/10' : 'border-white/10 text-white/40'}`}>
                    {quota.edit.unlimited ? 'Edit: ∞' : `Edit: ${quota.edit.remaining}/${quota.edit.limit}`}
                  </span>
                </div>
              )}
            </div>
            <p className="text-white/60 text-xs sm:text-sm mb-4 leading-relaxed">
              Tulis ide desainmu, konsultasikan dengan AI, lalu buat visualnya dalam hitungan detik.
            </p>

            <StepIndicator step={currentStep} />

            <div className="space-y-4">
              {contentLoading ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-10 text-center">
                  <Spinner size="md" />
                  <p className="text-white/60 mt-3 text-xs">Memuat percakapan...</p>
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
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/50 text-primary text-xs font-semibold hover:bg-primary/10 transition-all disabled:opacity-50"
                      title="Lewati konsultan dan langsung buat desain dari prompt ini"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {generating ? 'Sedang Merender Desain...' : '⚡ Generate Langsung dari Prompt Ini'}
                    </button>
                  )}

                  <div ref={resultsRef}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-primary text-xs font-bold tracking-[1.5px] uppercase flex items-center gap-2">
                        <Icon name="sparkles" size={13} /> Hasil Desain AI
                      </label>
                    </div>

                    {generating ? (
                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
                        <Spinner size="lg" />
                        <p className="text-white font-medium mt-4 text-sm">AI sedang merender varian desain...</p>
                        <p className="text-white/40 text-xs mt-1">Estimasi 10 - 25 detik dengan kualitas HD</p>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                          {results.map((r, i) => (
                            <div
                              key={r.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedResult(r)}
                              onKeyDown={(e) => e.key === 'Enter' && setSelectedResult(r)}
                              className={`relative aspect-square bg-black/40 border-2 rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer ${
                                selectedResult?.id === r.id
                                  ? 'border-primary ring-4 ring-primary/20 scale-[1.02] shadow-xl shadow-primary/20'
                                  : 'border-white/10 hover:border-primary/50'
                              }`}
                            >
                              <OptimizedImage
                                src={r.imageUrl}
                                thumbnailSrc={r.thumbnail_url}
                                previewSrc={r.preview_url}
                                variant="thumbnail"
                                alt={`Varian ${i + 1}`}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-white/10">
                                Varian {i + 1}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setLightbox({ url: r.imageUrl, label: `Varian ${i + 1}` }); }}
                                className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 hover:bg-black transition-all"
                                title="Lihat ukuran penuh"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                              {r.isValid !== null && (
                                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                                  r.isValid ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-ink'
                                }`}>
                                  {r.isValid ? '✓' : '!'}
                                </div>
                              )}
                              {selectedResult?.id === r.id && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
                                  <div className="btn-gradient-primary text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                                    ✓ Dipilih
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* AI Edit toolbar */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-primary text-xs font-bold tracking-[1px] uppercase flex items-center gap-1.5">
                              <Wand2 className="w-3.5 h-3.5" /> Poles &amp; Edit dengan AI
                            </p>
                            {selectedResult?.version > 1 && (
                              <span className="text-[11px] text-white/50 font-mono">Versi {selectedResult.version}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={handleEnhance}
                              disabled={working || editExhausted}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                              title="Tingkatkan kualitas & kesiapan cetak DTF"
                            >
                              {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                              {working ? 'Memproses...' : 'Enhance Kualitas'}
                            </button>
                            <button
                              onClick={() => setAction((a) => (a === 'edit' ? null : 'edit'))}
                              disabled={working || editExhausted}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs transition-all disabled:opacity-50 ${
                                action === 'edit' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white hover:border-primary hover:text-primary'
                              }`}
                            >
                              <Wand2 className="w-3.5 h-3.5 text-purple-400" /> Edit Prompt
                            </button>
                            <button
                              onClick={handleShowVersions}
                              disabled={working}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                            >
                              <History className="w-3.5 h-3.5 text-cyan-400" /> Riwayat Versi
                            </button>
                          </div>

                          {action === 'edit' && (
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                              <input
                                autoFocus
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitEdit()}
                                placeholder="Contoh: ubah background jadi transparan, tambah outline neon..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-primary transition-colors"
                              />
                              <button
                                onClick={handleSubmitEdit}
                                disabled={working || editExhausted}
                                className="btn-gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                              >
                                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Versi'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* CTA Next Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            onClick={handleRegenerate}
                            disabled={generating || genExhausted}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:text-white hover:border-primary transition-all text-xs font-semibold disabled:opacity-50"
                          >
                            {generating ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Generate...</>
                            ) : (
                              <><RefreshCw className="w-4 h-4" /> Generate Ulang</>
                            )}
                          </button>
                          <button
                            onClick={handleUseDesign}
                            disabled={!selectedResult}
                            className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 disabled:opacity-50"
                          >
                            <Icon name="arrow-right" size={16} /> {nextLabel || 'Lanjut ke Mockup 3D'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-white/30">
                          <Icon name="zap" size={24} />
                        </div>
                        <p className="text-white/50 text-xs">Jelaskan ide desainmu di chat, lalu tekan &ldquo;Generate Sekarang&rdquo; saat konsep siap</p>
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
          <div className="bg-[#181120]/90 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl transition-all">
            <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="eye" size={14} className="text-primary" />
                <p className="text-xs font-bold tracking-[1px] uppercase text-white">Preview Desain</p>
              </div>
              <div className="lg:hidden">
                <PanelToggle open={previewOpen} onToggle={togglePreview} />
              </div>
            </div>
            <div className={`flex-1 p-4 ${previewOpen ? '' : 'hidden lg:block'}`}>
              {selectedResult ? (
                <div className="space-y-3">
                  <div className="relative aspect-square bg-black/50 border border-white/10 rounded-2xl overflow-hidden group">
                    <OptimizedImage
                      src={selectedResult.imageUrl}
                      previewSrc={selectedResult.preview_url}
                      variant="medium"
                      alt="Preview desain"
                      containerClassName="w-full h-full cursor-zoom-in"
                      className="w-full h-full object-contain p-2"
                      onClick={() => setLightbox({ url: selectedResult.imageUrl, label: 'Preview desain' })}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightbox({ url: selectedResult.imageUrl, label: 'Preview desain' }); }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 hover:bg-black transition-all"
                      title="Lihat ukuran penuh"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Varian Terpilih</span>
                    {selectedResult.version > 1 && <span className="text-primary font-mono font-semibold">Versi {selectedResult.version}</span>}
                  </div>
                  <button
                    onClick={() => downloadImage(selectedResult.imageUrl, `desain-${selectedResult.version || 1}.png`)}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-semibold py-2.5 rounded-xl hover:border-primary hover:text-primary transition-all text-xs"
                  >
                    <Download className="w-4 h-4" /> Unduh Gambar PNG
                  </button>
                  <button
                    onClick={openMockupEditor}
                    className="btn-gradient-primary w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
                  >
                    <ExternalLink className="w-4 h-4" /> Buka di Mockup 3D
                  </button>
                  <p className="text-white/40 text-[11px] leading-relaxed text-center">
                    Preview di atas adalah visual desain. Buka Mockup Editor untuk menempatkan sablon pada kaos 3D.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-10">
                  <ImageOff className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/40 text-xs">
                    Pilih atau buat desain di tengah untuk melihat pratinjau resolusi tinggi di sini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Rename modal */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in" onClick={() => setRenameTarget(null)}>
          <div className="bg-[#181120] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-lg text-white font-bold mb-3">Ganti Judul Percakapan</h3>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              placeholder="Nama percakapan..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-primary mb-4"
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

      {/* Batch Restore Confirm */}
      <ConfirmDialog
        isOpen={batchRestoreConfirm}
        onClose={() => setBatchRestoreConfirm(false)}
        onConfirm={handleBatchRestore}
        title="Pulihkan Percakapan Terpilih"
        message={`Pulihkan ${selectedTrashIds.size} percakapan yang dipilih kembali ke daftar aktif?`}
        confirmLabel="Pulihkan Semua"
      />

      {/* Batch Delete Confirm */}
      <ConfirmDialog
        isOpen={batchDeleteConfirm}
        onClose={() => setBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="Hapus Permanen Terpilih"
        message={`Hapus permanen ${selectedTrashIds.size} percakapan yang dipilih? Semua pesan dan desain di dalamnya akan dihapus selamanya.`}
        confirmLabel="Hapus Permanen"
        variant="danger"
      />

      {/* Version history — modal */}
      {action === 'versions' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[65] p-4 animate-fade-in" onClick={() => setAction(null)}>
          <div className="bg-[#181120] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#120a1c] shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-heading text-base sm:text-lg text-white font-bold tracking-wide">RIWAYAT VERSI DESAIN</h3>
                  <p className="text-[11px] text-white/50">Pilih versi desain sebelumnya untuk diaktifkan kembali</p>
                </div>
              </div>
              <button onClick={() => setAction(null)} className="p-1.5 rounded-xl text-gray hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Spinner size="md" />
                  <p className="text-white/50 text-xs mt-3">Memuat riwayat versi...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedResult(v);
                        setAction(null);
                        toast.success(`Versi ${v.version} dipilih`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSelectedResult(v);
                          setAction(null);
                        }
                      }}
                      className={`group relative bg-[#120a1c] border rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col ${
                        selectedResult?.id === v.id
                          ? 'border-primary ring-2 ring-primary/40 shadow-xl shadow-primary/20 scale-[1.02]'
                          : 'border-white/10 hover:border-primary/50 hover:bg-white/[0.02]'
                      }`}
                      title={`Versi ${v.version} — ${v.kind || v.type || ''}`}
                    >
                      <div className="relative aspect-square w-full bg-[#0d0714] p-2 flex items-center justify-center overflow-hidden">
                        <OptimizedImage
                          src={v.imageUrl}
                          thumbnailSrc={v.thumbnail_url}
                          variant="thumbnail"
                          alt={`Versi ${v.version}`}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/10">
                          v{v.version}
                        </span>
                        {selectedResult?.id === v.id && (
                          <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md shadow-primary/30">
                            Aktif
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setLightbox({ url: v.imageUrl, label: `Versi ${v.version}` }); }}
                          className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-opacity"
                          title="Lihat penuh"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between bg-[#120a1c]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {v.kind === 'enhanced' ? (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> AI Enhanced
                            </span>
                          ) : v.kind === 'edited' ? (
                            <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                              <Wand2 className="w-3 h-3" /> Prompt Edited
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/50 font-medium">Original Generasi</span>
                          )}
                        </div>
                        {v.prompt && (
                          <p className="text-[11px] text-white/60 line-clamp-2 leading-tight mb-2.5" title={v.prompt}>
                            {v.prompt}
                          </p>
                        )}
                        <button
                          type="button"
                          className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            selectedResult?.id === v.id
                              ? 'bg-primary/20 text-primary border border-primary/40'
                              : 'bg-white/5 text-white hover:bg-primary hover:text-white'
                          }`}
                        >
                          {selectedResult?.id === v.id ? '✓ Sedang Dipilih' : 'Gunakan Versi Ini'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare (before/after enhance) — modal */}
      {action === 'compare' && compareFrom && compareTo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[65] p-4 animate-fade-in" onClick={() => setAction(null)}>
          <div className="bg-[#181120] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#120a1c]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading text-base sm:text-lg text-white font-bold tracking-wide">BANDINGKAN HASIL ENHANCE</h3>
              </div>
              <button onClick={() => setAction(null)} className="p-1.5 rounded-xl text-gray hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#120a1c] border border-white/10 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-xs font-semibold">Sebelum</span>
                    <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-md">Original</span>
                  </div>
                  <div className="relative aspect-square bg-[#0d0714] rounded-xl overflow-hidden group p-2">
                    <img src={compareFrom.imageUrl} alt="Sebelum" className="w-full h-full object-contain" />
                    <button
                      onClick={() => setLightbox({ url: compareFrom.imageUrl, label: 'Sebelum (Original)' })}
                      className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-opacity"
                      title="Lihat penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="bg-[#120a1c] border border-primary/40 rounded-2xl p-3 shadow-lg shadow-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Setelah
                    </span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-semibold">Enhanced</span>
                  </div>
                  <div className="relative aspect-square bg-[#0d0714] rounded-xl overflow-hidden group p-2">
                    <img src={compareTo.imageUrl} alt="Setelah" className="w-full h-full object-contain" />
                    <button
                      onClick={() => setLightbox({ url: compareTo.imageUrl, label: 'Setelah (Enhanced)' })}
                      className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-opacity"
                      title="Lihat penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { handleUseDesign(); setAction(null); }}
                className="btn-gradient-primary mt-4 w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-primary/25"
              >
                <Icon name="arrow-right" size={18} /> Gunakan Versi Enhanced Ini
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