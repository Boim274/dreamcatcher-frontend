import API_BASE from './apiBase';

export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}/${path}`;
}