import { normalizarNombre } from "./errores";

/** Una línea del resumen de cuenta de la distribuidora: un comprobante de un cliente. */
export interface FilaResumen {
  nombre: string;
  comprobante: string;
  fecha: string | null; // AAAA-MM-DD
  importe: number;
  aCuenta: number;
  totalACobrar: number;
}

export interface LecturaResumen {
  filas: FilaResumen[];
  /** Filas que no son un comprobante (subtotales, totales generales, filas sueltas). */
  ignoradas: number;
}

/**
 * Clave para comparar nombres de clientes: sin acentos, mayúsculas ni puntuación,
 * y con las siglas unidas ("S.R.L.", "S R L" y "SRL" dan lo mismo).
 */
export function claveDeNombre(texto: string): string {
  return normalizarNombre(texto).replace(
    /(?<![a-zñ0-9])[a-zñ](?: [a-zñ])+(?![a-zñ0-9])/g,
    (m) => m.replace(/ /g, "")
  );
}

const dos = (n: number) => String(n).padStart(2, "0");

/** Acepta fechas de Excel (Date o número de serie) y textos tipo 31/12/2025 o 2025-12-31. */
export function parsearFecha(valor: unknown): string | null {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    // +12 h para que el desfase horario de la lectura no corra el día
    const d = new Date(valor.getTime() + 12 * 3600 * 1000);
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  }
  if (typeof valor === "number" && isFinite(valor) && valor > 20000 && valor < 80000) {
    const d = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
  }
  if (typeof valor === "string") {
    const s = valor.trim();
    let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
    if (m) {
      const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return validarFecha(anio, Number(m[2]), Number(m[1]));
    }
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return validarFecha(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  return null;
}

function validarFecha(anio: number, mes: number, dia: number): string | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || anio < 1990 || anio > 2100) return null;
  return `${anio}-${dos(mes)}-${dos(dia)}`;
}

/** Acepta números y textos como "1.234,56", "1234,56", "$ 1.234,56", "(500,00)" o "-500". */
export function parsearImporte(valor: unknown): number | null {
  if (typeof valor === "number") return isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;

  let s = valor.trim();
  if (s === "") return null;

  let negativo = false;
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$\s]/g, "");
  if (s.startsWith("-")) {
    negativo = true;
    s = s.slice(1);
  }
  if (s.endsWith("-")) {
    negativo = true;
    s = s.slice(0, -1);
  }

  const tieneComa = s.includes(",");
  const tienePunto = s.includes(".");
  if (tieneComa && tienePunto) {
    // el último separador es el decimal
    s =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (tieneComa) {
    s = s.replace(",", ".");
  } else if (tienePunto && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // 1.234.567 → miles
  }

  const n = Number(s);
  if (!isFinite(n) || s === "") return null;
  return negativo ? -n : n;
}

const MAX_FILAS_ENCABEZADO = 15;

/**
 * Interpreta las filas del Excel del resumen de cuenta.
 * Columnas: CLIENTES · FACT. O REM · FECHA · IMPORTE · A CUENTA · TOTAL A COBRAR.
 *
 * - Busca la fila de títulos; si no la encuentra, asume ese orden de columnas.
 * - Si el nombre del cliente viene solo en la primera línea de cada grupo,
 *   lo repite en los comprobantes siguientes.
 * - Las filas de subtotales o de total general se ignoran (y se cuentan aparte).
 */
export function interpretarFilasResumen(filasCrudas: unknown[][]): LecturaResumen {
  const idx = { cliente: 0, comprobante: 1, fecha: 2, importe: 3, aCuenta: 4, total: 5 };
  let inicio = 0;

  for (let i = 0; i < Math.min(filasCrudas.length, MAX_FILAS_ENCABEZADO); i++) {
    const celdas = filasCrudas[i].map((c) => normalizarNombre(String(c ?? "")));
    const iCliente = celdas.findIndex((c) => c === "cliente" || c === "clientes");
    if (iCliente < 0) continue;

    idx.cliente = iCliente;
    const buscar = (f: (c: string) => boolean, porDefecto: number) => {
      const j = celdas.findIndex(f);
      return j >= 0 ? j : porDefecto;
    };
    idx.comprobante = buscar((c) => c.startsWith("fact") || c.startsWith("rem"), iCliente + 1);
    idx.fecha = buscar((c) => c === "fecha", iCliente + 2);
    idx.importe = buscar((c) => c === "importe", iCliente + 3);
    idx.aCuenta = buscar((c) => c === "a cuenta" || c === "acuenta", iCliente + 4);
    idx.total = buscar((c) => c.startsWith("total"), iCliente + 5);
    inicio = i + 1;
    break;
  }

  const filas: FilaResumen[] = [];
  let ignoradas = 0;
  let nombreActual = "";

  for (const fila of filasCrudas.slice(inicio)) {
    const texto = (i: number) => String(fila[i] ?? "").trim();
    const nombreCelda = texto(idx.cliente);
    const comprobante = texto(idx.comprobante);
    const fecha = parsearFecha(fila[idx.fecha]);
    const importe = parsearImporte(fila[idx.importe]);
    const aCuenta = parsearImporte(fila[idx.aCuenta]);
    const total = parsearImporte(fila[idx.total]);
    const hayImportes = importe !== null || aCuenta !== null || total !== null;

    if (!nombreCelda && !comprobante && !fecha && !hayImportes) continue; // fila vacía

    // Total general del listado
    if (normalizarNombre(nombreCelda).startsWith("total")) {
      ignoradas++;
      continue;
    }

    if (nombreCelda) nombreActual = nombreCelda;

    // Sin comprobante ni fecha no es un comprobante: encabezado de grupo o subtotal
    if (!comprobante && !fecha) {
      if (hayImportes) ignoradas++;
      continue;
    }

    if (!nombreActual || !hayImportes) {
      ignoradas++;
      continue;
    }

    const aCuentaFinal = aCuenta ?? 0;
    const importeFinal = importe ?? (total ?? 0) + aCuentaFinal;
    filas.push({
      nombre: nombreCelda || nombreActual,
      comprobante: comprobante || "(sin número)",
      fecha,
      importe: importeFinal,
      aCuenta: aCuentaFinal,
      totalACobrar: total ?? importeFinal - aCuentaFinal,
    });
  }

  return { filas, ignoradas };
}
