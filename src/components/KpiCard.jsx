import React from 'react';

export default function KpiCard({ label, value, unit, context, accentContext }) {
  return (
    <article className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-ambient border border-slate-100/90 transition-shadow duration-300 hover:shadow-ambient-hover flex flex-col justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[30px] sm:text-[34px] font-bold tracking-[-0.03em] text-slate-900 tabular-nums leading-none">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-slate-400 tracking-normal">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(context || accentContext) && (
        <p className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500 leading-relaxed">
          {accentContext && (
            <span className="font-semibold text-brand-700 mr-1 tabular-nums">
              {accentContext}
            </span>
          )}
          <span>{context}</span>
        </p>
      )}
    </article>
  );
}

