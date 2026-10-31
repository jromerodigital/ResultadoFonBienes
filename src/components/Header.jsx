import React from 'react';
import { BarChart3, SlidersHorizontal, Layers, ShieldCheck } from 'lucide-react';
import FonbienesLogo from './FonbienesLogo';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { id: 'executive', label: 'Panorama', icon: BarChart3 },
  { id: 'simulator', label: 'Simulador', icon: SlidersHorizontal },
  { id: 'history', label: 'Asambleas', icon: Layers }
];

export default function Header({
  activeView,
  onSelectView,
  meta,
  programa,
  grupo
}) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B1319]/90 backdrop-blur-xl border-b border-brand-200/60 dark:border-emerald-500/20 shadow-[0_4px_24px_-12px_rgba(5,124,63,0.10)] dark:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.65)] transition-colors">
        {/* Institutional Corporate Blue-to-Green Top Hairline (matches official logo top bar) */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#01518c] via-brand-600 to-emerald-400" />

        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Official Fonbienes Brand Logo + Discreet Program Context */}
          <button
            type="button"
            onClick={() => onSelectView('executive')}
            className="flex items-center gap-2.5 sm:gap-3.5 text-left group focus:outline-none min-w-0"
          >
            <FonbienesLogo
              variant="auto"
              className="h-7 sm:h-8 md:h-9 w-auto shrink-0 transition-transform duration-200 group-hover:scale-[1.02]"
            />

            <div className="hidden sm:block h-7 w-px bg-slate-200/80 dark:bg-slate-700/70 shrink-0" />

            <div className="hidden sm:block min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-emerald-500/15 border border-brand-200/70 dark:border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:text-emerald-300">
                  {programa} · Grupo {grupo}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {meta?.totalAsambleas ?? 0} asambleas · Cierre{' '}
                <span className="font-medium text-brand-700 dark:text-emerald-300">
                  {meta?.ultimaActualizacion || 'vigente'}
                </span>
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-1 bg-slate-50/90 dark:bg-slate-800/70 p-1 rounded-full border border-slate-200/70 dark:border-slate-700/70"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-700 dark:from-emerald-600 dark:to-brand-600 text-white font-semibold shadow-sm shadow-brand-700/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-emerald-300 hover:bg-brand-50/60 dark:hover:bg-slate-700/60 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.9]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Utility Cluster: SMV Verification + Unobtrusive Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-brand-800 dark:text-emerald-300 bg-gradient-to-r from-brand-50 to-white dark:from-emerald-950/60 dark:to-slate-900/80 border border-brand-200/80 dark:border-emerald-500/30 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden lg:inline">Supervisado SMV</span>
              <span className="lg:hidden">SMV</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0B1319]/95 backdrop-blur-xl border-t border-brand-200/70 dark:border-emerald-500/20 shadow-[0_-6px_24px_-12px_rgba(5,124,63,0.14)] dark:shadow-[0_-6px_24px_-10px_rgba(0,0,0,0.7)] px-3 py-1.5 transition-colors"
      >
        <div className="grid grid-cols-3 gap-1.5 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-b from-brand-50 to-brand-100/70 dark:from-emerald-500/20 dark:to-emerald-600/10 text-brand-800 dark:text-emerald-300 font-semibold border border-brand-200/80 dark:border-emerald-500/35 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-emerald-300 font-medium border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 stroke-[2] ${
                    isActive ? 'text-brand-600 dark:text-emerald-400' : ''
                  }`}
                />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
