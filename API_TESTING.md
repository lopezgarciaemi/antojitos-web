# 📡 Guía de Pruebas de API - Los Antojitos de Misha

Esta guía te muestra cómo probar todos los endpoints de la API.

## 🔧 Herramientas Recomendadas

- **Thunder Client** (extensión de VS Code) - Recomendado
- **Postman**
- **curl** (línea de comandos)

## 🔐 1. Autenticación

### Registrar Usuario Nuevo

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Usuario de Prueba",
  "phone": "5512345678",
  "password": "password123"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123...",
      "email": "test@example.com",
      "name": "Usuario de Prueba",
      "phone": "5512345678",
      "role": "CLIENTE",
      "createdAt": "2025-11-05T..."
    },
    "token": "eyJhbGc..."
  }
}
```

### Login (Obtener Token)

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@antojitos.com",
  "password": "admin123"
}
```

**Guarda el token que recibes en la respuesta.** Lo necesitarás para rutas protegidas.

## 📁 2. Categorías

### Listar Todas las Categorías

```http
GET http://localhost:3000/api/categories
```

### Ver Una Categoría con sus Productos

```http
GET http://localhost:3000/api/categories/{id}
```

Reemplaza `{id}` con un ID real de la BD.

### Crear Nueva Categoría (requiere ADMIN)

```http
POST http://localhost:3000/api/categories
Authorization: Bearer {TU_TOKEN_AQUI}
Content-Type: application/json

{
  "name": "Postres",
  "description": "Postres caseros tradicionales",
  "order": 6,
  "isActive": true
}
```

### Actualizar Categoría (requiere ADMIN)

```http
PUT http://localhost:3000/api/categories/{id}
Authorization: Bearer {TU_TOKEN_AQUI}
Content-Type: application/json

{
  "name": "Postres Mexicanos",
  "description": "Los mejores postres tradicionales"
}
```

### Eliminar Categoría (requiere ADMIN)

```http
DELETE http://localhost:3000/api/categories/{id}
Authorization: Bearer {TU_TOKEN_AQUI}
```

**Nota:** No se puede eliminar si tiene productos asociados.

## 🌮 3. Productos

### Listar Todos los Productos

```http
GET http://localhost:3000/api/products
```

### Filtrar por Categoría

```http
GET http://localhost:3000/api/products?categoryId={categoryId}
```

### Buscar Productos

```http
GET http://localhost:3000/api/products?search=taco
```

### Ver Producto con Opciones y Recetas

```http
GET http://localhost:3000/api/products/{id}
```

### Crear Nuevo Producto (requiere ADMIN)

```http
POST http://localhost:3000/api/products
Authorization: Bearer {TU_TOKEN_AQUI}
Content-Type: application/json

{
  "name": "Taco de Cochinita",
  "description": "Taco de cochinita pibil estilo Yucatán",
  "basePrice": 20,
  "imageUrl": "https://example.com/cochinita.jpg",
  "categoryId": "{id_categoria_tacos}",
  "isActive": true,
  "isAvailable": true
}
```

### Actualizar Producto (requiere ADMIN)

```http
PUT http://localhost:3000/api/products/{id}
Authorization: Bearer {TU_TOKEN_AQUI}
Content-Type: application/json

{
  "basePrice": 22,
  "isAvailable": false
}
```

### Eliminar Producto (requiere ADMIN)

```http
DELETE http://localhost:3000/api/products/{id}
Authorization: Bearer {TU_TOKEN_AQUI}
```

**Nota:** No se puede eliminar si está en órdenes. Mejor márquelo como inactivo.

## 🧪 Casos de Prueba Recomendados

### 1. Flujo de Registro y Login

1. Registra un usuario nuevo
2. Haz login con las credenciales
3. Guarda el token
4. Usa el token para crear una categoría (debería fallar - no es ADMIN)
5. Haz login como admin
6. Crea una categoría (debería funcionar)

### 2. CRUD Completo de Categoría

1. Login como admin
2. Crear categoría "Postres"
3. Listar categorías (verificar que aparece)
4. Actualizar nombre a "Postres Mexicanos"
5. Intentar eliminar (funciona si no tiene productos)

### 3. CRUD Completo de Producto

1. Login como admin
2. Listar categorías para obtener un ID
3. Crear producto en esa categoría
4. Listar productos de la categoría
5. Ver detalle del producto
6. Actualizar precio del producto
7. Marcar como no disponible

### 4. Validaciones y Errores

1. Intentar registrar con email duplicado (error 409)
2. Login con contraseña incorrecta (error 401)
3. Crear producto sin token (error 401)
4. Crear producto con token de cliente (error 403)
5. Crear producto con precio negativo (error 400)
6. Buscar producto que no existe (error 404)

## 📝 Notas Importantes

### Headers Requeridos

Para rutas que requieren autenticación:
```
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json
```

### Códigos de Respuesta

- `200` - OK (operación exitosa)
- `201` - Created (recurso creado)
- `400` - Bad Request (validación falló)
- `401` - Unauthorized (no autenticado o token inválido)
- `403` - Forbidden (no tiene permisos)
- `404` - Not Found (recurso no existe)
- `409` - Conflict (duplicado o violación de regla de negocio)
- `500` - Internal Server Error (error del servidor)

### Estructura de Respuesta

Todas las respuestas siguen este formato:

**Éxito:**
```json
{
  "success": true,
  "data": { /* datos */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

## 🔍 Debugging

Si algo no funciona:

1. Verifica que el servidor esté corriendo: `npm run dev`
2. Revisa la consola del servidor para ver errores
3. Verifica que el token no haya expirado
4. Asegúrate de incluir el header `Content-Type: application/json`
5. Revisa los logs de la terminal

## 🎯 Próximos Endpoints (Fase 2-4)

Estos endpoints aún no están implementados:

- `GET /api/cart` - Ver carrito del usuario
- `POST /api/cart/items` - Agregar item al carrito
- `PUT /api/cart/items/:id` - Actualizar cantidad
- `DELETE /api/cart/items/:id` - Quitar del carrito
- `POST /api/orders` - Crear orden
- `GET /api/orders` - Ver mis órdenes
- `GET /api/orders/:id` - Ver detalle de orden
- `PUT /api/orders/:id/status` - Cambiar estado (cocina/admin)
- `GET /api/ingredients` - Listar ingredientes
- `POST /api/ingredients` - Crear ingrediente
- `GET /api/products/:id/recipe` - Ver receta del producto
- `POST /api/products/:id/recipe` - Agregar ingrediente a receta
- Y más...

---

¿Encontraste algún bug o tienes preguntas? Revisa el README.md principal.
