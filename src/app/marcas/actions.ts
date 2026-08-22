"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearMarca(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const proveedorIds = formData.getAll("proveedorIds").map(String);

  if (!nombre) {
    throw new Error("El nombre de la marca es obligatorio.");
  }

  await prisma.marca.create({
    data: {
      nombre,
      proveedores: { connect: proveedorIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/marcas");
  redirect("/marcas");
}

export async function actualizarMarca(marcaId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const activo = formData.get("activo") === "on";
  const proveedorIds = formData.getAll("proveedorIds").map(String);

  if (!nombre) {
    throw new Error("El nombre de la marca es obligatorio.");
  }

  await prisma.marca.update({
    where: { id: marcaId },
    data: {
      nombre,
      activo,
      proveedores: { set: proveedorIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/marcas");
  redirect("/marcas");
}
