import React, { useState, useMemo } from 'react';
import {
  Compass,
  Check,
  Copy,
  TrendingDown,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowDownRight,
  ArrowDown,
  DollarSign,
  Building2,
  Trophy,
  SlidersHorizontal,
  Flame,
  Award,
  Filter
} from 'lucide-react';
import {
  calculateCommercialPitchPlan,
  formatUsd,
  EMBUDO_COMPETENCIA,
  FASES_ESCALERA
} from '../domain/fonbienesAnalytics';
import { useTheme } from '../context/ThemeContext';

const PRESETS = [40000, 60000, 80000, 100000, 120000];

export default function StrategyView({ dataset, onOpenSimulator, onOpenHistory }) {
  const { isDark } = useTheme();

  // Core interactive parameters
  const [certificado, setCertificado] = useState(80000);
  const [certInput, setCertInput] = useState('80000');
  const [plazoMeses, setPlazoMeses] = useState(120);
  const [hasDiscount, setHasDiscount] = useState(true);
  const [activeStepId, setActiveStepId] = useState(2); // Step 2 (Mes 4-9) by default
  const [copied, setCopied] = useState(false);

  const activePhase = useMemo(
    () => FASES_ESCALERA.find((f) => f.id === activeStepId) || FASES_ESCALERA[1],
    [activeStepId]
  );

  const plan = useMemo(
    () =>
      calculateCommercialPitchPlan({
        certificadoUsd: certificado,
        plazoMeses,
        hasDiscount,
        cuotasRemate: activePhase.cuotasRef
      }),
    [certificado, plazoMeses, hasDiscount, activePhase]
  );

  const handleSelectPreset = (val) => {
    setCertificado(val);
    setCertInput(String(val));
  };

  const handleCertChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCertInput(raw);
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num) && num >= 10000 && num <= 300000) {
      setCertificado(num);
    }
  };

  const handleCertBlur = () => {
    const num = parseInt(certInput, 10);
    if (Number.isNaN(num) || num < 20000) {
      setCertificado(40000);
      setCertInput('40000');
    } else if (num > 300000) {
      setCertificado(300000);
      setCertInput('300000');
    } else {
      setCertificado(num);
      setCertInput(String(num));
    }
  };

  const handleCopyPitch = async () => {
    const msg = [
      `*FONBIENES INMUEBLES · PROPUESTA EJECUTIVA*`,
      `🏢 Certificado: *${formatUsd(plan.certificadoUsd)} USD* (${plan.plazoMeses} meses / ${plan.plazoMeses / 12} años)`,
      `💵 Cuota Fija Mensual: *${formatUsd(plan.cuotaMensual, { decimals: 2 })} USD*`,
      plan.hasDiscount
        ? `🎁 Inscripción (50% OFF): *${formatUsd(plan.inscripcionEfectiva, { decimals: 2 })} USD* (Regular: ${formatUsd(plan.inscripcionRegular, { decimals: 2 })})`
        : `📋 Inscripción: *${formatUsd(plan.inscripcionRegular, { decimals: 2 })} USD*`,
      `🚀 Primer Pago de Ingreso: *${formatUsd(plan.primerPago, { decimals: 2 })} USD*`,
      `📊 Costo Total en todo el plazo: *${formatUsd(plan.costoTotal, { decimals: 2 })} USD* (solo ${plan.costoPctCertificado}%)`,
      `   *(Ahorro vs. Banco: +${formatUsd(plan.banco.ahorroVsFonbienes)} USD y 0% cuota inicial)*`,
      ``,
      `*ESTRATEGIA DE ADJUDICACIÓN:*`,
      `• Sorteo (90% del grupo): Planificación con 0% inicial.`,
      `• Remate (${activePhase.rangoMeses}): ~${activePhase.cuotasRef} cuotas (${formatUsd(plan.desembolsoRemate)} USD).`,
      `• En el grupo (396 asociados), la competencia real mensual es de solo ~10 a 12 personas.`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <section className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* ========================================================================= */}
      {/* TOP CONTROL BAR: MONTO, PLAZO, SWITCH & WHATSAPP                          */}
      {/* ========================================================================= */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-brand-200/80 dark:border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Badge */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50/90 dark:bg-emerald-500/15 border border-brand-200/80 dark:border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider text-brand-800 dark:text-emerald-300">
              <Compass className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
              <span>Pizarra Visual de Asesoría</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight title-brand-gradient">
              Plan Estratégico de Adjudicación
            </h1>
          </div>

          {/* Controls: Plazo + Switch + Copy Button */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Plazo Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPlazoMeses(120)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  plazoMeses === 120
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                120m (10a)
              </button>
              <button
                type="button"
                onClick={() => setPlazoMeses(132)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  plazoMeses === 132
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                132m (11a)
              </button>
            </div>

            {/* 50% Switch */}
            <button
              type="button"
              onClick={() => setHasDiscount(!hasDiscount)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                hasDiscount
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${hasDiscount ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>50% Dscto. Inscripción</span>
            </button>

            {/* WhatsApp Export */}
            <button
              type="button"
              onClick={handleCopyPitch}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Certificate Preset Buttons Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            Certificado:
          </span>
          {PRESETS.map((val) => {
            const isSel = certificado === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleSelectPreset(val)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold tabular-nums transition-all border ${
                  isSel
                    ? 'bg-brand-600 text-white border-brand-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                }`}
              >
                {formatUsd(val)}
                {val === 80000 && <span className="ml-1 text-[10px] text-emerald-200">★ Base</span>}
              </button>
            );
          })}

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-slate-400 font-semibold">$</span>
            <input
              type="text"
              value={certInput}
              onChange={handleCertChange}
              onBlur={handleCertBlur}
              className="w-24 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums text-center"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PIZARRA 1: NÚMEROS CLAVE (LA HOJA 1 RESUMIDA)                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Cuota */}
        <div className="surface-card rounded-2xl p-4 sm:p-5 border border-brand-200/90 dark:border-emerald-500/30 text-center flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cuota Mensual
          </span>
          <div className="my-1.5 text-2xl sm:text-3xl font-extrabold text-brand-700 dark:text-emerald-400 tabular-nums">
            {formatUsd(plan.cuotaMensual, { decimals: 2 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Fija en {plan.plazoMeses} meses
          </span>
        </div>

        {/* Card 2: Inscripción */}
        <div className="surface-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-700 text-center flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inscripción
            </span>
            {plan.hasDiscount && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                -50%
              </span>
            )}
          </div>
          <div className="my-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatUsd(plan.inscripcionEfectiva, { decimals: 2 })}
          </div>
          <span className="text-xs text-slate-500">
            {plan.hasDiscount ? `Ahorro -$${formatUsd(plan.descuentoInscripcion).slice(1)}` : 'Tarifa regular'}
          </span>
        </div>

        {/* Card 3: Primer Pago */}
        <div className="surface-card rounded-2xl p-4 sm:p-5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 text-center flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Primer Pago (Ingreso)
          </span>
          <div className="my-1.5 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatUsd(plan.primerPago, { decimals: 2 })}
          </div>
          <span className="text-xs text-emerald-800/80 dark:text-emerald-300/80 font-medium">
            Cuota 1 + Inscripción
          </span>
        </div>

        {/* Card 4: Costo Financiero Total */}
        <div className="surface-card rounded-2xl p-4 sm:p-5 border border-brand-300 dark:border-emerald-500/50 bg-brand-50/60 dark:bg-slate-800/90 text-center flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-900 dark:text-emerald-300">
            Costo Total Financiamiento
          </span>
          <div className="my-1.5 text-2xl sm:text-3xl font-extrabold text-brand-800 dark:text-emerald-300 tabular-nums">
            {formatUsd(plan.costoTotal, { decimals: 2 })}
          </div>
          <span className="text-xs text-brand-700 dark:text-emerald-400 font-bold">
            Solo {plan.costoPctCertificado}% del capital
          </span>
        </div>
      </div>

      {/* Banner de Impacto Bancario */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-brand-700 to-brand-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-emerald-200">
              Ventaja Contundente vs. Crédito Hipotecario Bancario
            </div>
            <div className="text-sm sm:text-base font-extrabold">
              FonBienes: 0% Cuota Inicial · Ahorro de +{formatUsd(plan.banco.ahorroVsFonbienes)} USD en Intereses
            </div>
          </div>
        </div>
        <div className="text-xs bg-white/20 px-3 py-1.5 rounded-xl font-bold shrink-0">
          Banco cobra ~{formatUsd(plan.banco.intereses)} USD en intereses
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PIZARRA 2: LOS DOS CAMINOS DE ADJUDICACIÓN (VISUAL & KEYWORDS)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camino A: Sorteo */}
        <div className="surface-card rounded-2xl sm:rounded-3xl p-5 border border-brand-200/90 dark:border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-100 dark:bg-emerald-950 text-brand-800 dark:text-emerald-300">
              A) SORTEO MENSUAL
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              90% de Asociados
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Planificación Inteligente de Compra
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                ✓ 0% Cuota Inicial
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                ✓ Solo Cuota Regular
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                ✓ Cero Descapitalización
              </span>
            </div>
          </div>

          {/* Micro Diagrama Visual del Sorteo */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold uppercase">
              <span>Mes 1 (Ingreso)</span>
              <span className="text-emerald-600 font-extrabold">Mes 12 (¡Sorteado!)</span>
              <span>Mes {plan.plazoMeses}</span>
            </div>

            {/* Line with Pinpoint */}
            <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-brand-500 rounded-full" />
              <div className="absolute left-1/4 -top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            </div>

            <div className="pt-1 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Recibe Certificado:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                {formatUsd(plan.certificadoUsd)} USD ÍNTEGROS
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Lo restante se sigue pagando en cuotas fijas normales de {formatUsd(plan.cuotaMensual, { decimals: 2 })}/mes sin penalidades.
            </div>
          </div>
        </div>

        {/* Camino B: Remate */}
        <div className="surface-card rounded-2xl sm:rounded-3xl p-5 border border-amber-200/90 dark:border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              B) REMATE VOLUNTARIO
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              Aceleración de Compra
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Oferta Voluntaria para Poner Fecha
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-slate-800 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                ⚡ Adelanto Voluntario de Cuotas
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-slate-800 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                ⚡ Adjudicación Programada
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-slate-800 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                ⚡ Menor que la Competencia
              </span>
            </div>
          </div>

          {/* Micro Diagrama Visual del Remate */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-500/30 text-xs space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">FonBienes (Promedio):</span>
              <span className="font-extrabold text-brand-700 dark:text-emerald-400 text-sm">
                24 a 30 cuotas
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Pandero Inmuebles:</span>
              <span className="font-bold text-rose-600">50 cuotas (~42% plazo)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Maquisistema:</span>
              <span className="font-bold text-rose-600">65 cuotas (~43% plazo)</span>
            </div>
            <div className="pt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold border-t border-amber-200/60 dark:border-slate-700">
              Preservas más de {formatUsd(plan.pandero.ahorroVsFonbienes)} USD en liquidez frente a Pandero.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PIZARRA 3: EL EMBUDO REAL DE COMPETENCIA (DESMITIFICANDO LOS 396)         */}
      {/* ========================================================================= */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-emerald-400">
              Desmitificando el Miedo del Cliente
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              El Embudo Real de Cada Asamblea (Grupo 001)
            </h2>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
            Supervisado SMV
          </span>
        </div>

        {/* Funnel Pipeline Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Level 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              1. Total Grupo
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 my-1">
              396
            </div>
            <span className="text-xs text-slate-500 font-medium">Contratos activos</span>
          </div>

          {/* Level 2 */}
          <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-emerald-950/40 border border-brand-200 dark:border-emerald-500/30 text-center relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800 dark:text-emerald-300 block">
              2. Ofertan Remate
            </span>
            <div className="text-2xl sm:text-3xl font-black text-brand-700 dark:text-emerald-400 my-1">
              ~40
            </div>
            <span className="text-xs text-brand-800/80 dark:text-emerald-300 font-bold">
              Solo el 10% del grupo
            </span>
          </div>

          {/* Level 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              3. Ofertas Bajas
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-500 dark:text-slate-400 my-1">
              28
            </div>
            <span className="text-xs text-slate-500 font-medium">
              70% oferta 1 a 10 cuotas
            </span>
          </div>

          {/* Level 4 */}
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-center shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-8 h-8 bg-white/20 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">
              4. Competencia Real
            </span>
            <div className="text-2xl sm:text-3xl font-black my-1">
              Solo ~12
            </div>
            <span className="text-xs font-bold text-emerald-100">
              Asociados (+20 cuotas)
            </span>
          </div>
        </div>

        {/* Punchline Card */}
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-brand-900 to-slate-900 text-white flex items-center justify-between text-xs sm:text-sm font-bold shadow-xs">
          <span>🎯 Argumento clave: «Tu competencia en cada asamblea no son 396 personas, ¡son apenas 10 a 12!»</span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-extrabold shrink-0 ml-2">
            Alta Viabilidad
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PIZARRA 4: LA ESCALERA DESCENDENTE (DIBUJO DE LA HOJA / IMAGEN ADJUNTA)   */}
      {/* ========================================================================= */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-brand-200/90 dark:border-emerald-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-emerald-400">
                Metodología Temporal
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Tendencia Verificada
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              La Escalera Descendente de Cuotas
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-emerald-400 bg-brand-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-emerald-500/30">
            <TrendingDown className="w-4 h-4 text-brand-600 dark:text-emerald-400" />
            <span>REDUCIÉNDOSE: Ganadores adjudican y salen</span>
          </div>
        </div>

        {/* Visual Descending Staircase Component */}
        <div className="pt-2">
          {/* Stepped Grid descending from left to right */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-2 items-end">
            {FASES_ESCALERA.map((fase, idx) => {
              const isSelected = activeStepId === fase.id;
              const cuotasRef = fase.cuotasRef;
              const desembolso = cuotasRef * plan.cuotaMensual;

              // Step Height styles to mimic physical staircase descending from step 1 to 5
              const stepHeights = [
                'sm:min-h-[220px]',
                'sm:min-h-[195px]',
                'sm:min-h-[170px]',
                'sm:min-h-[145px]',
                'sm:min-h-[120px]'
              ];

              return (
                <div
                  key={fase.id}
                  onClick={() => setActiveStepId(fase.id)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${stepHeights[idx]} ${
                    isSelected
                      ? 'bg-gradient-to-b from-brand-50 to-emerald-50 dark:from-emerald-950/80 dark:to-slate-800 border-brand-500 dark:border-emerald-400 shadow-md transform -translate-y-1'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-brand-300'
                  }`}
                >
                  {/* Top Step Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {fase.id}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {fase.rangoMeses}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 block tabular-nums leading-tight">
                        {fase.minCuotas}-{fase.maxCuotas}
                      </span>
                      <span className="text-[11px] font-bold text-brand-700 dark:text-emerald-400 block uppercase">
                        Cuotas
                      </span>
                    </div>
                  </div>

                  {/* Bottom Step Metric */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 mt-2">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Desembolso (~{cuotasRef}c)
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tabular-nums block">
                      {formatUsd(desembolso)}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        ● Seleccionado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Diagonal Arrow Bar mimicking the drawing */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-lg">↘</span>
              <span><strong>Mecánica Comercial:</strong> Quienes ofertaron 28-30 cuotas ya ganaron. No vuelven a competir. Las ofertas caen mes a mes.</span>
            </div>
            <span className="hidden sm:inline-block text-brand-700 dark:text-emerald-400 font-extrabold">
              {activePhase.rangoMeses} seleccionado
            </span>
          </div>
        </div>

        {/* Selected Phase Detail Box */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">
              Escenario para {activePhase.rangoMeses}: {activePhase.nombre}
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Oferta voluntaria estimada de ~{activePhase.cuotasRef} cuotas ({formatUsd(plan.desembolsoRemate)} USD).
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyPitch}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shrink-0 self-start sm:self-auto flex items-center gap-2"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copiar Escenario</span>
          </button>
        </div>

        {/* Fast Link to Real Backtest Simulator */}
        <div className="flex items-center justify-between pt-1 text-xs font-bold text-slate-500">
          <span>¿Quieres probar asambleas reales una por una?</span>
          <button
            type="button"
            onClick={onOpenSimulator}
            className="text-brand-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Ir al Simulador Detallado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
