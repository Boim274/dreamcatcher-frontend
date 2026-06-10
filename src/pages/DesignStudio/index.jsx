import { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ScrollToTop from '../../components/common/ScrollToTop';
import Icon from '../../components/ui/Icon';
import AIGenerateTab from './AIGenerateTab';
import MockupEditorTab from './MockupEditorTab';
import ARTryOnTab from './ARTryOnTab';

const tabs = [
  { id: 'ai', label: 'AI Generate', icon: 'zap', desc: 'Buat desain dengan AI' },
  { id: 'mockup', label: 'Mockup Editor', icon: 'image', desc: 'Preview di kaos' },
  { id: 'ar', label: 'AR Try-On', icon: 'camera', desc: 'Coba pakai AR' },
];

export default function DesignStudioPage() {
  const [activeTab, setActiveTab] = useState('ai');
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');

  const handleDesignReady = (design) => {
    setGeneratedDesign(design);
    setActiveTab('mockup');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="section-tag">&mdash; design studio</div>
            <h1 className="section-title">DESIGN<br/>STUDIO</h1>
            <div className="divider mx-auto"></div>
            <p className="section-sub mx-auto">Buat desain, lihat preview di kaos, atau coba pakai langsung dengan AR</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 sm:gap-3 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-card border border-border text-gray hover:bg-dark hover:text-white'
                }`}>
                <Icon name={tab.icon} size={20} />
                <div className="text-left">
                  <p className="text-[13px] font-semibold">{tab.label}</p>
                  <p className="text-[11px] opacity-70 hidden sm:block">{tab.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'ai' && <AIGenerateTab onDesignReady={handleDesignReady} />}
            {activeTab === 'mockup' && <MockupEditorTab design={generatedDesign} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
            {activeTab === 'ar' && <ARTryOnTab design={generatedDesign} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
