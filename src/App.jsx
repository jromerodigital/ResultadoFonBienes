import React, { useState } from 'react';
import Header from './components/Header';
import ExecutiveView from './components/ExecutiveView';
import SimulatorView from './components/SimulatorView';
import HistoryView from './components/HistoryView';
import publicSummary from './data/publicSummary.json';

export default function App() {
  const [activeView, setActiveView] = useState('executive');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  const dataset = publicSummary;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-9 pb-24 md:pb-14">
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

      <footer className="hidden md:block border-t border-slate-200/50 py-6 text-center text-xs text-slate-400">
        <span>
          {dataset.config.empresa} · Sistema de Fondos Colectivos supervisado por la SMV · Programa{' '}
          {dataset.config.programa}
        </span>
      </footer>
    </div>
  );
}
