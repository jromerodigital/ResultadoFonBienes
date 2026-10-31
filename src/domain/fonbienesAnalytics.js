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
