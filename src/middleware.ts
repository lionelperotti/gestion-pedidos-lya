import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const esPendiente = token.estado === "PENDIENTE";
  const enPantallaDeEspera = request.nextUrl.pathname.startsWith("/pendiente-autorizacion");

  if (esPendiente && !enPantallaDeEspera) {
    return NextResponse.redirect(new URL("/pendiente-autorizacion", request.url));
  }

  if (!esPendiente && enPantallaDeEspera) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protege todas las rutas excepto login, registro, verificación de email,
  // la API de auth, y archivos estáticos
  matcher: [
    "/((?!login|registro|verificar-email|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
