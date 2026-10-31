import React from 'react';

export default function KpiCard({
  label,
  value,
  unit,
  context,
  accentContext,
  featured = false
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex flex-col justify-between ${
        featured ? 'surface-card-featured' : 'surface-card'
      }`}
    >
      {/* Subtle Top Corporate Accent Bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[3px] ${
          featured
            ? 'bg-gradient-to-r from-[#01518c] via-brand-600 to-emerald-400'
            : 'bg-gradient-to-r from-brand-600/75 via-emerald-400/45 to-transparent'
        }`}
      />

      <div>
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] sm:tracking-[0.08em] text-slate-500 dark:text-slate-400 leading-snug">
          {label}
        </p>
        <div className="mt-2 sm:mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={`text-[23px] sm:text-[34px] font-bold tracking-[-0.03em] tabular-nums leading-none ${
              featured ? 'title-brand-gradient' : 'text-slate-900 dark:text-white'
            }`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[11px] sm:text-sm font-medium text-slate-400 dark:text-slate-400 tracking-normal">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(context || accentContext) && (
        <p className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-brand-100/80 dark:border-emerald-500/15 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
          {accentContext && (
            <span className="font-semibold text-brand-700 dark:text-emerald-400 mr-1 tabular-nums">
              {accentContext}
            </span>
          )}
          <span>{context}</span>
        </p>
      )}
    </article>
  );
}
