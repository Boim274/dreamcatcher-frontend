// Catalog of suggestion chips for the conversational AI Generate prompt.
// Each chip: { id, label, phrase } — clicking inserts `phrase` into the prompt.
export const CHIP_CATEGORIES = [
  {
    id: 'style',
    label: 'Gaya Grafis',
    chips: [
      { id: 'vector-minimalis', label: 'Vector Minimalis', phrase: 'gaya vector minimalis dengan garis kontur tegas' },
      { id: 'vintage-retro', label: 'Vintage Retro', phrase: 'gaya vintage retro oldschool sablon' },
      { id: 'streetwear', label: 'Streetwear Urban', phrase: 'gaya streetwear urban t-shirt print' },
      { id: 'anime', label: 'Anime / Manga', phrase: 'gaya anime manga aesthetic' },
      { id: 'mascot-logo', label: 'Mascot Logo', phrase: 'gaya mascot logo emblem' },
      { id: 'cyberpunk', label: 'Cyberpunk Neon', phrase: 'gaya cyberpunk neon glowing' },
      { id: 'graffiti', label: 'Graffiti Art', phrase: 'gaya graffiti street art' },
      { id: 'luxury-gold', label: 'Luxury Gold', phrase: 'gaya luxury elegant gold accent' },
      { id: 'pop-art', label: 'Pop Art', phrase: 'gaya pop art retro bold' },
      { id: 'techwear', label: 'Techwear Mecha', phrase: 'gaya techwear mecha aesthetic' },
    ],
  },
  {
    id: 'format',
    label: 'Format Desain',
    chips: [
      { id: 'logo-emblem', label: 'Logo Emblem / Badge', phrase: 'format logo circular emblem badge sablon' },
      { id: 'karakter-vektor', label: 'Karakter Maskot', phrase: 'format ilustrasi maskot karakter vektor' },
      { id: 'artwork-bebas', label: 'Artwork Vektor Bebas', phrase: 'format standalone vector graphic artwork' },
      { id: 'sticker-decal', label: 'Sticker Decal Art', phrase: 'format sticker decal graphic print' },
      { id: 'typography-badge', label: 'Tipografi Badge', phrase: 'format typography crest badge design' },
      { id: 'shield-crest', label: 'Shield Crest', phrase: 'format shield crest logo design' },
    ],
  },
  {
    id: 'colors',
    label: 'Palet Warna Sablon',
    chips: [
      { id: 'monochrome', label: 'Hitam & Putih', phrase: 'palet warna hitam dan putih monokrom kontras tinggi' },
      { id: 'hitam-emas', label: 'Hitam & Gold', phrase: 'palet warna hitam dan sentuhan emas berkilau' },
      { id: 'neon-cyber', label: 'Neon Cyber', phrase: 'palet warna cyan magenta neon glowing' },
      { id: 'earth-tone', label: 'Vintage Earth Tone', phrase: 'palet warna vintage earth tone hangat' },
      { id: 'vibrant-color', label: 'Full Color Vibrant', phrase: 'palet full color cerah dan tajam' },
      { id: 'pastel', label: 'Pastel Soft', phrase: 'palet warna pastel lembut' },
      { id: 'navy-putih', label: 'Navy & Putih', phrase: 'palet warna navy dan putih solid' },
      { id: 'fire-gradient', label: 'Api Merah Oranye', phrase: 'palet warna gradasi merah oranye menyala' },
    ],
  },
  {
    id: 'graphics',
    label: 'Elemen Karakter & Ikon',
    chips: [
      { id: 'naga', label: 'Naga Jepang', phrase: 'objek naga jepang mitologi' },
      { id: 'tengkorak', label: 'Tengkorak / Skull', phrase: 'objek tengkorak skull keren' },
      { id: 'harimau', label: 'Harimau / Tiger', phrase: 'objek kepala harimau garang' },
      { id: 'elang', label: 'Elang / Eagle', phrase: 'objek burung elang perkasa' },
      { id: 'samurai', label: 'Samurai / Ronin', phrase: 'objek ksatria samurai dengan topeng oni' },
      { id: 'ombak-jepang', label: 'Ombak Ukiyo-e', phrase: 'elemen motif ombak jepang ukiyo-e' },
      { id: 'sakura', label: 'Bunga Sakura', phrase: 'elemen ornamen bunga sakura' },
      { id: 'petir', label: 'Kilatan Petir', phrase: 'elemen efek petir dinamis' },
      { id: 'api', label: 'Kobaran Api', phrase: 'elemen kobaran api berkobar' },
      { id: 'sayap', label: 'Sayap Megah', phrase: 'elemen sayap membentang' },
      { id: 'galaxy', label: 'Kosmis Galaksi', phrase: 'elemen kosmis galaksi bintang' },
      { id: 'geometris', label: 'Geometris Abstrak', phrase: 'elemen garis geometris modern' },
    ],
  },
  {
    id: 'typography',
    label: 'Tipografi & Teks',
    chips: [
      { id: 'no-text', label: 'Tanpa Teks', phrase: 'tanpa teks murni ilustrasi grafis' },
      { id: 'bold-sans', label: 'Bold Modern', phrase: 'dengan tipografi bold modern sans serif' },
      { id: 'vintage-script', label: 'Vintage Script', phrase: 'dengan tipografi vintage cursive script' },
      { id: 'gothic-blackletter', label: 'Gothic Blackletter', phrase: 'dengan tipografi gothic blackletter' },
      { id: 'graffiti-font', label: 'Graffiti Street', phrase: 'dengan tipografi graffiti wildstyle' },
      { id: 'japanese-kanji', label: 'Aksen Kanji', phrase: 'dengan tipografi aksen kaligrafi kanji' },
      { id: 'curved-text', label: 'Teks Melengkung', phrase: 'dengan susunan teks melengkung circular' },
    ],
  },
  {
    id: 'visual-details',
    label: 'Detail & Latar',
    chips: [
      { id: 'clean-outline', label: 'Outline Tebal Bersih', phrase: 'garis outline tebal bersih dan presisi' },
      { id: 'solid-bg', label: 'Latar Polos Terisolasi', phrase: 'terisolasi pada latar belakang polos solid' },
      { id: 'grunge-distress', label: 'Efek Grunge Distressed', phrase: 'tekstur vintage distressed grunge' },
      { id: 'flat-2d', label: 'Flat 2D Vector', phrase: 'gaya gambar 2D flat artwork kontras tajam' },
      { id: 'halftone-dots', label: 'Halftone Dots', phrase: 'efek halftone dots retro screenprint' },
    ],
  },
];

// Keyword -> relevant chips for dynamic suggestions while typing.
const dynamicRuleMap = [
  { match: ['anime', 'jepang', 'manga', 'samurai', 'oni', 'ninja'], chips: ['ombak-jepang', 'sakura', 'naga', 'samurai', 'japanese-kanji', 'clean-outline'] },
  { match: ['motor', 'komunitas', 'biker', 'vespa', 'harley'], chips: ['tengkorak', 'elang', 'vintage-retro', 'bold-sans', 'grunge-distress', 'shield-crest'] },
  { match: ['streetwear', 'urban', 'hypebeast'], chips: ['graffiti', 'geometris', 'petir', 'streetwear', 'sticker-decal', 'clean-outline'] },
  { match: ['alam', 'gunung', 'outdoor', 'adventure'], chips: ['elang', 'earth-tone', 'vintage-retro', 'shield-crest', 'bold-sans'] },
  { match: ['musik', 'band', 'metal', 'rock', 'punk'], chips: ['tengkorak', 'api', 'gothic-blackletter', 'vintage-retro', 'grunge-distress'] },
  { match: ['esport', 'game', 'gaming', 'squad'], chips: ['cyberpunk', 'mascot-logo', 'neon-cyber', 'harimau', 'naga', 'petir'] },
  { match: ['lucu', 'cute', 'kartun', 'chibi'], chips: ['pastel', 'karakter-vektor', 'clean-outline', 'flat-2d'] },
  { match: ['luxury', 'mewah', 'royal', 'gold'], chips: ['luxury-gold', 'hitam-emas', 'shield-crest', 'clean-outline'] },
  { match: ['minimalis', 'simple', 'simpel', 'clean'], chips: ['vector-minimalis', 'monochrome', 'no-text', 'flat-2d', 'solid-bg'] },
  { match: ['vintage', 'retro', 'oldschool', 'classic'], chips: ['vintage-retro', 'earth-tone', 'vintage-script', 'grunge-distress', 'halftone-dots'] },
];

// Recommendations shown as click-to-apply chips based on the current prompt.
const recommendationRuleMap = [
  { match: ['logo', 'emblem', 'badge'], text: 'Tambahkan format circular badge agar logo sablon tampak rapi & simetris.', phrase: 'format circular badge emblem, kontur presisi' },
  { match: ['naga', 'tengkorak', 'harimau', 'elang', 'samurai'], text: 'Gunakan outline tebal & latar polos agar mudah dicetak sablon DTF/Plastisol.', phrase: 'garis outline tebal bersih, isolated on plain solid background' },
  { match: ['vintage', 'retro', 'oldschool'], text: 'Kombinasikan palet Earth Tone dan tekstur grunge untuk nuansa retro otentik.', phrase: 'warna earth tone vintage, efek distressed grunge' },
  { match: ['cyber', 'neon', 'futuristik'], text: 'Gunakan palet Cyan & Magenta neon berkilau untuk efek cyberpunk tajam.', phrase: 'glowing cyan magenta neon palette, sharp vector lines' },
  { match: ['vektor', 'vector', 'grafis'], text: 'Pastikan desain 2D flat terisolasi tanpa background berantakan.', phrase: 'flat 2D vector artwork, clean solid background, DTF ready' },
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
