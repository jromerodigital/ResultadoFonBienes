import React, { useState, useMemo } from 'react';
import {
  FileText,
  Building2,
  Store,
  Home,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Info,
  Compass,
  SlidersHorizontal,
  User,
  Phone,
  Calendar,
  CreditCard,
  Percent,
  Maximize2,
  Minimize2,
  X,
  Users
} from 'lucide-react';
import FonbienesLogo from './FonbienesLogo';
import {
  calculateCommercialPitchPlan,
  formatUsd,
  FASES_ESCALERA
} from '../domain/fonbienesAnalytics';

const OPERACIONES = [
  {
    id: 'departamento',
    topLabel: 'COMPRA DE',
    mainLabel: 'DEPARTAMENTOS',
    icon: Building2
  },
  {
    id: 'local',
    topLabel: 'COMPRA DE',
    mainLabel: 'LOCALES COMERCIALES',
    icon: Store
  },
  {
    id: 'hipotecario',
    topLabel: 'CANCELACIÓN DE',
    mainLabel: 'CRÉDITO HIPOTECARIO',
    icon: Home
  }
];

const PRESET_AMOUNTS = [40000, 50000, 60000, 70000, 80000, 100000, 120000, 150000];
const PLAZO_OPTIONS = [
  { meses: 120, label: '120 Meses (10 Años)', tag: 'Hoja Oficial' },
  { meses: 132, label: '132 Meses (11 Años)', tag: 'Grupo FBP010' },
  { meses: 150, label: '150 Meses (12.5 Años)', tag: 'Plazo Extendido' }
];
const REMATE_PRESETS = [
  { cuotas: 30, label: '30c (Mes 1-4)' },
  { cuotas: 28, label: '28c (Corte Ref.)' },
  { cuotas: 24, label: '24c (Mes 4-9)' },
  { cuotas: 20, label: '20c (Mes 9-15)' },
  { cuotas: 15, label: '15c (Mes 15+)' }
];

export default function ProformaView({ dataset, onOpenStrategy, onOpenSimulator }) {
  const todayFormatted = useMemo(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  // 1. Operaciones e Información Personal
  const [operacionId, setOperacionId] = useState('departamento');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDni, setClienteDni] = useState('');
  const [clienteCelular, setClienteCelular] = useState('');
  const [fechaProforma, setFechaProforma] = useState(todayFormatted);

  // 2. Parámetros Financieros Dinámicos
  const [certificado, setCertificado] = useState(80000);
  const [certInput, setCertInput] = useState('80000');
  const [plazoMeses, setPlazoMeses] = useState(120);
  const [hasDiscount, setHasDiscount] = useState(true);

  // 3. Parámetros de Modalidades (Sorteo y Remate)
  const [mesSorteoEjemplo, setMesSorteoEjemplo] = useState(12);
  const [cuotasRemate, setCuotasRemate] = useState(28);
  const [copied, setCopied] = useState(false);
  const [isEscaleraModalOpen, setIsEscaleraModalOpen] = useState(false);

  const selectedOperacion = useMemo(
    () => OPERACIONES.find((op) => op.id === operacionId) || OPERACIONES[0],
    [operacionId]
  );

  const plan = useMemo(
    () =>
      calculateCommercialPitchPlan({
        certificadoUsd: certificado,
        plazoMeses,
        hasDiscount,
        cuotasRemate
      }),
    [certificado, plazoMeses, hasDiscount, cuotasRemate]
  );

  // Cálculos dinámicos de Sorteo
  const sorteoStats = useMemo(() => {
    const safeMonth = Math.min(Math.max(1, mesSorteoEjemplo), plazoMeses - 1);
    const invertidoHastaSorteo = safeMonth * plan.cuotaMensual;
    const mesesPendientes = plazoMeses - safeMonth;
    const pctAvance = (safeMonth / plazoMeses) * 100;
    return {
      mes: safeMonth,
      invertidoHastaSorteo,
      mesesPendientes,
      pctAvance
    };
  }, [mesSorteoEjemplo, plazoMeses, plan.cuotaMensual]);

  const handleSelectAmount = (val) => {
    setCertificado(val);
    setCertInput(String(val));
  };

  const handleCertInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCertInput(raw);
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num) && num >= 10000 && num <= 500000) {
      setCertificado(num);
    }
  };

  const handleCertInputBlur = () => {
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

  const handlePrintProforma = () => {
    window.print();
  };

  const handleCopyWhatsApp = async () => {
    const destinatario = clienteNombre.trim() ? `*${clienteNombre.trim()}*` : 'Estimado(a) cliente';
    const opTexto = `${selectedOperacion.topLabel} ${selectedOperacion.mainLabel}`;

    const msg = [
      `*FONBIENES PERÚ E.A.F.C. · PROFORMA INMOBILIARIA*`,
      `Cliente: ${destinatario}${clienteDni ? ` · DNI/RUC: ${clienteDni}` : ''}`,
      `Operación: *${opTexto}*`,
      `Fecha: ${fechaProforma} · Plazo: *${plan.plazoMeses} meses (${plan.plazosAnios} años)*`,
      ``,
      `*1. ESTRUCTURA DE FINANCIAMIENTO:*`,
      `• Certificado de Financiamiento: *${formatUsd(plan.certificadoUsd, { decimals: 2 })} USD*`,
      `• A) Cuota Mensual Fija: *${formatUsd(plan.cuotaMensual, { decimals: 2 })} USD*`,
      plan.hasDiscount
        ? `• B) Membresía de Ingreso (Inscripción 50% Dscto.): *${formatUsd(plan.inscripcionEfectiva, { decimals: 2 })} USD* _(pago único inicial · Regular: ${formatUsd(plan.inscripcionRegular, { decimals: 2 })})_`
        : `• B) Membresía de Ingreso (Inscripción): *${formatUsd(plan.inscripcionEfectiva, { decimals: 2 })} USD* _(pago único inicial)_`,
      `• *A + B) PRIMER PAGO DE INGRESO: ${formatUsd(plan.primerPago, { decimals: 2 })} USD*`,
      ``,
      `*2. TRANSPARENCIA DEL COSTO FINANCIERO:*`,
      `• Gasto Administrativo Real: *solo ~${plan.desgloseComercial.tasaFbp010AdmNetoAnual}% anual (sin IGV)* en cuotas del programa.`,
      `• La Inscripción (${formatUsd(plan.inscripcionEfectiva, { decimals: 2 })} USD) es una Membresía Única de ingreso (abono inicial por única vez).`,
      `• ${plan.plazoMeses} meses × ${formatUsd(plan.cuotaMensual, { decimals: 2 })} = ${formatUsd(plan.totalCuotas, { decimals: 2 })} USD`,
      `• (+) Membresía Única = ${formatUsd(plan.inscripcionEfectiva, { decimals: 2 })} USD`,
      `• (=) Total a devolver = *${formatUsd(plan.totalDevolver, { decimals: 2 })} USD*`,
      `• (-) Certificado de compra = *${formatUsd(plan.certificadoUsd, { decimals: 2 })} USD*`,
      `• *(=) Sobrecosto Total acumulado en ${plan.plazosAnios} años (con IGV 18%): ${formatUsd(plan.costoTotal, { decimals: 2 })} USD*`,
      `   _(Ahorro neto de +${formatUsd(plan.banco.ahorroVsFonbienes)} USD frente al crédito hipotecario bancario tradicional)_`,
      ``,
      `*3. MODALIDADES DE ADJUDICACIÓN:*`,
      `• *1) Sorteo (Ahorro Programado):* Adjudicación mensual sin cuota inicial. Si adjudica en el mes ${sorteoStats.mes}, recibe los ${formatUsd(plan.certificadoUsd)} USD y el saldo (${sorteoStats.mesesPendientes} meses) lo continúa abonando en su cuota fija de ${formatUsd(plan.cuotaMensual, { decimals: 2 })}/mes.`,
      `• *2) Remate (Adelanto de ${plan.cuotasRemate} cuotas = ${formatUsd(plan.desembolsoRemate, { decimals: 2 })} USD):*`,
      `   *Opción A (Reducir plazo):* Mantiene la cuota de *${formatUsd(plan.remateOpcionA.cuotaMensual, { decimals: 2 })} USD* por solo *${plan.remateOpcionA.mesesRestantes} meses* (finaliza ${plan.remateOpcionA.aniosAhorrados} años antes).`,
      `   *Opción B (Reducir cuota):* Mantiene el plazo de *${plan.remateOpcionB.mesesPlazo} meses* y su cuota se reduce a *${formatUsd(plan.remateOpcionB.nuevaCuotaMensual, { decimals: 2 })} USD/mes* (ahorro de ${formatUsd(plan.remateOpcionB.ahorroPorMes, { decimals: 2 })}/mes).`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Porcentajes para barras de progreso de Remate A y B
  const pctRestanteA = Math.min(100, Math.max(5, (plan.remateOpcionA.mesesRestantes / plazoMeses) * 100));
  const pctDescontadoA = 100 - pctRestanteA;

  return (
    <section className="space-y-6 max-w-6xl mx-auto proforma-page-wrapper">
      {/* ========================================================================= */}
      {/* BARRA DE CONTROL DEL ASESOR (SE OCULTA AL IMPRIMIR EN PDF A4)             */}
      {/* ========================================================================= */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-brand-200/80 dark:border-emerald-500/25 shadow-sm print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-700 dark:text-emerald-400">
              Plan Inmobiliario FBP010 · FonBienes Perú
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              Proforma Inmobiliaria
            </h1>
          </div>

          {/* Botones de Acción Comercial: WhatsApp + Imprimir PDF A4 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switch 50% Descuento */}
            <button
              type="button"
              onClick={() => setHasDiscount(!hasDiscount)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                hasDiscount
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400/80 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hasDiscount ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-400'
                }`}
              />
              <span>{hasDiscount ? 'Inscripción: 50% Dscto. (2.36%)' : 'Inscripción: Regular (4.72%)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado' : 'Enviar por WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintProforma}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF A4</span>
            </button>
          </div>
        </div>

        {/* Selector Rápido de Certificados y Plazo */}
        <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
              Monto:
            </span>
            {PRESET_AMOUNTS.map((val) => {
              const isSelected = certificado === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectAmount(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  }`}
                >
                  {formatUsd(val)}
                </button>
              );
            })}
          </div>

          {/* Selector de Plazo (120m default, 132m, 150m) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Plazo:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {PLAZO_OPTIONS.map((opt) => (
                <button
                  key={opt.meses}
                  type="button"
                  onClick={() => setPlazoMeses(opt.meses)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    plazoMeses === opt.meses
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.meses}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HOJA OFICIAL DE PROFORMA FONBIENES (DISEÑO FIEL AL PDF + INTERACTIVO)     */}
      {/* ========================================================================= */}
      <div className="proforma-sheet bg-white dark:bg-[#0E171D] rounded-3xl border border-slate-200/90 dark:border-emerald-500/25 shadow-xl overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        {/* 1. CABECERA INSTITUCIONAL VERDE FONBIENES */}
        <div className="bg-gradient-to-r from-[#057c3f] via-[#068846] to-[#046634] px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          {/* Curva decorativa sutil estilo PDF */}
          <div className="bg-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-center shrink-0">
            <FonbienesLogo variant="color" className="h-9 sm:h-11 w-auto" />
          </div>

          <div className="text-center sm:text-right text-white">
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-100">
              PLAN INMOBILIARIO
            </div>
            <p className="mt-0.5 text-sm sm:text-lg font-medium text-white/95 leading-snug">
              Tu inversión inmobiliaria{' '}
              <strong className="font-extrabold text-white underline decoration-emerald-300/80 underline-offset-4">
                con cuotas a tu alcance y sin intereses.
              </strong>
            </p>
          </div>
        </div>

        {/* CONTENEDOR CENTRAL DE LA PROFORMA */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-7">
          {/* 2. OPERACIONES INMOBILIARIAS */}
          <div>
            <h2 className="text-center text-xs sm:text-sm font-black uppercase tracking-[0.14em] text-[#01518c] dark:text-emerald-400 mb-3.5">
              OPERACIONES INMOBILIARIAS
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {OPERACIONES.map((op) => {
                const Icon = op.icon;
                const isSelected = operacionId === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperacionId(op.id)}
                    className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#057c3f] dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-brand-300'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#057c3f] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#01518c] dark:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {op.topLabel}
                      </span>
                      <span className="block text-xs sm:text-sm font-black text-[#01518c] dark:text-white leading-tight mt-0.5">
                        {op.mainLabel}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#057c3f] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. INFORMACIÓN PERSONAL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div className="bg-[#057c3f] text-white text-center py-2 px-4 text-xs sm:text-sm font-extrabold uppercase tracking-[0.12em]">
              INFORMACIÓN PERSONAL
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 text-xs sm:text-sm">
              {/* Datos Personales */}
              <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <label
                  htmlFor="proformaCliente"
                  className="font-extrabold text-[#01518c] dark:text-emerald-400 uppercase tracking-wide shrink-0 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 print:hidden" />
                  <span>DATOS PERSONALES:</span>
                </label>
                <input
                  id="proformaCliente"
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre y Apellidos del titular..."
                  className="w-full font-semibold text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {/* DNI / RUC */}
              <div className="md:col-span-5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <label
                  htmlFor="proformaDni"
                  className="font-extrabold text-[#01518c] dark:text-emerald-400 uppercase tracking-wide shrink-0 flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 print:hidden" />
                  <span>DNI / RUC:</span>
                </label>
                <input
                  id="proformaDni"
                  type="text"
                  value={clienteDni}
                  onChange={(e) => setClienteDni(e.target.value)}
                  placeholder="Documento de identidad..."
                  className="w-full font-semibold text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 tabular-nums"
                />
              </div>

              {/* Celular */}
              <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <label
                  htmlFor="proformaCelular"
                  className="font-extrabold text-[#01518c] dark:text-emerald-400 uppercase tracking-wide shrink-0 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 print:hidden" />
                  <span>CELULAR:</span>
                </label>
                <input
                  id="proformaCelular"
                  type="text"
                  value={clienteCelular}
                  onChange={(e) => setClienteCelular(e.target.value)}
                  placeholder="+51 999 999 999"
                  className="w-full font-semibold text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 tabular-nums"
                />
              </div>

              {/* Fecha */}
              <div className="md:col-span-5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <label
                  htmlFor="proformaFecha"
                  className="font-extrabold text-[#01518c] dark:text-emerald-400 uppercase tracking-wide shrink-0 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 print:hidden" />
                  <span>FECHA:</span>
                </label>
                <input
                  id="proformaFecha"
                  type="text"
                  value={fechaProforma}
                  onChange={(e) => setFechaProforma(e.target.value)}
                  className="w-full font-semibold text-slate-900 dark:text-white bg-transparent focus:outline-none tabular-nums"
                />
              </div>

              {/* Programa / Plazo */}
              <div className="md:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-[#01518c] dark:text-emerald-400 uppercase tracking-wide">
                    PROGRAMA / PLAZO:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Plan Inmobiliario {dataset?.config?.programa || 'FBP010'} ·{' '}
                    <span className="text-[#057c3f] dark:text-emerald-400 font-extrabold">
                      {plan.plazoMeses} Meses ({plan.plazosAnios} Años)
                    </span>{' '}
                    · {selectedOperacion.topLabel} {selectedOperacion.mainLabel}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 self-start sm:self-auto">
                  Supervisado por la SMV
                </span>
              </div>
            </div>
          </div>

          {/* 4. MONTO DE FINANCIAMIENTO + A) CUOTA MENSUAL / B) INSCRIPCIÓN / A+B) PRIMER PAGO */}
          <div className="rounded-2xl border-2 border-[#057c3f]/30 dark:border-emerald-500/30 overflow-hidden bg-white dark:bg-slate-900/60 shadow-xs">
            {/* Barra Verde con Input de Monto de Financiamiento */}
            <div className="bg-[#057c3f] px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-[0.1em]">
                  MONTO DE FINANCIAMIENTO
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-full">
                  Certificado en Dólares (USD)
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white/15 hover:bg-white/20 focus-within:bg-white/25 px-3.5 py-1.5 rounded-xl border border-white/30 transition-all">
                <span className="text-lg sm:text-xl font-black text-emerald-200">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Monto de Financiamiento en USD"
                  value={certInput}
                  onChange={handleCertInputChange}
                  onBlur={handleCertInputBlur}
                  className="w-28 sm:w-36 text-right text-xl sm:text-2xl font-black text-white bg-transparent focus:outline-none tabular-nums"
                />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                  USD
                </span>
              </div>
            </div>

            {/* Tres Columnas Oficiales: A) Cuota Mensual | B) Cuota de Inscripción | A + B) Primer Pago */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
              {/* A) CUOTA MENSUAL */}
              <div className="p-4 sm:p-5 text-center flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                  A) CUOTA MENSUAL
                </div>
                <div className="my-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  {formatUsd(plan.cuotaMensual, { decimals: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Cuota fija mensual ({plan.plazoMeses} meses)
                </div>
              </div>

              {/* B) CUOTA DE INSCRIPCIÓN · MEMBRESÍA DE INGRESO */}
              <div className="p-4 sm:p-5 text-center flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/40 relative">
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                      B) Inscripción · Membresía
                    </span>
                    {plan.hasDiscount && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        50% DSCTO
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:text-emerald-300 bg-brand-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-brand-200/80 dark:border-emerald-500/30">
                    Pago único de ingreso
                  </span>
                </div>

                <div className="my-2 flex items-baseline justify-center gap-2">
                  {plan.hasDiscount && (
                    <span className="text-sm font-semibold text-slate-400 line-through tabular-nums">
                      {formatUsd(plan.inscripcionRegular, { decimals: 2 })}
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatUsd(plan.inscripcionEfectiva, { decimals: 2 })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {plan.hasDiscount
                    ? `Membresía única de afiliación (2.36% con IGV). No recurrente.`
                    : 'Membresía única de afiliación (4.72% con IGV). No recurrente.'}
                </div>
              </div>

              {/* A + B) PRIMER PAGO */}
              <div className="p-4 sm:p-5 text-center flex flex-col justify-between bg-emerald-50/60 dark:bg-emerald-950/30">
                <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#057c3f] dark:text-emerald-300">
                  A + B) PRIMER PAGO
                </div>
                <div className="my-2 text-2xl sm:text-3xl font-black text-[#057c3f] dark:text-emerald-400 tabular-nums">
                  {formatUsd(plan.primerPago, { decimals: 2 })}
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  {plan.hasDiscount
                    ? `Sin descuento sería ${formatUsd(plan.primerPagoSinDscto, { decimals: 2 })}`
                    : '1ra Cuota Mensual + Inscripción'}
                </div>
              </div>
            </div>
          </div>

          {/* 5. SECCIÓN INFERIOR EN DOS COLUMNAS: COSTO FINANCIERO + SORTEO (IZQ) | REMATE A y B (DER) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* =============================================================== */}
            {/* COLUMNA IZQUIERDA: COSTO FINANCIERO (SOBRECOSTO) + 1) SORTEO    */}
            {/* =============================================================== */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col justify-between space-y-6">
              {/* BLOQUE COSTO FINANCIERO */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-[#057c3f]" />
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                      COSTO FINANCIERO (EXPLICACIÓN SOBRECOSTO)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-emerald-950 text-brand-700 dark:text-emerald-300 border border-brand-200 dark:border-emerald-500/30">
                    0% Interés
                  </span>
                </div>

                {/* Líneas rellenables de la Proforma Oficial */}
                <div className="space-y-3 text-xs sm:text-sm">
                  {/* Línea 1: MESES x $ = $ */}
                  <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-emerald-950/80 text-brand-800 dark:text-emerald-300 font-black tabular-nums">
                        {plan.plazoMeses}
                      </span>
                      <span className="uppercase text-[11px] tracking-wider text-slate-500">
                        MESES
                      </span>
                      <span className="text-slate-400">×</span>
                      <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {formatUsd(plan.cuotaMensual, { decimals: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white tabular-nums text-sm sm:text-base">
                      <span className="text-slate-400 font-normal">=</span>
                      <span>{formatUsd(plan.totalCuotas, { decimals: 2 })}</span>
                    </div>
                  </div>

                  {/* Línea 2: Inscripción = $ */}
                  <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 flex-wrap">
                      <span>(+) Membresía de Ingreso (Inscripción)</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-brand-50 dark:bg-emerald-950 text-brand-700 dark:text-emerald-300 border border-brand-200 dark:border-emerald-500/40">
                        Pago Único
                      </span>
                      {plan.hasDiscount && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300">
                          50% Dscto. aplicado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white tabular-nums text-sm sm:text-base">
                      <span className="text-slate-400 font-normal">=</span>
                      <span>{formatUsd(plan.inscripcionEfectiva, { decimals: 2 })}</span>
                    </div>
                  </div>

                  {/* Línea 3: Total a devolver = $ */}
                  <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      (=) Total a devolver en {plan.plazosAnios} años
                    </span>
                    <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white tabular-nums text-sm sm:text-base">
                      <span className="text-slate-400 font-normal">=</span>
                      <span>{formatUsd(plan.totalDevolver, { decimals: 2 })}</span>
                    </div>
                  </div>

                  {/* Línea 4: Certificado(s) de compra = $ */}
                  <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      (−) Certificado(s) de compra (Capital recibido)
                    </span>
                    <div className="flex items-center gap-1.5 font-extrabold text-[#057c3f] dark:text-emerald-400 tabular-nums text-sm sm:text-base">
                      <span className="text-slate-400 font-normal">=</span>
                      <span>{formatUsd(plan.certificadoUsd, { decimals: 2 })}</span>
                    </div>
                  </div>

                  {/* Línea 5: SOBRECOSTO TOTAL ACUMULADO */}
                  <div className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#057c3f] to-[#046332] text-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-black uppercase tracking-wider text-xs sm:text-sm block">
                          (=) SOBRECOSTO TOTAL ACUMULADO
                        </span>
                        <span className="text-[11px] text-emerald-100 block">
                          Total en {plan.plazosAnios} años ({plan.costoPctCertificado}%) · Incluye Membresía de entrada + IGV (18%)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black tabular-nums block">
                          {formatUsd(plan.costoTotal, { decimals: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Desglose de Tasas: Gasto Real vs Prorrateado con Membresía e IGV */}
                    <div className="pt-2 border-t border-emerald-400/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-black text-[11px] uppercase tracking-wide">
                          Gasto Adm. Real:
                        </span>
                        <span className="text-sm font-black text-emerald-200 tabular-nums">
                          ~{plan.desgloseComercial.tasaFbp010AdmNetoAnual}% anual (sin IGV)
                        </span>
                        <span className="text-[10px] text-emerald-100 opacity-80">
                          (18% adm. en cuotas ÷ 11 años FBP010)
                        </span>
                      </div>

                      <div className="text-right text-[11px] text-emerald-100">
                        Tasa global con Membresía + IGV: <strong className="text-white">{plan.sobrecostoAnualPct}% anual</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estructura Administrativa: Membresía vs. Gasto Operativo */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                    <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 text-[11px]">
                      Estructura Administrativa: Membresía vs. Costo Operativo
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#057c3f] text-white">
                      1.64% Anual (sin IGV)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        Membresía Inicial (Pago Único)
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        La inscripción de <strong>{formatUsd(plan.inscripcionEfectiva, { decimals: 2 })} USD</strong> ({plan.hasDiscount ? '2.36%' : '4.72%'} con IGV) es un único abono de afiliación. No constituye un cargo mensual ni anual.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-[#057c3f] dark:text-emerald-400 block">
                        Gasto Administrativo en Cuotas
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        La tasa de administración contractual es de 18% para todo el plazo. En el Programa FBP010 (11 años), representa <strong>1.64% anual sin IGV</strong> (o 1.80% en 10 años).
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-800 leading-relaxed">
                    Nota institucional: El 18% de IGV corresponde al tributo de ley aplicable. El costo administrativo neto del capital es de 1.64% anual frente al 9.8% o más de TEA en la banca tradicional.
                  </div>
                </div>
              </div>

              {/* BLOQUE MODALIDADES DE ADJUDICACIÓN: 1) SORTEO */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-[#057c3f]" />
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                    MODALIDADES DE ADJUDICACIÓN
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        1) SORTEO:
                      </span>{' '}
                      <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Ahorro programado (90% del grupo)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-emerald-950 text-brand-700 dark:text-emerald-300">
                      0% Cuota Inicial
                    </span>
                  </div>

                  {/* Línea de tiempo 1 a Plazo con rombos estilo PDF */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                      <span>Mes 1</span>
                      <span className="text-[#057c3f] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                        ¡Adjudicado Mes {sorteoStats.mes}! Recibe {formatUsd(plan.certificadoUsd)}
                      </span>
                      <span>Mes {plan.plazoMeses}</span>
                    </div>

                    {/* Barra interactiva con rombos en los extremos */}
                    <div className="relative flex items-center py-2">
                      <div className="w-3 h-3 rotate-45 border-2 border-[#057c3f] bg-white dark:bg-slate-900 shrink-0 z-10" />
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 relative mx-1 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-[#057c3f]"
                          style={{ width: `${sorteoStats.pctAvance}%` }}
                        />
                      </div>
                      <div className="w-3 h-3 rotate-45 border-2 border-[#057c3f] bg-white dark:bg-slate-900 shrink-0 z-10" />
                    </div>

                    {/* Slider interactivo para mover el mes de sorteo en vivo (oculto en impresión) */}
                    <div className="print:hidden pt-1">
                      <input
                        type="range"
                        min="1"
                        max={plan.plazoMeses - 1}
                        value={sorteoStats.mes}
                        onChange={(e) => setMesSorteoEjemplo(Number(e.target.value))}
                        aria-label="Mes de adjudicación por sorteo"
                        className="rams-slider"
                      />
                    </div>

                    <div className="text-center text-[11px] font-extrabold uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                      PLAZO DEL PROGRAMA ({plan.plazoMeses} MESES)
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        Aportado al mes {sorteoStats.mes}:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatUsd(sorteoStats.invertidoHastaSorteo, { decimals: 2 })}
                        </strong>
                      </span>
                      <span>
                        Pendiente: <strong>{sorteoStats.mesesPendientes} cuotas</strong> de{' '}
                        {formatUsd(plan.cuotaMensual, { decimals: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* COLUMNA DERECHA: 2) REMATE (OPCIÓN A: PLAZO | OPCIÓN B: CUOTA)  */}
            {/* =============================================================== */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-[#057c3f]" />
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                      2) REMATE (ACELERACIÓN DE COMPRA)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Adelanto de cuotas
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Inversión de dinero (adelanto voluntario de cuotas solo si sales elegido ganador):
                </p>

                {/* Línea de Ejemplo: [N] Cuotas = $ [Desembolso] */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#057c3f]/40 dark:border-emerald-500/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Ejemplo:
                      </span>
                      <div className="inline-flex items-center gap-1 bg-brand-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-brand-200 dark:border-emerald-500/40">
                        <input
                          type="number"
                          min="1"
                          max={plan.plazoMeses - 1}
                          value={cuotasRemate}
                          onChange={(e) => {
                            const v = Math.min(
                              plan.plazoMeses - 1,
                              Math.max(1, Number(e.target.value) || 1)
                            );
                            setCuotasRemate(v);
                          }}
                          className="w-12 text-center font-black text-sm sm:text-base text-brand-700 dark:text-emerald-300 bg-transparent focus:outline-none tabular-nums"
                        />
                        <span className="text-xs font-bold text-brand-800 dark:text-emerald-300">
                          Cuotas
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-1">=</span>
                      <span className="text-lg sm:text-xl font-black text-[#057c3f] dark:text-emerald-400 tabular-nums">
                        {formatUsd(plan.desembolsoRemate, { decimals: 2 })}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-500">
                        ({plan.pctPlazoRemate}% del plazo · {cuotasRemate} ×{' '}
                        {formatUsd(plan.cuotaMensual, { decimals: 2 })})
                      </span>
                    </div>
                  </div>

                  {/* Botones rápidos de cuotas de remate (oculto al imprimir) */}
                  <div className="print:hidden space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={Math.min(60, cuotasRemate)}
                      onChange={(e) => setCuotasRemate(Number(e.target.value))}
                      aria-label="Cuotas a ofertar en remate"
                      className="rams-slider"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {REMATE_PRESETS.map((p) => (
                        <button
                          key={p.cuotas}
                          type="button"
                          onClick={() => setCuotasRemate(p.cuotas)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            cuotasRemate === p.cuotas
                              ? 'bg-[#057c3f] text-white border-[#057c3f]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* =========================================================== */}
                {/* ESCENARIO A) REDUCIR EL PLAZO DE PAGO                       */}
                {/* =========================================================== */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      A) Reducir el plazo de pago:
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                      Terminas {plan.remateOpcionA.aniosAhorrados} años antes
                    </span>
                  </div>

                  {/* Línea de tiempo 1 a Plazo con tramo final descontado */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                      <span>1</span>
                      <span className="text-[#057c3f] dark:text-emerald-400">
                        Nuevo plazo: {plan.remateOpcionA.mesesRestantes} meses
                      </span>
                      <span className="text-slate-400 line-through">{plan.plazoMeses}</span>
                    </div>

                    <div className="relative flex items-center py-1.5">
                      <div className="w-3 h-3 rotate-45 border-2 border-[#057c3f] bg-white dark:bg-slate-900 shrink-0 z-10" />
                      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 relative mx-1 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-[#057c3f] transition-all"
                          style={{ width: `${pctRestanteA}%` }}
                        />
                        <div
                          className="h-full bg-amber-400/80 dark:bg-amber-500/60 transition-all"
                          style={{ width: `${pctDescontadoA}%` }}
                          title={`-${plan.cuotasRemate} últimas cuotas canceladas`}
                        />
                      </div>
                      <div className="w-3 h-3 rotate-45 border-2 border-amber-500 bg-white dark:bg-slate-900 shrink-0 z-10" />
                    </div>
                  </div>

                  {/* Campos rellenados de la Proforma: $ [Cuota] x [Meses Restantes] meses */}
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-between gap-2 bg-slate-50 dark:bg-slate-800/70 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Misma cuota:</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums border-b-2 border-[#057c3f] px-1">
                        {formatUsd(plan.remateOpcionA.cuotaMensual, { decimals: 2 })}
                      </span>
                    </div>

                    <span className="text-sm font-black text-slate-400">×</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-base sm:text-lg font-black text-[#057c3f] dark:text-emerald-400 tabular-nums border-b-2 border-[#057c3f] px-2">
                        {plan.remateOpcionA.mesesRestantes}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                        meses
                      </span>
                    </div>
                  </div>
                </div>

                {/* =========================================================== */}
                {/* ESCENARIO B) REDUCIR LA CUOTA MENSUAL                       */}
                {/* =========================================================== */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      B) Reducir la cuota mensual:
                    </h4>
                    <span className="text-[11px] font-bold text-brand-700 dark:text-emerald-300 bg-brand-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                      Baja -{formatUsd(plan.remateOpcionB.ahorroPorMes, { decimals: 2 })}/mes (-{plan.remateOpcionB.pctReduccion}%)
                    </span>
                  </div>

                  {/* Línea de tiempo 1 a Plazo completo con cuota reducida */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                      <span>1</span>
                      <span className="text-[#01518c] dark:text-emerald-400">
                        Cuota baja de {formatUsd(plan.cuotaMensual, { decimals: 2 })} a{' '}
                        {formatUsd(plan.remateOpcionB.nuevaCuotaMensual, { decimals: 2 })}
                      </span>
                      <span>{plan.plazoMeses}</span>
                    </div>

                    <div className="relative flex items-center py-1.5">
                      <div className="w-3 h-3 rotate-45 border-2 border-[#057c3f] bg-white dark:bg-slate-900 shrink-0 z-10" />
                      <div className="flex-1 h-2.5 bg-gradient-to-r from-[#057c3f] to-emerald-400 relative mx-1 rounded-full" />
                      <div className="w-3 h-3 rotate-45 border-2 border-[#057c3f] bg-white dark:bg-slate-900 shrink-0 z-10" />
                    </div>
                  </div>

                  {/* Campos rellenados de la Proforma: $ [Nueva Cuota] x [Plazo] meses */}
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-between gap-2 bg-emerald-50/50 dark:bg-emerald-950/30 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Nueva cuota:</span>
                      <span className="text-base sm:text-lg font-black text-[#057c3f] dark:text-emerald-400 tabular-nums border-b-2 border-[#057c3f] px-1">
                        {formatUsd(plan.remateOpcionB.nuevaCuotaMensual, { decimals: 2 })}
                      </span>
                    </div>

                    <span className="text-sm font-black text-slate-400">×</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums border-b-2 border-[#057c3f] px-2">
                        {plan.remateOpcionB.mesesPlazo}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                        meses
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota de respaldo competitivo inferior */}
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span>
                  Modalidad a elección del asociado: <strong>Reducir Plazo (A)</strong> o <strong>Reducir Cuota (B)</strong> al momento de la adjudicación.
                </span>
              </div>
            </div>
          </div>

          {/* 5.B SECCIÓN INTEGRADA: PROGRESIÓN DE ADJUDICACIÓN · LA ESCALERA DESCENDENTE DE CUOTAS */}
          <div className="rounded-2xl border border-brand-200/90 dark:border-emerald-500/30 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#057c3f] dark:text-emerald-400">
                    Progresión de Adjudicación
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Comportamiento Histórico
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  La Escalera Descendente de Cuotas
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-[#057c3f] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                  <TrendingDown className="w-4 h-4 text-[#057c3f] dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Salida progresiva de postores ganadores</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEscaleraModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#057c3f] hover:bg-[#046332] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  title="Ampliar vista detallada de la escalera"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ampliar Detalle</span>
                </button>
              </div>
            </div>

            {/* Peldaños interactivos sincronizados con 2) REMATE */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-2 items-end pt-1">
              {FASES_ESCALERA.map((fase, idx) => {
                const isSelected =
                  cuotasRemate === fase.cuotasRef ||
                  (cuotasRemate >= fase.minCuotas &&
                    cuotasRemate <= fase.maxCuotas &&
                    !FASES_ESCALERA.some((f) => f.cuotasRef === cuotasRemate && f.id !== fase.id));
                const desembolsoFase = fase.cuotasRef * plan.cuotaMensual;
                const stepHeights = [
                  'sm:min-h-[205px]',
                  'sm:min-h-[182px]',
                  'sm:min-h-[160px]',
                  'sm:min-h-[138px]',
                  'sm:min-h-[116px]'
                ];

                return (
                  <button
                    key={fase.id}
                    type="button"
                    onClick={() => setCuotasRemate(fase.cuotasRef)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${stepHeights[idx]} ${
                      isSelected
                        ? 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/80 dark:to-slate-900 border-[#057c3f] dark:border-emerald-400 shadow-sm sm:-translate-y-1'
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-brand-400'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#057c3f] text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {fase.id}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {fase.rangoMeses}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white block tabular-nums leading-tight">
                          {fase.minCuotas}-{fase.maxCuotas}
                        </span>
                        <span className="text-[10px] font-semibold text-[#057c3f] dark:text-emerald-400 block uppercase tracking-wider">
                          Cuotas
                        </span>
                      </div>
                    </div>

                    <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <span className="text-[10px] text-slate-500 font-medium block uppercase">
                        Ref. ~{fase.cuotasRef}c
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums block">
                        {formatUsd(desembolsoFase)}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-semibold text-[#057c3f] dark:text-emerald-400 block mt-0.5">
                          ● Seleccionado
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Resumen de Mecánica Comercial + Competencia Real del Grupo */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#057c3f] dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Dinámica del Grupo (396 contratos):</strong> Solo el 10% (~40 asociados) oferta en remate y únicamente ~10 a 12 participantes superan las 20 cuotas. A medida que adjudican, el umbral de corte se reduce progresivamente.
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#057c3f] dark:text-emerald-400 shrink-0">
                Simulando: {cuotasRemate} cuotas ({formatUsd(plan.desembolsoRemate)})
              </span>
            </div>
          </div>
        </div>

        {/* 6. PIE INSTITUCIONAL OFICIAL FONBIENES */}
        <div className="bg-[#057c3f] px-5 sm:px-8 py-3.5 text-white flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="font-medium">
            <strong className="font-extrabold">FonBienes Perú</strong>{' '}
            <span className="mx-1.5 opacity-60">|</span> Más de 50 años en Latinoamérica
          </div>
          <div className="font-extrabold tracking-wide tabular-nums">RUC: 20523395701</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / PANTALLA AMPLIADA: LA ESCALERA DESCENDENTE EN GRANDE             */}
      {/* ========================================================================= */}
      {isEscaleraModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsEscaleraModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-[#0B1319] rounded-3xl border border-slate-200 dark:border-emerald-500/30 shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#057c3f] dark:text-emerald-400">
                    Metodología Temporal · Tendencia Verificada
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Supervisado SMV
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  La Escalera Descendente de Cuotas · Vista Ampliada
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Certificado actual: <strong className="text-slate-800 dark:text-white">{formatUsd(plan.certificadoUsd)} USD</strong> · Cuota mensual: <strong className="text-slate-800 dark:text-white">{formatUsd(plan.cuotaMensual, { decimals: 2 })} USD</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEscaleraModalOpen(false)}
                className="self-end sm:self-center p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Escalera en grande */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end pt-2">
              {FASES_ESCALERA.map((fase, idx) => {
                const isSelected =
                  cuotasRemate === fase.cuotasRef ||
                  (cuotasRemate >= fase.minCuotas &&
                    cuotasRemate <= fase.maxCuotas &&
                    !FASES_ESCALERA.some((f) => f.cuotasRef === cuotasRemate && f.id !== fase.id));
                const desembolsoFase = fase.cuotasRef * plan.cuotaMensual;
                const stepHeights = [
                  'sm:min-h-[290px]',
                  'sm:min-h-[260px]',
                  'sm:min-h-[230px]',
                  'sm:min-h-[200px]',
                  'sm:min-h-[170px]'
                ];

                return (
                  <button
                    key={fase.id}
                    type="button"
                    onClick={() => {
                      setCuotasRemate(fase.cuotasRef);
                    }}
                    className={`p-4 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${stepHeights[idx]} ${
                      isSelected
                        ? 'bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 dark:from-emerald-950 dark:via-slate-900 dark:to-emerald-950/60 border-[#057c3f] dark:border-emerald-400 shadow-xl sm:-translate-y-2'
                        : 'bg-slate-50/70 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#057c3f] text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {fase.id}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {fase.rangoMeses}
                        </span>
                      </div>

                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                          {fase.minCuotas}-{fase.maxCuotas}
                        </div>
                        <div className="text-xs font-black text-[#057c3f] dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                          Cuotas a Ofertar
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                        {fase.nombre}
                      </div>
                    </div>

                    <div className="w-full pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-2 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                        Desembolso (~{fase.cuotasRef}c)
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums block">
                        {formatUsd(desembolsoFase)}
                      </span>
                      {isSelected ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#057c3f] text-white text-[10px] font-bold">
                          ✓ Seleccionado
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block hover:text-[#057c3f]">
                          Clic para aplicar
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Embudo de la Competencia Real en Grande */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#057c3f] dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-[#01518c] dark:text-emerald-400">
                  El Embudo Real de Cada Asamblea (Grupo de 396 Asociados)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Total Grupo</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 my-0.5 block">396</span>
                  <span className="text-[11px] text-slate-500">Contratos totales</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">2. Ofertan Remate</span>
                  <span className="text-xl sm:text-2xl font-black text-[#057c3f] dark:text-emerald-400 my-0.5 block">~40</span>
                  <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300 font-bold">Solo el 10% del grupo</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">3. Ofertas Bajas</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-400 my-0.5 block">28</span>
                  <span className="text-[11px] text-slate-500">70% oferta 1-10 cuotas</span>
                </div>

                <div className="p-3 rounded-xl bg-[#057c3f] text-white shadow-md">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-100 block">4. Competencia Real</span>
                  <span className="text-xl sm:text-2xl font-black my-0.5 block">Solo ~12</span>
                  <span className="text-[11px] text-emerald-100 font-bold">Asociados (+20 cuotas)</span>
                </div>
              </div>
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Escenario activo: <strong className="text-[#057c3f] dark:text-emerald-400 font-extrabold">{cuotasRemate} cuotas ({formatUsd(plan.desembolsoRemate)})</strong> configurado en tu Proforma.
              </div>

              <button
                type="button"
                onClick={() => setIsEscaleraModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#057c3f] hover:bg-[#046332] text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-sm self-end sm:self-auto"
              >
                Listo / Volver a la Proforma
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
