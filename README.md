# Gestión de Pedidos LYA

Aplicativo web para que vendedores carguen pedidos desde celular/tablet frente al cliente, con catálogo de productos por proveedor y exportación de pedidos a PDF.

## Stack

- **Next.js 15** + **TypeScript** (frontend y backend en un mismo proyecto)
- **PostgreSQL** como base de datos relacional
- **Prisma** como ORM
- Desplegado en **Railway**

## Estructura de datos (resumen)

- **Usuario** ↔ **Perfil** (Administrador / Vendedor)
- **Producto** ↔ **Proveedor**
- **Cliente** ↔ **Vendedor** (un Usuario con perfil "Vendedor")
- **Pedido** ↔ **Cliente**, **Vendedor**, y sus **PedidoItem** (productos + cantidades)

El esquema completo está en [`prisma/schema.prisma`](./prisma/schema.prisma).

## Cómo correr el proyecto localmente

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar `DATABASE_URL` con los datos de conexión de Railway (Project → servicio "postgres" → pestaña "Variables" → `DATABASE_URL`).

3. Crear las tablas en la base de datos según el esquema:
   ```bash
   npm run db:push
   ```

4. Levantar el proyecto:
   ```bash
   npm run dev
   ```
   Se abre en `http://localhost:3000`.

## Estado del proyecto

Este es el punto de partida (scaffold): estructura de Next.js, esquema de base de datos y conexión lista. Las pantallas (Usuarios, Perfiles, Proveedores, Productos, Clientes, Pedidos) se van a ir construyendo a partir de acá.

## Despliegue

El proyecto está pensado para desplegarse en Railway, en el mismo proyecto donde ya existe el servicio de PostgreSQL ("Gestión de Pedidos LYA").
