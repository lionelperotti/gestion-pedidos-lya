"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

function calcularPrecioFinal(precioSinIva: number, iva: number) {
  return precioSinIva * (1 + iva / 100);
}

// El código de producto no se puede repetir dentro de un mismo proveedor.
async function validarCodigoUnico(
  proveedorId: string,
  codigoProveedor: string,
  excluirId?: string
): Promise<ResultadoAccion> {
  if (!codigoProveedor) return undefined;

  const existente = await prisma.producto.findFirst({
    where: {
      proveedorId,
      codigoProveedor,
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
  });
  if (existente) {
    return {
      error: `El código "${codigoProveedor}" ya lo tiene el producto "${existente.nombre}" de este proveedor.`,
    };
  }
  return undefined;
}

export async function crearProducto(formData: FormData): Promise<ResultadoAccion> {
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
    return { error: "Nombre, precio, proveedor y marca son obligatorios." };
  }

  const problema = await validarCodigoUnico(proveedorId, codigoProveedor);
  if (problema) return problema;

  try {
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
  } catch (e) {
    if (esErrorDeDuplicado(e)) {
      return { error: `El código "${codigoProveedor}" ya existe en este proveedor.` };
    }
    return { error: "No se pudo crear el producto. Intentá de nuevo." };
  }

  revalidatePath("/productos");
  redirect(`/productos/marca/${marcaId}`);
}

export async function actualizarProducto(
  productoId: string,
  formData: FormData
): Promise<ResultadoAccion> {
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
    return { error: "Nombre, precio, proveedor y marca son obligatorios." };
  }

  const productoActual = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!productoActual) {
    return { error: "El producto ya no existe." };
  }

  const problema = await validarCodigoUnico(proveedorId, codigoProveedor, productoId);
  if (problema) return problema;

  const cambioPrecio =
    Number(productoActual.precioSinIva) !== precioSinIva ||
    Number(productoActual.iva) !== iva;

  try {
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
  } catch (e) {
    if (esErrorDeDuplicado(e)) {
      return { error: `El código "${codigoProveedor}" ya existe en este proveedor.` };
    }
    return { error: "No se pudo guardar el producto. Intentá de nuevo." };
  }

  revalidatePath("/productos");
  redirect(`/productos/marca/${marcaId}`);
}
