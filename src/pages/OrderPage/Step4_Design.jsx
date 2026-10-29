import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { designService } from '../../services/designService';
import { aiChatService } from '../../services/aiChatService';
import { conversationService } from '../../services/conversationService';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { Loader2, Zap, Image, Camera, Clock, ChevronDown, ChevronUp, UploadCloud, Check, Sparkles, Info, ZoomIn, FileImage, Palette } from 'lucide-react';
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
    id: 'upload',
    label: language === 'en' ? 'Upload Design' : 'Upload Desain',
    icon: UploadCloud,
    desc: language === 'en' ? 'Upload ready artwork' : 'Upload file desain',
    fullDesc: language === 'en' ? 'Upload ready-to-print artwork (PNG, JPG, WebP, HEIC)' : 'Upload desain kaos siap cetak (PNG, JPG, WebP, HEIC)'
  },
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

  const [activeTab, setActiveTab] = useState('upload');
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
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
  const [uploadingAreaIndex, setUploadingAreaIndex] = useState(null);

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
      toast.error(err.response?.data?.message || (language === 'en' ? 'Failed to upload design. Make sure PNG, JPG, WebP, or HEIC format max 10MB.' : 'Gagal mengupload desain. Pastikan format PNG, JPG, WebP, atau HEIC maks 10MB.'));
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

    setUploadingAreaIndex(areaIndex);
    try {
      const session = getUserSession();

      const result = await designService.upload(file, session, null, null, false, config?.sablonType);
      const designObj = result.design;
      if (!designObj || !designObj.id) {
        throw new Error(language === 'en' ? 'Server failed to process design file.' : 'Server gagal memproses file desain.');
      }

      const resolvedUrl = getImageUrl(designObj.image_url);
      setAreaDesign(areaIndex, {
        id: designObj.id,
        imageUrl: resolvedUrl,
        isValid: designObj.is_valid,
        validationMessage: designObj.validation_message,
        type: 'uploaded',
      });
      setActiveDesign({
        id: designObj.id,
        imageUrl: resolvedUrl,
        isValid: designObj.is_valid,
        validationMessage: designObj.validation_message,
        type: 'uploaded',
      });
      toast.success(language === 'en' ? `Area ${areaIndex + 1} design uploaded successfully!` : `Desain Area ${areaIndex + 1} berhasil diupload!`);
      loadHistory(1);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.message || err.message || (language === 'en' ? 'Failed to upload design' : 'Gagal upload desain'));
      // Reset invalid upload so incomplete state is not left
      setAreaDesign(areaIndex, { id: null, imageUrl: null, isValid: false, validationMessage: null, type: null });
    } finally {
      setUploadingAreaIndex(null);
    }
  };

  const handleNext = () => {
    if (uploadingAreaIndex !== null) {
      toast.warning(language === 'en' ? 'Please wait until the design upload is finished.' : 'Harap tunggu hingga proses upload desain selesai.');
      return;
    }
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
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-6 pb-3.5 sm:pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 4 of 6' : 'Langkah 4 dari 6'}
          </span>
          <h2 className="font-heading text-xl sm:text-3xl text-white tracking-[1.5px] mt-1.5 sm:mt-2">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
        {getTabs(language).map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 text-left border cursor-pointer ${
                isActive
                  ? 'btn-gradient-primary border-primary/40 shadow-lg shadow-primary/25 scale-[1.01]'
                  : 'border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-white/20 shadow-inner' : 'bg-white/5 border border-white/10'
                }`}
              >
                <IconComp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-white truncate">{tab.label}</p>
                <p className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 line-clamp-1 sm:line-clamp-2 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {tab.fullDesc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: UPLOAD DESAIN (DEFAULT TAMPILAN AWAL) */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Area Progress & Quota Bar */}
          <div className="bg-ink/70 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-xs font-bold tracking-[1px] uppercase">
                  {language === 'en' ? 'Design Placement Progress' : 'Progres Penempatan Desain Kaos'}
                </span>
                <span className={`text-xs font-bold ${allAreasFilled ? 'text-emerald-400' : 'text-primary'}`}>
                  {language === 'en'
                    ? `${completedAreas} of ${totalAreas} Areas Filled`
                    : `${completedAreas} dari ${totalAreas} Area Terisi`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    allAreasFilled ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'btn-gradient-primary'
                  }`}
                  style={{ width: `${totalAreas > 0 ? (completedAreas / totalAreas) * 100 : 0}%` }}
                />
              </div>
            </div>
            {allAreasFilled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start sm:self-auto">
                <Check size={14} /> {language === 'en' ? 'All Areas Ready' : 'Semua Area Siap'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium self-start sm:self-auto">
                <UploadCloud size={14} /> {language === 'en' ? 'Upload files below' : 'Upload file di bawah ini'}
              </span>
            )}
          </div>

          {/* Print Areas Upload Cards */}
          <div className={`grid gap-5 ${printAreas.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {printAreas.map((area, index) => {
              const isFilled = Boolean(area.design?.imageUrl && area.design?.id);
              return (
                <div
                  key={index}
                  className={`bg-ink/80 border rounded-2xl p-5 transition-all duration-300 relative ${
                    isFilled
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-[1.5px] uppercase px-2.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                          {language === 'en' ? `Area ${index + 1}` : `Area ${index + 1}`}
                        </span>
                        <span className="text-white text-sm font-bold">
                          {td(getPositionLabel(area.position))}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1">
                        {language === 'en' ? 'Print Dimension:' : 'Dimensi Cetak:'}{' '}
                        <span className="text-white font-medium">{td(getSizeLabel(area.printSize))}</span>
                      </p>
                    </div>

                    <div>
                      {isFilled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check size={12} /> {language === 'en' ? 'Attached' : 'Terpasang'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {language === 'en' ? 'Empty' : 'Belum Ada Desain'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload Box */}
                  <DesignUpload
                    onUploadDesign={(file, url) => handleAreaUpload(file, url, index)}
                    currentDesign={area.design?.imageUrl ? getImageUrl(area.design.imageUrl) : null}
                    isLoading={uploadingAreaIndex === index}
                  />

                  {/* Validation Message */}
                  {!isFullColorSablon && area.design?.imageUrl && area.design.validationMessage && (
                    <div
                      className={`mt-3 p-3 rounded-xl text-xs ${
                        area.design.isValid
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {td(area.design.validationMessage)}
                    </div>
                  )}

                  {/* Active Design Indicator & Quick actions */}
                  {area.design?.imageUrl && (
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {language === 'en' ? 'Artwork ready for printing' : 'Artwork siap cetak'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('mockup')}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {language === 'en' ? 'Preview 3D Mockup' : 'Lihat Mockup 3D'} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Design Guidelines Hint Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Info size={16} />
              <h5 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                {language === 'en' ? 'Artwork Guidelines for Best Quality' : 'Petunjuk File Desain Siap Cetak'}
              </h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-zinc-300">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5">
                <span className="font-semibold text-emerald-400 inline-flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400 shrink-0" />
                  {language === 'en' ? 'Transparent PNG' : 'Latar Transparan'}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {language === 'en'
                    ? 'Recommended PNG with transparent background so no white box prints on shirt.'
                    : 'Disarankan PNG tanpa background agar tidak ikut tercetak kotak putih di kaos.'}
                </p>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5">
                <span className="font-semibold text-blue-400 inline-flex items-center gap-1.5">
                  <ZoomIn size={14} className="text-blue-400 shrink-0" />
                  {language === 'en' ? 'High Resolution' : 'Resolusi Tajam'}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {language === 'en'
                    ? 'Use sharp images (min. 1000px or 300 DPI). Avoid blurry WhatsApp screenshots.'
                    : 'Gunakan gambar tajam (min. 1000px atau 300 DPI). Hindari screenshot buram.'}
                </p>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5">
                <span className="font-semibold text-purple-400 inline-flex items-center gap-1.5">
                  <FileImage size={14} className="text-purple-400 shrink-0" />
                  {language === 'en' ? 'Supported Formats' : 'Format & Ukuran'}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {language === 'en'
                    ? 'PNG, JPG, WebP, & Apple HEIC supported. Max size 10MB per design.'
                    : 'Mendukung PNG, JPG, WebP, dan foto Apple HEIC. Ukuran maksimal 10MB.'}
                </p>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5">
                <span className="font-semibold text-amber-400 inline-flex items-center gap-1.5">
                  <Palette size={14} className="text-amber-400 shrink-0" />
                  {language === 'en' ? 'Print Method' : 'Kesesuaian Sablon'}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isFullColorSablon
                    ? (language === 'en' ? 'DTF/DTG supports unlimited colors, photo gradients, and shading.' : 'DTF/DTG mendukung full color, gradasi foto, dan warna bebas.')
                    : (language === 'en' ? 'Manual screen print recommends solid flat colors (max 4 colors).' : 'Sablon manual disarankan warna solid tanpa gradasi halus (maks. 4 warna).')}
                </p>
              </div>
            </div>
          </div>

          {/* AI Switch Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-purple-600/10 to-transparent border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-primary/5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <Zap size={22} />
              </div>
              <div>
                <h4 className="font-heading text-white text-base font-bold tracking-wide">
                  {language === 'en' ? 'Don’t have a design file ready?' : 'Belum punya file desain siap cetak?'}
                </h4>
                <p className="text-zinc-400 text-xs mt-0.5 max-w-xl">
                  {language === 'en'
                    ? 'Use our AI Designer Consultant to discuss concepts, refine graphics, and generate custom designs automatically.'
                    : 'Gunakan AI Designer Consultant untuk mendiskusikan konsep idemu dan membuat desain kustom instan dengan bantuan AI.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className="btn-gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 cursor-pointer shadow-md shadow-primary/25"
            >
              <Zap size={15} /> {language === 'en' ? 'Create with AI' : 'Buat dengan AI'}
            </button>
          </div>

          {/* History Designs (Quick Pick) */}
          {historyDesigns.length > 0 && (
            <div className="bg-ink/60 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                    {language === 'en' ? 'Pick from Your Design History' : 'Pilih dari Riwayat Desain Anda'}
                  </h4>
                  {historyTotal > 0 && (
                    <span className="text-zinc-500 text-[11px]">
                      ({historyTotal} {language === 'en' ? 'designs' : 'desain'})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {language === 'en' ? 'Click any design to apply to an area' : 'Klik gambar untuk langsung menerapkan ke area'}
                </p>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {historyDesigns.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectHistory(d)}
                    className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10 hover:border-primary/60 hover:ring-2 hover:ring-primary/20 transition-all group bg-black/40 cursor-pointer"
                    title={d.prompt || 'Desain tersimpan'}
                  >
                    <img src={d.imageUrl} alt="History" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-[10px] font-bold bg-primary px-2 py-0.5 rounded-lg shadow">
                        {language === 'en' ? 'Apply' : 'Gunakan'}
                      </span>
                    </div>
                  </button>
                ))}
                {historyLoading && (
                  <div className="shrink-0 w-24 h-24 rounded-xl border border-white/10 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-5 h-5 animate-spin text-gray" />
                  </div>
                )}
              </div>
              {historyHasMore && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => loadHistory(historyPage + 1)}
                    disabled={historyLoading}
                    className="text-xs px-3.5 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:border-primary/50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {language === 'en' ? 'Load More Designs' : 'Muat Lebih Banyak'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI GENERATE */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Target Area Bar & Quota Info */}
          <div className="bg-ink/70 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-white tracking-wide">
                  {language === 'en' ? 'AI Designer Consultant' : 'AI Designer Consultant'}
                </h3>
                <p className="text-zinc-400 text-[11px]">
                  {language === 'en'
                    ? 'Discuss your concept in chat, generate artwork, and apply to order areas'
                    : 'Diskusikan konsep dengan AI, buat artwork otomatis, dan terapkan ke area pesanan'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {printAreas.length > 1 && (
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                  <span className="text-zinc-400">{language === 'en' ? 'Target Area:' : 'Area Tujuan:'}</span>
                  <select
                    value={selectedAreaIndex}
                    onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    {printAreas.map((area, i) => (
                      <option key={i} value={i} className="bg-[#170e1c] text-white">
                        Area {i + 1} ({getPositionLabel(area.position)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {quota && (
                <div className="flex gap-1.5 text-[10px]">
                  <span
                    className={`px-2.5 py-1 rounded-xl border ${
                      quota.generate.unlimited || quota.generate.remaining > 0
                        ? 'border-primary/40 text-primary bg-primary/10 font-medium'
                        : 'border-gray text-gray bg-white/5'
                    }`}
                  >
                    {language === 'en' ? 'Generate: ' : 'Kuota Buat: '}
                    {quota.generate.unlimited
                      ? language === 'en'
                        ? 'Unlimited'
                        : 'Tak terbatas'
                      : `${quota.generate.remaining}/${quota.generate.limit}`}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-xl border ${
                      quota.edit.unlimited || quota.edit.remaining > 0
                        ? 'border-primary/40 text-primary bg-primary/10 font-medium'
                        : 'border-gray text-gray bg-white/5'
                    }`}
                  >
                    {language === 'en' ? 'Edit: ' : 'Kuota Edit: '}
                    {quota.edit.unlimited
                      ? language === 'en'
                        ? 'Unlimited'
                        : 'Tak terbatas'
                      : `${quota.edit.remaining}/${quota.edit.limit}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2-Column AI Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Chat & Quick ideas */}
            <div>
              <div className="mb-4">
                <AiChatPanel
                  messages={messages}
                  chatLoading={chatLoading}
                  onSend={handleSendMessage}
                  onSendImage={handleSendImage}
                  heightClass="h-80"
                />
              </div>

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

              {generating && !readySummary && (
                <div className="flex flex-col items-center py-6 mb-4 bg-ink/60 border border-white/10 rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-white text-xs font-semibold">
                    {language === 'en' ? 'AI is creating your design...' : 'AI sedang membuat artwork pesananmu...'}
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-1">
                    {language === 'en' ? 'This usually takes 10-30 seconds' : 'Memerlukan waktu sekitar 10-30 detik'}
                  </p>
                </div>
              )}

              <label className="text-zinc-300 text-[11px] font-bold tracking-[1px] uppercase mb-2 block">
                {language === 'en' ? 'Quick Prompt Ideas' : 'Ide Cepat'}
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => handleSendMessage(idea)}
                    disabled={chatLoading}
                    className="text-[11px] px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Results, Edit, and Actions */}
            <div className="space-y-5">
              {/* Chat Results */}
              {chatResults.length > 0 && !generating ? (
                <div className="bg-ink/70 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white text-xs font-bold tracking-[1px] uppercase">
                      {language === 'en' ? 'Generated Designs' : 'Hasil Desain AI'}
                    </p>
                    <span className="text-[11px] text-zinc-400">
                      {language === 'en' ? 'Click to apply' : 'Klik untuk terapkan ke pesanan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {chatResults.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectResult(r)}
                        className={`relative aspect-square bg-black/40 border-2 rounded-xl overflow-hidden transition-all group cursor-pointer ${
                          selectedResult?.id === r.id
                            ? 'border-primary ring-2 ring-primary/40 scale-[1.02]'
                            : 'border-white/10 hover:border-primary/50'
                        }`}
                      >
                        <img src={r.imageUrl} alt={`Hasil ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          #{i + 1}
                        </div>
                        {selectedResult?.id === r.id && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                              <Check size={10} /> {language === 'en' ? 'Active' : 'Terpilih'}
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Prompt Edit */}
                  {selectedResult && (selectedResult.type === 'ai_generated' || selectedResult.type === 'uploaded') && (
                    <div className="mt-4 bg-black/30 border border-white/10 rounded-xl p-3">
                      <p className="text-zinc-300 text-[10px] font-bold tracking-[1px] uppercase mb-1.5">
                        {language === 'en' ? 'Edit Selected Design with Prompt' : 'Edit Desain Terpilih dengan Prompt'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditDesign();
                          }}
                          placeholder={
                            language === 'en'
                              ? 'Example: change colors to neon, make vintage style...'
                              : 'Contoh: ubah warna jadi neon, buat style vintage...'
                          }
                          disabled={editing || editExhausted}
                          className="flex-1 bg-ink border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleEditDesign}
                          disabled={editing || !editPrompt.trim() || editExhausted}
                          className="btn-gradient-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                        >
                          {editing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap size={14} />}
                          {editing ? (language === 'en' ? 'Editing...' : 'Mengedit...') : (language === 'en' ? 'Edit' : 'Edit')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick jump to Mockup 3D button */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      {language === 'en' ? 'Want to inspect on 3D t-shirt?' : 'Ingin melihat hasilnya di kaos 3D?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('mockup')}
                      className="btn-glass px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Image size={13} /> {language === 'en' ? 'View 3D Mockup' : 'Lihat di Mockup 3D'} →
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Results Placeholder */
                <div className="bg-ink/50 border border-dashed border-white/15 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                    <Sparkles size={26} />
                  </div>
                  <h4 className="font-heading text-white text-base font-bold">
                    {language === 'en' ? 'Ready to Generate Artwork' : 'Siap Membuat Desain'}
                  </h4>
                  <p className="text-zinc-400 text-xs mt-1.5 max-w-xs">
                    {language === 'en'
                      ? 'Send a prompt or idea in the chat panel. Once ready, click Generate and results will appear here.'
                      : 'Ketik konsep atau ide kaos di panel chat sebelah kiri. AI akan merancang konsep siap render untuk Anda.'}
                  </p>
                </div>
              )}

              {/* Design History on AI Tab */}
              {historyDesigns.length > 0 && (
                <div className="bg-ink/60 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <label className="text-zinc-300 text-[11px] font-bold tracking-[1px] uppercase">
                      {language === 'en' ? 'Recent Designs' : 'Desain Terakhir'}
                    </label>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {historyDesigns.slice(0, 12).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectHistory(d)}
                        className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/10 hover:border-primary/60 hover:ring-2 hover:ring-primary/20 transition-all group bg-black/40 cursor-pointer"
                        title={d.prompt || 'Desain'}
                      >
                        <img src={d.imageUrl} alt="History" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-[9px] font-bold bg-primary px-1.5 py-0.5 rounded">
                            {language === 'en' ? 'Use' : 'Pakai'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
      <div className="flex items-center gap-2.5 sm:gap-4 mt-8 pt-5 sm:pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={prevStep}
          className="btn-glass flex items-center justify-center gap-1.5 py-3 px-4 sm:px-6 min-h-[44px] rounded-xl sm:rounded-2xl text-xs uppercase tracking-wider font-semibold text-gray-300 hover:text-white shrink-0 cursor-pointer"
        >
          <Icon name="arrow-left" size={16} /> <span>{language === 'en' ? 'Back' : 'Kembali'}</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={uploadingAreaIndex !== null}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3 px-4 sm:px-6 min-h-[44px] rounded-xl sm:rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
        >
          {uploadingAreaIndex !== null ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="truncate">{language === 'en' ? 'Uploading Design...' : 'Mengunggah Desain...'}</span>
            </>
          ) : (
            <>
              <span>{language === 'en' ? 'Continue' : 'Lanjut'}</span>
              <Icon name="arrow-right" size={16} className="shrink-0" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
