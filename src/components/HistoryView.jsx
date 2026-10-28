import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { formatUsd } from '../domain/fonbienesAnalytics';

const SCOPE_FILTERS = [
  { id: 'ALL', label: 'Todas las asambleas' },
  { id: 'RECENT_6', label: 'Últimos 6 meses' },
  { id: 'LOW_BID', label: 'Corte ≤ 28 cuotas' }
];

export default function HistoryView({ dataset }) {
  const { config, asambleas } = dataset;
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('ALL');

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

  return (
    <section className="space-y-6 select-none">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
          Consolidado Mensual Verificado · {config.programa} (Grupo {config.grupo})
        </p>
        <h1 className="mt-1 text-2xl sm:text-[28px] font-semibold tracking-[-0.025em] text-slate-900">
          Resumen por Asamblea
        </h1>
      </div>

      {/* Minimalist Filter Controls */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-ambient border border-slate-100/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mes o N° de asamblea..."
            className="w-full pl-9 pr-3.5 py-2 rounded-full bg-slate-50/90 border border-slate-200/60 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {SCOPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setScope(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
                scope === f.id
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-800 font-medium'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subtle Summary Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400 tabular-nums">
        <span>
          Mostrando <strong className="font-semibold text-slate-700">{filtered.length}</strong> de{' '}
          {asambleas.length} asambleas
        </span>
        <span>
          Acumulado en vista:{' '}
          <strong className="font-semibold text-slate-700">
            {totals.titulares} titulares · {formatUsd(totals.capital)} USD
          </strong>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-ambient border border-slate-100/90">
          <p className="text-sm font-medium text-slate-600">
            No se encontraron asambleas para este filtro.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setScope('ALL');
            }}
            className="mt-3 text-xs font-semibold text-brand-700 hover:underline"
          >
            Mostrar todas las asambleas
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP VIEW: Strict Dieter Rams Table (No vertical borders, light header, py-4) */}
          <div className="hidden md:block bg-white rounded-3xl px-6 py-2 shadow-ambient border border-slate-100/90 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <th className="py-4 pr-4">Asamblea</th>
                  <th className="py-4 px-4">Periodo</th>
                  <th className="py-4 px-4 text-right">Titulares Sorteo</th>
                  <th className="py-4 px-4 text-right">Titulares Remate</th>
                  <th className="py-4 px-4 text-right">Corte Ganador</th>
                  <th className="py-4 px-4 text-right">% del Plazo</th>
                  <th className="py-4 pl-4 text-right">Capital Entregado</th>
                </tr>
              </thead>
              <tbody className="text-sm tabular-nums">
                {filtered.map((a) => (
                  <tr
                    key={a.nro}
                    className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-4 pr-4 font-semibold text-slate-900">
                      Asamblea {a.nro}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      <span className="text-slate-700 font-medium">{a.mesLabel}</span>{' '}
                      <span className="text-xs text-slate-400">· {a.fechaFormatted}</span>
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600">
                      {a.titularesSorteo}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600">
                      {a.titularesRemate}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                        {a.minCuotasGanadoras} cuotas
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-slate-400">
                      {a.pctPlazoMin}%
                    </td>
                    <td className="py-4 pl-4 text-right font-semibold text-slate-900">
                      {formatUsd(a.capitalEntregado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW: Native Airy Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((a) => (
              <article
                key={a.nro}
                className="bg-white rounded-2xl p-4 shadow-ambient border border-slate-100/90 space-y-3 tabular-nums"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {a.mesLabel} · {a.fechaFormatted}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      Asamblea N° {a.nro}
                    </p>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 shrink-0">
                    {a.minCuotasGanadoras} cuotas ({a.pctPlazoMin}%)
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-50 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {a.titularesRemate} por remate · {a.titularesSorteo} por sorteo
                  </span>

                  <span className="text-base font-bold text-slate-900">
                    {formatUsd(a.capitalEntregado)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
