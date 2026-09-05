"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/authz";

type ResultadoSubida = { ok: true; url: string } | { ok: false; error: string };

export async function subirImagenProducto(formData: FormData): Promise<ResultadoSubida> {
  await requireAdmin();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      ok: false,
      error: "La subida de imágenes todavía no está configurada (falta conectar Cloudinary).",
    };
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }
  if (!archivo.type.startsWith("image/")) {
    return { ok: false, error: "El archivo tiene que ser una imagen." };
  }
  if (archivo.size > 8 * 1024 * 1024) {
    return { ok: false, error: "La imagen no puede pesar más de 8MB." };
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = `data:${archivo.type};base64,${buffer.toString("base64")}`;

    const resultado = await cloudinary.uploader.upload(base64, {
      folder: "gestion-pedidos-lya/productos",
    });

    return { ok: true, url: resultado.secure_url };
  } catch {
    // No repetimos el mensaje técnico de Cloudinary al usuario (podría filtrar detalles
    // internos); devolvemos algo claro y accionable en su lugar.
    return {
      ok: false,
      error: "No se pudo subir la imagen a Cloudinary. Verificá las credenciales configuradas.",
    };
  }
}
