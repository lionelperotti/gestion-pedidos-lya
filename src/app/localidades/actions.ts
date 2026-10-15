"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

async function validar(
  nombre: string,
  provinciaId: string,
  excluirId?: string
): Promise<ResultadoAccion> {
  if (!nombre) return { error: "El nombre de la localidad es obligatorio." };
  if (!provinciaId) return { error: "Tenés que seleccionar una provincia." };

  const existente = await prisma.localidad.findFirst({
    where: {
      provinciaId,
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
    include: { provincia: true },
  });
  if (existente) {
    return {
      error: `Ya existe la localidad "${existente.nombre}" en la provincia ${existente.provincia.nombre}.`,
    };
  }
  return undefined;
}

export async function crearLocalidad(formData: FormData): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const provinciaId = String(formData.get("provinciaId") ?? "");

  const problema = await validar(nombre, provinciaId);
  if (problema) return problema;

  try {
    await prisma.localidad.create({ data: { nombre, provinciaId } });
  } catch (e) {
    if (esErrorDeDuplicado(e)) {
      return { error: `Ya existe la localidad "${nombre}" en esa provincia.` };
    }
    return { error: "No se pudo crear la localidad. Intentá de nuevo." };
  }

  revalidatePath("/localidades");
  revalidatePath("/provincias");
  redirect(`/provincias/${provinciaId}`);
}

export async function actualizarLocalidad(
  localidadId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const provinciaId = String(formData.get("provinciaId") ?? "");

  const problema = await validar(nombre, provinciaId, localidadId);
  if (problema) return problema;

  try {
    await prisma.localidad.update({
      where: { id: localidadId },
      data: { nombre, provinciaId },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) {
      return { error: `Ya existe la localidad "${nombre}" en esa provincia.` };
    }
    return { error: "No se pudo guardar la localidad. Intentá de nuevo." };
  }

  revalidatePath("/localidades");
  revalidatePath("/provincias");
  redirect(`/provincias/${provinciaId}`);
}
