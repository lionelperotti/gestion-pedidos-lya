import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export interface UsuarioSesion {
  id: string;
  name: string;
  email: string;
  perfil: string | null; // null mientras está PENDIENTE de autorización
  estado: "PENDIENTE" | "ACTIVO";
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
        });

        // Los usuarios que solo entran con Google no tienen passwordHash
        if (!usuario || !usuario.activo || !usuario.passwordHash) {
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
        } as unknown as import("next-auth").User;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const existente = await prisma.usuario.findUnique({
          where: { email: user.email },
        });

        // Primera vez que este email entra con Google: se crea como PENDIENTE,
        // sin perfil asignado, hasta que un Administrador lo autorice.
        if (!existente) {
          await prisma.usuario.create({
            data: {
              nombre: user.name ?? user.email,
              email: user.email,
              estado: "PENDIENTE",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Se ejecuta en el login inicial (user presente). Buscamos el registro
      // canónico en la base para tener perfil/estado actualizados, sin
      // importar si vino por credenciales o por Google.
      if (user?.email) {
        const dbUsuario = await prisma.usuario.findUnique({
          where: { email: user.email },
          include: { perfil: true },
        });
        const t = token as Record<string, unknown>;
        if (dbUsuario) {
          t.id = dbUsuario.id;
          t.perfil = dbUsuario.perfil?.nombre ?? null;
          t.estado = dbUsuario.estado;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as Record<string, unknown>;
        const usuarioSesion = session.user as unknown as UsuarioSesion;
        usuarioSesion.id = t.id as string;
        usuarioSesion.perfil = (t.perfil as string | null) ?? null;
        usuarioSesion.estado = t.estado as "PENDIENTE" | "ACTIVO";
      }
      return session;
    },
  },
};
