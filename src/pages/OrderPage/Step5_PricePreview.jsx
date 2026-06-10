import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';
import { formatRupiah } from '../../utils/formatRupiah';

export default function Step5PricePreview() {
  const { selectedService, config, getTotalQuantity, getPriceBreakdown, getSubtotal, getShippingCost, getTotalPrice, getDpAmount, nextStep, prevStep } = useOrderStore();

  if (!selectedService) return null;

  const totalQty = getTotalQuantity();
  const breakdown = getPriceBreakdown();
  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotalPrice();
  const dp = getDpAmount();

  const configSummary = Object.entries(config)
    .filter(([key, val]) => val && key !== 'size')
    .map(([, val]) => val)
    .join(' / ');

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-6">REVIEW HARGA</h2>

      {/* Order Summary */}
      <div className="bg-ink border border-border rounded-xl p-4 mb-6">
        <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Ringkasan Pesanan</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white">
            <span className="text-gray">Layanan</span>
            <span>{selectedService.name}</span>
          </div>
          {configSummary && (
            <div className="flex justify-between text-white">
              <span className="text-gray">Konfigurasi</span>
              <span className="text-right max-w-[60%]">{configSummary}</span>
            </div>
          )}
          <div className="flex justify-between text-white">
            <span className="text-gray">Total Jumlah</span>
            <span>{totalQty} pcs</span>
          </div>
        </div>
      </div>

      {/* Per-Size Breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-ink border border-border rounded-xl p-4 mb-6">
          <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Rincian per Ukuran</p>
          <div className="space-y-2">
            {breakdown.map(({ size, qty, unitPrice, subtotal: sizeSubtotal }) => (
              <div key={size} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold bg-primary/10 px-2 py-0.5 rounded text-xs">{size}</span>
                  <span className="text-gray">{qty} x {formatRupiah(unitPrice)}</span>
                </div>
                <span className="text-primary font-medium">{formatRupiah(sizeSubtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="bg-ink border border-border rounded-xl p-4 mb-6">
        <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Rincian Harga</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white">
            <span className="text-gray">Subtotal ({totalQty} pcs)</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-gray">Ongkir</span>
            <span>{shipping > 0 ? formatRupiah(shipping) : 'Gratis'}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
            <span className="text-white">Total</span>
            <span className="text-primary">{formatRupiah(total)}</span>
          </div>
        </div>
      </div>

      {/* DP Info */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
        <p className="text-white text-[13px]">
          DP 50%: <strong className="text-primary">{formatRupiah(dp)}</strong> — Pelunasan setelah produksi selesai
        </p>
      </div>

      <div className="flex gap-4">
        <button onClick={prevStep}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={nextStep}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
