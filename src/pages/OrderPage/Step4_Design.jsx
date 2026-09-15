import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { designService } from '../../services/designService';
import { aiChatService } from '../../services/aiChatService';
import { conversationService } from '../../services/conversationService';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { Loader2, Zap, Image, Camera, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getImageUrl } from '../../utils/getImageUrl';
import { getUserSession } from '../../utils/userSession';
import DesignUpload from '../../components/design-studio/DesignUpload';
import AiChatPanel from '../../components/design-studio/AiChatPanel';
import { QUICK_IDEAS } from '../../components/design-studio/quickIdeas';
import Step4MockupTab from './Step4_MockupTab';
import Step4ARTab from './Step4_ARTab';
import { PRINT_POSITIONS } from '../../constants/printPlacements';

const getTabs = (language) => [
  {
    id: 'ai',
    label: 'AI Generate',
    icon: Zap,
    desc: language === 'en' ? 'Create design with AI' : 'Buat desain dengan AI',
    fullDesc: language === 'en' ? 'Share your idea, AI will generate the artwork' : 'Ceritakan idemu, AI akan membuatkan desainnya'
  },
  {
    id: 'mockup',
    label: 'Mockup 3D',
    icon: Image,
    desc: language === 'en' ? '3D Shirt preview' : 'Preview di kaos 3D',
    fullDesc: language === 'en' ? 'View realistic mockup on t-shirt' : 'Lihat hasil desain di kaos secara realistis'
  },
  {
    id: 'ar',
    label: 'AR Try-On',
    icon: Camera,
    desc: language === 'en' ? 'Try on with camera' : 'Coba pakai dengan kamera',
    fullDesc: language === 'en' ? 'Virtual t-shirt try-on with live camera' : 'Coba kaos virtual dengan kamera langsung'
  },
];

// Normalize design type — backend 'chat_upload' is not accepted by order validation
const normalizeType = (t) => (t === 'chat_upload' ? 'uploaded' : t);

const mapDesign = (d) => ({
  id: d.id,
  imageUrl: getImageUrl(d.image_url),
  prompt: d.prompt || '',
  type: normalizeType(d.design_type),
  isValid: d.is_valid,
  createdAt: d.created_at,
});

function parseReadyReply(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(candidate.slice(start, end + 1));
    if (obj && obj.status === 'ready' && obj.final_prompt) return obj;
  } catch { /* not a JSON block */ }
  return null;
}

function DesignSummary({ summary, generating, onGenerate, quota, language, td }) {
  const [expanded, setExpanded] = useState(true);
  const info = summary.design_info || {};
  const exhausted = !!quota && !quota.generate?.unlimited && (quota.generate?.remaining ?? 1) <= 0;
  const rows = [
    [language === 'en' ? 'Object' : 'Objek', td(info.object)],
    [language === 'en' ? 'Style' : 'Style', td(info.style)],
    [language === 'en' ? 'Colors' : 'Warna', td(info.colors)],
    [language === 'en' ? 'Sablon Type' : 'Jenis Sablon', td(info.print_type)],
    [language === 'en' ? 'Size' : 'Ukuran', td(info.size)],
    [language === 'en' ? 'Position' : 'Posisi', td(info.position)],
  ].filter(([, v]) => v);

  return (
    <div className="bg-ink border border-fire/40 rounded-xl p-3 mb-3">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between">
        <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase">
          {language === 'en' ? 'Final Design Ready' : 'Desain Final Siap'}
        </p>
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
        {generating
          ? (language === 'en' ? 'Creating design...' : 'Membuat desain...')
          : exhausted
            ? (language === 'en' ? 'Generate Quota Exhausted' : 'Kuota Generate Habis')
            : (language === 'en' ? 'Generate Now' : 'Generate Sekarang')}
      </button>
      {exhausted && (
        <p className="text-gray text-[10px] text-center mt-2">
          {language === 'en'
            ? `Your AI Generate quota is exhausted (max ${quota.generate.limit} images). Contact admin to add quota.`
            : `Kuota AI Generate Anda telah habis (maksimal ${quota.generate.limit} gambar). Hubungi admin untuk menambah kuota.`}
        </p>
      )}
    </div>
  );
}

export default function Step4Design() {
  const { printAreas, setAreaDesign, nextStep, prevStep, selectedService, config } = useOrderStore();
  const { t, td, language } = useLanguageStore();
  const toast = useToast();

  // DTF/DTG support full-color output, so color/gradient warnings are hidden.
  const isFullColorSablon = /dtf|dtg/i.test((config?.sablonType || '').toLowerCase());

  const [activeTab, setActiveTab] = useState('ai');
  const [activeDesign, setActiveDesign] = useState(null);
  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const conversationIdRef = useRef(null);
  const isUploadingRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const generatedPromptsRef = useRef(new Set());
  const [quota, setQuota] = useState(null);
  const [historyDesigns, setHistoryDesigns] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingHistoryDesign, setPendingHistoryDesign] = useState(null);
  const [readySummary, setReadySummary] = useState(null);
  const [lastFinalPrompt, setLastFinalPrompt] = useState('');
  const [lastNegativePrompt, setLastNegativePrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [chatResults, setChatResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editing, setEditing] = useState(false);

  const refreshQuota = () => {
    designService.getQuota().then((res) => setQuota(res.quota)).catch(() => {});
  };
  const genExhausted = !!quota && !quota.generate?.unlimited && (quota.generate?.remaining ?? 1) <= 0;
  const editExhausted = !!quota && !quota.edit?.unlimited && (quota.edit?.remaining ?? 1) <= 0;

  const options = selectedService?.options_config || {};
  const printPositions = options.print_positions || [];
  const printSizes = options.print_sizes || [];

  const getPositionLabel = (value) => printPositions.find((p) => p.value === value)?.label || value;
  const getSizeLabel = (value) => printSizes.find((s) => s.value === value)?.label || value;
  const getPositionLabelById = (id) => PRINT_POSITIONS.find((p) => p.id === id)?.label || id;

  useEffect(() => {
    refreshQuota();
  }, []);

  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await designService.list(getUserSession(), null, { page, per_page: 24 });
      const paginator = res.designs;
      const list = Array.isArray(paginator) ? paginator : paginator?.data || [];
      const designs = list.map(mapDesign);
      setHistoryDesigns((prev) => (page === 1 ? designs : prev.concat(designs)));
      setHistoryPage(page);
      setHistoryHasMore(!!paginator?.last_page && page < paginator.last_page);
      setHistoryTotal(paginator?.total ?? designs.length);
    } catch {
      return;
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    designService
      .list(getUserSession(), null, { page: 1, per_page: 24 })
      .then((res) => {
        if (cancelled) return;
        const paginator = res.designs;
        const list = Array.isArray(paginator) ? paginator : paginator?.data || [];
        const designs = list.map(mapDesign);
        setHistoryDesigns(designs);
        setHistoryPage(1);
        setHistoryHasMore(!!paginator?.last_page && 1 < paginator.last_page);
        setHistoryTotal(paginator?.total ?? designs.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const ensureConversation = async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    const res = await conversationService.create({ title: 'Order Chat' });
    const id = res.conversation?.id;
    if (id) conversationIdRef.current = id;
    return id;
  };

  const handleSendMessage = async (text) => {
    const message = (text || '').trim();
    if (!message || chatLoading) return;
    setMessages((prev) => [...prev, { role: 'user', text: message, time: Date.now() }]);
    setChatLoading(true);
    try {
      const cid = await ensureConversation();
      const res = await aiChatService.sendMessage(message, getUserSession(), cid);
      conversationIdRef.current = res.conversation?.id || conversationIdRef.current;
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, time: Date.now() }]);
      const ready = parseReadyReply(res.reply);
      if (ready) {
        setLastFinalPrompt(ready.final_prompt || '');
        setLastNegativePrompt(ready.negative_prompt || '');
        setReadySummary(ready);
      }
    } catch {
      toast.error(language === 'en' ? 'Failed to send message. Please try again.' : 'Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendImage = async (file) => {
    if (!file || isUploadingRef.current) return;
    isUploadingRef.current = true;
    setChatLoading(true);
    try {
      const cid = await ensureConversation();
      const res = await designService.upload(file, getUserSession(), null, cid, true, config?.sablonType);
      const design = res.design;
      if (!design) {
        toast.error(language === 'en' ? 'Failed to upload design' : 'Gagal mengupload desain');
        return;
      }
      const imageUrl = design.image_url;
      const mapped = {
        id: design.id,
        imageUrl: getImageUrl(imageUrl),
        prompt: design.prompt || '',
        isValid: design.is_valid,
        validationMessage: design.validation_message,
        type: normalizeType('chat_upload'),
      };
      setChatResults((prev) => [mapped, ...prev]);
      setSelectedResult(mapped);
      setMessages((prev) => [...prev, { role: 'user', text: '', imageUrl, designId: design.id, time: Date.now() }]);
      loadHistory(1);

      // Auto-apply to the active unfilled print area so design_id is preserved
      const unfilledIdx = printAreas.findIndex((a) => !a.design?.imageUrl);
      const targetAreaIdx = unfilledIdx >= 0 ? unfilledIdx : 0;
      setAreaDesign(targetAreaIdx, {
        id: design.id,
        imageUrl: mapped.imageUrl,
        isValid: design.is_valid,
        validationMessage: design.validation_message,
        type: 'uploaded',
      });
      setActiveDesign({
        id: design.id,
        imageUrl: mapped.imageUrl,
        isValid: design.is_valid,
        validationMessage: design.validation_message,
        type: 'uploaded',
      });
      const ask = await aiChatService.sendMessage(
        language === 'en'
          ? 'I uploaded my artwork. Please analyze briefly and provide improvement tips.'
          : 'Saya upload desain saya. Mohon analisis singkat dan saran perbaikannya.',
        getUserSession(),
        cid,
        design.id
      );
      setMessages((prev) => [...prev, { role: 'assistant', text: ask.reply, time: Date.now() }]);
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to upload design. Make sure PNG/JPG format max 5MB.' : 'Gagal mengupload desain. Pastikan format PNG/JPG maks 5MB.'));
    } finally {
      isUploadingRef.current = false;
      setChatLoading(false);
    }
  };

  const handleGenerateFromChat = async () => {
    if (genExhausted) {
      toast.error(language === 'en' ? 'Your AI Generate quota is exhausted.' : 'Kuota AI Generate Anda telah habis.');
      return;
    }
    if (!lastFinalPrompt || generating) return;
    const promptKey = `${lastFinalPrompt}::${lastNegativePrompt || ''}`;
    if (generatedPromptsRef.current.has(promptKey)) {
      toast.warning(language === 'en' ? 'This prompt was already generated earlier.' : 'Prompt ini sudah di-generate sebelumnya.');
      return;
    }
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    generatedPromptsRef.current.add(promptKey);
    setGenerating(true);
    setSelectedResult(null);
    try {
      const cid = await ensureConversation();
      const res = await designService.generate(lastFinalPrompt, 1, getUserSession(), lastNegativePrompt || null, cid, config?.sablonType);
      const designs = (res.designs || []).map((d) => ({
        id: d.id,
        imageUrl: getImageUrl(d.image_url),
        prompt: d.prompt || lastFinalPrompt,
        isValid: d.is_valid,
        validationMessage: d.validation_message,
        type: 'ai_generated',
      }));
      setChatResults((prev) => [...designs, ...prev]);
      setSelectedResult(designs[0] || null);
      if (designs[0]) {
        const unfilledIdx = printAreas.findIndex((a) => !a.design?.imageUrl);
        const targetAreaIdx = unfilledIdx >= 0 ? unfilledIdx : 0;
        setAreaDesign(targetAreaIdx, {
          id: designs[0].id,
          imageUrl: designs[0].imageUrl,
          isValid: designs[0].isValid,
          validationMessage: designs[0].validationMessage,
          type: 'ai_generated',
        });
        setActiveDesign(designs[0]);
      }
      setReadySummary(null);
      const doneMsg = language === 'en'
        ? 'Design ready! The result is shown below. Click image to apply to order area.'
        : 'Desain sudah jadi! Hasilnya ada di bawah. Klik gambar untuk menerapkan ke area pesanan.';
      setMessages((prev) => [...prev, { role: 'assistant', text: doneMsg, time: Date.now() }]);
      refreshQuota();
      loadHistory(1);
      toast.success(language === 'en' ? 'Design generated successfully!' : 'Desain berhasil di-generate!');
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to generate design' : 'Gagal generate desain'));
      generatedPromptsRef.current.delete(promptKey);
    } finally {
      isGeneratingRef.current = false;
      setGenerating(false);
    }
  };

  const handleEditDesign = async () => {
    if (editExhausted) {
      toast.error(language === 'en' ? 'Your edit quota is exhausted.' : 'Kuota edit Anda telah habis.');
      return;
    }
    if (!selectedResult?.id || !editPrompt.trim() || editing) return;
    setEditing(true);
    try {
      const res = await designService.edit(selectedResult.id, editPrompt.trim(), 1, config?.sablonType);
      const newDesigns = (res.designs || []).map((d) => ({
        id: d.id,
        imageUrl: getImageUrl(d.image_url),
        prompt: d.prompt || editPrompt.trim(),
        isValid: d.is_valid,
        validationMessage: d.validation_message,
        type: normalizeType(d.design_type) || 'ai_generated',
      }));
      if (newDesigns.length > 0) {
        setChatResults((prev) => [...newDesigns, ...prev]);
        setSelectedResult(newDesigns[0]);
        setEditPrompt('');
        refreshQuota();
        loadHistory(1);
        toast.success(language === 'en' ? 'Edit successful!' : 'Edit berhasil!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to edit design' : 'Gagal edit desain'));
    } finally {
      setEditing(false);
    }
  };

  const handleSelectResult = (result) => {
    setSelectedResult(result);
    if (printAreas.length > 1 && printAreas.some((a) => !a.design?.imageUrl)) {
      setPendingHistoryDesign(result);
      return;
    }
    const targetIndex = printAreas.findIndex((a) => !a.design?.imageUrl);
    const areaIndex = targetIndex >= 0 ? targetIndex : 0;
    setAreaDesign(areaIndex, {
      id: result.id,
      imageUrl: result.imageUrl,
      isValid: result.isValid,
      validationMessage: result.validationMessage,
      type: result.type,
    });
    setActiveDesign({
      id: result.id,
      imageUrl: result.imageUrl,
      isValid: result.isValid,
      validationMessage: result.validationMessage,
      type: result.type,
    });
    toast.success(language === 'en' ? `Design applied to Area ${areaIndex + 1}! Open 3D Mockup tab to preview.` : `Desain diterapkan ke Area ${areaIndex + 1}! Buka tab Mockup 3D untuk preview.`);
  };

  const handleSelectHistory = (design) => {
    if (printAreas.length > 1 && printAreas.some((a) => !a.design?.imageUrl)) {
      setPendingHistoryDesign(design);
      return;
    }
    const targetIndex = printAreas.findIndex((a) => !a.design?.imageUrl);
    const areaIndex = targetIndex >= 0 ? targetIndex : 0;
    setAreaDesign(areaIndex, {
      id: design.id,
      imageUrl: design.imageUrl,
      isValid: design.isValid,
      validationMessage: null,
      type: design.type,
    });
    setActiveDesign({
      id: design.id,
      imageUrl: design.imageUrl,
      isValid: design.isValid,
      validationMessage: null,
      type: design.type,
    });
    toast.success(language === 'en' ? `Design applied to Area ${areaIndex + 1}! Open 3D Mockup tab to preview.` : `Desain diterapkan ke Area ${areaIndex + 1}! Buka tab Mockup 3D untuk preview.`);
  };

  const handleConfirmHistoryArea = (areaIndex) => {
    if (!pendingHistoryDesign) return;
    const d = pendingHistoryDesign;
    setAreaDesign(areaIndex, {
      id: d.id,
      imageUrl: d.imageUrl,
      isValid: d.isValid,
      validationMessage: null,
      type: d.type,
    });
    setActiveDesign({
      id: d.id,
      imageUrl: d.imageUrl,
      isValid: d.isValid,
      validationMessage: null,
      type: d.type,
    });
    setPendingHistoryDesign(null);
    toast.success(language === 'en' ? `Design applied to Area ${areaIndex + 1}! Open 3D Mockup tab to preview.` : `Desain diterapkan ke Area ${areaIndex + 1}! Buka tab Mockup 3D untuk preview.`);
  };

  const handleAreaRemove = async (areaIndex) => {
    const area = printAreas[areaIndex];
    if (area.design?.id) {
      try {
        await designService.delete(area.design.id);
      } catch (err) {
        console.error('Failed to delete design:', err);
      }
    }
    setAreaDesign(areaIndex, { id: null, imageUrl: null, isValid: false, validationMessage: null, type: null });
    if (areaIndex === 0) setActiveDesign(null);
  };

  const handleAreaUpload = async (file, _url, areaIndex) => {
    if (!file) {
      handleAreaRemove(areaIndex);
      return;
    }

    try {
      const session = getUserSession();

      const result = await designService.upload(file, session, null, null, false, config?.sablonType);
      setAreaDesign(areaIndex, {
        id: result.design?.id,
        imageUrl: result.design?.image_url,
        isValid: result.design?.is_valid,
        validationMessage: result.design?.validation_message,
        type: 'uploaded',
      });
      setActiveDesign({
        id: result.design?.id,
        imageUrl: result.design?.image_url,
        isValid: result.design?.is_valid,
        validationMessage: result.design?.validation_message,
        type: 'uploaded',
      });
      toast.success(language === 'en' ? `Area ${areaIndex + 1} design uploaded successfully!` : `Desain Area ${areaIndex + 1} berhasil diupload!`);
      loadHistory(1);
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to upload design' : 'Gagal upload desain'));
    }
  };

  const handleNext = () => {
    const allValid = printAreas.every((area) => area.design?.imageUrl && area.design?.id);
    if (!allValid) {
      const missing = printAreas.findIndex((area) => !area.design?.imageUrl || !area.design?.id);
      toast.warning(language === 'en' ? `Please choose or upload a design for Area ${missing + 1} first` : `Pilih atau upload desain untuk Area ${missing + 1} terlebih dahulu`);
      return;
    }
    nextStep();
  };

  const completedAreas = printAreas.filter((a) => a.design?.imageUrl && a.design?.id).length;
  const totalAreas = printAreas.length;
  const allAreasFilled = completedAreas === totalAreas;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 4 of 6' : 'Langkah 4 dari 6'}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-[1.5px] mt-2">
            {language === 'en' ? 'DESIGN & MOCKUP' : 'DESAIN & MOCKUP'}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">{language === 'en' ? 'Design Status:' : 'Status Desain:'}</span>
          <p className="text-sm font-semibold text-white">
            {language === 'en'
              ? `${completedAreas} of ${totalAreas} Areas Filled`
              : `${completedAreas} dari ${totalAreas} Area Terisi`}
          </p>
        </div>
      </div>

      {/* Method Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {getTabs(language).map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 text-left border ${
                isActive
                  ? 'btn-gradient-primary border-primary/40 shadow-lg shadow-primary/25 scale-[1.01]'
                  : 'border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? 'bg-white/20 shadow-inner' : 'bg-white/5 border border-white/10'
              }`}>
                <IconComp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{tab.label}</p>
                <p className={`text-[11px] leading-tight mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{tab.fullDesc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: AI Chat + Results */}
          <div>
            <div className="mb-4">
              <AiChatPanel
                messages={messages}
                chatLoading={chatLoading}
                onSend={handleSendMessage}
                onSendImage={handleSendImage}
                heightClass="h-72"
              />
            </div>

            {/* Design Summary — appears when AI outputs {status:ready} */}
            {readySummary && (
              <DesignSummary
                summary={readySummary}
                generating={generating}
                onGenerate={handleGenerateFromChat}
                quota={quota}
                language={language}
                td={td}
              />
            )}

            {/* Loading indicator */}
            {generating && !readySummary && (
              <div className="flex flex-col items-center py-6 mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-gray text-[13px]">{language === 'en' ? 'AI is creating your design...' : 'AI sedang membuat desain...'}</p>
                <p className="text-gray text-[11px] mt-1">{language === 'en' ? 'This usually takes 10-30 seconds' : 'Ini biasanya membutuhkan 10-30 detik'}</p>
              </div>
            )}

            {/* Chat Results — generated designs appear here */}
            {chatResults.length > 0 && !generating && (
              <div className="mb-4">
                <p className="text-fire text-[11px] font-bold tracking-[1px] uppercase mb-2">
                  {language === 'en' ? 'Generated Designs' : 'Hasil Desain'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {chatResults.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectResult(r)}
                      className={`relative aspect-square bg-ink border-2 rounded-xl overflow-hidden transition-all group ${
                        selectedResult?.id === r.id
                          ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={r.imageUrl} alt={`Hasil ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                        {i + 1}
                      </div>
                      {!isFullColorSablon && r.isValid !== null && (
                        <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          r.isValid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                        }`}>
                          {r.isValid ? '✓' : '!'}
                        </div>
                      )}
                      {selectedResult?.id === r.id && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="bg-primary text-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {language === 'en' ? 'Selected' : 'Dipilih'}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Edit with Prompt */}
                {selectedResult && (selectedResult.type === 'ai_generated' || selectedResult.type === 'uploaded') && (
                  <div className="mt-3 bg-ink border border-border rounded-xl p-3">
                    <p className="text-fire text-[10px] font-bold tracking-[1px] uppercase mb-2">
                      {language === 'en' ? 'Edit with Prompt' : 'Edit dengan Prompt'}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditDesign(); }}
                        placeholder={language === 'en' ? 'Example: change background to blue, add text...' : 'Contoh: ubah latar jadi biru, tambahkan teks...'}
                        disabled={editing || editExhausted}
                        className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-gray focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                      />
                      <button
                        onClick={handleEditDesign}
                        disabled={editing || !editPrompt.trim() || editExhausted}
                        className="flex items-center gap-1.5 bg-fire text-ink font-bold px-4 py-2 rounded-lg text-[12px] hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {editing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon name="zap" size={14} />}
                        {editing ? (language === 'en' ? 'Editing...' : 'Edit...') : (language === 'en' ? 'Edit' : 'Edit')}
                      </button>
                    </div>
                    {editExhausted && (
                      <p className="text-gray text-[10px] mt-1.5">
                        {language === 'en' ? 'Edit quota exhausted. Contact admin.' : 'Kuota edit habis. Hubungi admin.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase mb-2 block">
              {language === 'en' ? 'Quick Ideas' : 'Ide Cepat'}
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => handleSendMessage(idea)}
                  disabled={chatLoading}
                  className="text-[11px] px-3 py-2 rounded-full border border-border text-gray hover:text-white hover:border-fire/50 transition-colors disabled:opacity-50"
                >
                  {idea}
                </button>
              ))}
            </div>

            <p className="text-gray text-[11px] leading-relaxed">
              {language === 'en'
                ? <>Explain your idea in chat. After AI understands the concept, click <strong className="text-primary">Generate Now</strong> to create the design. Click the result image to apply to an area.</>
                : <>Jelaskan idemu di chat. Setelah AI memahami konsepnya, klik <strong className="text-primary">Generate Sekarang</strong> untuk membuat desain. Klik gambar hasil untuk menerapkan ke area.</>}
            </p>

            {/* History Designs */}
            {historyDesigns.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3.5 h-3.5 text-gray" />
                  <label className="text-gray text-[11px] font-medium tracking-[1px] uppercase">
                    {language === 'en' ? 'Select from History' : 'Pilih dari History'}
                  </label>
                  {historyTotal > 0 && (
                    <span className="text-gray/50 text-[10px]">
                      ({historyTotal} {language === 'en' ? 'designs' : 'desain'})
                    </span>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {historyDesigns.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectHistory(d)}
                      className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border hover:border-primary/60 hover:ring-1 hover:ring-primary/20 transition-all group"
                      title={d.prompt || 'Desain saya'}
                    >
                      <img src={d.imageUrl} alt="History" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-[9px] font-bold bg-primary/80 px-1.5 py-0.5 rounded">
                          {language === 'en' ? 'Use' : 'Pakai'}
                        </span>
                      </div>
                    </button>
                  ))}
                  {historyLoading && (
                    <div className="shrink-0 w-20 h-20 rounded-lg border border-border flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-gray" />
                    </div>
                  )}
                </div>
                {historyHasMore && (
                  <div className="mt-2">
                    <button
                      onClick={() => loadHistory(historyPage + 1)}
                      disabled={historyLoading}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-border text-gray hover:text-white hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {language === 'en' ? 'Load More' : 'Muat Lebih Banyak'}
                    </button>
                  </div>
                )}
                <p className="text-gray/60 text-[10px] mt-1">
                  {language === 'en' ? 'Click to apply to order area' : 'Klik untuk menerapkan ke area pesanan'}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Print Areas */}
          <div className="space-y-6">
            {/* Area Progress */}
            <div className="bg-ink border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray text-[11px] font-medium tracking-[1px] uppercase">
                  {language === 'en' ? 'Design Areas' : 'Area Desain'}
                </span>
                <span className={`text-[12px] font-semibold ${allAreasFilled ? 'text-green-400' : 'text-primary'}`}>
                  {language === 'en' ? `${completedAreas} of ${totalAreas} filled` : `${completedAreas} dari ${totalAreas} terisi`}
                </span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${allAreasFilled ? 'bg-green-400' : 'bg-primary'}`}
                  style={{ width: `${totalAreas > 0 ? (completedAreas / totalAreas) * 100 : 0}%` }}
                />
              </div>
              {allAreasFilled && (
                <p className="text-green-400 text-[11px] mt-2 font-medium">
                  {language === 'en' ? <>All areas filled! Click <strong>Next</strong> to proceed.</> : <>Semua area terisi! Klik <strong>Lanjut</strong> untuk melanjutkan.</>}
                </p>
              )}
            </div>

            {quota && (
              <div className="flex gap-2 text-[10px]">
                <span className={`px-2 py-0.5 rounded-full border ${quota.generate.unlimited || quota.generate.remaining > 0 ? 'border-primary/40 text-primary' : 'border-gray text-gray'}`}>
                  {language === 'en' ? 'Generate Quota: ' : 'Kuota Generate: '}
                  {quota.generate.unlimited ? (language === 'en' ? 'Unlimited' : 'Tak terbatas') : (language === 'en' ? `${quota.generate.remaining}/${quota.generate.limit} left` : `${quota.generate.remaining}/${quota.generate.limit} tersisa`)}
                </span>
                <span className={`px-2 py-0.5 rounded-full border ${quota.edit.unlimited || quota.edit.remaining > 0 ? 'border-primary/40 text-primary' : 'border-gray text-gray'}`}>
                  {language === 'en' ? 'Edit Quota: ' : 'Kuota Edit: '}
                  {quota.edit.unlimited ? (language === 'en' ? 'Unlimited' : 'Tak terbatas') : (language === 'en' ? `${quota.edit.remaining}/${quota.edit.limit} left` : `${quota.edit.remaining}/${quota.edit.limit} tersisa`)}
                </span>
              </div>
            )}
            {printAreas.map((area, index) => (
              <div key={index} className="bg-ink border border-border rounded-xl p-4">
                <div className="mb-3">
                  <p className="text-fire text-[11px] tracking-[1px] uppercase font-medium">
                    {language === 'en' ? `Area ${index + 1}` : `Area ${index + 1}`}
                  </p>
                  <p className="text-white text-sm font-medium">
                    {td(getPositionLabel(area.position))} ({td(getSizeLabel(area.printSize))})
                  </p>
                </div>

                {/* Design Upload */}
                <DesignUpload
                  onUploadDesign={(file, url) => handleAreaUpload(file, url, index)}
                  currentDesign={area.design?.imageUrl ? getImageUrl(area.design.imageUrl) : null}
                />

                {/* Validation Message */}
                {!isFullColorSablon && area.design?.imageUrl && area.design.validationMessage && (
                  <div className={`mt-3 p-3 rounded-xl text-sm ${area.design.isValid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {td(area.design.validationMessage)}
                  </div>
                )}

                {/* Active Design Indicator */}
                {area.design?.imageUrl && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {language === 'en' ? <>Active design — open <strong>3D Mockup</strong> tab to preview</> : <>Desain aktif — buka tab <strong>Mockup 3D</strong> untuk preview</>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mockup' && (
        <Step4MockupTab
          printAreas={printAreas}
          shirtColor={shirtColor}
          setShirtColor={setShirtColor}
        />
      )}

      {activeTab === 'ar' && (
        <Step4ARTab
          design={activeDesign || printAreas[0]?.design}
          shirtColor={shirtColor}
          setShirtColor={setShirtColor}
          printAreas={printAreas}
          onBack={() => setActiveTab('mockup')}
        />
      )}

      {/* History/Result Area Picker Modal */}
      {pendingHistoryDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#170e1c] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-white font-bold text-base mb-1 tracking-wide">
              {language === 'en' ? 'Select Print Area' : 'Pilih Area Cetak'}
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              {language === 'en' ? 'Apply this design to which area?' : 'Terapkan desain ini ke area mana?'}
            </p>
            <div className="aspect-square w-32 mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black/40 mb-4 p-2">
              <img src={pendingHistoryDesign.imageUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-2">
              {printAreas.map((area, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleConfirmHistoryArea(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-primary/50 hover:bg-primary/10 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/20 group-hover:bg-primary flex items-center justify-center text-primary group-hover:text-white text-xs font-bold transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{language === 'en' ? `Area ${i + 1}` : `Area ${i + 1}`}</p>
                    <p className="text-gray-400 text-xs">{td(getPositionLabelById(area.position))}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPendingHistoryDesign(null)}
              className="w-full mt-4 py-2.5 text-gray-400 text-xs font-medium hover:text-white transition-colors"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={prevStep}
          className="btn-glass flex items-center gap-2 py-3 px-6 rounded-2xl text-xs uppercase tracking-wider font-semibold text-gray-300 hover:text-white"
        >
          <Icon name="arrow-left" size={18} /> {language === 'en' ? 'Back' : 'Kembali'}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25"
        >
          {language === 'en' ? 'Continue to Price Review' : 'Lanjut ke Review Harga'} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
