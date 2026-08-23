import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import AppFooter from "@/components/AppFooter";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión de Pedidos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresá con tu cuenta para continuar
          </p>
        </div>
        <LoginForm />
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">o</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleLoginButton />
        <p className="mt-5 text-center text-sm text-slate-600">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-blue-700 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
      <AppFooter />
    </main>
  );
}
