# Endpoints · Estado actual

Este documento refleja lo que **ya está implementado y corriendo**, sobre el modelo de datos de Restaurant CMR (38 tablas). Para la API objetivo ver [comensales.md](comensales.md) y [restaurant.md](restaurant.md).

Swagger interactivo en `/docs`.

## Convenciones

- Sin prefijo global: el CRUD interno vive en la raíz (`/restaurants`, `/attentions`, ...). La autenticación vive en `/api/v1/owner/auth` y `/api/v1/customer/auth`; las rutas públicas del comensal en `/api/v1/...`.
- Respuesta estándar: `{ "success", "statusCode", "message", "data", "timestamp", "path" }`.
- Las respuestas de error agregan **`errorCode`**: un código estable para que el frontend decida por él y no por el texto. Ejemplos: `PRODUCT_NOT_ORDERABLE`, `INVALID_ORDER_ITEM_TRANSITION`, `STALE_ORDER_ITEM_VERSION`, `INSUFFICIENT_STOCK`, `QR_INVALID`, `MISSING_ACCESS_TOKEN`, `VALIDATION_ERROR`, `DUPLICATE_RECORD`. Los códigos de dominio se derivan del nombre del error (`XxxYyyError` → `XXX_YYY`).
- Mensajes en español, incluidas las validaciones de formato. Los errores de validación devuelven `message` como lista e indican la ruta del campo, por ejemplo `items.0.quantity debe ser mayor o igual a 1`.
- Errores: `400` (datos inválidos / invariante de dominio), `401`, `403` (sin acceso al recurso), `404`, `409` (duplicado, transición no permitida, conflicto de versión o de concurrencia), `422` (regla de negocio), `500`.
- Las violaciones de restricciones de la base que se escapan de las validaciones se traducen: único → `409`, FK → `409`, CHECK → `400`.
- Todos los `:id` son UUID (`ParseUUIDPipe`).
- Estados y tipos en MAYÚSCULAS, igual que en la base (`OPEN`, `DINE_IN`, `PREPARING`, ...).
- **Sesión obligatoria por defecto**: todas las rutas exigen `Authorization: Bearer <accessToken>` (401 `MISSING_ACCESS_TOKEN` / `INVALID_ACCESS_TOKEN`). Son públicas solo: registro, login, refresh y reseteo de contraseña (`/api/v1/owner/auth/*`, `/api/v1/customer/auth/*` salvo logout), y las rutas del comensal (`/api/v1/tables/qr/*`, `/api/v1/orders/*`, `/api/v1/restaurants/:slug/cart/validate`), donde el login es opcional.
- **Todavía no se aplican permisos ni el alcance por organización/sede**: cualquier usuario con sesión puede operar el CRUD interno. Las membresías y los permisos ya existen como datos.
- **`DELETE` = baja lógica** en entidades con estado: organizaciones, sedes, pisos, mesas, empleados, usuarios, roles, permisos, membresías, categorías, productos, menús, insumos y categorías de inventario/gasto quedan inactivos (`status`/`isActive`) en lugar de borrarse. Siguen siendo borrado físico las asociaciones puras (permisos de un rol, productos de un menú, alérgenos e ingredientes de un producto, líneas de receta) y los alérgenos del catálogo global.
- **Paginación**: los listados aceptan `?page=` (desde 1) y `?limit=` (por defecto 20, máximo 100) y devuelven en `data`:
  `{ "items": [...], "meta": { "page", "limit", "total", "totalPages" } }`.
  No se paginan las sublistas acotadas: permisos de un rol, productos de un menú, alérgenos e ingredientes de un producto, receta, modalidades de una sede e historial de un plato.

---

## Identidad y acceso (IAM)

Una sola identidad (`users`) para comensales y personal: el mismo usuario puede ser comensal, dueño de una organización y empleado en otra. Lo que puede hacer en cada organización lo define su **membresía** (rol + sedes). Los tokens de `/owner/auth` y `/customer/auth` son los mismos (access 15 min, refresh 30 días con rotación de un solo uso).

### Auth

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/owner/auth/register` | público | Alta del dueño en una sola transacción: usuario + organización + rol `OWNER` (con todos los permisos activos) + membresía con acceso a todas las sedes + primera sede opcional (`restaurant`). Si algo falla no queda nada. Devuelve la sesión y los ids creados |
| POST | `/api/v1/customer/auth/register` | público | Crea usuario + perfil de comensal (`email`, `password`, `firstName`, `lastName?`, `phone?`, `dietaryPreferences?`) y devuelve la sesión |
| POST | `/api/v1/{owner\|customer}/auth/login` | público | Login con email y contraseña. Usuarios `INACTIVE`/`BLOCKED` reciben 403 |
| POST | `/api/v1/{owner\|customer}/auth/refresh` | público | Rota el refresh token (el anterior deja de servir). Atómico: de dos refresh simultáneos con el mismo token solo uno gana |
| POST | `/api/v1/{owner\|customer}/auth/logout` | bearer | Invalida el refresh token |
| POST | `/api/v1/{owner\|customer}/auth/forgot-password` | público | Genera un token de un solo uso (30 min). Hoy se loguea en consola, no hay correo real |
| POST | `/api/v1/{owner\|customer}/auth/reset-password` | público | Cambia la contraseña con el token |
| GET / PATCH | `/api/v1/owner/me` | bearer | Usuario autenticado; edita `firstName`, `lastName`, `phone` |
| PATCH | `/api/v1/owner/me/password` | bearer | Cambia la contraseña (pide la actual) |
| GET / PATCH | `/api/v1/customer/me` | bearer | Usuario + preferencias alimentarias |

### CRUD interno

| Recurso | Rutas | Notas |
|---|---|---|
| Usuarios | `POST/GET /users`, `GET/PATCH/DELETE /users/:id` | `mustChangePassword` para contraseñas temporales; `status` ACTIVE/INACTIVE/BLOCKED |
| Roles | `POST/GET /roles?organizationId=`, `GET/PATCH/DELETE /roles/:id` | Pertenecen a una organización; `code` único por organización (se guarda en mayúsculas) |
| Permisos de un rol | `GET/POST /roles/:id/permissions`, `DELETE /roles/:id/permissions/:permissionId` | Reemplaza al antiguo `/role-permissions` |
| Permisos | `POST/GET /permissions`, `GET/PATCH/DELETE /permissions/:id` | `code` global, en minúsculas (`orders.manage`) |
| Membresías | `POST/GET /memberships?organizationId=&userId=`, `GET/PATCH/DELETE /memberships/:id` | Usuario + organización + rol + alcance: `allRestaurants=true` o `restaurantIds`. Lista vacía = sin acceso a sedes. El rol y las sedes deben ser de la misma organización |

---

## Organizaciones y sedes

| Recurso | Rutas | Notas |
|---|---|---|
| Organizaciones | `POST/GET /organizations`, `GET/PATCH/DELETE /organizations/:id` | `taxIdentifier` único; moneda y zona horaria por defecto `PEN` / `America/Lima` |
| Restaurantes (sedes) | `POST/GET /restaurants?organizationId=`, `GET/PATCH/DELETE /restaurants/:id` | `slug` y `code` se generan si no se envían; heredan moneda y zona de la organización |
| Pisos | `POST/GET /restaurant-floors?restaurantId=`, `GET/PATCH/DELETE /restaurant-floors/:id` | Nombre único por sede |
| Mesas | `POST/GET /dining-tables?restaurantId=&floorId=`, `GET/PATCH/DELETE /dining-tables/:id` | Se crean en un piso (la sede sale del piso). `operationalStatus` ACTIVE/INACTIVE/MAINTENANCE, `serviceStatus` AVAILABLE/RESERVED/CLEANING. "Ocupada" no se guarda: es tener una atención activa |
| QR de mesa | `POST /table-qr-codes` (`diningTableId`), `GET /table-qr-codes?diningTableId=`, `GET /table-qr-codes/:id`, `POST /table-qr-codes/:id/revoke` | Generar emite una nueva versión y revoca la anterior. **El `token` solo viene en la respuesta de generación**; en la base solo queda su hash |
| Modalidades de la sede | `GET /restaurants/:id/order-modes`, `PUT /restaurants/:id/order-modes/:mode` | `DINE_IN`, `PICKUP`, `DELIVERY` con `isEnabled`, `minimumAmount`, `deliveryFee` (solo DELIVERY) y `configuration` libre. Sin configurar, solo `DINE_IN` está habilitada |
| Empleados | `POST/GET /employees?organizationId=`, `GET/PATCH/DELETE /employees/:id` | `userId` opcional (empleado sin acceso al sistema); `employeeCode` único por organización |

---

## Catálogo

| Recurso | Rutas | Notas |
|---|---|---|
| Categorías de productos | `POST/GET /product-categories?restaurantId=`, `GET/PATCH/DELETE /product-categories/:id` | Por sede, nombre único |
| Productos | `POST/GET /products?restaurantId=&categoryId=`, `GET/PATCH/DELETE /products/:id` | La sede sale de la categoría. `status` ACTIVE/INACTIVE (catálogo) e `isAvailable` (agotado hoy). `isTakeawayAllowed` / `isDeliveryAllowed` por modalidad |
| Menús | `POST/GET /menus?restaurantId=`, `GET/PATCH/DELETE /menus/:id` | `status` DRAFT/ACTIVE/INACTIVE, vigencia `validFrom`/`validUntil` |
| Productos de un menú | `GET/POST /menus/:id/products`, `PATCH/DELETE /menus/:id/products/:productId` | El producto debe ser de la misma sede. `displayPrice` es solo de exhibición |
| Alérgenos | `POST/GET /allergens`, `PATCH/DELETE /allergens/:id` | Catálogo global; `code` único en mayúsculas |
| Alérgenos de un producto | `GET/POST /products/:id/allergens`, `DELETE /products/:id/allergens/:allergenId` | |
| Ingredientes de un producto | `GET/POST /products/:id/ingredients`, `PATCH/DELETE /products/:id/ingredients/:ingredientId` | Ingredientes visibles en la carta (`isVisible`); no afectan el stock |

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/restaurants/:slug/cart/validate` | `{ serviceType, items[{productId, quantity, unitPrice?}] }`. Devuelve `lines` con nombre y **precio del servidor**, `subtotal`, `deliveryFee`, `total`, `minimumAmount`, `issues` por producto (`PRODUCT_NOT_FOUND`, `PRODUCT_NOT_IN_RESTAURANT`, `PRODUCT_INACTIVE`, `PRODUCT_UNAVAILABLE`, `MODE_NOT_ALLOWED`, `PRICE_CHANGED`) y `serviceIssues` del pedido (`MODE_DISABLED`, `BELOW_MINIMUM`) |

---

## Atención (visita, rondas y platos)

Modelo: **atención** (la visita / cuenta) → **rondas** (cada envío del carrito o del mozo) → **ítems** (cada plato, con su estado e historial). Una mesa tiene como máximo una atención activa (`OPEN` o `BILL_REQUESTED`), garantizado también con envíos simultáneos.

### Personal

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/attentions` | Abre una atención: `DINE_IN` con `diningTableId`, o `PICKUP`/`DELIVERY` con `restaurantId` + `fulfillment` (contacto y dirección). Mesa con atención activa → 409; modalidad deshabilitada en la sede → 422. En DELIVERY el costo de envío se toma de la sede |
| GET | `/attentions?restaurantId=&status=` | Lista |
| GET | `/attentions/:id` | Detalle: participantes, rondas con sus platos, datos de recojo/delivery |
| POST | `/attentions/:id/rounds` | Ronda del mozo `{ requestId, items, submittedByUserId? }`. Idempotente por `requestId` |
| POST | `/attentions/rounds/:batchId/confirm` | Confirma una ronda recibida |
| GET | `/attentions/:id/bill` | Ítems cobrables (sin rechazados ni cancelados), total, pagado, saldo |
| POST | `/attentions/:id/request-bill` | Marca la cuenta como pedida |
| POST | `/attentions/:id/close` | Cierra; solo con saldo 0 (422 si no) |
| POST | `/attentions/:id/cancel` | `{ reason }`. No permitido si hay pagos (primero reembolsar). Cancela también el recojo/delivery pendiente |
| PATCH | `/attentions/:id/fulfillment/status` | `{ status, estimatedReadyAt? }`. Recojo: PENDING→CONFIRMED→PREPARING→READY→COMPLETED. Delivery: …→READY→OUT_FOR_DELIVERY→COMPLETED. CANCELLED desde cualquier estado no final. Saltos → 409; COMPLETED registra `deliveredAt` |
| GET | `/order-items?restaurantId=&status=SUBMITTED,PREPARING&includeClosed=` | Tablero de cocina (paginado). Por defecto solo platos de atenciones activas; `includeClosed=true` incluye cerradas y canceladas |
| GET | `/order-items/:id` | Un plato |
| PATCH | `/order-items/:id/status` | `{ status, version?, reason?, changedByUserId? }`. Transiciones: SUBMITTED→PREPARING/REJECTED/CANCELLED, PREPARING→READY/CANCELLED, READY→DELIVERED/CANCELLED. `REJECTED` exige `reason`. Si `version` no coincide (otro empleado lo cambió) → 409. Al pasar a `PREPARING` se descuenta el stock según la receta del producto (ver Inventario) |
| GET | `/order-items/:id/history` | Historial de estados |

### Comensal (`/api/v1`, login opcional)

Identidad: con `Authorization: Bearer` se identifica al usuario; sin login, con el header `X-Guest-Token` (UUID). Solo los participantes de la atención pueden verla o modificarla (403 si no).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/tables/qr/:token` | Resuelve el QR: sede, mesa y atención activa (si hay). QR revocado → 404 con `errorCode: QR_INVALID` |
| POST | `/api/v1/orders` | Primera ronda: `{ serviceType, tableToken? (DINE_IN), restaurantId? + fulfillment? (PICKUP/DELIVERY), requestId, items, displayName? }`. En mesa se une a la atención activa o la abre. Un invitado nuevo recibe `guestToken` en la respuesta |
| POST | `/api/v1/orders/:id/rounds` | Otra ronda `{ requestId, items }`. Si la cuenta estaba pedida, vuelve a `OPEN` |
| DELETE | `/api/v1/orders/:id/items/:itemId` | Cancela un plato propio mientras siga `SUBMITTED` |
| GET | `/api/v1/orders/:id` | Atención con rondas y estado de cada plato |
| GET | `/api/v1/orders/:id/bill` | Cuenta |
| POST | `/api/v1/orders/:id/request-bill` | Pide la cuenta |

Nombre y precio de cada plato se toman del catálogo **en el servidor** al momento del pedido y quedan congelados en el ítem.

---

## Inventario

| Recurso | Rutas | Notas |
|---|---|---|
| Categorías de inventario | `POST/GET /inventory-categories?organizationId=`, `GET/PATCH/DELETE /inventory-categories/:id` | Por organización |
| Insumos | `POST/GET /supplies?restaurantId=&categoryId=`, `GET/PATCH/DELETE /supplies/:id` | Empiezan con stock 0; `PATCH` no toca el stock. `isBelowMinimum` en la respuesta |
| Recetas | `GET /product-recipes/:productId`, `PUT/DELETE /product-recipes/:productId/supplies/:supplyId` | `{ quantityRequired, wastePercentage? }` por unidad de producto; devuelve `effectiveQuantity` con la merma. Insumo y producto de la misma sede |
| Consumo automático | — | Cuando un plato pasa a `PREPARING` se registra un `USAGE` por cada insumo de su receta (cantidad con merma × unidades), con referencia `ORDER_ITEM` y nota "Consumo automático". Si falta stock consume lo disponible y anota el faltante, sin bloquear la cocina. Nunca descuenta dos veces el mismo plato. No se revierte si el plato se cancela después |
| Movimientos | `POST /supplies/:id/movements`, `GET /supplies/:id/movements` | Única forma de cambiar el stock. `PURCHASE` (suma, recalcula costo promedio con `unitCost`), `USAGE`/`WASTE` (restan; sin stock → 422), `COUNT` (`countedQuantity` fija el stock), `ADJUSTMENT` (`quantity` + `direction` INCREASE/DECREASE). Stock y movimiento se guardan en la misma transacción con bloqueo de fila |

---

## Finanzas

| Recurso | Rutas | Notas |
|---|---|---|
| Categorías de gasto | `POST/GET /expense-categories?organizationId=`, `GET/PATCH/DELETE /expense-categories/:id` | Por organización; `DELETE` desactiva |
| Gastos | `POST/GET /expenses?restaurantId=&categoryId=&status=&from=&to=`, `GET/PATCH /expenses/:id`, `POST /expenses/:id/void` | Quedan a nombre del usuario de la sesión. La categoría debe ser de la organización de la sede. No se borran: se **anulan** (`VOIDED`) y dejan de sumar; un gasto anulado no se edita |
| Cierre diario | `GET /daily-closures/preview?restaurantId=&businessDate=`, `POST /daily-closures`, `GET /daily-closures?restaurantId=&from=&to=`, `GET /daily-closures/:id` | Foto inmutable del día en la zona horaria de la sede: atenciones abiertas/cerradas/canceladas, ventas brutas, reembolsos, ventas netas, gastos, efectivo esperado (efectivo cobrado − gastos en efectivo, mínimo 0), efectivo contado, diferencia y desglose por método de pago. Un cierre por sede y fecha (409); no se cierran fechas futuras |

---

## Deliberadamente no implementado todavía

- **Autorización**: guard de permisos por endpoint y validación de organización/sede según la membresía del usuario.
- **Registro transaccional del propietario** (usuario + organización + rol OWNER + membresía + primera sede) y seeds de permisos/roles base.
- **Pagos** (`payments`, `payment_allocations`, `refunds`): hay un servicio de consulta (lo usan la cuenta y el cierre diario), pero no hay endpoints para registrar pagos ni reembolsos. Por eso el cierre muestra ventas en 0 hasta implementarlos.
- **Vincular un gasto a una compra de inventario** (`expenses.inventory_movement_id`): la columna existe pero la API todavía no lo expone.
- **Catálogo**: carta pública y descubrimiento de restaurantes.
- **Monto mínimo** de la modalidad: se informa en la validación del carrito, pero todavía no bloquea el pedido.
- Paginación, eventos en tiempo real, envío real de correos.
