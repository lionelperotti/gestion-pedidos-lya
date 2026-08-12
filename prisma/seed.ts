import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Perfiles base
  const perfilAdmin = await prisma.perfil.upsert({
    where: { nombre: "Administrador" },
    update: {},
    create: {
      nombre: "Administrador",
      descripcion: "Acceso completo a todos los módulos",
    },
  });

  await prisma.perfil.upsert({
    where: { nombre: "Vendedor" },
    update: {},
    create: {
      nombre: "Vendedor",
      descripcion: "Gestiona sus propios Clientes y Pedidos",
    },
  });

  // Usuario administrador inicial
  const emailAdmin = process.env.SEED_ADMIN_EMAIL ?? "admin@lya.com";
  const passwordAdmin = process.env.SEED_ADMIN_PASSWORD ?? "CAMBIAR_ESTA_PASSWORD";
  const passwordHash = await bcrypt.hash(passwordAdmin, 10);

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: emailAdmin },
  });

  if (!usuarioExistente) {
    await prisma.usuario.create({
      data: {
        nombre: "Administrador",
        email: emailAdmin,
        passwordHash,
        perfilId: perfilAdmin.id,
      },
    });
    console.log(`Usuario administrador creado: ${emailAdmin}`);
  } else {
    console.log(`Usuario administrador ya existía: ${emailAdmin}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
