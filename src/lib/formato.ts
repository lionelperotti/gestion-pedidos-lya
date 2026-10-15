export function formatearMoneda(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Fechas guardadas como "solo fecha" (sin hora): se muestran en UTC para que no corran un día. */
export function formatearFechaUTC(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-AR", { timeZone: "UTC" });
}
