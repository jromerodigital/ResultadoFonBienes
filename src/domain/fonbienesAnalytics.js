/**
 * Pure analytical derivations & empirical backtesting over the sanitized
 * aggregate FonBienes dataset (zero individual contract or cupo records).
 */

const INTERNAL_RATES = {
  fonbienes: { coef: 1.2124, plazoMeses: 132 },
  maquisistema: { coef: 1.295, plazoMeses: 150 },
  pandero: { coef: 1.2714, plazoMeses: 120 }
};

export function roundUpToCents(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil((value - 1e-9) * 100) / 100;
}

export function roundToCents(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function calculateMonthlyInstallment(
  certificadoUsd,
  coef = INTERNAL_RATES.fonbienes.coef,
  plazoMeses = INTERNAL_RATES.fonbienes.plazoMeses
) {
  if (!certificadoUsd || !plazoMeses) return 0;
  return roundUpToCents((certificadoUsd * coef) / plazoMeses);
}

export function calculateRemateDisbursement(
  certificadoUsd,
  cuotas,
  coef = INTERNAL_RATES.fonbienes.coef,
  plazoMeses = INTERNAL_RATES.fonbienes.plazoMeses
) {
  if (!cuotas || cuotas <= 0) return 0;
  const cuotaMensual = calculateMonthlyInstallment(certificadoUsd, coef, plazoMeses);
  return roundToCents(cuotas * cuotaMensual);
}

export function formatUsd(amount, { compact = false, decimals = 0 } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (compact) {
    if (abs >= 1_000_000) {
      return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}$${Math.round(abs / 1_000)}k`;
    }
  }

  if (decimals > 0) {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}

export function computeExecutiveSummary(dataset, periodFilter = 'ALL') {
  const { config, asambleas } = dataset;
  const latestAsamblea = asambleas[asambleas.length - 1];

  const scopedAssemblies =
    periodFilter === 'ALL'
      ? asambleas
      : asambleas.filter((a) => a.nro === Number(periodFilter));

  const scopedAsamblea =
    periodFilter === 'ALL'
      ? latestAsamblea
      : scopedAssemblies[0] || latestAsamblea;

  const capitalTotal = scopedAssemblies.reduce(
    (sum, a) => sum + (a.capitalEntregado || 0),
    0
  );
  const capitalSorteo = scopedAssemblies.reduce(
    (sum, a) => sum + (a.capitalSorteo || 0),
    0
  );
  const totalTitulares = scopedAssemblies.reduce(
    (sum, a) => sum + (a.totalTitulares || 0),
    0
  );
  const totalRemateTitulares = scopedAssemblies.reduce(
    (sum, a) => sum + (a.titularesRemate || 0),
    0
  );
  const totalSorteoTitulares = scopedAssemblies.reduce(
    (sum, a) => sum + (a.titularesSorteo || 0),
    0
  );

  const refCuotas =
    periodFilter === 'ALL'
      ? latestAsamblea?.minCuotasGanadoras ?? 28
      : scopedAsamblea?.minCuotasGanadoras ?? 0;

  const refPctPlazo = Number(((refCuotas / config.plazoMeses) * 100).toFixed(1));

  const allMinBids = asambleas
    .map((a) => a.minCuotasGanadoras)
    .filter((v) => v !== null && v > 0)
    .sort((a, b) => a - b);

  let p25 = allMinBids[0] ?? 22;
  let p75 = allMinBids[allMinBids.length - 1] ?? 34;
  if (allMinBids.length >= 4) {
    p25 = allMinBids[Math.floor(allMinBids.length * 0.25)];
    p75 = allMinBids[Math.floor(allMinBids.length * 0.75)];
  }
  const medianCuotas =
    allMinBids.length > 0
      ? allMinBids[Math.floor(allMinBids.length / 2)]
      : 28;

  // Base reference example ($40,000 USD certificate) for quick advisor comparison
  const refCertUsd = 40000;
  const fbCoef = INTERNAL_RATES.fonbienes.coef;
  const maquiCoef = INTERNAL_RATES.maquisistema.coef;
  const panderoCoef = INTERNAL_RATES.pandero.coef;

  const refEjemplo40k = {
    certificadoUsd: refCertUsd,
    fonbienesCuota: calculateMonthlyInstallment(refCertUsd, fbCoef, config.plazoMeses),
    fonbienesRemate: calculateRemateDisbursement(
      refCertUsd,
      refCuotas,
      fbCoef,
      config.plazoMeses
    ),
    maquiCuota: calculateMonthlyInstallment(
      refCertUsd,
      maquiCoef,
      config.competidores.maquisistema.plazoMeses
    ),
    maquiRemate: calculateRemateDisbursement(
      refCertUsd,
      config.competidores.maquisistema.cuotasRemateRef,
      maquiCoef,
      config.competidores.maquisistema.plazoMeses
    ),
    panderoCuota: calculateMonthlyInstallment(
      refCertUsd,
      panderoCoef,
      config.competidores.pandero.plazoMeses
    ),
    panderoRemate: calculateRemateDisbursement(
      refCertUsd,
      config.competidores.pandero.cuotasRemateRef,
      panderoCoef,
      config.competidores.pandero.plazoMeses
    )
  };

  return {
    isFilteredSingle: periodFilter !== 'ALL',
    scopedAsamblea,
    latestAsamblea,
    refCuotas,
    refPctPlazo,
    capitalTotal,
    capitalSorteo,
    totalTitulares,
    totalRemateTitulares,
    totalSorteoTitulares,
    rangoIntercuartil: { min: p25, max: p75, mediana: medianCuotas },
    refEjemplo40k
  };
}

export function simulateCommercialScenario(dataset, certificadoUsd, cuotasOfertadas) {
  const { config, asambleas } = dataset;
  const { plazoMeses, competidores } = config;

  const fbCoef = INTERNAL_RATES.fonbienes.coef;
  const panderoCoef = INTERNAL_RATES.pandero.coef;
  const maquiCoef = INTERNAL_RATES.maquisistema.coef;

  const fbCuotaMensual = calculateMonthlyInstallment(certificadoUsd, fbCoef, plazoMeses);
  const fbDesembolso = roundToCents(cuotasOfertadas * fbCuotaMensual);
  const fbPctPlazo = (cuotasOfertadas / plazoMeses) * 100;

  const panderoCuotaMensual = calculateMonthlyInstallment(
    certificadoUsd,
    panderoCoef,
    competidores.pandero.plazoMeses
  );
  const panderoDesembolso = roundToCents(
    competidores.pandero.cuotasRemateRef * panderoCuotaMensual
  );
  const ahorroVsPandero = roundToCents(panderoDesembolso - fbDesembolso);

  const maquiCuotaMensual = calculateMonthlyInstallment(
    certificadoUsd,
    maquiCoef,
    competidores.maquisistema.plazoMeses
  );
  const maquiDesembolso = roundToCents(
    competidores.maquisistema.cuotasRemateRef * maquiCuotaMensual
  );
  const ahorroVsMaqui = roundToCents(maquiDesembolso - fbDesembolso);

  const validAsambleas = asambleas.filter((a) => a.minCuotasGanadoras !== null);
  const wonAsambleas = validAsambleas.filter(
    (a) => cuotasOfertadas >= a.minCuotasGanadoras
  );
  const recentWindow = validAsambleas.slice(-6);
  const wonRecent = recentWindow.filter(
    (a) => cuotasOfertadas >= a.minCuotasGanadoras
  );

  const empiricalRate =
    validAsambleas.length > 0
      ? Math.round((wonAsambleas.length / validAsambleas.length) * 100)
      : 0;

  let tier = 'competitive';
  let statusLabel = 'Rango Competitivo';
  if (empiricalRate >= 80) {
    tier = 'high';
    statusLabel = 'Cobertura Histórica Alta';
  } else if (empiricalRate < 45) {
    tier = 'exploratory';
    statusLabel = 'Oferta Conservadora';
  }

  return {
    certificadoUsd,
    cuotasOfertadas,
    fbCuotaMensual,
    fbDesembolso,
    fbPctPlazo: Number(fbPctPlazo.toFixed(1)),
    pandero: {
      plazoMeses: competidores.pandero.plazoMeses,
      cuotasRef: competidores.pandero.cuotasRemateRef,
      pctRef: competidores.pandero.pctPlazoRef,
      cuotaMensual: panderoCuotaMensual,
      desembolso: panderoDesembolso,
      ahorroLiquidez: ahorroVsPandero
    },
    maquisistema: {
      plazoMeses: competidores.maquisistema.plazoMeses,
      cuotasRef: competidores.maquisistema.cuotasRemateRef,
      pctRef: competidores.maquisistema.pctPlazoRef,
      cuotaMensual: maquiCuotaMensual,
      desembolso: maquiDesembolso,
      ahorroLiquidez: ahorroVsMaqui
    },
    backtest: {
      totalEvaluadas: validAsambleas.length,
      ganadasTotal: wonAsambleas.length,
      empiricalRate,
      recentTotal: recentWindow.length,
      recentWon: wonRecent.length,
      tier,
      statusLabel
    }
  };
}

export const EMBUDO_COMPETENCIA = {
  totalGrupo: 396,
  participantesRemate: 40,
  pctParticipantes: 10.1,
  asociadosPlanificacion: 356,
  pctPlanificacion: 89.9,
  ofertasBajas: 28,
  pctBajas: 70.0,
  ofertasCompetitivas: 12,
  pctCompetitivas: 30.0
};

export const FASES_ESCALERA = [
  {
    id: 1,
    rangoMeses: 'Meses 1 a 4',
    mesMin: 1,
    mesMax: 4,
    minCuotas: 28,
    maxCuotas: 30,
    cuotasRef: 29,
    nombre: 'Aceleración Inmediata',
    perfil: 'Asociados con capital o liquidez inmediata',
    badge: 'Alta Demanda Inicial',
    descripcion: 'Pico inicial del grupo. Quienes tienen capital suficiente ofertan para asegurar su corte en las primeras asambleas.'
  },
  {
    id: 2,
    rangoMeses: 'Meses 4 a 9',
    mesMin: 4,
    mesMax: 9,
    minCuotas: 24,
    maxCuotas: 28,
    cuotasRef: 26,
    nombre: 'Reducción Progresiva',
    perfil: 'Asociados con ahorro planificado a corto plazo',
    badge: 'Salida de Ganadores',
    descripcion: 'Los postores de corte alto ya adjudicaron y no vuelven a competir. El umbral de cuotas desciende consistentemente.'
  },
  {
    id: 3,
    rangoMeses: 'Meses 9 a 15',
    mesMin: 9,
    mesMax: 15,
    minCuotas: 15,
    maxCuotas: 24,
    cuotasRef: 20,
    nombre: 'Ventana Estratégica Óptima',
    perfil: 'Planificadores que acumularon cuotas y participaron de sorteos',
    badge: 'Punto Dulce de Entrada',
    descripcion: 'Equilibrio perfecto: el cliente ahorró meses participando gratis en el sorteo y ahora adjudica con mucho menor desembolso.'
  },
  {
    id: 4,
    rangoMeses: 'Meses 15 a 24',
    mesMin: 15,
    mesMax: 24,
    minCuotas: 10,
    maxCuotas: 15,
    cuotasRef: 12,
    nombre: 'Adjudicación Accesible',
    perfil: 'Ahorro programado con mínimo esfuerzo de liquidez',
    badge: 'Baja Competencia',
    descripcion: 'Mínima competencia de remate. Adjudicación rápida con esfuerzo de capital reducido.'
  },
  {
    id: 5,
    rangoMeses: 'Meses 24+',
    mesMin: 24,
    mesMax: 120,
    minCuotas: 1,
    maxCuotas: 10,
    cuotasRef: 5,
    nombre: 'Suelo de Remate',
    perfil: 'Adjudicación natural con posturas testimoniales',
    badge: 'Consolidación',
    descripcion: 'Las ofertas se reducen al mínimo. La gran mayoría del grupo ya está adjudicada o continúa por sorteo mensual.'
  }
];

export function calculateCommercialPitchPlan({
  certificadoUsd,
  plazoMeses = 120,
  hasDiscount = true,
  cuotasRemate = 28
}) {
  const coef = INTERNAL_RATES.fonbienes.coef;
  const cuotaMensual = calculateMonthlyInstallment(certificadoUsd, coef, plazoMeses);

  // Inscripción base: 4% + IGV (18%) = 4.72% del certificado
  const inscripcionRegular = roundToCents(certificadoUsd * 0.0472);
  const descuentoInscripcion = hasDiscount ? roundToCents(inscripcionRegular * 0.5) : 0;
  const inscripcionEfectiva = roundToCents(inscripcionRegular - descuentoInscripcion);

  // Primer pago para ingresar al fondo
  const primerPago = roundToCents(cuotaMensual + inscripcionEfectiva);
  const primerPagoSinDscto = roundToCents(cuotaMensual + inscripcionRegular);

  // Total a devolver al finalizar el plazo
  const totalCuotas = roundToCents(cuotaMensual * plazoMeses);
  const totalDevolver = roundToCents(totalCuotas + inscripcionEfectiva);

  // Costo total de financiamiento (Sobrecosto)
  const costoTotal = roundToCents(totalDevolver - certificadoUsd);
  const costoPctCertificado = Number(((costoTotal / certificadoUsd) * 100).toFixed(2));
  const plazosAnios = Number((plazoMeses / 12).toFixed(1));
  const sobrecostoAnualPct = Number((costoPctCertificado / (plazoMeses / 12)).toFixed(2));
  const sobrecostoMensualUsd = roundToCents(costoTotal / plazoMeses);

  // Desglose Comercial: Membresía Única vs Gasto Administrativo Real en Cuotas
  // Gasto administrativo contractual puro sin IGV: 18% del certificado en todo el plazo
  const gastoAdmNetoTotal = roundToCents(certificadoUsd * 0.18);
  const gastoAdmIgvTotal = roundToCents(gastoAdmNetoTotal * 0.18);
  const gastoAdmTotalCuotas = roundToCents(totalCuotas - certificadoUsd);
  
  // Tasa de gasto administrativo puro anual (sin IGV):
  // En programa oficial FBP010 (132 meses / 11 años) = 18% / 11 = 1.636% ≈ 1.64% anual
  // En plazo de 120 meses (10 años) = 18% / 10 = 1.80% anual
  const gastoAdmAnualNetoPct = Number((18 / (plazoMeses / 12)).toFixed(2));
  const tasaFbp010AdmNetoAnual = 1.64;

  // Desglose de Membresía / Inscripción (Pago único al afiliarse)
  const membresiaNetoPct = hasDiscount ? 2.00 : 4.00;
  const membresiaNetoUsd = roundToCents(certificadoUsd * (membresiaNetoPct / 100));
  const membresiaIgvUsd = roundToCents(membresiaNetoUsd * 0.18);
  const membresiaTotalUsd = inscripcionEfectiva; // 2.36% o 4.72% con IGV

  // Remate estimado
  const desembolsoRemate = roundToCents(cuotasRemate * cuotaMensual);
  const pctPlazoRemate = Number(((cuotasRemate / plazoMeses) * 100).toFixed(1));

  // Remate Escenario A: Reducir el plazo de pago (misma cuota mensual, menos meses)
  const mesesRestantesPlazoReducido = Math.max(1, plazoMeses - cuotasRemate);
  const aniosAhorradosRemate = Number((cuotasRemate / 12).toFixed(1));
  const saldoRestanteCuotas = roundToCents(mesesRestantesPlazoReducido * cuotaMensual);

  // Remate Escenario B: Reducir la cuota mensual (mismo plazo total, menor cuota)
  const nuevaCuotaReducida = roundToCents(
    ((plazoMeses - cuotasRemate) * cuotaMensual) / plazoMeses
  );
  const ahorroMensualCuotaB = roundToCents(cuotaMensual - nuevaCuotaReducida);
  const pctReduccionCuotaB = Number(((cuotasRemate / plazoMeses) * 100).toFixed(1));

  // Comparativa con Crédito Hipotecario Bancario tradicional en USD (TEA referencial 9.8% anual en USD)
  const tasaMensual = 0.098 / 12;
  const cuotaBancaria = roundUpToCents(
    (certificadoUsd * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoMeses))
  );
  const totalBanco = roundToCents(cuotaBancaria * plazoMeses);
  const interesesBanco = roundToCents(totalBanco - certificadoUsd);
  const sobrecostoBancoPct = Number(((interesesBanco / certificadoUsd) * 100).toFixed(1));
  const cuotaInicialBanco = roundToCents(certificadoUsd * 0.15); // 15% cuota inicial
  const ahorroInteresesVsBanco = roundToCents(interesesBanco - costoTotal);

  // Comparativa Competencia directa (Pandero 120m / Maquisistema 150m)
  const panderoCuota = calculateMonthlyInstallment(certificadoUsd, INTERNAL_RATES.pandero.coef, 120);
  const panderoRemateRef = roundToCents(50 * panderoCuota);
  const ahorroRemateVsPandero = roundToCents(panderoRemateRef - desembolsoRemate);

  const maquiCuota = calculateMonthlyInstallment(certificadoUsd, INTERNAL_RATES.maquisistema.coef, 150);
  const maquiRemateRef = roundToCents(65 * maquiCuota);
  const ahorroRemateVsMaqui = roundToCents(maquiRemateRef - desembolsoRemate);

  return {
    certificadoUsd,
    plazoMeses,
    plazosAnios,
    hasDiscount,
    cuotaMensual,
    inscripcionRegular,
    descuentoInscripcion,
    inscripcionEfectiva,
    primerPago,
    primerPagoSinDscto,
    totalCuotas,
    totalDevolver,
    costoTotal,
    costoPctCertificado,
    sobrecostoAnualPct,
    sobrecostoMensualUsd,
    desgloseComercial: {
      gastoAdmNetoTotal,
      gastoAdmIgvTotal,
      gastoAdmTotalCuotas,
      gastoAdmAnualNetoPct,
      tasaFbp010AdmNetoAnual,
      membresiaNetoPct,
      membresiaNetoUsd,
      membresiaIgvUsd,
      membresiaTotalUsd
    },
    cuotasRemate,
    desembolsoRemate,
    pctPlazoRemate,
    remateOpcionA: {
      cuotaMensual: cuotaMensual,
      mesesRestantes: mesesRestantesPlazoReducido,
      cuotasDescontadas: cuotasRemate,
      aniosAhorrados: aniosAhorradosRemate,
      saldoRestante: saldoRestanteCuotas
    },
    remateOpcionB: {
      nuevaCuotaMensual: nuevaCuotaReducida,
      mesesPlazo: plazoMeses,
      ahorroPorMes: ahorroMensualCuotaB,
      pctReduccion: pctReduccionCuotaB,
      saldoRestante: saldoRestanteCuotas
    },
    banco: {
      cuotaMensual: cuotaBancaria,
      totalDevolver: totalBanco,
      intereses: interesesBanco,
      sobrecostoPct: sobrecostoBancoPct,
      cuotaInicial: cuotaInicialBanco,
      ahorroVsFonbienes: ahorroInteresesVsBanco
    },
    pandero: {
      cuotaMensual: panderoCuota,
      cuotasRef: 50,
      desembolso: panderoRemateRef,
      ahorroVsFonbienes: ahorroRemateVsPandero
    },
    maquisistema: {
      cuotaMensual: maquiCuota,
      cuotasRef: 65,
      desembolso: maquiRemateRef,
      ahorroVsFonbienes: ahorroRemateVsMaqui
    }
  };
}
