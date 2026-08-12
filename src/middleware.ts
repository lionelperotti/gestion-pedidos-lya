export { default } from "next-auth/middleware";

export const config = {
  // Protege todas las rutas excepto login, la API de auth, y archivos estáticos
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
