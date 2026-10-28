import React from 'react';
import { BarChart3, SlidersHorizontal, Layers, ShieldCheck } from 'lucide-react';

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
      <header className="sticky top-0 z-30 bg-[#FAFAFA]/85 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => onSelectView('executive')}
            className="flex items-center gap-3 text-left group focus:outline-none min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-sm group-hover:bg-brand-700 transition-colors">
              FB
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-tight text-slate-900 truncate">
                  Fonbienes
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {programa} · Grupo {grupo}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {meta?.totalAsambleas ?? 0} asambleas consolidadas · Cierre {meta?.ultimaActualizacion || 'vigente'}
              </p>
            </div>
          </button>

          {/* Desktop Navigation — Translucent active chip, minimal inactive */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 font-medium bg-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.8]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Institutional Verification Badge (Zero data download vectors) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 bg-white border border-slate-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="hidden sm:inline">Supervisado SMV</span>
              <span className="sm:hidden">SMV</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar — Zero cramping, thumb-friendly */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/70 px-3 py-1.5"
      >
        <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-700 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
