import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { formatUsd } from '../domain/fonbienesAnalytics';
import { useTheme } from '../context/ThemeContext';

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

function TrendChartPlot({
  asambleas,
  config,
  mode,
  selectedAssemblyNro,
  onSelectAssembly,
  enlarged = false,
  gradientId = 'fbTrendGradient'
}) {
  const { isDark } = useTheme();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(enlarged ? 920 : 720);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w && w > 180) setMeasuredWidth(Math.round(w));
    };
    update();
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 180) setMeasuredWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [enlarged]);

  const width = enlarged ? Math.max(660, measuredWidth) : measuredWidth;
  const isCompact = !enlarged && width < 480;
  const height = enlarged ? 410 : isCompact ? 255 : 320;

  const pad = {
    top: enlarged ? 34 : 24,
    right: isCompact ? 14 : 26,
    bottom: enlarged ? 42 : 36,
    left: isCompact ? 38 : 48
  };
  const plotW = Math.max(140, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;

  const { pandero, maquisistema } = config.competidores;

  // Theme-adaptive SVG colors
  const primaryStroke = isDark ? '#34D399' : '#057c3f';
  const gridStroke = isDark ? 'rgba(148, 163, 184, 0.12)' : '#ECF4EF';
  const maquiRefStroke = isDark ? '#475569' : '#CBD5E1';
  const panderoRefStroke = isDark ? '#64748B' : '#94A3B8';
  const hoverLineStroke = isDark ? 'rgba(52, 211, 153, 0.35)' : '#B0EACB';
  const nodeBaseFill = isDark ? '#0B1319' : '#ffffff';
  const sorteoBarFill = isDark ? 'rgba(52, 211, 153, 0.36)' : '#B0EACB';

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

      const points = asambleas.map((a, idx) => ({
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
      const barW = Math.min(enlarged ? 44 : 34, Math.max(12, slotW * 0.54));

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

    const rawMax = Math.max(4, ...asambleas.map((a) => a.totalTitulares));
    const yMax = rawMax + 1;
    const yScale = (val) => pad.top + plotH - (val / yMax) * plotH;
    const slotW = plotW / Math.max(1, count);
    const barW = Math.min(enlarged ? 42 : 32, Math.max(12, slotW * 0.5));

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
  }, [
    asambleas,
    mode,
    plotW,
    plotH,
    pad.left,
    pad.top,
    enlarged,
    maquisistema.cuotasRemateRef
  ]);

  const activeItem = useMemo(() => {
    if (hoveredIdx === null) return null;
    if (mode === 'cuotas') return chartData.points?.[hoveredIdx] || null;
    return chartData.bars?.[hoveredIdx] || null;
  }, [hoveredIdx, mode, chartData]);

  const shouldShowXLabel = (idx, total) => {
    if (enlarged || !isCompact || total <= 6) return true;
    if (idx === 0 || idx === total - 1) return true;
    return idx % 2 === 0;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${
        enlarged ? 'overflow-x-auto pb-1' : ''
      }`}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <div style={{ width: enlarged ? `${width}px` : '100%' }} className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible block"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isDark ? '#10B981' : '#057c3f'}
                stopOpacity={isDark ? '0.28' : '0.22'}
              />
              <stop
                offset="100%"
                stopColor={isDark ? '#10B981' : '#057c3f'}
                stopOpacity="0.01"
              />
            </linearGradient>
            <linearGradient id={`${gradientId}-bar`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? '#34D399' : '#0a9950'} />
              <stop offset="100%" stopColor={isDark ? '#059669' : '#046332'} />
            </linearGradient>
          </defs>

          {/* Subtle Y guide lines */}
          {chartData.ticks.map((tick) => {
            const y = chartData.yScale(tick);
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke={gridStroke}
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[11px] tabular-nums"
                >
                  {chartData.formatTick(tick)}
                </text>
              </g>
            );
          })}

          {/* Mode 1: Smooth Monotone Line + Competitor Ceilings */}
          {mode === 'cuotas' && (
            <>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={chartData.yScale(maquisistema.cuotasRemateRef)}
                y2={chartData.yScale(maquisistema.cuotasRemateRef)}
                stroke={maquiRefStroke}
                strokeWidth="1.25"
                strokeDasharray="2 4"
              />
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={chartData.yScale(pandero.cuotasRemateRef)}
                y2={chartData.yScale(pandero.cuotasRemateRef)}
                stroke={panderoRefStroke}
                strokeWidth="1.25"
                strokeDasharray="5 5"
              />

              {chartData.areaPath && (
                <path d={chartData.areaPath} fill={`url(#${gradientId})`} />
              )}

              <path
                d={chartData.linePath}
                fill="none"
                stroke={primaryStroke}
                strokeWidth={enlarged ? '3' : '2.5'}
                strokeLinecap="round"
              />

              {activeItem && (
                <line
                  x1={activeItem.x}
                  x2={activeItem.x}
                  y1={pad.top}
                  y2={pad.top + plotH}
                  stroke={hoverLineStroke}
                  strokeWidth="1.2"
                />
              )}

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
                            ? 'fill-brand-800 dark:fill-emerald-300 font-bold'
                            : 'fill-slate-400 dark:fill-slate-400'
                        }`}
                      >
                        {isCompact ? `A${pt.asamblea.nro}` : pt.asamblea.mesShort}
                      </text>
                    )}

                    {enlarged && (
                      <text
                        x={pt.x}
                        y={pt.y - 11}
                        textAnchor="middle"
                        className="fill-brand-800 dark:fill-emerald-300 text-[11px] font-bold tabular-nums"
                      >
                        {pt.val}c
                      </text>
                    )}

                    {(isSelected || isHovered) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="9"
                        fill={primaryStroke}
                        fillOpacity="0.20"
                      />
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected || isHovered ? 5.5 : enlarged ? 4.5 : 3.5}
                      fill={isSelected || isHovered ? primaryStroke : nodeBaseFill}
                      stroke={primaryStroke}
                      strokeWidth="2.3"
                    />

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
                    fill={`url(#${gradientId}-bar)`}
                    fillOpacity={dimmed ? 0.28 : isHovered || isSelected ? 1 : 0.86}
                    className="transition-opacity duration-200"
                  />
                  {enlarged && (
                    <text
                      x={bar.x}
                      y={bar.y - 8}
                      textAnchor="middle"
                      className="fill-brand-800 dark:fill-emerald-300 text-[11px] font-bold tabular-nums"
                    >
                      {formatUsd(bar.asamblea.capitalEntregado, { compact: true })}
                    </text>
                  )}
                  {shouldShowXLabel(idx, chartData.bars.length) && (
                    <text
                      x={bar.x}
                      y={height - 10}
                      textAnchor="middle"
                      className={`text-[11px] tabular-nums ${
                        isSelected || isHovered
                          ? 'fill-brand-800 dark:fill-emerald-300 font-bold'
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
                      fill={`url(#${gradientId}-bar)`}
                    />
                  )}
                  {bar.sorteoH > 0 && (
                    <rect
                      x={bar.barX}
                      y={bar.sorteoY}
                      width={bar.barW}
                      height={Math.max(0, bar.sorteoH - 1.5)}
                      rx="4"
                      fill={sorteoBarFill}
                    />
                  )}
                  {enlarged && (
                    <text
                      x={bar.x}
                      y={bar.y - 8}
                      textAnchor="middle"
                      className="fill-brand-800 dark:fill-emerald-300 text-[11px] font-bold tabular-nums"
                    >
                      {bar.asamblea.totalTitulares}
                    </text>
                  )}
                  {shouldShowXLabel(idx, chartData.bars.length) && (
                    <text
                      x={bar.x}
                      y={height - 10}
                      textAnchor="middle"
                      className={`text-[11px] tabular-nums ${
                        isSelected || isHovered
                          ? 'fill-brand-800 dark:fill-emerald-300 font-bold'
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

        {/* Custom HTML Card Tooltip */}
        {activeItem && (
          <div
            style={{
              left: `${Math.min(Math.max(activeItem.x, 108), width - 108)}px`,
              top: `${Math.max(8, activeItem.y - 12)}px`,
              transform: 'translate(-50%, -100%)'
            }}
            className="pointer-events-none absolute z-20 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-tooltip border border-brand-200/80 dark:border-emerald-500/35 transition-all duration-150"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-emerald-400">
              <span>Asamblea {activeItem.asamblea.nro}</span>
              <span className="tabular-nums text-slate-400">
                {activeItem.asamblea.fechaFormatted}
              </span>
            </div>

            {mode === 'cuotas' && (
              <div className="mt-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {activeItem.asamblea.minCuotasGanadoras} cuotas
                  </span>
                  <span className="text-xs font-semibold text-brand-700 dark:text-emerald-400 tabular-nums">
                    ({activeItem.asamblea.pctPlazoMin}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {activeItem.asamblea.titularesRemate} titular(es) por remate ·{' '}
                  {formatUsd(activeItem.asamblea.capitalEntregado, { compact: true })} total
                </p>
              </div>
            )}

            {mode === 'capital' && (
              <div className="mt-1.5">
                <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatUsd(activeItem.asamblea.capitalEntregado)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  Entregado a {activeItem.asamblea.totalTitulares} titulares adjudicados
                </p>
              </div>
            )}

            {mode === 'titulares' && (
              <div className="mt-1.5">
                <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {activeItem.asamblea.totalTitulares} titulares
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
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

export default function TrendChart({
  asambleas,
  config,
  selectedAssemblyNro,
  onSelectAssembly
}) {
  const [mode, setMode] = useState('cuotas');
  const [isExpanded, setIsExpanded] = useState(false);
  const { pandero, maquisistema } = config.competidores;

  useEffect(() => {
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded]);

  const chartTitle =
    mode === 'cuotas'
      ? 'Tendencia de cuotas ganadoras en remate'
      : mode === 'capital'
      ? 'Capital adjudicado a titulares por asamblea'
      : 'Titulares adjudicados por modalidad';

  const renderLegend = () => (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
      {mode === 'cuotas' && (
        <>
          <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 dark:bg-emerald-400" />
            FonBienes (corte ganador)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-slate-400 dark:border-slate-500" />
            Ref. Pandero ({pandero.cuotasRemateRef}c)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t border-dotted border-slate-300 dark:border-slate-600" />
            Ref. Maquisistema ({maquisistema.cuotasRemateRef}c)
          </span>
        </>
      )}
      {mode === 'capital' && (
        <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-600 dark:bg-emerald-400" />
          Suma de certificados titulares adjudicados (USD)
        </span>
      )}
      {mode === 'titulares' && (
        <>
          <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-600 dark:bg-emerald-400" />
            Por remate
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-200 dark:bg-emerald-500/40" />
            Por sorteo (0 cuotas)
          </span>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 h-full flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 mb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 dark:text-emerald-400">
                  Evolución Histórica Observada
                </p>
                <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight title-brand-gradient">
                  {chartTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Ampliar gráfico"
                className="sm:hidden shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-emerald-500/15 text-brand-700 dark:text-emerald-300 border border-brand-200 dark:border-emerald-500/30 hover:bg-brand-100 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Ampliar</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 self-start overflow-x-auto no-scrollbar max-w-full">
              <div className="flex items-center gap-1 bg-slate-50/90 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/70 dark:border-slate-700/70">
                {CHART_MODES.map((m) => {
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                        active
                          ? 'bg-brand-600 dark:bg-emerald-600 text-white font-semibold shadow-sm'
                          : 'text-slate-500 dark:text-slate-300 hover:text-brand-800 dark:hover:text-emerald-300 font-medium'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Ampliar gráfico a pantalla completa"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-emerald-500/15 text-brand-800 dark:text-emerald-300 border border-brand-200 dark:border-emerald-500/30 hover:bg-brand-100 dark:hover:bg-emerald-500/25 transition-colors shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
                <span>Ampliar</span>
              </button>
            </div>
          </div>

          {renderLegend()}
        </div>

        <TrendChartPlot
          asambleas={asambleas}
          config={config}
          mode={mode}
          selectedAssemblyNro={selectedAssemblyNro}
          onSelectAssembly={onSelectAssembly}
          enlarged={false}
          gradientId="fbInlineTrend"
        />
      </div>

      {/* Fullscreen Enlarged Lightbox Modal */}
      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada del gráfico"
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm p-2.5 sm:p-6 lg:p-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0D1720] rounded-3xl p-4 sm:p-8 shadow-2xl border border-brand-200 dark:border-emerald-500/30 space-y-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-100 dark:border-emerald-500/20">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-emerald-500/15 border border-brand-200 dark:border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider text-brand-800 dark:text-emerald-300">
                    Vista Ampliada de Detalle · {asambleas.length} Asambleas
                  </span>
                  <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight title-brand-gradient">
                    {chartTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-700">
                    {CHART_MODES.map((m) => {
                      const active = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMode(m.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                            active
                              ? 'bg-brand-600 dark:bg-emerald-600 text-white font-semibold shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-emerald-300 font-medium'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Minimize2 className="w-3.5 h-3.5 hidden sm:inline" />
                    <X className="w-4 h-4 sm:hidden" />
                    <span>Cerrar</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {renderLegend()}
                <span className="sm:hidden text-[11px] font-medium text-brand-700 dark:text-emerald-300 bg-brand-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full">
                  Desliza horizontalmente para inspeccionar cada mes →
                </span>
              </div>

              <TrendChartPlot
                asambleas={asambleas}
                config={config}
                mode={mode}
                selectedAssemblyNro={selectedAssemblyNro}
                onSelectAssembly={onSelectAssembly}
                enlarged={true}
                gradientId="fbModalTrend"
              />

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Toca o haz clic sobre cualquier mes para filtrar el tablero en esa asamblea.
                </span>
                {selectedAssemblyNro !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => onSelectAssembly?.('ALL')}
                    className="font-semibold text-brand-700 dark:text-emerald-400 hover:underline"
                  >
                    Restablecer filtro (ver las {asambleas.length} asambleas)
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
