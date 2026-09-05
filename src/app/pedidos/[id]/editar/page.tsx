import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import PedidoWizard from "../../componentes/PedidoWizard";

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: { include: { localidad: true, provincia: true } },
      items: true,
    },
  });

  if (!pedido) {
    notFound();
  }

  if (usuario.perfil !== "Administrador" && pedido.vendedorId !== usuario.id) {
    redirect("/pedidos");
  }

  if (pedido.estado !== "PENDIENTE") {
    redirect(`/pedidos/${id}`);
  }

  const [marcas, productosDb] = await Promise.all([
    prisma.marca.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
    }),
  ]);

  const productos = productosDb.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    fotoUrl: p.fotoUrl,
    precioSinIva: Number(p.precioSinIva),
    iva: Number(p.iva),
    marcaId: p.marcaId,
    codigoProveedor: p.codigoProveedor,
    precioActualizadoEn: p.precioActualizadoEn ? p.precioActualizadoEn.toISOString() : null,
  }));

  const itemsIniciales = pedido.items.map((item) => ({
    productoId: item.productoId,
    cantidad: item.cantidad,
    descuento: Number(item.descuento),
    precioSinIva: Number(item.precioSinIva),
    iva: Number(item.iva),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <h1 className="text-lg font-bold text-slate-900">
          Editar pedido #{pedido.numero}
        </h1>
      </header>

      <PedidoWizard
        clientes={[]}
        marcas={marcas}
        productos={productos}
        modo="editar"
        pedidoId={pedido.id}
        clienteInicial={{
          id: pedido.cliente.id,
          nombre: pedido.cliente.nombre,
          cuit: pedido.cliente.cuit,
          direccion: pedido.cliente.direccion,
          localidad: pedido.cliente.localidad?.nombre ?? null,
          provincia: pedido.cliente.provincia?.nombre ?? null,
        }}
        itemsIniciales={itemsIniciales}
        datosPedidoIniciales={{
          conFactura: pedido.conFactura,
          modalidadPago: pedido.modalidadPago,
          observaciones: pedido.observaciones ?? "",
        }}
      />
    </main>
  );
}
