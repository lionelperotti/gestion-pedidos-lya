import { redirect } from "next/navigation";
import { getSessionUsuario } from "./session";
import type { UsuarioSesion } from "./auth";

/**
 * Exige que el usuario logueado tenga perfil "Administrador".
 * Si no está logueado, redirige a /login. Si está logueado pero no es
 * Administrador, redirige al home.
 */
export async function requireAdmin(): Promise<UsuarioSesion> {
  const sesionUsuario = await getSessionUsuario();

  if (!sesionUsuario) {
    redirect("/login");
  }

  const usuario = sesionUsuario as unknown as UsuarioSesion;

  if (usuario.perfil !== "Administrador") {
    redirect("/");
  }

  return usuario;
}
