export const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6287877294587';
export const WA_URL = `https://wa.me/${WA_NUMBER}`;

export const waLink = (text) => `${WA_URL}?text=${encodeURIComponent(text)}`;
