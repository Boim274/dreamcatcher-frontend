// Catalog of suggestion chips for the conversational AI Generate prompt.
// Each chip: { id, label, phrase } — clicking inserts `phrase` into the prompt.
export const CHIP_CATEGORIES = [
  {
    id: 'style',
    label: 'Gaya Desain',
    chips: [
      { id: 'minimalis', label: 'Minimalis', phrase: 'gaya minimalis' },
      { id: 'vintage', label: 'Vintage', phrase: 'gaya vintage' },
      { id: 'streetwear', label: 'Streetwear', phrase: 'gaya streetwear' },
      { id: 'anime', label: 'Anime', phrase: 'gaya anime' },
      { id: 'cyberpunk', label: 'Cyberpunk', phrase: 'gaya cyberpunk' },
      { id: 'luxury', label: 'Luxury', phrase: 'gaya luxury' },
      { id: 'graffiti', label: 'Graffiti', phrase: 'gaya graffiti' },
      { id: 'retro', label: 'Retro', phrase: 'gaya retro' },
      { id: 'modern', label: 'Modern', phrase: 'gaya modern' },
      { id: 'techwear', label: 'Techwear', phrase: 'gaya techwear' },
    ],
  },
  {
    id: 'colors',
    label: 'Palet Warna',
    chips: [
      { id: 'hitam-putih', label: 'Hitam & Putih', phrase: 'warna hitam dan putih' },
      { id: 'hitam-emas', label: 'Hitam & Gold', phrase: 'warna hitam dan emas' },
      { id: 'navy-putih', label: 'Navy & Putih', phrase: 'warna navy dan putih' },
      { id: 'earth-tone', label: 'Earth Tone', phrase: 'warna earth tone' },
      { id: 'neon', label: 'Neon', phrase: 'warna neon' },
      { id: 'monochrome', label: 'Monochrome', phrase: 'warna monokrom' },
      { id: 'pastel', label: 'Pastel', phrase: 'warna pastel' },
      { id: 'gradient', label: 'Gradasi', phrase: 'gradasi warna' },
    ],
  },
  {
    id: 'graphics',
    label: 'Elemen Grafis',
    chips: [
      { id: 'naga', label: 'Naga', phrase: 'dengan elemen naga' },
      { id: 'tengkorak', label: 'Tengkorak', phrase: 'dengan elemen tengkorak' },
      { id: 'elang', label: 'Elang', phrase: 'dengan elemen elang' },
      { id: 'ombak-jepang', label: 'Ombak Jepang', phrase: 'dengan motif ombak jepang' },
      { id: 'sakura', label: 'Sakura', phrase: 'dengan elemen bunga sakura' },
      { id: 'petir', label: 'Petir', phrase: 'dengan elemen petir' },
      { id: 'api', label: 'Api', phrase: 'dengan elemen api' },
      { id: 'sayap', label: 'Sayap', phrase: 'dengan elemen sayap' },
      { id: 'galaxy', label: 'Galaksi', phrase: 'dengan elemen galaksi' },
      { id: 'gunung', label: 'Gunung', phrase: 'dengan elemen gunung' },
      { id: 'floral', label: 'Bunga Floral', phrase: 'dengan elemen floral' },
      { id: 'abstrak', label: 'Abstrak', phrase: 'dengan elemen abstrak' },
    ],
  },
  {
    id: 'typography',
    label: 'Tipografi',
    chips: [
      { id: 'bold', label: 'Bold', phrase: 'tipografi bold' },
      { id: 'elegan', label: 'Elegan', phrase: 'tipografi elegan' },
      { id: 'tangan', label: 'Tulisan Tangan', phrase: 'tipografi tulisan tangan' },
      { id: 'sans', label: 'Sans Serif', phrase: 'tipografi sans serif' },
      { id: 'serif', label: 'Serif', phrase: 'tipografi serif' },
      { id: 'graffiti-font', label: 'Graffiti', phrase: 'tipografi graffiti' },
      { id: 'futuristik', label: 'Futuristik', phrase: 'tipografi futuristik' },
    ],
  },
  {
    id: 'placement',
    label: 'Penempatan',
    chips: [
      { id: 'depan', label: 'Depan', phrase: 'dicetak di bagian depan' },
      { id: 'belakang', label: 'Belakang', phrase: 'dicetak di bagian belakang' },
      { id: 'lengan', label: 'Lengan', phrase: 'dicetak di lengan' },
      { id: 'saku', label: 'Pocket', phrase: 'dicetak di area saku' },
      { id: 'depan-belakang', label: 'Depan & Belakang', phrase: 'dicetak di depan dan belakang' },
    ],
  },
  {
    id: 'shirt',
    label: 'Warna Kaos',
    chips: [
      { id: 'kaos-hitam', label: 'Hitam', phrase: 'dengan kaos hitam' },
      { id: 'kaos-putih', label: 'Putih', phrase: 'dengan kaos putih' },
      { id: 'kaos-navy', label: 'Navy', phrase: 'dengan kaos navy' },
      { id: 'kaos-krem', label: 'Cream', phrase: 'dengan kaos krem' },
      { id: 'kaos-abu', label: 'Abu', phrase: 'dengan kaos abu-abu' },
      { id: 'kaos-merah', label: 'Merah', phrase: 'dengan kaos merah' },
    ],
  },
  {
    id: 'print',
    label: 'Metode Cetak',
    chips: [
      { id: 'dtf', label: 'DTF', phrase: 'menggunakan metode cetak DTF' },
      { id: 'plastisol', label: 'Plastisol', phrase: 'menggunakan metode cetak plastisol' },
    ],
  },
];

// Keyword -> relevant chips for dynamic suggestions while typing.
// Keys are lowercased Indonesian/English tokens checked against the prompt.
const dynamicRuleMap = [
  { match: ['anime', 'jepang', 'manga'], chips: ['ombak-jepang', 'sakura', 'naga', 'kaos-hitam', 'dtf', 'neon'] },
  { match: ['motor', 'komunitas', 'biker', 'vespa'], chips: ['tengkorak', 'elang', 'api', 'vintage', 'lengan', 'belakang', 'bold', 'kaos-hitam'] },
  { match: ['streetwear', 'urban', 'oversize'], chips: ['graffiti', 'abstrak', 'petir', 'kaos-hitam', 'minimalis', 'bold'] },
  { match: ['alam', 'gunung', 'outdoor', 'pendaki'], chips: ['gunung', 'floral', 'earth-tone', 'sans', 'depan-belakang'] },
  { match: ['musik', 'band', 'metal', 'punk'], chips: ['tengkorak', 'api', 'gothic', 'vintage', 'graffiti', 'kaos-hitam'] },
  { match: ['olahr', 'fitnes', 'gym', 'sepak'], chips: ['petir', 'api', 'bold', 'sans', 'depan', 'lengan', 'neon'] },
  { match: ['anak', 'kartun', 'lucu', 'imut'], chips: ['pastel', 'floral', 'sans', 'depan', 'dtf', 'kaos-putih'] },
  { match: ['elegan', 'mewah', 'corporate', 'bisnis', 'wedding'], chips: ['luxury', 'hitam-emas', 'serif', 'elegan', 'saku', 'minimalis'] },
  { match: ['gam', 'esport', 'game'], chips: ['cyberpunk', 'petir', 'naga', 'galaxy', 'neon', 'bold', 'kaos-hitam'] },
  { match: ['minimalis', 'simple', 'simpel'], chips: ['minimalis', 'hitam-putih', 'sans', 'saku', 'plastisol'] },
  { match: ['vintage', 'retro', 'oldschool'], chips: ['vintage', 'retro', 'earth-tone', 'serif', 'depan', 'plastisol'] },
  { match: ['foto', 'realistis', 'photograph'], chips: ['dtf', 'gradient', 'galaxy', 'gunung', 'depan-belakang'] },
];

// Recommendations shown as click-to-apply chips based on the current prompt.
const recommendationRuleMap = [
  { match: ['plastisol', '2 warna', 'sederhana'], text: 'Gunakan Plastisol — hemat & tajam untuk desain sederhana.', phrase: 'desain sederhana 2 warna, kontras tinggi' },
  { match: ['dtf', 'full color', 'gradasi', 'foto', 'realistis'], text: 'DTF direkomendasikan untuk desain full color & detail.', phrase: 'full color, gradasi halus, detail tinggi' },
  { match: ['kaos hitam', 'hitam', 'black'], text: 'Desain terang (putih/neon) lebih kontras di kaos hitam.', phrase: 'kontras tinggi, warna terang di atas kaos gelap' },
  { match: ['kaos putih', 'putih', 'white'], text: 'Desain gelap lebih mencolok di kaos putih.', phrase: 'warna gelap, kontras kuat di atas kaos terang' },
  { match: ['lengan', 'pocket', 'kecil'], text: 'Area kecil cocok untuk desain simple & ikon.', phrase: 'desain simple, tidak terlalu detail' },
  { match: ['naga', 'tengkorak', 'elang', 'sayap'], text: 'Tambah elemen pendukung untuk memperkuat tema?', phrase: 'tambahkan elemen pendukung yang senada' },
];

const norm = (s = '') => s.toLowerCase();

export function getDynamicChips(prompt = '') {
  const text = norm(prompt);
  if (text.trim().length < 3) return [];
  const chipById = new Map(
    CHIP_CATEGORIES.flatMap((c) => c.chips).map((chip) => [chip.id, chip])
  );
  const seen = new Set();
  const chips = [];
  for (const rule of dynamicRuleMap) {
    if (rule.match.some((k) => text.includes(k))) {
      for (const id of rule.chips) {
        if (seen.has(id)) continue;
        const chip = chipById.get(id);
        if (chip) {
          seen.add(id);
          chips.push(chip);
        }
      }
    }
  }
  return chips.slice(0, 6);
}

export function getRecommendations(prompt = '') {
  const text = norm(prompt);
  if (text.trim().length < 3) return [];
  const recs = [];
  const seen = new Set();
  for (const rule of recommendationRuleMap) {
    if (rule.match.some((k) => text.includes(k))) {
      if (seen.has(rule.text)) continue;
      seen.add(rule.text);
      recs.push(rule);
    }
  }
  return recs.slice(0, 4);
}
