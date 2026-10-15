"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

async function validarNombre(nombre: string, excluirId?: string): Promise<ResultadoAccion> {
  if (!nombre) return { error: "El nombre del perfil es obligatorio." };

  const existente = await prisma.perfil.findFirst({
    where: {
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
  });
  if (existente) {
    return { error: `Ya existe un perfil llamado "${existente.nombre}".` };
  }
  return undefined;
}

export async function crearPerfil(formData: FormData): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  const problema = await validarNombre(nombre);
  if (problema) return problema;

  try {
    await prisma.perfil.create({
      data: { nombre, descripcion: descripcion || null },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe un perfil llamado "${nombre}".` };
    return { error: "No se pudo crear el perfil. Intentá de nuevo." };
  }

  revalidatePath("/perfiles");
  redirect("/perfiles");
}

export async function actualizarPerfil(
  perfilId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  const problema = await validarNombre(nombre, perfilId);
  if (problema) return problema;

  try {
    await prisma.perfil.update({
      where: { id: perfilId },
      data: { nombre, descripcion: descripcion || null },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe un perfil llamado "${nombre}".` };
    return { error: "No se pudo guardar el perfil. Intentá de nuevo." };
  }

  revalidatePath("/perfiles");
  redirect("/perfiles");
}
