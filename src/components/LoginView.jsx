import React from 'react';
import { ShieldCheck, BarChart3, Compass, CheckCircle2, Building2 } from 'lucide-react';
import FonbienesLogo from './FonbienesLogo';
import SignInCard from './ui/sign-in-card-2';

export default function LoginView({ onLoginSuccess, totalAsambleas = 12 }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#F5FAF7] via-[#EAF5EF] to-[#E3F0E9] dark:from-[#071114] dark:via-[#091618] dark:to-[#050D11]">
      {/* Background radial ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] bg-gradient-to-b from-emerald-500/10 via-brand-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
        {/* Left Column: Institutional Brand Showcase (Desktop only >= 1024px) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 xl:p-10 rounded-3xl bg-gradient-to-br from-[#06293D] via-[#054E2C] to-[#046332] text-white shadow-2xl relative overflow-hidden min-h-[580px] border border-emerald-500/20">
          {/* Subtle light overlay */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          {/* Top section */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <FonbienesLogo variant="white" className="h-8 w-auto" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Supervisado SMV</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Programa FBP010 · Grupo 001
              </span>
              <h1 className="text-3xl font-extrabold leading-tight text-white tracking-tight">
                Inteligencia Comercial y Resultados Ejecutivos
              </h1>
              <p className="text-sm text-emerald-100/80 leading-relaxed">
                Plataforma de análisis de asambleas, cotización en tiempo real y simulación estratégica
                de adjudicación para asesores de Fonbienes Perú E.A.F.C.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <BarChart3 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">{totalAsambleas} Asambleas Consolidadas</div>
                  <div className="text-[11px] text-emerald-100/70">
                    Estadísticas reales de corte ganador, sorteos y capital adjudicado.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <Compass className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Ruta Estratégica & Escalera</div>
                  <div className="text-[11px] text-emerald-100/70">
                    Presentación comercial interactiva: sorteo sin inicial vs. remate acelerado.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="pt-6 border-t border-white/15 relative z-10 flex items-center justify-between text-xs text-emerald-100/80">
            <span>Uso exclusivo para asesores comerciales</span>
            <span className="font-mono text-[11px] text-emerald-300">v2.2.0 · FonBienes</span>
          </div>
        </div>

        {/* Right Column: 3D Interactive Sign In Card */}
        <div className="col-span-1 lg:col-span-6 w-full flex items-center justify-center">
          <SignInCard onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
}

