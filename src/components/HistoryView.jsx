import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Award,
  Sparkles,
  Users
} from 'lucide-react';
import { formatUsd } from '../domain/fonbienesAnalytics';

const SCOPE_FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'RECENT_6', label: 'Últimos 6m' },
  { id: 'LOW_BID', label: 'Corte ≤ 28c' }
];

function formatCondicionLabel(tipoAdj) {
  const raw = String(tipoAdj || 'TITULAR').trim().toUpperCase();
  if (raw === 'TITULAR') return 'Titular';
  if (raw.startsWith('SUPLENTE')) {
    const suffix = raw.replace('SUPLENTE', '').trim();
    return suffix ? `Suplente ${suffix}` : 'Suplente';
  }
  return raw.charAt(0) + raw.slice(1).toLowerCase();
}

function getOrderedAssemblyResults(assembly, plazoMeses) {
  if (Array.isArray(assembly.resultados) && assembly.resultados.length > 0) {
    return assembly.resultados;
  }
  if (Array.isArray(assembly.resultadosTitulares)) {
    return assembly.resultadosTitulares.map((r, idx) => ({
      item: r.item ?? idx + 1,
      modalidad: r.modalidad,
      tipoAdj: 'TITULAR',
      isTitular: true,
      cuotas: r.cuotas,
      pctPlazo:
        r.pctPlazo ??
        (r.cuotas > 0 && plazoMeses
          ? Number(((r.cuotas / plazoMeses) * 100).toFixed(1))
          : 0),
      certificado: r.certificado
    }));
  }
  return [];
}

export default function HistoryView({ dataset }) {
  const { config, asambleas, registros } = dataset;
  const latestNro = asambleas[asambleas.length - 1]?.nro ?? null;

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('ALL');
  const [showSuplentes, setShowSuplentes] = useState(true);
  const [collapsedSet, setCollapsedSet] = useState(() => new Set());

  // Enrich assemblies dynamically if dataset came from a live local Excel upload
  const enrichedAsambleas = useMemo(() => {
    return asambleas.map((asam) => {
      if (Array.isArray(asam.resultados) && asam.resultados.length > 0) {
        return asam;
      }
      if (!Array.isArray(registros) || registros.length === 0) {
        return {
          ...asam,
          totalSuplentes: asam.totalSuplentes ?? 0,
          resultados: getOrderedAssemblyResults(asam, config.plazoMeses)
        };
      }

      const rows = registros.filter((r) => r.nroAsamblea === asam.nro);
      const suplenteCount = rows.filter((r) => !r.isTitular).length;

      const parseSupRank = (tipo) => {
        const m = String(tipo || '').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 99;
      };
      const groupRank = (r) => {
        if (r.isTitular && r.modalidad === 'SORTEO') return 0;
        if (r.isTitular) return 1;
        return 2;
      };

      const sorted = [...rows].sort((a, b) => {
        const gDiff = groupRank(a) - groupRank(b);
        if (gDiff !== 0) return gDiff;
        if (b.cuotas !== a.cuotas) return b.cuotas - a.cuotas;
        if (!a.isTitular && !b.isTitular) {
          const sDiff = parseSupRank(a.tipoAdj) - parseSupRank(b.tipoAdj);
          if (sDiff !== 0) return sDiff;
        }
        if (b.certificado !== a.certificado) return b.certificado - a.certificado;
        return (a.orden || 0) - (b.orden || 0);
      });

      return {
        ...asam,
        totalSuplentes: suplenteCount,
        resultados: sorted.map((r, idx) => ({
          item: idx + 1,
          modalidad: r.modalidad,
          tipoAdj: r.tipoAdj,
          isTitular: r.isTitular,
          cuotas: r.cuotas,
          pctPlazo:
            r.cuotas > 0
              ? Number(((r.cuotas / config.plazoMeses) * 100).toFixed(1))
              : 0,
          certificado: r.certificado
        }))
      };
    });
  }, [asambleas, registros, config.plazoMeses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...enrichedAsambleas];

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
          `asamblea n° ${a.nro}`.includes(q) ||
          String(a.nro) === q ||
          a.mesLabel.toLowerCase().includes(q) ||
          a.fechaFormatted.includes(q)
      );
    }

    return list.sort((a, b) => b.nro - a.nro);
  }, [enrichedAsambleas, scope, query]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, a) => ({
        titulares: acc.titulares + (a.totalTitulares || 0),
        suplentes: acc.suplentes + (a.totalSuplentes || 0),
        capital: acc.capital + (a.capitalEntregado || 0)
      }),
      { titulares: 0, suplentes: 0, capital: 0 }
    );
  }, [filtered]);

  const allExpanded =
    filtered.length > 0 && filtered.every((a) => !collapsedSet.has(a.nro));

  const toggleAssembly = (nro) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(nro)) next.delete(nro);
      else next.add(nro);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setCollapsedSet(new Set(filtered.map((a) => a.nro)));
    } else {
      setCollapsedSet(new Set());
    }
  };

  return (
    <section className="space-y-5 select-none">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
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
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Orden oficial por periodo: <strong className="font-semibold text-slate-700 dark:text-slate-200">Sorteo</strong>, <strong className="font-semibold text-slate-700 dark:text-slate-200">Remates Titulares</strong> (mayor a menor) y <strong className="font-semibold text-slate-700 dark:text-slate-200">Suplentes</strong>.
          </p>
        </div>
      </div>

      {/* Filter & Display Toolbar */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 lg:max-w-xs">
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
          {/* Period Scope Pills */}
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

          <div className="flex items-center gap-2">
            {/* Suplentes Toggle */}
            <button
              type="button"
              onClick={() => setShowSuplentes((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                showSuplentes
                  ? 'bg-brand-50 dark:bg-emerald-500/15 text-brand-800 dark:text-emerald-300 border-brand-200 dark:border-emerald-500/35'
                  : 'bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{showSuplentes ? 'Con suplentes' : 'Solo titulares'}</span>
            </button>

            {/* Expand / Collapse All */}
            <button
              type="button"
              onClick={toggleExpandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-brand-300 dark:hover:border-emerald-500/40 transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                {allExpanded ? 'Compactar todas' : 'Desplegar todas'}
              </span>
              <span className="sm:hidden">
                {allExpanded ? 'Compactar' : 'Desplegar'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
        <span>
          Mostrando{' '}
          <strong className="font-semibold text-brand-800 dark:text-emerald-300">
            {filtered.length}
          </strong>{' '}
          de {enrichedAsambleas.length} asambleas
        </span>
        <span>
          Adjudicados titulares:{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            {totals.titulares} certificados · {formatUsd(totals.capital)} USD
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
        /* Unified Chronological List per Month/Assembly (Desktop & Mobile) */
        <div className="space-y-4">
          {filtered.map((a) => {
            const isOpen = !collapsedSet.has(a.nro);
            const isLatest = a.nro === latestNro;
            const allRows = a.resultados || [];
            const titularRows = allRows.filter((r) => r.isTitular);
            const suplenteRows = showSuplentes
              ? allRows.filter((r) => !r.isTitular)
              : [];

            return (
              <article
                key={a.nro}
                className={`rounded-2xl sm:rounded-3xl overflow-hidden tabular-nums transition-all ${
                  isLatest ? 'surface-card-featured' : 'surface-card'
                }`}
              >
                {/* Assembly Month Header */}
                <button
                  type="button"
                  onClick={() => toggleAssembly(a.nro)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 hover:bg-brand-50/35 dark:hover:bg-emerald-950/20 transition-colors"
                >
                  <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                        isLatest
                          ? 'bg-brand-600 dark:bg-emerald-600 text-white shadow-sm'
                          : 'bg-brand-50 dark:bg-emerald-500/15 text-brand-800 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-500/30'
                      }`}
                    >
                      Asamblea N° {a.nro}
                    </span>

                    <div className="flex items-baseline gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {a.mesLabel}
                      </h2>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        · {a.fechaFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Winning Cut Badge */}
                    {a.minCuotasGanadoras !== null && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-brand-50 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-500/35">
                        <span className="hidden sm:inline text-brand-600/80 dark:text-emerald-400/90 font-medium">
                          Corte:
                        </span>
                        <span>{a.minCuotasGanadoras} cuotas</span>
                        <span className="hidden md:inline text-brand-600/80 dark:text-emerald-400/80">
                          ({a.pctPlazoMin}%)
                        </span>
                      </span>
                    )}

                    {/* Titular Count / Capital on Desktop */}
                    <div className="hidden sm:flex flex-col items-end leading-tight">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {formatUsd(a.capitalEntregado)} USD
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {a.totalTitulares} titulares
                        {a.totalSuplentes > 0 ? ` · ${a.totalSuplentes} suplentes` : ''}
                      </span>
                    </div>

                    <span
                      className="w-7 h-7 rounded-full bg-slate-100/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                      aria-hidden="true"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Mobile Sub-summary Strip when Collapsed */}
                {!isOpen && (
                  <div className="sm:hidden px-4 pb-3 -mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {a.totalTitulares} titulares
                      {a.totalSuplentes > 0 ? ` · ${a.totalSuplentes} suplentes` : ''}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Capital titular: {formatUsd(a.capitalEntregado)}
                    </span>
                  </div>
                )}

                {/* Ordered Results List (Desktop & Responsive Mobile) */}
                {isOpen && (
                  <div className="border-t border-brand-100/80 dark:border-emerald-500/20">
                    {/* List Column Header */}
                    <div className="px-4 sm:px-6 py-2 bg-slate-50/90 dark:bg-slate-900/75 border-b border-slate-200/70 dark:border-slate-800 grid grid-cols-[minmax(0,1.4fr)_auto_minmax(76px,auto)] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(130px,0.9fr)_minmax(130px,0.9fr)] items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-400 dark:text-slate-500">
                      <span>Condición</span>
                      <span className="hidden sm:block">Modalidad</span>
                      <span className="text-right">Cuotas</span>
                      <span className="text-right">Certificado</span>
                    </div>

                    {/* 1) SORTEO + 2) REMATES TITULARES (Highest to Lowest) */}
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {titularRows.map((row, index) => {
                        const isSorteo = row.modalidad === 'SORTEO';

                        return (
                          <li
                            key={`titular-${a.nro}-${row.item}-${index}`}
                            className={`px-4 sm:px-6 py-2.5 sm:py-3 grid grid-cols-[minmax(0,1.4fr)_auto_minmax(76px,auto)] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(130px,0.9fr)_minmax(130px,0.9fr)] items-center gap-2 sm:gap-4 transition-colors ${
                              isSorteo
                                ? 'bg-brand-50/45 dark:bg-emerald-950/30 hover:bg-brand-50/75 dark:hover:bg-emerald-950/45'
                                : 'bg-white/70 dark:bg-slate-900/30 hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Col 1: Order + Condición (+ compact Modalidad tag on mobile) */}
                            <div className="min-w-0 flex items-center gap-2 sm:gap-2.5">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                  isSorteo
                                    ? 'bg-brand-600 dark:bg-emerald-500 text-white'
                                    : 'bg-brand-100 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300'
                                }`}
                              >
                                {index + 1}
                              </span>

                              <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                                {/* Mobile-only inline modality pill */}
                                <span
                                  className={`sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                    isSorteo
                                      ? 'bg-brand-600 dark:bg-emerald-600 text-white'
                                      : 'bg-brand-100/90 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300'
                                  }`}
                                >
                                  {isSorteo ? 'Sorteo' : 'Remate'}
                                </span>

                                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {formatCondicionLabel(row.tipoAdj)}
                                </span>
                              </div>
                            </div>

                            {/* Col 2 (Desktop): Modalidad */}
                            <div className="hidden sm:flex items-center">
                              {isSorteo ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-brand-600 dark:bg-emerald-600 text-white shadow-sm">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Sorteo</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-brand-50 dark:bg-emerald-500/15 text-brand-800 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-500/30">
                                  <Award className="w-3 h-3 text-brand-600 dark:text-emerald-400" />
                                  <span>Remate</span>
                                </span>
                              )}
                            </div>

                            {/* Col 3: Cuotas (ONLY cuotas, zero dollar bid amount) */}
                            <div className="text-right">
                              {isSorteo ? (
                                <div className="inline-flex flex-col sm:flex-row sm:items-baseline sm:justify-end sm:gap-1.5">
                                  <span className="text-xs sm:text-sm font-bold text-brand-700 dark:text-emerald-400">
                                    0 cuotas
                                  </span>
                                  <span className="hidden md:inline text-[11px] text-brand-600/75 dark:text-emerald-400/70">
                                    (Azar)
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-baseline justify-end gap-1">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {row.cuotas} cuotas
                                  </span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">
                                    ({row.pctPlazo}%)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Col 4: Certificado Obtenido */}
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {formatUsd(row.certificado)}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* 3) SUPLENTES (Ordered by Suplente 1 -> 2 -> 3 / Highest to Lowest Cuotas) */}
                    {suplenteRows.length > 0 && (
                      <div className="border-t border-slate-200/80 dark:border-slate-800">
                        <div className="px-4 sm:px-6 py-1.5 bg-slate-100/75 dark:bg-slate-800/60 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                          <span>Suplentes · Orden de prelación en remate</span>
                          <span>{suplenteRows.length} en reserva</span>
                        </div>

                        <ul className="divide-y divide-slate-100/90 dark:divide-slate-800/70 bg-slate-50/45 dark:bg-slate-900/55">
                          {suplenteRows.map((row, idx) => {
                            const orderNumber = titularRows.length + idx + 1;
                            return (
                              <li
                                key={`suplente-${a.nro}-${row.item}-${idx}`}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 grid grid-cols-[minmax(0,1.4fr)_auto_minmax(76px,auto)] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(130px,0.9fr)_minmax(130px,0.9fr)] items-center gap-2 sm:gap-4 hover:bg-slate-100/70 dark:hover:bg-slate-800/45 transition-colors"
                              >
                                {/* Col 1: Order + Suplente Role */}
                                <div className="min-w-0 flex items-center gap-2 sm:gap-2.5">
                                  <span className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {orderNumber}
                                  </span>

                                  <div className="min-w-0 flex items-center gap-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                                      {formatCondicionLabel(row.tipoAdj)}
                                    </span>
                                    <span className="sm:hidden text-[10px] text-slate-400 dark:text-slate-500">
                                      · Remate
                                    </span>
                                  </div>
                                </div>

                                {/* Col 2 (Desktop): Modalidad */}
                                <div className="hidden sm:flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-700">
                                    Remate · Reserva
                                  </span>
                                </div>

                                {/* Col 3: Cuotas */}
                                <div className="text-right">
                                  <div className="inline-flex items-baseline justify-end gap-1">
                                    <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                                      {row.cuotas} cuotas
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                                      ({row.pctPlazo}%)
                                    </span>
                                  </div>
                                </div>

                                {/* Col 4: Certificado */}
                                <div className="text-right">
                                  <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {formatUsd(row.certificado)}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
