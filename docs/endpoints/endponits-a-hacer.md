# Endpoints que necesita el front

Este documento lista la API mínima que necesita este front para funcionar sin json-server. **Se armó leyendo el código**: cada endpoint corresponde a funciones reales de `src/modules/*/api.ts` y de las pantallas que las usan.

**Queda fuera la pasarela de pagos** (sección 6).

Otros documentos de `docs/` relacionados:

- [endpoints-comensal.md](endpoints-comensal.md) y [endpoints-restaurante.md](endpoints-restaurante.md): el diseño completo de la API. Incluye fases futuras (`[F2]`), delivery, direcciones, etc. Este documento es el subconjunto que el front usa **hoy**.
- [diseno-tablas.md](diseno-tablas.md) y [modelo-tablas.md](modelo-tablas.md): el modelo de datos.

---

## 0. Convenciones

- **Base:** `/api/v1`. El front ya envía `Authorization: Bearer <token>` desde `src/services/http/client.ts`.
- **Prefijos:**
  - sin prefijo: rutas **públicas** del comensal;
  - `/customer/*`: cuenta del comensal (token del comensal);
  - `/owner/*`: portal del dueño o del personal (token del personal y permisos del rol).
- **Formato de respuesta:** el cliente HTTP ya entiende el sobre `{ success, statusCode, message, data, timestamp, path }`. En caso de error, `message` es lo que se muestra al usuario (texto en español).
- **Códigos que el front distingue:**

| Código | Significado |
| --- | --- |
| `401` | Sin sesión o credenciales incorrectas |
| `403` | Sin permiso |
| `404` | No existe |
| `409` | Conflicto. Ejemplos: email ya registrado, o el producto ya cambió de estado. |
| `422` | Regla de negocio. Ejemplos: mesa en mantenimiento, o monto mayor al saldo. |

- **Permisos del personal** (`src/modules/auth/permissions.ts`): `org.manage`, `users.manage`, `staff.manage`, `sites.manage`, `orders.manage`, `kitchen.manage`, `menu.manage`, `payments.manage`, `inventory.manage`, `reports.view`. Cada endpoint `/owner/*` indica el permiso que exige.
- **Alcance por sede:** el personal solo puede operar las sedes de su `restaurantIds`. Todo `/owner/restaurants/:restaurantId/*` debe validarlo.
- **Polling:** el front consulta cada 8 s la actividad de la sede (pedidos y cuentas) y la cuenta del comensal. Esos endpoints deben ser livianos. Más adelante se pueden reemplazar por WebSocket o SSE.

### Por qué hacen falta endpoints "de acción"

Hoy el front hace varias peticiones seguidas a json-server y aplica las reglas él mismo. Por ejemplo, abrir una atención, comprobar duplicados y escribir el historial. Con el backend real, **cada acción debe ser una sola petición transaccional**, y el backend debe validar las reglas que se indican en cada sección. Cuando eso esté, desaparece `waitForJsonServer()`.

---

## 1. Comensal: público

### 1.1 Restaurantes

Pantallas: inicio (`/`), carta, mesa y "Mis visitas".

| Método | Ruta | Uso en el front | Hoy (json-server) |
| --- | --- | --- | --- |
| GET | `/restaurants` | Lista de sedes visibles para el comensal, con `lat`, `lng`, `fulfillment` (envío, mínimo, recojo), `imageUrl`, `category`, `categoryLabel`, `cuisine`, `currency` y `status`. Solo las sedes activas. | `GET /restaurants` + filtro `isRestaurantOpen` |
| GET | `/restaurants/slug/:slug` | Abrir la carta por URL (`/:restaurantSlug/menu`). | `fetchRestaurantBySlug` (filtra la lista) |
| GET | `/restaurants/:id` | Datos de la sede en el seguimiento, la cuenta y la mesa. | `GET /restaurants/:id` |

### 1.2 Mesa por QR

Pantalla: `/table/:number?restaurant=:id&token=:qrToken`.

| Método | Ruta | Uso en el front | Hoy |
| --- | --- | --- | --- |
| GET | `/restaurants/:id/tables/:number?token=:qrToken` | Valida el QR y devuelve `{ restaurant, table: { number, seats, floorId }, openAttention \| null }`. | `fetchRestaurantById` + `fetchSiteOperation` + `fetchOpenAttentionForTable` |

El backend debe validar:

- que la sede exista y esté activa;
- que la mesa exista y no esté en `maintenance` ni `inactive`;
- que `qrActive` sea `true` y que el `token` coincida.

Si el QR no es válido, debe responder `404` o `422`.

### 1.3 Carta

| Método | Ruta | Uso en el front | Hoy |
| --- | --- | --- | --- |
| GET | `/restaurants/:id/menu` | Carta del comensal: `{ categories, products }`. Solo trae las categorías del **menú activo** y los productos `isActive`, ordenados por `position`. Los productos agotados vienen con `isAvailable: false` porque se muestran como "Agotado". | `fetchCustomerMenu` (menus + menuCategories + menuProducts filtrados) |
| GET | `/restaurants/:id/menu/search?q=&limit=6` | Sugerencias del buscador de la carta, buscando en nombre, descripción y tags sin distinguir tildes. | `GET /menuProducts?_where=…` (`searchMenuSuggestions`) |
| POST | `/restaurants/:id/menu/validate` | Revisa el carrito antes de enviarlo. Recibe `{ items: [{ productId, unitPrice }] }` y responde `{ issues: [{ productId, kind: 'missing' \| 'inactive' \| 'unavailable' \| 'price-changed', currentPrice }] }`. | `validateOrderItems` |

### 1.4 Pedido en mesa (atención)

Pantallas: carrito, "Tu pedido" y "Tu cuenta". La sesión del comensal es **opcional**: con sesión, la atención y los productos quedan ligados a su `customerId`.

| Método | Ruta | Uso en el front | Hoy |
| --- | --- | --- | --- |
| POST | `/restaurants/:id/tables/:number/attentions` | Abre la atención de la mesa **o devuelve la que ya está activa**. Recibe `{ token }` (el del QR) y responde con la atención. | `openOrReuseAttention` |
| GET | `/attentions/:id` | Atención con sus productos: `{ ...attention, products: OrderedProduct[] }`. Se consulta por polling. | `GET /attentions/:id` + `GET /orderedProducts` filtrado |
| POST | `/attentions/:id/rounds` | Envía una ronda del carrito. Recibe `{ batchId, items: [{ productId, quantity, notes }] }` y responde con los productos creados. | `addOrderedProducts` |
| POST | `/attentions/:id/request-account` | El comensal pide la cuenta. | `requestAccount` |
| GET | `/attentions/:id/account` | Cuenta del comensal: `{ products, payments, total, paid, remaining }`. Se consulta por polling. | `fetchOrderedProductsByAttention` + `fetchPaymentsByAttention` |

El backend debe validar:

- **Abrir atención:** una sola atención activa por mesa (`open` o `account-requested`). Si dos dispositivos abren a la vez, se devuelve la misma atención; el front hoy cancela la duplicada como "Atención duplicada". También valida que la mesa esté habilitada (igual que en 1.2). Al abrir, escribe el historial `null → open`.
- **Rondas:**
  - solo se aceptan si la atención está activa;
  - el **nombre y el precio se toman de la carta vigente**, no del cliente; el `subtotal` lo calcula el servidor;
  - el producto debe ser de esa sede, estar activo y disponible;
  - los productos que envía el comensal entran como `sent`;
  - si la atención estaba en `account-requested`, vuelve a `open` (historial: "Nuevo pedido tras solicitar la cuenta").
- **Idempotencia de rondas por `batchId`:** si llega un reintento con el mismo `batchId`, solo se crean los productos que faltan.
- **Pedir la cuenta:** pedirla dos veces no hace nada. Si la atención ya está cerrada o cancelada, responde `422`.
- **Acceso sin login:** hoy cualquiera con el `id` de la atención puede verla. Para el backend real se recomienda un `guestToken` (ver `endpoints-comensal.md`) o un id no adivinable.

---

## 2. Comensal: cuenta (`/customer`)

Pantallas: `/acceso`, `/customer/auth/*`, `/perfil` y `/mis-visitas`.

| Método | Ruta | Auth | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| POST | `/customer/auth/register` | público | Recibe `{ name, email, password }` y responde `{ accessToken, customer: { id, name, email } }`. El email repetido da `409`. | `registerCustomer` (POST `/customers`) |
| POST | `/customer/auth/login` | público | Recibe `{ email, password }` y responde la misma sesión. | `loginCustomer`: hoy **compara la contraseña en el navegador** |
| GET | `/customer/me` | comensal | Perfil: nombre, email, teléfono, cumpleaños, preferencias alimentarias, alérgenos y `marketingOptIn`. | `fetchCustomerProfile` |
| PATCH | `/customer/me` | comensal | Actualiza esos datos. | `updateCustomerProfile` |
| PATCH | `/customer/me/password` | comensal | Recibe `{ currentPassword, newPassword }`. Si la actual es incorrecta, responde `422`. | `changeCustomerPassword` |
| GET | `/customer/me/attentions` | comensal | "Mis visitas" e historial del perfil: sus atenciones con la sede y el resumen de productos y total. | `fetchAttentionsByCustomer` + `fetchAllOrderedProducts` + `fetchRestaurants` |

Las contraseñas **nunca** deben viajar de vuelta al front. Hoy json-server las devuelve.

---

## 3. Portal: sesión y perfil del personal (`/owner`)

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| POST | `/owner/auth/login` | público | Recibe `{ email, password }` y responde `{ accessToken, user }`. `user` trae `id`, `name`, `email`, `roleId`, `roleName`, `permissions[]`, `restaurantIds[]` y `employeeId`. Si el usuario está bloqueado o inactivo, responde `403` con un mensaje. | `login`: hoy compara la contraseña en el navegador y lee `/roles/:id` |
| POST | `/owner/auth/register` | público | Registro del dueño: `{ name, email, password }`. El email repetido da `409`. | `register` |
| GET | `/owner/me` | sesión | Vuelve a leer el rol, los permisos, las sedes y el bloqueo. El portal lo llama al entrar y en cada cambio de ruta; si la cuenta fue bloqueada, cierra la sesión. | `refreshAuthUser` |
| GET | `/owner/me/profile` | sesión | Perfil del personal, con los datos del empleado vinculado (puesto, sede, teléfono). | `fetchStaffProfile` |
| PATCH | `/owner/me` | sesión | Actualiza nombre, teléfono y puesto. | `updateStaffProfile` |
| PATCH | `/owner/me/password` | sesión | Recibe `{ currentPassword, newPassword }`. | `changeStaffPassword` |

---

## 4. Portal: operación de la sede

### 4.1 Organización y sedes

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/organization` | sesión | Nombre y código de la organización (directorio y administración). | `fetchOrganizations` |
| PATCH | `/owner/organization` | `org.manage` | Edita los datos de la organización. | `updateOrganization` |
| GET | `/owner/restaurants` | sesión | Sedes **a las que el usuario tiene acceso**, con los KPIs de la tarjeta (directorio, finanzas, administración). | `fetchRestaurants` |
| GET | `/owner/restaurants/:id` | sesión y acceso | Detalle de la sede. | `fetchRestaurantById` |
| POST | `/owner/restaurants` | `org.manage` | Alta de sede: `{ name, code, city, address, category, categoryLabel, cuisine, currency, timezone, lat, lng, floorsCount, … }`. | `createRestaurant` + POST `/siteOperations` + `grantRestaurantAccess` |
| PATCH | `/owner/restaurants/:id` | `org.manage` | Edita la sede, incluido su `status` (activa o suspendida). | `updateRestaurant` |

Al crear una sede, el backend genera el `slug`, crea su registro operativo (plano vacío con `floorsCount` pisos) y **da acceso a la sede al usuario que la creó**. Todo en una sola transacción.

### 4.2 Sala, mesas y QR

Pantalla: Gestión de mesas.

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/restaurants/:id/operation` | sesión y acceso | Plano: `floors[]`, `tables[]` y los datos del panel (`kpis`, `shiftLabel`, `staff`, `stations`, `alerts`…). Cada mesa trae `number`, `code`, `floorId`, `seats`, `status` (`active` \| `maintenance` \| `inactive`), `floorStatus`, `qrToken` y `qrActive`. | `fetchSiteOperation` |
| PUT | `/owner/restaurants/:id/floors` | `sites.manage` | Crear, renombrar o quitar pisos. Recibe `{ floors }`. Al quitar un piso, el backend mueve sus mesas a otro. | `updateSiteOperationFloors` |
| POST | `/owner/restaurants/:id/tables` | `sites.manage` | Crea una mesa: `{ number, seats, floorId }`. El backend genera `qrToken`. El número debe ser único en la sede. | `updateSiteOperationTables` (reemplaza el arreglo completo) |
| PATCH | `/owner/restaurants/:id/tables/:number` | `sites.manage` | Edita asientos, piso (arrastrar a otro piso), estado o `qrActive`. | ídem |
| POST | `/owner/restaurants/:id/tables/:number/qr` | `sites.manage` | Regenera el `qrToken`, lo que invalida el QR impreso. | ídem |
| DELETE | `/owner/restaurants/:id/tables/:number` | `sites.manage` | Elimina la mesa. Debe responder `422` si tiene una atención activa. | ídem |

La ocupación de la sala ("Mesas ocupadas", "Cubiertos", "Por cobrar") hoy la calcula el front con las atenciones (ver 4.3). Puede quedarse así, o el backend puede devolverla en `operation.kpis`.

### 4.3 Pedidos, tablero y cocina

Pantallas: Gestión de pedidos (tablero y lista), cola de cocina y detalle de la atención.

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/restaurants/:id/attentions?status=active` | `orders.manage` o `kitchen.manage` o `payments.manage` | Atenciones **con sus productos**. Es la fuente del tablero, la lista, la cocina, la ocupación de la sala y los badges del menú lateral. Se consulta cada 8 s. Con `status=all&from=&to=` sirve para el historial. | `fetchAttentionsWithProductsBySite` |
| GET | `/owner/attentions/:id` | ídem | Una atención con sus productos y pagos. | `fetchAttentionById` + productos + pagos |
| GET | `/owner/attentions/:id/timeline` | ídem | Historial de la atención y de todos sus productos, en orden cronológico (ticket del pedido). | `fetchAttentionTimeline` |
| POST | `/owner/restaurants/:id/tables/:number/attentions` | `orders.manage` | **Pedido manual:** abre la atención de la mesa o reutiliza la activa. Igual que 1.4, pero sin token de QR. | `openOrReuseAttention` |
| POST | `/owner/attentions/:id/rounds` | `orders.manage` | Ronda cargada por el personal: `{ batchId, items }`. Los productos entran **directo como `preparing`** y se registra quién los cargó (`createdBy`). | `addOrderedProducts` |
| PATCH | `/owner/ordered-products/:id/status` | según la transición (ver abajo) | Recibe `{ fromStatus, toStatus, reason? }`. Avanza, rechaza o cancela un producto. | `updateOrderedProductStatus` |
| POST | `/owner/ordered-products/status` | ídem | Cambio masivo: recibe `{ items: [{ id, fromStatus }], toStatus, reason? }` y responde `{ updated[], failed[{ id, message }] }`. Lo usan "Confirmar todo" y "Marcar listos". | `updateOrderedProductsStatus` |
| POST | `/owner/attentions/:id/close` | `payments.manage` | Cierra la cuenta. | `closeAttention` |
| POST | `/owner/attentions/:id/cancel` | `orders.manage` | Recibe `{ reason }` y cancela la atención completa. | `cancelAttention` |

Transiciones de un producto (`src/modules/orders/order-status-labels.ts`):

| Desde | Hacia | Permiso |
| --- | --- | --- |
| `sent` | `preparing` (confirmar), `rejected`, `cancelled` | `orders.manage` |
| `preparing` | `ready`, `cancelled` | `kitchen.manage` |
| `ready` | `delivered`, `cancelled` | `orders.manage` |
| `delivered`, `rejected`, `cancelled` | ninguna (estado final) | |

El backend debe validar:

- **Control optimista:** si el estado actual no coincide con `fromStatus`, responde `409` con un mensaje del tipo "ya cambió de estado". El front recarga la pantalla.
- `rejected` y `cancelled` exigen `reason`.
- **Cada cambio de estado escribe historial:** `entityType`, `entityId`, `fromStatus`, `toStatus`, `userName`, `reason` y `changedAt`. Aplica a productos y a atenciones.
- **Cerrar:** solo si el saldo pendiente es 0. Si ya estaba cerrada, devuelve la atención sin error.
- **Cancelar:**
  - requiere motivo;
  - no se permite si hay pagos `paid` (hay que reembolsarlos antes);
  - cancela también los productos facturables que aún no se entregaron.

### 4.4 Cuentas y cobros (registro manual)

Pantallas: Cuentas y el diálogo de cuenta.

Aquí se **registran** cobros que ya ocurrieron en el local: efectivo, POS, Yape o Plin escaneado o transferencia. No hay integración con ninguna pasarela.

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/attentions/:id/account` | `payments.manage` | Cuenta: productos facturables con lo pagado y lo pendiente por producto, los pagos, `total`, `paid` y `remaining`. | `computeAccount` sobre productos y pagos |
| GET | `/owner/restaurants/:id/payments?from=&to=` | `payments.manage` o `reports.view` | Pagos del periodo (métricas y cierre del día). | `fetchAllPayments` (todos, filtrados en el front) |
| POST | `/owner/attentions/:id/payments` | `payments.manage` | Registra un pago. Recibe `{ requestId, amount, method: 'cash' \| 'card' \| 'yape' \| 'plin' \| 'transfer' \| 'other', status, payerName, externalReference?, allocations: [{ orderedProductId, amount }] }`. | `createPayment` |
| PATCH | `/owner/payments/:id/status` | `payments.manage` | Recibe `{ status }`. | `updatePaymentStatus` |

El backend debe validar:

- **Idempotencia por `requestId`:** si llega repetido, devuelve el pago existente.
- La atención debe estar activa y el monto debe ser mayor que 0.
- Un pago `paid` no puede superar el saldo pendiente.
- Cada `allocation` no puede superar lo pendiente de su producto, y no se puede asignar a productos rechazados o cancelados.
- Si hay allocations, su suma debe ser igual al monto.
- Transiciones de pago:

| Desde | Hacia |
| --- | --- |
| `pending` | `processing`, `paid`, `failed`, `cancelled` |
| `processing` | `paid`, `failed`, `cancelled` |
| `paid` | `refunded` |

  Pasar a `paid` vuelve a validar el saldo.

### 4.5 Carta (administración)

Pantalla: Menú de la sede.

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/restaurants/:id/menus` | `menu.manage` | Menús de la sede con su estado. | `fetchMenus` |
| POST | `/owner/restaurants/:id/menus` | `menu.manage` | Recibe `{ name }`. | `createMenu` |
| PATCH | `/owner/menus/:id/status` | `menu.manage` | Recibe `{ status }`. **Solo puede haber un menú activo por sede:** al activar uno, el anterior pasa a inactivo. Responde con los menús afectados. | `updateMenuStatus` |
| GET | `/owner/restaurants/:id/menu-categories` | `menu.manage` | Categorías ordenadas por `position`. | `fetchMenuCategories` |
| POST | `/owner/restaurants/:id/menu-categories` | `menu.manage` | Recibe `{ menuId, name, description }`. | `createMenuCategory` |
| PATCH | `/owner/menu-categories/:id` | `menu.manage` | Edita la categoría. | `updateMenuCategory` |
| DELETE | `/owner/menu-categories/:id` | `menu.manage` | Elimina la categoría. Debe responder `422` si tiene productos. | `deleteMenuCategory` |
| PUT | `/owner/restaurants/:id/menu-categories/order` | `menu.manage` | Recibe `{ ids: [] }`. Reordena todas en una sola petición. | `reorderMenuCategories` (un PATCH por categoría) |
| GET | `/owner/restaurants/:id/menu-products` | `menu.manage` | Todos los productos, incluidos los inactivos. También lo usan el pedido manual y el ticket. | `fetchMenuProducts` |
| POST | `/owner/restaurants/:id/menu-products` | `menu.manage` | Recibe nombre, descripciones, precio, categoría, imagen, tags, alérgenos, ingredientes, porción, presentación, `prepMinutes`, `isAvailable` e `isActive`. | `createMenuProduct` |
| PATCH | `/owner/menu-products/:id` | `menu.manage` | Edición completa, o rápida: `{ isAvailable }` para "Agotado" e `{ isActive }`. | `updateMenuProduct` / `patchMenuProduct` |
| DELETE | `/owner/menu-products/:id` | `menu.manage` | Elimina el producto. | `deleteMenuProduct` |
| PUT | `/owner/menu-categories/:id/products/order` | `menu.manage` | Recibe `{ ids: [] }` para reordenar los productos de una categoría. | `reorderMenuProducts` |
| POST | `/owner/uploads/images` | `menu.manage` | Recibe la imagen en `multipart/form-data` y responde `{ url }`. | Hoy la imagen se guarda como **data URL** dentro del producto (`imageFileToDataUrl`) |

El backend debe mantener el campo de búsqueda (`searchText`) para 1.3.

### 4.6 Insumos e inventario

Pantallas: Insumos (de la sede) e Inventario (de toda la cadena, en Administración).

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/restaurants/:id/supplies` | `inventory.manage` | Insumos de la sede: `name`, `unit`, `stock`, `minStock`, `status`, `supplier`, `category`, `unitCost`, `isActive` y `updatedAt`. | `fetchSupplies` |
| GET | `/owner/supplies?restaurantId=` | `inventory.manage` | Vista de toda la cadena (Administración → Inventario). | `fetchInventoryItems` |
| POST | `/owner/restaurants/:id/supplies` | `inventory.manage` | Crea un insumo. | `createSupply` / `createInventoryItem` |
| PATCH | `/owner/supplies/:id` | `inventory.manage` | Edita el insumo o el ajuste rápido de stock. | `updateSupply` / `updateInventoryItem` / `updateInventoryStock` |
| GET | `/owner/restaurants/:id/supply-movements` | `inventory.manage` | Historial de movimientos. | `fetchMovements` |
| POST | `/owner/supplies/:id/movements` | `inventory.manage` | Recibe `{ type: 'purchase' \| 'usage' \| 'waste' \| 'count', quantity, unitCost?, supplier?, reason, registerExpense }` (entrada, salida, merma o conteo) y responde `{ supply, movement }`. | `registerMovement` |

El backend debe calcular `status` a partir de `stock` y `minStock`. Un movimiento no puede dejar el stock negativo.

El movimiento es **una sola transacción**:

1. Si es una compra con `registerExpense`, crea el gasto en la categoría `supplies` y guarda `expenseId`.
2. Actualiza el stock, el costo y el proveedor.
3. Guarda el movimiento con `delta` y `stockAfter`.

### 4.7 Gastos

Pantalla: Finanzas de la sede (gastos).

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/restaurants/:id/expenses?from=&to=` | `reports.view` | Gastos del periodo. | `fetchExpenses` |
| POST | `/owner/restaurants/:id/expenses` | `reports.view` | Recibe `{ category, kind, description, amount, date, supplier, paymentMethod, notes }`. El backend registra `createdBy`. | `createExpense` |
| PATCH | `/owner/expenses/:id` | `reports.view` | Edita el gasto. | `updateExpense` |
| DELETE | `/owner/expenses/:id` | `reports.view` | Elimina el gasto. | `deleteExpense` |
| GET | `/owner/expense-categories` | `reports.view` | Categorías con **`expenseCount`** incluido. | `fetchExpenseCategories` + `countExpensesByCategory` (descarga **todos** los gastos) |
| POST | `/owner/expense-categories` | `reports.view` | Recibe `{ name, hint, defaultKind, icon }`. | `createExpenseCategory` |
| PATCH | `/owner/expense-categories/:id` | `reports.view` | Edita la categoría. | `updateExpenseCategory` |
| DELETE | `/owner/expense-categories/:id?moveTo=:otraId` | `reports.view` | Elimina la categoría y mueve sus gastos a `moveTo` en la misma transacción. | `deleteExpenseCategory` (un PATCH por gasto) |

### 4.8 Reportes

Pantallas: Métricas, Cierre del día y Finanzas.

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/restaurants/:id/metrics?from=&to=` | `reports.view` | Ventas, pedidos, ticket promedio, tiempos por etapa y productos más vendidos. | Lo calcula el front con **todas** las atenciones, productos, pagos y `statusHistory` (`SiteMetricsView`) |
| GET | `/owner/restaurants/:id/daily-closings` | `reports.view` | Cierres guardados, del más reciente al más antiguo. | `fetchDailyClosings` |
| GET | `/owner/restaurants/:id/daily-closings/:date/summary` | `reports.view` | Resumen calculado del día: `totalPaid`, atenciones cerradas, canceladas y abiertas, y `byMethod`. | Lo calcula el front con atenciones y pagos |
| PUT | `/owner/restaurants/:id/daily-closings/:date` | `reports.view` | Guarda el cierre del día. Si ya existía para esa fecha, lo reemplaza. El backend registra `closedBy`. | `saveDailyClosing` |
| GET | `/owner/finance/daily?from=&to=&restaurantId=` | `reports.view` | Serie diaria por sede: `revenue`, `orders`, `guests`, `foodCost`, `laborCost`, `operatingCost`, `profit`, `byMethod` y `expenses`. Sin `restaurantId`, trae todas las sedes con acceso. | `fetchDailyFinancials` |

Las métricas y el resumen del cierre pueden seguir calculándose en el front al principio. Pero **no escala** descargar todo el historial, así que estos dos endpoints deberían existir antes de tener datos reales.

---

## 5. Portal: administración de la organización

| Método | Ruta | Permiso | Uso en el front | Hoy |
| --- | --- | --- | --- | --- |
| GET | `/owner/employees` | `staff.manage` | Empleados: nombre, email, teléfono, rol, sede, área, estado, fecha de alta y `userId`. | `fetchEmployees` |
| POST | `/owner/employees` | `staff.manage` | Crea un empleado, opcionalmente vinculado a un usuario. | `createEmployee` + `syncEmployeeUserLink` |
| PATCH | `/owner/employees/:id` | `staff.manage` | Edita el empleado. Si cambia `userId`, el backend actualiza el vínculo en los dos lados. | `updateEmployee` + `syncEmployeeUserLink` |
| DELETE | `/owner/employees/:id` | `staff.manage` | Elimina el empleado y desvincula a su usuario. | `deleteEmployee` |
| GET | `/owner/roles` | `users.manage` | Roles con `permissions[]` y `employeeCount`. | `fetchRoles` |
| POST | `/owner/roles` | `users.manage` | Recibe `{ name, description, permissions }`. | `createRole` |
| PATCH | `/owner/roles/:id` | `users.manage` | Edita el rol. | `updateRole` |
| DELETE | `/owner/roles/:id` | `users.manage` | Elimina el rol. Debe responder `422` si tiene usuarios asignados. | `deleteRole` |
| GET | `/owner/users` | `users.manage` | Usuarios con rol, sedes, empleado vinculado, `isActive` e `isBlocked`. **Sin contraseña.** | `fetchUsers` |
| PATCH | `/owner/users/:id` | `users.manage` | Recibe `{ roleId, restaurantIds, employeeId }`. El vínculo con el empleado es exclusivo (un empleado, un usuario) y se actualiza en los dos lados. | `updateUserAccess` (varios PATCH) |
| PATCH | `/owner/users/:id/status` | `users.manage` | Recibe `{ isActive?, isBlocked? }`. Un usuario bloqueado pierde la sesión en su siguiente `GET /owner/me`. | `updateUserActive` / `updateUserBlocked` |

---

## 6. Fuera de este documento

- **Pasarela de pagos.** Los métodos online del checkout del comensal (`CardPayment`, `WalletPayment`, `TransferPayment`, `CashPayment` en `src/modules/payments/components/methods/`) y la pantalla `PaymentMethodView` son **solo visuales**: no llaman a ninguna API y quedan para cuando se integre una pasarela.
  - Lo que **sí** está arriba es el registro manual de cobros del personal (4.4) y la consulta de pagos del comensal (1.4).
- **Recojo y delivery.** `FulfillmentView` y `CheckoutView` arman el pedido en el store `checkout`, pero todavía no lo envían. Sus endpoints están diseñados en [endpoints-comensal.md](endpoints-comensal.md) y se sumarán junto con la pasarela.

---

## 7. Resumen

| Bloque | Endpoints |
| --- | --- |
| Comensal público (restaurantes, QR, carta, atención) | 12 |
| Cuenta del comensal | 6 |
| Sesión y perfil del personal | 6 |
| Organización y sedes | 6 |
| Sala, mesas y QR | 6 |
| Pedidos, tablero y cocina | 9 |
| Cuentas y cobros | 4 |
| Carta (administración) | 14 |
| Insumos | 6 |
| Gastos | 8 |
| Reportes | 5 |
| Administración (empleados, roles, usuarios) | 11 |
| **Total** | **93** |
