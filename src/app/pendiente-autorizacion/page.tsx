import CerrarSesionBoton from "@/components/CerrarSesionBoton";

export default function PendienteAutorizacionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-sm">
        <div className="mb-4 text-4xl">⏳</div>
        <h1 className="mb-2 text-xl font-bold text-slate-900">
          Cuenta pendiente de autorización
        </h1>
        <p className="mb-6 text-slate-600">
          Tu cuenta ya quedó registrada. Un Administrador necesita asignarte
          un perfil antes de que puedas ingresar. Avisale para que lo haga
          desde la sección Usuarios.
        </p>
        <CerrarSesionBoton />
      </div>
    </main>
  );
}
