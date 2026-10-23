import { useState, useRef } from 'react';
import { Printer, Copy, Check, X, Sparkles, Scissors, QrCode, Tag, ArrowRight } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getImageUrl } from '../../utils/getImageUrl';
import { useToast } from '../ui/Toast';
import { getCleanConfigItems, formatConfigSummary, generateReceiptPlainText } from '../../utils/orderReceiptHelper';
import { useThemeStore } from '../../store/themeStore';

/**
 * Sawtooth serrated paper edge for receipt top/bottom
 */
function SawtoothEdge({ position = 'bottom', className = '' }) {
  const points = position === 'top'
    ? '0,8 4,0 8,8 12,0 16,8 20,0 24,8 28,0 32,8 36,0 40,8 44,0 48,8 52,0 56,8 60,0 64,8 68,0 72,8 76,0 80,8 84,0 88,8 92,0 96,8 100,0 100,8'
    : '0,0 4,8 8,0 12,8 16,0 20,8 24,0 28,8 32,0 36,8 40,0 44,8 48,0 52,8 56,0 60,8 64,0 68,8 72,0 76,8 80,0 84,8 88,0 92,8 96,0 100,8 100,0';

  return (
    <div className={`w-full overflow-hidden leading-none select-none h-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        className="w-full h-full fill-current"
      >
        <polygon points={points} />
      </svg>
    </div>
  );
}

/**
 * Visual thermal barcode component
 */
function ReceiptBarcode({ value = 'ORD-20261023' }) {
  // Generate a realistic alternating barcode pattern
  const bars = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 4, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1];

  return (
    <div className="flex flex-col items-center justify-center my-3 text-center">
      <div className="flex items-center justify-center h-10 gap-[2px] opacity-85 px-4 overflow-hidden max-w-full">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className="bg-current shrink-0 h-full"
            style={{ width: `${w * 1.5}px` }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] tracking-[3px] uppercase mt-1 opacity-70">
        * {value} *
      </span>
    </div>
  );
}

/**
 * OrderReceipt component supporting both Draft (Step 5, 6) and Real Order (Admin, History)
 */
export default function OrderReceipt({
  order = null,
  orderDraft = null,
  isEstimate = false,
  compact = false,
  showActions = true,
  mode = 'card', // 'card' | 'modal'
  onClose = null,
  language = 'id',
}) {
  const toast = useToast();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const receiptRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Normalize data whether it's coming from database `order` or draft `orderDraft`
  const isDraftMode = Boolean(!order && orderDraft);

  // Receipt Number & Metadata
  const receiptNumber = order?.order_code || orderDraft?.orderCode || `EST-${new Date().getTime().toString().slice(-6)}`;
  const orderDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const customerName = order?.customer_name || orderDraft?.customerData?.name || (language === 'en' ? 'Guest Customer' : 'Pelanggan');
  const customerPhone = order?.phone || orderDraft?.customerData?.phone || '-';
  const deliveryMethod = order?.delivery_method === 'delivery' || orderDraft?.customerData?.deliveryMethod === 'delivery'
    ? (language === 'en' ? 'Courier Delivery' : 'Pengiriman Kurir')
    : (language === 'en' ? 'Store Pickup' : 'Ambil di Toko');
  const customerAddress = order?.address || orderDraft?.customerData?.address || '';

  // Service & Config
  const serviceName = order?.items?.[0]?.service?.name || orderDraft?.selectedService?.name || 'Sablon Kaos';
  const config = orderDraft?.config || {};
  const cleanSpecs = isDraftMode ? getCleanConfigItems(config, language) : [];
  const configSummaryText = isDraftMode ? formatConfigSummary(config, language) : (order?.notes || '');

  // Print Areas
  const printAreas = isDraftMode
    ? (orderDraft?.printAreas || [])
    : (order?.items || []).filter((it) => it.print_area || it.print_size);

  // Breakdown rows
  let breakdownRows = [];
  let totalQty = 0;
  let subtotal = 0;
  let shipping = 0;
  let areaSurcharge = 0;
  let total = 0;
  let dp = 0;
  let remaining = 0;
  let paidAmount = 0;
  let paymentStatus = order?.payment_status || (isEstimate ? 'estimasi' : 'menunggu_pembayaran');

  if (isDraftMode) {
    totalQty = orderDraft.getTotalQuantity ? orderDraft.getTotalQuantity() : (orderDraft.totalQty || 0);
    subtotal = orderDraft.getSubtotal ? orderDraft.getSubtotal() : (orderDraft.subtotal || 0);
    shipping = orderDraft.getShippingCost ? orderDraft.getShippingCost() : (orderDraft.shipping || 0);
    const surchargePerPcs = orderDraft.getAreaSurcharge ? orderDraft.getAreaSurcharge() : (orderDraft.areaSurcharge || 0);
    areaSurcharge = surchargePerPcs * totalQty;
    total = subtotal + areaSurcharge + shipping;
    dp = Math.round(total * 0.5);
    remaining = Math.max(0, total - dp);

    const rawBreakdown = orderDraft.getPriceBreakdown ? orderDraft.getPriceBreakdown() : (orderDraft.breakdown || []);
    breakdownRows = rawBreakdown.map((item) => ({
      size: item.size,
      qty: item.qty,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }));
  } else if (order) {
    subtotal = Number(order.subtotal || 0);
    shipping = Number(order.shipping_cost || 0);
    total = Number(order.total_price || 0);
    paidAmount = Number(order.paid_amount || 0);
    remaining = Number(order.remaining_amount || Math.max(0, total - paidAmount));
    dp = Math.round(total * 0.5);

    totalQty = (order.items || []).reduce((acc, it) => acc + Number(it.quantity || 0), 0);
    breakdownRows = (order.items || []).map((it) => ({
      size: it.size || it.variant_label || 'Standar',
      qty: it.quantity,
      unitPrice: Number(it.unit_price || 0),
      subtotal: Number(it.subtotal || 0),
      productName: it.product_name,
      shirtModel: it.shirt_model,
      sablonType: it.sablon_type,
      color: it.selected_color,
      printArea: it.print_area,
      printSize: it.print_size,
      designImage: it.design?.thumbnail_url || it.design?.image_url,
    }));
  }

  // Print Receipt handler
  const handlePrint = () => {
    window.print();
  };

  // Copy Plain Text handler
  const handleCopy = () => {
    const text = generateReceiptPlainText({
      receiptNumber,
      date: orderDate,
      customerName,
      customerPhone,
      customerAddress,
      deliveryMethod,
      serviceName,
      configSummary: configSummaryText,
      printAreas,
      breakdown: breakdownRows,
      subtotal,
      shipping,
      areaSurcharge,
      totalQty,
      total,
      dp,
      remaining,
      paidAmount,
      paymentStatus,
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(language === 'en' ? 'Receipt copied to clipboard!' : 'Teks struk berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Gagal menyalin struk');
    });
  };

  // Status Stamp styling
  const getStamp = () => {
    if (isEstimate || isDraftMode) {
      return {
        text: language === 'en' ? 'PRICE ESTIMATE' : 'ESTIMASI RESMI',
        color: 'border-primary/50 text-primary bg-primary/5',
      };
    }
    if (paymentStatus === 'paid' || order?.status === 'completed') {
      return {
        text: language === 'en' ? 'PAID IN FULL' : 'LUNAS',
        color: 'border-emerald-500/60 text-emerald-500 bg-emerald-500/10',
      };
    }
    if (paymentStatus === 'dp') {
      return {
        text: 'DP 50% TERVERIFIKASI',
        color: 'border-blue-500/60 text-blue-400 bg-blue-500/10',
      };
    }
    if (paymentStatus === 'waiting_verification') {
      return {
        text: 'MENUNGGU VERIFIKASI',
        color: 'border-amber-500/60 text-amber-400 bg-amber-500/10',
      };
    }
    return {
      text: language === 'en' ? 'ORDER PLACED' : 'PESANAN DITERIMA',
      color: 'border-pink-500/50 text-pink-400 bg-pink-500/5',
    };
  };

  const stamp = getStamp();

  // Receipt Inner Content
  const receiptContent = (
    <div
      ref={receiptRef}
      className={`printable-receipt-wrapper relative transition-all duration-300 font-sans ${
        isLight
          ? 'bg-[#ffffff] text-slate-800 shadow-xl border border-slate-200'
          : 'bg-[#150f1d] text-zinc-100 shadow-2xl border border-white/10'
      } rounded-2xl overflow-hidden mx-auto max-w-md w-full`}
    >
      {/* Sawtooth Top Edge */}
      <SawtoothEdge position="top" className={isLight ? 'text-slate-100' : 'text-[#0d0913]'} />

      {/* Ambient thermal paper background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Receipt Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Store Header */}
        <div className="text-center pb-3 border-b border-dashed border-current/20 relative">
          {/* Stamp watermark */}
          <div className="absolute right-0 top-0 pointer-events-none opacity-85">
            <span
              className={`inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase border-2 rounded-md rotate-[-8deg] shadow-sm ${stamp.color}`}
            >
              {stamp.text}
            </span>
          </div>

          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-heading text-lg">
            DC
          </div>
          <h3 className="font-heading text-xl sm:text-2xl tracking-[1.5px] uppercase leading-tight">
            DREAMCATCHER APPAREL
          </h3>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70 mt-0.5">
            Custom Screen Printing & Apparel Studio
          </p>
          <p className="text-[10px] font-mono opacity-60 mt-0.5">
            Jl. Percetakan Kreatif No. 12 · WA: 0812-3456-7890
          </p>
        </div>

        {/* Receipt Meta (No, Date, Cashier, Customer) */}
        <div className="text-[11px] font-mono space-y-1.5 py-1 border-b border-dashed border-current/20">
          <div className="flex justify-between items-center">
            <span className="opacity-60">{language === 'en' ? 'Receipt No:' : 'No. Struk:'}</span>
            <span className="font-bold text-primary font-mono tracking-wide">{receiptNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">{language === 'en' ? 'Date & Time:' : 'Waktu Transaksi:'}</span>
            <span className="opacity-90">{orderDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">{language === 'en' ? 'Customer:' : 'Pelanggan:'}</span>
            <span className="font-bold truncate max-w-[60%] text-right">{customerName}</span>
          </div>
          {customerPhone && customerPhone !== '-' && (
            <div className="flex justify-between items-center">
              <span className="opacity-60">{language === 'en' ? 'Phone:' : 'No. HP:'}</span>
              <span>{customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="opacity-60">{language === 'en' ? 'Delivery:' : 'Metode:'}</span>
            <span className="font-semibold">{deliveryMethod}</span>
          </div>
        </div>

        {/* Service & Product Details */}
        <div className="space-y-2 py-1">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                {serviceName}
              </span>
              {config.shirtModel && (
                <p className="font-bold text-xs mt-1.5 leading-snug">
                  {config.shirtModel}
                </p>
              )}
            </div>
            <span className="text-xs font-mono font-bold bg-current/5 px-2 py-0.5 rounded">
              {totalQty} pcs
            </span>
          </div>

          {/* Clean Specs Badges */}
          {cleanSpecs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cleanSpecs.map((spec, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-current/5 border border-current/10 opacity-80"
                >
                  <strong className="opacity-60">{spec.label}:</strong> {spec.value}
                </span>
              ))}
            </div>
          )}

          {/* Print Area Mini Chips */}
          {printAreas.length > 0 && (
            <div className="pt-2 border-t border-dotted border-current/15 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                {language === 'en' ? 'Print Areas:' : 'Area Cetak Sablon:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {printAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-current/5 border border-current/10 text-[10px]"
                  >
                    <span className="w-4 h-4 rounded bg-primary/20 text-primary font-bold flex items-center justify-center text-[9px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {area.position || area.print_area || `Area ${idx + 1}`}
                      </p>
                      <p className="opacity-60 font-mono text-[9px]">
                        {area.printSize || area.print_size || '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Per-Size Breakdown Table (Thermal Receipt Style) */}
        <div className="border-t border-dashed border-current/25 pt-2">
          <div className="grid grid-cols-12 text-[10px] font-mono font-bold opacity-60 uppercase pb-1 border-b border-current/15">
            <span className="col-span-3">{language === 'en' ? 'Size' : 'Ukuran'}</span>
            <span className="col-span-3 text-center">Qty</span>
            <span className="col-span-3 text-right">{language === 'en' ? 'Price' : 'Harga'}</span>
            <span className="col-span-3 text-right">Subtotal</span>
          </div>

          <div className="divide-y divide-current/5 text-[11px] font-mono py-1">
            {breakdownRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 py-1.5 items-center">
                <span className="col-span-3 font-bold">{row.size}</span>
                <span className="col-span-3 text-center opacity-80">{row.qty} pcs</span>
                <span className="col-span-3 text-right opacity-80 text-[10px]">{formatRupiah(row.unitPrice)}</span>
                <span className="col-span-3 text-right font-semibold">{formatRupiah(row.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Charges / Surcharges if any */}
        {areaSurcharge > 0 && (
          <div className="flex justify-between items-center text-[11px] font-mono py-1.5 px-2 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold">
            <span>{language === 'en' ? 'Area 2 Surcharge:' : 'Surcharge Area Sablon 2:'}</span>
            <span>+{formatRupiah(areaSurcharge)}</span>
          </div>
        )}

        {/* Cost Calculation & Grand Total */}
        <div className="border-t-2 border-dashed border-current/30 pt-3 space-y-1.5 font-mono text-xs">
          <div className="flex justify-between opacity-80">
            <span>{language === 'en' ? `Subtotal (${totalQty} pcs):` : `Subtotal Produk (${totalQty} pcs):`}</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between opacity-80">
            <span>{language === 'en' ? 'Shipping Cost:' : 'Ongkos Kirim:'}</span>
            <span>{shipping > 0 ? formatRupiah(shipping) : (language === 'en' ? 'Calculated at checkout' : 'Dihitung saat checkout')}</span>
          </div>

          {/* Grand Total Row */}
          <div className="pt-2 mt-2 border-t-2 border-current/30 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                {language === 'en' ? 'Grand Total' : 'Total Tagihan'}
              </span>
              <span className="font-heading text-2xl sm:text-3xl tracking-wide text-primary">
                {formatRupiah(total)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono opacity-70">
                {totalQty} {language === 'en' ? 'items' : 'item pakaian'}
              </span>
            </div>
          </div>
        </div>

        {/* Down Payment (DP 50%) Highlight Box */}
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/10 space-y-1 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {language === 'en' ? '50% Down Payment (DP):' : 'Uang Muka (DP 50%):'}
            </span>
            <span className="font-bold text-primary text-sm sm:text-base font-mono">
              {formatRupiah(dp)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] opacity-75 pt-1 border-t border-primary/20">
            <span>{language === 'en' ? 'Remaining Balance:' : 'Sisa Pelunasan:'}</span>
            <span className="font-semibold">{formatRupiah(remaining)}</span>
          </div>
          {paidAmount > 0 && (
            <div className="flex justify-between items-center text-[11px] text-emerald-400 font-bold pt-0.5">
              <span>{language === 'en' ? 'Already Paid:' : 'Sudah Dibayar:'}</span>
              <span>{formatRupiah(paidAmount)}</span>
            </div>
          )}
        </div>

        {/* Realistic Barcode */}
        <ReceiptBarcode value={receiptNumber} />

        {/* Footer Notes */}
        <div className="text-center pt-2 border-t border-dashed border-current/20 text-[10px] opacity-70 space-y-1">
          <p className="font-semibold uppercase tracking-wider">
            {language === 'en' ? '*** THANK YOU FOR YOUR TRUST ***' : '*** TERIMA KASIH TELAH MEMILIH KAMI ***'}
          </p>
          <p className="italic">
            {isEstimate
              ? (language === 'en' ? 'Keep this receipt as your official production estimate.' : 'Simpan struk ini sebagai referensi estimasi pesanan Anda.')
              : (language === 'en' ? 'Official receipt. Please present when claiming order.' : 'Struk transaksi resmi. Tunjukkan saat pengambilan / konfirmasi.')}
          </p>
          <p className="text-[9px] font-mono opacity-50 pt-1">
            www.dreamcatcher.id · Sablon Berkualitas Premium
          </p>
        </div>
      </div>

      {/* Sawtooth Bottom Edge */}
      <SawtoothEdge position="bottom" className={isLight ? 'text-slate-100' : 'text-[#0d0913]'} />

      {/* Action Buttons Toolbar (No-Print) */}
      {showActions && (
        <div className="no-print p-4 bg-black/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
              title="Cetak Struk ke Printer / PDF"
            >
              <Printer size={14} className="text-primary" />
              <span>{language === 'en' ? 'Print Receipt' : 'Cetak Struk'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
              title="Salin Teks Struk"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? (language === 'en' ? 'Copied!' : 'Tersalin!') : (language === 'en' ? 'Copy Text' : 'Salin Struk')}</span>
            </button>
          </div>

          {mode === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-all cursor-pointer border border-primary/30"
            >
              {language === 'en' ? 'Close' : 'Tutup'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // If Modal Mode: Wrap in Backdrop Modal
  if (mode === 'modal') {
    return (
      <div
        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div className="relative w-full max-w-md my-8">
          {/* Close button in modal top-right */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="no-print absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-zinc-800 border border-white/20 text-white flex items-center justify-center hover:bg-primary transition-colors cursor-pointer shadow-lg"
              title="Tutup Modal"
            >
              <X size={16} />
            </button>
          )}
          {receiptContent}
        </div>
      </div>
    );
  }

  // Default Card Mode
  return receiptContent;
}
