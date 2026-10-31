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
- **Sesión obligatoria por defecto**: todas las rutas exigen `Authorization: Bearer <accessToken>` (401 `MISSING_ACCESS_TOKEN` / `INVALID_ACCESS_TOKEN`). Son públicas solo: registro, login, refresh y reseteo de contraseña (`/api/v1/owner/auth/*`, `/api/v1/customer/auth/*` salvo logout), y las rutas del comensal (`/api/v1/tables/qr/*`, `/api/v1/attentions/*`, `/api/v1/restaurants/:slug/cart/validate`), donde el login es opcional.
- **Todavía no se aplican permisos ni el alcance por organización/sede**: cualquier usuario con sesión puede operar el CRUD interno. Las membresías y los permisos ya existen como datos.
- **`DELETE` = baja lógica** en entidades con estado: organizaciones, sedes, pisos, mesas, empleados, usuarios, roles, permisos, membresías, categorías, productos, menús, secciones de menú, insumos y categorías de inventario/gasto quedan inactivos (`status`/`isActive`) en lugar de borrarse. Siguen siendo borrado físico las asociaciones puras (permisos de un rol, productos de un menú, categorías e ingredientes de un producto, líneas de receta).
- **Paginación**: los listados aceptan `?page=` (desde 1) y `?limit=` (por defecto 20, máximo 100) y devuelven en `data`:
  `{ "items": [...], "meta": { "page", "limit", "total", "totalPages" } }`.
  No se paginan las sublistas acotadas: permisos de un rol, productos y secciones de un menú, categorías e ingredientes de un producto, receta, modalidades de una sede e historial de un plato.

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
| Mesas | `POST/GET /dining-tables?restaurantId=&floorId=`, `GET/PATCH/DELETE /dining-tables/:id` | Se crean en un piso (la sede sale del piso). `operationalStatus` ACTIVE/INACTIVE/MAINTENANCE, `serviceStatus` AVAILABLE/RESERVED/CLEANING. "Ocupada" no se guarda: es tener una atención activa. La respuesta incluye `qr: { active, version, generatedAt, assetUrl }`, nunca el token ni su hash |
| QR de mesa | `POST /dining-tables/:id/qr-code` (`{ assetUrl? }`), `DELETE /dining-tables/:id/qr-code` | Un QR activo por mesa, guardado en la propia mesa (ya no existe `table_qr_codes`). Generar crea un token seguro, guarda solo su SHA-256 e incrementa `qr.version`: el QR anterior deja de funcionar. **`token` y `qrUrl` (`PUBLIC_APP_URL/t/<token>`) solo vienen en esa respuesta**. `assetUrl` es opcional (imagen en almacenamiento externo) y nunca valida el QR. `DELETE` deja la mesa sin QR válido |
| Modalidades de la sede | `GET /restaurants/:id/order-modes`, `PUT /restaurants/:id/order-modes/:mode` | `DINE_IN`, `PICKUP`, `DELIVERY` con `isEnabled`, `minimumAmount`, `deliveryFee` (solo DELIVERY) y `configuration` libre. Sin configurar, solo `DINE_IN` está habilitada |
| Áreas laborales | `POST/GET /work-areas?organizationId=&isActive=`, `GET/PATCH/DELETE /work-areas/:id` | Cocina, Sala, Limpieza... Nombre único por organización sin distinguir mayúsculas. `PATCH isActive` activa/desactiva; `DELETE` desactiva |
| Puestos | `POST/GET /job-positions?organizationId=&workAreaId=&isActive=`, `GET/PATCH/DELETE /job-positions/:id` | Cocinero, Mozo... dentro de un área (la organización sale del área). Nombre único por área sin distinguir mayúsculas. Desactivar un puesto no cambia a los empleados que ya lo tienen; solo deja de poder asignarse |
| Empleados | `POST/GET /employees?organizationId=`, `GET/PATCH/DELETE /employees/:id` | `userId` opcional (empleado sin acceso al sistema); `employeeCode` único por organización. Puesto vigente en `jobPositionId` (de la misma organización y activo al asignarlo); ya no hay `positionName` ni `area` en texto libre. **El puesto nunca da permisos: eso es IAM** |

---

## Catálogo

| Recurso | Rutas | Notas |
|---|---|---|
| Categorías | `POST/GET /categories?organizationId=&parentCategoryId=&rootOnly=&isActive=`, `GET/PATCH/DELETE /categories/:id` | **Por organización** y en árbol con `parentCategoryId` (Comidas > Carnes > Parrillas). El padre debe ser de la misma organización y no se permiten ciclos. Nombre único dentro del mismo padre, sin distinguir mayúsculas. `PATCH parentCategoryId: null` la vuelve raíz. `DELETE` desactiva: quien ya la usa la conserva, pero no se pueden agregar nuevos enlaces |
| Productos | `POST/GET /products?restaurantId=&categoryId=`, `GET/PATCH/DELETE /products/:id` | Se crean con `restaurantId` y, opcionalmente, `categoryIds` (validados antes de guardar). `?categoryId=` filtra por categoría. `status` ACTIVE/INACTIVE (catálogo) e `isAvailable` (agotado hoy). `isTakeawayAllowed` / `isDeliveryAllowed` por modalidad |
| Categorías de un producto | `GET/POST /products/:id/categories` (`{ categoryId }`), `DELETE /products/:id/categories/:categoryId` | Un producto puede tener varias categorías. Categoría activa y de la organización de la sede del producto |
| Menús | `POST/GET /menus?restaurantId=`, `GET/PATCH/DELETE /menus/:id` | `status` DRAFT/ACTIVE/INACTIVE, vigencia `validFrom`/`validUntil` |
| Secciones de un menú | `GET/POST /menus/:id/sections`, `PATCH/DELETE /menus/:id/sections/:sectionId` | Bloques visibles del menú (Entradas, Promociones...) con `sortOrder`. Nombre único por menú sin distinguir mayúsculas. `categoryId` opcional para reutilizar una categoría de la organización. `DELETE` la desactiva; sus productos siguen en el menú |
| Productos de un menú | `GET/POST /menus/:id/products`, `PATCH/DELETE /menus/:id/products/:productId` | El producto debe ser de la misma sede. `menuSectionId` (activa y del mismo menú, `null` = sin sección): el mismo producto puede ir en secciones distintas según el menú. `displayPrice` es solo de exhibición |
| Ingredientes de un producto | `GET/POST /products/:id/ingredients`, `PATCH/DELETE /products/:id/ingredients/:ingredientId` | Opcionales: ingredientes visibles en la carta (`isVisible`); no afectan el stock. No configurarlos no dice nada sobre alérgenos |

Los alérgenos quedan fuera del MVP: no hay tablas ni endpoints (observación ACMR 3).

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/restaurants/:slug/cart/validate` | `{ serviceType, items[{productId, quantity, unitPrice?}] }`. Devuelve `lines` con nombre y **precio del servidor**, `subtotal`, `deliveryFee`, `total`, `minimumAmount`, `issues` por producto (`PRODUCT_NOT_FOUND`, `PRODUCT_NOT_IN_RESTAURANT`, `PRODUCT_INACTIVE`, `PRODUCT_UNAVAILABLE`, `MODE_NOT_ALLOWED`, `PRICE_CHANGED`) y `serviceIssues` del pedido (`MODE_DISABLED`, `BELOW_MINIMUM`) |

---

## Atención (visita, órdenes y platos)

Modelo: **atención** (`attentions`: la visita / cuenta) → **órdenes** (`orders`: cada comanda o ronda enviada desde el carrito o por el mozo; antes `order_batches`) → **ítems** (`order_items.order_id`: cada plato, con su estado e historial). Ejemplo: una mesa pide bebidas, luego fondos y luego postres → tres órdenes de la misma atención.

Los estados están separados y no se pisan:

- **Atención** (ciclo comercial): `OPEN` → `BILL_REQUESTED` → `CLOSED`, o `CANCELLED`.
- **Orden** (ciclo operativo, se calcula a partir de sus ítems): `SUBMITTED` → `CONFIRMED` (opcional) → `PREPARING` → `READY` → `SERVED`, o `CANCELLED` si todos sus ítems se rechazaron o cancelaron. No hay `DRAFT`: el carrito vive en el cliente hasta que se envía.
- Servir o cancelar una orden **nunca** cierra ni cancela la atención; una atención abierta puede tener a la vez órdenes servidas, en preparación y recién enviadas.

 Una mesa tiene como máximo una atención activa (`OPEN` o `BILL_REQUESTED`), garantizado también con envíos simultáneos.

### Personal

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/attentions` | Abre una atención: `DINE_IN` con `diningTableId`, o `PICKUP`/`DELIVERY` con `restaurantId` + `fulfillment` (contacto y dirección). Mesa con atención activa → 409; modalidad deshabilitada en la sede → 422. En DELIVERY el costo de envío se toma de la sede |
| GET | `/attentions?restaurantId=&status=` | Lista |
| GET | `/attentions/:id` | Detalle: participantes, `orders` (cada una con su `status` y sus platos), datos de recojo/delivery |
| POST | `/attentions/:id/orders` | Orden tomada por el mozo `{ requestId, items, submittedByUserId? }`. Idempotente por `requestId` |
| POST | `/attentions/orders/:orderId/confirm` | Confirma una orden recibida (solo desde `SUBMITTED`) |
| POST | `/attentions/orders/:orderId/cancel` | `{ reason }`. Cancela una orden completa mientras no tenga productos servidos: sus platos pendientes pasan a `CANCELLED` con historial. La atención y sus otras órdenes no cambian. Orden servida o ya cancelada → 422 `ORDER_ALREADY_FINISHED` |
| GET | `/attentions/:id/bill` | Ítems cobrables (sin rechazados ni cancelados), total, pagado, saldo |
| POST | `/attentions/:id/request-bill` | Marca la cuenta como pedida |
| POST | `/attentions/:id/close` | Cierra; solo con saldo 0 (422 si no) |
| POST | `/attentions/:id/cancel` | `{ reason }`. No permitido si hay pagos confirmados. Cancela también el recojo/delivery pendiente |
| PATCH | `/attentions/:id/fulfillment/status` | `{ status, estimatedReadyAt? }`. Recojo: PENDING→CONFIRMED→PREPARING→READY→COMPLETED. Delivery: …→READY→OUT_FOR_DELIVERY→COMPLETED. CANCELLED desde cualquier estado no final. Saltos → 409; COMPLETED registra `deliveredAt` |
| GET | `/order-items?restaurantId=&status=SUBMITTED,PREPARING&includeClosed=` | Tablero de cocina (paginado). Por defecto solo platos de atenciones activas; `includeClosed=true` incluye cerradas y canceladas |
| GET | `/order-items/:id` | Un plato |
| PATCH | `/order-items/:id/status` | `{ status, version?, reason?, changedByUserId? }`. Transiciones: SUBMITTED→PREPARING/REJECTED/CANCELLED, PREPARING→READY/CANCELLED, READY→DELIVERED/CANCELLED. `REJECTED` exige `reason`. Si `version` no coincide (otro empleado lo cambió) → 409. Al pasar a `PREPARING` se descuenta el stock según la receta del producto (ver Inventario). Cada cambio recalcula el estado de su orden |
| GET | `/order-items/:id/history` | Historial de estados |

### Comensal (`/api/v1`, login opcional)

Identidad: con `Authorization: Bearer` se identifica al usuario; sin login, con el header `X-Guest-Token` (UUID). Solo los participantes de la atención pueden verla o modificarla (403 si no).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/tables/qr/:token` | Resuelve el QR: sede, mesa y atención activa (si hay). QR revocado → 404 con `errorCode: QR_INVALID` |
| POST | `/api/v1/attentions` | Primera orden: `{ serviceType, tableToken? (DINE_IN), restaurantId? + fulfillment? (PICKUP/DELIVERY), requestId, items, displayName? }`. En mesa se une a la atención activa o la abre. Un invitado nuevo recibe `guestToken` en la respuesta |
| POST | `/api/v1/attentions/:id/orders` | Otra orden `{ requestId, items }`. Si la cuenta estaba pedida, vuelve a `OPEN` |
| DELETE | `/api/v1/attentions/:id/items/:itemId` | Cancela un plato propio mientras siga `SUBMITTED` |
| GET | `/api/v1/attentions/:id` | Atención con sus órdenes y el estado de cada plato |
| GET | `/api/v1/attentions/:id/bill` | Cuenta |
| POST | `/api/v1/attentions/:id/request-bill` | Pide la cuenta |

Nombre y precio de cada plato se toman del catálogo **en el servidor** al momento del pedido y quedan congelados en el ítem.

---

## Pagos

Modelo independiente de cualquier pasarela:

- **`payments`**: el movimiento de dinero o intento de cobro: monto, método, quién pagó, estado interno, datos de la pasarela (`provider_code`, `provider_payment_id`, `provider_status` con el estado **original** del proveedor) y `request_id` (idempotencia, único por sede). El importe y las asignaciones nunca cambian después.
- **`payment_allocations`**: cómo se reparte cada pago entre los productos de la atención (`concept = ORDER_ITEM`) o el costo de envío (`DELIVERY_FEE`). Un pago cubre varios productos y un producto puede cubrirse con varios pagos; la suma de las asignaciones es siempre el monto del pago.
- **`payment_statuses`**: catálogo global de ACMR (PENDING, PROCESSING, PAID, FAILED, CANCELLED, PARTIALLY_REFUNDED, REFUNDED) con `is_terminal`, `counts_toward_balance` y `allows_refund`. Se crea al arrancar la app. Solo los estados con `counts_toward_balance` reducen el saldo; los pendientes **reservan** su monto para que otro cobro no lo tome.
- **`payment_provider_status_mappings`**: traducción de cada estado de pasarela a uno interno (p. ej. `mercado_pago` + `approved` → PAID). **`payment_provider_events`**: auditoría de los eventos recibidos, únicos por proveedor + `eventId` y sin datos de tarjeta.
- **Reembolsos**: `refunds`, `refund_statuses`, `refund_allocations` y `refund_provider_status_mappings` están modelados, pero **todavía no hay flujo ni endpoints** (decisión pendiente: reembolsos parciales por producto o solo totales). Por eso ningún flujo lleva un pago a PARTIALLY_REFUNDED ni a REFUNDED.

### Personal

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/payments` | `{ attentionId, requestId, method, mode, amount?, allocations?, payerName?, payerUserId?, externalReference?, notes?, provider? }`. `mode`: `FULL` (todo el saldo), `AMOUNT` (monto libre) o `ITEMS` (`allocations: [{ orderItemId?, amount }]`; sin `orderItemId` = costo de envío). En FULL y AMOUNT el servidor reparte en orden de creación del producto (id como desempate) y el envío al final; nunca usa montos del cliente. Sin `provider` el pago queda PAID; con `provider` arranca en PENDING o en el estado que mapee `provider.status`. 201 la primera vez, 200 con el mismo pago si se repite el `requestId`. Errores: saldo excedido (`PAYMENT_EXCEEDS_BALANCE`, `ALLOCATION_EXCEEDS_ITEM_BALANCE`), producto ajeno (`ALLOCATION_TARGET_NOT_IN_ATTENTION`), atención no activa (`ATTENTION_NOT_PAYABLE`), estado sin mapeo (`UNMAPPED_PROVIDER_STATUS`) |
| GET | `/payments?attentionId=&restaurantId=&status=` | Lista paginada con sus asignaciones |
| GET | `/payments/:id` | Un pago |
| GET | `/payments/balance/:attentionId` | Por producto y envío: total, pagado, reservado (pagos pendientes) y pendiente |
| POST | `/payments/:id/cancel` | Cancela un intento PENDING / PROCESSING y libera lo reservado. Un pago confirmado no se cancela (422) |

El saldo se recalcula dentro de una transacción con un bloqueo por atención: cobros simultáneos nunca superan la deuda. La cuenta de la atención (`/attentions/:id/bill`) y el cierre diario usan solo los pagos que cuentan. Un producto con pagos asignados no se puede cancelar ni rechazar (`ORDER_ITEM_HAS_PAYMENTS`).

### Privado de ACMR (`/platform`, solo `users.is_platform_admin`)

El flag se activa solo en la base de datos; ninguna ruta de la API lo cambia. Sin él → 403 `PLATFORM_ADMIN_REQUIRED`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/platform/payment-statuses` | Catálogo de estados internos |
| PATCH | `/platform/payment-statuses/:code` | Solo `{ name?, description? }`; el código y el efecto contable no se pueden cambiar |
| GET/POST | `/platform/payment-provider-status-mappings?providerCode=&isActive=` | Mapeos; `{ providerCode, externalStatus, paymentStatus }`, únicos por proveedor + estado externo sin distinguir mayúsculas |
| PATCH | `/platform/payment-provider-status-mappings/:id` | `{ paymentStatus?, isActive? }`; afecta solo a eventos futuros |
| POST | `/platform/payment-providers/:providerCode/events` | `{ eventId, eventType, providerPaymentId?, externalStatus?, payload? }`. Guarda el estado original, lo traduce y actualiza el pago. Un `eventId` repetido no se reaplica (200, `duplicate: true`); un estado que retrocede se ignora (`IGNORED`); sin mapeo → `FAILED` |
| GET | `/platform/payment-provider-events?providerCode=` | Auditoría de eventos |

---

## Inventario

Tres niveles: **insumo maestro** de la organización (`supplies`) → **stock por sede** (`restaurant_supplies`) → **movimientos** inmutables (`inventory_movements`). Las unidades (`units_of_measure`: KG, G, L, ML, UNIT) y los tipos de movimiento (`inventory_movement_types`) son catálogos de ACMR que se crean al arrancar la app; el efecto de cada tipo sobre el stock está fijo en el código.

| Recurso | Rutas | Notas |
|---|---|---|
| Catálogos | `GET /units-of-measure`, `GET /inventory-movement-types` | Para llenar formularios. Tipos: PURCHASE (+), USAGE (−), WASTE (−), COUNT_ADJUSTMENT_IN/OUT, MANUAL_ADJUSTMENT_IN/OUT, REVERSAL (calculado). Ya no existe `ADJUSTMENT` ni `COUNT` |
| Categorías de inventario | `POST/GET /inventory-categories?organizationId=`, `GET/PATCH/DELETE /inventory-categories/:id` | Por organización, con `description`. Nombre único sin distinguir mayúsculas |
| Insumos maestros | `POST/GET /supplies?organizationId=&categoryId=&isActive=`, `GET/PATCH/DELETE /supplies/:id` | `{ organizationId, categoryId, code, name, unitCode, description? }`. Se registra **una vez por organización** (código único, en mayúsculas); la categoría debe ser de la misma organización y la unidad del catálogo (texto libre → 404 `UNIT_OF_MEASURE_NOT_FOUND`). No guarda stock. La unidad base no cambia si alguna sede ya tiene movimientos (422 `SUPPLY_UNIT_LOCKED`) |
| Stock por sede | `POST/GET /restaurant-supplies?restaurantId=&supplyId=&isActive=&lowStock=`, `GET/PATCH/DELETE /restaurant-supplies/:id` | `POST { restaurantId, supplyId, minimumQuantity? }` habilita el insumo en la sede con stock 0 (sede e insumo de la misma organización; una vez por sede). Respuesta con `supply { code, name, unitCode }`, `currentQuantity`, `minimumQuantity`, `averageUnitCost` y `lowStock` (alerta: saldo ≤ mínimo). `PATCH` solo `minimumQuantity` / `isActive`: **el saldo no se edita**. `DELETE` desactiva y conserva el historial |
| Movimientos | `POST /restaurant-supplies/:id/movements`, `GET /restaurant-supplies/:id/movements` | `{ type: PURCHASE \| USAGE \| WASTE \| MANUAL_ADJUSTMENT_IN \| MANUAL_ADJUSTMENT_OUT, quantity (> 0), unitCost? (compras), notes?, idempotencyKey? }`. El tipo define el signo: se guarda `quantityDelta` firmado con saldo anterior y resultante. Saldo y movimiento se guardan juntos con la fila bloqueada (sin pérdida de actualizaciones); una salida nunca deja stock negativo (422 `INSUFFICIENT_STOCK`). Las compras con `unitCost` recalculan el costo promedio ponderado; las salidas no. `idempotencyKey` repetida → 200 con el mismo movimiento. Historial del más reciente al más antiguo: el primero tiene el saldo actual |
| Conteo físico | `POST /restaurant-supplies/:id/counts` | `{ countedQuantity, notes?, idempotencyKey? }`. El backend calcula la diferencia y crea COUNT_ADJUSTMENT_IN / OUT con `countedQuantity`. Sin diferencia → 200 con `movement: null` |
| Reversión | `GET /inventory-movements/:id`, `POST /inventory-movements/:id/reverse` | `{ notes, idempotencyKey? }`. Crea un REVERSAL con el delta opuesto y `reversalOfMovementId`; el original no cambia. Un movimiento se revierte una vez (409); una reversión no se revierte (422). No hay `PATCH` ni `DELETE` de movimientos |
| Recetas | `GET /product-recipes/:productId`, `PUT/DELETE /product-recipes/:productId/supplies/:supplyId` | `{ quantityRequired, wastePercentage? }` por unidad de producto con el **insumo maestro** (misma organización que el producto); devuelve `effectiveQuantity` con la merma |
| Consumo automático | — | **Apagado por defecto** (`INVENTORY_AUTO_CONSUMPTION=false`) hasta confirmar el flujo. Encendido: al pasar un plato a `PREPARING` registra un USAGE en el stock de la sede del pedido por cada insumo de la receta, con `originModule = ATTENTION`, `originId` = plato e `idempotencyKey` (nunca descuenta dos veces). Si falta stock consume lo disponible y anota el faltante, sin bloquear la cocina. No se revierte si el plato se cancela después |

Privado de ACMR (`/platform`, solo `users.is_platform_admin`): `PATCH /platform/units-of-measure/:code` (`{ name?, isActive? }`; una unidad desactivada no se usa en insumos nuevos) y `PATCH /platform/inventory-movement-types/:code` (`{ name }`; el efecto no se cambia).

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
- **Seeds** de permisos y roles base.
- **Reembolsos**: tablas modeladas, sin flujo ni endpoints hasta decidir si serán parciales por producto o solo totales.
- **Webhooks públicos de pasarelas** con verificación de firma: hoy los eventos entran por la ruta privada `/platform/payment-providers/:providerCode/events`.
- **Vincular un gasto a una compra de inventario** (`expenses.inventory_movement_id`): la columna existe pero la API todavía no lo expone.
- **Catálogo**: carta pública y descubrimiento de restaurantes.
- **Monto mínimo** de la modalidad: se informa en la validación del carrito, pero todavía no bloquea el pedido.
- Eventos en tiempo real, envío real de correos.
