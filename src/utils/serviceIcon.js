const serviceIcons = {
  'kaos': 'shirt',
  'sablon': 'shirt',
  'banner': 'monitor',
  'stiker': 'image',
  'bordir': 'layers',
  'default': 'box',
};

export const getServiceIcon = (name) => {
  const lower = (name || '').toLowerCase();
  for (const [key, icon] of Object.entries(serviceIcons)) {
    if (lower.includes(key)) return icon;
  }
  return 'box';
};
