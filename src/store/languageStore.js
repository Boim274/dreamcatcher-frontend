import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const translations = {
  id: {
    // Navigation
    nav: {
      home: 'Beranda',
      services: 'Layanan',
      products: 'Produk',
      designStudio: 'Studio Desain',
      pricelist: 'Harga',
      sizeChart: 'Size Chart',
      portfolio: 'Portofolio',
      about: 'Tentang Kami',
      contact: 'Hubungi Kami',
      myOrders: 'Pesanan Saya',
      orderHistory: 'Histori Pesanan',
      myProfile: 'Profil Saya',
      login: 'Masuk',
      register: 'Daftar',
      logout: 'Keluar',
      account: 'Akun Masuk',
      adminPanel: 'Panel Admin',
      cart: 'Keranjang',
      orderNow: 'Pesan Sekarang',
    },
    // Common / Actions
    common: {
      save: 'Simpan',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Ubah',
      close: 'Tutup',
      loading: 'Memuat...',
      saving: 'Menyimpan...',
      success: 'Berhasil',
      error: 'Terjadi Kesalahan',
      search: 'Cari...',
      confirm: 'Konfirmasi',
      yes: 'Ya',
      no: 'Tidak',
      back: 'Kembali',
      next: 'Lanjutkan',
      apply: 'Terapkan',
      reset: 'Reset',
      detail: 'Detail',
      seeDetail: 'Lihat Detail',
      orderNow: 'Pesan Sekarang',
      addToCart: 'Tambah ke Keranjang',
      buyNow: 'Beli Sekarang',
      minOrder: 'Min. Order',
      startingPrice: 'Harga Mulai',
      perUnit: 'per pcs',
      all: 'Semua',
      status: 'Status',
      actions: 'Aksi',
      date: 'Tanggal',
      total: 'Total',
      quantity: 'Jumlah',
      subtotal: 'Subtotal',
      discount: 'Diskon',
      shipping: 'Pengiriman',
      notes: 'Catatan',
      empty: 'Tidak ada data',
      select: 'Pilih',
      viewFull: 'Lihat Ukuran Penuh',
      download: 'Unduh',
      upload: 'Unggah',
      copy: 'Salin',
      copied: 'Tersalin!',
      required: 'Wajib diisi',
      optional: 'Opsional',
    },
    // Theme & Language
    theme: {
      title: 'Tema Tampilan',
      dark: 'Tema Gelap',
      light: 'Tema Terang',
      switchToDark: 'Beralih ke Tema Gelap',
      switchToLight: 'Beralih ke Tema Terang',
    },
    lang: {
      title: 'Bahasa',
      id: 'Bahasa Indonesia',
      en: 'English',
      shortId: 'ID',
      shortEn: 'EN',
      selectLang: 'Pilih Bahasa',
    },
    // Profile
    profile: {
      title: 'Profil Pengguna',
      infoTab: 'Informasi Akun',
      securityTab: 'Keamanan Sandi',
      quotaTab: 'Kuota AI Studio',
      preferencesTab: 'Pengaturan & Tampilan',
      fullName: 'Nama Lengkap',
      email: 'Email',
      phone: 'No. WhatsApp / HP',
      address: 'Alamat Pengiriman',
      saveChanges: 'Simpan Perubahan',
      changePhoto: 'Ganti Foto',
      deletePhoto: 'Hapus Foto',
      currentPassword: 'Password Saat Ini',
      newPassword: 'Password Baru',
      confirmPassword: 'Konfirmasi Password Baru',
      changePassword: 'Ubah Password',
      aiGenerateLimit: 'Limit Generate AI',
      aiEditLimit: 'Limit Edit AI',
      remaining: 'Tersisa',
      used: 'Terpakai',
      unlimited: 'Tanpa Batas',
      themeHeading: 'Pilihan Tema Tampilan',
      themeDesc: 'Sesuaikan kenyamanan visual mata Anda saat menjelajah.',
      langHeading: 'Pilihan Bahasa',
      langDesc: 'Pilih bahasa antarmuka dan konten yang Anda inginkan.',
    },
    // Footer
    footer: {
      aboutText: 'Platform konveksi & sablon kaos custom berbasis teknologi AI modern. Mulai dari Kaos, Hoodie, Polo, hingga Jersey dengan kualitas standar distro terbaik.',
      workshopActive: 'Workshop Aktif Setiap Hari',
      navTitle: 'NAVIGASI',
      contactTitle: 'KONTAK & ALAMAT',
      opTitle: 'OPERASIONAL',
      opDays: 'Senin–Sabtu: 08.00–18.00 WIB',
      opSunday: 'Minggu: Tutup (Konsultasi Online Aktif)',
      copyright: 'Hak cipta dilindungi undang-undang.',
      aboutUs: 'Tentang Kami',
      pricelist: 'Pricelist',
      sizeChart: 'Panduan Ukuran',
    },
    // Landing Page
    hero: {
      tag: 'AI-POWERED CUSTOM APPAREL',
      title1: 'SABLON KAOS CUSTOM',
      title2: 'DENGAN KEKUATAN AI',
      subtitle: 'Wujudkan kaos, hoodie, dan jersey impianmu dengan generator desain AI tercanggih, simulasi 3D interaktif, serta kualitas sablon standar distro nomor satu.',
      ctaStudio: 'Coba AI Design Studio',
      ctaCatalog: 'Lihat Layanan Sablon',
      stat1: 'Puas & Repeat Order',
      stat2: 'Pilihan Sablon & Kain',
      stat3: 'Artwork Dihasilkan',
      stat4: 'Garansi Cetak',
    },
    steps: {
      badge: 'Praktis & Cepat',
      title: 'CARA PEMESANAN',
      subtitle: '5 langkah mudah dari ide desain hingga produk sablon jadi tiba di depan pintu rumah Anda.',
      step1Title: 'Pilih Layanan',
      step1Desc: 'Tentukan produk (Kaos, Hoodie, Jersey) dan teknik sablon (DTF, Plastisol, Bordir).',
      step2Title: 'Atur Konfigurasi',
      step2Desc: 'Pilih jenis bahan katun, warna kain, dan tentukan ukuran posisi sablon.',
      step3Title: 'Desain / AI Generator',
      step3Desc: 'Unggah desain artwork milik Anda sendiri atau ciptakan langsung bersama asisten AI.',
      step4Title: 'Checkout & DP',
      step4Desc: 'Pilih opsi pembayaran fleksibel: DP 50% atau lunas melalui transfer / QRIS.',
      step5Title: 'Produksi & Kirim',
      step5Desc: 'Pesanan diproduksi dengan standar kontrol mutu ketat dan dikirim cepat ke alamat Anda.',
      phasePrefix: 'Tahap',
    },
    aiSpotlight: {
      badge: 'Fitur Unggulan Eksklusif',
      title: 'DESAIN SABLON OTOMATIS DENGAN AI',
      desc: 'Belum punya file desain? Tidak masalah! Chat dengan AI Designer kami, masukkan konsep ide kaos Anda, dan AI akan membuatkan artwork siap sablon resolusi tinggi, lengkap dengan simulasi 3D Mockup dan AR Try-On di tubuh Anda.',
      feat1: 'Generate Artwork Seketika',
      feat2: '3D Real-Time Mockup',
      feat3: 'AR Virtual Camera',
      cta: 'Buka AI Studio Gratis',
    },
    portfolio: {
      badge: 'Karya Terbaik',
      title: 'HASIL PORTOFOLIO',
      subtitle: 'Bukti kualitas nyata sablon DTF, plastisol, dan bordir yang telah dipercaya oleh berbagai komunitas dan brand.',
      viewAll: 'Lihat Semua Portofolio',
    },
    testimonials: {
      badge: 'Kepuasan Pelanggan',
      title: 'KATA MEREKA',
      subtitle: 'Ulasan jujur dari pelanggan setia Dreamcatcher tentang kualitas sablon presisi, bahan premium, dan ketepatan waktu kami.',
      verifiedReviews: '500+ Ulasan Terverifikasi',
    },
    faq: {
      badge: 'Pusat Bantuan & Pertanyaan',
      title: 'FREQUENTLY ASKED',
      titleHighlight: 'QUESTIONS',
      subtitle: 'Jawaban lengkap, jelas, dan transparan seputar proses sablon, batas minimal order, generator AI, garansi retur, hingga pengiriman.',
      searchPlaceholder: 'Cari pertanyaan sablon, DP, minimal order, AI...',
      emptyTitle: 'Pertanyaan Tidak Ditemukan',
      emptyDesc: 'Tidak ada FAQ yang cocok dengan kata kunci pencarian.',
      resetBtn: 'Reset Filter Pencarian',
      helpTitle: 'Butuh Bantuan atau Custom Order Khusus?',
      helpLive: 'Live CS',
      helpDesc: 'Konsultasikan detail bahan, sampel ukuran, atau penawaran harga khusus bersama CS kami 24/7.',
      chatBtn: 'Chat Customer Support',
      tabs: {
        all: 'Semua Pertanyaan',
        order: 'Pemesanan',
        technique: 'Teknik Sablon',
        designAi: 'Desain & AI',
        payment: 'Pembayaran',
        shipping: 'Pengiriman',
        warranty: 'Garansi & QC',
        discount: 'Diskon & Promo',
      },
    },
    cta: {
      title: 'SIAP MEMBUAT KAOS IMPIAN ANDA?',
      subtitle: 'Dapatkan hasil cetak presisi, bahan katun adem, dan pelayanan cepat bersama Dreamcatcher Studio.',
      orderBtn: 'Mulai Buat Pesanan',
      waBtn: 'Konsultasi WhatsApp',
    },
    // Catalog & Services
    catalog: {
      badge: 'Katalog Layanan & Konveksi Resmi',
      title: 'LAYANAN',
      titleHighlight: 'KAMI',
      subtitle: 'Pilihan lengkap untuk kebutuhan sablon, bordir komputer, DTF High Definition, dan konveksi garment premium dengan garansi presisi 100%',
      searchPlaceholder: 'Cari jenis sablon / konveksi...',
      allTab: 'Semua Layanan',
      tieredTab: 'Grosir Tiered',
      flatTab: 'Satuan & Merchandise',
      priceStarts: 'Harga Mulai',
      orderNow: 'Pesan Sekarang',
      viewDetail: 'Lihat Detail & Pricelist',
      emptyTitle: 'Layanan Tidak Ditemukan',
      emptyDesc: 'Coba gunakan kata kunci pencarian lain atau pilih tab kategori yang berbeda.',
      consultTitle: 'Butuh Konsultasi Kebutuhan Sablon Custom?',
      consultDesc: 'Diskusikan kebutuhan seragam instansi, kaos komunitas, atau merch distro langsung dengan tim spesialis konveksi kami.',
      consultBtn: 'Chat WhatsApp Sekarang',
      pricingTypeTiered: 'Harga Grosir',
      pricingTypeFlat: 'Harga Tetap',
    },
    // Product List & Detail
    products: {
      badge: 'Katalog Resmi',
      title: 'KATALOG PRODUK',
      subtitle: 'Produk eksklusif Dreamcatcher — kaos polos premium, apparel, dan merchandise sablon',
      searchPlaceholder: 'Cari produk...',
      allCategories: 'Semua Kategori',
      outOfStock: 'Stok Habis',
      inStock: 'Stok Tersedia',
      viewProduct: 'Lihat Detail',
      emptyTitle: 'Produk Tidak Ditemukan',
      emptyDesc: 'Coba ubah kata kunci atau pilih kategori lain.',
      resetFilter: 'Reset Filter',
      prevPage: 'Sebelumnya',
      nextPage: 'Selanjutnya',
      pageInfo: 'Halaman {current} dari {total}',
    },
    productDetail: {
      backToCatalog: 'Kembali ke Katalog',
      categoryPrefix: 'Kategori',
      selectColor: 'Pilih Warna Kain',
      selectSize: 'Pilih Ukuran',
      stockLeft: 'Sisa {count} pcs',
      quantity: 'Kuantitas',
      addToCart: 'Tambah ke Keranjang',
      orderDirect: 'Pesan Sablon Custom Produk Ini',
      descTab: 'Deskripsi Produk',
      specTab: 'Spesifikasi Kain',
      careTab: 'Petunjuk Perawatan',
      reviewsTab: 'Ulasan Pembeli',
    },
    // Cart
    cart: {
      title: 'Keranjang Belanja',
      subtitle: 'Periksa kembali pesanan kaos dan apparel kustom Anda sebelum checkout.',
      emptyTitle: 'Keranjang Belanja Kosong',
      emptyDesc: 'Belum ada produk atau pesanan sablon yang ditambahkan ke keranjang.',
      startShopping: 'Mulai Belanja Produk',
      orderCustom: 'Buat Pesanan Sablon',
      summaryTitle: 'Ringkasan Belanja',
      totalItems: 'Total Item',
      checkoutBtn: 'Lanjut ke Checkout',
      confirmDelete: 'Hapus item ini dari keranjang belanja?',
    },
    // Order Page (6 Steps)
    order: {
      title: 'Formulir Pemesanan Sablon',
      step1: 'Pilih Layanan',
      step2: 'Konfigurasi Produk',
      step3: 'Area Cetak',
      step4: 'Desain Artwork',
      step5: 'Estimasi Biaya',
      step6: 'Checkout & DP',
      serviceDesc: 'Pilih produk konveksi atau teknik sablon yang ingin Anda buat.',
      configDesc: 'Tentukan jenis bahan katun, warna kain, dan rincian ukuran kaos.',
      printAreaDesc: 'Pilih posisi sablon, ukuran dimensi, dan teknik cetak.',
      designDesc: 'Unggah file desain sendiri atau generate bersama AI Assistant.',
      previewDesc: 'Periksa rincian biaya, diskon kuantitas, dan estimasi waktu selesai.',
      checkoutDesc: 'Isi alamat pengiriman dan pilih metode pembayaran DP 50% atau Lunas.',
      fabricColor: 'Warna Kain',
      fabricType: 'Bahan Kain',
      totalPcs: 'Total Pesanan',
      placeOrderBtn: 'Kirim & Proses Pesanan',
    },
    // Payment Page
    payment: {
      title: 'Pembayaran Pesanan',
      orderCode: 'Kode Pesanan',
      totalBill: 'Total Tagihan',
      minPayment: 'Minimum Pembayaran (DP 50%)',
      bankTransfer: 'Transfer Bank Manual',
      qrisPayment: 'QRIS (Gopay, OVO, ShopeePay, Dana)',
      instructions: 'Instruksi Pembayaran',
      uploadProof: 'Unggah Bukti Transfer',
      uploadSuccess: 'Bukti transfer berhasil dikirim. Admin akan segera memverifikasi.',
      verifyNotice: 'Verifikasi pembayaran biasanya membutuhkan waktu 5-15 menit pada jam kerja.',
      statusPending: 'Menunggu Pembayaran',
      statusVerified: 'Pembayaran Terverifikasi',
    },
    // My Orders & History
    myOrders: {
      title: 'Pesanan Saya',
      subtitle: 'Pantau status pengerjaan, pembayaran, dan pelacakan paket secara real-time.',
      historyTitle: 'Histori Pesanan',
      searchPlaceholder: 'Cari kode pesanan / produk...',
      tabAll: 'Semua',
      tabWaitingPayment: 'Menunggu Pembayaran',
      tabProcessing: 'Dalam Produksi',
      tabShipped: 'Dikirim',
      tabCompleted: 'Selesai',
      tabCancelled: 'Dibatalkan',
      orderDetail: 'Rincian Pesanan',
      trackOrder: 'Lacak Status',
      downloadInvoice: 'Unduh Invoice',
      cancelOrder: 'Batalkan Pesanan',
      rateOrder: 'Beri Ulasan',
    },
    // Design Studio
    designStudio: {
      title: 'AI Design Studio & Mockup 3D',
      tabAi: 'AI Generator',
      tabMockup: 'Mockup Editor 3D',
      tabAr: 'AR Virtual Try-On',
      promptPlaceholder: 'Ketik konsep desain kaosmu... (misal: ilustrasi naga cyberpunk neon)',
      generateBtn: 'Generate Gambar',
      shirtColor: 'Warna Kaos',
      exportMockup: 'Unduh Mockup',
      saveDesign: 'Gunakan Desain Ini',
      conceptsTitle: 'Rekomendasi Konsep Populer',
    },
    // Pricelist & Size Chart & About
    pricelist: {
      badge: 'Daftar Harga Resmi',
      title: 'PRICELIST LAYANAN',
      subtitle: 'Transparansi harga cetak sablon, bordir, dan konveksi garment terbaik di Dreamcatcher Studio.',
    },
    sizeChart: {
      badge: 'Standar Internasional',
      title: 'PANDUAN UKURAN (SIZE CHART)',
      subtitle: 'Pastikan ukuran kaos dan hoodie Anda pas sebelum proses sablon dimulai.',
      width: 'Lebar Dada (cm)',
      length: 'Panjang Badan (cm)',
      tolerance: 'Toleransi ukuran jahitan ±1 sampai 2 cm.',
    },
    about: {
      badge: 'Profil Studio',
      title: 'TENTANG DREAMCATCHER',
      subtitle: 'Pelopor konveksi modern yang memadukan keahlian sablon presisi dengan inovasi kecerdasan buatan.',
    },
    // Auth Modal
    auth: {
      loginTitle: 'Masuk ke Akun',
      registerTitle: 'Buat Akun Baru',
      loginSubtitle: 'Kelola pesanan kustom dan nikmati fitur AI Studio tanpa batas.',
      registerSubtitle: 'Bergabung sekarang untuk mulai mendesain & pesan sablon impian.',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      nameLabel: 'Nama Lengkap',
      phoneLabel: 'Nomor WhatsApp',
      loginBtn: 'Masuk Sekarang',
      registerBtn: 'Daftar Sekarang',
      noAccount: 'Belum punya akun?',
      haveAccount: 'Sudah punya akun?',
      registerLink: 'Daftar di sini',
      loginLink: 'Masuk di sini',
      forgotPassword: 'Lupa Password?',
    },
    // Notifications Dropdown
    notifications: {
      title: 'Notifikasi Pesanan',
      markAll: 'Tandai Semua Dibaca',
      empty: 'Belum Ada Notifikasi',
      tabAll: 'Semua',
      tabCompleted: 'Selesai',
      tabPayment: 'Pembayaran',
      tabProcess: 'Produksi',
      viewOrders: 'Buka Pesanan Saya',
    },
    // Status Labels
    status: {
      pending: 'Pending',
      waiting_payment: 'Menunggu Pembayaran',
      waiting_verification: 'Menunggu Verifikasi',
      ready_to_process: 'Siap Diproses',
      processing: 'Sedang Diproses',
      ready_for_pickup: 'Siap Diambil / Dikirim',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      cancel_requested: 'Menunggu Pembatalan',
      paid: 'Lunas',
      dp: 'DP Terverifikasi',
      rejected: 'Ditolak',
    },
    // Alerts
    alerts: {
      logoutConfirmTitle: 'Konfirmasi Keluar',
      logoutConfirmMsg: 'Apakah Anda yakin ingin keluar dari akun Anda?',
      logoutSuccess: 'Berhasil logout. Sampai jumpa kembali!',
      themeSwitchedDark: 'Tema diubah ke Mode Gelap',
      themeSwitchedLight: 'Tema diubah ke Mode Terang',
      langSwitched: 'Bahasa diubah ke Bahasa Indonesia',
      addedToCart: 'Berhasil ditambahkan ke keranjang!',
      orderSuccess: 'Pesanan berhasil dibuat!',
    },
  },
  en: {
    // Navigation
    nav: {
      home: 'Home',
      services: 'Services',
      products: 'Products',
      designStudio: 'Design Studio',
      pricelist: 'Pricelist',
      sizeChart: 'Size Chart',
      portfolio: 'Portfolio',
      about: 'About Us',
      contact: 'Contact',
      myOrders: 'My Orders',
      orderHistory: 'Order History',
      myProfile: 'My Profile',
      login: 'Log In',
      register: 'Sign Up',
      logout: 'Log Out',
      account: 'Active Account',
      adminPanel: 'Admin Panel',
      cart: 'Cart',
      orderNow: 'Order Now',
    },
    // Common / Actions
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      loading: 'Loading...',
      saving: 'Saving...',
      success: 'Success',
      error: 'An Error Occurred',
      search: 'Search...',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      back: 'Back',
      next: 'Continue',
      apply: 'Apply',
      reset: 'Reset',
      detail: 'Details',
      seeDetail: 'View Details',
      orderNow: 'Order Now',
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      minOrder: 'Min. Order',
      startingPrice: 'Starting From',
      perUnit: 'per pcs',
      all: 'All',
      status: 'Status',
      actions: 'Actions',
      date: 'Date',
      total: 'Total',
      quantity: 'Quantity',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Shipping',
      notes: 'Notes',
      empty: 'No data available',
      select: 'Select',
      viewFull: 'View Full Size',
      download: 'Download',
      upload: 'Upload',
      copy: 'Copy',
      copied: 'Copied!',
      required: 'Required',
      optional: 'Optional',
    },
    // Theme & Language
    theme: {
      title: 'Display Theme',
      dark: 'Dark Mode',
      light: 'Light Mode',
      switchToDark: 'Switch to Dark Mode',
      switchToLight: 'Switch to Light Mode',
    },
    lang: {
      title: 'Language',
      id: 'Bahasa Indonesia',
      en: 'English',
      shortId: 'ID',
      shortEn: 'EN',
      selectLang: 'Select Language',
    },
    // Profile
    profile: {
      title: 'User Profile',
      infoTab: 'Account Info',
      securityTab: 'Password & Security',
      quotaTab: 'AI Studio Quota',
      preferencesTab: 'Preferences & Display',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'WhatsApp / Phone Number',
      address: 'Shipping Address',
      saveChanges: 'Save Changes',
      changePhoto: 'Change Photo',
      deletePhoto: 'Delete Photo',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      changePassword: 'Change Password',
      aiGenerateLimit: 'AI Generate Limit',
      aiEditLimit: 'AI Edit Limit',
      remaining: 'Remaining',
      used: 'Used',
      unlimited: 'Unlimited',
      themeHeading: 'Display Theme Preference',
      themeDesc: 'Adjust your visual viewing comfort while browsing.',
      langHeading: 'Language Preference',
      langDesc: 'Choose your preferred interface and content language.',
    },
    // Footer
    footer: {
      aboutText: 'Custom apparel and screen-printing platform powered by modern AI technology. From T-Shirts, Hoodies, Polos, to Jerseys with top distro quality standards.',
      workshopActive: 'Workshop Active Daily',
      navTitle: 'NAVIGATION',
      contactTitle: 'CONTACT & ADDRESS',
      opTitle: 'OPERATION HOURS',
      opDays: 'Monday–Saturday: 08:00–18:00 WIB',
      opSunday: 'Sunday: Closed (Online Consultation Open)',
      copyright: 'All rights reserved.',
      aboutUs: 'About Us',
      pricelist: 'Pricelist',
      sizeChart: 'Size Guide',
    },
    // Landing Page
    hero: {
      tag: 'AI-POWERED CUSTOM APPAREL',
      title1: 'CUSTOM SCREEN PRINTING',
      title2: 'POWERED BY AI',
      subtitle: 'Bring your dream t-shirts, hoodies, and jerseys to life with state-of-the-art AI design generator, interactive 3D simulations, and top-tier printing quality.',
      ctaStudio: 'Try AI Design Studio',
      ctaCatalog: 'Explore Printing Services',
      stat1: 'Satisfied & Repeat Orders',
      stat2: 'Print & Fabric Choices',
      stat3: 'Artworks Generated',
      stat4: 'Print Guarantee',
    },
    steps: {
      badge: 'Quick & Effortless',
      title: 'HOW TO ORDER',
      subtitle: '5 simple steps from creative concept to finished printed apparel delivered to your doorstep.',
      step1Title: 'Select Service',
      step1Desc: 'Choose apparel type (T-Shirt, Hoodie, Jersey) and printing technique (DTF, Plastisol, Embroidery).',
      step2Title: 'Configure Product',
      step2Desc: 'Pick cotton fabric type, cloth color, and specify size distributions and print positions.',
      step3Title: 'Design / AI Generator',
      step3Desc: 'Upload your own artwork file or create designs instantly with our AI assistant.',
      step4Title: 'Checkout & Deposit',
      step4Desc: 'Flexible payment options: 50% Down Payment or pay in full via Bank Transfer / QRIS.',
      step5Title: 'Produce & Deliver',
      step5Desc: 'Orders are produced under strict quality control and dispatched promptly to your address.',
      phasePrefix: 'Step',
    },
    aiSpotlight: {
      badge: 'Exclusive Key Feature',
      title: 'AUTOMATED SCREEN PRINT DESIGN WITH AI',
      desc: 'No design file ready? No problem! Chat with our AI Designer, input your t-shirt concept idea, and AI will generate high-resolution print-ready artwork, complete with real-time 3D Mockup and AR Try-On on your body.',
      feat1: 'Instant Artwork Generation',
      feat2: '3D Real-Time Mockup',
      feat3: 'AR Virtual Camera',
      cta: 'Open AI Studio Free',
    },
    portfolio: {
      badge: 'Featured Masterpieces',
      title: 'OUR PORTFOLIO',
      subtitle: 'Real proof of premium DTF, plastisol, and embroidery craftsmanship trusted by top communities and brands.',
      viewAll: 'View All Portfolios',
    },
    testimonials: {
      badge: 'Customer Satisfaction',
      title: 'WHAT THEY SAY',
      subtitle: 'Honest reviews from Dreamcatcher loyal customers praising our print precision, fabric feel, and on-time delivery.',
      verifiedReviews: '500+ Verified Reviews',
    },
    faq: {
      badge: 'Help Center & Inquiries',
      title: 'FREQUENTLY ASKED',
      titleHighlight: 'QUESTIONS',
      subtitle: 'Clear, transparent answers regarding printing methods, minimum orders, AI generator, return warranties, and nationwide shipping.',
      searchPlaceholder: 'Search questions about printing, deposit, MOQ, AI...',
      emptyTitle: 'No Matching Questions Found',
      emptyDesc: 'No FAQ matches your search keyword.',
      resetBtn: 'Reset Search Filter',
      helpTitle: 'Need Help or Custom Inquiries?',
      helpLive: 'Live CS',
      helpDesc: 'Consult fabric details, sizing samples, or special bulk quotes with our support team 24/7.',
      chatBtn: 'Chat Customer Support',
      tabs: {
        all: 'All Inquiries',
        order: 'Ordering',
        technique: 'Print Techniques',
        designAi: 'Design & AI',
        payment: 'Payment',
        shipping: 'Shipping',
        warranty: 'Warranty & QC',
        discount: 'Discounts & Promo',
      },
    },
    cta: {
      title: 'READY TO CREATE YOUR DREAM APPAREL?',
      subtitle: 'Get pinpoint print precision, breathable cotton fabrics, and swift service with Dreamcatcher Studio.',
      orderBtn: 'Start Creating Order',
      waBtn: 'WhatsApp Consultation',
    },
    // Catalog & Services
    catalog: {
      badge: 'Official Garment & Printing Catalog',
      title: 'OUR',
      titleHighlight: 'SERVICES',
      subtitle: 'Comprehensive range of screen printing, computer embroidery, High Definition DTF, and premium garment manufacturing with 100% precision guarantee.',
      searchPlaceholder: 'Search printing techniques / apparel...',
      allTab: 'All Services',
      tieredTab: 'Tiered Wholesale',
      flatTab: 'Single & Merchandise',
      priceStarts: 'Starting Price',
      orderNow: 'Order Now',
      viewDetail: 'View Details & Pricelist',
      emptyTitle: 'No Services Found',
      emptyDesc: 'Try using different search terms or select another category tab.',
      consultTitle: 'Need Custom Printing Consultation?',
      consultDesc: 'Discuss institutional uniforms, community t-shirts, or distro merchandise directly with our production specialists.',
      consultBtn: 'Chat WhatsApp Now',
      pricingTypeTiered: 'Wholesale Price',
      pricingTypeFlat: 'Fixed Price',
    },
    // Product List & Detail
    products: {
      badge: 'Official Catalog',
      title: 'PRODUCT CATALOG',
      subtitle: 'Exclusive Dreamcatcher products — premium plain t-shirts, apparel, and custom screen printed merchandise',
      searchPlaceholder: 'Search products...',
      allCategories: 'All Categories',
      outOfStock: 'Out of Stock',
      inStock: 'In Stock',
      viewProduct: 'View Details',
      emptyTitle: 'No Products Found',
      emptyDesc: 'Try changing your search keywords or select another category.',
      resetFilter: 'Reset Filter',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageInfo: 'Page {current} of {total}',
    },
    productDetail: {
      backToCatalog: 'Back to Catalog',
      categoryPrefix: 'Category',
      selectColor: 'Select Fabric Color',
      selectSize: 'Select Size',
      stockLeft: '{count} pcs left',
      quantity: 'Quantity',
      addToCart: 'Add to Cart',
      orderDirect: 'Order Custom Print for This Product',
      descTab: 'Product Description',
      specTab: 'Fabric Specifications',
      careTab: 'Care Instructions',
      reviewsTab: 'Customer Reviews',
    },
    // Cart
    cart: {
      title: 'Shopping Cart',
      subtitle: 'Review your custom apparel and screen printed items before proceeding to checkout.',
      emptyTitle: 'Your Cart is Empty',
      emptyDesc: 'You have not added any products or custom print orders to your cart yet.',
      startShopping: 'Browse Products',
      orderCustom: 'Create Custom Print Order',
      summaryTitle: 'Order Summary',
      totalItems: 'Total Items',
      checkoutBtn: 'Proceed to Checkout',
      confirmDelete: 'Remove this item from your shopping cart?',
    },
    // Order Page (6 Steps)
    order: {
      title: 'Custom Print Order Form',
      step1: 'Select Service',
      step2: 'Product Config',
      step3: 'Print Area',
      step4: 'Artwork Design',
      step5: 'Cost Estimation',
      step6: 'Checkout & Deposit',
      serviceDesc: 'Choose the apparel type or printing technique you wish to manufacture.',
      configDesc: 'Specify cotton fabric material, cloth color, and size distributions.',
      printAreaDesc: 'Choose print positions, dimensions, and printing technique.',
      designDesc: 'Upload your own artwork files or generate ideas with our AI Assistant.',
      previewDesc: 'Review cost estimates, bulk tier discounts, and projected lead times.',
      checkoutDesc: 'Provide delivery address and select 50% Down Payment or Full payment.',
      fabricColor: 'Fabric Color',
      fabricType: 'Fabric Material',
      totalPcs: 'Total Quantity',
      placeOrderBtn: 'Submit & Process Order',
    },
    // Payment Page
    payment: {
      title: 'Order Payment',
      orderCode: 'Order Code',
      totalBill: 'Total Invoice',
      minPayment: 'Minimum Payment (50% Deposit)',
      bankTransfer: 'Manual Bank Transfer',
      qrisPayment: 'QRIS (Gopay, OVO, ShopeePay, Dana)',
      instructions: 'Payment Instructions',
      uploadProof: 'Upload Payment Proof',
      uploadSuccess: 'Payment proof sent successfully. Admin will verify shortly.',
      verifyNotice: 'Payment verification usually takes 5-15 minutes during operating hours.',
      statusPending: 'Awaiting Payment',
      statusVerified: 'Payment Verified',
    },
    // My Orders & History
    myOrders: {
      title: 'My Orders',
      subtitle: 'Monitor production progress, payments, and parcel tracking in real-time.',
      historyTitle: 'Order History',
      searchPlaceholder: 'Search order code / product...',
      tabAll: 'All',
      tabWaitingPayment: 'Awaiting Payment',
      tabProcessing: 'In Production',
      tabShipped: 'Shipped',
      tabCompleted: 'Completed',
      tabCancelled: 'Cancelled',
      orderDetail: 'Order Details',
      trackOrder: 'Track Status',
      downloadInvoice: 'Download Invoice',
      cancelOrder: 'Cancel Order',
      rateOrder: 'Rate & Review',
    },
    // Design Studio
    designStudio: {
      title: 'AI Design Studio & 3D Mockup',
      tabAi: 'AI Generator',
      tabMockup: '3D Mockup Editor',
      tabAr: 'AR Virtual Try-On',
      promptPlaceholder: 'Type your t-shirt design concept... (e.g. cyberpunk neon dragon illustration)',
      generateBtn: 'Generate Image',
      shirtColor: 'T-Shirt Color',
      exportMockup: 'Download Mockup',
      saveDesign: 'Use This Design',
      conceptsTitle: 'Popular Concept Recommendations',
    },
    // Pricelist & Size Chart & About
    pricelist: {
      badge: 'Official Pricelist',
      title: 'SERVICE PRICELIST',
      subtitle: 'Transparent prices for screen printing, embroidery, and custom apparel production at Dreamcatcher Studio.',
    },
    sizeChart: {
      badge: 'International Standards',
      title: 'SIZE GUIDE (SIZE CHART)',
      subtitle: 'Ensure your t-shirt and hoodie sizing is spot on before production begins.',
      width: 'Chest Width (cm)',
      length: 'Body Length (cm)',
      tolerance: 'Sewing dimension tolerance ±1 to 2 cm.',
    },
    about: {
      badge: 'Studio Profile',
      title: 'ABOUT DREAMCATCHER',
      subtitle: 'Pioneering modern apparel manufacturing combining pinpoint printing mastery with artificial intelligence innovations.',
    },
    // Auth Modal
    auth: {
      loginTitle: 'Log In to Account',
      registerTitle: 'Create New Account',
      loginSubtitle: 'Manage custom orders and enjoy limitless AI Studio features.',
      registerSubtitle: 'Join now to start designing & ordering your dream print.',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      nameLabel: 'Full Name',
      phoneLabel: 'WhatsApp Number',
      loginBtn: 'Log In Now',
      registerBtn: 'Sign Up Now',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      registerLink: 'Sign up here',
      loginLink: 'Log in here',
      forgotPassword: 'Forgot Password?',
    },
    // Notifications Dropdown
    notifications: {
      title: 'Order Notifications',
      markAll: 'Mark All as Read',
      empty: 'No Notifications Yet',
      tabAll: 'All',
      tabCompleted: 'Completed',
      tabPayment: 'Payment',
      tabProcess: 'Production',
      viewOrders: 'Open My Orders',
    },
    // Status Labels
    status: {
      pending: 'Pending',
      waiting_payment: 'Awaiting Payment',
      waiting_verification: 'Awaiting Verification',
      ready_to_process: 'Ready to Process',
      processing: 'In Production',
      ready_for_pickup: 'Shipped / Ready for Pickup',
      completed: 'Completed',
      cancelled: 'Cancelled',
      cancel_requested: 'Cancellation Requested',
      paid: 'Paid in Full',
      dp: 'DP Verified',
      rejected: 'Rejected',
    },
    // Alerts
    alerts: {
      logoutConfirmTitle: 'Confirm Logout',
      logoutConfirmMsg: 'Are you sure you want to log out from your account?',
      logoutSuccess: 'Successfully logged out. See you again!',
      themeSwitchedDark: 'Theme switched to Dark Mode',
      themeSwitchedLight: 'Theme switched to Light Mode',
      langSwitched: 'Language switched to English',
      addedToCart: 'Successfully added to cart!',
      orderSuccess: 'Order created successfully!',
    },
  },
};

/**
 * Curated Database & Dynamic Content Translation Dictionary (ID -> EN)
 * Translates values returned from backend APIs / database when active language is English.
 */
export const dynamicDbDictionary = {
  // Services & Categories
  'Sablon Kaos': 'T-Shirt Screen Printing',
  'Sablon Hoodie': 'Hoodie Screen Printing',
  'Sablon Jersey': 'Jersey Sublimation & Screen Printing',
  'Sablon Polo': 'Polo Shirt Embroidery & Printing',
  'Bordir Komputer': 'Computer Embroidery',
  'Sablon DTF Custom': 'Custom DTF Screen Printing',
  'Sablon Plastisol Distro': 'Plastisol Distro Screen Printing',
  'Kaos': 'T-Shirts',
  'Merch': 'Merchandise',
  'Aksesoris': 'Accessories',
  'Apparel': 'Apparel',
  'Jersey': 'Jerseys',
  'Hoodie': 'Hoodies',
  'Polo': 'Polo Shirts',

  // Product Names
  'Kaos Polos Cotton Combed 30s': 'Plain T-Shirt Cotton Combed 30s',
  'Kaos Polos Cotton Combed 24s': 'Plain T-Shirt Cotton Combed 24s',
  'Kaos Oversize Cotton Combed 24s': 'Oversized T-Shirt Cotton Combed 24s',
  'Hoodie Jumper Fleece Premium': 'Premium Fleece Jumper Hoodie',
  'Zipper Hoodie Fleece': 'Zipper Fleece Hoodie',
  'Polo Shirt Lacoste CVC': 'Lacoste CVC Polo Shirt',
  'Jersey Drifit Sublimasi': 'Sublimated Drifit Jersey',
  'Tote Bag Kanvas Premium': 'Premium Canvas Tote Bag',
  'Topi Baseball Twill': 'Baseball Twill Cap',

  // Pricing Types & Purchase Methods
  'tiered': 'Tiered Wholesale',
  'flat': 'Fixed Price',
  'Harga Grosir': 'Wholesale Price',
  'Harga Tetap': 'Fixed Price',
  'Harga Mulai': 'Starting From',
  'Satuan': 'Single Item',
  'Lusinan': 'Dozen / Bulk',
  'pcs': 'pcs',
  'lembar': 'sheets',
  'lusin': 'dozens',

  // Print Positions
  'standar_depan': 'Front Standard',
  'Standar Depan': 'Front Standard',
  'dada_tengah': 'Center Chest',
  'Dada Tengah': 'Center Chest',
  'dada_kiri': 'Left Chest',
  'Dada Kiri': 'Left Chest',
  'dada_kanan': 'Right Chest',
  'Dada Kanan': 'Right Chest',
  'standar_belakang': 'Back Standard',
  'Standar Belakang': 'Back Standard',
  'punggung_atas': 'Upper Back',
  'Punggung Atas': 'Upper Back',
  'lengan_kiri': 'Left Sleeve',
  'Lengan Kiri': 'Left Sleeve',
  'lengan_kanan': 'Right Sleeve',
  'Lengan Kanan': 'Right Sleeve',

  // Fabric Colors
  'Hitam': 'Black',
  'Putih': 'White',
  'Abu-abu': 'Grey',
  'Navy': 'Navy Blue',
  'Merah': 'Red',
  'Maroon': 'Maroon',
  'Biru Royal': 'Royal Blue',
  'Biru Muda': 'Light Blue',
  'Hijau Army': 'Army Green',
  'Hijau Botol': 'Bottle Green',
  'Kuning': 'Yellow',
  'Orange': 'Orange',
  'Cream': 'Cream',
  'Coklat': 'Brown',
  'Ungu': 'Purple',
  'Pink': 'Pink',

  // Delivery & Payment
  'Ambil di Toko': 'Store Pickup',
  'Kurir Reguler': 'Regular Courier',
  'Transfer Bank': 'Bank Transfer',
  'QRIS (Semua E-Wallet)': 'QRIS (All E-Wallets)',
  'Bayar Lunas (100%)': 'Full Payment (100%)',
  'Down Payment (50%)': 'Down Payment (50%)',
  'transfer_bank': 'Bank Transfer',
  'qris': 'QRIS',
  'manual': 'Manual Transfer',

  // Statuses
  'pending': 'Pending',
  'waiting_payment': 'Awaiting Payment',
  'waiting_verification': 'Awaiting Verification',
  'ready_to_process': 'Ready to Process',
  'processing': 'In Production',
  'ready_for_pickup': 'Shipped / Ready for Pickup',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'cancel_requested': 'Cancellation Requested',
  'paid': 'Paid in Full',
  'dp': 'DP Verified',
  'rejected': 'Rejected',
  'Pesanan Diterima': 'Order Received',
  'Menunggu Pembayaran': 'Awaiting Payment',
  'Menunggu Verifikasi': 'Awaiting Verification',
  'Siap Diproses': 'Ready to Process',
  'Sedang Diproses': 'In Production',
  'Dikirim / Siap Diambil': 'Shipped / Ready for Pickup',
  'Siap Diambil / Dikirim': 'Shipped / Ready for Pickup',
  'Selesai': 'Completed',
  'Dibatalkan': 'Cancelled',
  'PESANAN DIBATALKAN': 'ORDER CANCELLED',
  'MENUNGGU KONFIRMASI PEMBATALAN': 'AWAITING CANCELLATION APPROVAL',

  // Common Descriptions & Phrases
  'Sablon kaos berkualitas tinggi dengan teknik DTG dan screen print. Cocok untuk desain custom dengan warna full color atau limited edition.':
    'High-quality t-shirt printing with DTG and screen printing techniques. Ideal for custom full-color or limited edition designs.',
  'Sablon hoodie premium dengan bahan fleece tebal dan sablon DTF awet. Hangat, nyaman, dan tahan cuci berkali-kali.':
    'Premium hoodie printing with thick fleece fabric and durable DTF print. Warm, comfortable, and wash-resistant.',
  'Pembuatan jersey printing sublimasi full print untuk tim futsal, sepak bola, basket, dan esport. Warna tajam tidak luntur.':
    'Full-print sublimation jersey manufacturing for futsal, football, basketball, and esports teams. Sharp, non-fading colors.',
  'Sablon dan bordir kemeja polo custom bahan Lacoste pique/CVC. Tampilan rapi, elegan, cocok untuk seragam kantor dan komunitas.':
    'Custom polo shirt printing and embroidery on Lacoste pique/CVC fabric. Neat, elegant look perfect for corporate uniforms and clubs.',
  'Bordir komputer presisi tinggi untuk emblem, logo kemeja, jaket, dan topi. Jahitan rapat dan benang berkualitas.':
    'High-precision computer embroidery for emblems, shirt crests, jackets, and caps. Dense stitching and premium threads.',
  'Cetak sablon DTF (Direct to Film) satuan atau partai tanpa batasan warna. Hasil elastis, lembut, dan menempel sempurna pada kain.':
    'DTF (Direct to Film) printing in single units or bulk without color limits. Stretchable, soft feel adhering perfectly to fabrics.',
};

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'id', // 'id' | 'en'
      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set((s) => ({
          language: s.language === 'id' ? 'en' : 'id',
        })),

      // Standard static UI translation hook
      t: (key, replacements = {}) => {
        const lang = get().language || 'id';
        const dict = translations[lang] || translations.id;
        const keys = key.split('.');
        let current = dict;
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            // Fallback to Indonesian if key missing
            let fallback = translations.id;
            for (const fk of keys) {
              if (fallback && typeof fallback === 'object' && fk in fallback) {
                fallback = fallback[fk];
              } else {
                return key;
              }
            }
            current = fallback;
            break;
          }
        }
        let str = current ?? key;
        if (typeof str === 'string') {
          for (const [rKey, rVal] of Object.entries(replacements)) {
            str = str.replace(new RegExp(`\\{${rKey}\\}`, 'g'), rVal);
          }
        }
        return str;
      },

      // Dynamic Database Content Translator: Translates dynamic strings from DB / API
      td: (text, fallback = null) => {
        if (!text) return fallback || text;
        const lang = get().language || 'id';
        if (lang === 'id') return text;

        const cleanText = String(text).trim();

        // 1. Direct dictionary match
        if (dynamicDbDictionary[cleanText]) {
          return dynamicDbDictionary[cleanText];
        }

        // 2. Case-insensitive lookup
        const lower = cleanText.toLowerCase();
        for (const [idKey, enVal] of Object.entries(dynamicDbDictionary)) {
          if (idKey.toLowerCase() === lower) {
            return enVal;
          }
        }

        // 3. Dynamic patterns:
        // "Min. X pcs"
        const minMatch = cleanText.match(/^Min\.?\s*(\d+)\s*(pcs|lembar|lusin)?/i);
        if (minMatch) {
          const unit = minMatch[2] ? (dynamicDbDictionary[minMatch[2]] || minMatch[2]) : 'pcs';
          return `Min. ${minMatch[1]} ${unit}`;
        }

        // "Mulai dari Rp X"
        if (cleanText.toLowerCase().startsWith('mulai dari')) {
          return cleanText.replace(/mulai dari/i, 'Starting from');
        }

        // "Estimasi X hari kerja"
        const estMatch = cleanText.match(/estimasi\s*(\d+[-–]\d+|\d+)\s*hari\s*kerja/i);
        if (estMatch) {
          return `Estimated ${estMatch[1]} business days`;
        }

        // Fallback: return provided fallback or original text
        return fallback !== null ? fallback : text;
      },

      // Dynamic Object Translators for APIs
      translateService: (service) => {
        if (!service) return service;
        const lang = get().language || 'id';
        if (lang === 'id') return service;
        const td = get().td;
        return {
          ...service,
          name: td(service.name),
          description: td(service.description),
          unit: td(service.unit || 'pcs'),
        };
      },

      translateProduct: (product) => {
        if (!product) return product;
        const lang = get().language || 'id';
        if (lang === 'id') return product;
        const td = get().td;
        return {
          ...product,
          name: td(product.name),
          description: td(product.description),
          category: product.category ? { ...product.category, name: td(product.category.name) } : product.category,
        };
      },
    }),
    {
      name: 'user-language',
    }
  )
);
