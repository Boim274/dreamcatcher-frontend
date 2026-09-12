export const PRINT_POSITIONS = [
  { id: 'standar-depan',  label: 'Standar Depan',  uvX: 0.50, uvY: 0.44 },
  { id: 'dada-tengah',    label: 'Dada Tengah',    uvX: 0.50, uvY: 0.52 },
  { id: 'dada-kiri',      label: 'Dada Kiri',      uvX: 0.30, uvY: 0.50 },
  { id: 'dada-kanan',     label: 'Dada Kanan',     uvX: 0.70, uvY: 0.50 },
  { id: 'standar-belakang', label: 'Standar Belakang', uvX: 0.50, uvY: 0.45 },
  { id: 'punggung-atas',  label: 'Punggung Atas',  uvX: 0.50, uvY: 0.65 },
  { id: 'lengan-kiri',    label: 'Lengan Kiri',    uvX: 0.05, uvY: 0.82 },
  { id: 'lengan-kanan',   label: 'Lengan Kanan',   uvX: 0.95, uvY: 0.82 },
];

export const PRINT_SIZES = [
  { id: '9x9',  label: '9 × 9 cm',         widthCm: 9,  heightCm: 9  },
  { id: '9x28', label: '9 × 28 cm',        widthCm: 9,  heightCm: 28 },
  { id: 'a5',   label: '20 × 13 cm (A5)',  widthCm: 20, heightCm: 13 },
  { id: 'a4',   label: '28 × 20 cm (A4)',  widthCm: 28, heightCm: 20 },
  { id: 'a3',   label: '28 × 40 cm (A3)',  widthCm: 28, heightCm: 40 },
];

const BODY_UV_W = 0.66;
const BODY_UV_H = 0.80;
export const BODY_CM_W = 55;
export const BODY_CM_H = 70;
export const TEXTURE_SIZE = 1024;
export const CM_TO_PX = (BODY_UV_W / BODY_CM_W) * TEXTURE_SIZE;
export const CM_TO_PX_Y = (BODY_UV_H / BODY_CM_H) * TEXTURE_SIZE;
