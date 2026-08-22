"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function crearUsuario(formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const perfilId = String(formData.get("perfilId") ?? "");

  if (!nombre || !email || !password || !perfilId) {
    throw new Error("Todos los campos son obligatorios.");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.create({
    data: { nombre, email, passwordHash, perfilId, estado: "ACTIVO" },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function autorizarUsuario(usuarioId: string, formData: FormData) {
  await requireAdmin();

  const perfilId = String(formData.get("perfilId") ?? "");
  if (!perfilId) {
    throw new Error("Tenés que seleccionar un perfil para autorizar al usuario.");
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { perfilId, estado: "ACTIVO" },
  });

  revalidatePath("/usuarios");
}

export async function rechazarUsuario(usuarioId: string) {
  await requireAdmin();

  await prisma.usuario.delete({ where: { id: usuarioId } });

  revalidatePath("/usuarios");
}

export async function actualizarUsuario(usuarioId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const perfilId = String(formData.get("perfilId") ?? "");
  const activo = formData.get("activo") === "on";

  if (!nombre || !email || !perfilId) {
    throw new Error("Nombre, email y perfil son obligatorios.");
  }

  const data: {
    nombre: string;
    email: string;
    perfilId: string;
    activo: boolean;
    passwordHash?: string;
  } = { nombre, email, perfilId, activo };

  // Solo actualiza la contraseña si se cargó una nueva
  if (password) {
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data,
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}
