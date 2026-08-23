"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearProvincia(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) throw new Error("El nombre de la provincia es obligatorio.");

  await prisma.provincia.create({ data: { nombre } });

  revalidatePath("/provincias");
  redirect("/provincias");
}

export async function actualizarProvincia(provinciaId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) throw new Error("El nombre de la provincia es obligatorio.");

  await prisma.provincia.update({
    where: { id: provinciaId },
    data: { nombre },
  });

  revalidatePath("/provincias");
  redirect("/provincias");
}
