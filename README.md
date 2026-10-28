# Fonbienes · Plataforma de Inteligencia Comercial (FBP010)

Dashboard ejecutivo de resultados agregados y simulación comercial para asesores de **Fonbienes Perú E.A.F.C. S.A.** (Programa Inmobiliario `FBP010` · Grupo `001`), desarrollado en **React + Vite + Tailwind CSS**.

---

## Módulos Principales

1. **Panorama Ejecutivo**:
   * KPIs consolidados de corte ganador, capital entregado y adjudicaciones por modalidad.
   * Gráfico vectorial interactivo con interpolación cúbica monótona y comparativa frente a referencias de mercado.
   * Benchmark de esfuerzo de liquidez (`% del plazo contractual`).
2. **Simulador Comercial**:
   * Cotizador en tiempo real por monto de certificado y cuotas a ofertar.
   * Evaluación contra el histórico consolidado de asambleas realizadas y generación de resumen comercial para WhatsApp.
3. **Resumen por Asamblea**:
   * Consolidado mensual verificado por asamblea (diseño editorial en escritorio y tarjetas adaptativas en móvil).

---

## Arquitectura de Privacidad y Seguridad de Datos

* La publicación web opera exclusivamente sobre **estadísticas agregadas por asamblea** (`src/data/publicSummary.json`), sin incluir contratos individuales, cupos nominales, registros de suplentes ni archivos fuente descargables.

---

## Desarrollo y Compilación

```bash
npm install
npm run build
npm start
```
