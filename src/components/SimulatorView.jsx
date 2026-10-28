import React, { useState, useMemo } from 'react';
import { Check, Copy } from 'lucide-react';
import { simulateCommercialScenario, formatUsd } from '../domain/fonbienesAnalytics';

export default function SimulatorView({ dataset }) {
  const { config } = dataset;
  const latestMinBid =
    dataset.asambleas[dataset.asambleas.length - 1]?.minCuotasGanadoras || 28;

  const [certificado, setCertificado] = useState(70000);
  const [customCertText, setCustomCertText] = useState('');
  const [cuotas, setCuotas] = useState(latestMinBid);
  const [copied, setCopied] = useState(false);

  const sim = useMemo(
    () => simulateCommercialScenario(dataset, certificado, cuotas),
    [dataset, certificado, cuotas]
  );

  const handleSelectChip = (val) => {
    setCertificado(val);
    setCustomCertText('');
  };

  const handleCustomCertChange = (e) => {
    const raw = e.target.value;
    setCustomCertText(raw);
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num) && num >= 10000 && num <= 1000000) {
      setCertificado(num);
    }
  };

  const handleCopyPitch = async () => {
    const msg = [
      `*PROPUESTA INMOBILIARIA FONBIENES (${config.programa})*`,
      `Certificado: ${formatUsd(sim.certificadoUsd)} USD · Plazo: ${config.plazoMeses} meses (${config.plazoAnios} años)`,
      `Cuota base referencial: ${formatUsd(sim.fbCuotaMensual)} USD/mes`,
      ``,
      `*Escenario de Remate (${sim.cuotasOfertadas} cuotas — ${sim.fbPctPlazo}% del plazo):*`,
      `• Capital estimado para rematar: *${formatUsd(sim.fbDesembolso)} USD*`,
      `• Respaldo histórico Grupo ${config.grupo}: habría igualado o superado el corte ganador en *${sim.backtest.ganadasTotal} de ${sim.backtest.totalEvaluadas} asambleas* realizadas.`,
      ``,
      `*Comparativa referencial de liquidez:*`,
      `• Ref. Pandero (${sim.pandero.cuotasRef}c / 50%): ${formatUsd(sim.pandero.desembolso)} USD`,
      `• Ref. Maquisistema (${sim.maquisistema.cuotasRef}c / ${sim.maquisistema.pctRef}%): ${formatUsd(sim.maquisistema.desembolso)} USD`,
      sim.pandero.ahorroLiquidez > 0
        ? `• Liquidez preservada con FonBienes: *+${formatUsd(sim.pandero.ahorroLiquidez)} USD*`
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
      // Fallback for restricted clipboard contexts
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

  return (
    <section className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
          Herramienta de Cierre Comercial
        </p>
        <h1 className="mt-1 text-2xl sm:text-[28px] font-semibold tracking-[-0.025em] text-slate-900">
          Simulador de Liquidez y Remate
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Advisor Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-ambient border border-slate-100/90 space-y-8">
          {/* Step 1: Certificate */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                1. Valor del Certificado
              </label>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatUsd(certificado)} USD
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {config.presetCertificates.map((val) => {
                const isSelected = customCertText === '' && certificado === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectChip(val)}
                    className={`px-3.5 py-2 rounded-full text-xs tabular-nums transition-colors ${
                      isSelected
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-500 hover:text-slate-900 bg-slate-50/70 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    ${val / 1000}k
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label
                htmlFor="customCertInput"
                className="block text-xs text-slate-400 mb-1.5"
              >
                O ingresa un monto personalizado (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <input
                  id="customCertInput"
                  type="number"
                  min="15000"
                  max="500000"
                  step="5000"
                  value={customCertText}
                  onChange={handleCustomCertChange}
                  placeholder="Ej. 90000"
                  className="w-full pl-8 pr-14 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-brand-600 transition-colors tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  USD
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Cuotas Slider */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <label
                htmlFor="cuotasRange"
                className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
              >
                2. Cuotas a Ofertar
              </label>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {cuotas}
                </span>
                <span className="ml-1 text-xs font-medium text-slate-400">
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
                background: `linear-gradient(to right, #057c3f 0%, #057c3f ${sliderPct}%, #E2E8F0 ${sliderPct}%, #E2E8F0 100%)`
              }}
              className="rams-slider"
            />

            {/* Quick Tactile Presets */}
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
                  className={`px-2.5 py-1 rounded-full text-[11px] tabular-nums transition-colors ${
                    cuotas === preset.val
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-400 hover:text-slate-700 font-medium'
                  }`}
                >
                  {preset.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Evidence-Based Financial Output */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-ambient border border-slate-100/90 space-y-7">
          {/* Empirical Backtest Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Respaldo Histórico ({sim.backtest.totalEvaluadas} Asambleas)
              </p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Con <strong className="font-semibold text-slate-900 tabular-nums">{cuotas} cuotas</strong>, habría igualado o superado el corte ganador en{' '}
                <strong className="font-semibold text-slate-900 tabular-nums">
                  {sim.backtest.ganadasTotal} de {sim.backtest.totalEvaluadas}
                </strong>{' '}
                asambleas realizadas.
              </p>
            </div>

            <span
              className={`self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tabular-nums ${
                sim.backtest.tier === 'high' || sim.backtest.tier === 'competitive'
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sim.backtest.statusLabel} ({sim.backtest.empiricalRate}%)
            </span>
          </div>

          {/* 3 Hero Financial Metrics — Stacks cleanly on mobile so figures NEVER squish */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Cuota Base
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatUsd(sim.fbCuotaMensual)}
                <span className="text-xs font-medium text-slate-400 ml-1">/mes</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Desembolso Remate
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatUsd(sim.fbDesembolso)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-50/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                Liquidez Preservada
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-brand-700 tabular-nums">
                {sim.pandero.ahorroLiquidez >= 0
                  ? `+${formatUsd(sim.pandero.ahorroLiquidez)}`
                  : formatUsd(sim.pandero.ahorroLiquidez)}
              </p>
            </div>
          </div>

          {/* Side-by-Side Minimalist Comparison Table (Responsive) */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-2">
              Comparativa para Certificado de {formatUsd(certificado)} USD
            </p>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-left border-collapse min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    <th className="py-2.5 pr-3">Entidad</th>
                    <th className="py-2.5 px-3 text-right">Plazo</th>
                    <th className="py-2.5 px-3 text-right">Cuota Base</th>
                    <th className="py-2.5 px-3 text-right">Oferta</th>
                    <th className="py-2.5 pl-3 text-right">Desembolso</th>
                  </tr>
                </thead>
                <tbody className="text-sm tabular-nums">
                  <tr className="border-b border-slate-50">
                    <td className="py-3.5 pr-3 font-semibold text-slate-900">
                      FonBienes
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">
                      {config.plazoMeses}m
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-700">
                      {formatUsd(sim.fbCuotaMensual)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-brand-700">
                      {cuotas}c ({sim.fbPctPlazo}%)
                    </td>
                    <td className="py-3.5 pl-3 text-right font-bold text-slate-900">
                      {formatUsd(sim.fbDesembolso)}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-50 text-slate-500">
                    <td className="py-3.5 pr-3 font-medium">
                      Maquisistema <span className="text-xs text-slate-400">(ref.)</span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {sim.maquisistema.plazoMeses}m
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {formatUsd(sim.maquisistema.cuotaMensual)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {sim.maquisistema.cuotasRef}c ({sim.maquisistema.pctRef}%)
                    </td>
                    <td className="py-3.5 pl-3 text-right font-medium text-slate-700">
                      {formatUsd(sim.maquisistema.desembolso)}
                    </td>
                  </tr>

                  <tr className="text-slate-500">
                    <td className="py-3.5 pr-3 font-medium">
                      Pandero <span className="text-xs text-slate-400">(ref.)</span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {sim.pandero.plazoMeses}m
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {formatUsd(sim.pandero.cuotaMensual)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {sim.pandero.cuotasRef}c ({sim.pandero.pctRef}%)
                    </td>
                    <td className="py-3.5 pl-3 text-right font-medium text-slate-700">
                      {formatUsd(sim.pandero.desembolso)}
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
            className="w-full py-3.5 px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
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

