"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { esErrorDeDuplicado } from "@/lib/errores";

const CATEGORIAS_VALIDAS = ["RI", "MO", "EX", "CF"];

export interface FilaImportacionCliente {
  codigoCliente: string;
  nombre: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  categoria: string;
  cuit: string;
  email: string;
  telefono: string;
}

export interface FilaPreviewCliente extends FilaImportacionCliente {
  fila: number;
  accion: "crear" | "actualizar" | "error";
  mensaje?: string;
  clienteId?: string;
  provinciaId?: string;
  localidadId?: string;
}

export async function previsualizarImportacionClientes(
  filas: FilaImportacionCliente[]
): Promise<FilaPreviewCliente[]> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");

  const [provincias, clientesExistentes] = await Promise.all([
    prisma.provincia.findMany({ include: { localidades: true } }),
    prisma.cliente.findMany({ select: { id: true, cuit: true, codigoCliente: true, nombre: true } }),
  ]);

  const porCuit = new Map(clientesExistentes.map((c) => [c.cuit, c]));
  const porCodigo = new Map(clientesExistentes.map((c) => [c.codigoCliente, c]));

  const resultado: FilaPreviewCliente[] = [];

  // Para detectar CUIT o código repetidos DENTRO del mismo archivo
  const cuitsVistos = new Map<string, number>();
  const codigosVistos = new Map<string, number>();

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2;

    if (!fila.nombre || !fila.cuit || !fila.codigoCliente) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: "Faltan datos obligatorios (nombre, código o CUIT).",
      });
      continue;
    }

    const cuitNormalizado = fila.cuit.trim();
    const codigoNormalizado = fila.codigoCliente.trim();

    const filaCuitPrevia = cuitsVistos.get(cuitNormalizado);
    if (filaCuitPrevia) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: `CUIT duplicado: ya aparece en la fila ${filaCuitPrevia} de este mismo archivo.`,
      });
      continue;
    }
    cuitsVistos.set(cuitNormalizado, numeroFila);

    const filaCodigoPrevia = codigosVistos.get(codigoNormalizado);
    if (filaCodigoPrevia) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: `Código de cliente duplicado: ya aparece en la fila ${filaCodigoPrevia} de este mismo archivo.`,
      });
      continue;
    }
    codigosVistos.set(codigoNormalizado, numeroFila);

    const categoria = fila.categoria.trim().toUpperCase();
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: `Categoría inválida "${fila.categoria}". Tiene que ser RI, MO, EX o CF.`,
      });
      continue;
    }

    let provinciaId: string | undefined;
    let localidadId: string | undefined;

    if (fila.provincia) {
      const provincia = provincias.find(
        (p) => p.nombre.trim().toLowerCase() === fila.provincia.trim().toLowerCase()
      );
      if (!provincia) {
        resultado.push({
          ...fila,
          fila: numeroFila,
          accion: "error",
          mensaje: `No existe la provincia "${fila.provincia}". Cargala primero en Provincias.`,
        });
        continue;
      }
      provinciaId = provincia.id;

      if (fila.localidad) {
        const localidad = provincia.localidades.find(
          (l) => l.nombre.trim().toLowerCase() === fila.localidad.trim().toLowerCase()
        );
        if (!localidad) {
          resultado.push({
            ...fila,
            fila: numeroFila,
            accion: "error",
            mensaje: `La provincia "${fila.provincia}" no tiene la localidad "${fila.localidad}". Cargala primero en Localidades.`,
          });
          continue;
        }
        localidadId = localidad.id;
      }
    }

    const existente = porCuit.get(cuitNormalizado);
    const duenoDelCodigo = porCodigo.get(codigoNormalizado);

    // El código ya lo usa OTRO cliente de la base: no se puede repetir
    if (duenoDelCodigo && duenoDelCodigo.id !== existente?.id) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: `El código "${codigoNormalizado}" ya lo tiene el cliente "${duenoDelCodigo.nombre}".`,
      });
      continue;
    }

    resultado.push({
      ...fila,
      cuit: cuitNormalizado,
      codigoCliente: codigoNormalizado,
      categoria,
      fila: numeroFila,
      accion: existente ? "actualizar" : "crear",
      clienteId: existente?.id,
      provinciaId,
      localidadId,
    });
  }

  return resultado;
}

export interface ResultadoImportacionClientes {
  creados: number;
  actualizados: number;
  errores: { fila: number; mensaje: string }[];
}

export async function aplicarImportacionClientes(
  filas: FilaPreviewCliente[]
): Promise<ResultadoImportacionClientes> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const validas = filas.filter((f) => f.accion !== "error");
  let creados = 0;
  let actualizados = 0;
  const errores: { fila: number; mensaje: string }[] = [];

  // Cada fila se procesa en su propio try/catch: si una falla, seguimos con
  // las demás en vez de cortar toda la importación sin explicación.
  for (const fila of validas) {
    const email = fila.email?.trim() || "";
    const telefono = fila.telefono?.trim() || "";

    try {
      if (fila.accion === "actualizar" && fila.clienteId) {
        await prisma.cliente.update({
          where: { id: fila.clienteId },
          data: {
            nombre: fila.nombre,
            direccion: fila.domicilio || null,
            codigoCliente: fila.codigoCliente,
            categoria: fila.categoria as "RI" | "MO" | "EX" | "CF",
            provinciaId: fila.provinciaId ?? null,
            localidadId: fila.localidadId ?? null,
            // Email y teléfono: solo se pisan si el Excel los trae cargados
            ...(email ? { email } : {}),
            ...(telefono ? { telefono } : {}),
          },
        });
        actualizados++;
      } else if (fila.accion === "crear") {
        await prisma.cliente.create({
          data: {
            nombre: fila.nombre,
            direccion: fila.domicilio || null,
            codigoCliente: fila.codigoCliente,
            cuit: fila.cuit,
            categoria: fila.categoria as "RI" | "MO" | "EX" | "CF",
            provinciaId: fila.provinciaId ?? null,
            localidadId: fila.localidadId ?? null,
            email: email || null,
            telefono: telefono || null,
            vendedorId: usuario.id,
          },
        });
        creados++;
      }
    } catch (e) {
      errores.push({
        fila: fila.fila,
        mensaje: esErrorDeDuplicado(e)
          ? `El CUIT "${fila.cuit}" o el código "${fila.codigoCliente}" ya existe en otro cliente (conflicto al guardar).`
          : "No se pudo guardar esta fila (error inesperado).",
      });
    }
  }

  revalidatePath("/clientes");
  return { creados, actualizados, errores };
}
