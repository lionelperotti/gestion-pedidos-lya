import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export interface UsuarioSesion {
  id: string;
  name: string;
  email: string;
  perfil: string;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { perfil: true },
        });

        if (!usuario || !usuario.activo) {
          return null;
        }

        const passwordValida = await bcrypt.compare(
          credentials.password,
          usuario.passwordHash
        );

        if (!passwordValida) {
          return null;
        }

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          perfil: usuario.perfil.nombre,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as UsuarioSesion;
        const t = token as Record<string, unknown>;
        t.id = u.id;
        t.perfil = u.perfil;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as Record<string, unknown>;
        const usuarioSesion = session.user as unknown as UsuarioSesion;
        usuarioSesion.id = t.id as string;
        usuarioSesion.perfil = t.perfil as string;
      }
      return session;
    },
  },
};