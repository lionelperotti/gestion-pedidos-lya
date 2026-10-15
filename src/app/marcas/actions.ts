"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

async function validarMarca(
  nombre: string,
  proveedorIds: string[],
  excluirId?: string
): Promise<ResultadoAccion> {
  if (!nombre) return { error: "El nombre de la marca es obligatorio." };

  if (proveedorIds.length === 0) {
    return { error: "Tenés que asociar al menos un proveedor a la marca." };
  }

  const existente = await prisma.marca.findFirst({
    where: {
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
  });
  if (existente) {
    return { error: `Ya existe una marca llamada "${existente.nombre}".` };
  }
  return undefined;
}

export async function crearMarca(formData: FormData): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const proveedorIds = formData.getAll("proveedorIds").map(String);

  const problema = await validarMarca(nombre, proveedorIds);
  if (problema) return problema;

  try {
    await prisma.marca.create({
      data: {
        nombre,
        proveedores: { connect: proveedorIds.map((id) => ({ id })) },
      },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe una marca llamada "${nombre}".` };
    return { error: "No se pudo crear la marca. Intentá de nuevo." };
  }

  revalidatePath("/marcas");
  redirect("/marcas");
}

export async function actualizarMarca(
  marcaId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const activo = formData.get("activo") === "on";
  const proveedorIds = formData.getAll("proveedorIds").map(String);

  const problema = await validarMarca(nombre, proveedorIds, marcaId);
  if (problema) return problema;

  try {
    await prisma.marca.update({
      where: { id: marcaId },
      data: {
        nombre,
        activo,
        proveedores: { set: proveedorIds.map((id) => ({ id })) },
      },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe una marca llamada "${nombre}".` };
    return { error: "No se pudo guardar la marca. Intentá de nuevo." };
  }

  revalidatePath("/marcas");
  redirect("/marcas");
}
