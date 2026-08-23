import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import type { UsuarioSesion } from "./auth";

export async function getSessionUsuario() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const usuarioSesion = session.user as unknown as UsuarioSesion;

  // Sesión única por usuario (si inició sesión en otro dispositivo, el
  // sessionId cambió) y chequeo en vivo de que la cuenta siga habilitada.
  const usuarioDb = await prisma.usuario.findUnique({
    where: { id: usuarioSesion.id },
    select: { sessionId: true, activo: true },
  });

  if (!usuarioDb || !usuarioDb.activo || usuarioDb.sessionId !== usuarioSesion.sessionId) {
    return null;
  }

  return session.user;
}
