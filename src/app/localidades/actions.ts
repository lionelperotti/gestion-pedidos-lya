"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearLocalidad(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const provinciaId = String(formData.get("provinciaId") ?? "");

  if (!nombre) throw new Error("El nombre de la localidad es obligatorio.");
  if (!provinciaId) throw new Error("Tenés que seleccionar una provincia.");

  await prisma.localidad.create({ data: { nombre, provinciaId } });

  revalidatePath("/localidades");
  revalidatePath("/provincias");
  redirect(`/provincias/${provinciaId}`);
}

export async function actualizarLocalidad(localidadId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const provinciaId = String(formData.get("provinciaId") ?? "");

  if (!nombre) throw new Error("El nombre de la localidad es obligatorio.");
  if (!provinciaId) throw new Error("Tenés que seleccionar una provincia.");

  await prisma.localidad.update({
    where: { id: localidadId },
    data: { nombre, provinciaId },
  });

  revalidatePath("/localidades");
  revalidatePath("/provincias");
  redirect(`/provincias/${provinciaId}`);
}
