"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import type { ResultadoAccion } from "@/lib/errores";

async function validarNombre(nombre: string, excluirId?: string): Promise<ResultadoAccion> {
  if (!nombre) return { error: "El nombre del proveedor es obligatorio." };

  const existente = await prisma.proveedor.findFirst({
    where: {
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
  });
  if (existente) {
    return { error: `Ya existe un proveedor llamado "${existente.nombre}".` };
  }
  return undefined;
}

export async function crearProveedor(formData: FormData): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const problema = await validarNombre(nombre);
  if (problema) return problema;

  try {
    await prisma.proveedor.create({
      data: {
        nombre,
        contacto: contacto || null,
        telefono: telefono || null,
        email: email || null,
      },
    });
  } catch {
    return { error: "No se pudo crear el proveedor. Intentá de nuevo." };
  }

  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function actualizarProveedor(
  proveedorId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const activo = formData.get("activo") === "on";
  const marcaIds = formData.getAll("marcaIds").map(String);

  const problema = await validarNombre(nombre, proveedorId);
  if (problema) return problema;

  try {
    await prisma.proveedor.update({
      where: { id: proveedorId },
      data: {
        nombre,
        contacto: contacto || null,
        telefono: telefono || null,
        email: email || null,
        activo,
        marcas: { set: marcaIds.map((id) => ({ id })) },
      },
    });
  } catch {
    return { error: "No se pudo guardar el proveedor. Intentá de nuevo." };
  }

  revalidatePath("/proveedores");
  redirect("/proveedores");
}
