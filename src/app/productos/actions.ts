"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearProducto(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fotoUrl = String(formData.get("fotoUrl") ?? "").trim();
  const precio = String(formData.get("precio") ?? "").trim();
  const stock = String(formData.get("stock") ?? "0").trim();
  const proveedorId = String(formData.get("proveedorId") ?? "");

  if (!nombre || !precio || !proveedorId) {
    throw new Error("Nombre, precio y proveedor son obligatorios.");
  }

  await prisma.producto.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      fotoUrl: fotoUrl || null,
      precio,
      stock: Number(stock) || 0,
      proveedorId,
    },
  });

  revalidatePath("/productos");
  redirect("/productos");
}

export async function actualizarProducto(productoId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fotoUrl = String(formData.get("fotoUrl") ?? "").trim();
  const precio = String(formData.get("precio") ?? "").trim();
  const stock = String(formData.get("stock") ?? "0").trim();
  const proveedorId = String(formData.get("proveedorId") ?? "");
  const activo = formData.get("activo") === "on";

  if (!nombre || !precio || !proveedorId) {
    throw new Error("Nombre, precio y proveedor son obligatorios.");
  }

  await prisma.producto.update({
    where: { id: productoId },
    data: {
      nombre,
      descripcion: descripcion || null,
      fotoUrl: fotoUrl || null,
      precio,
      stock: Number(stock) || 0,
      proveedorId,
      activo,
    },
  });

  revalidatePath("/productos");
  redirect("/productos");
}
