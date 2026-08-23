"use server";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { enviarEmailVerificacion } from "@/lib/email";

export async function registrarUsuario(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nombre || !email || !password) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw new Error("Ya existe una cuenta registrada con ese email.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const tokenVerificacion = randomUUID();
  const tokenVerificacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hs

  await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      estado: "PENDIENTE",
      emailVerificado: false,
      tokenVerificacion,
      tokenVerificacionExpira,
    },
  });

  await enviarEmailVerificacion(email, nombre, tokenVerificacion);

  return { ok: true };
}
