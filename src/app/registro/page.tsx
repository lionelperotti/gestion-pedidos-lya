import RegistroForm from "./RegistroForm";
import AppFooter from "@/components/AppFooter";

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Te vamos a mandar un email para confirmar tu cuenta
          </p>
        </div>
        <RegistroForm />
      </div>
      <AppFooter />
    </main>
  );
}
