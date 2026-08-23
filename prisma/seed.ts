import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROVINCIAS_ARGENTINA } from "./provincias-argentina";

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

  // Provincias y localidades de Argentina (carga inicial, no exhaustiva)
  for (const [nombreProvincia, localidades] of Object.entries(PROVINCIAS_ARGENTINA)) {
    const provincia = await prisma.provincia.upsert({
      where: { nombre: nombreProvincia },
      update: {},
      create: { nombre: nombreProvincia },
    });

    await prisma.localidad.createMany({
      data: localidades.map((nombreLocalidad) => ({
        nombre: nombreLocalidad,
        provinciaId: provincia.id,
      })),
      skipDuplicates: true,
    });
  }
  console.log("Provincias y localidades cargadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
