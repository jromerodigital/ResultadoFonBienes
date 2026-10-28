import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatUsd } from '../domain/fonbienesAnalytics';

/**
 * Computes a smooth Fritsch-Carlson monotone cubic Bezier SVG path through points [{x, y}]
 */
function buildMonotoneCubicPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const n = points.length;
  const dx = [];
  const dy = [];
  const slopes = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    slopes.push(dx[i] !== 0 ? dy[i] / dx[i] : 0);
  }

  const tangents = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents.push(0);
    } else {
      tangents.push((slopes[i - 1] + slopes[i]) / 2);
    }
  }
  tangents.push(slopes[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / slopes[i];
      const beta = tangents[i + 1] / slopes[i];
      const magSq = alpha * alpha + beta * beta;
      if (magSq > 9) {
        const tau = 3 / Math.sqrt(magSq);
        tangents[i] = tau * alpha * slopes[i];
        tangents[i + 1] = tau * beta * slopes[i];
      }
    }
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const cp1x = points[i].x + h;
    const cp1y = points[i].y + tangents[i] * h;
    const cp2x = points[i + 1].x - h;
    const cp2y = points[i + 1].y - tangents[i + 1] * h;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }

  return path;
}

const CHART_MODES = [
  { id: 'cuotas', label: 'Cuotas de remate' },
  { id: 'capital', label: 'Capital entregado' },
  { id: 'titulares', label: 'Titulares' }
];

export default function TrendChart({
  asambleas,
  config,
  selectedAssemblyNro,
  onSelectAssembly
}) {
  const [mode, setMode] = useState('cuotas');
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 180) setWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isCompact = width < 480;
  const height = isCompact ? 270 : 320;
  const pad = {
    top: 24,
    right: isCompact ? 16 : 24,
    bottom: 36,
    left: isCompact ? 38 : 46
  };
  const plotW = Math.max(120, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;

  const { pandero, maquisistema } = config.competidores;

  const chartData = useMemo(() => {
    const count = asambleas.length;
    const stepX = count > 1 ? plotW / (count - 1) : plotW / 2;

    if (mode === 'cuotas') {
      const yMax = Math.max(
        75,
        maquisistema.cuotasRemateRef + 8,
        ...asambleas.map((a) => a.minCuotasGanadoras || 0)
      );
      const yScale = (val) => pad.top + plotH - (val / yMax) * plotH;

      const points = asambleas
        .map((a, idx) => ({
          idx,
          asamblea: a,
          val: a.minCuotasGanadoras ?? 0,
          x: count > 1 ? pad.left + idx * stepX : pad.left + plotW / 2,
          y: yScale(a.minCuotasGanadoras ?? 0)
        }));

      const linePath = buildMonotoneCubicPath(points);
      const areaPath =
        points.length > 1
          ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(pad.top + plotH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(pad.top + plotH).toFixed(2)} Z`
          : '';

      const ticks = [0, 25, 50, 75].filter((t) => t <= yMax);
      return {
        yMax,
        yScale,
        points,
        linePath,
        areaPath,
        ticks,
        formatTick: (t) => `${t}c`
      };
    }

    if (mode === 'capital') {
      const rawMax = Math.max(100000, ...asambleas.map((a) => a.capitalEntregado));
      const yMax = Math.ceil(rawMax / 50000) * 50000;
      const yScale = (val) => pad.top + plotH - (val / yMax) * plotH;
      const slotW = plotW / Math.max(1, count);
      const barW = Math.min(34, Math.max(12, slotW * 0.52));

      const bars = asambleas.map((a, idx) => {
        const cx = pad.left + slotW * idx + slotW / 2;
        const y = yScale(a.capitalEntregado);
        return {
          idx,
          asamblea: a,
          x: cx,
          barX: cx - barW / 2,
          barW,
          y,
          barH: Math.max(2, pad.top + plotH - y)
        };
      });

      const ticks = [0, Math.round(yMax / 2), yMax];
      return {
        yMax,
        yScale,
        bars,
        ticks,
        formatTick: (t) => (t === 0 ? '$0' : `$${Math.round(t / 1000)}k`)
      };
    }

    // mode === 'titulares'
    const rawMax = Math.max(4, ...asambleas.map((a) => a.totalTitulares));
    const yMax = rawMax + 1;
    const yScale = (val) => pad.top + plotH - (val / yMax) * plotH;
    const slotW = plotW / Math.max(1, count);
    const barW = Math.min(32, Math.max(12, slotW * 0.5));

    const bars = asambleas.map((a, idx) => {
      const cx = pad.left + slotW * idx + slotW / 2;
      const remateH = (a.titularesRemate / yMax) * plotH;
      const sorteoH = (a.titularesSorteo / yMax) * plotH;
      const baseline = pad.top + plotH;

      return {
        idx,
        asamblea: a,
        x: cx,
        barX: cx - barW / 2,
        barW,
        remateY: baseline - remateH,
        remateH,
        sorteoY: baseline - remateH - sorteoH,
        sorteoH,
        y: baseline - remateH - sorteoH
      };
    });

    const ticks = Array.from({ length: yMax + 1 }, (_, i) => i).filter(
      (i) => i % 2 === 0 || yMax <= 5
    );
    return {
      yMax,
      yScale,
      bars,
      ticks,
      formatTick: (t) => `${t}`
    };
  }, [asambleas, mode, plotW, plotH, pad.left, pad.top, maquisistema.cuotasRemateRef]);

  const activeItem = useMemo(() => {
    if (hoveredIdx === null) return null;
    if (mode === 'cuotas') return chartData.points?.[hoveredIdx] || null;
    return chartData.bars?.[hoveredIdx] || null;
  }, [hoveredIdx, mode, chartData]);

  // Decide which X-axis labels to show on compact mobile screens so they NEVER collide
  const shouldShowXLabel = (idx, total) => {
    if (!isCompact || total <= 6) return true;
    if (idx === 0 || idx === total - 1) return true;
    return idx % 2 === 0;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-ambient border border-slate-100/90 flex flex-col justify-between">
      {/* Header + Minimalist Perspective Chips */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Evolución Histórica Observada
          </p>
          <h2 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
            {mode === 'cuotas' && 'Tendencia de cuotas ganadoras en remate'}
            {mode === 'capital' && 'Capital adjudicado a titulares por asamblea'}
            {mode === 'titulares' && 'Titulares adjudicados por modalidad'}
          </h2>
        </div>

        <div className="flex items-center gap-1 self-start overflow-x-auto no-scrollbar max-w-full">
          {CHART_MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-800 font-medium bg-transparent'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle inline legend — quiet, zero boxes */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400 mb-2">
        {mode === 'cuotas' && (
          <>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
              FonBienes (corte ganador)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t border-dashed border-slate-400" />
              Ref. Pandero ({pandero.cuotasRemateRef}c)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t border-dotted border-slate-300" />
              Ref. Maquisistema ({maquisistema.cuotasRemateRef}c)
            </span>
          </>
        )}
        {mode === 'capital' && (
          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-600" />
            Suma de certificados titulares (USD)
          </span>
        )}
        {mode === 'titulares' && (
          <>
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-600" />
              Por remate
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
              Por sorteo (0 cuotas)
            </span>
          </>
        )}
      </div>

      {/* Responsive SVG Plot + Custom Floating HTML Tooltip */}
      <div
        ref={containerRef}
        className="relative w-full select-none"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible block"
        >
          <defs>
            <linearGradient id="fbTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#057c3f" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#057c3f" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Ultra-faint Y guide lines (#F1F5F9) — Zero X grid lines */}
          {chartData.ticks.map((tick) => {
            const y = chartData.yScale(tick);
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] tabular-nums"
                >
                  {chartData.formatTick(tick)}
                </text>
              </g>
            );
          })}

          {/* Mode 1: Smooth Monotone Line + Competitor Ceilings */}
          {mode === 'cuotas' && (
            <>
              {/* Maquisistema Ref Line */}
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={chartData.yScale(maquisistema.cuotasRemateRef)}
                y2={chartData.yScale(maquisistema.cuotasRemateRef)}
                stroke="#CBD5E1"
                strokeWidth="1.25"
                strokeDasharray="2 4"
              />
              {/* Pandero Ref Line */}
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={chartData.yScale(pandero.cuotasRemateRef)}
                y2={chartData.yScale(pandero.cuotasRemateRef)}
                stroke="#94A3B8"
                strokeWidth="1.25"
                strokeDasharray="5 5"
              />

              {/* Soft Gradient Area */}
              {chartData.areaPath && (
                <path d={chartData.areaPath} fill="url(#fbTrendGradient)" />
              )}

              {/* Monotone Trend Curve */}
              <path
                d={chartData.linePath}
                fill="none"
                stroke="#057c3f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Hover Vertical Hairline */}
              {activeItem && (
                <line
                  x1={activeItem.x}
                  x2={activeItem.x}
                  y1={pad.top}
                  y2={pad.top + plotH}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
              )}

              {/* Data Nodes & Interactive Hit Columns */}
              {chartData.points.map((pt, idx) => {
                const isSelected =
                  selectedAssemblyNro !== 'ALL' &&
                  Number(selectedAssemblyNro) === pt.asamblea.nro;
                const isHovered = hoveredIdx === idx;
                const colWidth = plotW / Math.max(1, chartData.points.length);

                return (
                  <g key={pt.asamblea.nro}>
                    {shouldShowXLabel(idx, chartData.points.length) && (
                      <text
                        x={pt.x}
                        y={height - 10}
                        textAnchor="middle"
                        className={`text-[11px] tabular-nums transition-colors ${
                          isSelected || isHovered
                            ? 'fill-slate-900 font-semibold'
                            : 'fill-slate-400'
                        }`}
                      >
                        {isCompact ? `A${pt.asamblea.nro}` : pt.asamblea.mesShort}
                      </text>
                    )}

                    {(isSelected || isHovered) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="#057c3f"
                        fillOpacity="0.14"
                      />
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected || isHovered ? 5 : 3.5}
                      fill={isSelected || isHovered ? '#057c3f' : '#ffffff'}
                      stroke="#057c3f"
                      strokeWidth="2.2"
                    />

                    {/* Wide transparent touch/hover hit zone */}
                    <rect
                      x={pt.x - colWidth / 2}
                      y={pad.top}
                      width={colWidth}
                      height={plotH + 28}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onTouchStart={() => setHoveredIdx(idx)}
                      onClick={() =>
                        onSelectAssembly?.(
                          isSelected ? 'ALL' : String(pt.asamblea.nro)
                        )
                      }
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Mode 2: Capital Entregado Bars */}
          {mode === 'capital' &&
            chartData.bars.map((bar, idx) => {
              const isSelected =
                selectedAssemblyNro !== 'ALL' &&
                Number(selectedAssemblyNro) === bar.asamblea.nro;
              const isHovered = hoveredIdx === idx;
              const dimmed =
                selectedAssemblyNro !== 'ALL' && !isSelected && !isHovered;

              return (
                <g key={bar.asamblea.nro}>
                  <rect
                    x={bar.barX}
                    y={bar.y}
                    width={bar.barW}
                    height={bar.barH}
                    rx="6"
                    fill="#057c3f"
                    fillOpacity={dimmed ? 0.25 : isHovered || isSelected ? 1 : 0.82}
                    className="transition-opacity duration-200"
                  />
                  {shouldShowXLabel(idx, chartData.bars.length) && (
                    <text
                      x={bar.x}
                      y={height - 10}
                      textAnchor="middle"
                      className={`text-[11px] tabular-nums ${
                        isSelected || isHovered
                          ? 'fill-slate-900 font-semibold'
                          : 'fill-slate-400'
                      }`}
                    >
                      {isCompact ? `A${bar.asamblea.nro}` : bar.asamblea.mesShort}
                    </text>
                  )}
                  <rect
                    x={bar.barX - 8}
                    y={pad.top}
                    width={bar.barW + 16}
                    height={plotH + 28}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onTouchStart={() => setHoveredIdx(idx)}
                    onClick={() =>
                      onSelectAssembly?.(
                        isSelected ? 'ALL' : String(bar.asamblea.nro)
                      )
                    }
                  />
                </g>
              );
            })}

          {/* Mode 3: Stacked Titulares Bars */}
          {mode === 'titulares' &&
            chartData.bars.map((bar, idx) => {
              const isSelected =
                selectedAssemblyNro !== 'ALL' &&
                Number(selectedAssemblyNro) === bar.asamblea.nro;
              const isHovered = hoveredIdx === idx;
              const dimmed =
                selectedAssemblyNro !== 'ALL' && !isSelected && !isHovered;

              return (
                <g key={bar.asamblea.nro} opacity={dimmed ? 0.3 : 1}>
                  {bar.remateH > 0 && (
                    <rect
                      x={bar.barX}
                      y={bar.remateY}
                      width={bar.barW}
                      height={bar.remateH}
                      rx="4"
                      fill="#057c3f"
                    />
                  )}
                  {bar.sorteoH > 0 && (
                    <rect
                      x={bar.barX}
                      y={bar.sorteoY}
                      width={bar.barW}
                      height={Math.max(0, bar.sorteoH - 1.5)}
                      rx="4"
                      fill="#CBD5E1"
                    />
                  )}
                  {shouldShowXLabel(idx, chartData.bars.length) && (
                    <text
                      x={bar.x}
                      y={height - 10}
                      textAnchor="middle"
                      className={`text-[11px] tabular-nums ${
                        isSelected || isHovered
                          ? 'fill-slate-900 font-semibold'
                          : 'fill-slate-400'
                      }`}
                    >
                      {isCompact ? `A${bar.asamblea.nro}` : bar.asamblea.mesShort}
                    </text>
                  )}
                  <rect
                    x={bar.barX - 8}
                    y={pad.top}
                    width={bar.barW + 16}
                    height={plotH + 28}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onTouchStart={() => setHoveredIdx(idx)}
                    onClick={() =>
                      onSelectAssembly?.(
                        isSelected ? 'ALL' : String(bar.asamblea.nro)
                      )
                    }
                  />
                </g>
              );
            })}
        </svg>

        {/* Custom HTML Card Tooltip — Never overflows mobile edges */}
        {activeItem && (
          <div
            style={{
              left: `${Math.min(
                Math.max(activeItem.x, 105),
                width - 105
              )}px`,
              top: `${Math.max(8, activeItem.y - 12)}px`,
              transform: 'translate(-50%, -100%)'
            }}
            className="pointer-events-none absolute z-20 w-52 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-tooltip border border-slate-100 transition-all duration-150"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Asamblea {activeItem.asamblea.nro}</span>
              <span className="tabular-nums">{activeItem.asamblea.fechaFormatted}</span>
            </div>

            {mode === 'cuotas' && (
              <div className="mt-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    {activeItem.asamblea.minCuotasGanadoras} cuotas
                  </span>
                  <span className="text-xs font-medium text-brand-700 tabular-nums">
                    ({activeItem.asamblea.pctPlazoMin}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
                  {activeItem.asamblea.titularesRemate} titular(es) por remate ·{' '}
                  {formatUsd(activeItem.asamblea.capitalEntregado, { compact: true })} total
                </p>
              </div>
            )}

            {mode === 'capital' && (
              <div className="mt-1.5">
                <div className="text-xl font-bold text-slate-900 tabular-nums">
                  {formatUsd(activeItem.asamblea.capitalEntregado)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
                  Entregado a {activeItem.asamblea.totalTitulares} titulares adjudicados
                </p>
              </div>
            )}

            {mode === 'titulares' && (
              <div className="mt-1.5">
                <div className="text-xl font-bold text-slate-900 tabular-nums">
                  {activeItem.asamblea.totalTitulares} titulares
                </div>
                <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
                  {activeItem.asamblea.titularesRemate} remate ·{' '}
                  {activeItem.asamblea.titularesSorteo} sorteo gratuito
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

