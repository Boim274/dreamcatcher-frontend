import { getImageUrl } from './getImageUrl';

/**
 * Modern SVG Placeholder Data URI (Clean silhouette, works in both dark & light backgrounds)
 */
export const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
  <rect width="400" height="400" fill="#1e293b"/>
  <path d="M140 160C140 148.954 148.954 140 160 140H240C251.046 140 260 148.954 260 160V240C260 251.046 251.046 260 240 260H160C148.954 260 140 251.046 140 240V160Z" stroke="#475569" stroke-width="6" stroke-dasharray="12 12" rx="12"/>
  <circle cx="180" cy="180" r="14" fill="#64748b"/>
  <path d="M150 235L190 195L220 225L235 210L255 235H150Z" fill="#475569"/>
  <text x="200" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Dreamcatcher Sablon</text>
</svg>
`)}`;

/**
 * Optimizes an image URL dynamically depending on source:
 * - Cloudinary: Injects precise width, quality, and modern format (WebP/AVIF auto)
 * - Unsplash: Injects modern format & width parameters
 * - Local storage: Maps to pre-generated -thumb.webp or -medium.webp if available
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url) return SVG_PLACEHOLDER;

  const resolved = getImageUrl(url);
  if (!resolved || resolved.startsWith('data:')) return resolved;

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'limit',
    variant, // 'thumbnail' | 'medium' | 'full'
  } = options;

  // Determine target width from variant if width not explicitly provided
  let targetWidth = width;
  if (!targetWidth) {
    if (variant === 'thumbnail') targetWidth = 300;
    else if (variant === 'medium') targetWidth = 800;
  }

  // 1. Cloudinary Optimization
  if (resolved.includes('cloudinary.com') && resolved.includes('/image/upload/')) {
    const uploadIdx = resolved.indexOf('/image/upload/') + '/image/upload/'.length;
    const prefix = resolved.substring(0, uploadIdx);
    const suffix = resolved.substring(uploadIdx);

    // If already has transformation parameters right after /upload/, avoid doubling
    if (/^[a-z]_[a-z0-9_,-]+\//i.test(suffix)) {
      // already transformed, replace or return
      return resolved;
    }

    const transforms = [];
    if (targetWidth) transforms.push(`w_${targetWidth}`);
    if (height) transforms.push(`h_${height}`);
    if (targetWidth && height) {
      transforms.push(fit === 'crop' ? 'c_fill,g_auto' : `c_${fit}`);
    } else if (targetWidth) {
      transforms.push(`c_${fit}`);
    }
    transforms.push(`q_${quality}`);
    transforms.push(`f_${format}`);

    return `${prefix}${transforms.join(',')}/${suffix}`;
  }

  // 2. Unsplash Optimization
  if (resolved.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(resolved);
      if (targetWidth) urlObj.searchParams.set('w', targetWidth);
      if (height) urlObj.searchParams.set('h', height);
      urlObj.searchParams.set('q', quality);
      urlObj.searchParams.set('auto', 'format');
      if (fit === 'crop') urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch {
      return resolved;
    }
  }

  // 3. Local Storage Pre-generated WebP Variants
  // If requesting a thumbnail and filename is *.webp (but not already -thumb or -medium)
  if (targetWidth && targetWidth <= 350) {
    if (resolved.endsWith('.webp') && !resolved.includes('-thumb.webp') && !resolved.includes('-medium.webp')) {
      return resolved.replace(/\.webp$/, '-thumb.webp');
    }
  } else if (targetWidth && targetWidth <= 850) {
    if (resolved.endsWith('.webp') && !resolved.includes('-thumb.webp') && !resolved.includes('-medium.webp')) {
      return resolved.replace(/\.webp$/, '-medium.webp');
    }
  }

  return resolved;
}

/**
 * Generate srcset for responsive images
 */
export function getResponsiveSrcSet(url, widths = [320, 640, 960, 1280]) {
  if (!url || url.startsWith('data:') || (!url.includes('cloudinary.com') && !url.includes('images.unsplash.com'))) {
    return undefined;
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
