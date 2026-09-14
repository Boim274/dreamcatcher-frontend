import { useOrderStore } from '../../store/orderStore';
import { useLanguageStore } from '../../store/languageStore';
import Icon from '../../components/ui/Icon';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';

export default function Step5PricePreview() {
  const { t, td, language } = useLanguageStore();
  const { selectedService, config, printAreas, getTotalQuantity, getPriceBreakdown, getSubtotal, getShippingCost, getTotalPrice, getDpAmount, getAreaSurcharge, nextStep, prevStep } = useOrderStore();

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

  const configSummary = Object.entries(config)
    .filter(([key, val]) => val && key !== 'size')
    .map(([, val]) => td(val))
    .join(' / ');

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {language === 'en' ? 'Step 5 of 6' : 'Langkah 5 dari 6'}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-[0.5px] mt-2">
            {language === 'en' ? 'REVIEW & PRICE ESTIMATE' : 'REVIEW & ESTIMASI HARGA'}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">{language === 'en' ? 'Total Production:' : 'Total Produksi:'}</span>
          <p className="text-sm font-semibold text-white">{totalQty} pcs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* LEFT COLUMN: Order Summary & Area Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-4 font-bold">
              {language === 'en' ? 'Order Summary' : 'Ringkasan Pesanan'}
            </p>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-gray-400">{language === 'en' ? 'Service:' : 'Layanan:'}</span>
                <span className="text-white font-semibold">{td(selectedService.name)}</span>
              </div>
              {configSummary && (
                <div className="flex justify-between pb-2 border-b border-white/5">
                  <span className="text-gray-400">{language === 'en' ? 'Configuration:' : 'Konfigurasi:'}</span>
                  <span className="text-right text-gray-200 max-w-[65%] font-medium">{configSummary}</span>
                </div>
              )}
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-gray-400">{language === 'en' ? 'Total Quantity:' : 'Total Kuantitas:'}</span>
                <span className="text-white font-bold">{totalQty} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{language === 'en' ? 'Print Areas:' : 'Area Cetak:'}</span>
                <span className="text-white font-semibold">
                  {printAreas.length} {language === 'en' ? (printAreas.length > 1 ? 'areas' : 'area') : 'area'}
                </span>
              </div>
            </div>
          </div>

          {/* Print Areas Detail */}
          {printAreas.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-4 font-bold">
                {language === 'en' ? 'Print Area Details' : 'Detail Area Cetak'}
              </p>
              <div className="space-y-3.5">
                {printAreas.map((area, index) => (
                  <div key={index} className="flex items-start gap-3.5 p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold leading-snug">{td(getPositionLabel(area.position))}</p>
                      <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                        {language === 'en' ? 'Size: ' : 'Ukuran: '}{getSizeLabel(area.printSize)}
                      </p>
                      {area.design?.imageUrl && (
                        <div className="mt-2 w-16 h-16 rounded-xl border border-white/10 bg-black/50 p-1 overflow-hidden">
                          <img
                            src={getImageUrl(area.design.imageUrl)}
                            alt={language === 'en' ? `Design Area ${index + 1}` : `Desain Area ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {index === 1 && areaSurcharge > 0 && (
                      <span className="text-primary text-xs font-semibold bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                        +{formatRupiah(areaSurcharge)}/pcs
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Price Receipt / Breakdown */}
        <div className="space-y-6">
          {/* Per-Size Breakdown */}
          {breakdown.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-4 font-bold">
                {language === 'en' ? 'Breakdown by Size' : 'Rincian per Ukuran'}
              </p>
              <div className="space-y-2 text-xs">
                {breakdown.map(({ size, qty, unitPrice, subtotal: sizeSubtotal }) => (
                  <div key={size} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[11px]">{size}</span>
                      <span className="text-gray-400">{qty} × {formatRupiah(unitPrice)}</span>
                    </div>
                    <span className="text-white font-semibold">{formatRupiah(sizeSubtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown Invoice Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 relative overflow-hidden">
            <p className="text-primary text-[11px] tracking-[1.5px] uppercase mb-4 font-bold">
              {language === 'en' ? 'Cost Breakdown' : 'Rincian Biaya'}
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">{language === 'en' ? `Subtotal (${totalQty} pcs):` : `Subtotal (${totalQty} pcs):`}</span>
                <span className="font-medium text-white">{formatRupiah(subtotal)}</span>
              </div>
              {areaSurcharge > 0 && (
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400">
                    {language === 'en' ? `Area 2 Surcharge (${totalQty} × ${formatRupiah(areaSurcharge)}):` : `Surcharge Area 2 (${totalQty} × ${formatRupiah(areaSurcharge)}):`}
                  </span>
                  <span className="font-medium text-white">{formatRupiah(totalAreaSurcharge)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">{language === 'en' ? 'Shipping:' : 'Ongkir:'}</span>
                <span className="font-medium text-white">{shipping > 0 ? formatRupiah(shipping) : (language === 'en' ? 'Calculated at checkout' : 'Dihitung saat checkout')}</span>
              </div>

              {/* Grand Total */}
              <div className="pt-3 mt-3 border-t border-dashed border-white/15 flex justify-between items-center">
                <span className="text-white font-bold text-sm">{language === 'en' ? 'Total Bill:' : 'Total Tagihan:'}</span>
                <span className="text-white font-heading text-2xl tracking-wide">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>
          </div>

          {/* DP Info Highlight Card */}
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-primary/30">
                50%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm sm:text-base">
                  {language === 'en' ? 'Minimum Down Payment:' : 'DP Minimum:'}{' '}
                  <span className="text-primary font-mono">{formatRupiah(dp)}</span>
                </p>
                <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
                  {language === 'en'
                    ? '50% down payment to start production. Remaining balance paid when order is ready to ship.'
                    : 'Pembayaran DP 50% untuk mulai produksi. Sisa pelunasan dibayar saat pesanan siap kirim.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
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
          onClick={nextStep}
          className="btn-gradient-primary flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/25"
        >
          {language === 'en' ? 'Proceed to Customer Details' : 'Lanjut ke Data Pemesan'} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
