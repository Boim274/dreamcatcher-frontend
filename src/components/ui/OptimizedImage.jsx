import { useState, useMemo } from 'react';
import { getOptimizedImageUrl, getResponsiveSrcSet, SVG_PLACEHOLDER } from '../../utils/optimizedImage';

/**
 * Reusable high-performance Image component.
 * Features:
 * - Prevents CLS (Cumulative Layout Shift) with aspect ratio and reserved dimensions.
 * - Native lazy loading with async decoding.
 * - Skeleton shimmer placeholder during network load.
 * - Seamless error recovery with elegant Light & Dark mode fallbacks.
 * - Automatic WebP/responsive URL transformations for Cloudinary/Unsplash/local.
 */
export default function OptimizedImage({
  src,
  thumbnailSrc,
  mediumSrc,
  previewSrc,
  alt = 'Dreamcatcher Sablon',
  width,
  height,
  variant = 'full', // 'thumbnail' | 'medium' | 'full' | 'custom'
  aspectRatio = '', // e.g. 'aspect-square', 'aspect-[4/3]', 'aspect-video'
  className = '',
  containerClassName = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes,
  objectFit = 'cover', // 'cover' | 'contain' | 'fill'
  rounded = '',
  fallbackSrc,
  onClick,
  title,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine the most optimal image URL based on variant and explicit props
  const resolvedSrc = useMemo(() => {
    if (hasError) {
      return fallbackSrc || SVG_PLACEHOLDER;
    }

    if (variant === 'thumbnail' && thumbnailSrc) {
      return getOptimizedImageUrl(thumbnailSrc, { variant: 'thumbnail', width: width || 300 });
    }
    if (variant === 'medium' && (mediumSrc || previewSrc)) {
      return getOptimizedImageUrl(mediumSrc || previewSrc, { variant: 'medium', width: width || 800 });
    }

    return getOptimizedImageUrl(src, {
      variant,
      width,
      height,
    });
  }, [src, thumbnailSrc, mediumSrc, previewSrc, variant, width, height, hasError, fallbackSrc]);

  // Compute responsive srcset if applicable
  const srcSet = useMemo(() => {
    if (hasError || variant === 'thumbnail' || !src) return undefined;
    return getResponsiveSrcSet(src);
  }, [src, variant, hasError]);

  const fitClass =
    objectFit === 'contain'
      ? 'object-contain'
      : objectFit === 'fill'
      ? 'object-fill'
      : 'object-cover';

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio} ${rounded} ${containerClassName} ${
        !isLoaded && !hasError ? 'bg-slate-100 dark:bg-slate-800/80' : ''
      }`}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      onClick={onClick}
      title={title}
    >
      {/* Skeleton Shimmer while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700/50 dark:to-slate-800 pointer-events-none" />
      )}

      {/* Fallback Display if Error */}
      {hasError ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-2 text-center bg-slate-100 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 select-none">
          <svg
            className="w-8 h-8 mb-1 text-slate-300 dark:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-[10px] font-medium leading-tight">No Preview</span>
        </div>
      ) : (
        <img
          src={resolvedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={`w-full h-full ${fitClass} ${rounded} transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}
