"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

const CATEGORIAS_VALIDAS = ["RI", "MO", "EX", "CF"] as const;

interface DatosCliente {
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  codigoCliente: string;
  cuit: string;
  categoria: (typeof CATEGORIAS_VALIDAS)[number];
  provinciaId: string | null;
  localidadId: string | null;
  rubroId: string | null;
}

type LecturaCliente = { error: string; datos?: undefined } | { error?: undefined; datos: DatosCliente };

async function leerYValidarCliente(
  formData: FormData,
  excluirId?: string
): Promise<LecturaCliente> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const codigoCliente = String(formData.get("codigoCliente") ?? "").trim();
  const cuit = String(formData.get("cuit") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const provinciaId = String(formData.get("provinciaId") ?? "").trim();
  const localidadId = String(formData.get("localidadId") ?? "").trim();
  const rubroId = String(formData.get("rubroId") ?? "").trim();

  if (!nombre) return { error: "El nombre del cliente es obligatorio." };
  if (!codigoCliente) return { error: "El código de cliente es obligatorio." };
  if (!cuit) return { error: "El CUIT es obligatorio." };
  if (!CATEGORIAS_VALIDAS.includes(categoria as (typeof CATEGORIAS_VALIDAS)[number])) {
    return { error: "Tenés que seleccionar una categoría válida (RI, MO, EX o CF)." };
  }

  const mismoCodigo = await prisma.cliente.findFirst({
    where: { codigoCliente, ...(excluirId ? { NOT: { id: excluirId } } : {}) },
  });
  if (mismoCodigo) {
    return {
      error: `El código de cliente "${codigoCliente}" ya lo tiene el cliente "${mismoCodigo.nombre}".`,
    };
  }

  const mismoCuit = await prisma.cliente.findFirst({
    where: { cuit, ...(excluirId ? { NOT: { id: excluirId } } : {}) },
  });
  if (mismoCuit) {
    return { error: `Ya existe un cliente con el CUIT ${cuit}: "${mismoCuit.nombre}".` };
  }

  return {
    datos: {
      nombre,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      codigoCliente,
      cuit,
      categoria: categoria as (typeof CATEGORIAS_VALIDAS)[number],
      provinciaId: provinciaId || null,
      localidadId: localidadId || null,
      rubroId: rubroId || null,
    },
  };
}

export async function crearCliente(formData: FormData): Promise<ResultadoAccion> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) return { error: "Tu sesión venció. Volvé a ingresar e intentá de nuevo." };
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const lectura = await leerYValidarCliente(formData);
  if (lectura.datos === undefined) return { error: lectura.error };

  try {
    await prisma.cliente.create({
      data: { ...lectura.datos, vendedorId: usuario.id },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) {
      return { error: "Ya existe un cliente con ese CUIT o con ese código de cliente." };
    }
    return { error: "No se pudo crear el cliente. Intentá de nuevo." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function actualizarCliente(
  clienteId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) return { error: "Tu sesión venció. Volvé a ingresar e intentá de nuevo." };
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return { error: "El cliente ya no existe." };
  if (usuario.perfil !== "Administrador" && cliente.vendedorId !== usuario.id) {
    return { error: "No tenés permiso para editar este cliente." };
  }

  const lectura = await leerYValidarCliente(formData, clienteId);
  if (lectura.datos === undefined) return { error: lectura.error };

  try {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: lectura.datos,
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) {
      return { error: "Ya existe un cliente con ese CUIT o con ese código de cliente." };
    }
    return { error: "No se pudo guardar el cliente. Intentá de nuevo." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}
