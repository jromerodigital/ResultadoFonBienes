import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import FonbienesLogo from './components/FonbienesLogo';
import ExecutiveView from './components/ExecutiveView';
import SimulatorView from './components/SimulatorView';
import HistoryView from './components/HistoryView';
import publicSummary from './data/publicSummary.json';

export default function App() {
  const [activeView, setActiveView] = useState('executive');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  const dataset = publicSummary;

  return (
    <ThemeProvider>
      <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col">
        <Header
          activeView={activeView}
          onSelectView={(view) => {
            setActiveView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          meta={dataset.meta}
          programa={dataset.config.programa}
          grupo={dataset.config.grupo}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-24 md:pb-14">
          {activeView === 'executive' && (
            <ExecutiveView
              dataset={dataset}
              periodFilter={periodFilter}
              onChangePeriod={setPeriodFilter}
              onOpenSimulator={() => {
                setActiveView('simulator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeView === 'simulator' && <SimulatorView dataset={dataset} />}

          {activeView === 'history' && <HistoryView dataset={dataset} />}
        </main>

        {/* Institutional Corporate Footer showcasing the White Logo on dark/corporate surface */}
        <footer className="hidden md:block bg-gradient-to-r from-[#04542b] via-[#057c3f] to-[#046332] dark:from-[#081216] dark:via-[#0b1b18] dark:to-[#081216] border-t border-brand-700/40 dark:border-emerald-500/15 py-6 text-white/90">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between gap-4">
            <FonbienesLogo variant="white" className="h-7 w-auto opacity-95" />
            <p className="text-xs text-white/80 dark:text-slate-400">
              Sistema de Fondos Colectivos supervisado por la SMV · Programa{' '}
              <strong className="font-semibold text-white dark:text-emerald-300">
                {dataset.config.programa} (Grupo {dataset.config.grupo})
              </strong>
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
