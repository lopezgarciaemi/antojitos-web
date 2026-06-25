# Reporte de Funcionamiento y Corroboración — Los Antojitos de Misha

> **Fecha de generación:** 2 de diciembre de 2025  
> **Proyecto:** Sistema de Pedidos de Comida Mexicana  
> **Versión:** 1.0.0

---

## 0. Resumen del Stack y Convenciones

### 0.1 Stack Tecnológico

| Capa | Tecnología | Descripción |
|------|------------|-------------|
| **Frontend** | Next.js 15 (App Router) | React 19 con Server Components y Client Components |
| **Backend** | Next.js API Routes + Server Actions | API REST y Server Actions para mutaciones |
| **ORM** | Prisma | Gestión de base de datos con tipado TypeScript |
| **Base de Datos** | SQLite | Base de datos relacional embebida (`prisma/dev.db`) |
| **Autenticación** | JWT (jsonwebtoken) + bcrypt | Tokens firmados con expiración de 7 días |
| **Estado Global** | Zustand | Carrito persistente con localStorage |
| **Estilos** | TailwindCSS | Clases utilitarias con tema personalizado |
| **Validación** | Zod | Validación de schemas en Server Actions |

### 0.2 Arquitectura de Componentes

```
Frontend (Client Components)    │    Backend (Server)
────────────────────────────────┼────────────────────────────────
src/app/login/page.tsx          │    src/app/api/auth/login/route.ts
src/app/productos/page.tsx      │    src/app/api/products/route.ts
src/app/checkout/page.tsx       │    src/lib/actions/order.ts (Server Action)
src/store/cart.ts (Zustand)     │    src/lib/actions/kitchen.ts (Server Action)
src/components/CartDrawer.tsx   │    src/middleware/auth.ts
```

### 0.3 Convenciones de Respuestas API

**Archivo:** `src/lib/api-response.ts`

```typescript
// Respuesta exitosa
{ success: true, data: {...} }

// Respuesta de error
{ success: false, error: "Mensaje descriptivo" }
```

**Funciones disponibles:**
- `successResponse<T>(data: T, status?: number)` → Respuesta 200/201 con data
- `errorResponse(error: string, status?: number)` → Respuesta con código de error
- `handleApiError(error: unknown)` → Manejo centralizado (401, 403, 404, 500)

### 0.4 Esquema de Rutas Protegidas y Públicas

| Ruta | Tipo | Roles Permitidos | Protección |
|------|------|------------------|------------|
| `/login`, `/registro` | Pública | Todos | Ninguna |
| `/productos`, `/productos/[id]` | Pública | Todos | Ninguna |
| `/perfil` | Protegida | Autenticados | Token requerido |
| `/checkout` | Protegida | Autenticados | Token + direcciones |
| `/cocina` | Protegida | COCINA, ADMIN | Verificación de rol |
| `/admin/inventario` | Protegida | ADMIN | Verificación de rol |
| `POST /api/products` | API Protegida | ADMIN | Bearer token + rol |

---

## 1. Autenticación y Token (JWT)

### 1.1 Estructura del Token

**Contenido del payload JWT:**
```json
{
  "userId": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "role": "CLIENTE | ADMIN | COCINA",
  "iat": 1701475200,
  "exp": 1702080000
}
```

**Configuración:**
- **Algoritmo:** HS256 (por defecto de jsonwebtoken)
- **Expiración:** 7 días (`JWT_EXPIRES_IN = '7d'`)
- **Secret:** Variable de entorno `JWT_SECRET` o `'dev-secret-change-in-production'`

### 1.2 Dónde se Genera el Token

**Archivo:** `src/lib/auth.ts` (líneas 19-24)

```typescript
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}
```

**Llamado desde:** `src/app/api/auth/login/route.ts` (línea 47-51)
```typescript
const token = generateToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});
```

### 1.3 Dónde se Valida el Token

**Archivo:** `src/lib/auth.ts` (líneas 29-42)
```typescript
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    // ...
  }
}
```

**Archivo:** `src/middleware/auth.ts` (líneas 25-37)
```typescript
export function authenticateRequest(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    throw new Error('Token de autenticación requerido');
  }
  const payload = verifyToken(token);
  return payload;
}
```

### 1.4 Dónde se Almacena el Token

#### Frontend: localStorage (almacenamiento primario)

**Archivo:** `src/app/login/page.tsx` (líneas 35-36)
```typescript
localStorage.setItem('token', data.data.token);
localStorage.setItem('user', JSON.stringify(data.data.user));
```

**Clave en localStorage:** `'token'`  
**Contenido:** String del JWT (ej: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### Frontend: Cookie (para Server Actions)

**Archivo:** `src/app/login/page.tsx` (línea 38)
```typescript
document.cookie = `token=${data.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
```

La cookie se establece al hacer login para que los Server Actions puedan leerla con `cookies().get('token')`.

**¿Por qué se eligió localStorage?**
1. Simplicidad de implementación
2. El carrito también usa localStorage (consistencia)
3. Las API Routes validan el token del header `Authorization: Bearer <token>`
4. Los Server Actions leen la cookie con `cookies().get('token')`

### 1.5 Quién Escribe y Lee el Token

| Operación | Archivo | Función | Almacenamiento |
|-----------|---------|---------|----------------|
| **Escribir (login)** | `src/app/login/page.tsx` | `handleSubmit` | localStorage |
| **Escribir (cookie)** | `src/app/perfil/page.tsx` | Manualmente vía `document.cookie` | Cookie |
| **Leer (API)** | `src/middleware/auth.ts` | `authenticateRequest` | Header `Authorization` |
| **Leer (Server Action)** | `src/lib/actions/order.ts` | `getCurrentUser` | Cookie |
| **Borrar (logout)** | `src/app/perfil/page.tsx` | `handleLogout` | localStorage + Cookie |

### 1.6 Cómo Corroborar

#### Paso 1: Ver token en localStorage
1. Abrir DevTools del navegador (F12)
2. Ir a `Application` → `Local Storage` → `http://localhost:3000`
3. Buscar clave `token`
4. Copiar el valor del token

#### Paso 2: Decodificar en jwt.io
1. Ir a https://jwt.io
2. Pegar el token en el campo "Encoded"
3. Verificar el payload: `userId`, `email`, `role`, `exp`

#### Paso 3: Probar endpoint protegido sin token
```bash
curl -X GET http://localhost:3000/api/products \
  -H "Content-Type: application/json"
# Respuesta: 200 OK (productos es público)

curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
# Respuesta: 401 Unauthorized
# { "success": false, "error": "Token de autenticación requerido" }
```

#### Paso 4: Probar con token válido
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_TOKEN_DE_ADMIN>" \
  -d '{"categoryId": "xxx", "name": "Test", "basePrice": 50}'
# Respuesta: 201 Created (si el usuario es ADMIN)
```

### 1.7 Flujo de Expiración y Renovación

| Evento | Comportamiento |
|--------|----------------|
| Token expira (después de 7 días) | API responde `401` con error "Token expirado" |
| Usuario intenta acceder a ruta protegida | Redirección a `/login` |
| Renovación | No implementada automáticamente; el usuario debe re-autenticarse |

**Logout manual:**
```typescript
// src/app/perfil/page.tsx líneas 217-221
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  router.push('/login');
};
```

---

## 2. Modelo de Datos (Prisma)

### 2.1 Lista de Modelos

**Archivo:** `prisma/schema.prisma`

| Modelo | Líneas | Propósito |
|--------|--------|-----------|
| `User` | 19-34 | Usuarios con roles (CLIENTE, ADMIN, COCINA) |
| `Address` | 40-59 | Direcciones de entrega del usuario |
| `Category` | 65-79 | Categorías del menú (Tacos, Bebidas, etc.) |
| `Product` | 81-99 | Productos con precio base e imagen |
| `Ingredient` | 108-123 | Inventario de ingredientes |
| `Recipe` | 127-140 | BOM: Qué ingredientes lleva cada producto |
| `OptionGroup` | 146-161 | Grupos de opciones (Tortilla, Salsas, Extras) |
| `Option` | 163-177 | Opciones individuales con priceModifier |
| `ProductOptionGroup` | 180-190 | M:N entre Product y OptionGroup |
| `Cart` | 196-207 | Carrito persistente en DB (opcional) |
| `CartItem` | 209-229 | Items del carrito con opciones JSON |
| `Order` | 246-282 | Pedidos con estado y snapshots |
| `OrderItem` | 284-305 | Items del pedido con datos congelados |
| `OrderHistory` | 311-322 | Historial de cambios de estado |

### 2.2 Relaciones Clave

```
User ──1:N── Address
User ──1:N── Order
Category ──1:N── Product
Product ──1:N── Recipe ──N:1── Ingredient
Product ──M:N── OptionGroup (vía ProductOptionGroup)
OptionGroup ──1:N── Option
Order ──1:N── OrderItem
Order ──1:N── OrderHistory
```

### 2.3 Enums Definidos

```prisma
enum UserRole { CLIENTE, ADMIN, COCINA }
enum IngredientUnit { KG, LT, PIEZA, GRAMOS, MILILITROS }
enum OrderType { RECOGER, MESA, DOMICILIO }
enum OrderStatus { CREADA, PAGADA, EN_PREPARACION, LISTA, ENTREGADA, CANCELADA }
enum PaymentMethod { EFECTIVO, TARJETA, TRANSFERENCIA }
```

### 2.4 Migraciones Aplicadas

**Directorio:** `prisma/migrations/`

| Migración | Fecha | Descripción |
|-----------|-------|-------------|
| `20251105021654_init` | 5 Nov 2025 | Schema inicial |
| `20251126052231_add_phases_1_4` | 26 Nov 2025 | Fases 1-4 completas |

### 2.5 Cómo Corroborar

#### Visualizar con Prisma Studio
```bash
npx prisma studio
# Abre http://localhost:5555 con interfaz gráfica para todas las tablas
```

#### Consultas de verificación
```typescript
// Script de prueba
import { prisma } from './src/lib/prisma';

// Verificar usuarios
const users = await prisma.user.findMany({ include: { addresses: true } });
console.log('Usuarios:', users.length);

// Verificar productos con recetas
const products = await prisma.product.findMany({
  include: { recipes: { include: { ingredient: true } } }
});
console.log('Productos con ingredientes:', products);
```

### 2.6 Snapshots en Order

**Propósito:** Congelar datos al momento del pedido para histórico.

| Campo | Modelo | Tipo | Descripción |
|-------|--------|------|-------------|
| `deliveryAddress` | Order | String (JSON) | Dirección completa congelada |
| `productName` | OrderItem | String | Nombre del producto al momento |
| `productPrice` | OrderItem | Float | Precio base al momento |
| `options` | OrderItem | String (JSON) | Opciones seleccionadas |
| `unitPrice` | OrderItem | Float | Precio final con opciones |

**Archivo:** `src/lib/actions/order.ts` (líneas 155-166)
```typescript
const addressSnapshot = JSON.stringify({
  label: address.label,
  street: address.street,
  number: address.number,
  // ... todos los campos
});
```

---

## 3. Seguridad (Middleware y Roles)

### 3.1 Middleware de Autenticación

**Archivo:** `src/middleware/auth.ts`

| Función | Líneas | Propósito |
|---------|--------|-----------|
| `authenticateRequest` | 25-37 | Extrae y verifica token del header |
| `authorizeRole` | 42-46 | Verifica que el rol esté en lista permitida |

### 3.2 Roles y Rutas Protegidas

| Rol | Rutas Permitidas | Verificación |
|-----|------------------|--------------|
| `CLIENTE` | `/perfil`, `/checkout` | Token válido |
| `COCINA` | `/cocina` | Token + rol in ['COCINA', 'ADMIN'] |
| `ADMIN` | `/admin/*`, `/cocina` | Token + rol === 'ADMIN' |

**Ejemplo de verificación en Server Component:**

`src/app/cocina/page.tsx` (líneas 33-41)
```typescript
const user = await getUser();
if (!user) {
  redirect('/login');
}
if (!['COCINA', 'ADMIN'].includes(user.rol)) {
  redirect('/productos');
}
```

### 3.3 Validación de Inputs con Zod

| Archivo | Schema | Validaciones |
|---------|--------|--------------|
| `src/app/api/auth/login/route.ts` | `loginSchema` | email, password requeridos |
| `src/app/api/auth/register/route.ts` | `registerSchema` | name, email, password min 6 chars |
| `src/lib/actions/order.ts` | `CreateOrderSchema` | items, addressId, paymentMethod |
| `src/lib/actions/address.ts` | `addressSchema` | zipCode 5 dígitos, phone 10 dígitos |
| `src/lib/actions/kitchen.ts` | `RestockSchema` | ingredientId, amount positivo |

### 3.4 Cómo Corroborar

#### Acceso denegado por rol
1. Login como `cliente@test.com / cliente123`
2. Navegar a `http://localhost:3000/admin/inventario`
3. **Resultado esperado:** Redirección a `/productos`

#### Acceso a API sin token
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json"
# Respuesta: { "success": false, "error": "Token de autenticación requerido" }
# Status: 401
```

#### Acceso a API con rol incorrecto
```bash
# Token de CLIENTE intentando crear producto
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN_CLIENTE>" \
  -H "Content-Type: application/json"
# Respuesta: { "success": false, "error": "No tienes permisos..." }
# Status: 403
```

---

## 4. Lógica de Negocio

### 4.1 Carrito de Compras

#### Estado Global (Zustand)

**Archivo:** `src/store/cart.ts`

```typescript
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item) => void;
  removeItem: (cartItemId) => void;
  updateQuantity: (cartItemId, quantity) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getShippingCost: () => number;
  getTotal: () => number;
}
```

#### Persistencia en localStorage

**Clave:** `'antojitos-cart'`

**Configuración (líneas 146-150):**
```typescript
persist(
  (set, get) => ({...}),
  {
    name: 'antojitos-cart',
    partialize: (state) => ({ items: state.items }),
  }
)
```

**Ejemplo de contenido en localStorage:**
```json
{
  "state": {
    "items": [
      {
        "cartItemId": "uuid-123-...",
        "productId": "prod-1",
        "name": "Taco al Pastor",
        "price": 25,
        "quantity": 2,
        "options": [
          { "name": "Tortilla", "value": "Maíz", "priceModifier": 0 }
        ]
      }
    ]
  },
  "version": 0
}
```

#### Regla de Agrupación

**Lógica (líneas 57-67):** Si existe un item con mismo `productId` + mismas `options` + mismas `notes`, se incrementa la cantidad en lugar de agregar nuevo.

```typescript
const existingIndex = state.items.findIndex(
  item => item.productId === newItem.productId && 
          areOptionsEqual(item.options, newItem.options) &&
          item.notes === newItem.notes
);
```

#### Cálculo del Precio

**Función `getSubtotal` (líneas 120-132):**
```typescript
getSubtotal: () => {
  return get().items.reduce((acc, item) => {
    let itemPrice = item.price; // Precio base
    if (item.options) {
      itemPrice += item.options.reduce(
        (optAcc, opt) => optAcc + (opt.priceModifier || 0), 0
      );
    }
    return acc + (itemPrice * item.quantity);
  }, 0);
}
```

### 4.2 Opciones de Personalización

#### Estructura de Datos

**OptionGroup:**
- `name`: Nombre del grupo (ej: "Tipo de Tortilla")
- `isRequired`: Obligatorio seleccionar
- `allowMultiple`: Puede elegir varias opciones
- `maxSelections`: Límite de selección múltiple

**Option:**
- `name`: Nombre de la opción (ej: "Tortilla de Maíz")
- `priceModifier`: Precio adicional (+$0, +$10, etc.)
- `isDefault`: Seleccionada por defecto

#### Renderizado en Frontend

**Archivo:** `src/app/productos/[id]/page.tsx` (líneas 140-180)

```tsx
{product.optionGroups.map((group) => (
  <div key={group.id}>
    <h2>{group.nombre}</h2>
    {group.obligatorio && <span>OBLIGATORIO</span>}
    {group.options.map((option) => (
      <button onClick={() => handleOptionSelect(group.id, option.id, group.seleccionMultiple)}>
        {option.nombre} {option.precioAdicional > 0 && `+$${option.precioAdicional}`}
      </button>
    ))}
  </div>
))}
```

### 4.3 Checkout Transaccional

**Archivo:** `src/lib/actions/order.ts`

#### Flujo Completo (función `createOrder`)

1. **Validar autenticación** (línea 74)
2. **Validar input con Zod** (líneas 79-85)
3. **Verificar dirección del usuario** (líneas 91-99)
4. **Obtener productos con recetas** (líneas 102-112)
5. **Calcular ingredientes necesarios** (líneas 118-136)
6. **Verificar stock de ingredientes** (líneas 139-157)
7. **Calcular totales** (líneas 163-175)
8. **Crear snapshot de dirección** (líneas 178-189)
9. **TRANSACCIÓN ATÓMICA** (líneas 200-228):
   - Crear Order
   - Crear OrderItems con snapshots
   - Descontar stock de ingredientes

#### Transacción Prisma

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Crear la orden
  const order = await tx.order.create({
    data: { /* ... */ }
  });

  // 2. Descontar stock
  for (const [ingredientId, requirement] of ingredientRequirements) {
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stock: { decrement: requirement.required } }
    });
  }

  return order;
});
```

**Beneficio:** Si falla cualquier operación, todo se revierte automáticamente.

#### Validación de Stock

Si el stock es insuficiente, retorna:
```typescript
{
  success: false,
  error: 'Stock insuficiente para algunos productos',
  stockErrors: [
    { productId: 'xxx', productName: 'Taco', requested: 5, available: 2 }
  ]
}
```

### 4.4 Cómo Corroborar

#### Caso Éxito
1. Login como cliente
2. Agregar productos al carrito
3. Ir a `/checkout`, seleccionar dirección
4. Confirmar pedido
5. Verificar en Prisma Studio:
   - Tabla `Order`: nueva orden con status CREADA
   - Tabla `OrderItem`: items con `options` JSON y precios congelados
   - Tabla `Ingredient`: stock decrementado

#### Caso Error (Stock Insuficiente)
1. En Prisma Studio, reducir stock de un ingrediente a 0
2. Intentar comprar producto que lo use
3. **Resultado:** Error 409 con lista de `stockErrors`

---

## 5. UX y Flujo Completo

### 5.1 Rutas del Flujo de Compra

```
┌─────────┐    ┌───────────┐    ┌───────────────┐    ┌───────────┐
│ /login  │───▶│ /productos│───▶│/productos/[id]│───▶│ Carrito   │
└─────────┘    └───────────┘    └───────────────┘    └─────┬─────┘
                                                           │
     ┌─────────┐    ┌────────┐    ┌──────────┐            │
     │ /perfil │◀───│/cocina │◀───│/checkout │◀───────────┘
     └─────────┘    └────────┘    └──────────┘
```

### 5.2 Estados de Red en Componentes

| Componente | Estado | Implementación |
|------------|--------|----------------|
| Login | `loading`, `error` | useState + try/catch |
| Productos | `loading` | useState + useEffect |
| Checkout | `loading`, `error`, `stockErrors`, `orderSuccess` | useState múltiples |
| Direcciones | `loading`, `formLoading`, `error` | useState + Server Actions |

**Ejemplo en Checkout:**
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [stockErrors, setStockErrors] = useState([]);
const [orderSuccess, setOrderSuccess] = useState(null);
```

### 5.3 Estilo y Paleta de Colores

**Archivo:** `src/app/globals.css`

```css
:root {
  --background: #FFFFFF;          /* Fondo blanco */
  --background-secondary: #FAFAFA; /* Gris muy claro */
  --foreground: #1A1A1A;          /* Texto negro */
  --accent: #FF5500;              /* Naranja principal */
  --accent-hover: #E64D00;        /* Naranja hover */
  --border: #E5E5E5;              /* Bordes grises */
  --success: #00A67E;             /* Verde éxito */
  --error: #E53935;               /* Rojo error */
}
```

**Características del diseño:**
- ✅ Sin gradientes (fondo plano)
- ✅ Bordes finos (`border-gray-200`)
- ✅ Botones con esquinas redondeadas (`rounded-lg`)
- ✅ Sombras sutiles (`shadow-sm`)
- ✅ Tipografía limpia (Geist Sans)

### 5.4 Componentes Reutilizables

**Archivo:** `src/components/ui/index.tsx`

```tsx
export function Button({ variant, size, children, ...props }) { /* ... */ }
export function Card({ children, className }) { /* ... */ }
export function Badge({ variant, children }) { /* ... */ }
```

**Clases CSS en `globals.css`:**
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- `.card`, `.card-hover`
- `.badge`, `.badge-orange`, `.badge-green`, `.badge-red`
- `.input`

### 5.5 Cómo Corroborar

#### Navegación Completa
1. Iniciar en `/login`
2. Usar credenciales: `cliente@test.com / cliente123`
3. Ver catálogo en `/productos`
4. Click en un producto → `/productos/[id]`
5. Seleccionar opciones, agregar al carrito
6. Abrir drawer del carrito
7. Click "Proceder al Pago" → `/checkout`
8. Seleccionar dirección y método de pago
9. Confirmar → Pantalla de éxito
10. Ir a `/perfil` → Ver historial

#### Persistencia del Carrito
1. Agregar productos al carrito
2. Refrescar la página (F5)
3. **Resultado:** Carrito mantiene los items
4. Cerrar y reabrir navegador
5. **Resultado:** Carrito persiste (localStorage)

---

## 6. Documentación (Swagger/OpenAPI)

### 6.1 Ubicación

**Archivo:** `openapi.yaml` (raíz del proyecto)

### 6.2 Endpoints Documentados

| Tag | Endpoint | Método | Descripción |
|-----|----------|--------|-------------|
| Auth | `/auth/register` | POST | Registro de usuario |
| Auth | `/auth/login` | POST | Login con JWT |
| Categories | `/categories` | GET | Listar categorías |
| Categories | `/categories/{id}` | GET | Detalle de categoría |
| Products | `/products` | GET | Listar productos con filtros |
| Products | `/products/{id}` | GET | Detalle de producto con opciones |

### 6.3 Schemas Definidos

- `RegisterRequest`, `LoginRequest`, `AuthResponse`
- `User`, `Category`, `Product`, `ProductDetail`
- `OptionGroup`, `Option`, `Recipe`, `Ingredient`
- `PaginationMeta`, `ErrorResponse`

### 6.4 Cómo Corroborar

#### Validar coherencia
1. Abrir `openapi.yaml`
2. Comparar con los endpoints en `src/app/api/`
3. Verificar que los schemas coincidan con Prisma

#### Visualizar con Swagger Editor
1. Ir a https://editor.swagger.io
2. Copiar contenido de `openapi.yaml`
3. Pegar en el editor
4. Navegar la documentación interactiva

---

## 7. Errores y Logs

### 7.1 Estructura de Respuestas de Error

**Archivo:** `src/lib/api-response.ts`

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 7.2 Códigos de Error por Tipo

| Código | Tipo | Mensaje Ejemplo |
|--------|------|-----------------|
| 400 | Bad Request | "Datos inválidos" |
| 401 | Unauthorized | "Token de autenticación requerido" |
| 403 | Forbidden | "No tienes permisos para realizar esta acción" |
| 404 | Not Found | "Producto no encontrado" |
| 409 | Conflict | "Stock insuficiente para algunos productos" |
| 500 | Internal Error | "Error interno del servidor" |

### 7.3 Logging

**Ubicación:** `console.error` en catch blocks

**Ejemplo en `order.ts`:**
```typescript
} catch (error) {
  console.error('Error al crear pedido:', error);
  return { success: false, error: 'Error al procesar el pedido...' };
}
```

**Logs registrados:**
- Errores de base de datos
- Errores de validación
- Errores de autenticación

### 7.4 Cómo Corroborar

#### Forzar errores
1. **Login inválido:** Email incorrecto → `401 Credenciales inválidas`
2. **Stock insuficiente:** Reducir stock → `409 Stock insuficiente`
3. **Sin token:** Llamar API protegida → `401 Token requerido`
4. **Rol incorrecto:** Cliente a /admin → Redirección

---

## 8. Checklist por Rúbrica

| # | Criterio | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | **Modelo de datos completo** | ✅ Sí | `prisma/schema.prisma`: 14 modelos, enums, relaciones M:N |
| 2 | **Migraciones aplicadas** | ✅ Sí | `prisma/migrations/`: 2 migraciones |
| 3 | **Seed con datos de prueba** | ✅ Sí | `prisma/seed.ts`: usuarios, productos, ingredientes, recetas |
| 4 | **Autenticación JWT** | ✅ Sí | `src/lib/auth.ts`: generateToken, verifyToken |
| 5 | **Roles y autorización** | ✅ Sí | `src/middleware/auth.ts`: authorizeRole |
| 6 | **Validación con Zod** | ✅ Sí | Schemas en `actions/order.ts`, `actions/address.ts` |
| 7 | **Respuestas API estandarizadas** | ✅ Sí | `src/lib/api-response.ts` |
| 8 | **Carrito persistente** | ✅ Sí | `src/store/cart.ts`: Zustand + localStorage |
| 9 | **Checkout transaccional** | ✅ Sí | `actions/order.ts`: prisma.$transaction |
| 10 | **Validación de stock** | ✅ Sí | Cálculo de ingredientes, error 409 |
| 11 | **Snapshots en Order** | ✅ Sí | `deliveryAddress`, `productPrice`, `options` |
| 12 | **KDS Cocina** | ✅ Sí | `/cocina`: estados PAGADA → EN_PREPARACION → LISTA |
| 13 | **Admin Inventario** | ✅ Sí | `/admin/inventario`: visualizar, reabastecer |
| 14 | **Historial de estados** | ✅ Sí | Modelo `OrderHistory` |
| 15 | **OpenAPI/Swagger** | ✅ Sí | `openapi.yaml` |
| 16 | **Tema visual coherente** | ✅ Sí | `globals.css`: blanco + naranja |
| 17 | **Build exitoso** | ✅ Sí | `npm run build`: 16 rutas compiladas |

---

## 9. Anexo: Pasos y Capturas Sugeridas

### 9.1 Pasos para Demo en Clase

#### Paso 1: Mostrar Token en localStorage
1. Abrir http://localhost:3000/login
2. Login con `admin@antojitos.com / admin123`
3. Abrir DevTools (F12) → Application → Local Storage
4. Buscar clave `token`
5. Copiar valor y decodificar en https://jwt.io
6. **Captura:** `docs/evidence/01-token-localstorage.png`

#### Paso 2: Probar Endpoint Protegido
```bash
# Sin token
curl http://localhost:3000/api/products -X POST
# Con token
curl http://localhost:3000/api/products -X POST \
  -H "Authorization: Bearer <TOKEN>"
```
**Captura:** `docs/evidence/02-api-auth.png`

#### Paso 3: Agregar Producto con Opciones
1. Navegar a `/productos`
2. Click en "Taco al Pastor"
3. Seleccionar "Tortilla de Maíz" + "Salsa Verde"
4. Agregar al carrito
5. Abrir DevTools → Application → Local Storage → `antojitos-cart`
6. **Captura:** `docs/evidence/03-cart-options.png`

#### Paso 4: Ejecutar Checkout y Ver Stock
1. Abrir Prisma Studio: `npx prisma studio`
2. Ver tabla `Ingredient`, anotar stock de "Carne al Pastor"
3. Hacer checkout con Taco al Pastor (qty: 2)
4. Refrescar Prisma Studio
5. Verificar que stock decrementó
6. **Captura:** `docs/evidence/04-stock-before.png`, `04-stock-after.png`

#### Paso 5: Ver OrderItem con Snapshots
1. En Prisma Studio, ir a tabla `OrderItem`
2. Buscar el pedido recién creado
3. Ver campos: `productName`, `productPrice`, `options` (JSON)
4. **Captura:** `docs/evidence/05-orderitem-snapshot.png`

#### Paso 6: Cambiar Estado en KDS
1. Navegar a `/cocina` (como ADMIN o COCINA)
2. Ver orden en columna "Pendientes"
3. Click "Iniciar Preparación"
4. Ver orden moverse a "En Preparación"
5. En Prisma Studio, ver tabla `OrderHistory`
6. **Captura:** `docs/evidence/06-kds-states.png`

#### Paso 7: Ver OpenAPI
1. Abrir `openapi.yaml` en VS Code
2. Navegar por paths y schemas
3. Opcional: Copiar a https://editor.swagger.io
4. **Captura:** `docs/evidence/07-openapi.png`

### 9.2 Estructura de Carpeta de Evidencias

```
docs/
└── evidence/
    ├── 01-token-localstorage.png
    ├── 02-api-auth.png
    ├── 03-cart-options.png
    ├── 04-stock-before.png
    ├── 04-stock-after.png
    ├── 05-orderitem-snapshot.png
    ├── 06-kds-states.png
    └── 07-openapi.png
```

---

## 10. Credenciales de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | `admin@antojitos.com` | `admin123` | ADMIN |
| Cliente | `cliente@test.com` | `cliente123` | CLIENTE |
| Cocina | `cocina@antojitos.com` | `cocina123` | COCINA |

---

## 11. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Cargar seed
npx prisma db seed

# Iniciar desarrollo
npm run dev

# Build producción
npm run build

# Prisma Studio
npx prisma studio
```

---

**Fin del Reporte de Funcionamiento**
