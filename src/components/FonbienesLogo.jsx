import React from 'react';
import logoColor from '../assets/logo-fonbienes.png';
import logoWhite from '../assets/logo-fonbienes-white.png';
import { useTheme } from '../context/ThemeContext';

/**
 * Official Fonbienes Perú E.A.F.C. S.A. Brand Logo Component.
 * Automatically switches between full corporate color (Light theme)
 * and pure crisp white (Dark theme or dark surfaces when variant="white").
 */
export default function FonbienesLogo({
  variant = 'auto',
  className = 'h-8 sm:h-9 w-auto'
}) {
  const { isDark } = useTheme();
  const useWhite = variant === 'white' || (variant === 'auto' && isDark);

  return (
    <img
      src={useWhite ? logoWhite : logoColor}
      alt="Fonbienes Perú EAFC S.A."
      width="560"
      height="165"
      decoding="async"
      className={`object-contain select-none ${className}`}
    />
  );
}

