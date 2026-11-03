import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import ScrollReveal from '../components/ui/ScrollReveal';
import Icon from '../components/ui/Icon';
import { getWhatsAppUrl } from '../constants/whatsapp';
import { Ruler, Sparkles, CheckCircle2, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';

const getSizeCategories = (language = 'id') => [
  {
    id: 'short_sleeve',
    name: language === 'en' ? 'Short Sleeve T-Shirt' : 'Kaos Lengan Pendek',
    badge: language === 'en' ? 'Adult' : 'Dewasa',
    desc: language === 'en' ? '100% Cotton Combed 24s/30s Distro Standard' : 'Katun Combed 30s & 24s Premium Standar Distro',
    headers: language === 'en'
      ? ['Size', 'Chest Width', 'Chest Circ.', 'Body Length', 'Sleeve Length']
      : ['Ukuran', 'Lebar Dada', 'Lingkar Dada', 'Panjang Baju', 'Panjang Lengan'],
    data: [
      { size: 'S', width: '47', chest: '94', length: '68', sleeve: '21' },
      { size: 'M', width: '50', chest: '100', length: '70', sleeve: '22' },
      { size: 'L', width: '53', chest: '106', length: '72', sleeve: '23' },
      { size: 'XL', width: '56', chest: '112', length: '74', sleeve: '24' },
      { size: 'XXL', width: '59', chest: '118', length: '76', sleeve: '25' },
      { size: '3XL', width: '62', chest: '124', length: '78', sleeve: '26' },
    ],
  },
  {
    id: 'long_sleeve',
    name: language === 'en' ? 'Long Sleeve T-Shirt' : 'Kaos Lengan Panjang',
    badge: language === 'en' ? 'Adult' : 'Dewasa',
    desc: language === 'en' ? '100% Cotton Combed 24s/30s Long Sleeve Distro' : 'Katun Combed 30s & 24s Premium Lengan Panjang',
    headers: language === 'en'
      ? ['Size', 'Chest Width', 'Chest Circ.', 'Body Length', 'Sleeve Length']
      : ['Ukuran', 'Lebar Dada', 'Lingkar Dada', 'Panjang Baju', 'Panjang Lengan'],
    data: [
      { size: 'S', width: '47', chest: '94', length: '68', sleeve: '58' },
      { size: 'M', width: '50', chest: '100', length: '70', sleeve: '60' },
      { size: 'L', width: '53', chest: '106', length: '72', sleeve: '62' },
      { size: 'XL', width: '56', chest: '112', length: '74', sleeve: '64' },
      { size: 'XXL', width: '59', chest: '118', length: '76', sleeve: '66' },
      { size: '3XL', width: '62', chest: '124', length: '78', sleeve: '68' },
    ],
  },
  {
    id: 'kids',
    name: language === 'en' ? 'Kids T-Shirt' : 'Kaos Anak',
    badge: language === 'en' ? 'Children' : 'Anak-anak',
    desc: language === 'en' ? 'Combed 30s Soft & Safe for Sensitive Skin' : 'Combed 30s Lembut & Aman untuk Kulit Sensitif',
    headers: language === 'en'
      ? ['Size', 'Est. Age', 'Chest Width', 'Chest Circ.', 'Body Length']
      : ['Ukuran', 'Estimasi Umur', 'Lebar Dada', 'Lingkar Dada', 'Panjang Baju'],
    data: [
      { size: 'XS', age: language === 'en' ? '1 - 2 Years' : '1 - 2 Tahun', width: '31', chest: '62', length: '40' },
      { size: 'S', age: language === 'en' ? '3 - 4 Years' : '3 - 4 Tahun', width: '34', chest: '68', length: '44' },
      { size: 'M', age: language === 'en' ? '5 - 6 Years' : '5 - 6 Tahun', width: '37', chest: '74', length: '48' },
      { size: 'L', age: language === 'en' ? '7 - 8 Years' : '7 - 8 Tahun', width: '40', chest: '80', length: '53' },
      { size: 'XL', age: language === 'en' ? '9 - 10 Years' : '9 - 10 Tahun', width: '43', chest: '86', length: '57' },
    ],
  },
];

const getMeasureGuide = (language = 'id') => [
  { label: language === 'en' ? 'Chest Width' : 'Lebar Dada', desc: language === 'en' ? 'Measure straight across chest from armpit to armpit on a flat surface' : 'Ukur lurus mendatar dari jahitan ketiak kiri ke ketiak kanan baju', icon: 'maximize' },
  { label: language === 'en' ? 'Chest Circumference' : 'Lingkar Dada', desc: language === 'en' ? 'Measure around the fullest part of chest (double the chest width)' : 'Ukur keliling dada terlebar atau dua kali ukuran lebar dada', icon: 'circle' },
  { label: language === 'en' ? 'Body Length' : 'Panjang Baju', desc: language === 'en' ? 'Measure from highest shoulder point (beside collar) straight down to hem' : 'Ukur dari titik bahu tertinggi (samping kerah) lurus ke keliman bawah', icon: 'arrow-down' },
  { label: language === 'en' ? 'Sleeve Length' : 'Panjang Lengan', desc: language === 'en' ? 'Measure from shoulder seam down to sleeve cuff (short or long sleeve)' : 'Ukur dari jahitan pundak sampai ujung lengan (pendek/panjang)', icon: 'arrow-right' },
];

export default function SizeChartPage() {
  const { language } = useLanguageStore();
  const sizeCategories = getSizeCategories(language);
  const measureGuide = getMeasureGuide(language);
  const [activeCategory, setActiveCategory] = useState('short_sleeve');
  
  // Interactive Size Recommender State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitPreference, setFitPreference] = useState('regular'); // slim, regular, loose
  const [calculatedSize, setCalculatedSize] = useState(null);

  const calculateRecommendation = (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) return;

    // BMI calculation & height heuristics for adult t-shirts
    let base = 'M';
    if (w < 52 && h < 165) base = 'S';
    else if (w <= 62 && h <= 170) base = 'M';
    else if (w <= 73 && h <= 176) base = 'L';
    else if (w <= 85 && h <= 182) base = 'XL';
    else if (w <= 98) base = 'XXL';
    else base = '3XL';

    // Adjust based on fit preference
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    let idx = sizes.indexOf(base);
    if (fitPreference === 'loose' && idx < sizes.length - 1) {
      idx += 1;
    } else if (fitPreference === 'slim' && idx > 0) {
      idx -= 1;
    }

    setCalculatedSize(sizes[idx]);
  };

  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  const currentCategoryData = sizeCategories.find((c) => c.id === activeCategory) || sizeCategories[0];

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#120c16] text-white'
    }`}>
      {/* Background Ambient Glows - Explicit Absolute */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />

      <Navbar />

      <main className="flex-1 py-10 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-14 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold tracking-[2px] uppercase mb-4 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {language === 'en' ? 'Precision Garment & Screen Printing Standards' : 'Standar Presisi Sablon & Konveksi'}
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl tracking-wide">
                <span className={isLight ? 'text-slate-900' : 'text-white'}>
                  {language === 'en' ? 'SIZE ' : 'PANDUAN '}
                </span>
                <span className="text-gradient">{language === 'en' ? 'GUIDE' : 'UKURAN'}</span>
              </h1>
              <div className="divider mx-auto my-3 sm:my-4" />
              <p className={`text-xs sm:text-sm max-w-lg mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                {language === 'en'
                  ? 'Accurate standard garment tolerance (±1-2 cm) for your utmost wearing comfort'
                  : 'Toleransi akurat standar konveksi Indonesia (±1-2 cm) untuk kenyamanan pakaian terbaik saat Anda kenakan'}
              </p>
            </ScrollReveal>
          </div>

          {/* Category Tabs */}
          <ScrollReveal direction="up" delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
              {sizeCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 border shadow-sm ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-[1.02]'
                        : isLight
                          ? 'bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-slate-50'
                          : 'bg-white/[0.04] text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                  >
                    <Ruler size={14} className={isActive ? 'text-white' : 'text-primary'} />
                    <span>{cat.name}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isLight
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-white/10 text-gray-400'
                    }`}>
                      {cat.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Size Table Card */}
          <ScrollReveal direction="up" delay={150}>
            <div className={`rounded-2xl sm:rounded-3xl border overflow-hidden mb-12 backdrop-blur-xl shadow-2xl transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-white/[0.02] border-white/10'
            }`}>
              {/* Card Header */}
              <div className={`p-4 sm:p-7 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/[0.01] border-white/10'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <h2 className={`text-base sm:text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {language === 'en' ? 'Size Chart: ' : 'Tabel Ukuran: '}{currentCategoryData.name}
                    </h2>
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {currentCategoryData.badge}
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    {currentCategoryData.desc} • {language === 'en' ? 'All measurements in centimeters (cm)' : 'Semua ukuran dalam centimeter (cm)'}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs self-start sm:self-auto font-medium ${
                  isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {language === 'en' ? 'Sewing Tolerance ±1-2 cm' : 'Toleransi Jahit ±1-2 cm'}
                </span>
              </div>

              {/* Mobile Swipe Hint Banner - prevents cutoff confusion on mobile */}
              <div className={`sm:hidden flex items-center justify-between px-3.5 py-2 border-b text-xs ${
                isLight ? 'bg-amber-50/90 border-amber-200/60 text-amber-900' : 'bg-primary/10 border-white/10 text-primary-200'
              }`}>
                <span className="flex items-center gap-1.5 font-medium">
                  <svg className="w-3.5 h-3.5 text-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8L22 12L18 16" />
                    <path d="M6 16L2 12L6 8" />
                    <path d="M2 12H22" />
                  </svg>
                  <span>{language === 'en' ? 'Swipe sideways to view all measurements' : 'Geser ke samping untuk lihat ukuran lengkap'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isLight ? 'bg-amber-200 text-amber-950' : 'bg-primary/30 text-white'
                }`}>
                  {currentCategoryData.data.length} {language === 'en' ? 'Sizes' : 'Ukuran'}
                </span>
              </div>

              {/* Responsive Table with horizontal scroll & sticky first column */}
              <div className="overflow-x-auto relative w-full scrollbar-thin">
                <table className="w-full text-xs sm:text-sm min-w-[500px] sm:min-w-full border-collapse">
                  <thead>
                    <tr className={`border-b text-center ${
                      isLight ? 'bg-slate-100/80 border-slate-200 text-slate-700' : 'bg-white/[0.04] border-white/10 text-gray-300'
                    }`}>
                      {currentCategoryData.headers.map((h, i) => (
                        <th
                          key={i}
                          className={`py-3 px-3 sm:py-3.5 sm:px-4 font-bold text-[11px] sm:text-xs tracking-wider uppercase whitespace-nowrap text-center ${
                            i === 0
                              ? `sticky left-0 z-20 ${
                                  isLight
                                    ? 'bg-slate-100 border-r border-slate-200 text-primary shadow-[2px_0_5px_rgba(0,0,0,0.04)]'
                                    : 'bg-[#191120] border-r border-white/10 text-primary shadow-[2px_0_8px_rgba(0,0,0,0.3)]'
                                }`
                              : ''
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategoryData.data.map((row, i) => {
                      const isMatch = calculatedSize === row.size;
                      return (
                        <tr
                          key={i}
                          className={`border-b transition-colors ${
                            isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-white/5 hover:bg-primary/5'
                          } ${
                            isMatch ? (isLight ? 'bg-primary/10 border-primary/30' : 'bg-primary/15 border-primary/40') : ''
                          }`}
                        >
                          {/* Sticky First Column for Size Badge */}
                          <td className={`py-3 px-3 sm:py-3.5 sm:px-4 text-center sticky left-0 z-10 whitespace-nowrap ${
                            isLight
                              ? 'bg-white border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.04)]'
                              : 'bg-[#150d1a] border-r border-white/10 shadow-[2px_0_8px_rgba(0,0,0,0.3)]'
                          } ${isMatch ? (isLight ? '!bg-primary/10' : '!bg-[#221028]') : ''}`}>
                            <span
                              className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-xl text-xs sm:text-sm min-w-[42px] transition-transform ${
                                isMatch
                                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/50'
                                  : isLight
                                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                                    : 'bg-white/10 text-white shadow-sm'
                              }`}
                            >
                              {row.size}
                            </span>
                          </td>

                          {/* Estimasi Umur (Khusus Kaos Anak) */}
                          {row.age && (
                            <td className={`py-3 px-3 sm:py-3.5 sm:px-4 text-center text-xs font-semibold whitespace-nowrap ${
                              isLight ? 'text-slate-600' : 'text-gray-300'
                            }`}>
                              <span className={`px-2.5 py-1 rounded-lg border inline-block ${
                                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-gray-200'
                              }`}>
                                {row.age}
                              </span>
                            </td>
                          )}

                          {/* Lebar Dada */}
                          {row.width && (
                            <td className={`py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap font-medium ${
                              isLight ? 'text-slate-800' : 'text-white'
                            }`}>
                              <span className="font-semibold">{row.width}</span> <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>cm</span>
                            </td>
                          )}

                          {/* Lingkar Dada */}
                          {row.chest && (
                            <td className={`py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap font-medium ${
                              isLight ? 'text-slate-800' : 'text-white'
                            }`}>
                              <span className="font-semibold text-primary">{row.chest}</span> <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>cm</span>
                            </td>
                          )}

                          {/* Panjang Baju */}
                          {row.length && (
                            <td className={`py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap font-medium ${
                              isLight ? 'text-slate-800' : 'text-white'
                            }`}>
                              <span className="font-semibold">{row.length}</span> <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>cm</span>
                            </td>
                          )}

                          {/* Panjang Lengan (Khusus Dewasa) */}
                          {row.sleeve && (
                            <td className={`py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap font-medium ${
                              isLight ? 'text-slate-800' : 'text-white'
                            }`}>
                              <span className="font-semibold">{row.sleeve}</span> <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>cm</span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer info */}
              <div className={`p-4 sm:p-5 border-t text-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50/60 border-slate-200 text-slate-500' : 'bg-white/[0.01] border-white/10 text-gray-400'
              }`}>
                <span className="flex items-center gap-1.5 text-center sm:text-left">
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                  <span>{language === 'en' ? 'Tip: Measure a t-shirt you already own that fits well for the best comparison.' : 'Tips: Ukur kaos ternyaman yang Anda miliki saat ini untuk perbandingan ukuran paling tepat.'}</span>
                </span>
                <Link
                  to="/pesan"
                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary-focus font-bold text-xs uppercase tracking-wider shrink-0 transition-colors"
                >
                  {language === 'en' ? 'Start Order Now' : 'Mulai Pesan Sekarang'} <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Interactive Size Recommender */}
          <ScrollReveal direction="up" delay={200}>
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-purple-900/10 to-transparent p-6 sm:p-8 backdrop-blur-xl mb-12 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={13} />
                    {language === 'en' ? 'Size Recommendation Calculator' : 'Kalkulator Rekomendasi Ukuran'}
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl text-white tracking-wide">
                    {language === 'en' ? 'UNSURE ABOUT ' : 'BINGUNG MEMILIH '}<span className="text-gradient">{language === 'en' ? 'SIZING?' : 'UKURAN?'}</span>
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    {language === 'en'
                      ? 'Enter your height and weight to get accurate sizing suggestions'
                      : 'Masukkan tinggi dan berat badan Anda untuk mendapatkan saran ukuran yang pas'}
                  </p>
                </div>

                <form onSubmit={calculateRecommendation} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">{language === 'en' ? 'Height (cm)' : 'Tinggi Badan (cm)'}</label>
                    <input
                      type="number"
                      placeholder={language === 'en' ? 'e.g. 172' : 'Contoh: 172'}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">{language === 'en' ? 'Weight (kg)' : 'Berat Badan (kg)'}</label>
                    <input
                      type="number"
                      placeholder={language === 'en' ? 'e.g. 65' : 'Contoh: 65'}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">{language === 'en' ? 'Fit Style' : 'Model Fitting'}</label>
                    <select
                      value={fitPreference}
                      onChange={(e) => setFitPreference(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#1a1222] border border-white/10 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    >
                      <option value="slim">{language === 'en' ? 'Fitted (Slim)' : 'Pas di Badan (Slim)'}</option>
                      <option value="regular">{language === 'en' ? 'Standard Fit (Regular)' : 'Standar Nyaman (Regular)'}</option>
                      <option value="loose">{language === 'en' ? 'Relaxed / Loose' : 'Longgar / Santai (Loose)'}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-2xl btn-gradient-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                      <Sparkles size={16} /> {language === 'en' ? 'Calculate My Recommended Size' : 'Cek Rekomendasi Ukuran Saya'}
                    </button>
                  </div>
                </form>

                {calculatedSize && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-primary/20 border border-primary/40 text-center animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-heading text-2xl font-bold shadow-lg shadow-primary/30">
                        {calculatedSize}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm">{language === 'en' ? 'Recommended Size: ' : 'Ukuran yang Disarankan: '}{calculatedSize}</p>
                        <p className="text-gray-300 text-xs">
                          {language === 'en'
                            ? `Suitable for height ${height} cm, weight ${weight} kg (${fitPreference === 'loose' ? 'Loose Style' : fitPreference === 'slim' ? 'Slim Style' : 'Regular Style'})`
                            : `Cocok untuk tinggi ${height} cm, berat ${weight} kg (${fitPreference === 'loose' ? 'Gaya Santai' : fitPreference === 'slim' ? 'Gaya Slim' : 'Gaya Regular'})`}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/pesan"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#120c16] font-bold text-xs hover:bg-gray-100 transition-colors shrink-0 shadow"
                    >
                      {language === 'en' ? 'Order Now' : 'Pesan Sekarang'} <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Measurement Guide */}
          <div className="mb-12">
            <ScrollReveal direction="up" delay={200}>
              <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wide mb-6 text-center">
                {language === 'en' ? 'HOW TO ' : 'CARA '}<span className="text-gradient">{language === 'en' ? 'MEASURE' : 'MENGUKUR'}</span>
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {measureGuide.map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={250 + i * 70}>
                  <div className="glass-card-hover rounded-2xl p-5 text-center group h-full flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mx-auto mb-3.5 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-primary/20">
                      <Icon name={item.icon} size={22} />
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                    <p className="text-gray-400 text-xs leading-relaxed mt-auto">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Tips & Custom Consultation */}
          <ScrollReveal direction="up" delay={250}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
                <h3 className="font-heading text-xl sm:text-2xl text-white tracking-wide mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {language === 'en' ? 'Tips for Choosing the Best Fit' : 'Tips Memilih Ukuran Terbaik'}
                </h3>
                <ul className="space-y-3.5 text-gray-300 text-xs sm:text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>{language === 'en' ? 'Use Your Favorite Garment: ' : 'Gunakan Pakaian Favorit: '}</strong>{language === 'en' ? 'Spread your most comfortable t-shirt flat and measure the width armpit-to-armpit.' : 'Bentangkan kaos ternyaman Anda di bidang datar lalu ukur lebar ketiak-ke-ketiak.'}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>{language === 'en' ? 'Shrinkage Tolerance: ' : 'Toleransi Susut: '}</strong>{language === 'en' ? '100% pure combed cotton may experience a normal 1-2% shrinkage after the first wash.' : 'Kain katun combed murni 100% mengalami penyusutan wajar 1-2% setelah pencucian pertama.'}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>{language === 'en' ? 'Between Two Sizes: ' : 'Antara Dua Ukuran: '}</strong>{language === 'en' ? 'If your chest measurement is between two sizes, we recommend sizing up for a more comfortable fit.' : 'Jika lingkar dada Anda berada di ambang batas dua ukuran, kami sarankan memilih ukuran yang lebih besar (upsize).'}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4">
                    <HelpCircle size={20} />
                  </div>
                  <h4 className="font-heading text-lg text-white mb-2">{language === 'en' ? 'Need Plus Size / Custom Cut?' : 'Butuh Ukuran Jumbo / Custom?'}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {language === 'en'
                      ? 'We also cater to special sizes up to 5XL, ribbed long sleeves, or custom tailoring patterns.'
                      : 'Kami juga melayani pesanan ukuran khusus hingga 5XL, lengan panjang karet, atau pola potongan custom.'}
                  </p>
                </div>
                <a
                  href={getWhatsAppUrl('sizeChart')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  <Icon name="message-circle" size={16} /> {language === 'en' ? 'Size Consultation via WhatsApp' : 'Konsultasi Ukuran via WA'}
                </a>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
