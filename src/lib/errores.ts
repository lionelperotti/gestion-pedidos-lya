// Utilidades para devolver mensajes claros en vez de errores técnicos.

/** Resultado que devuelven las acciones de formulario cuando algo se puede explicar. */
export type ResultadoAccion = { error: string } | undefined;

/** True si el error de Prisma es una violación de restricción única (P2002). */
export function esErrorDeDuplicado(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

/** Normaliza un nombre para compararlo: sin acentos, mayúsculas, puntos ni espacios de más. */
export function normalizarNombre(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
