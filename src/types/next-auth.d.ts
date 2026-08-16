import type { DefaultSession } from "next-auth";

// Extiende los tipos de NextAuth para incluir "id" y "perfil"
// en session.user, ya que los agregamos en los callbacks de auth.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      perfil: string;
    } & DefaultSession["user"];
  }

  interface User {
    perfil: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    perfil: string;
  }
}
