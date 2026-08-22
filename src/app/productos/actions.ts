"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

function calcularPrecioFinal(precioSinIva: number, iva: number) {
  return precioSinIva * (1 + iva / 100);
}

export async function crearProducto(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fotoUrl = String(formData.get("fotoUrl") ?? "").trim();
  const codigoProveedor = String(formData.get("codigoProveedor") ?? "").trim();
  const precioSinIva = Number(String(formData.get("precioSinIva") ?? "").trim());
  const iva = Number(String(formData.get("iva") ?? "21").trim());
  const stock = String(formData.get("stock") ?? "0").trim();
  const proveedorId = String(formData.get("proveedorId") ?? "");
  const marcaId = String(formData.get("marcaId") ?? "");

  if (!nombre || !precioSinIva || !proveedorId || !marcaId) {
    throw new Error("Nombre, precio, proveedor y marca son obligatorios.");
  }

  await prisma.producto.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      fotoUrl: fotoUrl || null,
      codigoProveedor: codigoProveedor || null,
      precioSinIva,
      iva,
      precioFinal: calcularPrecioFinal(precioSinIva, iva),
      precioActualizadoEn: new Date(),
      stock: Number(stock) || 0,
      proveedorId,
      marcaId,
    },
  });

  revalidatePath("/productos");
  redirect(`/productos/marca/${marcaId}`);
}

export async function actualizarProducto(productoId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fotoUrl = String(formData.get("fotoUrl") ?? "").trim();
  const codigoProveedor = String(formData.get("codigoProveedor") ?? "").trim();
  const precioSinIva = Number(String(formData.get("precioSinIva") ?? "").trim());
  const iva = Number(String(formData.get("iva") ?? "21").trim());
  const stock = String(formData.get("stock") ?? "0").trim();
  const proveedorId = String(formData.get("proveedorId") ?? "");
  const marcaId = String(formData.get("marcaId") ?? "");
  const activo = formData.get("activo") === "on";

  if (!nombre || !precioSinIva || !proveedorId || !marcaId) {
    throw new Error("Nombre, precio, proveedor y marca son obligatorios.");
  }

  const productoActual = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!productoActual) {
    throw new Error("El producto ya no existe.");
  }

  const cambioPrecio =
    Number(productoActual.precioSinIva) !== precioSinIva ||
    Number(productoActual.iva) !== iva;

  await prisma.producto.update({
    where: { id: productoId },
    data: {
      nombre,
      descripcion: descripcion || null,
      fotoUrl: fotoUrl || null,
      codigoProveedor: codigoProveedor || null,
      precioSinIva,
      iva,
      precioFinal: calcularPrecioFinal(precioSinIva, iva),
      ...(cambioPrecio ? { precioActualizadoEn: new Date() } : {}),
      stock: Number(stock) || 0,
      proveedorId,
      marcaId,
      activo,
    },
  });

  revalidatePath("/productos");
  redirect(`/productos/marca/${marcaId}`);
}
