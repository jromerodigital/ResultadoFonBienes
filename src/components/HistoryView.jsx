import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import {
  formatUsd,
  calculateMonthlyInstallment,
  calculateRemateDisbursement
} from '../domain/fonbienesAnalytics';

const SCOPE_FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'RECENT_6', label: 'Últimos 6m' },
  { id: 'LOW_BID', label: 'Corte ≤ 28c' }
];

export default function HistoryView({ dataset }) {
  const { config, asambleas } = dataset;
  const latestNro = asambleas[asambleas.length - 1]?.nro ?? null;

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('ALL');
  const [expandedSet, setExpandedSet] = useState(() =>
    latestNro ? new Set([latestNro]) : new Set()
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...asambleas];

    if (scope === 'RECENT_6') {
      list = list.slice(-6);
    } else if (scope === 'LOW_BID') {
      list = list.filter(
        (a) => a.minCuotasGanadoras !== null && a.minCuotasGanadoras <= 28
      );
    }

    if (q) {
      list = list.filter(
        (a) =>
          `asamblea ${a.nro}`.includes(q) ||
          String(a.nro) === q ||
          a.mesLabel.toLowerCase().includes(q) ||
          a.fechaFormatted.includes(q)
      );
    }

    return list.sort((a, b) => b.nro - a.nro);
  }, [asambleas, scope, query]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, a) => ({
        titulares: acc.titulares + (a.totalTitulares || 0),
        capital: acc.capital + (a.capitalEntregado || 0)
      }),
      { titulares: 0, capital: 0 }
    );
  }, [filtered]);

  const allExpanded =
    filtered.length > 0 && filtered.every((a) => expandedSet.has(a.nro));

  const toggleAssembly = (nro) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(nro)) next.delete(nro);
      else next.add(nro);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedSet(new Set());
    } else {
      setExpandedSet(new Set(filtered.map((a) => a.nro)));
    }
  };

  const fbFactor = config.factorTotal ?? 1.2124;

  const renderTitularesBreakdown = (a) => {
    const items = a.resultadosTitulares || [];
    if (items.length === 0) return null;

    return (
      <div className="pt-3 mt-3 border-t border-brand-100/90 dark:border-emerald-500/20 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-brand-800 dark:text-emerald-300">
          <span>Resultados adjudicados · Asamblea N° {a.nro}</span>
          <span>{items.length} titulares</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((item) => {
            const isSorteo = item.modalidad === 'SORTEO';
            const cuotaMensual = calculateMonthlyInstallment(
              item.certificado,
              fbFactor,
              config.plazoMeses
            );
            const desembolsoRemate = isSorteo
              ? 0
              : calculateRemateDisbursement(
                  item.certificado,
                  item.cuotas,
                  fbFactor,
                  config.plazoMeses
                );

            return (
              <div
                key={item.item}
                className={`rounded-xl p-2.5 border flex items-center justify-between gap-2 tabular-nums ${
                  isSorteo
                    ? 'bg-brand-50/75 dark:bg-emerald-950/50 border-brand-200/80 dark:border-emerald-500/35'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        isSorteo
                          ? 'bg-brand-600 dark:bg-emerald-600 text-white'
                          : 'bg-brand-100 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300'
                      }`}
                    >
                      {isSorteo ? 'Sorteo' : 'Remate'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {isSorteo
                        ? '0 cuotas'
                        : `${item.cuotas}c (${item.pctPlazo}%)`}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Cuota: {formatUsd(cuotaMensual, { decimals: 2 })}/m
                    {!isSorteo && ` · Remate: ${formatUsd(desembolsoRemate, { decimals: 2 })}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatUsd(item.certificado)}
                  </span>
                  <span className="block text-[10px] text-slate-400">Certificado</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-5 select-none">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50/90 dark:bg-emerald-500/15 border border-brand-200/80 dark:border-emerald-500/30 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-800 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-emerald-400" />
          <span>
            Consolidado Mensual · {config.programa} (Grupo {config.grupo})
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-[30px] font-bold tracking-[-0.025em] title-brand-gradient leading-tight">
          Resultados por Asamblea
        </h1>
      </div>

      {/* Filter & Grouping Controls */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-brand-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mes o N° de asamblea..."
            className="w-full pl-9 pr-3.5 py-2 rounded-full bg-brand-50/40 dark:bg-slate-900/85 border border-brand-200/70 dark:border-emerald-500/30 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-600 dark:focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1 bg-slate-50/90 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/70 dark:border-slate-700/70">
            {SCOPE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScope(f.id)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  scope === f.id
                    ? 'bg-brand-600 dark:bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-300 hover:text-brand-800 dark:hover:text-emerald-300 font-medium'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleExpandAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-emerald-500/15 text-brand-800 dark:text-emerald-300 border border-brand-200 dark:border-emerald-500/30 hover:bg-brand-100 dark:hover:bg-emerald-500/25 transition-colors"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
            <span>{allExpanded ? 'Compactar todas' : 'Desplegar todas'}</span>
          </button>
        </div>
      </div>

      {/* Subtle Summary Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
        <span>
          Mostrando{' '}
          <strong className="font-semibold text-brand-800 dark:text-emerald-300">
            {filtered.length}
          </strong>{' '}
          de {asambleas.length} asambleas · Toca una asamblea para ver sus adjudicaciones
        </span>
        <span>
          Acumulado:{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            {totals.titulares} titulares · {formatUsd(totals.capital)} USD
          </strong>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            No se encontraron asambleas para este filtro.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setScope('ALL');
            }}
            className="mt-3 text-xs font-semibold text-brand-700 dark:text-emerald-400 hover:underline"
          >
            Mostrar todas las asambleas
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP VIEW: Clean Expandable Per-Assembly Table */}
          <div className="hidden md:block surface-card rounded-3xl px-6 py-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-100 dark:border-emerald-500/20 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <th className="py-4 pr-4">Asamblea</th>
                  <th className="py-4 px-4">Periodo</th>
                  <th className="py-4 px-4 text-right">Sorteo</th>
                  <th className="py-4 px-4 text-right">Remate</th>
                  <th className="py-4 px-4 text-right">Corte Ganador</th>
                  <th className="py-4 px-4 text-right">% Plazo</th>
                  <th className="py-4 px-4 text-right">Capital Entregado</th>
                  <th className="py-4 pl-2 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="text-sm tabular-nums">
                {filtered.map((a) => {
                  const isOpen = expandedSet.has(a.nro);
                  return (
                    <React.Fragment key={a.nro}>
                      <tr
                        onClick={() => toggleAssembly(a.nro)}
                        className={`cursor-pointer transition-colors ${
                          isOpen
                            ? 'bg-brand-50/45 dark:bg-emerald-950/35'
                            : 'border-b border-slate-100/80 dark:border-slate-800/80 last:border-b-0 hover:bg-brand-50/30 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-4 pr-4 font-bold text-slate-900 dark:text-white">
                          Asamblea N° {a.nro}
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            {a.mesLabel}
                          </span>{' '}
                          <span className="text-xs text-slate-400">· {a.fechaFormatted}</span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-300">
                          {a.titularesSorteo}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-300">
                          {a.titularesRemate}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-emerald-500/20 text-brand-700 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-500/35">
                            {a.minCuotasGanadoras} cuotas
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-500 dark:text-slate-400 font-medium">
                          {a.pctPlazoMin}%
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatUsd(a.capitalEntregado)}
                        </td>
                        <td className="py-4 pl-2 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-emerald-400">
                            {isOpen ? (
                              <>
                                <span>Ocultar</span>
                                <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Ver ({a.totalTitulares})</span>
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="border-b border-brand-100 dark:border-emerald-500/20 bg-brand-50/20 dark:bg-emerald-950/20">
                          <td colSpan={8} className="pb-4 px-3">
                            {renderTitularesBreakdown(a)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW: 2-per-row Stacked Cards + Expandable Per-Assembly Results */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {filtered.map((a) => {
              const isOpen = expandedSet.has(a.nro);
              return (
                <article
                  key={a.nro}
                  className={`rounded-2xl p-3.5 tabular-nums transition-all ${
                    isOpen
                      ? 'col-span-2 surface-card-featured'
                      : 'col-span-1 surface-card flex flex-col justify-between cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isOpen) toggleAssembly(a.nro);
                  }}
                >
                  <div
                    onClick={(e) => {
                      if (isOpen) {
                        e.stopPropagation();
                        toggleAssembly(a.nro);
                      }
                    }}
                    className={`flex items-start justify-between gap-1.5 ${
                      isOpen ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:text-emerald-400 truncate">
                        {isOpen ? `${a.mesLabel} · ${a.fechaFormatted}` : a.mesShort}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                        Asamblea N° {a.nro}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={isOpen ? 'Ocultar resultados' : 'Ver resultados'}
                      className="w-6 h-6 rounded-full bg-brand-50 dark:bg-emerald-500/15 border border-brand-200/80 dark:border-emerald-500/35 flex items-center justify-center text-brand-700 dark:text-emerald-300 shrink-0"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-500/35">
                      {a.minCuotasGanadoras}c ({a.pctPlazoMin}%)
                    </span>

                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {formatUsd(a.capitalEntregado)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-brand-100/70 dark:border-emerald-500/15 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {a.titularesRemate} remate · {a.titularesSorteo} sorteo
                    </span>
                    {!isOpen && (
                      <span className="font-semibold text-brand-700 dark:text-emerald-400">
                        Ver →
                      </span>
                    )}
                  </div>

                  {isOpen && renderTitularesBreakdown(a)}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
