# Endpoints actuales

Inventario de los **213 endpoints** que existen hoy en el código, con lo que hace cada uno y quién puede llamarlo. Generado a partir de los controllers de la rama `feat/migrar-arquitectura-ddd` el 2026-11-01. Las rutas que pidió el front y cómo se llaman acá están en [equivalencias-front.md](equivalencias-front.md).

Swagger interactivo en `/docs`. Para la API objetivo ver [comensales.md](comensales.md) y [restaurant.md](restaurant.md).

## Cómo leer las tablas

**Columna Acceso** (quién puede llamar la ruta):

| Valor | Significado |
|---|---|
| `público` | No requiere login |
| `comensal` | Ruta pública del comensal: login opcional. Se identifica con `Authorization: Bearer` (usuario) o con `X-Guest-Token` (invitado). Solo los participantes de la atención pueden verla o modificarla (403) |
| `sesión` | Requiere `Authorization: Bearer <accessToken>` |
| `plataforma` | Solo usuarios con `users.is_platform_admin` (403 `PLATFORM_ADMIN_REQUIRED`). El flag se activa solo en la base |
| `miembro` | `@Authorize(null, ...)`: basta tener una membresía activa en la organización/sede del recurso |
| `<área>.manage`, `<área>.read` | `@Authorize(permiso, ...)`: membresía en la organización/sede **y** ese permiso en el rol (ver [autorizacion.md](../autorizacion.md)) |

Sin política no hay ninguna ruta: el `AuthorizationGuard` global niega por defecto y el e2e de autorización falla si alguna queda sin declarar.

**Resumen de acceso hoy:**

| Acceso | Rutas |
|---|---|
| `público` / `comensal` | 24 |
| `plataforma` | 19 |
| `sesión` | 16 |
| `miembro` | 42 |
| Con permiso (`<área>.manage` / `<área>.read`) | 112 |

**Convenciones generales:**

- Respuesta estándar: `{ success, statusCode, message, data, timestamp, path }`. Los errores agregan `errorCode` estable (por ejemplo `INSUFFICIENT_STOCK`, `QR_INVALID`).
- Todos los `:id` son UUID.
- `DELETE` hace **baja lógica** (la entidad queda inactiva), salvo en asociaciones puras (permisos de un rol, productos de un menú, categorías e ingredientes de un producto, líneas de receta), que se borran.
- Listados paginados: `?page=` (desde 1) y `?limit=` (por defecto 20, máximo 100). Devuelven `{ items, meta: { page, limit, total, totalPages } }`.
- No hay prefijo global: auth y rutas del comensal viven en `/api/v1/...`; el resto, en la raíz.

---

## 1. Sistema

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/` | `público` | Health check: devuelve un saludo |

---

## 2. Identidad y acceso (IAM)

Una sola identidad (`users`) sirve para comensales y personal. Lo que un usuario puede hacer en cada organización lo define su **membresía** (rol + sedes). Access token de 15 min y refresh de 30 días con rotación de un solo uso.

### 2.1 Auth del dueño y del personal (`/api/v1/owner/auth`)

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/api/v1/owner/auth/register` | `público` | Alta del dueño en una sola transacción: usuario + organización + rol `OWNER` (con todos los permisos activos) + membresía con acceso a todas las sedes + primera sede opcional. Si algo falla no queda nada creado. Devuelve la sesión y los ids |
| POST | `/api/v1/owner/auth/login` | `público` | Login con email y contraseña (dueño y personal). Usuarios `INACTIVE`/`BLOCKED` reciben 403 |
| POST | `/api/v1/owner/auth/refresh` | `público` | Rota el refresh token y emite un par nuevo; el anterior deja de servir. De dos refresh simultáneos con el mismo token solo uno gana |
| POST | `/api/v1/owner/auth/logout` | `sesión` | Invalida el refresh token |
| POST | `/api/v1/owner/auth/forgot-password` | `público` | Genera un token para restablecer la contraseña |
| POST | `/api/v1/owner/auth/reset-password` | `público` | Cambia la contraseña con el token recibido |

### 2.2 Auth del comensal (`/api/v1/customer/auth`)

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/api/v1/customer/auth/register` | `público` | Crea usuario + perfil de comensal (`email`, `password`, `firstName`, `lastName?`, `phone?`, `dietaryPreferences?`) y devuelve la sesión |
| POST | `/api/v1/customer/auth/login` | `público` | Login con email y contraseña |
| POST | `/api/v1/customer/auth/refresh` | `público` | Renueva el access token con el refresh token (misma rotación que el personal) |
| POST | `/api/v1/customer/auth/logout` | `sesión` | Invalida el refresh token |
| POST | `/api/v1/customer/auth/forgot-password` | `público` | Genera un token para restablecer la contraseña |
| POST | `/api/v1/customer/auth/reset-password` | `público` | Restablece la contraseña con el token |

### 2.3 Perfil propio

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/api/v1/owner/me` | `sesión` | Devuelve el usuario autenticado |
| PATCH | `/api/v1/owner/me` | `sesión` | Edita `firstName`, `lastName`, `phone` |
| PATCH | `/api/v1/owner/me/password` | `sesión` | Cambia la contraseña; pide la actual |
| GET | `/api/v1/owner/me/profile` | `sesión` | 🆕 Perfil del personal en una llamada: usuario, `access` por organización (rol, `allRestaurants`/`restaurantIds` y permisos efectivos; un OWNER siempre los tiene todos) y `employments` (empleados vinculados con puesto y área) |
| GET | `/api/v1/customer/me` | `sesión` | Perfil del comensal con sus preferencias alimentarias |
| PATCH | `/api/v1/customer/me` | `sesión` | Actualiza datos personales y preferencias alimentarias |
| PATCH | `/api/v1/customer/me/password` | `sesión` | 🆕 `{ currentPassword, newPassword }`. Contraseña actual incorrecta → 401 `INVALID_CREDENTIALS` (igual que el personal) |
| GET | `/api/v1/customer/me/attentions` | `sesión` | 🆕 "Mis visitas", paginado y de la más reciente a la más antigua: atenciones donde el usuario es el cliente o participó con su cuenta (las de invitado no se ligan), con la sede (`id`, `name`, `slug`), los productos cobrables, `total`, `paid` y `balance` |

### 2.4 Usuarios

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/users` | `sesión` | Crea un usuario. `mustChangePassword` para contraseñas temporales |
| GET | `/users` | `plataforma` | Lista paginada de todos los usuarios (datos personales de todas las cuentas) |
| GET | `/users/:id` | `plataforma` | Un usuario |
| PATCH | `/users/:id` | `plataforma` | Actualiza datos, email, contraseña o `status` (`ACTIVE`/`INACTIVE`/`BLOCKED`) |
| DELETE | `/users/:id` | `plataforma` | Baja lógica |

### 2.5 Roles y permisos

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/roles` | `staff.manage` | Crea un rol de una organización. `code` único por organización, se guarda en mayúsculas |
| GET | `/roles?organizationId=` | `staff.read` | Lista paginada de roles |
| GET | `/roles/:id` | `staff.read` | Un rol |
| PATCH | `/roles/:id` | `staff.manage` | Actualiza un rol |
| DELETE | `/roles/:id` | `staff.manage` | Baja lógica |
| GET | `/roles/:id/permissions` | `staff.read` | Permisos asignados al rol (sin paginar) |
| POST | `/roles/:id/permissions` | `staff.manage` | Asigna un permiso al rol |
| DELETE | `/roles/:id/permissions/:permissionId` | `staff.manage` | Revoca el permiso (borrado físico de la asociación) |
| POST | `/permissions` | `plataforma` | Crea un permiso. `code` global en minúsculas (`orders.manage`) |
| GET | `/permissions` | `sesión` | Lista paginada de permisos |
| GET | `/permissions/:id` | `sesión` | Un permiso |
| PATCH | `/permissions/:id` | `plataforma` | Actualiza un permiso |
| DELETE | `/permissions/:id` | `plataforma` | Baja lógica |

### 2.6 Membresías

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/memberships` | `staff.manage` | Vincula usuario + organización + rol + alcance: `allRestaurants=true` o `restaurantIds` (lista vacía = sin acceso a sedes). Rol y sedes deben ser de la misma organización |
| GET | `/memberships?organizationId=&userId=` | `staff.read` | Lista paginada |
| GET | `/memberships/:id` | `staff.read` | Una membresía |
| PATCH | `/memberships/:id` | `staff.manage` | Cambia rol, sedes o estado |
| DELETE | `/memberships/:id` | `staff.manage` | Baja lógica |

---

## 3. Organizaciones y sedes

### 3.1 Organizaciones y restaurantes

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/organizations` | `plataforma` | Crea una organización. `taxIdentifier` único; moneda y zona por defecto `PEN` / `America/Lima` |
| GET | `/organizations` | `sesión` | Lista paginada de las organizaciones del usuario (todas si es admin de plataforma) |
| GET | `/organizations/:id` | `miembro` | Una organización |
| PATCH | `/organizations/:id` | `organizations.manage` | Actualiza una organización |
| DELETE | `/organizations/:id` | `organizations.manage` | Baja lógica |
| POST | `/restaurants` | `restaurants.manage` | Crea una sede. `slug` y `code` se generan si no se envían; hereda moneda y zona de la organización. Al crearse se le generan los estados y tipos de servicio por defecto |
| GET | `/restaurants?organizationId=` | `miembro` | Lista paginada de sedes |
| GET | `/restaurants/:id` | `miembro` | Una sede |
| PATCH | `/restaurants/:id` | `restaurants.manage` | Actualiza una sede |
| DELETE | `/restaurants/:id` | `restaurants.manage` | Baja lógica |

### 3.2 Pisos y mesas

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/restaurant-floors` | `restaurants.manage` | Crea un piso. Nombre único por sede |
| GET | `/restaurant-floors?restaurantId=` | `miembro` | Lista paginada de pisos |
| GET | `/restaurant-floors/:id` | `miembro` | Un piso |
| PATCH | `/restaurant-floors/:id` | `restaurants.manage` | Actualiza un piso |
| DELETE | `/restaurant-floors/:id` | `restaurants.manage` | Baja lógica; solo si el piso no tiene mesas |
| POST | `/dining-tables` | `restaurants.manage` | Crea una mesa en un piso (la sede sale del piso) |
| GET | `/dining-tables?restaurantId=&floorId=` | `miembro` | Lista paginada de mesas |
| GET | `/dining-tables/:id` | `miembro` | Una mesa. Incluye `qr: { active, version, generatedAt, assetUrl }`, nunca el token |
| PATCH | `/dining-tables/:id` | `restaurants.manage` | Actualiza la mesa y sus estados: `operationalStatus` (`ACTIVE`/`INACTIVE`/`MAINTENANCE`) y `serviceStatus` (`AVAILABLE`/`RESERVED`/`CLEANING`). "Ocupada" no se guarda: es tener una atención activa |
| DELETE | `/dining-tables/:id` | `restaurants.manage` | Baja lógica |
| POST | `/dining-tables/:id/qr-code` | `restaurants.manage` | Genera o regenera el QR (`{ assetUrl? }`): crea un token seguro, guarda solo su SHA-256 e incrementa la versión, así que el QR anterior deja de funcionar. **`token` y `qrUrl` solo vienen en esta respuesta** |
| DELETE | `/dining-tables/:id/qr-code` | `restaurants.manage` | Revoca el QR: la mesa queda sin QR válido |

### 3.3 Áreas, puestos y empleados

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/work-areas` | `staff.manage` | Crea un área laboral (Cocina, Sala...). Nombre único por organización sin distinguir mayúsculas |
| GET | `/work-areas?organizationId=&isActive=` | `miembro` | Lista paginada |
| GET | `/work-areas/:id` | `miembro` | Un área |
| PATCH | `/work-areas/:id` | `staff.manage` | Edita, activa o desactiva (`isActive`) |
| DELETE | `/work-areas/:id` | `staff.manage` | Baja lógica; puestos y empleados pueden seguir apuntando a ella |
| POST | `/job-positions` | `staff.manage` | Crea un puesto dentro de un área (la organización sale del área). Nombre único por área |
| GET | `/job-positions?organizationId=&workAreaId=&isActive=` | `miembro` | Lista paginada |
| GET | `/job-positions/:id` | `miembro` | Un puesto |
| PATCH | `/job-positions/:id` | `staff.manage` | Edita, mueve de área, activa o desactiva |
| DELETE | `/job-positions/:id` | `staff.manage` | Baja lógica; no afecta a los empleados que ya lo tienen, solo deja de poder asignarse |
| POST | `/employees` | `staff.manage` | Registra un empleado. `userId` opcional (empleado sin acceso al sistema); `employeeCode` único por organización; `jobPositionId` activo y de la misma organización. **El puesto nunca da permisos** |
| GET | `/employees?organizationId=` | `staff.read` | Lista paginada |
| GET | `/employees/:id` | `staff.read` | Un empleado |
| PATCH | `/employees/:id` | `staff.manage` | Actualiza un empleado |
| DELETE | `/employees/:id` | `staff.manage` | Baja lógica |

---

## 4. Catálogo

### 4.1 Categorías

Por organización y en árbol (`parentCategoryId`): Comidas > Carnes > Parrillas.

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/categories` | `catalog.manage` (organización del body) | Crea una categoría. El padre debe ser de la misma organización; nombre único dentro del mismo padre |
| GET | `/categories?organizationId=&parentCategoryId=&rootOnly=&isActive=` | `miembro` | Lista paginada. Exige `organizationId` o `parentCategoryId` para saber la organización |
| GET | `/categories/:id` | `miembro` | Una categoría |
| PATCH | `/categories/:id` | `catalog.manage` | Renombra, mueve o activa/desactiva. `parentCategoryId: null` la vuelve raíz; no se permiten ciclos |
| DELETE | `/categories/:id` | `catalog.manage` | Baja lógica: quien ya la usa la conserva, pero no se pueden crear enlaces nuevos |

### 4.2 Productos

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/products` | `catalog.manage` (sede del body) | Crea un producto en una sede, opcionalmente con `categoryIds` (validados antes de guardar) |
| GET | `/products?restaurantId=&categoryId=` | `miembro` | Lista paginada; `categoryId` filtra por categoría |
| GET | `/products/:id` | `miembro` | Un producto |
| PATCH | `/products/:id` | `catalog.manage` | Actualiza precio, `status` (`ACTIVE`/`INACTIVE`), `isAvailable` (agotado hoy), `isTakeawayAllowed` / `isDeliveryAllowed` |
| DELETE | `/products/:id` | `catalog.manage` | Baja lógica |
| GET | `/products/:id/categories` | `miembro` | Categorías del producto (sin paginar) |
| POST | `/products/:id/categories` | `catalog.manage` | `{ categoryId }`: agrega una categoría activa de la organización de la sede |
| DELETE | `/products/:id/categories/:categoryId` | `catalog.manage` | Quita el producto de la categoría |
| GET | `/products/:productId/ingredients` | `miembro` | Ingredientes visibles en la carta |
| POST | `/products/:productId/ingredients` | `catalog.manage` | Agrega un ingrediente (`isVisible`). Son informativos: no afectan el stock ni declaran alérgenos |
| PATCH | `/products/:productId/ingredients/:ingredientId` | `catalog.manage` | Edita un ingrediente |
| DELETE | `/products/:productId/ingredients/:ingredientId` | `catalog.manage` | Elimina un ingrediente |

### 4.3 Menús y secciones

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/menus` | `catalog.manage` (sede del body) | Crea un menú |
| GET | `/menus?restaurantId=` | `miembro` | Lista paginada |
| GET | `/menus/:id` | `miembro` | Un menú |
| PATCH | `/menus/:id` | `catalog.manage` | Actualiza, incluidos `status` (`DRAFT`/`ACTIVE`/`INACTIVE`) y vigencia `validFrom`/`validUntil` |
| DELETE | `/menus/:id` | `catalog.manage` | Baja lógica |
| GET | `/menus/:id/products` | `miembro` | Productos del menú |
| POST | `/menus/:id/products` | `catalog.manage` | Agrega un producto **de la misma sede**, con `menuSectionId` opcional y `displayPrice` (solo de exhibición) |
| PATCH | `/menus/:id/products/:productId` | `catalog.manage` | Cambia sección, precio mostrado, orden o visibilidad |
| PUT | `/menus/:id/products/order` | `catalog.manage` | 🆕 `{ menuSectionId?, productIds }`: nuevo orden de los productos de una sección (sin `menuSectionId`, los que no tienen sección). Debe traer todos los de esa lista una vez; si no, 400 `INVALID_REORDER` y no cambia nada. Una sola transacción |
| DELETE | `/menus/:id/products/:productId` | `catalog.manage` | Quita el producto del menú |
| GET | `/menus/:menuId/sections` | `miembro` | Secciones en orden (`sortOrder`) |
| POST | `/menus/:menuId/sections` | `catalog.manage` | Crea una sección (Entradas, Promociones...). Nombre único por menú; `categoryId` opcional para reutilizar una categoría |
| PATCH | `/menus/:menuId/sections/:sectionId` | `catalog.manage` | Edita, ordena u oculta |
| PUT | `/menus/:menuId/sections/order` | `catalog.manage` | 🆕 `{ ids }`: nuevo orden de todas las secciones del menú (incluidas las ocultas). Misma regla que el de productos |
| DELETE | `/menus/:menuId/sections/:sectionId` | `catalog.manage` | Baja lógica; sus productos siguen en el menú |

### 4.4 Carrito del comensal

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/api/v1/restaurants/:slug/cart/validate` | `público` | `{ serviceType, items[{ productId, quantity, unitPrice? }] }`. Devuelve líneas con el **precio del servidor**, `subtotal`, `deliveryFee`, `total`, `minimumAmount` y problemas por producto (`PRODUCT_NOT_FOUND`, `PRODUCT_INACTIVE`, `PRODUCT_UNAVAILABLE`, `MODE_NOT_ALLOWED`, `PRICE_CHANGED`...) y del pedido (`MODE_DISABLED`, `BELOW_MINIMUM`). No guarda nada |

---

### 4.5 Carta pública del comensal (`/api/v1/restaurants`) 🆕

Solo sedes activas: una inactiva responde 404 como si no existiera.

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/api/v1/restaurants` | `público` | Sedes activas, paginadas, con dirección, ubicación (`latitude`/`longitude`), moneda y `services`: sus tipos de servicio activos (`DINE_IN`, `PICKUP`, `DELIVERY`) con mínimo y costo de envío. No expone `organizationId` |
| GET | `/api/v1/restaurants/slug/:slug` | `público` | La misma ficha por slug (abrir la carta por URL) |
| GET | `/api/v1/restaurants/:id` | `público` | La misma ficha por id |
| GET | `/api/v1/restaurants/:id/menu` | `público` | Carta vigente: el menú `ACTIVE` dentro de su vigencia (si hay varios, el que empezó más tarde; empate: el editado más recientemente), sus secciones activas en orden y sus productos visibles y activos, por orden de sección (sin sección al final) y luego orden en el menú. Cada producto trae `price` (lo que se cobra), `displayPrice` y `isAvailable` (los agotados se listan con `false`). Sin menú vigente: `menu: null` y listas vacías |
| GET | `/api/v1/restaurants/:id/menu/search?q=&limit=6` | `público` | Sugerencias del buscador sobre la carta vigente: nombre y descripción, sin distinguir mayúsculas ni tildes. Primero las que empiezan por el texto, luego las que lo tienen en una palabra del nombre, en el nombre y en la descripción. `limit` entre 1 y 20 |

---

## 5. Atención (visita, órdenes y platos)

Modelo: **atención** (la visita o cuenta) → **órdenes** (cada comanda o ronda) → **ítems** (cada plato, con su estado e historial). Cada sede configura sus propios estados, pero cada uno pertenece a un **estado canónico**:

- Atención: `OPEN` → `BILL_REQUESTED` → `CLOSED`, o `CANCELLED`.
- Orden (se calcula a partir de sus ítems): `SUBMITTED` → `CONFIRMED` → `IN_PREPARATION` → `READY` → `SERVED`, o `CANCELLED`.
- Plato: `SUBMITTED` → `IN_PREPARATION` → `READY` → `SERVED`, o `REJECTED` / `CANCELLED`.

Una mesa tiene como máximo una atención activa (`OPEN` o `BILL_REQUESTED`), garantizado también ante envíos simultáneos.

### 5.1 Configuración de la sede

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/attention-statuses?restaurantId=` | `miembro` | Estados comerciales de la sede (activos e inactivos) |
| POST | `/attention-statuses` | `settings.manage` (sede del body) | `{ restaurantId, code, name, canonicalState, color?, sortOrder, isInitial? }` |
| PATCH | `/attention-statuses/:id` | `settings.manage` | Renombra, ordena, marca inicial o desactiva. No se puede desactivar el inicial ni el último activo de su estado canónico (422) |
| GET | `/order-statuses?restaurantId=` | `miembro` | Estados operativos de órdenes y platos |
| POST | `/order-statuses` | `settings.manage` (sede del body) | Crea un estado propio (p. ej. "En horno" con `canonicalState: IN_PREPARATION`) |
| PATCH | `/order-statuses/:id` | `settings.manage` | Igual que en estados de atención |
| GET | `/service-types?restaurantId=` | `miembro` | Tipos de servicio de la sede. Cada sede nueva tiene `DINE_IN` activo y `PICKUP`/`DELIVERY` inactivos |
| POST | `/service-types` | `settings.manage` (sede del body) | `{ restaurantId, code, name, fulfillmentMode, sortOrder, requiresTable?, requiresCustomerAddress?, minimumOrderAmount?, deliveryFee? }` |
| PATCH | `/service-types/:id` | `settings.manage` | Configura, ordena o retira (`isActive: false`) |

### 5.2 Personal: atenciones y órdenes

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/attentions` | `attentions.manage` | Abre una atención con `serviceTypeId` (o `fulfillmentMode`: toma el primer tipo activo de esa modalidad). Exige `diningTableId` si el tipo requiere mesa, y `fulfillment` (contacto y dirección) en recojo/delivery. Mesa ocupada → 409; tipo inactivo → 422. El costo de envío sale del tipo de servicio |
| GET | `/attentions?restaurantId=&status=` | `miembro` | Lista paginada; `status` es el estado canónico |
| GET | `/attentions/:id` | `miembro` | Detalle: participantes, órdenes (con su estado y sus platos) y datos de recojo/delivery |
| GET | `/attentions/:id/timeline` | `miembro` | 🆕 Historial de la atención, del más antiguo al más reciente: `ATTENTION_OPENED`, `ORDER_SUBMITTED`, `ORDER_CONFIRMED`, `ITEM_STATUS_CHANGED` (con producto, estado anterior y nuevo, quién y motivo), `BILL_REQUESTED`, `ATTENTION_CLOSED` / `ATTENTION_CANCELLED`. Se arma con lo guardado: solo se conoce el último pedido de cuenta |
| POST | `/attentions/:id/orders` | `attentions.manage` | Orden tomada por el mozo `{ requestId, items, submittedByUserId? }`. Nombre y precio se toman del catálogo y quedan congelados. Idempotente por `requestId`; si la cuenta estaba pedida, vuelve a `OPEN` |
| POST | `/attentions/orders/:orderId/confirm` | `attentions.manage` | Confirma una orden; solo desde `SUBMITTED` |
| POST | `/attentions/orders/:orderId/cancel` | `attentions.manage` | `{ reason }`. Cancela la orden completa si ningún plato se sirvió: sus platos pendientes pasan a `CANCELLED` con historial. La atención y sus otras órdenes no cambian. Ya servida o cancelada → 422 `ORDER_ALREADY_FINISHED` |
| GET | `/attentions/:id/bill` | `miembro` | Cuenta: ítems cobrables (sin rechazados ni cancelados), total, pagado y saldo |
| POST | `/attentions/:id/request-bill` | `attentions.manage` | Marca la cuenta como pedida (`BILL_REQUESTED`) |
| POST | `/attentions/:id/close` | `attentions.manage` | Cierra la atención; solo con saldo 0 (422 si no) |
| POST | `/attentions/:id/cancel` | `attentions.manage` | `{ reason }`. No permitido si hay pagos confirmados. Cancela también el recojo/delivery pendiente |
| PATCH | `/attentions/:id/fulfillment/status` | `attentions.manage` | `{ status, estimatedReadyAt? }`. Recojo: `PENDING`→`CONFIRMED`→`PREPARING`→`READY`→`COMPLETED`. Delivery agrega `OUT_FOR_DELIVERY` antes de `COMPLETED`. `CANCELLED` desde cualquier estado no final. Saltos → 409; `COMPLETED` registra `deliveredAt` |

### 5.3 Plano de la sala 🆕

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/floor-plan?restaurantId=` | `miembro` | Pisos y mesas de la sede (también inactivos). Cada mesa trae `occupancy` (`AVAILABLE`, `OCCUPIED`, `BILL_REQUESTED`, `UNAVAILABLE`) y su atención activa con `total`, `paid` y `balance`. `kpis`: mesas operativas, libres, ocupadas, asientos ocupados (capacidad), atenciones activas (con recojo/delivery), cuentas pedidas y saldo por cobrar. Pensado para consultarse cada pocos segundos: solo lee atenciones activas |

### 5.4 Personal: platos (tablero de cocina)

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/order-items?restaurantId=&status=&includeClosed=` | `miembro` | Tablero paginado. `status` acepta varios separados por coma (`SUBMITTED,IN_PREPARATION`). Por defecto solo platos de atenciones activas; `includeClosed=true` incluye cerradas y canceladas |
| GET | `/order-items/:id` | `miembro` | Un plato |
| PATCH | `/order-items/:id/status` | `kitchen.manage` | `{ statusId? \| status?, version?, reason?, changedByUserId? }`. Transiciones canónicas: `SUBMITTED`→`IN_PREPARATION`/`REJECTED`/`CANCELLED`, `IN_PREPARATION`→`READY`/`CANCELLED`, `READY`→`SERVED`/`CANCELLED`; dentro de un estado no final se puede pasar entre los estados propios de la sede. `REJECTED` exige `reason`. `version` distinta → 409 (otro empleado lo cambió). Recalcula el estado de su orden. Al entrar a `IN_PREPARATION` descuenta stock si el consumo automático está activo |
| POST | `/order-items/status` | `kitchen.manage` | 🆕 Cambio masivo ("Confirmar todo", "Marcar listos"): `{ restaurantId, items: [{ id, version? }], statusId? \| status?, reason? }`. Cada plato cambia por separado con las mismas reglas que el individual; los que no pueden (transición no permitida, versión distinta, de otra sede) van a `failed` con su `errorCode` y los demás siguen. Responde `{ updated, failed }`. Queda a nombre del usuario de la sesión |
| GET | `/order-items/:id/history` | `miembro` | Historial de estados del plato |

### 5.5 Comensal (`/api/v1`)

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/api/v1/tables/qr/:token` | `comensal` | Resuelve el QR: sede, mesa y atención activa si la hay. QR revocado → 404 `QR_INVALID` |
| POST | `/api/v1/attentions` | `comensal` | Primera orden: `{ serviceTypeId? \| fulfillmentMode?, tableToken?, restaurantId?, fulfillment?, requestId, items, displayName? }`. En mesa se une a la atención activa o la abre. Un invitado nuevo recibe `guestToken` en la respuesta |
| POST | `/api/v1/attentions/:id/orders` | `comensal` | Envía otra orden `{ requestId, items }`. Idempotente; si la cuenta estaba pedida, vuelve a `OPEN` |
| DELETE | `/api/v1/attentions/:id/items/:itemId` | `comensal` | Cancela un plato propio mientras siga `SUBMITTED` |
| GET | `/api/v1/attentions/:id` | `comensal` | Atención con sus órdenes y el estado de cada plato |
| GET | `/api/v1/attentions/:id/bill` | `comensal` | Cuenta: ítems, total, pagado y saldo |
| POST | `/api/v1/attentions/:id/request-bill` | `comensal` | Pide la cuenta |

---

## 6. Pagos

Un pago (`payments`) se reparte entre los productos de la atención o el costo de envío (`payment_allocations`). Solo los estados que cuentan reducen el saldo; los pendientes **reservan** su monto. El saldo se recalcula con un bloqueo por atención: cobros simultáneos nunca superan la deuda.

### 6.1 Personal

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/payments` | `payments.manage` | `{ attentionId, requestId, method, mode, amount?, allocations?, payerName?, provider?, ... }`. `mode`: `FULL` (todo el saldo), `AMOUNT` (monto libre) o `ITEMS` (`allocations` por producto; sin `orderItemId` = envío). En `FULL`/`AMOUNT` el servidor reparte por orden de creación y el envío al final; nunca confía en montos del cliente. Sin `provider` queda `PAID`; con `provider`, `PENDING` o el estado mapeado. Idempotente: 201 la primera vez, 200 al repetir. Errores: `PAYMENT_EXCEEDS_BALANCE`, `ALLOCATION_EXCEEDS_ITEM_BALANCE`, `ATTENTION_NOT_PAYABLE`, `UNMAPPED_PROVIDER_STATUS` |
| GET | `/payments?attentionId=&restaurantId=&status=` | `payments.read` | Lista paginada con asignaciones |
| GET | `/payments/:id` | `payments.read` | Un pago con sus asignaciones |
| GET | `/payments/balance/:attentionId` | `payments.read` | Por producto y envío: total, pagado, reservado (pagos pendientes) y pendiente |
| POST | `/payments/:id/cancel` | `payments.manage` | Cancela un intento `PENDING`/`PROCESSING` y libera lo reservado. Un pago confirmado no se cancela (422) |
| PATCH | `/payments/:id/status` | `payments.manage` | 🆕 `{ status }`: seguimiento manual de un pago `PENDING`/`PROCESSING` (p. ej. el voucher del POS salió aprobado o rechazado) → `PROCESSING`, `PAID`, `FAILED` o `CANCELLED`. Confirmar exige que la atención siga activa (422 `ATTENTION_NOT_PAYABLE`); el monto ya estaba reservado, así que nunca supera el saldo. Repetir el estado actual no cambia nada. Estados finales → 409 `INVALID_PAYMENT_TRANSITION`. Reembolsos → 422 `REFUNDS_NOT_ENABLED` |

### 6.2 Plataforma (`/platform`)

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/platform/payment-statuses` | `plataforma` | Catálogo global de estados internos (`PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED`) |
| PATCH | `/platform/payment-statuses/:code` | `plataforma` | Solo `{ name?, description? }`; el código y el efecto contable no cambian |
| GET | `/platform/payment-provider-status-mappings?providerCode=&isActive=` | `plataforma` | Mapeos de estado de pasarela → estado interno |
| POST | `/platform/payment-provider-status-mappings` | `plataforma` | `{ providerCode, externalStatus, paymentStatus }`; único por proveedor + estado externo |
| PATCH | `/platform/payment-provider-status-mappings/:id` | `plataforma` | `{ paymentStatus?, isActive? }`; afecta solo eventos futuros |
| POST | `/platform/payment-providers/:providerCode/events` | `plataforma` | `{ eventId, eventType, providerPaymentId?, externalStatus?, payload? }`. Traduce el estado con los mapeos y actualiza el pago. `eventId` repetido → 200 `duplicate: true`; estado que retrocede → `IGNORED`; sin mapeo → `FAILED`. Los webhooks públicos con firma se agregarán al integrar un proveedor |
| GET | `/platform/payment-provider-events?providerCode=` | `plataforma` | Auditoría paginada de eventos recibidos |

---

## 7. Inventario

Tres niveles: **insumo maestro** de la organización → **stock por sede** → **movimientos** inmutables.

### 7.1 Catálogos

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/units-of-measure` | `sesión` | Unidades de ACMR (KG, G, L, ML, UNIT) |
| GET | `/inventory-movement-types` | `sesión` | Tipos de movimiento y su efecto: `PURCHASE` (+), `USAGE` (−), `WASTE` (−), `COUNT_ADJUSTMENT_IN/OUT`, `MANUAL_ADJUSTMENT_IN/OUT`, `REVERSAL` |
| PATCH | `/platform/units-of-measure/:code` | `plataforma` | `{ name?, isActive? }`. La dimensión y el factor de conversión no cambian; una unidad desactivada no se usa en insumos nuevos |
| PATCH | `/platform/inventory-movement-types/:code` | `plataforma` | `{ name }`. El efecto sobre el stock no cambia |

### 7.2 Categorías e insumos maestros

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/inventory-categories` | `inventory.manage` | Crea una categoría por organización, con `description`. Nombre único sin distinguir mayúsculas |
| GET | `/inventory-categories?organizationId=` | `miembro` | Lista paginada |
| GET | `/inventory-categories/:id` | `miembro` | Una categoría |
| PATCH | `/inventory-categories/:id` | `inventory.manage` | Actualiza |
| DELETE | `/inventory-categories/:id` | `inventory.manage` | Baja lógica |
| POST | `/supplies` | `inventory.manage` | `{ organizationId, categoryId, code, name, unitCode, description? }`. Una vez por organización (código único en mayúsculas). Unidad inexistente → 404 `UNIT_OF_MEASURE_NOT_FOUND`. No guarda stock |
| GET | `/supplies?organizationId=&categoryId=&isActive=` | `miembro` | Lista paginada |
| GET | `/supplies/:id` | `miembro` | Un insumo |
| PATCH | `/supplies/:id` | `inventory.manage` | Actualiza. La unidad base solo cambia si ninguna sede tiene movimientos (422 `SUPPLY_UNIT_LOCKED`) |
| DELETE | `/supplies/:id` | `inventory.manage` | Baja lógica: las sedes conservan su historial, pero ya no se habilita en sedes nuevas |

### 7.3 Stock por sede y movimientos

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/restaurant-supplies` | `inventory.manage` | `{ restaurantId, supplyId, minimumQuantity? }`: habilita el insumo en la sede con stock 0. Sede e insumo de la misma organización; una vez por sede |
| GET | `/restaurant-supplies?restaurantId=&supplyId=&isActive=&lowStock=` | `miembro` | Stock paginado con `currentQuantity`, `minimumQuantity`, `averageUnitCost` y `lowStock` (saldo ≤ mínimo) |
| GET | `/restaurant-supplies/:id` | `miembro` | Stock de un insumo en una sede |
| PATCH | `/restaurant-supplies/:id` | `inventory.manage` | Solo `minimumQuantity` / `isActive`. **El saldo no se edita** |
| DELETE | `/restaurant-supplies/:id` | `inventory.manage` | Baja lógica; conserva el historial |
| POST | `/restaurant-supplies/:id/movements` | `inventory.manage` | `{ type, quantity, unitCost?, notes?, idempotencyKey? }` con tipo `PURCHASE`, `USAGE`, `WASTE` o `MANUAL_ADJUSTMENT_IN/OUT`. El tipo define el signo. Saldo y movimiento se guardan juntos con la fila bloqueada; una salida nunca deja stock negativo (422 `INSUFFICIENT_STOCK`). Compras con `unitCost` recalculan el costo promedio. `idempotencyKey` repetida → 200 con el mismo movimiento |
| POST | `/restaurant-supplies/:id/counts` | `inventory.manage` | `{ countedQuantity, notes?, idempotencyKey? }`. Calcula la diferencia y crea `COUNT_ADJUSTMENT_IN/OUT`. Sin diferencia → 200 con `movement: null` |
| GET | `/restaurant-supplies/:id/movements` | `miembro` | Historial paginado, del más reciente al más antiguo |
| GET | `/inventory-movements/:id` | `miembro` | Un movimiento |
| GET | `/inventory-movements?restaurantId=&supplyId=&type=&from=&to=` | `miembro` | 🆕 Movimientos de todo el stock de la sede, paginados y del más reciente al más antiguo. `supplyId` es el insumo maestro; `from`/`to` son fechas comerciales en la zona horaria de la sede |
| POST | `/inventory-movements/:id/reverse` | `inventory.manage` | `{ notes, idempotencyKey? }`. Crea un `REVERSAL` con el delta opuesto; el original no cambia. Se revierte una sola vez (409) y una reversión no se revierte (422) |

### 7.4 Recetas

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/product-recipes/:productId` | `miembro` | Insumos que consume una unidad del producto, con `effectiveQuantity` (incluye merma) |
| PUT | `/product-recipes/:productId/supplies/:supplyId` | `inventory.manage` | `{ quantityRequired, wastePercentage? }`: agrega o actualiza la línea. El insumo maestro debe ser de la misma organización que el producto |
| DELETE | `/product-recipes/:productId/supplies/:supplyId` | `inventory.manage` | Quita el insumo de la receta |

El consumo automático (descontar la receta al pasar un plato a `IN_PREPARATION`) está **apagado por defecto** (`INVENTORY_AUTO_CONSUMPTION=false`). Encendido, registra un `USAGE` idempotente por insumo; si falta stock consume lo disponible sin bloquear la cocina.

---

## 8. Finanzas

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/expense-categories` | `finance.manage` | Crea una categoría de gasto por organización |
| GET | `/expense-categories?organizationId=` | `finance.read` | Lista paginada |
| GET | `/expense-categories/:id` | `finance.read` | Una categoría |
| PATCH | `/expense-categories/:id` | `finance.manage` | Actualiza |
| DELETE | `/expense-categories/:id?moveTo=` | `finance.manage` | Baja lógica. Sin `moveTo`, los gastos pasados siguen apuntando a ella. 🆕 Con `moveTo`, todos sus gastos (también los anulados) pasan a esa otra categoría activa de la misma organización en la misma transacción; responde `{ id, movedExpenses }`. Destino igual o de otra organización → 400 `INVALID_EXPENSE_CATEGORY_MOVE`; inactivo → 422 |
| POST | `/expenses` | `finance.manage` | Registra un gasto a nombre del usuario de la sesión. La categoría debe ser de la organización de la sede |
| GET | `/expenses?restaurantId=&categoryId=&status=&from=&to=` | `finance.read` | Lista paginada |
| GET | `/expenses/:id` | `finance.read` | Un gasto |
| PATCH | `/expenses/:id` | `finance.manage` | Corrige un gasto; no si está anulado |
| POST | `/expenses/:id/void` | `finance.manage` | Anula (`VOIDED`): queda registrado pero deja de sumar. Los gastos no se borran |
| GET | `/daily-closures/preview?restaurantId=&businessDate=` | `finance.read` | Calcula las cifras del cierre sin guardarlo, en la zona horaria de la sede |
| POST | `/daily-closures` | `finance.manage` | Cierra el día: guarda una foto inmutable (atenciones por estado, ventas brutas y netas, reembolsos, gastos, efectivo esperado vs. contado, diferencia y desglose por método de pago). Un cierre por sede y fecha (409); no se cierran fechas futuras |
| GET | `/daily-closures?restaurantId=&from=&to=` | `finance.read` | Lista paginada |
| GET | `/daily-closures/:id` | `finance.read` | Un cierre con su desglose por método de pago |

---

### 8.1 Reportes 🆕

Fechas comerciales en la zona horaria de la sede, `from` y `to` obligatorios, máximo 366 días. Cada cifra significa lo mismo que en el cierre diario, así que un día de la serie coincide con el preview de ese día.

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/reports/daily-financials?restaurantId=&from=&to=` | `finance.read` | Un registro por día (con ceros si no hubo actividad): atenciones abiertas/cerradas/canceladas, ventas brutas, reembolsos, ventas netas, gastos, utilidad (ventas netas − gastos, sin costo de insumos ni de personal), ticket promedio y neto por método de pago. Más `totals` del periodo (su ticket promedio es el del periodo, no el promedio de los días) |
| GET | `/reports/metrics?restaurantId=&from=&to=&top=10` | `finance.read` | Totales del periodo, `topProducts` (ítems cobrables de atenciones no canceladas, por cantidad, con ingresos) y `stageTimes`: minutos promedio de espera (`SUBMITTED`→`IN_PREPARATION`), preparación (→`READY`), entrega (→`SERVED`) y total, medidos desde la primera vez que cada plato llegó a cada estado |

---

## 9. Observabilidad

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| GET | `/platform/error-logs?level=&requestId=&errorCode=&userId=&from=&to=` | `plataforma` | Errores registrados por el logger (tabla `error_logs`), del más reciente al más antiguo, paginados |
| GET | `/platform/error-logs/:id` | `plataforma` | Un error con su stack trace |

---

## 10. Archivos 🆕

| Método | Ruta | Acceso | Cómo funciona |
|---|---|---|---|
| POST | `/uploads/images?restaurantId=` | `catalog.manage` | `multipart/form-data` con el campo `file` (JPEG, PNG, WebP o AVIF; máximo 5 MB; SVG no). Guarda la imagen en `restaurants/<id>/images/<uuid>.<ext>` con un nombre aleatorio y responde `{ key, url }` para guardar la URL en el registro (p. ej. `imageUrl` del producto). `restaurantId` va en la query porque la autorización corre antes de leer el cuerpo. El almacenamiento se elige con `STORAGE_PROVIDER` (`aws` o `azure`; variables en `.env.example`); vacío → 503 `FILE_STORAGE_NOT_CONFIGURED` |

---

## Observaciones

1. **Prefijos inconsistentes**: `/api/v1/...` solo en auth y comensal; el resto en la raíz. Además, `/api/v1/owner/auth` también es el login del personal.
2. **Rutas que se superponen o están fuera de lugar**: `GET /payments/balance/:attentionId` se superpone con `GET /attentions/:id/bill`; `/attentions/orders/:orderId/*` opera sobre órdenes, no atenciones; la composición de un producto está repartida entre `/products/:id/ingredients` y `/product-recipes/:productId`.
3. **Webhook de pasarelas**: entra por una ruta `plataforma`, que una pasarela real no puede llamar. Falta el webhook público con firma.
4. **Sin endpoints todavía**: reembolsos (tablas modeladas) y borrado de cuenta del comensal.
5. **Consultas por elemento**: el plano de sala y "Mis visitas" calculan la cuenta de cada atención por separado (3 consultas por atención). Alcanza para decenas de atenciones activas; si el plano se vuelve lento, agrupar esas lecturas.
