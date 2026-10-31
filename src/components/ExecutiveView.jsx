import React, { useMemo } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import KpiCard from './KpiCard';
import TrendChart from './TrendChart';
import { computeExecutiveSummary, formatUsd } from '../domain/fonbienesAnalytics';

export default function ExecutiveView({
  dataset,
  periodFilter,
  onChangePeriod,
  onOpenSimulator
}) {
  const { config, asambleas } = dataset;
  const summary = useMemo(
    () => computeExecutiveSummary(dataset, periodFilter),
    [dataset, periodFilter]
  );

  const latestNro = summary.latestAsamblea ? String(summary.latestAsamblea.nro) : 'ALL';
  const { pandero, maquisistema } = config.competidores;
  const fbEffortPct = summary.refPctPlazo;
  const { refEjemplo40k } = summary;

  return (
    <section className="space-y-5 sm:space-y-7">
      {/* Contextual Top Row: Gradient Title + Clean Period Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3.5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50/90 dark:bg-emerald-500/15 border border-brand-200/80 dark:border-emerald-500/30 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-800 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-emerald-400" />
            <span>
              Inteligencia Comercial · Plazo {config.plazoMeses} meses ({config.plazoAnios} años)
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-[30px] font-bold tracking-[-0.025em] title-brand-gradient leading-tight">
            {summary.isFilteredSingle
              ? `Asamblea N° ${summary.scopedAsamblea.nro} · ${summary.scopedAsamblea.mesLabel}`
              : 'Panorama de Adjudicaciones'}
          </h1>
        </div>

        {/* Clean Period Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChangePeriod('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all border ${
              periodFilter === 'ALL'
                ? 'bg-brand-50 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300 border-brand-200 dark:border-emerald-500/40 font-semibold shadow-sm'
                : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-brand-200 dark:hover:border-emerald-500/40 hover:text-brand-800 dark:hover:text-emerald-300 font-medium'
            }`}
          >
            Acumulado ({asambleas.length}m)
          </button>

          {summary.latestAsamblea && (
            <button
              type="button"
              onClick={() => onChangePeriod(latestNro)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all border ${
                periodFilter === latestNro
                  ? 'bg-brand-50 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300 border-brand-200 dark:border-emerald-500/40 font-semibold shadow-sm'
                  : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-brand-200 dark:hover:border-emerald-500/40 hover:text-brand-800 dark:hover:text-emerald-300 font-medium'
              }`}
            >
              Última ({summary.latestAsamblea.mesShort})
            </button>
          )}

          <div className="relative">
            <select
              aria-label="Seleccionar asamblea específica"
              value={periodFilter}
              onChange={(e) => onChangePeriod(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-brand-200/80 dark:border-emerald-500/30 hover:border-brand-400 dark:hover:border-emerald-400 rounded-full pl-3.5 pr-8 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-600 dark:focus:border-emerald-400 transition-colors cursor-pointer tabular-nums shadow-sm"
            >
              <option value="ALL">Todas las asambleas ({asambleas.length})</option>
              {[...asambleas].reverse().map((a) => (
                <option key={a.nro} value={String(a.nro)}>
                  Asamblea {a.nro} · {a.mesLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 4 High-Contrast KPI Cards — 2 per row on mobile (2x2), 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <KpiCard
          featured
          label={
            summary.isFilteredSingle
              ? 'Corte Asamblea'
              : `Corte Última (${summary.latestAsamblea?.mesShort || ''})`
          }
          value={summary.refCuotas || '—'}
          unit="cuotas"
          accentContext={`${fbEffortPct}%`}
          context={`de ${config.plazoMeses} meses`}
        />

        <KpiCard
          label={
            summary.isFilteredSingle
              ? 'Capital Entregado'
              : 'Capital Adjudicado'
          }
          value={formatUsd(summary.capitalTotal, {
            compact: summary.capitalTotal >= 1_000_000
          })}
          unit="USD"
          accentContext={`${summary.totalTitulares} titulares`}
          context={
            summary.isFilteredSingle
              ? `${summary.scopedAsamblea?.fechaFormatted}`
              : `en ${asambleas.length} asambleas`
          }
        />

        <KpiCard
          label="Franja de Remate"
          value={`${summary.rangoIntercuartil.min}–${summary.rangoIntercuartil.max}`}
          unit="cuotas"
          accentContext={`Mediana ${summary.rangoIntercuartil.mediana}c`}
          context={`vs. ${pandero.cuotasRemateRef}c Pandero`}
        />

        <KpiCard
          label="Adjudicados Sorteo"
          value={summary.totalSorteoTitulares}
          unit={summary.totalSorteoTitulares === 1 ? 'titular' : 'titulares'}
          accentContext="0 cuotas"
          context={`· ${formatUsd(summary.capitalSorteo, { compact: true })} USD`}
        />
      </div>

      {/* Main Analytical Grid: Minimalist SVG Trend (8 cols) + Liquidity Benchmark (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div className="lg:col-span-8">
          <TrendChart
            asambleas={asambleas}
            config={config}
            selectedAssemblyNro={periodFilter}
            onSelectAssembly={onChangePeriod}
          />
        </div>

        {/* Liquidity Effort & Real Installment Reference Card */}
        <div className="lg:col-span-4 surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 dark:text-emerald-400">
              Benchmark de Liquidez
            </p>
            <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight title-brand-gradient">
              Esfuerzo sobre el plazo
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Proporción del contrato requerida para adjudicar por remate y referencia en base a un certificado de $40,000 USD.
            </p>

            <div className="mt-5 space-y-4">
              {/* FonBienes — Corporate Green Accent */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    FonBienes{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({config.plazoMeses}m)
                    </span>
                  </span>
                  <span className="text-sm font-bold text-brand-700 dark:text-emerald-400 tabular-nums">
                    {fbEffortPct}% · {summary.refCuotas}c
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-brand-100/70 dark:bg-emerald-950/80 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, fbEffortPct)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-400 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Maquisistema */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Maquisistema{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({maquisistema.plazoMeses}m · ref.)
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {maquisistema.pctPlazoRef}% · {maquisistema.cuotasRemateRef}c
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, maquisistema.pctPlazoRef)}%` }}
                    className="h-full rounded-full bg-slate-300 dark:bg-slate-600 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Pandero */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Pandero{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({pandero.plazoMeses}m · ref.)
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {pandero.pctPlazoRef}% · {pandero.cuotasRemateRef}c
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, pandero.pctPlazoRef)}%` }}
                    className="h-full rounded-full bg-slate-400 dark:bg-slate-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Reference Installment & Remate Example ($40,000 Certificate) */}
            <div className="mt-5 rounded-2xl bg-brand-50/60 dark:bg-emerald-950/35 border border-brand-200/75 dark:border-emerald-500/25 p-3.5 space-y-2 tabular-nums">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-brand-800 dark:text-emerald-300">
                <span>Ref. Certificado $40,000</span>
                <span>Cuota · Remate</span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1 border-t border-brand-200/50 dark:border-emerald-500/20">
                <span className="font-semibold text-brand-900 dark:text-white">
                  FonBienes ({summary.refCuotas}c)
                </span>
                <span className="font-bold text-brand-700 dark:text-emerald-400">
                  {formatUsd(refEjemplo40k.fonbienesCuota, { decimals: 2 })}/m ·{' '}
                  {formatUsd(refEjemplo40k.fonbienesRemate, { decimals: 2 })}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Maquisistema ({maquisistema.cuotasRemateRef}c)</span>
                <span>
                  {formatUsd(refEjemplo40k.maquiCuota, { decimals: 2 })}/m ·{' '}
                  {formatUsd(refEjemplo40k.maquiRemate, { decimals: 2 })}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Pandero ({pandero.cuotasRemateRef}c)</span>
                <span>
                  {formatUsd(refEjemplo40k.panderoCuota, { decimals: 2 })}/m ·{' '}
                  {formatUsd(refEjemplo40k.panderoRemate, { decimals: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-brand-100/80 dark:border-emerald-500/15 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Simula certificados desde $40k hasta $300k USD.
            </span>
            <button
              type="button"
              onClick={onOpenSimulator}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-600 to-brand-700 dark:from-emerald-600 dark:to-brand-600 text-white hover:from-brand-700 hover:to-brand-800 shadow-sm shadow-brand-700/20 transition-all"
            >
              <span>Cotizar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
