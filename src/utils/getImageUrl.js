import API_BASE from './apiBase';

export function getImageUrl(path) {
  if (!path) return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  if (
    path.startsWith('/products/') ||
    path.startsWith('/services/') ||
    path.startsWith('/hero/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/icons/')
  ) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
}