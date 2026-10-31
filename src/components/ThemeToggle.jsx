import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Unobtrusive, zero-clutter Theme Switcher button.
 * Fits discreetly in the top-right utility bar without visual saturation.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-emerald-500/25 bg-slate-50/90 dark:bg-slate-800/80 text-slate-600 dark:text-emerald-300 hover:text-brand-700 dark:hover:text-emerald-200 hover:border-brand-300 dark:hover:border-emerald-400/50 hover:bg-brand-50/70 dark:hover:bg-slate-800 transition-all shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
    >
      {isDark ? (
        <Sun className="w-4 h-4 stroke-[2] transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="w-4 h-4 stroke-[2] transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}

