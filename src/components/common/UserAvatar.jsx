import React, { useState, useEffect } from 'react';

/**
 * Robust UserAvatar component with automatic error fallback to name initials
 * and smooth gradient styling.
 */
export default function UserAvatar({
  user,
  src,
  name,
  size = 'md',
  className = '',
  imgClassName = '',
  textClassName = '',
  rounded = 'rounded-full',
  border = false,
  showGlow = false,
  alt,
}) {
  const avatarUrl = src || user?.avatar || null;
  const displayName = name || user?.name || 'User';
  const initial = (displayName.trim().charAt(0) || 'U').toUpperCase();

  const [hasError, setHasError] = useState(false);

  // Reset error state when avatar URL changes
  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  // Predefined sizing map
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl sm:w-28 sm:h-28 sm:text-4xl',
    '3xl': 'w-28 h-28 text-4xl',
  };

  const currentSizeClass = sizeMap[size] || size;

  const borderClass = border
    ? 'border border-white/20 shadow-sm'
    : '';

  const glowClass = showGlow
    ? 'shadow-lg shadow-primary/25'
    : '';

  const showImage = avatarUrl && !hasError;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden font-heading font-bold select-none ${rounded} ${currentSizeClass} ${borderClass} ${glowClass} ${
        !showImage ? 'bg-gradient-to-tr from-primary via-[#ff60a8] to-purple-600 text-white' : 'bg-[#120c16]'
      } ${className}`}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={alt || displayName}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-center ${imgClassName}`}
          loading="lazy"
        />
      ) : (
        <span className={`leading-none drop-shadow-sm ${textClassName}`}>
          {initial}
        </span>
      )}
    </div>
  );
}
