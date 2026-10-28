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

  // Build strictly aggregated per-assembly metrics (ZERO individual contracts, cupos, or suplentes)
  const sanitizedAsambleas = asambleas.map((asam) => {
    const rows = registros.filter((r) => r.nroAsamblea === asam.nro && r.isTitular);
    const capitalSorteo = rows
      .filter((r) => r.modalidad === 'SORTEO')
      .reduce((sum, r) => sum + r.certificado, 0);
    const capitalRemate = rows
      .filter((r) => r.modalidad === 'REMATE')
      .reduce((sum, r) => sum + r.certificado, 0);

    return {
      nro: asam.nro,
      fechaFormatted: asam.fechaFormatted,
      mesLabel: asam.mesLabel,
      mesShort: asam.mesShort,
      totalTitulares: asam.totalTitulares,
      titularesSorteo: asam.titularesSorteo,
      titularesRemate: asam.titularesRemate,
      minCuotasGanadoras: asam.minCuotasGanadoras,
      maxCuotasGanadoras: asam.maxCuotasGanadoras,
      avgCuotasGanadoras: asam.avgCuotasGanadoras,
      pctPlazoMin: asam.pctPlazoMin,
      capitalSorteo,
      capitalRemate,
      capitalEntregado: asam.capitalEntregado
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
