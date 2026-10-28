import { unzipSync, strFromU8 } from 'fflate';

const MONTHS_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
];

function decodeXmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function colLettersToIndex(letters) {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function normalizeHeaderKey(raw) {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const strings = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = siRegex.exec(xml)) !== null) {
    // Strip phonetic runs if present before extracting <t> nodes
    const cleaned = match[1].replace(/<rPh\b[^>]*>[\s\S]*?<\/rPh>/g, '');
    const parts = [];
    const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(cleaned)) !== null) {
      parts.push(decodeXmlEntities(tMatch[1]));
    }
    strings.push(parts.join(''));
  }
  return strings;
}

function parseWorksheetRows(xml, sharedStrings) {
  if (!xml) return [];
  const rows = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];
    const rowCells = [];
    let hasNonEmpty = false;

    const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const attrs = cellMatch[1] || '';
      const inner = cellMatch[2] || '';
      const refMatch = attrs.match(/\br="([A-Z]+)\d+"/);
      const colIdx = refMatch ? colLettersToIndex(refMatch[1]) : rowCells.length;
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : 'n';

      let value = '';
      if (cellType === 's') {
        const vMatch = inner.match(/<v>(\d+)<\/v>/);
        value = vMatch ? (sharedStrings[parseInt(vMatch[1], 10)] ?? '') : '';
      } else if (cellType === 'inlineStr') {
        const parts = [];
        const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
        let tMatch;
        while ((tMatch = tRegex.exec(inner)) !== null) {
          parts.push(decodeXmlEntities(tMatch[1]));
        }
        value = parts.join('');
      } else if (cellType === 'str' || cellType === 'e') {
        const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
        value = vMatch ? decodeXmlEntities(vMatch[1]) : '';
      } else if (cellType === 'b') {
        const vMatch = inner.match(/<v>([^<]+)<\/v>/);
        value = vMatch ? vMatch[1] === '1' : false;
      } else {
        const vMatch = inner.match(/<v>([^<]+)<\/v>/);
        if (vMatch) {
          const num = Number(vMatch[1]);
          value = Number.isNaN(num) ? vMatch[1] : num;
        }
      }

      rowCells[colIdx] = value;
      if (value !== '' && value !== null && value !== undefined) {
        hasNonEmpty = true;
      }
    }

    if (hasNonEmpty) {
      rows.push(rowCells);
    }
  }

  return rows;
}

function normalizeAssemblyDate(fechaRaw, fechaFmtRaw, mesLabelRaw) {
  let day = null;
  let month = null;
  let year = null;

  const rawStr = String(fechaRaw ?? '').trim();
  const fmtStr = String(fechaFmtRaw ?? '').trim();

  // Case 1: YYYYMMDD (e.g., 20261010)
  if (/^\d{8}$/.test(rawStr)) {
    year = parseInt(rawStr.slice(0, 4), 10);
    month = parseInt(rawStr.slice(4, 6), 10);
    day = parseInt(rawStr.slice(6, 8), 10);
  }
  // Case 2: DD/MM/YYYY in formatted column or raw column
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fmtStr)) {
    const [d, m, y] = fmtStr.split('/').map(Number);
    day = d;
    month = m;
    year = y;
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawStr)) {
    const [d, m, y] = rawStr.split('/').map(Number);
    day = d;
    month = m;
    year = y;
  }
  // Case 3: Excel serial date number (e.g. 45990 - 48000)
  else if (typeof fechaRaw === 'number' && fechaRaw > 35000 && fechaRaw < 70000) {
    const utcMs = Math.round((fechaRaw - 25569) * 86400 * 1000);
    const dt = new Date(utcMs);
    day = dt.getUTCDate();
    month = dt.getUTCMonth() + 1;
    year = dt.getUTCFullYear();
  } else if (typeof fechaFmtRaw === 'number' && fechaFmtRaw > 35000 && fechaFmtRaw < 70000) {
    const utcMs = Math.round((fechaFmtRaw - 25569) * 86400 * 1000);
    const dt = new Date(utcMs);
    day = dt.getUTCDate();
    month = dt.getUTCMonth() + 1;
    year = dt.getUTCFullYear();
  }

  if (year && month >= 1 && month <= 12 && day) {
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const fechaIsoCompact = `${year}${mm}${dd}`;
    const fechaFormatted = `${dd}/${mm}/${year}`;
    const mesLabel =
      mesLabelRaw && typeof mesLabelRaw === 'string' && mesLabelRaw.trim()
        ? mesLabelRaw.trim()
        : `${MONTHS_SHORT_ES[month - 1]} ${year}`;
    const mesShort = `${MONTHS_SHORT_ES[month - 1]} ${String(year).slice(-2)}`;
    return { fecha: fechaIsoCompact, fechaFormatted, mesLabel, mesShort };
  }

  return {
    fecha: rawStr || fmtStr || '',
    fechaFormatted: fmtStr || rawStr || '—',
    mesLabel: String(mesLabelRaw || '').trim() || '—',
    mesShort: String(mesLabelRaw || '').trim() || '—'
  };
}

function resolveWorkbookSheets(files) {
  const wbXml = files['xl/workbook.xml'] ? strFromU8(files['xl/workbook.xml']) : '';
  const relsXml = files['xl/_rels/workbook.xml.rels']
    ? strFromU8(files['xl/_rels/workbook.xml.rels'])
    : '';

  const relMap = {};
  const relRegex = /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/g;
  let rMatch;
  while ((rMatch = relRegex.exec(relsXml)) !== null) {
    let target = rMatch[2].replace(/^\//, '');
    if (!target.startsWith('xl/')) {
      target = `xl/${target}`;
    }
    relMap[rMatch[1]] = target;
  }

  const sheets = [];
  const sheetRegex = /<sheet\b[^>]*\bname="([^"]+)"[^>]*\br:id="([^"]+)"/g;
  let sMatch;
  while ((sMatch = sheetRegex.exec(wbXml)) !== null) {
    const name = decodeXmlEntities(sMatch[1]);
    const rId = sMatch[2];
    const path = relMap[rId];
    if (path && files[path]) {
      sheets.push({ name, normalizedName: normalizeHeaderKey(name), path });
    }
  }

  if (sheets.length === 0 && files['xl/worksheets/sheet1.xml']) {
    sheets.push({
      name: 'Sheet1',
      normalizedName: 'SHEET1',
      path: 'xl/worksheets/sheet1.xml'
    });
  }

  return sheets;
}

function findColumnIndex(normalizedHeaders, candidates) {
  for (const candidate of candidates) {
    const exact = normalizedHeaders.findIndex((h) => h === candidate);
    if (exact !== -1) return exact;
  }
  for (const candidate of candidates) {
    const partial = normalizedHeaders.findIndex((h) => h && h.includes(candidate));
    if (partial !== -1) return partial;
  }
  return -1;
}

/**
 * Parses Consolidado_Resultados_FonBienes_Inmuebles.xlsx into a normalized,
 * validated domain dataset with explicit provenance metadata.
 */
export function parseFonbienesWorkbook(arrayBuffer, sourceMeta = {}) {
  try {
    const archive = unzipSync(new Uint8Array(arrayBuffer));
    const sharedStrings = archive['xl/sharedStrings.xml']
      ? parseSharedStrings(strFromU8(archive['xl/sharedStrings.xml']))
      : [];

    const sheets = resolveWorkbookSheets(archive);
    if (sheets.length === 0) {
      return {
        ok: false,
        error: 'El archivo Excel no contiene hojas de cálculo legibles.'
      };
    }

    const detailSheet =
      sheets.find((s) => s.normalizedName.includes('CONSOLIDADO')) || sheets[0];
    const detailRows = parseWorksheetRows(
      strFromU8(archive[detailSheet.path]),
      sharedStrings
    );

    if (detailRows.length < 2) {
      return {
        ok: false,
        error: `La hoja "${detailSheet.name}" no contiene registros de adjudicación.`
      };
    }

    const headerRow = detailRows[0];
    const normHeaders = headerRow.map(normalizeHeaderKey);

    const col = {
      nroAsamblea: findColumnIndex(normHeaders, ['NASAMBLEA', 'NROASAMBLEA', 'ASAMBLEA']),
      fechaRaw: findColumnIndex(normHeaders, ['FECHAASAMBLEAYYYYMMDD', 'FECHAYYYYMMDD']),
      fechaFmt: findColumnIndex(normHeaders, ['FECHAFORMATEADA', 'FECHAASAMBLEA', 'FECHA']),
      mesLabel: findColumnIndex(normHeaders, ['MESANO', 'MES']),
      programa: findColumnIndex(normHeaders, ['PROGRAMA']),
      grupo: findColumnIndex(normHeaders, ['GRUPO']),
      orden: findColumnIndex(normHeaders, ['ORDEN']),
      contrato: findColumnIndex(normHeaders, ['CONTRATO']),
      cupo: findColumnIndex(normHeaders, ['CUPO']),
      modalidad: findColumnIndex(normHeaders, ['MODALIDAD']),
      tipoAdj: findColumnIndex(normHeaders, ['TIPOADJUDICACION', 'TIPOADJ', 'CONDICION']),
      cuotas: findColumnIndex(normHeaders, ['CUOTASOFERTADASREMATADAS', 'CUOTAS']),
      certificado: findColumnIndex(normHeaders, ['CERTIFICADOUSD', 'CERTIFICADO', 'MONTO']),
      plazoMeses: findColumnIndex(normHeaders, ['PLAZOCONTRACTUALMESES', 'PLAZO'])
    };

    if (col.nroAsamblea === -1 || col.modalidad === -1 || col.certificado === -1) {
      return {
        ok: false,
        error:
          'El archivo Excel no coincide con las columnas esperadas (N° Asamblea, Modalidad, Certificado).'
      };
    }

    const registros = [];
    const assemblyMap = new Map();
    let detectedPlazo = 132;
    let detectedPrograma = 'FBP010';
    let detectedGrupo = '001';

    for (let i = 1; i < detailRows.length; i++) {
      const r = detailRows[i];
      const nroAsamblea = parseInt(r[col.nroAsamblea], 10);
      if (!nroAsamblea || Number.isNaN(nroAsamblea)) continue;

      const modalidadRaw = String(r[col.modalidad] ?? '')
        .trim()
        .toUpperCase();
      if (!modalidadRaw) continue;

      const modalidad = modalidadRaw.includes('SORTEO') ? 'SORTEO' : 'REMATE';
      const tipoAdj = String(col.tipoAdj !== -1 ? r[col.tipoAdj] : 'TITULAR')
        .trim()
        .toUpperCase();

      const cuotasNum = col.cuotas !== -1 ? Number(r[col.cuotas]) || 0 : 0;
      const certificadoNum = Number(
        String(r[col.certificado] ?? '0').replace(/[^0-9.-]/g, '')
      );
      if (!certificadoNum || Number.isNaN(certificadoNum)) continue;

      const plazoRow =
        col.plazoMeses !== -1 && Number(r[col.plazoMeses]) > 0
          ? Number(r[col.plazoMeses])
          : 132;
      detectedPlazo = plazoRow;

      const programaRow =
        col.programa !== -1 && r[col.programa]
          ? String(r[col.programa]).trim()
          : 'FBP010';
      const grupoRow =
        col.grupo !== -1 && r[col.grupo] !== undefined && r[col.grupo] !== ''
          ? String(r[col.grupo]).trim().padStart(3, '0')
          : '001';

      detectedPrograma = programaRow;
      detectedGrupo = grupoRow;

      const dateInfo = normalizeAssemblyDate(
        col.fechaRaw !== -1 ? r[col.fechaRaw] : undefined,
        col.fechaFmt !== -1 ? r[col.fechaFmt] : undefined,
        col.mesLabel !== -1 ? r[col.mesLabel] : undefined
      );

      const contratoStr =
        col.contrato !== -1 && r[col.contrato] !== undefined
          ? String(r[col.contrato]).trim()
          : '—';
      const cupoVal =
        col.cupo !== -1 && r[col.cupo] !== undefined ? Number(r[col.cupo]) || r[col.cupo] : '—';
      const ordenVal =
        col.orden !== -1 && r[col.orden] !== undefined ? Number(r[col.orden]) || i : i;

      registros.push({
        id: `${nroAsamblea}-${ordenVal}-${contratoStr}-${i}`,
        nroAsamblea,
        fecha: dateInfo.fecha,
        fechaFormatted: dateInfo.fechaFormatted,
        mesLabel: dateInfo.mesLabel,
        mesShort: dateInfo.mesShort,
        programa: programaRow,
        grupo: grupoRow,
        orden: ordenVal,
        contrato: contratoStr,
        cupo: cupoVal,
        modalidad,
        tipoAdj,
        isTitular: tipoAdj === 'TITULAR',
        cuotas: modalidad === 'SORTEO' ? 0 : cuotasNum,
        certificado: certificadoNum,
        plazoMeses: plazoRow
      });

      if (!assemblyMap.has(nroAsamblea)) {
        assemblyMap.set(nroAsamblea, {
          nro: nroAsamblea,
          fecha: dateInfo.fecha,
          fechaFormatted: dateInfo.fechaFormatted,
          mesLabel: dateInfo.mesLabel,
          mesShort: dateInfo.mesShort
        });
      }
    }

    if (registros.length === 0) {
      return {
        ok: false,
        error: 'No se encontraron filas válidas de adjudicaciones en el Excel.'
      };
    }

    // Parse optional Sheet 3 (Benchmark Competencia) to extract competitor terms & reference certificates
    const benchmarkSheet = sheets.find((s) => s.normalizedName.includes('BENCHMARK'));
    let panderoPlazo = 120;
    let panderoCuotas = 60;
    let maquiPlazo = 150;
    let maquiCuotas = 65;
    let presetCertificates = [40000, 50000, 60000, 70000, 75000, 80000, 100000];

    if (benchmarkSheet) {
      const benchRows = parseWorksheetRows(
        strFromU8(archive[benchmarkSheet.path]),
        sharedStrings
      );
      if (benchRows.length >= 2) {
        const bHeaders = benchRows[0].map(normalizeHeaderKey);
        const cCert = findColumnIndex(bHeaders, ['VALORCERTIFICADO']);
        const cPanPlazo = findColumnIndex(bHeaders, ['PANDEROPLAZO']);
        const cPanCuotas = findColumnIndex(bHeaders, ['PANDEROCUOTAS']);
        const cMaqPlazo = findColumnIndex(bHeaders, ['MAQUISISTEMAPLAZO']);
        const cMaqCuotas = findColumnIndex(bHeaders, ['MAQUISISTEMACUOTAS']);

        const firstRow = benchRows[1];
        if (cPanPlazo !== -1 && Number(firstRow[cPanPlazo]) > 0) {
          panderoPlazo = Number(firstRow[cPanPlazo]);
        }
        if (cPanCuotas !== -1 && Number(firstRow[cPanCuotas]) > 0) {
          panderoCuotas = Number(firstRow[cPanCuotas]);
        }
        if (cMaqPlazo !== -1 && Number(firstRow[cMaqPlazo]) > 0) {
          maquiPlazo = Number(firstRow[cMaqPlazo]);
        }
        if (cMaqCuotas !== -1 && Number(firstRow[cMaqCuotas]) > 0) {
          maquiCuotas = Number(firstRow[cMaqCuotas]);
        }
        if (cCert !== -1) {
          const certsFromSheet = benchRows
            .slice(1)
            .map((row) => Number(row[cCert]))
            .filter((n) => n >= 20000 && n <= 500000);
          if (certsFromSheet.length >= 4) {
            presetCertificates = Array.from(new Set(certsFromSheet)).sort((a, b) => a - b);
          }
        }
      }
    }

    const asambleas = Array.from(assemblyMap.values()).sort((a, b) => a.nro - b.nro);

    // Enrich each assembly with its observed empirical summary
    const asambleasResumen = asambleas.map((asam) => {
      const rows = registros.filter((r) => r.nroAsamblea === asam.nro);
      const titulares = rows.filter((r) => r.isTitular);
      const titularesSorteo = titulares.filter((r) => r.modalidad === 'SORTEO');
      const titularesRemate = titulares.filter((r) => r.modalidad === 'REMATE');

      const cuotasRemateTitular = titularesRemate.map((r) => r.cuotas);
      const minCuotas =
        cuotasRemateTitular.length > 0 ? Math.min(...cuotasRemateTitular) : null;
      const maxCuotas =
        cuotasRemateTitular.length > 0 ? Math.max(...cuotasRemateTitular) : null;
      const avgCuotas =
        cuotasRemateTitular.length > 0
          ? Number(
              (
                cuotasRemateTitular.reduce((sum, v) => sum + v, 0) /
                cuotasRemateTitular.length
              ).toFixed(1)
            )
          : null;

      const capitalEntregado = titulares.reduce((sum, r) => sum + r.certificado, 0);

      return {
        ...asam,
        totalRegistros: rows.length,
        totalTitulares: titulares.length,
        titularesSorteo: titularesSorteo.length,
        titularesRemate: titularesRemate.length,
        minCuotasGanadoras: minCuotas,
        maxCuotasGanadoras: maxCuotas,
        avgCuotasGanadoras: avgCuotas,
        pctPlazoMin:
          minCuotas !== null ? Number(((minCuotas / detectedPlazo) * 100).toFixed(1)) : null,
        capitalEntregado
      };
    });

    return {
      ok: true,
      dataset: {
        provenance: {
          fileName:
            sourceMeta.fileName || 'Consolidado_Resultados_FonBienes_Inmuebles.xlsx',
          isCustomUpload: Boolean(sourceMeta.isCustomUpload),
          loadedAt: new Date().toISOString(),
          sheetsDetected: sheets.map((s) => s.name),
          totalRegistros: registros.length,
          totalAsambleas: asambleasResumen.length
        },
        config: {
          empresa: 'Fonbienes Perú E.A.F.C. S.A.',
          producto: 'FonBienes Inmuebles',
          programa: detectedPrograma,
          grupo: detectedGrupo,
          plazoMeses: detectedPlazo,
          plazoAnios: Number((detectedPlazo / 12).toFixed(1)),
          presetCertificates,
          competidores: {
            pandero: {
              nombre: 'Pandero Inmuebles',
              plazoMeses: panderoPlazo,
              cuotasRemateRef: panderoCuotas,
              pctPlazoRef: Number(((panderoCuotas / panderoPlazo) * 100).toFixed(1))
            },
            maquisistema: {
              nombre: 'Maquisistema',
              plazoMeses: maquiPlazo,
              cuotasRemateRef: maquiCuotas,
              pctPlazoRef: Number(((maquiCuotas / maquiPlazo) * 100).toFixed(1))
            }
          }
        },
        asambleas: asambleasResumen,
        registros
      }
    };
  } catch (err) {
    return {
      ok: false,
      error: `No se pudo interpretar el archivo Excel (${err?.message || 'formato inválido'}).`
    };
  }
}

