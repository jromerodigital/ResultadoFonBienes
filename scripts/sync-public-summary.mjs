import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFonbienesWorkbook } from './xlsxWorkbookParser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const EXCEL_PATH = path.join(
  PROJECT_ROOT,
  'Consolidado_Resultados_FonBienes_Inmuebles.xlsx'
);
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'publicSummary.json');

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log(
        '[sync-data] Excel local no presente (entorno CI/GitHub). Usando resumen agregado precompilado en src/data/publicSummary.json.'
      );
      return;
    }
    console.error(
      '[sync-data] Error: No existe ni el Excel maestro local ni src/data/publicSummary.json.'
    );
    process.exit(1);
  }

  const buffer = fs.readFileSync(EXCEL_PATH);
  const parsed = parseFonbienesWorkbook(buffer);

  if (!parsed.ok) {
    console.error(`[sync-data] Error leyendo Excel: ${parsed.error}`);
    process.exit(1);
  }

  const { config, asambleas, registros } = parsed.dataset;

  function parseSuplenteOrder(tipoAdj) {
    const match = String(tipoAdj || '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 99;
  }

  function getRowGroupRank(row) {
    if (row.isTitular && row.modalidad === 'SORTEO') return 0;
    if (row.isTitular) return 1;
    return 2;
  }

  // Build strictly sanitized per-assembly metrics + anonymized results list (Titulares + Suplentes; ZERO contracts, ZERO cupos)
  const sanitizedAsambleas = asambleas.map((asam) => {
    const assemblyRows = registros.filter((r) => r.nroAsamblea === asam.nro);
    const titularRows = assemblyRows.filter((r) => r.isTitular);
    const suplenteRows = assemblyRows.filter((r) => !r.isTitular);

    const capitalSorteo = titularRows
      .filter((r) => r.modalidad === 'SORTEO')
      .reduce((sum, r) => sum + r.certificado, 0);
    const capitalRemate = titularRows
      .filter((r) => r.modalidad === 'REMATE')
      .reduce((sum, r) => sum + r.certificado, 0);

    // Commercial order: 1) SORTEO (Titular), 2) REMATE Titulares (highest to lowest cuotas), 3) SUPLENTES (highest to lowest cuotas / rank)
    const sortedRows = [...assemblyRows].sort((a, b) => {
      const groupDiff = getRowGroupRank(a) - getRowGroupRank(b);
      if (groupDiff !== 0) return groupDiff;

      if (b.cuotas !== a.cuotas) return b.cuotas - a.cuotas;

      if (!a.isTitular && !b.isTitular) {
        const supDiff = parseSuplenteOrder(a.tipoAdj) - parseSuplenteOrder(b.tipoAdj);
        if (supDiff !== 0) return supDiff;
      }

      if (b.certificado !== a.certificado) return b.certificado - a.certificado;
      return (a.orden || 0) - (b.orden || 0);
    });

    const resultados = sortedRows.map((r, idx) => ({
      item: idx + 1,
      modalidad: r.modalidad,
      tipoAdj: r.tipoAdj,
      isTitular: r.isTitular,
      cuotas: r.cuotas,
      pctPlazo:
        r.cuotas > 0
          ? Number(((r.cuotas / config.plazoMeses) * 100).toFixed(1))
          : 0,
      certificado: r.certificado
    }));

    return {
      nro: asam.nro,
      fechaFormatted: asam.fechaFormatted,
      mesLabel: asam.mesLabel,
      mesShort: asam.mesShort,
      totalTitulares: asam.totalTitulares,
      totalSuplentes: suplenteRows.length,
      titularesSorteo: asam.titularesSorteo,
      titularesRemate: asam.titularesRemate,
      minCuotasGanadoras: asam.minCuotasGanadoras,
      maxCuotasGanadoras: asam.maxCuotasGanadoras,
      avgCuotasGanadoras: asam.avgCuotasGanadoras,
      pctPlazoMin: asam.pctPlazoMin,
      capitalSorteo,
      capitalRemate,
      capitalEntregado: asam.capitalEntregado,
      resultados
    };
  });

  const publicPayload = {
    meta: {
      totalAsambleas: sanitizedAsambleas.length,
      ultimaActualizacion: sanitizedAsambleas.at(-1)?.mesLabel || ''
    },
    config,
    asambleas: sanitizedAsambleas
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(publicPayload, null, 2) + '\n', 'utf8');
  console.log(
    `[sync-data] Resumen público sanitizado generado (${sanitizedAsambleas.length} asambleas, 0 contratos nominales) -> src/data/publicSummary.json`
  );
}

main();
