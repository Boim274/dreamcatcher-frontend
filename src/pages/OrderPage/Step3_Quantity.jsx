import { useOrderStore } from '../../store/orderStore';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { formatRupiah } from '../../utils/formatRupiah';
import { Link } from 'react-router-dom';

export default function Step3Quantity() {
  const { selectedService, sizeQuantities, setSizeQuantity, getTotalQuantity, getBasePrice, getSizePrice, getPriceBreakdown, nextStep, prevStep } = useOrderStore();
  const toast = useToast();

  if (!selectedService) return null;

  const minOrder = selectedService.minimum_order || 1;
  const options = selectedService.options_config || {};
  const sizes = options.sizes || [];
  const sizePricing = options.size_pricing || {};
  const totalQty = getTotalQuantity();
  const basePrice = getBasePrice();
  const breakdown = getPriceBreakdown();

  const handleNext = () => {
    if (totalQty < minOrder) {
      toast.warning(`Minimum order ${minOrder} pcs (total saat ini: ${totalQty} pcs)`);
      return;
    }
    nextStep();
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <h2 className="font-heading text-[28px] text-white tracking-[1px] mb-2">UKURAN & JUMLAH</h2>
      <p className="text-gray text-sm mb-6">{selectedService.name}</p>

      {/* Config Summary */}
      <div className="bg-ink border border-border rounded-xl p-4 mb-6">
        <p className="text-fire text-[11px] tracking-[1px] uppercase mb-2 font-medium">Konfigurasi</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(useOrderStore.getState().config).map(([key, val]) => (
            val && <span key={key} className="px-2 py-1 bg-primary/10 text-primary text-[11px] rounded">{val}</span>
          ))}
        </div>
      </div>

      {/* Size Guide Link */}
      <div className="flex items-center justify-between mb-4">
        <label className="text-fire text-[12px] font-medium tracking-[1px] uppercase">Pilih Ukuran & Jumlah</label>
        <Link to="/size-chart" target="_blank" className="text-primary text-[11px] hover:underline flex items-center gap-1">
          <Icon name="info" size={12} /> Panduan Ukuran
        </Link>
      </div>

      {/* Size Table */}
      <div className="bg-ink border border-border rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-3 border-b border-border bg-ink/50">
          <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase w-16">Ukuran</span>
          <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase">Harga/pcs</span>
          <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase w-28 text-center">Qty</span>
          <span className="text-fire text-[11px] font-medium tracking-[1px] uppercase w-28 text-right">Subtotal</span>
        </div>

        {/* Size Rows */}
        {sizes.map((size) => {
          const qty = sizeQuantities[size] || 0;
          const surcharge = parseInt(sizePricing[size]) || 0;
          const unitPrice = getSizePrice(size);
          const subtotal = unitPrice * qty;

          return (
            <div key={size} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0">
              <span className="text-white font-semibold text-sm w-16">{size}</span>
              <div className="text-sm">
                <span className="text-white">{formatRupiah(unitPrice)}</span>
                {surcharge > 0 && (
                  <span className="text-gray text-[11px] ml-1">(+{formatRupiah(surcharge)})</span>
                )}
              </div>
              <div className="flex items-center gap-1 w-28 justify-center">
                <button
                  onClick={() => setSizeQuantity(size, qty - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <Icon name="minus" size={14} className="text-white" />
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setSizeQuantity(size, parseInt(e.target.value) || 0)}
                  className="w-12 text-center text-sm font-bold text-primary bg-transparent border-b border-border focus:border-primary focus:outline-none"
                  min={0}
                />
                <button
                  onClick={() => setSizeQuantity(size, qty + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <Icon name="plus" size={14} className="text-white" />
                </button>
              </div>
              <span className={`text-sm font-medium w-28 text-right ${qty > 0 ? 'text-primary' : 'text-gray'}`}>
                {qty > 0 ? formatRupiah(subtotal) : '-'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="bg-ink border border-border rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-white font-semibold">Total</span>
            <span className="text-gray text-sm ml-2">{totalQty} pcs</span>
          </div>
          <span className="text-primary font-bold text-lg">{formatRupiah(breakdown.reduce((sum, i) => sum + i.subtotal, 0))}</span>
        </div>
        {totalQty > 0 && totalQty < minOrder && (
          <p className="text-amber text-sm mt-2">
            Minimum order {minOrder} pcs (kurang {minOrder - totalQty} pcs lagi)
          </p>
        )}
      </div>

      {/* Pricing Info */}
      {selectedService.pricing_type === 'tiered' && selectedService.pricing_config && (
        <div className="bg-ink border border-border rounded-xl p-4 mb-6">
          <p className="text-fire text-[11px] tracking-[1px] uppercase mb-3 font-medium">Info Harga per Tier</p>
          <div className="space-y-2 text-sm">
            {Object.entries(selectedService.pricing_config).map(([type, prices]) => (
              <div key={type}>
                <p className="text-white font-semibold capitalize mb-1">{type}</p>
                {prices.lusin_1 && <p className="text-gray">1 lusin: <span className="text-primary">{formatRupiah(prices.lusin_1)}</span></p>}
                {prices.lusin_2_6 && <p className="text-gray">2-6 lusin: <span className="text-primary">{formatRupiah(prices.lusin_2_6)}</span></p>}
                {prices.satuan && <p className="text-gray">Satuan: <span className="text-primary">{formatRupiah(prices.satuan)}</span></p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={prevStep}
          className="flex items-center gap-2 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary hover:text-white transition-colors text-[13px] uppercase tracking-[1px]">
          <Icon name="arrow-left" size={20} /> Kembali
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 flex-1 justify-center bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors text-[13px] uppercase tracking-[1px]">
          Lanjut <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
}
