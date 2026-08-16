"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearProveedor(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!nombre) {
    throw new Error("El nombre del proveedor es obligatorio.");
  }

  await prisma.proveedor.create({
    data: {
      nombre,
      contacto: contacto || null,
      telefono: telefono || null,
      email: email || null,
    },
  });

  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function actualizarProveedor(proveedorId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const activo = formData.get("activo") === "on";

  if (!nombre) {
    throw new Error("El nombre del proveedor es obligatorio.");
  }

  await prisma.proveedor.update({
    where: { id: proveedorId },
    data: {
      nombre,
      contacto: contacto || null,
      telefono: telefono || null,
      email: email || null,
      activo,
    },
  });

  revalidatePath("/proveedores");
  redirect("/proveedores");
}
