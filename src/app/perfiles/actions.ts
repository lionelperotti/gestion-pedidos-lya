"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearPerfil(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!nombre) {
    throw new Error("El nombre del perfil es obligatorio.");
  }

  await prisma.perfil.create({
    data: { nombre, descripcion: descripcion || null },
  });

  revalidatePath("/perfiles");
  redirect("/perfiles");
}

export async function actualizarPerfil(perfilId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!nombre) {
    throw new Error("El nombre del perfil es obligatorio.");
  }

  await prisma.perfil.update({
    where: { id: perfilId },
    data: { nombre, descripcion: descripcion || null },
  });

  revalidatePath("/perfiles");
  redirect("/perfiles");
}
