import { useState, lazy, Suspense, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ScrollToTop from '../../components/common/ScrollToTop';
import ScrollReveal from '../../components/ui/ScrollReveal';
import Icon from '../../components/ui/Icon';
import AIGenerateTab from './AIGenerateTab';
import MockupEditorTab from './MockupEditorTab';
import { useAuthStore } from '../../store/authStore';

const ARTryOnTab = lazy(() => import('./ARTryOnTab'));

const tabs = [
  { id: 'ai', label: 'AI Generate', icon: 'zap', desc: 'Buat desain dengan AI' },
  { id: 'mockup', label: 'Mockup Editor', icon: 'image', desc: 'Preview di kaos' },
  { id: 'ar', label: 'AR Try-On', icon: 'camera', desc: 'Coba pakai AR' },
];

const getStudioStorageKey = (userId) =>
  userId != null ? `design-studio-state-u${userId}` : 'design-studio-state-guest';

function readPersistedState(userId) {
  try {
    return JSON.parse(localStorage.getItem(getStudioStorageKey(userId))) || {};
  } catch {
    return {};
  }
}

export default function DesignStudioPage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;

  const [activeTab, setActiveTab] = useState('ai');
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load per-user persisted state whenever the active user changes
  useEffect(() => {
    const saved = readPersistedState(userId);
    setActiveTab(saved.activeTab || 'ai');
    setGeneratedDesign(saved.generatedDesign || null);
    setActiveConversationId(saved.activeConversationId || null);
    if (saved.selectedColor) setSelectedColor(saved.selectedColor);
    setIsLoaded(true);
  }, [userId]);

  // Persist state scoped to the current user
  useEffect(() => {
    if (!isLoaded) return;
    const key = getStudioStorageKey(userId);
    localStorage.setItem(
      key,
      JSON.stringify({ activeTab, generatedDesign, activeConversationId, selectedColor })
    );
  }, [userId, activeTab, generatedDesign, activeConversationId, selectedColor, isLoaded]);

  const handleDesignReady = (design) => {
    setGeneratedDesign(design);
    setActiveTab('mockup');
  };

  const handleDesignChange = (design) => {
    setGeneratedDesign(design);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#120c16] text-white relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-8 sm:py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4 shadow-lg shadow-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Next-Gen AI Workshop &amp; 3D Lab
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide">
                STUDIO DESAIN <span className="text-gradient">AI</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto my-3" />
              <p className="text-white/60 text-xs sm:text-sm mt-3 max-w-lg mx-auto leading-relaxed">
                Wujudkan ide kreatif dalam hitungan detik dengan AI, preview kaos 3D interaktif, atau coba langsung dengan Augmented Reality
              </p>
            </ScrollReveal>
          </div>

          {/* Tab Navigation (Responsive Grid on Mobile & Desktop) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-1.5 sm:gap-3.5 p-3 sm:px-5 sm:py-4 rounded-2xl font-medium transition-all duration-300 border text-center sm:text-left relative overflow-hidden group ${
                    isActive
                      ? 'btn-gradient-primary border-primary/50 shadow-xl shadow-primary/20 scale-[1.01] sm:scale-[1.02]'
                      : 'border-white/10 bg-[#181120]/80 backdrop-blur-md text-white/70 hover:border-primary/30 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'bg-white/20 shadow-inner' : 'bg-white/5 border border-white/5'
                  }`}>
                    <Icon name={tab.icon} size={18} className={isActive ? 'text-white' : 'text-primary'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">{tab.label}</p>
                    <p className={`text-[11px] leading-tight truncate hidden sm:block ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                      {tab.desc}
                    </p>
                  </div>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-t-full shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content - kept mounted per user so switching tabs doesn't wipe out mockup/layers */}
          <div className="animate-fade-in">
            <div className={activeTab === 'ai' ? 'block' : 'hidden'}>
              <AIGenerateTab
                key={`ai-${userId || 'guest'}`}
                onDesignReady={handleDesignReady}
                initialConversationId={activeConversationId}
                onActiveConversationChange={setActiveConversationId}
              />
            </div>

            <div className={activeTab === 'mockup' ? 'block' : 'hidden'}>
              <MockupEditorTab
                key={`mockup-${userId || 'guest'}`}
                userId={userId}
                design={generatedDesign}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                onDesignChange={handleDesignChange}
              />
            </div>

            <div className={activeTab === 'ar' ? 'block' : 'hidden'}>
              <Suspense fallback={<div className="text-center text-gray py-16">Memuat AR Try-On...</div>}>
                <ARTryOnTab
                  key={`ar-${userId || 'guest'}`}
                  userId={userId}
                  isActive={activeTab === 'ar'}
                  design={generatedDesign}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  onDesignChange={handleDesignChange}
                  onExit={() => setActiveTab('mockup')}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

