"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

export async function crearCliente(formData: FormData) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();

  if (!nombre) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  await prisma.cliente.create({
    data: {
      nombre,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      vendedorId: usuario.id,
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function actualizarCliente(clienteId: string, formData: FormData) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  // Un vendedor solo puede editar sus propios clientes; el admin puede todos
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error("Cliente no encontrado.");
  if (usuario.perfil !== "Administrador" && cliente.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso para editar este cliente.");
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();

  if (!nombre) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: {
      nombre,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}
