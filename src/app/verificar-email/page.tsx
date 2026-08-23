import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let resultado: "ok" | "invalido" | "vencido" = "invalido";

  if (token) {
    const usuario = await prisma.usuario.findUnique({ where: { tokenVerificacion: token } });

    if (usuario) {
      const vencido = usuario.tokenVerificacionExpira
        ? usuario.tokenVerificacionExpira < new Date()
        : true;

      if (vencido) {
        resultado = "vencido";
      } else {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            emailVerificado: true,
            tokenVerificacion: null,
            tokenVerificacionExpira: null,
          },
        });
        resultado = "ok";
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-sm">
        {resultado === "ok" && (
          <>
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="mb-2 text-xl font-bold text-slate-900">
              ¡Cuenta confirmada!
            </h1>
            <p className="mb-6 text-slate-600">
              Ya podés iniciar sesión. Tu cuenta va a quedar pendiente de que un
              Administrador te asigne un perfil.
            </p>
          </>
        )}
        {resultado === "vencido" && (
          <>
            <div className="mb-4 text-4xl">⏰</div>
            <h1 className="mb-2 text-xl font-bold text-slate-900">
              El link venció
            </h1>
            <p className="mb-6 text-slate-600">
              Este link de confirmación ya no es válido. Registrate de nuevo para
              recibir uno nuevo.
            </p>
          </>
        )}
        {resultado === "invalido" && (
          <>
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-2 text-xl font-bold text-slate-900">
              Link inválido
            </h1>
            <p className="mb-6 text-slate-600">
              No pudimos confirmar tu cuenta con este link.
            </p>
          </>
        )}
        <Link
          href="/login"
          className="inline-block rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Ir al login
        </Link>
      </div>
    </main>
  );
}
