"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/authz";

export async function subirImagenProducto(formData: FormData) {
  await requireAdmin();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "La subida de imágenes todavía no está configurada (falta conectar Cloudinary)."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    throw new Error("No se recibió ningún archivo.");
  }
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo tiene que ser una imagen.");
  }
  if (archivo.size > 8 * 1024 * 1024) {
    throw new Error("La imagen no puede pesar más de 8MB.");
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const base64 = `data:${archivo.type};base64,${buffer.toString("base64")}`;

  const resultado = await cloudinary.uploader.upload(base64, {
    folder: "gestion-pedidos-lya/productos",
  });

  return { url: resultado.secure_url };
}
