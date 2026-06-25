# 🌮 Los Antojitos de Misha

Sistema completo de gestión de pedidos online para fonda de antojitos mexicanos.

## 📋 Descripción

Sistema full-stack desarrollado con Next.js 15 que permite:

- **Catálogo digital** con fotos, precios y personalizaciones
- **Sistema de pedidos** con 3 modalidades: recoger, comer en sitio (mesa) y domicilio
- **Flujo de cocina (KDS)** con estados de orden
- **Control de inventario** por ingredientes con recetas (BOM)
- **Panel admin** completo para gestión

## 🛠 Stack Tecnológico

### Core
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js
- **Lenguaje**: TypeScript
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **ORM**: Prisma

### Librerías
- **Autenticación**: JWT (jsonwebtoken)
- **Hash de contraseñas**: bcryptjs
- **Validación**: Zod
- **Estilos**: TailwindCSS 4

## 🚀 Setup del Proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Las variables ya están en `.env`. Ajusta si es necesario:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

### 3. La base de datos ya está migrada con datos de prueba

Si necesitas resetear:

```bash
npm run db:reset    # Resetea la BD
npm run db:seed     # Vuelve a poblar con datos
```

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🔐 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@antojitos.com | admin123 |
| Cliente | cliente@test.com | cliente123 |
| Cocina | cocina@antojitos.com | cocina123 |

## 📡 API Endpoints Disponibles

### Autenticación

**Registro:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "name": "Nombre Usuario",
  "phone": "5512345678",
  "password": "contraseña123"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

### Categorías

```http
GET /api/categories                    # Listar todas
GET /api/categories/:id                # Ver una
POST /api/categories                   # Crear (requiere token admin)
PUT /api/categories/:id                # Actualizar (requiere token admin)
DELETE /api/categories/:id             # Eliminar (requiere token admin)
```

### Productos

```http
GET /api/products                      # Listar todos
GET /api/products?categoryId={id}      # Filtrar por categoría
GET /api/products?search={query}       # Buscar por nombre
GET /api/products/:id                  # Ver uno con opciones
POST /api/products                     # Crear (requiere token admin)
PUT /api/products/:id                  # Actualizar (requiere token admin)
DELETE /api/products/:id               # Eliminar (requiere token admin)
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run db:seed      # Poblar BD con datos de prueba
npm run db:reset     # Resetear BD
npm run db:studio    # Abrir Prisma Studio
```

## 🏗 Estructura del Proyecto

```
antojitos-proyecto-web/
├── prisma/
│   ├── schema.prisma       # Modelo de datos (14 entidades)
│   ├── migrations/         # Migraciones de BD
│   ├── seed.ts            # Script de seed
│   └── dev.db             # Base de datos SQLite
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # Registro y login
│   │   │   ├── categories/# CRUD Categorías
│   │   │   └── products/  # CRUD Productos
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── prisma.ts      # Cliente de Prisma (singleton)
│   │   ├── auth.ts        # JWT utilities
│   │   ├── password.ts    # bcrypt utilities
│   │   └── api-response.ts# Respuestas HTTP
│   └── middleware/
│       └── auth.ts        # Auth & authorization
├── .env
└── package.json
```

## 📊 Estado del Proyecto

### ✅ Fase 1 Completada

- [x] Setup del proyecto con Next.js + TypeScript
- [x] Modelo de datos completo en Prisma (14 tablas)
- [x] Base de datos SQLite configurada
- [x] Sistema de autenticación (JWT)
  - [x] Registro de usuarios
  - [x] Login con JWT
  - [x] Middleware de autenticación
  - [x] Autorización por roles
- [x] CRUD Categorías (completo)
- [x] CRUD Productos (completo con relaciones)
- [x] Seed con datos de prueba
- [x] Documentación completa

### 🚧 Próximas Fases

**Fase 2: Carrito y Órdenes**
- [ ] API de carrito (agregar, actualizar, quitar items)
- [ ] Cálculo de precios con modificadores
- [ ] Checkout y creación de órdenes
- [ ] Gestión de direcciones

**Fase 3: Inventario y Cocina**
- [ ] CRUD ingredientes
- [ ] Gestión de recetas (BOM)
- [ ] Descuento automático de stock
- [ ] Vista KDS para cocina
- [ ] Cambio de estados de orden

**Fase 4: Frontend**
- [ ] Catálogo de productos
- [ ] Detalle de producto
- [ ] Carrito de compras UI
- [ ] Proceso de checkout
- [ ] Panel admin
- [ ] Vista de cocina

## 🔒 Seguridad Implementada

- ✅ Contraseñas hasheadas con bcryptjs
- ✅ JWT con expiración (7 días por defecto)
- ✅ Validación de inputs con Zod
- ✅ Middleware de autenticación
- ✅ Autorización por roles (ADMIN, CLIENTE, COCINA)
- ✅ No se exponen contraseñas en respuestas

## 🐛 Testing

Puedes probar los endpoints con herramientas como:
- **Thunder Client** (extensión de VS Code)
- **Postman**
- **curl**

Ejemplo con curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@antojitos.com","password":"admin123"}'

# Listar productos
curl http://localhost:3000/api/products

# Crear categoría (con token)
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"name":"Postres","description":"Postres caseros"}'
```

## 📄 Licencia

Proyecto académico - Desarrollo Web Avanzado

---

**¿Dudas?** Revisa el código o abre un issue.
