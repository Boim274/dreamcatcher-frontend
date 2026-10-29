import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import Icon from '../../components/ui/Icon';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import { getCleanConfigItems } from '../../utils/orderReceiptHelper';
import { Sparkles, Layers, CheckCircle2, ShieldCheck, Calculator } from 'lucide-react';

export default function Step5PricePreview() {
  const { td, language } = useLanguageStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const orderStore = useOrderStore();
  const {
    selectedService,
    config,
    printAreas,
    getTotalQuantity,
    getPriceBreakdown,
    getSubtotal,
    getShippingCost,
    getTotalPrice,
    getDpAmount,
    getAreaSurcharge,
    nextStep,
    prevStep,
  } = orderStore;

  if (!selectedService) return null;

  const totalQty = getTotalQuantity();
  const breakdown = getPriceBreakdown();
  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const areaSurcharge = getAreaSurcharge();
  const totalAreaSurcharge = areaSurcharge * totalQty;
  const total = subtotal + totalAreaSurcharge + shipping;
  const dp = Math.round(total * 0.5);

  const options = selectedService.options_config || {};
  const printPositions = options.print_positions || [];
  const printSizes = options.print_sizes || [];
  const getPositionLabel = (value) => printPositions.find((p) => p.value === value)?.label || value;
  const getSizeLabel = (value) => printSizes.find((s) => s.value === value)?.label || value;

  const cleanSpecs = getCleanConfigItems(config, language, td);

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-slate-900/5 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Step Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-6 pb-3.5 sm:pb-4 border-b ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}
      >
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 5 of 6' : 'Langkah 5 dari 6'}
          </span>
          <h2
            className={`font-heading text-xl sm:text-3xl tracking-[1.5px] mt-1.5 sm:mt-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {language === 'en' ? 'REVIEW & PRICE ESTIMATE' : 'REVIEW & ESTIMASI HARGA'}
          </h2>
        </div>
        <div className="text-right">
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            {language === 'en' ? 'Total Production:' : 'Total Produksi:'}
          </span>
          <p className={`text-base font-bold text-primary font-mono`}>{totalQty} pcs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6 items-start">
        {/* LEFT COLUMN: Production Details & Area Previews (5 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Order Specs Card */}
          <div
            className={`rounded-2xl border p-5 ${
              isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-current/10">
              <p className="text-primary text-[11px] tracking-[1.5px] uppercase font-bold flex items-center gap-2">
                <Layers size={14} />
                {language === 'en' ? 'Production Specifications' : 'Spesifikasi Produksi'}
              </p>
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {td(selectedService.name)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {config.shirtModel && (
                <div className="flex justify-between items-center pb-2 border-b border-current/5">
                  <span className="opacity-70">{language === 'en' ? 'Shirt Model:' : 'Model Kaos:'}</span>
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {config.shirtModel}
                  </span>
                </div>
              )}

              {cleanSpecs.map((spec, i) => (
                <div key={i} className="flex justify-between items-center pb-2 border-b border-current/5">
                  <span className="opacity-70">{spec.label}:</span>
                  <span className="font-semibold">{spec.value}</span>
                </div>
              ))}

              <div className="flex justify-between items-center pb-2 border-b border-current/5">
                <span className="opacity-70">{language === 'en' ? 'Total Quantity:' : 'Total Kuantitas:'}</span>
                <span className="font-bold font-mono">{totalQty} pcs</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="opacity-70">{language === 'en' ? 'Print Areas:' : 'Jumlah Area Cetak:'}</span>
                <span className="font-semibold">
                  {printAreas.length} {language === 'en' ? (printAreas.length > 1 ? 'areas' : 'area') : 'area'}
                </span>
              </div>
            </div>
          </div>

          {/* Print Areas Detail */}
          {printAreas.length > 0 && (
            <div
              className={`rounded-2xl border p-5 ${
                isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-4 font-bold flex items-center gap-2">
                <Sparkles size={14} />
                {language === 'en' ? 'Print Area Details & Designs' : 'Detail Area Cetak & Desain'}
              </p>
              <div className="space-y-3.5">
                {printAreas.map((area, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs leading-snug">{td(getPositionLabel(area.position))}</p>
                      <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed font-mono">
                        {language === 'en' ? 'Size: ' : 'Dimensi: '}{getSizeLabel(area.printSize)}
                      </p>
                      {area.design?.imageUrl && (
                        <div className="mt-2.5 w-20 h-20 rounded-xl border border-white/10 bg-black/60 p-1 overflow-hidden shadow-inner flex items-center justify-center">
                          <img
                            src={getImageUrl(area.design.imageUrl)}
                            alt={language === 'en' ? `Design Area ${index + 1}` : `Desain Area ${index + 1}`}
                            className="w-full h-full object-contain hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                    </div>
                    {index === 1 && areaSurcharge > 0 && (
                      <span className="text-primary text-[11px] font-bold bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 shrink-0">
                        +{formatRupiah(areaSurcharge)}/pcs
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarantee / Production Info Notice */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-3">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed text-zinc-300">
              <p className="font-bold text-emerald-400">Garansi Kualitas Sablon Dreamcatcher</p>
              <p className="text-[11px] mt-0.5 opacity-90">
                Pengerjaan rapi, tinta sablon awet dan tahan cuci berkali-kali. Estimasi pengerjaan 3-5 hari kerja setelah DP diterima.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Price Breakdown & Estimate Card */}
        <div className="lg:col-span-6 space-y-6">
          <div
            className={`rounded-2xl border p-5 ${
              isLight ? 'border-slate-200 bg-slate-50/80 shadow-sm' : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-current/10">
              <p className="text-primary text-[11px] tracking-[1.5px] uppercase font-bold flex items-center gap-2">
                <Calculator size={14} />
                {language === 'en' ? 'Price Breakdown & Estimation' : 'Rincian Estimasi Biaya'}
              </p>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {language === 'en' ? 'Estimate' : 'Estimasi'}
              </span>
            </div>

            {/* Table of sizes & prices */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider opacity-60 ${
                    isLight ? 'border-slate-200' : 'border-white/10'
                  }`}>
                    <th className="text-left py-2">{language === 'en' ? 'Size' : 'Ukuran'}</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">{language === 'en' ? 'Unit Price' : 'Harga Satuan'}</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {breakdown.map(({ size, qty, unitPrice, subtotal: sizeSubtotal }) => (
                    <tr key={size} className="py-2">
                      <td className="py-2.5 font-bold">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px]">
                          {size}
                        </span>
                      </td>
                      <td className="text-center py-2.5 font-mono opacity-80">{qty} pcs</td>
                      <td className="text-right py-2.5 font-mono opacity-80">{formatRupiah(unitPrice)}</td>
                      <td className="text-right py-2.5 font-mono font-semibold">{formatRupiah(sizeSubtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Surcharge calculation */}
            <div className={`mt-4 pt-3 border-t-2 border-dashed space-y-2 text-xs font-mono ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="flex justify-between items-center opacity-80">
                <span>{language === 'en' ? `Product Subtotal (${totalQty} pcs):` : `Subtotal Produk (${totalQty} pcs):`}</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              {areaSurcharge > 0 && (
                <div className="flex justify-between items-center text-primary font-semibold">
                  <span>{language === 'en' ? 'Print Area 2 Surcharge:' : 'Surcharge Area Sablon 2:'}</span>
                  <span>+{formatRupiah(totalAreaSurcharge)}</span>
                </div>
              )}
            </div>

            {/* Total Highlight & Down Payment (DP) Card */}
            <div className={`mt-5 p-4 rounded-xl border flex flex-wrap justify-between items-center gap-3 ${
              isLight
                ? 'bg-primary/5 border-primary/20 text-slate-800'
                : 'bg-primary/10 border-primary/25 text-white'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary block">
                  {language === 'en' ? 'Estimated Total' : 'Estimasi Total Biaya'}
                </span>
                <span className="font-heading text-2xl tracking-wide text-primary">
                  {formatRupiah(total)}
                </span>
              </div>
              <div className="text-right p-2.5 rounded-xl bg-primary/15 border border-primary/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  {language === 'en' ? 'Minimum DP (50%):' : 'DP Minimum (50%):'}
                </span>
                <span className="font-mono font-bold text-base text-primary">
                  {formatRupiah(dp)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              {language === 'en'
                ? '* Down payment is confirmed in the next step. Final shipping fee will be adjusted according to delivery location.'
                : '* Pembayaran uang muka (DP) dikonfirmasi pada langkah berikutnya. Ongkir final disesuaikan dengan kurir/alamat pengiriman.'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
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
          onClick={nextStep}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3 px-4 sm:px-6 min-h-[44px] rounded-xl sm:rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25 cursor-pointer text-center"
        >
          <span>{language === 'en' ? 'Continue' : 'Lanjut'}</span>
          <Icon name="arrow-right" size={16} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}
