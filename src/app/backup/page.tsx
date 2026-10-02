import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import DescargarBackupBoton from "./DescargarBackupBoton";

export default async function BackupPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          ← Volver
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Backup</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-12 text-center">
        <p className="mb-6 text-sm text-slate-600">
          Descargá un único archivo con todos los datos del sistema: Usuarios,
          Proveedores, Marcas, Productos, Clientes, Provincias, Localidades, Rubros,
          Pedidos y Lotes. Guardalo donde prefieras (tu compu, Google Drive, etc.) como
          respaldo adicional, independiente de Railway.
        </p>
        <DescargarBackupBoton />
      </div>
    </main>
  );
}
