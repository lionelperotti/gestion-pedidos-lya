"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

const CATEGORIAS_VALIDAS = ["RI", "MO", "EX", "CF"] as const;

function leerDatosCliente(formData: FormData) {
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

  if (!nombre) throw new Error("El nombre del cliente es obligatorio.");
  if (!codigoCliente) throw new Error("El código de cliente es obligatorio.");
  if (!cuit) throw new Error("El CUIT es obligatorio.");
  if (!CATEGORIAS_VALIDAS.includes(categoria as (typeof CATEGORIAS_VALIDAS)[number])) {
    throw new Error("Tenés que seleccionar una categoría válida (RI, MO, EX o CF).");
  }

  return {
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
  };
}

export async function crearCliente(formData: FormData) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const datos = leerDatosCliente(formData);

  await prisma.cliente.create({
    data: { ...datos, vendedorId: usuario.id },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function actualizarCliente(clienteId: string, formData: FormData) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error("Cliente no encontrado.");
  if (usuario.perfil !== "Administrador" && cliente.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso para editar este cliente.");
  }

  const datos = leerDatosCliente(formData);

  await prisma.cliente.update({
    where: { id: clienteId },
    data: datos,
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}
