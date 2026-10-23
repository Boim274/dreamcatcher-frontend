/**
 * Helper utilities for formatting and cleaning order configuration
 * and generating receipt text for Dreamcatcher Apparel.
 */

// Keys to ignore because they are internal IDs, image URLs, or pricing flags
const IGNORED_CONFIG_KEYS = new Set([
  'shirtModelId',
  'shirtModelImage',
  'shirtModelSurcharge',
  'shirtModelProductId',
  'shirtModelPrice',
  'size',
  'quantity',
  'position',
  'printSize',
  'pricing_unit',
  'base_price',
]);

const CONFIG_KEY_LABELS = {
  shirtModel: { id: 'Model Kaos', en: 'Shirt Model' },
  material: { id: 'Bahan Kain', en: 'Fabric Material' },
  sablonType: { id: 'Jenis Sablon', en: 'Screen Print Type' },
  color: { id: 'Warna Pakaian', en: 'Apparel Color' },
  purchaseMethod: { id: 'Paket Pemesanan', en: 'Order Package' },
  sizeCategory: { id: 'Kategori Ukuran', en: 'Size Category' },
  packageType: { id: 'Tipe Paket', en: 'Package Type' },
};

/**
 * Filter and format raw config object into clean human-readable key-value items
 */
export function getCleanConfigItems(config = {}, language = 'id', td = (v) => v) {
  if (!config || typeof config !== 'object') return [];

  const items = [];

  Object.entries(config).forEach(([key, val]) => {
    if (!val || IGNORED_CONFIG_KEYS.has(key)) return;

    const stringVal = String(val).trim();
    // Ignore internal image paths or URLs
    if (stringVal.startsWith('/') || stringVal.startsWith('http://') || stringVal.startsWith('https://')) {
      return;
    }
    // Ignore pure numeric values that are probably internal IDs
    if (typeof val === 'number' && (key.endsWith('Id') || key.endsWith('id'))) {
      return;
    }

    const labelObj = CONFIG_KEY_LABELS[key];
    const label = labelObj
      ? (language === 'en' ? labelObj.en : labelObj.id)
      : key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

    items.push({
      key,
      label,
      value: td(stringVal),
    });
  });

  return items;
}

/**
 * Return a single clean one-line string of configuration specs (e.g. for notes or receipts)
 * Example: "Kaos Lengan Pendek · Cotton Combed 30s · Plastisol · Warna: Putih"
 */
export function formatConfigSummary(config = {}, language = 'id', td = (v) => v) {
  const cleanItems = getCleanConfigItems(config, language, td);
  if (!cleanItems.length) return '';

  return cleanItems.map((item) => {
    if (item.key === 'shirtModel' || item.key === 'material' || item.key === 'sablonType') {
      return item.value;
    }
    return `${item.label}: ${item.value}`;
  }).join(' · ');
}

/**
 * Generates an authentic plain-text receipt (for clipboard copy / WhatsApp sharing)
 */
export function generateReceiptPlainText({
  storeName = 'DREAMCATCHER CUSTOM APPAREL',
  storeTagline = 'Screen Printing & Apparel Workshop',
  receiptNumber = 'EST-DRAFT',
  date = new Date().toLocaleString('id-ID'),
  customerName = 'Pelanggan',
  customerPhone = '-',
  customerAddress = '-',
  deliveryMethod = 'Ambil di Toko',
  serviceName = 'Sablon Kaos',
  configSummary = '',
  printAreas = [],
  breakdown = [],
  subtotal = 0,
  shipping = 0,
  areaSurcharge = 0,
  totalQty = 0,
  total = 0,
  dp = 0,
  remaining = 0,
  paidAmount = 0,
  paymentStatus = 'draft',
}) {
  const pad = (str, len) => String(str).padEnd(len, ' ');
  const padNum = (num, len) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`.padStart(len, ' ');

  const lines = [
    '=========================================',
    `      ${storeName.toUpperCase()}      `,
    `       ${storeTagline}       `,
    '   Jl. Percetakan Kreatif · WA: 0812-3456-7890   ',
    '=========================================',
    `No. Struk  : ${receiptNumber}`,
    `Tanggal    : ${date}`,
    `Pelanggan  : ${customerName}`,
    `No. Kontak : ${customerPhone}`,
    `Pengiriman : ${deliveryMethod}`,
  ];

  if (customerAddress && customerAddress !== '-') {
    lines.push(`Alamat     : ${customerAddress}`);
  }

  lines.push('-----------------------------------------');
  lines.push(`LAYANAN    : ${serviceName}`);
  if (configSummary) {
    lines.push(`SPESIFIKASI: ${configSummary}`);
  }

  if (printAreas && printAreas.length > 0) {
    printAreas.forEach((area, i) => {
      lines.push(`Area ${i + 1}     : ${area.position || area.print_area || 'Standar'} (${area.printSize || area.print_size || '-'})`);
    });
  }

  lines.push('-----------------------------------------');
  lines.push('UKURAN      QTY       HARGA          TOTAL');
  lines.push('-----------------------------------------');

  if (breakdown && breakdown.length > 0) {
    breakdown.forEach((item) => {
      const sizeLabel = pad(item.size || item.variant_label || 'All', 8);
      const qtyLabel = pad(`${item.qty || item.quantity || 1} pcs`, 8);
      const priceLabel = padNum(item.unitPrice || item.unit_price || 0, 11);
      const subtotalLabel = padNum(item.subtotal || 0, 12);
      lines.push(`${sizeLabel} ${qtyLabel} ${priceLabel} ${subtotalLabel}`);
    });
  }

  if (areaSurcharge > 0) {
    lines.push(`Surcharge Area Tambahan : ${padNum(areaSurcharge, 14)}`);
  }

  lines.push('-----------------------------------------');
  lines.push(`TOTAL KUANTITAS : ${totalQty} pcs`);
  lines.push(`SUBTOTAL BIAYA  : ${padNum(subtotal, 23)}`);
  lines.push(`ONGKOS KIRIM    : ${shipping > 0 ? padNum(shipping, 23) : '   Disesuaikan/Checkout'}`);
  lines.push('=========================================');
  lines.push(`TOTAL TAGIHAN   : ${padNum(total, 23)}`);
  lines.push('=========================================');
  lines.push(`DP MINIMUM (50%): ${padNum(dp, 23)}`);
  lines.push(`SISA PELUNASAN  : ${padNum(remaining > 0 ? remaining : Math.max(0, total - dp), 23)}`);

  if (paidAmount > 0) {
    lines.push(`SUDAH TERBAYAR  : ${padNum(paidAmount, 23)}`);
  }

  lines.push('-----------------------------------------');
  lines.push(`STATUS PEMBAYARAN: ${paymentStatus.toUpperCase()}`);
  lines.push('-----------------------------------------');
  lines.push('  TERIMA KASIH ATAS KEPERCAYAAN ANDA!   ');
  lines.push('Simpan struk ini sebagai bukti transaksi.');
  lines.push('=========================================');

  return lines.join('\n');
}
