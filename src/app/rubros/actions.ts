"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearRubro(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) throw new Error("El nombre del rubro es obligatorio.");

  await prisma.rubro.create({ data: { nombre } });

  revalidatePath("/rubros");
  redirect("/rubros");
}

export async function actualizarRubro(rubroId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) throw new Error("El nombre del rubro es obligatorio.");

  await prisma.rubro.update({
    where: { id: rubroId },
    data: { nombre },
  });

  revalidatePath("/rubros");
  redirect("/rubros");
}
