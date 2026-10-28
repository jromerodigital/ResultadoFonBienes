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

  // Effort bar widths normalized to 100% of contractual term
  const fbEffortPct = summary.refPctPlazo;

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Contextual Top Row: Title + Compact Period Selector (replaces 12 crowded chips) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
            Inteligencia Comercial · Plazo {config.plazoMeses} meses ({config.plazoAnios} años)
          </p>
          <h1 className="mt-1 text-2xl sm:text-[28px] font-semibold tracking-[-0.025em] text-slate-900">
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
            className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
              periodFilter === 'ALL'
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Acumulado ({asambleas.length}m)
          </button>

          {summary.latestAsamblea && (
            <button
              type="button"
              onClick={() => onChangePeriod(latestNro)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
                periodFilter === latestNro
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
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
              className="appearance-none bg-white border border-slate-200/80 hover:border-slate-300 rounded-full pl-3.5 pr-8 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-600 transition-colors cursor-pointer tabular-nums"
            >
              <option value="ALL">Todas las asambleas ({asambleas.length})</option>
              {[...asambleas].reverse().map((a) => (
                <option key={a.nro} value={String(a.nro)}>
                  Asamblea {a.nro} · {a.mesLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 4 High-Contrast KPI Cards — Zero visual duplication */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          label={
            summary.isFilteredSingle
              ? 'Corte Ganador de Asamblea'
              : `Corte Última Asamblea (${summary.latestAsamblea?.mesShort || ''})`
          }
          value={summary.refCuotas || '—'}
          unit="cuotas"
          accentContext={`${fbEffortPct}%`}
          context={`del plazo de ${config.plazoMeses} meses`}
        />

        <KpiCard
          label={
            summary.isFilteredSingle
              ? 'Capital Adjudicado (Mes)'
              : 'Capital Total Adjudicado'
          }
          value={formatUsd(summary.capitalTotal, {
            compact: summary.capitalTotal >= 1_000_000
          })}
          unit="USD"
          accentContext={`${summary.totalTitulares} titulares`}
          context={
            summary.isFilteredSingle
              ? `en fecha ${summary.scopedAsamblea?.fechaFormatted}`
              : `en ${asambleas.length} asambleas realizadas`
          }
        />

        <KpiCard
          label="Franja Típica de Remate"
          value={`${summary.rangoIntercuartil.min}–${summary.rangoIntercuartil.max}`}
          unit="cuotas"
          accentContext={`Mediana ${summary.rangoIntercuartil.mediana}c`}
          context={`vs. ${pandero.cuotasRemateRef}c ref. Pandero`}
        />

        <KpiCard
          label="Adjudicación por Sorteo"
          value={summary.totalSorteoTitulares}
          unit={summary.totalSorteoTitulares === 1 ? 'titular' : 'titulares'}
          accentContext="0 cuotas"
          context={`adelantadas · ${formatUsd(summary.capitalSorteo, { compact: true })} USD`}
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

        {/* Restrained Liquidity Effort Comparison */}
        <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-ambient border border-slate-100/90 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Benchmark de Liquidez
            </p>
            <h2 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
              Esfuerzo sobre el plazo
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Proporción del contrato que el cliente necesita adelantar para adjudicar por remate.
            </p>

            <div className="mt-7 space-y-6">
              {/* FonBienes — Single Brand Accent */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-900">
                    FonBienes{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({config.plazoMeses}m)
                    </span>
                  </span>
                  <span className="text-sm font-bold text-brand-700 tabular-nums">
                    {fbEffortPct}% · {summary.refCuotas}c
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, fbEffortPct)}%` }}
                    className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Maquisistema — Calm Neutral Slate */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-500">
                    Maquisistema{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({maquisistema.plazoMeses}m · ref.)
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-500 tabular-nums">
                    {maquisistema.pctPlazoRef}% · {maquisistema.cuotasRemateRef}c
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, maquisistema.pctPlazoRef)}%` }}
                    className="h-full rounded-full bg-slate-300 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Pandero — Calm Neutral Slate */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-500">
                    Pandero{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({pandero.plazoMeses}m · ref.)
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-500 tabular-nums">
                    {pandero.pctPlazoRef}% · {pandero.cuotasRemateRef}c
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, pandero.pctPlazoRef)}%` }}
                    className="h-full rounded-full bg-slate-400 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 leading-snug">
              Calcula el desembolso exacto según el certificado del cliente.
            </span>
            <button
              type="button"
              onClick={onOpenSimulator}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
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

