# Endpoints · Estado actual

Este documento refleja lo que **ya está implementado y corriendo** en el código, no el diseño objetivo. Para la API objetivo del comensal ver [comensales.md](comensales.md); para la del dueño/personal ver [restaurant.md](restaurant.md) — ambos son specs a futuro, bastante más grandes que lo que hay hoy.

Swagger interactivo en `/docs`.

## Convenciones actuales

- Sin prefijo global: el CRUD interno (IAM / organizations / attention) vive en la raíz (`/roles`, `/orders`, etc). Los endpoints de auth de personal viven en `/api/v1/owner`, y los de comensal en `/api/v1/customer` + rutas públicas (`/api/v1/orders`, `/api/v1/tables`, `/api/v1/restaurants/:slug/cart/validate`).
- Respuesta estándar: `{ "success", "statusCode", "message", "data", "timestamp", "path" }` (interceptor global).
- Errores: `{ "success": false, "statusCode", "message", "data": null, ... }` con `400` (datos inválidos / invariante de dominio), `401` (credenciales o token inválido), `403` (sin acceso al recurso), `404`, `409` (conflicto / duplicado), `422` (regla de negocio), `500`.
- Todos los `:id` que son UUID usan `ParseUUIDPipe` (UUID inválido → 400, no 500).
- **El CRUD interno de IAM/organizations/attention sigue sin autenticación** (acceso libre). Personal y comensal sí tienen JWT real, cada uno con secretos y tokens propios — un JWT de comensal no sirve en `/api/v1/owner/*` y viceversa.
- No hay paginación (`?page=&limit=`) en ningún endpoint todavía, todos los `findAll` devuelven el listado completo.

---

## Personal / staff — auth (`/api/v1/owner`)

JWT propio del personal (access 15 min, refresh 30 días con rotación de un solo uso), separado del de comensal.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/owner/auth/login` | público | Login con email y contraseña (usuarios creados vía `POST /users`) |
| POST | `/api/v1/owner/auth/refresh` | público | Rota el refresh token y emite un par nuevo |
| POST | `/api/v1/owner/auth/logout` | personal | Invalida el refresh token enviado |
| POST | `/api/v1/owner/auth/forgot-password` | público | Genera un token de reseteo (se loguea en consola; no hay envío de correo real) |
| POST | `/api/v1/owner/auth/reset-password` | público | Cambia la contraseña con el token |
| GET | `/api/v1/owner/me` | personal | Usuario autenticado |
| PATCH | `/api/v1/owner/me` | personal | Edita el nombre (`phone`/`cargo` viven en `Employee`, sin vincular todavía a `User`) |
| PATCH | `/api/v1/owner/me/password` | personal | Cambia la contraseña (pide la actual) |

> No implementado todavía: `POST /auth/register` (alta de dueño con org+sede en un solo paso) y `POST /auth/first-password` (contraseña temporal forzada) — ver sección de pendientes.

---

## Personal / staff — CRUD interno (sin prefijo, sin auth)

### IAM

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users` | Crea un usuario (`name`, `email`, `password`, `roleId`) |
| GET | `/users` | Lista usuarios |
| GET | `/users/:id` | Detalle |
| PATCH | `/users/:id` | Edita nombre/email/password/rol |
| DELETE | `/users/:id` | Elimina |
| POST | `/roles` | Crea un rol (`name`, `description?`) |
| GET | `/roles` | Lista roles |
| GET | `/roles/:id` | Detalle |
| PATCH | `/roles/:id` | Edita |
| DELETE | `/roles/:id` | Elimina |
| POST | `/permissions` | Crea un permiso (`name`, `description?`) |
| GET | `/permissions` | Lista permisos |
| GET | `/permissions/:id` | Detalle |
| PATCH | `/permissions/:id` | Edita |
| DELETE | `/permissions/:id` | Elimina |
| POST | `/role-permissions` | Asigna un permiso a un rol (`roleId`, `permissionId`) |
| GET | `/role-permissions` | Lista asignaciones |
| GET | `/role-permissions/:id` | Detalle |
| DELETE | `/role-permissions/:id` | Revoca |

### Organizations

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/organizations` | Crea una organización (`name`, `email?`, `phone?`) |
| GET | `/organizations` | Lista |
| GET | `/organizations/:id` | Detalle |
| PATCH | `/organizations/:id` | Edita |
| DELETE | `/organizations/:id` | Elimina |
| POST | `/restaurants` | Crea un restaurante (`name`, `slug?` autogenerado, `address?`, `phone?`, `organizationId`) |
| GET | `/restaurants` | Lista |
| GET | `/restaurants/:id` | Detalle |
| PATCH | `/restaurants/:id` | Edita |
| DELETE | `/restaurants/:id` | Elimina |
| POST | `/dining-tables` | Crea una mesa (`tableNumber`, `capacity`, `restaurantId`) |
| GET | `/dining-tables` | Lista |
| GET | `/dining-tables/:id` | Detalle |
| PATCH | `/dining-tables/:id` | Edita (incluye `status`) |
| DELETE | `/dining-tables/:id` | Elimina |
| POST | `/table-qr-codes` | Crea el QR de una mesa (`codeUrl`, `diningTableId`) — 1 QR por mesa |
| GET | `/table-qr-codes` | Lista |
| GET | `/table-qr-codes/:id` | Detalle |
| PATCH | `/table-qr-codes/:id` | Edita |
| DELETE | `/table-qr-codes/:id` | Elimina |
| POST | `/menus` | Crea un menú (`name`, `description?`, `active?`, `restaurantId`) |
| GET | `/menus` | Lista |
| GET | `/menus/:id` | Detalle |
| PATCH | `/menus/:id` | Edita |
| DELETE | `/menus/:id` | Elimina |
| POST | `/categories` | Crea una categoría (`name`, `description?`, `menuId`) |
| GET | `/categories` | Lista |
| GET | `/categories/:id` | Detalle |
| PATCH | `/categories/:id` | Edita |
| DELETE | `/categories/:id` | Elimina |
| POST | `/products` | Crea un producto (`name`, `description?`, `price`, `available?`, `categoryId`) |
| GET | `/products` | Lista |
| GET | `/products/:id` | Detalle |
| PATCH | `/products/:id` | Edita (incluye `available`) |
| DELETE | `/products/:id` | Elimina |
| POST | `/employees` | Crea un empleado |
| GET | `/employees` | Lista |
| GET | `/employees/:id` | Detalle |
| PATCH | `/employees/:id` | Edita |
| DELETE | `/employees/:id` | Elimina |
| POST | `/kitchen-supplies` | Crea un insumo de cocina |
| GET | `/kitchen-supplies` | Lista |
| GET | `/kitchen-supplies/:id` | Detalle |
| PATCH | `/kitchen-supplies/:id` | Edita |
| DELETE | `/kitchen-supplies/:id` | Elimina |

### Attention

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/orders` | Crea un pedido (`diningTableId`, `status?`) — asume dine-in |
| GET | `/orders` | Lista |
| GET | `/orders/:id` | Detalle |
| PATCH | `/orders/:id` | Cambia mesa o estado (transiciones validadas: `open→in_progress/cancelled`, `in_progress→served/cancelled`, `served→paid/cancelled`) |
| DELETE | `/orders/:id` | Elimina |
| POST | `/order-items` | Agrega un ítem (`orderId`, `productId`, `quantity`, `userId?`, `notes?`) — recalcula el total del pedido |
| GET | `/order-items` | Lista |
| GET | `/order-items/:id` | Detalle |
| PATCH | `/order-items/:id` | Edita cantidad/notas |
| DELETE | `/order-items/:id` | Elimina — recalcula el total |
| POST | `/order-status-history` | Registra un cambio de estado (`orderId`, `status`, `notes?`) — actualiza el pedido en la misma transacción |
| GET | `/order-status-history` | Lista |
| GET | `/order-status-history/:id` | Detalle |
| DELETE | `/order-status-history/:id` | Elimina |

---

## Comensal (`/api/v1`, público)

### Auth

JWT propio del comensal (distinto al de personal, que todavía no existe). Access token 15 min, refresh token 30 días con rotación (uno de un solo uso).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/customer/auth/register` | público | Crea la cuenta (`name`, `email`, `password`, `marketingOptIn?`) y devuelve tokens |
| POST | `/api/v1/customer/auth/login` | público | Login con email y contraseña |
| POST | `/api/v1/customer/auth/refresh` | público | Rota el refresh token y emite un par nuevo |
| POST | `/api/v1/customer/auth/logout` | comensal | Invalida el refresh token enviado |
| POST | `/api/v1/customer/auth/forgot-password` | público | Genera un token de reseteo (se loguea en consola; no hay envío de correo real todavía) |
| POST | `/api/v1/customer/auth/reset-password` | público | Cambia la contraseña con el token |
| GET | `/api/v1/customer/me` | comensal | Perfil del comensal |

### Mesas / QR

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/tables/qr/:token` | público | Resuelve el QR: restaurante, mesa y la cuenta abierta si existe (`404` si el token no existe) |

### Carrito

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/restaurants/:slug/cart/validate` | público | Valida disponibilidad, pertenencia al restaurante y precio de cada ítem. Devuelve `{ valid, issues[], total }` |

### Pedidos

Auth **opcional**: con `Authorization: Bearer <access token>` el pedido queda asociado al comensal; sin login, la respuesta de creación incluye un `guestToken` que debe reenviarse en el header `X-Guest-Token` para operar sobre ese pedido después. El acceso a un pedido se valida por coincidencia de `customerId` o de `guestToken` (si ninguno coincide: `403`).

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/orders` | Crea el pedido con su primera ronda. `dine_in` requiere `tableToken` (si la mesa ya tiene cuenta abierta, los ítems se agregan como nueva ronda en vez de crear un pedido nuevo). `delivery` requiere `deliveryAddress` (texto libre). `pickup` no requiere ninguno |
| POST | `/api/v1/orders/:id/rounds` | Agrega otra ronda de ítems a una cuenta abierta |
| DELETE | `/api/v1/orders/:id/items/:itemId` | Cancela un ítem propio (solo mientras el pedido sigue `open`) |
| GET | `/api/v1/orders/:id` | Detalle con sus ítems (incluye `roundNumber` de cada uno) |
| GET | `/api/v1/orders/:id/bill` | Resumen para pagar: ítems, subtotal, descuentos (siempre 0, no hay pagos), total, pagado (siempre 0), saldo |
| POST | `/api/v1/orders/:id/request-bill` | Marca que se pidió la cuenta (`billRequestedAt`) |

---

## Deliberadamente no implementado todavía

**Del lado comensal:**
- Descubrimiento de restaurantes (`GET /restaurants` público con filtros, geolocalización, "abierto ahora"), carta pública con tags/alérgenos/imágenes, búsqueda de productos.
- Perfil editable del comensal (`PATCH /customer/me`) y direcciones guardadas (`/customer/me/addresses`).
- Historial de pedidos del comensal y reorder (`/customer/me/orders`).

**Del lado personal (`restaurant.md`), más allá de login/me:**
- `POST /auth/register` (alta de dueño con organización+sede en un solo paso) y `POST /auth/first-password` (contraseña temporal forzada).
- El CRUD interno (`/users`, `/roles`, `/products`, etc.) sigue sin guard — cualquiera puede llamarlo hoy.
- Todo lo de organización/sedes con scoping por sesión, sala/mesas con áreas y rotación de QR, carta con workflow de publicación, tablero de pedidos por sede, estado por ítem para cocina, cuentas/pagos, gastos, inventario con movimientos, métricas/cierre/finanzas — ver el detalle sección por sección en la comparación que hicimos contra `restaurant.md`.

**Transversal:**
- Eventos en tiempo real (SSE) y timeline de estados.
- `Idempotency-Key` (se documenta en los specs pero no se procesa todavía).
- Estado por ítem (pendiente/preparando/listo/servido) — solo existe el estado del pedido completo.
- Pagos — explícitamente fuera de alcance hasta que se defina.
- Envío real de correo para reset de contraseña (hoy es un adaptador placeholder que loguea el token, compartido entre personal y comensal).
