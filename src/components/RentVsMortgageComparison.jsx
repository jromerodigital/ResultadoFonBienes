import React, { useState } from 'react';
import {
  Home,
  Building2,
  TrendingUp,
  Coins,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { formatUsd } from '../domain/fonbienesAnalytics';

export default function RentVsMortgageComparison({ plan }) {
  // Estado de simulación del alquiler y tiempo de adjudicación
  const [alquilerMensual, setAlquilerMensual] = useState(400); // USD/mes
  const [mesesEspera, setMesesEspera] = useState(36); // 36 meses (3 años)
  const [factorBanco, setFactorBanco] = useState(2.25); // 2.25x en crédito hipotecario tradicional (20 años)
  const [copiedScript, setCopiedScript] = useState(false);

  // Cálculos dinámicos
  const totalAlquiler = alquilerMensual * mesesEspera;
  const aniosEspera = Number((mesesEspera / 12).toFixed(1));
  const totalFonbienes = plan.totalDevolver;
  const totalFonbienesConAlquiler = totalFonbienes + totalAlquiler;

  const totalBanco = Math.round(plan.certificadoUsd * factorBanco);
  const interesesBanco = totalBanco - plan.certificadoUsd;
  const inicialBanco = Math.round(plan.certificadoUsd * 0.15); // 15% inicial

  const diferenciaAhorro = totalBanco - totalFonbienesConAlquiler;
  const pctAhorro = totalBanco > 0 ? Number(((diferenciaAhorro / totalBanco) * 100).toFixed(1)) : 0;

  // Porcentaje para barras comparativas
  const pctFonbienesBar = Math.min(100, Math.round((totalFonbienesConAlquiler / totalBanco) * 100));
  const pctAhorroBar = 100 - pctFonbienesBar;

  const FACTORES_BANCO = [
    { label: '2.0x (15 años)', valor: 2.0 },
    { label: '2.25x (20 años)', valor: 2.25 },
    { label: '2.5x (25 años)', valor: 2.5 }
  ];

  const PRESETS_ALQUILER = [250, 350, 450, 600, 800];
  const PRESETS_ESPERA = [
    { label: '1 año (12m)', meses: 12 },
    { label: '2 años (24m)', meses: 24 },
    { label: '3 años (36m)', meses: 36 },
    { label: '4 años (48m)', meses: 48 }
  ];

  const handleCopyPitch = async () => {
    const text = [
      `*ECUACIÓN INMOBILIARIA: FONBIENES VS. BANCO + ALQUILER*`,
      `Certificado Inmueble: *${formatUsd(plan.certificadoUsd)} USD*`,
      ``,
      `*1. VÍA FONBIENES (SISTEMA DE FONDOS COLECTIVOS):*`,
      `• Total a devolver FonBienes: *${formatUsd(totalFonbienes, { decimals: 2 })} USD* (sólo ~1.64% anual sin IGV en cuotas).`,
      `• Supuesto conservador: Pagas *${formatUsd(alquilerMensual)} USD/mes* de alquiler durante *${mesesEspera} meses (${aniosEspera} años)* mientras adjudicas:`,
      `  Alquiler acumulado = *${formatUsd(totalAlquiler)} USD*`,
      `• *TOTAL REAL FONBIENES + ALQUILER: ${formatUsd(totalFonbienesConAlquiler, { decimals: 2 })} USD*`,
      ``,
      `*2. VÍA CRÉDITO HIPOTECARIO BANCARIO (${factorBanco}x):*`,
      `• Solicitas ${formatUsd(plan.certificadoUsd)} USD y el banco te cobra *${formatUsd(totalBanco)} USD* en intereses acumulados.`,
      `• Te exige Cuota Inicial de *${formatUsd(inicialBanco)} USD (15%)* de entrada.`,
      ``,
      `*3. EL RESULTADO DEMOLEDOR:*`,
      `• Banco (${formatUsd(totalBanco)}) − FonBienes + Alquiler (${formatUsd(totalFonbienesConAlquiler, { decimals: 2 })})`,
      `• *DIFERENCIA A TU FAVOR: +${formatUsd(diferenciaAhorro, { decimals: 2 })} USD (${pctAhorro}% de ahorro).*`,
      ``,
      `_Conclusión: Aun pagando ${aniosEspera} años de alquiler de tu bolsillo, con FonBienes conservas ${formatUsd(diferenciaAhorro, { decimals: 2 })} USD en tu patrimonio en lugar de entregárselo al banco en intereses._`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border-2 border-emerald-500/30 dark:border-emerald-500/25 bg-white dark:bg-slate-900/80 overflow-hidden shadow-xs space-y-6 p-5 sm:p-7">
      {/* Cabecera Inspirada en el Video explicativo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#057c3f] dark:bg-emerald-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#057c3f] dark:text-emerald-400">
              Ecuación Inmobiliaria Estratégica
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              Destructor de Objeción Alquiler
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            FonBienes vs. Crédito Hipotecario + Alquiler
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Demostración matemática para el cliente que duda por la inmediatez del banco:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              aun pagando alquiler durante años mientras adjudica, con FonBienes ahorra decenas de miles de dólares
            </strong>.
          </p>
        </div>

        {/* Botón copiar argumento comercial */}
        <button
          type="button"
          onClick={handleCopyPitch}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer border border-slate-300/80 dark:border-slate-700 shrink-0 self-start lg:self-center"
        >
          {copiedScript ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              <span className="text-emerald-700 dark:text-emerald-300">¡Guión Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Copiar Argumento Comercial</span>
            </>
          )}
        </button>
      </div>

      {/* Controles Dinámicos del Asesor / Cliente */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Control 1: Alquiler Mensual */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-[#057c3f] dark:text-emerald-400" />
              <span>Alquiler Mensual del Cliente:</span>
            </label>
            <span className="text-sm font-black text-[#057c3f] dark:text-emerald-400 tabular-nums">
              {formatUsd(alquilerMensual)}/mes
            </span>
          </div>

          <input
            type="range"
            min="150"
            max="1200"
            step="25"
            value={alquilerMensual}
            onChange={(e) => setAlquilerMensual(Number(e.target.value))}
            aria-label="Alquiler mensual del cliente en USD"
            className="rams-slider"
          />

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {PRESETS_ALQUILER.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAlquilerMensual(val)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums transition-all cursor-pointer ${
                  alquilerMensual === val
                    ? 'bg-[#057c3f] text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Control 2: Meses de Espera / Adjudicación */}
        <div className="md:col-span-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#01518c] dark:text-blue-400" />
              <span>Tiempo de Espera:</span>
            </label>
            <span className="text-sm font-black text-[#01518c] dark:text-blue-400 tabular-nums">
              {mesesEspera} meses ({aniosEspera} años)
            </span>
          </div>

          <input
            type="range"
            min="12"
            max="60"
            step="6"
            value={mesesEspera}
            onChange={(e) => setMesesEspera(Number(e.target.value))}
            aria-label="Meses de espera para adjudicar"
            className="rams-slider"
          />

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {PRESETS_ESPERA.map((p) => (
              <button
                key={p.meses}
                type="button"
                onClick={() => setMesesEspera(p.meses)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums transition-all cursor-pointer ${
                  mesesEspera === p.meses
                    ? 'bg-[#01518c] text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Control 3: Multiplicador Hipotecario Bancario */}
        <div className="md:col-span-3 space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            <span>Factor Hipoteca Bancaria:</span>
          </label>

          <div className="flex flex-col gap-1.5">
            {FACTORES_BANCO.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFactorBanco(f.valor)}
                className={`w-full py-1 px-2.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer border ${
                  factorBanco === f.valor
                    ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 text-rose-800 dark:text-rose-300 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visualización en Dos Mitades (Estilo Split Sheet como en el Video) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* =============================================================== */}
        {/* PARTE SUPERIOR / IZQUIERDA: FONBIENES + ALQUILER                 */}
        {/* =============================================================== */}
        <div className="rounded-2xl border-2 border-[#057c3f]/40 dark:border-emerald-500/40 p-5 sm:p-6 bg-gradient-to-b from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-slate-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#057c3f]" />
                <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#057c3f] dark:text-emerald-400">
                  FONBIENES + ALQUILER ({aniosEspera} AÑOS)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Ahorro Planificado
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Certificado de Financiamiento:
                </span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums">
                  {formatUsd(plan.certificadoUsd, { decimals: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    (+) Total FonBienes ({plan.plazoMeses} meses):
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Gasto adm. ~1.64% anual + Membresía 50% OFF
                  </span>
                </div>
                <span className="font-black text-slate-900 dark:text-white tabular-nums">
                  {formatUsd(totalFonbienes, { decimals: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    (+) Alquiler durante la espera:
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">
                    {formatUsd(alquilerMensual)}/mes × {mesesEspera} meses ({aniosEspera} años)
                  </span>
                </div>
                <span className="font-black text-[#057c3f] dark:text-emerald-300 tabular-nums text-sm sm:text-base">
                  + {formatUsd(totalAlquiler, { decimals: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Subtotal FonBienes + Alquiler */}
          <div className="pt-3 border-t border-emerald-200 dark:border-emerald-500/30">
            <div className="p-3.5 rounded-xl bg-[#057c3f] text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold block text-emerald-100">
                  (=) DESEMBOLSO TOTAL FONBIENES + ALQUILER
                </span>
                <span className="text-[10px] text-emerald-200">
                  Costo total del plan + {mesesEspera} meses de vivienda en arriendo
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black tabular-nums">
                  {formatUsd(totalFonbienesConAlquiler, { decimals: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* PARTE INFERIOR / DERECHA: CRÉDITO HIPOTECARIO BANCARIO          */}
        {/* =============================================================== */}
        <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 p-5 sm:p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  CRÉDITO HIPOTECARIO BANCARIO
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                TEA 9.8% - 12% Anual
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Crédito Solicitado al Banco:
                </span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums">
                  {formatUsd(plan.certificadoUsd, { decimals: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Intereses y Seguros Bancarios:
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">
                    Factor multiplicador de {factorBanco}x el capital
                  </span>
                </div>
                <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  + {formatUsd(interesesBanco, { decimals: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/40">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    (!) Cuota Inicial exigida de entrada:
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 block">
                    15% al contado al firmar con el banco (descapitalización)
                  </span>
                </div>
                <span className="font-black text-amber-800 dark:text-amber-300 tabular-nums text-sm sm:text-base">
                  {formatUsd(inicialBanco, { decimals: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Subtotal Banco */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3.5 rounded-xl bg-slate-800 dark:bg-slate-800 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold block text-slate-300">
                  (=) TOTAL A PAGAR AL BANCO ({factorBanco}x)
                </span>
                <span className="text-[10px] text-slate-400">
                  Total de cuotas hipotecarias durante el crédito
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black tabular-nums">
                  {formatUsd(totalBanco, { decimals: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TARJETA DE CIERRE: DIFERENCIA / AHORRO PATRIMONIAL NETO         */}
      {/* =============================================================== */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-900 via-[#057c3f] to-emerald-800 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-400/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-200">
              EL RESULTADO DEMOLEDOR: LA DIFERENCIA A FAVOR DEL CLIENTE
            </span>
          </div>

          <span className="text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white self-start sm:self-auto">
            {pctAhorro}% Menos Costo Total
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">
              Diferencia Neta a favor de FonBienes
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight tabular-nums text-white mt-1">
              + {formatUsd(diferenciaAhorro, { decimals: 2 })} USD
            </div>
            <div className="text-xs text-emerald-200 mt-1 font-medium">
              Ahorro patrimonial neto tras cubrir {mesesEspera} meses de alquiler de tu bolsillo.
            </div>
          </div>

          {/* Gráfico de barras horizontal comparativo */}
          <div className="w-full md:w-72 space-y-2 bg-black/20 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Banco Hipotecario:</span>
              <span className="tabular-nums">{formatUsd(totalBanco)}</span>
            </div>
            <div className="h-3 w-full bg-slate-700/80 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold pt-1">
              <span>FonBienes + Alquiler:</span>
              <span className="tabular-nums text-emerald-200">
                {formatUsd(totalFonbienesConAlquiler)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-700/80 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-400 transition-all rounded-full"
                style={{ width: `${pctFonbienesBar}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cita de Cierre Comercial */}
        <div className="pt-2 text-xs sm:text-sm text-emerald-100 border-t border-emerald-400/25 leading-relaxed">
          <strong>Argumento de Oro para el Cliente:</strong> &ldquo;El alquiler que pagas mientras esperas tu adjudicación no es dinero perdido; es el puente estratégico que te permite conservar <strong>{formatUsd(diferenciaAhorro, { decimals: 2 })} USD</strong> en tu bolsillo en vez de regalárselos al banco en intereses.&rdquo;
        </div>
      </div>
    </div>
  );
}
