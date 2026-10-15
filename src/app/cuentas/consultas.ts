import type { Prisma } from "@prisma/client";
import type { UsuarioSesion } from "@/lib/auth";

export const esAdministrador = (usuario: UsuarioSesion) => usuario.perfil === "Administrador";

/** El Administrador ve todo; cada Vendedor ve solo los comprobantes de sus propios clientes. */
export function filtroVisibilidad(usuario: UsuarioSesion): Prisma.ComprobanteCuentaWhereInput {
  return esAdministrador(usuario) ? {} : { cliente: { vendedorId: usuario.id } };
}
