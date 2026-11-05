import React, { useState, useMemo } from 'react';
import { Check, Copy, Minus, Plus, Compass } from 'lucide-react';
import { simulateCommercialScenario, formatUsd } from '../domain/fonbienesAnalytics';
import { useTheme } from '../context/ThemeContext';

const MIN_SIM_USD = 40000;
const MAX_SIM_USD = 300000;
const STEP_USD = 5000;

export default function SimulatorView({ dataset, onOpenStrategy }) {
  const { isDark } = useTheme();
  const { config } = dataset;
  const latestMinBid =
    dataset.asambleas[dataset.asambleas.length - 1]?.minCuotasGanadoras || 28;

  const presetButtons = useMemo(
    () => (config.presetCertificates || []).filter((v) => v >= 40000 && v <= 100000),
    [config.presetCertificates]
  );

  const [certificado, setCertificado] = useState(40000);
  const [certInput, setCertInput] = useState('40000');
  const [cuotas, setCuotas] = useState(latestMinBid);
  const [copied, setCopied] = useState(false);

  const sim = useMemo(
    () => simulateCommercialScenario(dataset, certificado, cuotas),
    [dataset, certificado, cuotas]
  );

  const handleSelectChip = (val) => {
    setCertificado(val);
    setCertInput(String(val));
  };

  const handleCertInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCertInput(raw);
    if (!raw) return;

    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) return;

    if (num > MAX_SIM_USD) {
      setCertInput(String(MAX_SIM_USD));
      setCertificado(MAX_SIM_USD);
    } else if (num >= 5000) {
      setCertificado(num);
    }
  };

  const handleCertInputBlur = () => {
    const num = parseInt(certInput, 10);
    if (Number.isNaN(num) || num < MIN_SIM_USD) {
      setCertificado(MIN_SIM_USD);
      setCertInput(String(MIN_SIM_USD));
    } else if (num > MAX_SIM_USD) {
      setCertificado(MAX_SIM_USD);
      setCertInput(String(MAX_SIM_USD));
    } else {
      setCertificado(num);
      setCertInput(String(num));
    }
  };

  const handleStepCert = (delta) => {
    const next = Math.min(
      MAX_SIM_USD,
      Math.max(MIN_SIM_USD, Math.round((certificado + delta) / STEP_USD) * STEP_USD)
    );
    setCertificado(next);
    setCertInput(String(next));
  };

  const handleCopyPitch = async () => {
    const msg = [
      `*PROPUESTA INMOBILIARIA FONBIENES (${config.programa})*`,
      `Certificado / Monto: ${formatUsd(sim.certificadoUsd)} USD · Plazo: ${config.plazoMeses} meses (${config.plazoAnios} años)`,
      `Cuota mensual FonBienes: *${formatUsd(sim.fbCuotaMensual, { decimals: 2 })} USD/mes*`,
      ``,
      `*Escenario de Remate (${sim.cuotasOfertadas} cuotas — ${sim.fbPctPlazo}% del plazo):*`,
      `• Desembolso estimado de remate: *${formatUsd(sim.fbDesembolso, { decimals: 2 })} USD*`,
      `• Respaldo histórico Grupo ${config.grupo}: habría igualado o superado el corte ganador en *${sim.backtest.ganadasTotal} de ${sim.backtest.totalEvaluadas} asambleas* realizadas.`,
      ``,
      `*Comparativa referencial de cuotas y remate:*`,
      `• Maquisistema (${sim.maquisistema.plazoMeses}m · cuota ${formatUsd(sim.maquisistema.cuotaMensual, { decimals: 2 })}/mes · ${sim.maquisistema.cuotasRef}c): ${formatUsd(sim.maquisistema.desembolso, { decimals: 2 })} USD`,
      `• Pandero (${sim.pandero.plazoMeses}m · cuota ${formatUsd(sim.pandero.cuotaMensual, { decimals: 2 })}/mes · ${sim.pandero.cuotasRef}c): ${formatUsd(sim.pandero.desembolso, { decimals: 2 })} USD`,
      sim.pandero.ahorroLiquidez > 0
        ? `• Liquidez preservada con FonBienes vs. Pandero: *+${formatUsd(sim.pandero.ahorroLiquidez, { decimals: 2 })} USD*`
        : ``,
      ``,
      `Además, participas cada mes en el sorteo sin adelantar cuotas.`
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = msg;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const sliderPct = ((cuotas - 5) / (66 - 5)) * 100;
  const sliderActiveColor = isDark ? '#10B981' : '#057c3f';
  const sliderTrackColor = isDark ? '#1E293B' : '#E2E8F0';
  const isStandardRange = certificado >= 40000 && certificado <= 80000;

  return (
    <section className="space-y-5 sm:space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50/90 dark:bg-emerald-500/15 border border-brand-200/80 dark:border-emerald-500/30 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-800 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-emerald-400" />
            <span>Herramienta de Cierre Comercial</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-[30px] font-bold tracking-[-0.025em] title-brand-gradient leading-tight">
            Simulador de Liquidez y Remate
          </h1>
        </div>

        {onOpenStrategy && (
          <button
            type="button"
            onClick={onOpenStrategy}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-brand-800 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-500/30 transition-all shadow-xs"
          >
            <Compass className="w-4 h-4 text-brand-600 dark:text-emerald-400" />
            <span>Ver Plan de Estrategia Comercial (Pitch)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Advisor Controls */}
        <div className="lg:col-span-5 surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 space-y-7">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-800 dark:text-emerald-300">
                1. Monto / Certificado
              </label>
              <span className="text-base font-bold text-brand-700 dark:text-emerald-400 tabular-nums">
                {formatUsd(certificado)} USD
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Certificados Fonbienes:{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                $40k a $80k
              </strong>{' '}
              (de $5k en $5k). Selección rápida hasta $100k:
            </p>

            {/* 2 Clean Rows of 5 Preset Buttons up to $100k */}
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {presetButtons.map((val) => {
                const isSelected = certificado === val && Number(certInput) === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectChip(val)}
                    className={`py-2 px-1 rounded-xl text-xs tabular-nums transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-b from-brand-600 to-brand-700 dark:from-emerald-600 dark:to-brand-600 text-white border-brand-700 dark:border-emerald-500 font-bold shadow-sm shadow-brand-700/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-emerald-300 bg-white dark:bg-slate-800/80 hover:bg-brand-50/70 dark:hover:bg-slate-800 border-brand-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-emerald-500/40 font-medium'
                    }`}
                  >
                    ${val / 1000}k
                  </button>
                );
              })}
            </div>

            {/* Synchronized Amount Input Box (Up to $300,000 USD) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="customCertInput"
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Monto seleccionado o personalizado (hasta $300,000)
                </label>
                <span className="text-[10px] font-semibold text-brand-700 dark:text-emerald-300 bg-brand-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-brand-200/70 dark:border-emerald-500/30">
                  {isStandardRange ? 'Rango estándar' : 'Simulación extendida'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepCert(-STEP_USD)}
                  disabled={certificado <= MIN_SIM_USD}
                  aria-label="Disminuir $5,000"
                  className="h-11 w-11 shrink-0 rounded-2xl bg-white dark:bg-slate-800 border border-brand-200/80 dark:border-emerald-500/30 hover:border-brand-400 dark:hover:border-emerald-400 hover:bg-brand-50/60 dark:hover:bg-slate-700/80 disabled:opacity-40 flex items-center justify-center text-brand-700 dark:text-emerald-300 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-700 dark:text-emerald-400">
                    $
                  </span>
                  <input
                    id="customCertInput"
                    type="text"
                    inputMode="numeric"
                    value={certInput}
                    onChange={handleCertInputChange}
                    onBlur={handleCertInputBlur}
                    placeholder="40000 - 300000"
                    className="w-full h-11 pl-8 pr-12 rounded-2xl bg-brand-50/40 dark:bg-slate-900/90 border border-brand-200/90 dark:border-emerald-500/30 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-brand-500/15 transition-all tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    USD
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStepCert(STEP_USD)}
                  disabled={certificado >= MAX_SIM_USD}
                  aria-label="Aumentar $5,000"
                  className="h-11 w-11 shrink-0 rounded-2xl bg-white dark:bg-slate-800 border border-brand-200/80 dark:border-emerald-500/30 hover:border-brand-400 dark:hover:border-emerald-400 hover:bg-brand-50/60 dark:hover:bg-slate-700/80 disabled:opacity-40 flex items-center justify-center text-brand-700 dark:text-emerald-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Cuotas Slider */}
          <div className="pt-6 border-t border-brand-100/80 dark:border-emerald-500/15">
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <label
                htmlFor="cuotasRange"
                className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-800 dark:text-emerald-300"
              >
                2. Cuotas a Ofertar
              </label>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight title-brand-gradient tabular-nums">
                  {cuotas}
                </span>
                <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  cuotas ({sim.fbPctPlazo}%)
                </span>
              </div>
            </div>

            <input
              id="cuotasRange"
              type="range"
              min="5"
              max="66"
              value={cuotas}
              onChange={(e) => setCuotas(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, ${sliderActiveColor} 0%, ${sliderActiveColor} ${sliderPct}%, ${sliderTrackColor} ${sliderPct}%, ${sliderTrackColor} 100%)`
              }}
              className="rams-slider"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5">
              {[
                { val: 22, tag: '22c piso reciente' },
                { val: latestMinBid, tag: `${latestMinBid}c último cierre` },
                { val: 35, tag: '35c cobertura alta' }
              ].map((preset) => (
                <button
                  key={preset.tag}
                  type="button"
                  onClick={() => setCuotas(preset.val)}
                  className={`px-3 py-1 rounded-full text-[11px] tabular-nums transition-all border ${
                    cuotas === preset.val
                      ? 'bg-brand-50 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300 border-brand-200 dark:border-emerald-500/40 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:border-brand-100 dark:hover:border-slate-700 hover:text-brand-700 dark:hover:text-emerald-300 font-medium'
                  }`}
                >
                  {preset.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Evidence-Based Financial Output */}
        <div className="lg:col-span-7 surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-100/80 dark:border-emerald-500/15">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 dark:text-emerald-400">
                Respaldo Histórico ({sim.backtest.totalEvaluadas} Asambleas)
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Con{' '}
                <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {cuotas} cuotas
                </strong>
                , habría igualado o superado el corte ganador en{' '}
                <strong className="font-semibold text-brand-800 dark:text-emerald-300 tabular-nums">
                  {sim.backtest.ganadasTotal} de {sim.backtest.totalEvaluadas}
                </strong>{' '}
                asambleas realizadas.
              </p>
            </div>

            <span
              className={`self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tabular-nums border ${
                sim.backtest.tier === 'high' || sim.backtest.tier === 'competitive'
                  ? 'bg-brand-50 dark:bg-emerald-500/20 text-brand-800 dark:text-emerald-300 border-brand-200 dark:border-emerald-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {sim.backtest.statusLabel} ({sim.backtest.empiricalRate}%)
            </span>
          </div>

          {/* 3 Hero Financial Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/75 border border-brand-200/70 dark:border-emerald-500/20 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400">
                Cuota Mensual
              </p>
              <p className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatUsd(sim.fbCuotaMensual, { decimals: 2 })}
              </p>
              <p className="mt-1 text-[10px] text-slate-400 tabular-nums">
                Plazo {config.plazoMeses} meses
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/75 border border-brand-200/70 dark:border-emerald-500/20 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400">
                Monto Remate
              </p>
              <p className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatUsd(sim.fbDesembolso, { decimals: 2 })}
              </p>
              <p className="mt-1 text-[10px] text-slate-400 tabular-nums">
                {cuotas} cuotas adelantadas
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-brand-50 via-brand-50/80 to-brand-100/70 dark:from-emerald-950/70 dark:via-emerald-900/35 dark:to-slate-900/80 border border-brand-300/80 dark:border-emerald-500/40 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-800 dark:text-emerald-300">
                Liquidez Preservada
              </p>
              <p className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-brand-700 dark:text-emerald-400 tabular-nums">
                {sim.pandero.ahorroLiquidez >= 0
                  ? `+${formatUsd(sim.pandero.ahorroLiquidez, { decimals: 2 })}`
                  : formatUsd(sim.pandero.ahorroLiquidez, { decimals: 2 })}
              </p>
              <p className="mt-1 text-[10px] text-brand-700/80 dark:text-emerald-300/80 tabular-nums">
                vs. ref. Pandero ({sim.pandero.cuotasRef}c)
              </p>
            </div>
          </div>

          {/* Side-by-Side Comparison (Mobile Comparative Cards + Desktop Table) */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-800 dark:text-emerald-300">
                Comparativa Exacta para {formatUsd(certificado)} USD
              </p>
              <span className="sm:hidden text-[10px] font-medium text-slate-400">
                Desembolso de remate
              </span>
            </div>

            {/* MOBILE VIEW (< 640px): Zero-scroll Comparative Cards keeping Company + Remate Money 100% visible */}
            {(() => {
              const maxDesembolso = Math.max(
                1,
                sim.fbDesembolso,
                sim.maquisistema.desembolso,
                sim.pandero.desembolso
              );
              const fbBarPct = Math.max(8, Math.round((sim.fbDesembolso / maxDesembolso) * 100));
              const maquiBarPct = Math.max(
                8,
                Math.round((sim.maquisistema.desembolso / maxDesembolso) * 100)
              );
              const panderoBarPct = Math.max(
                8,
                Math.round((sim.pandero.desembolso / maxDesembolso) * 100)
              );

              return (
                <div className="sm:hidden space-y-2.5 tabular-nums">
                  {/* 1. FonBienes Featured Card */}
                  <div className="rounded-2xl p-3.5 bg-gradient-to-br from-brand-50/90 via-brand-50/50 to-white dark:from-emerald-950/60 dark:via-emerald-900/25 dark:to-slate-900/90 border border-brand-300/85 dark:border-emerald-500/45 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-brand-900 dark:text-white">
                            FonBienes
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-brand-600/10 dark:bg-emerald-500/20 text-[10px] font-semibold text-brand-800 dark:text-emerald-300">
                            {config.plazoMeses}m
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-brand-700 dark:text-emerald-400">
                          Oferta: {cuotas} cuotas ({sim.fbPctPlazo}%)
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold tracking-tight text-brand-800 dark:text-emerald-300">
                          {formatUsd(sim.fbDesembolso, { decimals: 2 })}
                        </p>
                        <p className="text-[10px] font-medium text-brand-700/80 dark:text-emerald-400/80">
                          Capital a rematar
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-brand-100/80 dark:bg-emerald-950 overflow-hidden">
                      <div
                        style={{ width: `${fbBarPct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-400 transition-all duration-300"
                      />
                    </div>

                    <div className="mt-2 pt-2 border-t border-brand-200/60 dark:border-emerald-500/20 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>
                        Cuota mensual:{' '}
                        <strong className="font-bold text-slate-900 dark:text-white">
                          {formatUsd(sim.fbCuotaMensual, { decimals: 2 })}
                        </strong>
                      </span>
                      <span className="font-semibold text-brand-700 dark:text-emerald-400">
                        Menor desembolso
                      </span>
                    </div>
                  </div>

                  {/* 2. Maquisistema Comparison Card */}
                  <div className="rounded-2xl p-3.5 bg-white dark:bg-slate-900/75 border border-slate-200/85 dark:border-slate-700/80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Maquisistema
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {sim.maquisistema.plazoMeses}m · ref.
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Oferta ref.: {sim.maquisistema.cuotasRef} cuotas ({sim.maquisistema.pctRef}%)
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                          {formatUsd(sim.maquisistema.desembolso, { decimals: 2 })}
                        </p>
                        {sim.maquisistema.ahorroLiquidez > 0 && (
                          <p className="text-[10px] font-medium text-slate-400">
                            +{formatUsd(sim.maquisistema.ahorroLiquidez)} vs. FB
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${maquiBarPct}%` }}
                        className="h-full rounded-full bg-slate-300 dark:bg-slate-600 transition-all duration-300"
                      />
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        Cuota mensual:{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-200">
                          {formatUsd(sim.maquisistema.cuotaMensual, { decimals: 2 })}
                        </strong>
                      </span>
                      <span>Plazo 12.5 años</span>
                    </div>
                  </div>

                  {/* 3. Pandero Comparison Card */}
                  <div className="rounded-2xl p-3.5 bg-white dark:bg-slate-900/75 border border-slate-200/85 dark:border-slate-700/80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Pandero
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {sim.pandero.plazoMeses}m · ref.
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Oferta ref.: {sim.pandero.cuotasRef} cuotas ({sim.pandero.pctRef}%)
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                          {formatUsd(sim.pandero.desembolso, { decimals: 2 })}
                        </p>
                        {sim.pandero.ahorroLiquidez > 0 && (
                          <p className="text-[10px] font-medium text-slate-400">
                            +{formatUsd(sim.pandero.ahorroLiquidez)} vs. FB
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${panderoBarPct}%` }}
                        className="h-full rounded-full bg-slate-400 dark:bg-slate-500 transition-all duration-300"
                      />
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        Cuota mensual:{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-200">
                          {formatUsd(sim.pandero.cuotaMensual, { decimals: 2 })}
                        </strong>
                      </span>
                      <span>Plazo 10 años</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* DESKTOP & TABLET VIEW (>= 640px): Clean Executive Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-100 dark:border-emerald-500/20 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    <th className="py-2.5 pr-3">Entidad</th>
                    <th className="py-2.5 px-2 text-right">Plazo</th>
                    <th className="py-2.5 px-2 text-right">Cuota Mensual</th>
                    <th className="py-2.5 px-2 text-right">Oferta</th>
                    <th className="py-2.5 pl-2 text-right">Desembolso Remate</th>
                  </tr>
                </thead>
                <tbody className="text-sm tabular-nums">
                  <tr className="border-b border-brand-100/70 dark:border-emerald-500/20 bg-brand-50/40 dark:bg-emerald-950/35">
                    <td className="py-3.5 pl-2 pr-3 font-bold text-brand-900 dark:text-white rounded-l-xl">
                      FonBienes
                    </td>
                    <td className="py-3.5 px-2 text-right text-slate-600 dark:text-slate-300">
                      {config.plazoMeses}m
                    </td>
                    <td className="py-3.5 px-2 text-right font-semibold text-slate-900 dark:text-white">
                      {formatUsd(sim.fbCuotaMensual, { decimals: 2 })}
                    </td>
                    <td className="py-3.5 px-2 text-right font-semibold text-brand-700 dark:text-emerald-400">
                      {cuotas}c ({sim.fbPctPlazo}%)
                    </td>
                    <td className="py-3.5 pl-2 pr-2 text-right font-bold text-brand-800 dark:text-emerald-300 rounded-r-xl">
                      {formatUsd(sim.fbDesembolso, { decimals: 2 })}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <td className="py-3.5 pl-2 pr-3 font-medium text-slate-700 dark:text-slate-300">
                      Maquisistema <span className="text-xs text-slate-400">(ref.)</span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {sim.maquisistema.plazoMeses}m
                    </td>
                    <td className="py-3.5 px-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatUsd(sim.maquisistema.cuotaMensual, { decimals: 2 })}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {sim.maquisistema.cuotasRef}c ({sim.maquisistema.pctRef}%)
                    </td>
                    <td className="py-3.5 pl-2 pr-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      {formatUsd(sim.maquisistema.desembolso, { decimals: 2 })}
                    </td>
                  </tr>

                  <tr className="text-slate-600 dark:text-slate-400">
                    <td className="py-3.5 pl-2 pr-3 font-medium text-slate-700 dark:text-slate-300">
                      Pandero <span className="text-xs text-slate-400">(ref.)</span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {sim.pandero.plazoMeses}m
                    </td>
                    <td className="py-3.5 px-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatUsd(sim.pandero.cuotaMensual, { decimals: 2 })}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {sim.pandero.cuotasRef}c ({sim.pandero.pctRef}%)
                    </td>
                    <td className="py-3.5 pl-2 pr-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      {formatUsd(sim.pandero.desembolso, { decimals: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Primary Executive Action */}
          <button
            type="button"
            onClick={handleCopyPitch}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 dark:from-emerald-600 dark:to-brand-600 hover:from-brand-700 hover:to-brand-800 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-brand-700/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Propuesta copiada al portapapeles</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar resumen comercial para WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
