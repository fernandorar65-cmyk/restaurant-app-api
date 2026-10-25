# Endpoints · Restaurante

API que consume el panel del dueño y del personal (`/owner/*`): sedes, mesas, carta, pedidos, cobros, insumos, gastos, cierre, finanzas y administración.

Tablas de referencia: [diseno-tablas.md](diseno-tablas.md). Endpoints del comensal: [endpoints-comensal.md](endpoints-comensal.md).

## Convenciones

- Base: `/api/v1/owner`.
- Autenticación: JWT del **personal** (`Authorization: Bearer <token>`). Es un token distinto al del comensal.
- Columna **Permiso**: el permiso del rol que exige el endpoint. Son los mismos que ya usa el front en [permissions.ts](../src/modules/auth/permissions.ts):

| Permiso | Alcance |
|---|---|
| `org.manage` | Organización y sedes |
| `users.manage` | Usuarios y roles |
| `staff.manage` | Empleados |
| `sites.manage` | Sala, mesas y QR |
| `orders.manage` | Gestión de pedidos y pedido manual |
| `kitchen.manage` | Cola de cocina |
| `menu.manage` | Menú y productos |
| `payments.manage` | Cuentas y cobros |
| `expenses.manage` | Gastos de la sede (nuevo; hoy usa `payments.manage`) |
| `inventory.manage` | Inventario |
| `reports.view` | Métricas, cierre del día y finanzas |

- `sesión` = cualquier usuario autenticado.
- **Alcance por sede**: toda ruta con `:restaurantId` valida que la sede sea de la organización del usuario y que el usuario tenga acceso a ella. Si no, responde `403 SITE_FORBIDDEN`.
- Errores: `{ "code": "…", "message": "…" }` con `400`, `401`, `403`, `404`, `409` (conflicto de estado) y `422` (regla de negocio).
- Listados paginados: `?page=1&limit=20` → `{ "data": [], "meta": { "page", "limit", "total" } }`.
- Las acciones sensibles a doble envío (crear pedido, enviar ronda, registrar pago) aceptan el header `Idempotency-Key`.

---

## 1. Acceso

Rutas del front: `/owner/auth/login`, `/owner/auth/register`, `/owner/cuenta`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | público | Registro del dueño: crea el usuario, la organización y la primera sede |
| POST | `/auth/login` | público | Login del dueño y del personal |
| POST | `/auth/refresh` | público | Renueva el access token |
| POST | `/auth/logout` | sesión | Invalida el refresh token |
| POST | `/auth/forgot-password` | público | Envía un correo para restablecer la contraseña |
| POST | `/auth/reset-password` | público | Restablece la contraseña con el token del correo |
| POST | `/auth/first-password` | sesión | Cambio obligatorio de la contraseña temporal en el primer ingreso |
| GET | `/me` | sesión | Usuario, rol, permisos, sedes con acceso y `mustChangePassword` |
| PATCH | `/me` | sesión | Actualiza nombre, teléfono y cargo |
| PATCH | `/me/password` | sesión | Cambia la contraseña (pide la actual) |

`POST /auth/register`
```json
{
  "owner": { "name": "Luis Pérez", "email": "luis@mail.com", "password": "********", "phone": "999888777" },
  "organization": { "name": "Grupo San Telmo", "taxId": "20123456789" },
  "restaurant": { "name": "Bodega San Telmo", "address": "…", "city": "Lima", "cuisine": "Criolla" }
}
```

`GET /me`
```json
{
  "user": { "id": "…", "name": "Luis Pérez", "email": "luis@mail.com" },
  "role": { "id": "…", "code": "owner", "name": "Dueño" },
  "permissions": ["org.manage", "users.manage", "…"],
  "organization": { "id": "…", "name": "Grupo San Telmo" },
  "restaurants": [{ "id": "…", "slug": "bodega-san-telmo-grand-cru", "name": "…" }],
  "mustChangePassword": false
}
```

---

## 2. Organización y sedes

Rutas del front: `/owner/dashboard`, `/owner/admin/restaurantes`, `/owner/admin/configuracion`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/organization` | sesión | Datos de la organización del usuario |
| PATCH | `/organization` | `org.manage` | Edita nombre, RUC y código |
| GET | `/restaurants` | sesión | Sedes a las que el usuario tiene acceso, con KPIs del día (directorio) |
| POST | `/restaurants` | `org.manage` | Crea una sede |
| GET | `/restaurants/:restaurantId` | sesión | Detalle de la sede |
| PATCH | `/restaurants/:restaurantId` | `org.manage` | Edita datos, imagen, moneda, zona horaria y estado |
| PATCH | `/restaurants/:restaurantId/fulfillment` | `org.manage` | Configura las modalidades: en mesa, recojo, delivery |
| GET | `/restaurants/:restaurantId/payment-methods` | `org.manage` | Métodos de pago aceptados y sus datos (Yape, Plin, cuenta) |
| PUT | `/restaurants/:restaurantId/payment-methods` | `org.manage` | Guarda los métodos de pago de la sede |
| DELETE | `/restaurants/:restaurantId` | `org.manage` | Cierra la sede (soft delete). `409` si tiene cuentas abiertas |

> `payment-methods` necesita una tabla nueva (`restaurant_payment_methods`) que aún no está en [diseno-tablas.md](diseno-tablas.md).

---

## 3. Sala, mesas y QR

Ruta del front: `/owner/sede/:slug` (gestión de mesas).

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/floor` | `sites.manage` | Áreas y mesas con su estado y la cuenta abierta de cada una (vista en vivo) |
| GET | `/restaurants/:restaurantId/areas` | `sites.manage` | Lista las áreas o pisos |
| POST | `/restaurants/:restaurantId/areas` | `sites.manage` | Crea un área |
| PATCH | `/restaurants/:restaurantId/areas/:areaId` | `sites.manage` | Renombra o reordena un área |
| DELETE | `/restaurants/:restaurantId/areas/:areaId` | `sites.manage` | Elimina un área (sus mesas quedan sin área) |
| POST | `/restaurants/:restaurantId/tables` | `sites.manage` | Crea una mesa |
| PATCH | `/restaurants/:restaurantId/tables/:tableId` | `sites.manage` | Edita número, capacidad o área |
| PATCH | `/restaurants/:restaurantId/tables/:tableId/status` | `sites.manage` | Cambia el estado: libre, reservada, limpieza, deshabilitada |
| DELETE | `/restaurants/:restaurantId/tables/:tableId` | `sites.manage` | Elimina una mesa. `409` si tiene una cuenta abierta |
| GET | `/restaurants/:restaurantId/tables/:tableId/qr` | `sites.manage` | QR activo de la mesa (token y URL, o imagen PNG/SVG con `?format=png`) |
| POST | `/restaurants/:restaurantId/tables/:tableId/qr/rotate` | `sites.manage` | Revoca el QR actual y genera uno nuevo |
| GET | `/restaurants/:restaurantId/tables/qr/print` | `sites.manage` | PDF con los QR de todas las mesas para imprimir |

---

## 4. Carta

Ruta del front: `/owner/sede/:slug/menu`.

### Menús

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/menus` | `menu.manage` | Lista los menús de la sede |
| POST | `/restaurants/:restaurantId/menus` | `menu.manage` | Crea un menú en borrador |
| PATCH | `/menus/:menuId` | `menu.manage` | Renombra un menú |
| PATCH | `/menus/:menuId/status` | `menu.manage` | Publica, pasa a borrador o archiva. Publicar uno archiva el anterior |
| DELETE | `/menus/:menuId` | `menu.manage` | Elimina un menú en borrador |

### Categorías

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/menus/:menuId/categories` | `menu.manage` | Categorías ordenadas |
| POST | `/menus/:menuId/categories` | `menu.manage` | Crea una categoría |
| PATCH | `/categories/:categoryId` | `menu.manage` | Edita nombre y descripción |
| PUT | `/menus/:menuId/categories/order` | `menu.manage` | Reordena: `{ "ids": ["…", "…"] }` |
| DELETE | `/categories/:categoryId` | `menu.manage` | Elimina una categoría. `409` si tiene productos (o `?moveTo=<categoryId>`) |

### Productos

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/products` | `menu.manage` | Productos de la sede (`?categoryId=`, `?q=`, `?isActive=`) |
| POST | `/categories/:categoryId/products` | `menu.manage` | Crea un producto |
| GET | `/products/:productId` | `menu.manage` | Detalle con alérgenos y receta |
| PATCH | `/products/:productId` | `menu.manage` | Edita un producto |
| PATCH | `/products/:productId/availability` | `menu.manage` `orders.manage` | Marca como agotado o disponible (lo usa también el salón) |
| PUT | `/categories/:categoryId/products/order` | `menu.manage` | Reordena los productos de una categoría |
| POST | `/products/:productId/image` | `menu.manage` | Sube la imagen (multipart). Reemplaza el data URL que usa hoy el front |
| DELETE | `/products/:productId` | `menu.manage` | Elimina un producto (soft delete) |
| GET | `/allergens` | sesión | Catálogo de alérgenos `[F2]` |
| PUT | `/products/:productId/recipe` | `menu.manage` | Guarda la receta: `[{ "supplyId", "quantity" }]` `[F2]` |

---

## 5. Pedidos

Rutas del front: `/owner/sede/:slug/pedidos`, `/owner/sede/:slug/pedidos/:attentionId`, `/owner/sede/:slug/cocina`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/orders` | `orders.manage` | Tablero y lista de cuentas con sus platos |
| GET | `/orders/:orderId` | `orders.manage` | Detalle con rondas, platos, pagos y descuentos |
| GET | `/orders/:orderId/timeline` | `orders.manage` | Historial de estados de la cuenta y sus platos |
| POST | `/restaurants/:restaurantId/orders` | `orders.manage` | Pedido manual del mozo (abre la mesa o crea recojo / delivery) |
| POST | `/orders/:orderId/rounds` | `orders.manage` | Agrega una ronda a una cuenta abierta |
| PATCH | `/orders/:orderId` | `orders.manage` | Edita comensales, nombre o cambia de mesa |
| POST | `/orders/:orderId/request-bill` | `orders.manage` | Marca que la mesa pidió la cuenta |
| POST | `/orders/:orderId/close` | `payments.manage` | Cierra la cuenta. `422 BALANCE_PENDING` si hay saldo |
| POST | `/orders/:orderId/reopen` | `payments.manage` | Reabre una cuenta cerrada por error |
| POST | `/orders/:orderId/cancel` | `orders.manage` | Anula la cuenta con motivo: `{ "reason": "…" }` |
| PATCH | `/order-items/:itemId/status` | `orders.manage` `kitchen.manage` | Cambia el estado de un plato |
| PATCH | `/order-items/status` | `orders.manage` `kitchen.manage` | Cambio masivo: `{ "itemIds": [], "status": "ready" }`. Devuelve los que fallaron |
| PATCH | `/order-items/:itemId` | `orders.manage` | Edita cantidad o notas mientras está en `pending` |
| GET | `/restaurants/:restaurantId/kitchen/queue` | `kitchen.manage` | Cola de cocina: platos `accepted` y `preparing` por ronda `[F2]` |
| GET | `/restaurants/:restaurantId/events` | sesión | Stream SSE de la sede: pedidos nuevos, cambios de estado, cuentas pedidas y pagos |

Filtros de `GET /restaurants/:restaurantId/orders`: `status`, `fulfillmentType`, `tableId`, `from`, `to`, `q` (código o nombre).

`PATCH /order-items/:itemId/status`
```json
{ "status": "rejected", "reason": "Sin stock de pescado", "expectedStatus": "pending" }
```
- `expectedStatus` evita pisar un cambio hecho por otra persona: si el estado actual es otro, responde `409 STATUS_CONFLICT`.
- Transiciones válidas: `pending → accepted | rejected | cancelled`, `accepted → preparing`, `preparing → ready`, `ready → served`. Cualquier otra responde `422 INVALID_TRANSITION`.
- Cada cambio inserta en `status_history` y emite un evento en el stream.

---

## 6. Cuentas y cobros

Rutas del front: `/owner/sede/:slug/cuentas`, `/owner/sede/:slug/cuentas/:attentionId`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/bills` | `payments.manage` | Cuentas por cobrar y cobradas (`?status=`, `?from=`, `?to=`) |
| GET | `/orders/:orderId/bill` | `payments.manage` | Resumen: ítems, descuentos, pagado y saldo |
| GET | `/orders/:orderId/payments` | `payments.manage` | Pagos de la cuenta |
| POST | `/orders/:orderId/payments` | `payments.manage` | Registra un cobro (efectivo, tarjeta POS, Yape…), total o por platos |
| PATCH | `/payments/:paymentId/status` | `payments.manage` | Confirma, rechaza o reembolsa un pago |
| GET | `/restaurants/:restaurantId/payments` | `payments.manage` | Todos los pagos de la sede (`?method=`, `?status=`, `?from=`, `?to=`) |
| POST | `/orders/:orderId/discounts` | `payments.manage` | Aplica un descuento a la cuenta o a un plato `[F2]` |
| DELETE | `/discounts/:discountId` | `payments.manage` | Quita un descuento `[F2]` |

`POST /orders/:orderId/payments` (header `Idempotency-Key`)
```json
{
  "method": "cash",
  "amount": 80.00,
  "tipAmount": 0,
  "payerName": "Mesa 12",
  "externalReference": null,
  "allocations": [{ "orderItemId": "…", "amount": 56.00 }, { "orderItemId": "…", "amount": 24.00 }]
}
```
- Transiciones de pago: `pending → approved | rejected`, `approved → refunded`.
- Si la suma aprobada cubre el total, la cuenta pasa a `paid` y la mesa queda libre.

---

## 7. Gastos

Ruta del front: `/owner/sede/:slug/cuentas?vista=gastos`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/expenses` | `expenses.manage` | Gastos de la sede (`?from=`, `?to=`, `?categoryId=`, `?kind=`) |
| POST | `/restaurants/:restaurantId/expenses` | `expenses.manage` | Registra un gasto |
| PATCH | `/expenses/:expenseId` | `expenses.manage` | Edita un gasto |
| DELETE | `/expenses/:expenseId` | `expenses.manage` | Elimina un gasto |
| GET | `/expense-categories` | sesión | Categorías con el conteo de gastos de cada una |
| POST | `/expense-categories` | `org.manage` | Crea una categoría |
| PATCH | `/expense-categories/:categoryId` | `org.manage` | Edita una categoría |
| DELETE | `/expense-categories/:categoryId?moveTo=<id>` | `org.manage` | Elimina una categoría y mueve sus gastos a otra |

---

## 8. Insumos e inventario

Rutas del front: `/owner/sede/:slug/insumos`, `/owner/admin/inventario`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/supplies` | `inventory.manage` | Insumos con stock y alerta de mínimo (`?q=`, `?category=`, `?lowStock=true`) |
| POST | `/restaurants/:restaurantId/supplies` | `inventory.manage` | Crea un insumo |
| PATCH | `/supplies/:supplyId` | `inventory.manage` | Edita datos del insumo (no el stock) |
| DELETE | `/supplies/:supplyId` | `inventory.manage` | Desactiva un insumo |
| GET | `/restaurants/:restaurantId/inventory-movements` | `inventory.manage` | Historial (`?supplyId=`, `?type=`, `?from=`, `?to=`) |
| POST | `/supplies/:supplyId/movements` | `inventory.manage` | Entrada, salida o merma. Actualiza el stock en la misma transacción |
| POST | `/restaurants/:restaurantId/inventory-counts` | `inventory.manage` | Conteo físico: varios ajustes a la vez `[{ "supplyId", "countedStock" }]` |
| GET | `/suppliers` | `inventory.manage` | Proveedores de la organización `[F2]` |
| POST | `/suppliers` | `inventory.manage` | Crea un proveedor `[F2]` |
| PATCH | `/suppliers/:supplierId` | `inventory.manage` | Edita un proveedor `[F2]` |

`POST /supplies/:supplyId/movements`
```json
{ "type": "in", "quantity": 5, "unitCost": 32.50, "reason": "Compra semanal", "createExpense": true }
```
- `createExpense: true` registra también el gasto en `expenses` y lo enlaza al movimiento.
- `422 NEGATIVE_STOCK` si una salida deja el stock en negativo.

---

## 9. Métricas, cierre y finanzas

Rutas del front: `/owner/sede/:slug/metricas`, `/owner/sede/:slug/cierre`, `/owner/finanzas`, `/owner/finanzas/:restaurantId`.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/metrics` | `reports.view` | KPIs de la sede: ventas, ticket promedio, platos más vendidos, tiempos de cocina, ocupación (`?from=`, `?to=`) |
| GET | `/restaurants/:restaurantId/closures/preview?date=` | `reports.view` | Pre-cierre del día: ventas por método, gastos y efectivo esperado |
| POST | `/restaurants/:restaurantId/closures` | `reports.view` | Guarda el cierre con el efectivo contado. `409` si ya existe para esa fecha |
| PUT | `/closures/:closureId` | `reports.view` | Corrige un cierre |
| GET | `/restaurants/:restaurantId/closures` | `reports.view` | Historial de cierres |
| GET | `/finance/summary` | `reports.view` | Finanzas de la cadena: ganancia por sede (`?period=day\|month\|year&date=`) |
| GET | `/restaurants/:restaurantId/finance` | `reports.view` | Detalle de ingresos y gastos de una sede por día |

Las finanzas se calculan desde `payments`, `expenses` e `inventory_movements` (vista `daily_financials`). Ya no se leen de datos de demostración.

---

## 10. Administración

Rutas del front: `/owner/admin/empleados`, `/owner/admin/usuarios`, `/owner/admin/roles`.

### Empleados

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/employees` | `staff.manage` | Empleados de la organización (`?restaurantId=`, `?status=`, `?q=`) |
| POST | `/employees` | `staff.manage` | Registra un empleado |
| GET | `/employees/:employeeId` | `staff.manage` | Detalle |
| PATCH | `/employees/:employeeId` | `staff.manage` | Edita datos, sede, área, rol o estado |
| DELETE | `/employees/:employeeId` | `staff.manage` | Da de baja (soft delete) y desvincula su usuario |

### Usuarios y accesos

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/users` | `users.manage` | Usuarios de la organización con rol y sedes |
| POST | `/users` | `users.manage` | El dueño crea la cuenta de un empleado con contraseña temporal |
| PATCH | `/users/:userId/access` | `users.manage` | Cambia rol, sedes y empleado vinculado |
| PATCH | `/users/:userId/active` | `users.manage` | Activa o desactiva: `{ "isActive": false }` |
| PATCH | `/users/:userId/blocked` | `users.manage` | Bloquea o desbloquea: `{ "isBlocked": true }` |
| POST | `/users/:userId/reset-password` | `users.manage` | Genera una nueva contraseña temporal |

`POST /users`
```json
{
  "employeeId": "…",
  "email": "mozo@mail.com",
  "roleId": "…",
  "restaurantIds": ["…"]
}
```
Respuesta: el usuario creado y la `temporaryPassword` (se muestra una sola vez). En el primer ingreso, `GET /me` devuelve `mustChangePassword: true`.

### Roles y permisos

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/permissions` | `users.manage` | Catálogo de permisos agrupados por módulo |
| GET | `/roles` | `users.manage` | Roles del sistema y de la organización, con número de usuarios |
| POST | `/roles` | `users.manage` | Crea un rol con sus permisos |
| PATCH | `/roles/:roleId` | `users.manage` | Edita nombre, descripción y permisos. `422` en roles del sistema |
| DELETE | `/roles/:roleId` | `users.manage` | Elimina un rol. `409 ROLE_IN_USE` si tiene usuarios |

---

## Resumen por flujo

```
Alta del dueño     POST /auth/register → GET /me → POST /restaurants/:id/tables
                   → POST /menus → POST /categories → POST /products → PATCH /menus/:id/status

Alta de empleado   POST /employees → POST /users (contraseña temporal)
                   → empleado: POST /auth/login → POST /auth/first-password

Servicio en sala   GET /floor + GET /events → POST /orders (manual) | pedido del comensal
                   → PATCH /order-items/:id/status → POST /orders/:id/payments → POST /orders/:id/close

Fin del día        GET /closures/preview → POST /closures → GET /finance/summary
```
