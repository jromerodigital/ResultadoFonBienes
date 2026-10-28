/**
 * Pure analytical derivations & empirical backtesting over the sanitized
 * aggregate FonBienes dataset (zero individual contract or cupo records).
 */

export function formatUsd(amount, { compact = false } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${Math.round(amount / 1_000)}k`;
    }
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`;
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
    rangoIntercuartil: { min: p25, max: p75, mediana: medianCuotas }
  };
}

export function simulateCommercialScenario(dataset, certificadoUsd, cuotasOfertadas) {
  const { config, asambleas } = dataset;
  const { plazoMeses, competidores } = config;

  const fbCuotaMensual = certificadoUsd / plazoMeses;
  const fbDesembolso = cuotasOfertadas * fbCuotaMensual;
  const fbPctPlazo = (cuotasOfertadas / plazoMeses) * 100;

  const panderoCuotaMensual = certificadoUsd / competidores.pandero.plazoMeses;
  const panderoDesembolso =
    competidores.pandero.cuotasRemateRef * panderoCuotaMensual;
  const ahorroVsPandero = panderoDesembolso - fbDesembolso;

  const maquiCuotaMensual = certificadoUsd / competidores.maquisistema.plazoMeses;
  const maquiDesembolso =
    competidores.maquisistema.cuotasRemateRef * maquiCuotaMensual;
  const ahorroVsMaqui = maquiDesembolso - fbDesembolso;

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
