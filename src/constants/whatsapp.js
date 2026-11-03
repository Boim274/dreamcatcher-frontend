export const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6287877294587';
export const WA_URL = `https://wa.me/${WA_NUMBER}`;

/**
 * Pre-configured contextual message templates
 * Sesuai kebutuhan layanan konveksi & sablon Dreamcatcher
 */
export const WA_TEMPLATES = {
  // 1. Landing Page / Konsultasi Umum (Template Standar Resmi)
  general: `Halo Admin, saya ingin konsultasi mengenai layanan sablon dan konveksi di website ini.

Saya ingin bertanya mengenai:
- Jenis layanan sablon yang tersedia.
- Pilihan bahan dan jenis kaos.
- Harga sablon dan minimum pemesanan.
- Pilihan desain custom.
- Estimasi waktu pengerjaan.

Mohon informasi dan bantuannya. Terima kasih.`,

  // 2. Halaman Produk Kaos (Katalog / Daftar Produk)
  catalog: `Halo Admin, saya ingin bertanya mengenai jenis kaos dan produk di website ini.

Saya ingin konsultasi mengenai:
- Pilihan jenis kaos dan bahan.
- Ketersediaan ukuran dan warna.
- Harga dan minimal pemesanan.

Mohon informasi dan bantuannya. Terima kasih.`,

  // 3. Halaman Sablon (Pricelist / Layanan Sablon)
  sablon: `Halo Admin, saya ingin konsultasi mengenai teknik sablon dan harga di website ini.

Saya ingin bertanya mengenai:
- Teknik sablon yang tersedia (seperti Plastisol dan DTF).
- Pilihan ukuran desain.
- Daftar harga sablon dan estimasi waktu pengerjaan.

Mohon informasi dan bantuannya. Terima kasih.`,

  // 4. Halaman Detail Produk (Disertai Nama Produk)
  productDetail: (productName = '') => {
    const item = productName ? `produk *${productName}*` : 'produk ini';
    return `Halo Admin, saya ingin bertanya mengenai ${item} yang ada di website.

Saya ingin konsultasi mengenai:
- Bahan, ukuran, dan pilihan warna yang tersedia.
- Ketersediaan stok produk.
- Harga dan kemungkinan custom sablon pada produk ini.

Mohon informasi dan bantuannya. Terima kasih.`;
  },

  // 5. Halaman Pemesanan (Checkout / Custom Design / Pilih Model Kaos / Keranjang)
  order: `Halo Admin, saya ingin berkonsultasi mengenai pemesanan di website ini.

Saya ingin bertanya mengenai:
- Proses dan alur pemesanan.
- Jumlah produk dan pilihan desain yang ingin dicetak.
- Total harga dan estimasi waktu pengerjaan.

Mohon informasi dan bantuannya. Terima kasih.`,

  // 6. Panduan Ukuran (Size Chart)
  sizeChart: `Halo Admin, saya ingin konsultasi mengenai panduan ukuran (size chart) kaos di website ini.

Saya ingin bertanya mengenai:
- Pilihan ukuran yang pas dan akurat.
- Ketersediaan ukuran khusus / jumbo.

Mohon informasi dan bantuannya. Terima kasih.`,
};

/**
 * Helper terpusat untuk membangun URL WhatsApp Click to Chat
 * dengan parameter pesan yang ter-URL-encode secara aman dan benar.
 *
 * @param {string} contextOrText - Template key ('general', 'catalog', 'sablon', 'order', 'productDetail', 'sizeChart') atau teks custom langsung.
 * @param {object} [params] - Parameter opsional seperti { productName: '...' }
 * @returns {string} URL WhatsApp siap pakai (https://wa.me/...)
 */
export const getWhatsAppUrl = (contextOrText = 'general', params = {}) => {
  let message = '';

  if (typeof WA_TEMPLATES[contextOrText] === 'function') {
    message = WA_TEMPLATES[contextOrText](params.productName || params.name);
  } else if (typeof WA_TEMPLATES[contextOrText] === 'string') {
    message = WA_TEMPLATES[contextOrText];
  } else if (typeof contextOrText === 'string' && contextOrText.trim().length > 0) {
    message = contextOrText;
  } else {
    message = WA_TEMPLATES.general;
  }

  return `${WA_URL}?text=${encodeURIComponent(message)}`;
};

/**
 * Helper otomatis berbasis route pathname untuk tombol global seperti Floating WhatsApp.
 * Menentukan template yang paling relevan berdasarkan halaman yang sedang dibuka customer.
 *
 * @param {string} pathname - Route pathname (contoh: location.pathname)
 * @param {object} [params] - Parameter tambahan jika ada
 * @returns {string} URL WhatsApp siap pakai
 */
export const getWhatsAppUrlByPath = (pathname = '', params = {}) => {
  if (!pathname || pathname === '/') {
    return getWhatsAppUrl('general', params);
  }

  const p = pathname.toLowerCase();

  // Detail Produk
  if (p.startsWith('/produk/') || p.startsWith('/product/')) {
    return getWhatsAppUrl('productDetail', params);
  }

  // Katalog / Produk Kaos
  if (p.startsWith('/katalog') || p.startsWith('/produk') || p.startsWith('/catalog')) {
    return getWhatsAppUrl('catalog', params);
  }

  // Sablon / Harga
  if (p.startsWith('/harga') || p.startsWith('/pricelist') || p.startsWith('/layanan')) {
    return getWhatsAppUrl('sablon', params);
  }

  // Size Chart
  if (p.startsWith('/size-chart') || p.startsWith('/ukuran')) {
    return getWhatsAppUrl('sizeChart', params);
  }

  // Pemesanan / Custom Design / Keranjang / Checkout
  if (
    p.startsWith('/order') ||
    p.startsWith('/pesan') ||
    p.startsWith('/custom-design') ||
    p.startsWith('/keranjang') ||
    p.startsWith('/cart') ||
    p.startsWith('/pembayaran') ||
    p.startsWith('/checkout')
  ) {
    return getWhatsAppUrl('order', params);
  }

  return getWhatsAppUrl('general', params);
};

// Alias kompatibilitas ke belakang untuk kode lama yang menggunakan waLink
export const waLink = (text) => getWhatsAppUrl(text);
